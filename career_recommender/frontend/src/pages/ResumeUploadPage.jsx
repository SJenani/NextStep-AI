import { useEffect, useState } from "react";
import client from "../api/client";
import { ResumeSkeleton } from "../components/skeletons/PageSkeleton";

function ScoreCard({ label, value, tone, showMax = true }) {
  const tones = {
    slate: "bg-slate-100 text-slate-900",
    blue: "bg-blue-100 text-blue-900",
    emerald: "bg-emerald-100 text-emerald-900",
    amber: "bg-amber-100 text-amber-900",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-3xl font-bold text-slate-950">{Math.round(value)}</p>
        {showMax && <span className={`muted-chip ${tones[tone] || tones.slate}`}>/ 100</span>}
      </div>
    </div>
  );
}

function FileSummary({ label, file, multiple = false, onChange }) {
  return (
    <div className="space-y-2">
      <label className="field-label">{label}</label>
      <input
        type="file"
        accept="application/pdf"
        multiple={multiple}
        onChange={onChange}
        className="field-input"
      />
      {multiple ? (
        file?.length ? <p className="text-xs text-slate-500">{file.length} certificate PDF(s) selected</p> : null
      ) : (
        file ? <p className="text-xs text-slate-500">{file.name}</p> : null
      )}
    </div>
  );
}

