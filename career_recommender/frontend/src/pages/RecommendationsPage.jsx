import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client, { getApiErrorMessage, getRecommendations } from "../api/client";
import { getCourseForSkill } from "../utils/courseLinks";

const ROLE_PRESETS = [
  "Backend Developer Intern",
  "Frontend Developer Intern",
  "Data Analyst Intern",
  "Machine Learning Intern",
];
const STATIC_PRIORITY_SKILL_LIMIT = 6;

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function courseFor(skill) {
  return getCourseForSkill(skill) || {
    provider: "Class Central",
    url: `https://www.classcentral.com/search?q=${encodeURIComponent(skill)}`,
    note: "Free course search results",
    tag: "Free course",
  };
}

function ProgressMetric({ label, value }) {
  const score = clampScore(value);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">{label}</span>
        <span className="text-xs font-bold text-blue-700">{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function SkillCourseRow({ skill, index }) {
  const course = courseFor(skill);
  const isCertificate = String(course.tag || course.note || "").toLowerCase().includes("certificate");

  return (
    <div
      className="grid min-h-[52px] gap-2 rounded-xl border border-rose-100 bg-rose-50/40 px-3 py-2 transition hover:border-rose-200 hover:bg-white sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-extrabold text-rose-600">
          {index}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-slate-950">{skill}</span>
          <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
            {course.provider} - {course.note}
          </span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
        <a
          href={course.url}
          target="_blank"
          rel="noreferrer"
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            isCertificate ? "bg-amber-100 text-amber-800" : "bg-amber-100 text-amber-800"
          } transition hover:bg-amber-200`}
        >
          {isCertificate ? "Free certificate" : "Free course"}
        </a>
      </div>
    </div>
  );
}

function OverallMissingSkillsPanel({ skills, limit = 6 }) {
  const visibleSkills = skills.slice(0, limit);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.24em] text-rose-600">
            Top {visibleSkills.length} missing skills
          </p>
          <h3 className="mt-1.5 text-xl font-bold text-slate-950">Top {visibleSkills.length} missing skills to learn next</h3>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            These are the highest-impact missing skills from your current recommendations.
          </p>
        </div>
        <div className="rounded-xl bg-rose-50 px-7 py-3 text-center">
          <p className="text-3xl font-bold text-rose-600">{visibleSkills.length}</p>
          <p className="mt-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.18em] text-rose-600">
            Priority skills
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {visibleSkills.map((skill, index) => (
          <SkillCourseRow key={skill} skill={skill} index={index + 1} />
        ))}
      </div>
    </section>
  );
}

function SkillCloudPanel({ title, tone = "green", skills = [] }) {
  const visibleSkills = skills.slice(0, 10);
  const toneClass =
    tone === "green"
      ? "text-emerald-700 bg-emerald-100"
      : "text-blue-700 bg-blue-100";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <p
        className={`font-mono text-[0.68rem] font-bold uppercase tracking-[0.24em] ${
          tone === "green" ? "text-emerald-700" : "text-blue-700"
        }`}
      >
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {visibleSkills.length ? (
          visibleSkills.map((skill) => (
            <span key={skill} className={`rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>
              {skill}
            </span>
          ))
        ) : (
          <p className="text-sm font-medium text-slate-500">Skills will appear after the first search.</p>
        )}
      </div>
    </section>
  );
}

function MissingSkillBadge({ skill }) {
  const course = courseFor(skill);

  return (
    <a
      href={course.url}
      target="_blank"
      rel="noreferrer"
      title={`${skill} - ${course.provider} - ${course.note}`}
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-700 transition hover:border-rose-300 hover:bg-white"
    >
      <span className="truncate">{skill}</span>
      <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
        {course.tag || "Free course"}
      </span>
    </a>
  );
}

