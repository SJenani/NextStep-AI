import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const featureCards = [
  "Real-time job and internship recommendations with AI ranking.",
  "Resume PDF analyzer with skill extraction and profile auto-fill.",
  "Skill gap dashboard with matched, missing, and trending skills.",
  "Personalized 30/60/90-day roadmap, projects, and interview prep.",
];

export default function HomePage() {
  const auth = useAuth() || {};
  const { user, logout = () => {} } = auth;
  const navItems = user
    ? [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Skill Gap", to: "/dashboard" },
        { label: "Roadmap", to: "/roadmap" },
        { label: "AI Mentor", to: "/chatbot" },
      ]
    : [
        { label: "Features", to: "#features" },
        { label: "How it works", to: "#how-it-works" },
      ];

  return (
    <div className="mx-auto w-[85vw] max-w-[1800px] space-y-8 py-4">
      <header className="sticky top-4 z-30 rounded-[28px] border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
              AI
            </span>
            <span>
              <span className="block text-base font-bold text-slate-950">Next Step AI</span>
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Smart guidance
              </span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) =>
              item.to.startsWith("#") ? (
                <a
                  key={item.to}
                  href={item.to}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  {item.label}
                </a>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            {user ? (
              <>
                <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 sm:block">
                  {user.full_name}
                </div>
                <button type="button" onClick={logout} className="secondary-button py-2.5">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="secondary-button py-2.5">
                  Login
                </Link>
                <Link to="/signup" className="primary-button py-2.5">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section id="how-it-works" className="card-panel overflow-hidden scroll-mt-28">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="font-mono text-sm font-bold uppercase tracking-[0.35em] text-tide">Next Step AI</p>
            <h2 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight text-slate-950 sm:text-6xl">
              Navigate careers with live job data, skill intelligence, and personalized guidance.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              This assistant helps students and job seekers discover real opportunities, understand exactly what skills are missing, and move from confusion to a focused action plan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="primary-button">
                Launch your career workspace
              </Link>
              <Link to="/login" className="secondary-button">
                Sign in
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-slate-50 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <img
                src="/images/career-hero-illustration.png"
                alt="Illustration of an AI career assistant guiding a career path"
                className="h-full min-h-[260px] w-full object-cover"
              />
            </div>
            <div className="rounded-[30px] bg-slate-950 p-6 text-white">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-coral">Built for momentum</p>
            <div className="mt-6 grid gap-4">
              {featureCards.map((feature) => (
                <div key={feature} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-100">
                  {feature}
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="grid scroll-mt-28 gap-6 lg:grid-cols-3">
        {[
          { tag: "Job Matching", title: "AI Ranking", body: "TF-IDF and cosine similarity score each job to surface the strongest matches first." },
          { tag: "Evaluation", title: "Readiness Score", body: "Skill match, experience fit, domain alignment, and relevance combine into a 0-100 score." },
          { tag: "Guidance", title: "OpenAI Mentor", body: "Ask the mentor what to learn next, which role to target, and how to prepare for interviews." },
        ].map((item) => (
          <article key={item.title} className="card-panel">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">{item.tag}</p>
            <h3 className="mt-3 font-display text-2xl font-bold text-slate-950">{item.title}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">{item.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
