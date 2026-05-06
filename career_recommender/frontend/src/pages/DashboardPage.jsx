
import { useEffect, useState } from "react";
import client from "../api/client";
import { DashboardSkeleton } from "../components/skeletons/PageSkeleton";
import { getCourseForSkill } from "../utils/courseLinks";

function buildRequiredLearningPlatforms(missingSkills = [], quickWins = []) {
  const prioritySkills = Array.from(new Set([
    ...missingSkills,
    ...quickWins.map((item) => item?.skill).filter(Boolean),
  ].filter(Boolean)));

  return prioritySkills.slice(0, 4).map((skill) => {
    const course = getCourseForSkill(skill);
    return {
      name: course?.provider || "Guided course",
      skill,
      focus: course?.note || "Focused course for this gap",
      pace: course?.tag || "Required resource",
      url: course?.url || `https://www.classcentral.com/search?q=${encodeURIComponent(skill)}`,
    };
  });
}

function toneForGap(gapLevel) {
  if (gapLevel >= 40) {
    return {
      badge: "bg-rose-100 text-rose-900",
      border: "border-rose-200",
      panel: "bg-rose-50/70",
      label: "High priority gap",
    };
  }
  if (gapLevel >= 24) {
    return {
      badge: "bg-amber-100 text-amber-900",
      border: "border-amber-200",
      panel: "bg-amber-50/70",
      label: "Medium gap",
    };
  }
  return {
    badge: "bg-emerald-100 text-emerald-900",
    border: "border-emerald-200",
    panel: "bg-emerald-50/70",
    label: "Low gap",
  };
}

function StatGlyph({ tone }) {
  const paths = {
    blue: "M5 12h14M12 5v14",
    rose: "M5 15l4-4 3 3 7-7",
    emerald: "M6 12.5l4 4 8-9",
    slate: "M6 17V7m6 10V4m6 13v-7",
  };

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[tone] || paths.slate} />
    </svg>
  );
}