function ChipCloud({ title, tone, items, emptyText }) {
  const styles = {
    emerald: "accent-chip border-emerald-200 bg-emerald-50 text-emerald-900",
    rose: "accent-chip border-rose-200 bg-rose-50 text-rose-900",
    blue: "accent-chip border-blue-200 bg-blue-50 text-blue-900",
    amber: "accent-chip border-amber-200 bg-amber-50 text-amber-900",
    slate: "accent-chip",
  };

  return (
    <div className="card-panel">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">{title}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {items?.length ? (
          items.map((item) => (
            <span key={`${title}-${item}`} className={styles[tone] || styles.slate}>
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-500">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

export default function ResumeUploadPage() {
  const [resumeFile, setResumeFile] = useState(null);
  const [linkedinFile, setLinkedinFile] = useState(null);
  const [certificateFiles, setCertificateFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [audit, setAudit] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [message, setMessage] = useState("");
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setLoading(true);
      try {
        const { data } = await client.get("/profile/view");
        if (!ignore) {
          setTargetRole(data.desired_role || "");
        }
      } catch {
        // Upload still works without an existing profile.
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <ResumeSkeleton />;
  }

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!resumeFile && !linkedinFile && !certificateFiles.length) {
      setMessage("Upload at least one PDF: resume, LinkedIn PDF, or certificate.");
      return;
    }

    const formData = new FormData();
    if (resumeFile) {
      formData.append("resume", resumeFile);
    }
    if (linkedinFile) {
      formData.append("linkedin_pdf", linkedinFile);
    }
    certificateFiles.forEach((file) => {
      formData.append("certificates", file);
    });

    try {
      setLoadingAudit(true);
      const { data } = await client.post("/resume/upload?auto_fill=true", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      setAudit(data.resume_audit || null);
      if (!targetRole && data.resume_audit?.target_role) {
        setTargetRole(data.resume_audit.target_role);
      }
      setMessage("Documents analyzed, structured profile draft created, skills updated, and ATS audit generated.");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Document analysis failed.");
    } finally {
      setLoadingAudit(false);
    }
  };

  const refreshAudit = async () => {
    try {
      setLoadingAudit(true);
      const params = {};
      if (targetRole.trim()) {
        params.role = targetRole.trim();
      }
      const { data } = await client.get("/resume/audit", { params });
      setAudit(data);
      setMessage("ATS audit refreshed for the selected target role.");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Unable to refresh ATS audit.");
} finally {
      setLoadingAudit(false);
    }
  };

  const structured = result?.structured_profile;

  return (
    <section className="space-y-6">
      <div className="card-panel">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">Instant Profile Builder</p>
        <h2 className="mt-3 font-display text-4xl font-bold text-slate-950">Upload resume, LinkedIn PDF, and certificates to build your profile faster</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
          The analyzer reads your documents, extracts skills, tools, projects, and experience highlights, then builds a structured profile
          draft that improves recommendation quality and ATS coaching.
        </p>

        <form onSubmit={handleUpload} className="mt-8 space-y-5">
          <div className="grid gap-4 xl:grid-cols-3">
            <FileSummary label="Resume PDF" file={resumeFile} onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
            <FileSummary label="LinkedIn PDF" file={linkedinFile} onChange={(e) => setLinkedinFile(e.target.files?.[0] || null)} />
            <FileSummary
              label="Certificates PDFs"
              file={certificateFiles}
              multiple
              onChange={(e) => setCertificateFiles(Array.from(e.target.files || []))}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_auto_auto]">
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Target role, e.g. Data Analyst Intern"
              className="field-input"
            />
            <button type="submit" className="primary-button" disabled={loadingAudit}>
              {loadingAudit ? "Analyzing..." : "Build profile"}
            </button>
            <button type="button" className="secondary-button" onClick={refreshAudit} disabled={loadingAudit}>
              Refresh audit
            </button>
          </div>
        </form>

        {message && <p className="mt-4 text-sm font-semibold text-slate-600">{message}</p>}
      </div>

      {structured && (
        <>
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="card-panel">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">Structured Profile Draft</p>
              <h3 className="mt-3 text-4xl font-bold text-slate-950">What the system built from your documents</h3>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ScoreCard label="Skills Found" value={structured.skills.length} tone="blue" showMax={false} />
                <ScoreCard label="Tools Found" value={structured.tools.length} tone="emerald" showMax={false} />
                <ScoreCard label="Projects Found" value={structured.projects.length} tone="amber" showMax={false} />
                <ScoreCard label="Experience Years" value={structured.years_of_experience} tone="slate" showMax={false} />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Suggested Domain</p>
                  <p className="mt-3 text-xl font-bold text-slate-950">{structured.suggested_domain || "Technology"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Experience Level</p>
                  <p className="mt-3 text-xl font-bold capitalize text-slate-950">{structured.experience_level}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Documents Used</p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">{structured.source_documents.join(", ") || "No documents detected"}</p>
                </div>
              </div>
            </div>

            <div className="card-panel">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">Auto-Filled Snapshot</p>
              <div className="mt-4 space-y-3">
                {[
                  ["Role Target", result.auto_filled_profile.desired_role || "No role inferred yet"],
                  ["Domain", result.auto_filled_profile.domain || "No domain inferred yet"],
                  ["Experience Level", result.auto_filled_profile.experience_level || "student"],
                  ["Years of Experience", result.auto_filled_profile.years_of_experience ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChipCloud title="Extracted Skills" tone="blue" items={structured.skills} emptyText="No skills extracted yet." />
            <ChipCloud title="Detected Tools" tone="emerald" items={structured.tools} emptyText="No tools extracted yet." />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-panel">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">Projects</p>
              <div className="mt-4 space-y-3">
                {structured.projects.length ? (
                  structured.projects.map((project) => (
                    <div key={project} className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-7 text-slate-700">
                      {project}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No project titles or project bullets were extracted.</p>
                )}
              </div>
            </div>

            <div className="card-panel">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">Experience Highlights</p>
              <div className="mt-4 space-y-3">
                {structured.experience_highlights.length ? (
                  structured.experience_highlights.map((item) => (
                    <div key={item} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-slate-700">
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No work-experience highlights were extracted.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <ChipCloud title="Certificates" tone="amber" items={structured.certificates} emptyText="No certificate names detected yet." />

            <div className="card-panel">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">Document Breakdown</p>
              <div className="mt-4 grid gap-4">
                {result.documents.map((document) => (
                  <div key={`${document.document_type}-${document.filename}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">{document.filename}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{document.document_type}</p>
                      </div>
                      <span className="muted-chip bg-slate-900 text-white">{document.extracted_skills.length} skills</span>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-600">{document.extracted_text_preview || "No text extracted."}</p>

                    {document.detected_projects?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {document.detected_projects.map((project) => (
                          <span key={`${document.filename}-${project}`} className="accent-chip border-blue-200 bg-blue-50 text-blue-900">
                            {project}
                          </span>
                        ))}
                      </div>
                    )}

                    {document.detected_certificates?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {document.detected_certificates.map((certificate) => (
                          <span key={`${document.filename}-${certificate}`} className="accent-chip border-amber-200 bg-amber-50 text-amber-900">
                            {certificate}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {audit && (
        <>
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="card-panel">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">ATS Score</p>
              <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-5xl font-bold text-slate-950">{Math.round(audit.overall_score)}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Resume fit for <span className="font-semibold">{audit.target_role}</span>
                  </p>
                </div>
                <p className="max-w-xl text-sm leading-7 text-slate-600">{audit.suggested_summary}</p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ScoreCard label="Keyword Match" value={audit.keyword_match_score} tone="blue" />
                <ScoreCard label="Role Alignment" value={audit.role_alignment_score} tone="emerald" />
                <ScoreCard label="Resume Strength" value={audit.resume_strength_score} tone="amber" />
                <ScoreCard label="Market Readiness" value={audit.market_readiness_score} tone="slate" />
              </div>
            </div>

            <div className="card-panel">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">Action Plan</p>
              <div className="mt-4 space-y-3">
                {audit.improvement_tips.map((tip) => (
                  <div key={tip} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-slate-700">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChipCloud
              title="Matched Keywords"
              tone="emerald"
              items={audit.matched_keywords}
              emptyText="No strong role keywords detected yet."
            />
            <ChipCloud
              title="Missing Market Keywords"
              tone="rose"
              items={audit.missing_keywords}
              emptyText="Your documents already cover the strongest recurring keywords from the current role set."
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="card-panel">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">Section Checks</p>
              <div className="mt-4 space-y-3">
                {audit.section_checks.map((section) => (
                  <div key={section.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{section.title}</p>
                      <span className={`muted-chip ${section.present ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>
                        {section.present ? "Present" : "Missing"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{section.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-panel">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">Recommended Projects</p>
              <div className="mt-4 space-y-3">
                {audit.recommended_projects.map((project) => (
                  <div key={`${project.level}-${project.title}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-900">{project.title}</p>
                      <span className="muted-chip bg-slate-900 text-white">{project.level}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{project.summary}</p>
                    {project.skills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.skills.map((skill) => (
                          <span key={`${project.title}-${skill}`} className="accent-chip">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