function JobCard({ job, onSave, savingId }) {
  const missing = job.missing_skills || [];
  const matched = job.matched_skills || [];
  const jobId = job.external_job_id || job.job_id || `${job.company_name}-${job.job_title}`;

  return (
    <article className="rounded-2xl border border-rose-100 bg-[linear-gradient(180deg,#ffffff,#fff7f7)] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-xl font-bold leading-tight text-slate-950 sm:text-2xl">{job.job_title}</h3>
          <p className="mt-2 text-base font-semibold text-slate-600">
            {job.company_name || "Company"} {job.location ? `- ${job.location}` : ""}
          </p>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {job.employment_type || "Role"} - {job.apply_provider || job.source || "Official careers portal"}
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white">
          {missing.length} gaps
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ProgressMetric label="AI score" value={job.ai_score} />
        <ProgressMetric label="Job readiness score" value={job.job_readiness_score} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(job.is_direct_apply || job.apply_link_verified) && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
            Official company careers portal
          </span>
        )}
        {matched.slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-full bg-lime-100 px-3 py-1 text-sm font-bold text-lime-800">
            {skill}
          </span>
        ))}
        {missing.length > 0 && (
          <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-700">
            {missing.length} missing skills
          </span>
        )}
      </div>

      <section className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/60 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-rose-600">
              Priority skill gaps
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Missing skills for {job.job_title}.
            </p>
          </div>
          <span className="text-sm font-bold text-rose-600">{missing.length} total</span>
        </div>
        {missing.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {missing.map((skill) => (
              <MissingSkillBadge key={`${jobId}-${skill}`} skill={skill} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-white px-3 py-3 text-sm font-semibold text-emerald-800">
            No priority gaps found for this role.
          </div>
        )}
      </section>

      <div className="mt-4 rounded-xl border border-rose-100 bg-white/80 px-3 py-3">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          Description
        </p>
        <p className="mt-2 line-clamp-3 text-base leading-7 text-slate-700">
          {job.job_summary || job.job_description || `${job.company_name || "This company"} is a suitable target for ${job.job_title}. Check current openings on the official careers portal.`}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.apply_link ? (
          <a href={job.apply_link} target="_blank" rel="noreferrer" className="primary-button rounded-xl px-4 py-2">
            Apply now
          </a>
        ) : (
          <button type="button" className="primary-button rounded-xl px-4 py-2" disabled>
            Apply now
          </button>
        )}
        <button
          type="button"
          onClick={() => onSave(job)}
          disabled={savingId === jobId}
          className="secondary-button rounded-xl px-4 py-2"
        >
          {savingId === jobId ? "Saving..." : "Save to tracker"}
        </button>
      </div>
    </article>
  );
}

function CompanyCard({ company }) {
  const name = company.company_name || company.name || company.company || "Company";
  const recentRole = company.recent_role || company.role || company.job_title || "Closest matching role";
  const roleFit = clampScore(company.role_fit || company.match_score || company.score || 79);
  const location = company.location || company.preferred_location || "India";
  const url = company.careers_url || company.company_website || company.url;

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-base font-bold text-slate-950">{name}</h4>
          <p className="mt-1 text-sm font-medium text-slate-600">Vacancies: Official careers portal</p>
        </div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white"
          >
            Official site
          </a>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white">
            Official site
          </span>
        )}
      </div>
      <dl className="mt-3 space-y-1 text-sm font-medium text-slate-500">
        <div>Role fit: {roleFit}%</div>
        <div>Location: {location}</div>
        <div>Recent role: {recentRole}</div>
      </dl>
      <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
        Location match
      </p>
      <p className="mt-1 text-sm font-semibold text-emerald-700">Official company careers portal.</p>
    </article>
  );
}

