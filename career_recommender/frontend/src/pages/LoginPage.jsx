import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client, { getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append("username", form.email);
      params.append("password", form.password);
      const { data } = await client.post("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      login(data);
      navigate("/profile");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Unable to login."));
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-6 py-10">
      <section className="w-full max-w-4xl card-panel">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-tide">Welcome back</p>
      <h2 className="mt-3 font-display text-4xl font-bold text-slate-950">Sign in to your career cockpit</h2>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="field-label">Email</label>
          <input type="email" className="field-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="field-label">Password</label>
          <input type="password" className="field-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        {message && <p className="text-sm font-semibold text-rose-600">{message}</p>}
        <button type="submit" className="primary-button">Sign in</button>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        If this email is already registered and you want to create it again with a new password, use the{" "}
        <Link to="/signup" className="font-semibold text-tide underline underline-offset-4">
          signup page
        </Link>{" "}
        and choose the replace account option.
      </p>
      </section>
    </main>
  );
}
