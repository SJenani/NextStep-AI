from __future__ import annotations
import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)

def _skill_gap_score(user_skills, job_skills):
    if not job_skills:
        return 1.0, []
    user_set = {s.lower().strip() for s in user_skills}
    job_set = {s.lower().strip() for s in job_skills}
    missing = [s for s in job_skills if s.lower().strip() not in user_set]
    return len(user_set & job_set) / len(job_set), missing

def _freshness_boost(posted_at_ts, max_age_days=30):
    age_days = (time.time() - posted_at_ts) / 86400
    return max(0.0, 1.0 - age_days / max_age_days)

def _hybrid_score(semantic_sim, skill_match, freshness, weights=None):
    if weights is None:
        weights = {"semantic": 0.4, "skill": 0.45, "freshness": 0.15}
    return weights["semantic"] * semantic_sim + weights["skill"] * skill_match + weights["freshness"] * freshness

class SemanticRecommender:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self._vectorizer = None
        self._matrix = None
        self._metadata = []
        logger.info("SemanticRecommender: TF-IDF backend (low-memory mode)")

    def fit(self, jobs):
        if not jobs:
            self._vectorizer = None
            self._matrix = None
            self._metadata = []
            return
        from sklearn.feature_extraction.text import TfidfVectorizer
        texts = []
        self._metadata = []
        for job in jobs:
            text = " ".join(str(job.get(k, "")) for k in ("title", "description", "company", "location")).strip()
            if not text:
                text = str(job.get("id", "unknown"))
            texts.append(text)
            self._metadata.append(dict(job))
        self._vectorizer = TfidfVectorizer(max_features=20000, sublinear_tf=True, stop_words="english")
        self._matrix = self._vectorizer.fit_transform(texts)
        logger.info("TF-IDF index built: %d documents", len(texts))

    def recommend(self, user_text, top_k=10, location=None, remote_only=False, user_skills=None, min_match=0.0):
        if self._vectorizer is None or self._matrix is None or not self._metadata:
            return []
        if user_skills is None:
            user_skills = [s.strip() for s in user_text.split(",") if s.strip()]
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np
        user_vec = self._vectorizer.transform([user_text])
        scores = cosine_similarity(user_vec, self._matrix).flatten()
        search_k = min(top_k * 3, len(self._metadata))
        top_indices = np.argsort(scores)[::-1][:search_k]
        results = []
        for idx in top_indices:
            sem_score = float(scores[idx])
            job = self._metadata[idx]
            if location and location.lower() not in str(job.get("location", "")).lower():
                continue
            if remote_only and not job.get("is_remote", False):
                continue
            job_skills = job.get("skills", [])
            if isinstance(job_skills, str):
                job_skills = [s.strip() for s in job_skills.split(",") if s.strip()]
            skill_match, missing = _skill_gap_score(user_skills, job_skills)
            posted_at = job.get("posted_at", time.time())
            if isinstance(posted_at, str):
                try:
                    from datetime import datetime
                    posted_at = datetime.fromisoformat(posted_at.replace("Z", "+00:00")).timestamp()
                except Exception:
                    posted_at = time.time()
            fresh = _freshness_boost(float(posted_at))
            score = _hybrid_score(sem_score, skill_match, fresh)
            if score < min_match:
                continue
            results.append({
                "job_id": str(job.get("id", idx)),
                "title": job.get("title", "Untitled"),
                "company": job.get("company", "Unknown"),
                "location": job.get("location", ""),
                "salary_range": job.get("salary_range"),
                "apply_url": job.get("apply_url", ""),
                "match_score": round(score, 3),
                "missing_skills": missing[:5],
                "freshness_score": round(fresh, 3),
                "source": job.get("source", "unknown"),
            })
        results.sort(key=lambda j: j["match_score"], reverse=True)
        return results[:top_k]
