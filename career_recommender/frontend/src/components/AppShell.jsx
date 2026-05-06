import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const publicNavItems = [{ label: "Home", to: "/" }];
const privateNavItems = [
  { label: "Home", to: "/" },
  { label: "Profile", to: "/profile" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Recommendations", to: "/recommendations" },
  { label: "Roadmap", to: "/roadmap" },
  { label: "Resume", to: "/resume" },
  { label: "Bookmarks", to: "/bookmarks" },
  { label: "AI Mentor", to: "/chatbot" },
];

export default function AppShell({ children }) {
  const { user, logout = () => {} } = useAuth() || {};
  const location = useLocation();
  const navItems = user ? privateNavItems : publicNavItems;
  const shellWidthClass = user ? "mx-auto w-[90vw] max-w-none px-3 sm:px-5 lg:px-6 pt-4 pb-2" : "mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-6 pt-4 pb-2";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className={shellWidthClass}>
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Next Step AI</p>
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Smart Career Guidance</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {user ? (
                  <button type="button" onClick={logout} className="secondary-button">
                    Logout
                  </button>
                ) : (
                  <>
                    <NavLink to="/login" className="secondary-button">
                      Login
                    </NavLink>
                    <NavLink to="/signup" className="primary-button">
                      Create account
                    </NavLink>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </header>

        {user && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-semibold">{user.full_name}</span>
                <span className="ml-0 block text-sm text-slate-500 sm:ml-3 sm:inline">{user.email}</span>
              </div>
              <p className="text-sm text-slate-500">Close skill gaps, rank live jobs, and plan your next move.</p>
            </div>
          </div>
        )}

        <main>{children}</main>
      </div>
    </div>
  );
}
