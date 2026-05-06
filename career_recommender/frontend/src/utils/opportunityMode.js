const INTERNSHIP_TERMS = ["intern", "internship", "trainee"];
const JOB_ONLY_TERMS = ["full time", "full-time", "permanent"];

export function getOpportunityModeMismatch(mode, desiredRole) {
  const normalizedRole = (desiredRole || "").trim().toLowerCase();
  if (!normalizedRole) {
    return "";
  }

  if (mode === "job" && INTERNSHIP_TERMS.some((term) => normalizedRole.includes(term))) {
    return "This role looks like an internship. Switch the opportunity type to Internship.";
  }

  if (mode === "internship" && JOB_ONLY_TERMS.some((term) => normalizedRole.includes(term))) {
    return "This role looks like a full-time job. Switch the opportunity type to Job.";
  }

  return "";
}