function StatCard({ label, value, tone = "slate", note }) {
  const styles = {
    slate: {
      panel: "border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] text-slate-900",
      icon: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
      eyebrow: "text-slate-500",
      note: "text-slate-600",
      metric: "text-slate-950",
      track: "bg-slate-100",
      fill: "bg-slate-400",
      glow: "bg-slate-100/70",
    },
    blue: {
      panel: "border-blue-200 bg-[linear-gradient(180deg,#ffffff,#eff6ff)] text-slate-900",
      icon: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
      eyebrow: "text-blue-700",
      note: "text-slate-600",
      metric: "text-slate-950",
      track: "bg-blue-100",
      fill: "bg-blue-500",
      glow: "bg-blue-100/80",
    },
    rose: {
      panel: "border-rose-200 bg-[linear-gradient(180deg,#ffffff,#fff1f2)] text-slate-900",
      icon: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
      eyebrow: "text-rose-700",
      note: "text-slate-600",
      metric: "text-slate-950",
      track: "bg-rose-100",
      fill: "bg-orange-500",
      glow: "bg-rose-100/80",
    },
    emerald: {
      panel: "border-emerald-200 bg-[linear-gradient(180deg,#ffffff,#ecfdf5)] text-slate-900",
      icon: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
      eyebrow: "text-emerald-700",
      note: "text-slate-600",
      metric: "text-slate-950",
      track: "bg-emerald-100",
      fill: "bg-emerald-500",
      glow: "bg-emerald-100/80",
    },
  };
  const selected = styles[tone] || styles.slate;

  return (
    <article className={`relative overflow-hidden rounded-[20px] border p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)] ${selected.panel}`}>
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${selected.glow}`} />

      <div className="relative flex h-full min-h-[122px] flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${selected.eyebrow}`}>{label}</p>
            <p className={`mt-2 max-w-[16rem] text-xs leading-5 ${selected.note}`}>{note}</p>
          </div>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] ${selected.icon}`}>
            <StatGlyph tone={tone} />
          </div>
        </div>

        <div className="mt-4">
          <p className={`text-[2.25rem] font-bold tracking-[-0.04em] ${selected.metric}`}>{value}</p>
          <div className={`mt-3 h-2 overflow-hidden rounded-full ${selected.track}`}>
            <div className={`h-full w-[58%] rounded-full ${selected.fill}`} />
          </div>
        </div>
      </div>
    </article>
  );
}

function SkillPill({ skill, className = "accent-chip" }) {
  const course = getCourseForSkill(skill);
  const content = <span className={className}>{skill}</span>;

  if (!course) {
    return content;
  }

  return (
    <a href={course.url} target="_blank" rel="noreferrer" title={`${skill} - ${course.provider} - ${course.note}`}>
      {content}
    </a>
  );
}

function FamilyGapCard({ family }) {
  const tone = toneForGap(family.gap_level);

  return (
    <article className={`rounded-[22px] border ${tone.border} bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[1.45rem] font-bold tracking-[-0.02em] text-slate-950">{family.family}</p>
            <span className={`muted-chip ${tone.badge}`}>{tone.label}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{family.summary}</p>
        </div>

        <div className={`rounded-[20px] border ${tone.border} ${tone.panel} px-4 py-3 text-center lg:min-w-[140px]`}>
          <div className="text-2xl font-bold tracking-[-0.03em] text-slate-950">{Math.round(family.gap_level)}%</div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Gap level</div>
        </div>
      </div>

      <div className="mt-5 rounded-[20px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
          <span className="text-slate-500">
            Your current strength <span className="text-blue-600">{Math.round(family.current_level)}%</span>
          </span>
          <span className="text-slate-500">
            What matching jobs expect <span className="text-slate-900">{Math.round(family.target_level)}%</span>
          </span>
        </div>
        <div className="mt-4 relative h-5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
            style={{ width: `${family.current_level}%` }}
          />
          {family.gap_level > 0 && (
            <div
              className="absolute inset-y-0 rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
              style={{ left: `${family.current_level}%`, width: `${family.gap_level}%` }}
            />
          )}
        </div>
        <div className="mt-4 grid gap-3 text-sm text-slate-500 sm:grid-cols-3">
          <div className="rounded-[16px] bg-slate-50 px-3 py-2.5">
            <span className="font-semibold text-slate-900">{family.strength_count}</span> current micro-skills
          </div>
          <div className="rounded-[16px] bg-slate-50 px-3 py-2.5">
            <span className="font-semibold text-slate-900">{family.gap_count}</span> missing micro-skills
          </div>
          <div className="rounded-[16px] bg-slate-50 px-3 py-2.5">
            <span className="font-semibold text-slate-900">{family.demand_count}</span> job demand signals
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-3">
        <div className="rounded-[18px] border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">You Already Have</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {family.matched_micro_skills.length ? (
              family.matched_micro_skills.map((skill) => (
                <SkillPill key={`${family.family}-matched-${skill}`} skill={skill} className="muted-chip bg-emerald-100 text-emerald-900" />
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-600">No clear signals yet in this family.</p>
            )}
          </div>
        </div>

        <div className="rounded-[18px] border border-rose-200 bg-rose-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Missing Micro-Skills</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {family.missing_micro_skills.length ? (
              family.missing_micro_skills.map((skill) => (
                <SkillPill key={`${family.family}-missing-${skill}`} skill={skill} className="muted-chip bg-rose-100 text-rose-900" />
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-600">This family is already in good shape.</p>
            )}
          </div>
        </div>

        <div className="rounded-[18px] border border-blue-200 bg-blue-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Learn Next</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {family.adjacent_next_skills.length ? (
              family.adjacent_next_skills.map((skill) => (
                <SkillPill key={`${family.family}-next-${skill}`} skill={skill} className="muted-chip bg-blue-100 text-blue-900" />
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-600">No adjacent suggestions yet for this family.</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function LearningPlatformsPanel({ missingSkills, quickWins }) {
  const requiredPlatforms = buildRequiredLearningPlatforms(missingSkills, quickWins);

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">Efficient Learning Courses</p>
      <h3 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-slate-950">Required platform for each gap</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Suggested from your current missing skills, with one focused resource per priority gap.
      </p>

      <div className="mt-4 grid gap-3">
        {requiredPlatforms.length ? (
          requiredPlatforms.map((platform, index) => (
            <a
              key={`${platform.name}-${platform.skill}`}
              href={platform.url}
              target="_blank"
              rel="noreferrer"
              className="group rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.9))] p-3.5 transition hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-[0_14px_28px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-950 group-hover:text-blue-800">{platform.name}</span>
                    <span className="muted-chip bg-blue-100 text-blue-900">{platform.pace}</span>
                  </span>
                  <span className="mt-1.5 block text-sm leading-5 text-slate-600">
                    Learn {platform.skill} - {platform.focus}
                  </span>
                </span>
              </div>
            </a>
          ))
        ) : (
          <p className="rounded-[18px] border border-slate-200 bg-slate-50 p-3.5 text-sm leading-6 text-slate-600">
            No required platform is available yet because no missing-skill data was found.
          </p>
        )}
      </div>
    </section>
  );
}

function QuickWinPanel({ quickWins }) {
  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-blue-600">Quick Win Micro-Skills</p>
      <h3 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-slate-950">Fastest skills to unlock next</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Each demand score shows how often that skill is showing up across your current missing-skill and trending-skill analysis.
      </p>
      <div className="mt-4 space-y-3">
        {quickWins.length ? (
          quickWins.map((item, index) => (
            <div key={`${item.family}-${item.skill}`} className="rounded-[18px] border border-blue-100 bg-[linear-gradient(180deg,rgba(239,246,255,0.82),rgba(255,255,255,0.98))] p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-blue-700 ring-1 ring-blue-200">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-950">{item.skill}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.note}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{item.family}</p>
                  </div>
                </div>
                <span className="muted-chip bg-white text-blue-900 ring-1 ring-blue-200">{item.demand_count} demand signals</span>
              </div>
              {item.unlocked_by.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.unlocked_by.map((skill) => (
                    <span key={`${item.skill}-${skill}`} className="muted-chip bg-white text-slate-700 ring-1 ring-slate-200">
                      unlocked by {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-slate-600">Add a few profile skills first so the page can suggest the nearest next micro-skills.</p>
        )}
      </div>
    </section>
  );
}

function SkillChipPanel({ title, subtitle, tone, values }) {
  const styles = {
    emerald: {
      label: "text-emerald-700",
      chip: "muted-chip bg-emerald-100 text-emerald-900",
    },
    rose: {
      label: "text-rose-700",
      chip: "muted-chip bg-rose-100 text-rose-900",
    },
    blue: {
      label: "text-blue-700",
      chip: "muted-chip bg-blue-100 text-blue-900",
    },
  };
  const selected = styles[tone] || styles.blue;

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className={`font-mono text-xs uppercase tracking-[0.25em] ${selected.label}`}>{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {values.length ? (
          values.map((skill) => <SkillPill key={`${title}-${skill}`} skill={skill} className={selected.chip} />)
        ) : (
          <p className="text-sm text-slate-500">No strong signals yet.</p>
        )}
      </div>
    </section>
  );
}

function DnaMetricCard({ value, label, tone = "emerald" }) {
  const tones = {
    emerald: "from-emerald-50 to-white text-emerald-700 border-emerald-200",
    amber: "from-amber-50 to-white text-amber-700 border-amber-200",
    orange: "from-orange-50 to-white text-orange-700 border-orange-200",
  };

  return (
    <div className={`rounded-[18px] border bg-gradient-to-br px-4 py-4 text-center shadow-[0_14px_30px_rgba(15,23,42,0.05)] ${tones[tone] || tones.emerald}`}>
      <p className="text-[2.2rem] font-bold tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}

function GeneRow({ gene, side = "user" }) {
  const styles = {
    used: {
      dot: "bg-emerald-400",
      chip: "bg-emerald-50 text-emerald-800",
    },
    not_required: {
      dot: "bg-slate-500",
      chip: "bg-slate-700/70 text-slate-200",
    },
    matched: {
      dot: "bg-emerald-400",
      chip: "bg-emerald-50 text-emerald-800",
    },
    partial: {
      dot: "bg-amber-500",
      chip: "bg-amber-50 text-amber-900",
    },
    missing: {
      dot: "bg-orange-500",
      chip: "bg-orange-50 text-orange-900",
    },
  };
  const selected = styles[gene.status] || styles.not_required;

  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-slate-200 bg-white px-3.5 py-3 shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`h-3.5 w-3.5 shrink-0 rounded-full ${selected.dot}`} />
        <p className="truncate text-base font-semibold text-slate-900">{gene.skill}</p>
      </div>
      <span className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ${selected.chip}`}>
        {gene.label || (side === "user" ? "Used" : "Required")}
      </span>
    </div>
  );
}

function SkillDnaSection({ profiles, selectedId, onSelect }) {
  if (!profiles.length) {
    return null;
  }

  const activeProfile = profiles.find((profile) => profile.id === selectedId) || profiles[0];

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.98))] p-5 text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="text-[1.7rem] font-bold leading-tight tracking-[-0.03em] text-white">Skill Gap DNA — Visual Career Genome</h3>
          <p className="mt-2 text-xl font-bold tracking-[-0.02em] text-white">Your skill genome</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Each circle is a "gene" — a skill. See how your DNA matches job requirements.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {profiles.map((profile) => {
            const label = profile.company_name ? `${profile.role_title} - ${profile.company_name}` : profile.role_title;
            const isActive = activeProfile.id === profile.id;

            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelect(profile.id)}
                className={`rounded-[14px] border px-4 py-2.5 text-left text-sm font-semibold transition ${
                  isActive
                    ? "border-slate-500 bg-[#2a2a28] text-white"
                    : "border-white/10 bg-transparent text-slate-200 hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <DnaMetricCard value={activeProfile.matched_count} label="Genes matched" tone="emerald" />
          <DnaMetricCard value={activeProfile.missing_count} label="Missing genes" tone="orange" />
          <DnaMetricCard value={`${Math.round(activeProfile.match_score)}%`} label="Overall fit" tone="amber" />
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            Gene matched
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            Partial / related
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-orange-500" />
            Gene missing — evolve next
          </span>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_auto_1fr] xl:items-start">
          <div>
            <p className="text-lg font-semibold uppercase tracking-[0.04em] text-slate-300">YOUR SKILL DNA</p>
            <div className="mt-4 space-y-2 rounded-[18px] border border-white/8 bg-white/[0.025] p-3">
              {activeProfile.user_genes.map((gene) => (
                <GeneRow key={`user-${activeProfile.id}-${gene.skill}`} gene={gene} side="user" />
              ))}
            </div>
          </div>

          <div className="hidden xl:flex xl:h-full xl:items-center">
            <div className="h-[78%] w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
          </div>

          <div>
            <p className="text-lg font-semibold uppercase tracking-[0.04em] text-slate-300">JOB REQUIRES</p>
            <div className="mt-4 space-y-2 rounded-[18px] border border-white/8 bg-white/[0.025] p-3">
              {activeProfile.job_genes.map((gene) => (
                <GeneRow key={`job-${activeProfile.id}-${gene.skill}`} gene={gene} side="job" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LightSkillDnaSection({ profiles, selectedId }) {
  if (!profiles.length) {
    return null;
  }

  const activeProfile = profiles.find((profile) => profile.id === selectedId) || profiles[0];

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.98))] p-5 text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-700">Skill Gap DNA</p>
          <h3 className="mt-2 text-[1.7rem] font-bold leading-tight tracking-[-0.03em] text-slate-950">Visual Career Genome</h3>
          <p className="mt-2 text-xl font-bold tracking-[-0.02em] text-slate-900">Your skill genome</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Each circle is a "gene" - a skill. See how your DNA matches job requirements.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <DnaMetricCard value={activeProfile.matched_count} label="Genes matched" tone="emerald" />
          <DnaMetricCard value={activeProfile.missing_count} label="Missing genes" tone="orange" />
          <DnaMetricCard value={`${Math.round(activeProfile.match_score)}%`} label="Overall fit" tone="amber" />
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            Gene matched
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            Partial / related
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-orange-500" />
            Gene missing - evolve next
          </span>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_auto_1fr] xl:items-start">
          <div>
            <p className="text-lg font-semibold uppercase tracking-[0.04em] text-slate-700">Your Skill DNA</p>
            <div className="mt-3 space-y-2 rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.95))] p-3">
              {activeProfile.user_genes.map((gene) => (
                <GeneRow key={`user-light-${activeProfile.id}-${gene.skill}`} gene={gene} side="user" />
              ))}
            </div>
          </div>

          <div className="hidden xl:flex xl:h-full xl:items-center">
            <div className="h-[78%] w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent" />
          </div>

          <div>
            <p className="text-lg font-semibold uppercase tracking-[0.04em] text-slate-700">Job Requires</p>
            <div className="mt-3 space-y-2 rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.95))] p-3">
              {activeProfile.job_genes.map((gene) => (
                <GeneRow key={`job-light-${activeProfile.id}-${gene.skill}`} gene={gene} side="job" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedDnaId, setSelectedDnaId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const { data } = await client.get("/dashboard/skills");
        setDashboard(data);
      } catch (error) {
        setMessage(error.response?.data?.detail || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  useEffect(() => {
    const nextProfiles = dashboard?.skill_dna_profiles || [];
    if (!nextProfiles.length) {
      if (selectedDnaId) {
        setSelectedDnaId("");
      }
      return;
    }

    if (!nextProfiles.some((profile) => profile.id === selectedDnaId)) {
      setSelectedDnaId(nextProfiles[0].id);
    }
  }, [dashboard, selectedDnaId]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const summary = dashboard?.micro_gap_summary || {};
  const familyGaps = dashboard?.family_gaps || [];
  const quickWins = dashboard?.quick_win_skills || [];
  const skillDnaProfiles = dashboard?.skill_dna_profiles || [];
  const missingSkills = dashboard?.missing_skills || [];
  const matchedSkills = dashboard?.matched_skills || [];
  const trendingSkills = dashboard?.trending_skills || [];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.96))] p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">Skill dashboard</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">Micro-level skill gaps, clearly explained</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              This page now groups your skills into families, highlights the exact micro-skills missing inside each one, and points to the
              fastest adjacent skills you can learn next.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Demand signals are not percentages. They are frequency signals showing how often a skill appears across the current jobs being analyzed.
            </p>
            {message && <p className="mt-4 text-sm font-semibold text-slate-600">{message}</p>}
          </div>

          <div
            className="rounded-[22px] border border-slate-200 p-5 text-white shadow-[0_24px_55px_rgba(15,23,42,0.16)]"
            style={{ background: "linear-gradient(135deg, rgba(15, 23, 42, 1), rgba(30, 41, 59, 0.94))" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">How to read this</p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
              <p>Blue shows your current strength inside a skill family.</p>
              <p>Red-to-amber shows the missing micro-skills current matching jobs still ask from you.</p>
              <p>Demand signals show frequency, not percentages: higher means the skill appears more often in the jobs analyzed.</p>
            </div>
          </div>
        </div>
      </section>

      {dashboard && (
        <>
          <LightSkillDnaSection profiles={skillDnaProfiles} selectedId={selectedDnaId} onSelect={setSelectedDnaId} />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Skill Families"
              value={summary.families_tracked ?? familyGaps.length}
              tone="blue"
              note="Mapped across the families your current target roles are actually testing."
            />
            <StatCard
              label="High Gap Families"
              value={summary.high_gap_families ?? 0}
              tone="rose"
              note="These are the families most likely to hold your match score back right now."
            />
            <StatCard
              label="Quick Wins"
              value={summary.quick_win_count ?? quickWins.length}
              tone="emerald"
              note="Fastest next skills to unlock based on adjacency and current job demand."
            />
            <StatCard
              label="Matched Micro-Skills"
              value={summary.matched_micro_skills ?? matchedSkills.length}
              tone="slate"
              note="Signals already helping your profile line up with current recommendations."
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              {familyGaps.length ? (
                familyGaps.map((family) => <FamilyGapCard key={family.family} family={family} />)
              ) : (
                <div className="rounded-[22px] border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                  No family-level gaps are available yet. Add clearer skills to your profile and refresh the dashboard.
                </div>
              )}
            </div>

            <div className="space-y-5 xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto xl:pr-1">
              <LearningPlatformsPanel missingSkills={missingSkills} quickWins={quickWins} />

              <QuickWinPanel quickWins={quickWins} />

              <SkillChipPanel
                title="Most Missing Right Now"
                subtitle="These are the exact micro-skills appearing across your top matches but not yet showing in your profile strongly enough."
                tone="rose"
                values={missingSkills.slice(0, 10)}
              />

              <SkillChipPanel
                title="Your Strongest Signals"
                subtitle="These skills are already helping you match current roles and are worth proving more clearly in projects and resume bullets."
                tone="emerald"
                values={matchedSkills.slice(0, 10)}
              />

              <SkillChipPanel
                title="Market Is Asking For"
                subtitle="These skills are showing up repeatedly across the current role set, so they are useful for prioritizing what to learn next."
                tone="blue"
                values={trendingSkills.slice(0, 10)}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
