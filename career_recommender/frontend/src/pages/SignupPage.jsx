import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [currentPassword, setCurrentPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showReplaceFlow, setShowReplaceFlow] = useState(false);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (showReplaceFlow) {
      setShowReplaceFlow(false);
      setCurrentPassword("");
    }
    if (message) {
      setMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const { data } = await client.post("/auth/signup", form);
      login(data);
      navigate("/profile");
    } catch (error) {
      const detail = getApiErrorMessage(error, "Unable to create account.");
      setShowReplaceFlow(detail === "Email already registered.");
      setMessage(
        detail === "Email already registered."
          ? "This email is already registered. If it is your account, enter the current password below to delete the old account and create a fresh one with the new password."
          : detail,
      );
    }
  };

  const handleReplaceAccount = async () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim() || !currentPassword.trim()) {
      setMessage("Enter full name, email, new password, and the current password to replace this account.");
      return;
    }

    setMessage("");
    try {
      const { data } = await client.post("/auth/replace-account", {
        full_name: form.full_name,
        email: form.email,
        current_password: currentPassword,
        new_password: form.password,
      });
      login(data);
      navigate("/profile");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Unable to replace account."));
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-6 py-10">
      <section className="w-full max-w-5xl card-panel">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">Create account</p>
            <h2 className="mt-3 font-display text-4xl font-bold text-slate-950">Start your AI-guided job search</h2>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="field-label">Full name</label>
                <input
                  className="field-input"
                  value={form.full_name}
                  onChange={(e) => updateForm("full_name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label">Email</label>
                <input
                  type="email"
                  className="field-input"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label">Password</label>
                <input
                  type="password"
                  className="field-input"
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  required
                />
              </div>
              {message && <p className="text-sm font-semibold text-rose-600">{message}</p>}
              <button type="submit" className="primary-button">Create account</button>
            </form>
            {showReplaceFlow && (
              <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50/80 p-6">
                <h3 className="font-display text-2xl font-semibold text-slate-950">Replace existing account</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  This will permanently remove the old account for this email, including saved profile data, bookmarks,
                  alerts, and interview recordings, then create a new account with the details above.
                </p>
                <div className="mt-5">
                  <label className="field-label">Current password for this email</label>
                  <input
                    type="password"
                    className="field-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required={showReplaceFlow}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleReplaceAccount}
                  className="secondary-button mt-5 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!currentPassword.trim()}
                >
                  Delete old account and create this one
                </button>
              </div>
            )}
          </div>
          <img
            src="/images/auth-people.png"
            alt=""
            aria-hidden="true"
            className="mx-auto hidden max-h-[430px] w-full max-w-[300px] select-none object-contain lg:block"
          />
        </div>
      </section>
    </main>
  );
}
