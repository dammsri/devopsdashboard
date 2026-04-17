import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineMail, HiOutlineLockClosed, HiEye, HiEyeOff } from "react-icons/hi";
import { RiShieldCheckLine, RiUserLine } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState(null);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const result = await login(form.email, form.password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Hero Panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-brand-900 to-indigo-950">
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-purple-500/15 blur-3xl animate-pulse-slow" style={{ animationDelay: "3s" }} />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, #818cf8 1px, transparent 1px)", backgroundSize: "36px 36px" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src="/sc-logo.svg" alt="Standard Chartered" className="w-full h-full object-contain filter invert brightness-0 invert" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">DevOps Dashboard</span>
          </div>

          {/* Center text */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <h1 className="text-5xl font-extrabold text-white leading-tight">
                Intelligent<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-indigo-300">
                  DevOps Control
                </span>
              </h1>
              <p className="mt-4 text-slate-300 text-lg leading-relaxed max-w-sm">
                Unify your deployments, clusters, and pipelines in one AI-powered dashboard.
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              {["Kubernetes", "CI/CD Pipelines", "AI Insights", "Real-time Monitoring"].map((f) => (
                <span key={f} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm backdrop-blur-sm">
                  {f}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <p className="text-slate-500 text-sm">© 2025 DevOps Dashboard. Enterprise Edition.</p>
        </div>
      </div>

      {/* ── Right Sign-in Panel ──────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <motion.div
          className="w-full max-w-md space-y-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/sc-logo.svg" alt="Standard Chartered" className="w-full h-full object-contain" />
            </div>
            <span className="text-slate-900 dark:text-white font-bold text-lg">DevOps Dashboard</span>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">Sign in to your dashboard</p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              >
                <span className="text-base">⚠️</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User ID */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                User ID
              </label>
              <div className="relative">
                <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. SC00123"
                  className="form-input pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPwd ? <HiEyeOff className="text-lg" /> : <HiEye className="text-lg" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button id="login-btn" type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : "Sign in"}
            </button>

            {/* Demo hint */}
            <p className="text-center text-xs text-slate-400 dark:text-slate-600 pt-2">
              Demo — admin / Admin@123
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