export default function RecommendationsPage() {
  const [desiredRole, setDesiredRole] = useState("Backend Developer Intern");
  const [location, setLocation] = useState("India");
  const [mode, setMode] = useState("internship");
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");

  const jobs = bundle?.jobs || [];
  const missingSkills = bundle?.missing_skills || [];
  const matchedSkills = bundle?.matched_skills || [];
  const trendingSkills = bundle?.trending_skills || [];
  const topCompanies = bundle?.top_companies || [];

  const stats = useMemo(() => {
    const averageAi = jobs.length
      ? Math.round(jobs.reduce((sum, job) => sum + Number(job.ai_score || 0), 0) / jobs.length)
      : 0;
    const averageReadiness = jobs.length
      ? Math.round(jobs.reduce((sum, job) => sum + Number(job.job_readiness_score || 0), 0) / jobs.length)
      : 0;

    return {
      averageAi,
      averageReadiness,
      missingCount: missingSkills.length,
      matchedCount: matchedSkills.length,
    };
  }, [jobs, matchedSkills.length, missingSkills.length]);

  const loadRecommendations = async ({ signal } = {}) => {
    if (!desiredRole.trim()) {
      setMessage("Enter a desired role to check your missing skills.");
      return;
    }

    setLoading(true);
    try {
      const data = await getRecommendations(
        { mode, query: desiredRole, location },
        { signal }
      );
      setBundle(data);
      setMessage(data.job_feed_message || "");
    } catch (error) {
      if (error.name !== "CanceledError") {
        setMessage(getApiErrorMessage(error, "Unable to load recommendations."));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadRecommendations({ signal: controller.signal });
    return () => controller.abort();
  }, []);

  const saveJob = async (job) => {
    const jobId = job.external_job_id || job.job_id || `${job.company_name}-${job.job_title}`;
    setSavingId(jobId);
    try {
      await client.post("/bookmark/save", {
        external_job_id: String(jobId),
        job_title: job.job_title,
        company_name: job.company_name,
        location: job.location,
        employment_type: job.employment_type,
        posted_date: job.posted_date,
        apply_link: job.apply_link,
        description: job.job_description || job.job_summary,
        ai_score: Number(job.ai_score || 0),
        readiness_score: Number(job.job_readiness_score || 0),
        is_potential_scam: Boolean(job.is_potential_scam),
        scam_reasons: job.scam_reasons || [],
        raw_job: job,
      });
      setMessage("Saved to tracker.");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Unable to save this job."));
    } finally {
      setSavingId("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    loadRecommendations();
  };

  return (
    <div className="mx-auto max-w-[1760px] space-y-4 font-sans">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)] lg:p-5">
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(520px,0.9fr)] 2xl:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.32em] text-slate-500">
              Recommendations
            </p>
            <h2 className="mt-2 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
              Top AI-ranked roles for your profile
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
              Searching in <span className="font-bold text-slate-900">{location || "your location"}</span> for{" "}
              <span className="font-bold text-slate-900">{mode}</span> opportunities matching{" "}
              <span className="font-bold text-slate-900">{desiredRole || "your desired role"}</span>.
            </p>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
              Results prioritize your chosen location first. If there are not enough company matches,
              the remaining companies are ordered by role relevance.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(140px,0.7fr)_140px_100px_auto] xl:gap-3">
            <label>
              <span className="sr-only">Desired role</span>
              <input
                value={desiredRole}
                onChange={(event) => setDesiredRole(event.target.value)}
                className="field-input rounded-xl text-base"
                placeholder="Backend Developer"
              />
            </label>
            <label>
              <span className="sr-only">Location</span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="field-input rounded-xl text-base"
                placeholder="chennai"
              />
            </label>
            <label>
              <span className="sr-only">Mode</span>
              <select value={mode} onChange={(event) => setMode(event.target.value)} className="field-input rounded-xl text-base">
                <option value="internship">Internship</option>
                <option value="job">Job</option>
              </select>
            </label>
            <div
              className="field-input flex items-center rounded-xl text-base"
              aria-label={`Top skills count ${STATIC_PRIORITY_SKILL_LIMIT}`}
            >
              {STATIC_PRIORITY_SKILL_LIMIT}
            </div>
            <button type="submit" className="primary-button rounded-xl px-5 py-3" disabled={loading}>
              {loading ? "Checking..." : "Refresh"}
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ROLE_PRESETS.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setDesiredRole(role)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              {role}
            </button>
          ))}
        </div>

        {message && (
          <p className="mt-4 rounded-xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-sm font-medium text-orange-700">
            {message}
          </p>
        )}
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        {missingSkills.length > 0 && (
          <OverallMissingSkillsPanel skills={missingSkills} limit={STATIC_PRIORITY_SKILL_LIMIT} />
        )}

        <div className="space-y-4">
          <SkillCloudPanel title="Matched skills" tone="green" skills={matchedSkills} />
          <SkillCloudPanel title="Trending skills" tone="blue" skills={trendingSkills} />
        </div>
      </section>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="space-y-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-base font-semibold text-slate-500">
              Finding role matches and checking skill gaps...
            </div>
          ) : jobs.length ? (
            jobs.map((job) => (
              <JobCard
                key={job.external_job_id || `${job.company_name}-${job.job_title}`}
                job={job}
                onSave={saveJob}
                savingId={savingId}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-xl font-bold text-slate-950">No recommendations yet</p>
              <p className="mt-2 text-base text-slate-600">
                Enter a desired role and check skills to generate recommendations.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-4 2xl:sticky 2xl:top-4 2xl:self-start">
          <section className="rounded-2xl border border-rose-100 bg-[linear-gradient(180deg,#ffffff,#fff7f7)] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Top 20 companies hiring
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Location matches appear first, then closest role matches.
                </p>
              </div>
              <div className="rounded-xl bg-slate-100 px-4 py-3 text-center">
                <p className="text-xl font-bold text-slate-950">{topCompanies.length || 20}</p>
                <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Companies
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {topCompanies.length ? (
                topCompanies.slice(0, 20).map((company, index) => (
                  <CompanyCard key={`${company.company_name || company.name}-${index}`} company={company} />
                ))
              ) : (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600">
                  Company matches will appear after the first search.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-rose-100 bg-[linear-gradient(180deg,#ffffff,#fff7f7)] p-4">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-tide">
              Next action
            </p>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Start with the first missing skill that appears in multiple roles, then save your best
              match to track the application.
            </p>
            <Link to="/bookmarks" className="secondary-button mt-4 w-full rounded-xl px-4 py-2">
              Open tracker
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
