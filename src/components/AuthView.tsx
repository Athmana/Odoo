"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  UserCheck,
  Building2,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  Sparkles,
  Check,
  Globe,
  BarChart3,
} from "lucide-react";

interface AuthViewProps {
  onSuccess: () => void;
}

export default function AuthView({ onSuccess }: AuthViewProps) {
  const [mode, setMode] = useState<"LOGIN" | "REGISTER" | "RESET">("LOGIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");

  // Reset Password state
  const [resetStep, setResetStep] = useState<"REQUEST" | "CONFIRM">("REQUEST");
  const [resetToken, setResetToken] = useState("");
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const checkLength = (p: string) => p.length > 8;
  const checkUpper = (p: string) => /[A-Z]/.test(p);
  const checkLower = (p: string) => /[a-z]/.test(p);
  const checkSpecial = (p: string) => /[^A-Za-z0-9]/.test(p);

  const handleQuickPortalSwitch = async (portalEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: portalEmail, password: "Brightloop@123" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed");
      } else {
        onSuccess();
      }
    } catch {
      setError("Network error while connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials");
      } else {
        onSuccess();
      }
    } catch {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, company, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        onSuccess();
      }
    } catch {
      setError("Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed");
      } else {
        setMessage(data.message);
        setVerificationCode(data.verificationCode);
        setResetToken(data.verificationCode || "");
        setResetStep("CONFIRM");
      }
    } catch {
      setError("Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          email,
          resetToken,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not reset password.");
      } else {
        setMessage(data.message);
        setMode("LOGIN");
        setPassword("");
      }
    } catch {
      setError("Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const activePwd = mode === "REGISTER" ? password : newPassword;

  return (
    <div className="min-h-screen relative bg-[#070B19] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 overflow-hidden">
      {/* Ambient decorative background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-indigo-600/20 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-violet-600/20 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-blue-500/10 blur-[140px]" />

      <div className="relative z-10 max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 bg-slate-900/75 border border-white/10 rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)] overflow-hidden backdrop-blur-2xl">
        {/* Left Brand & Showcase Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-slate-950 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
          <div>
            {/* Brand Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-base font-extrabold tracking-tight text-white leading-none">
                  Brightloop
                </div>
                <div className="text-[11px] font-medium text-indigo-300/80 mt-0.5">
                  Subscription & Revenue Cloud
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-[11px] font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Automated Recurring Billing Engine
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight mb-3">
              Complete control over your subscription lifecycle.
            </h1>
            <p className="text-slate-300/90 text-xs sm:text-sm leading-relaxed mb-8">
              From tailored quotations and multi-interval billing plans to automated tax compliance, smart discounts, and real-time revenue intelligence.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                <BarChart3 className="w-4 h-4 text-indigo-400 mb-1.5" />
                <div className="font-semibold text-white">Live Revenue Metrics</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Real-time ARR, MRR & overdue tracking
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                <Globe className="w-4 h-4 text-emerald-400 mb-1.5" />
                <div className="font-semibold text-white">Tax & Discount Rules</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Auto-applied eligibility & regional taxes
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Quick Access Switcher */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Workspace Access
              </span>
              <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                1-Click Sign In
              </span>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickPortalSwitch("admin@brightloop.io")}
                className="group w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-500/15 to-violet-500/10 hover:from-indigo-500/25 hover:to-violet-500/20 border border-indigo-400/25 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo-200 transition">
                      Admin Control Center
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Products, plans, taxes, discounts, staff & analytics
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickPortalSwitch("staff@brightloop.io")}
                className="group w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 hover:from-emerald-500/25 hover:to-teal-500/20 border border-emerald-400/25 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-200 transition">
                      Staff Operations Workspace
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Customers, quotations, billing cycles & payments
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickPortalSwitch("customer@acme.com")}
                className="group w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 hover:from-amber-500/25 hover:to-orange-500/20 border border-amber-400/25 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-200 transition">
                      Customer Self-Service Portal
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Acme Cloud Logistics • Manage plans & pay invoices
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-slate-950/40">
          <div className="max-w-md w-full mx-auto">
            {/* Segmented Mode Switcher */}
            <div className="grid grid-cols-3 gap-1 p-1.5 mb-8 bg-slate-900/90 border border-white/10 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMode("LOGIN");
                  setError(null);
                  setMessage(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  mode === "LOGIN"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("REGISTER");
                  setError(null);
                  setMessage(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  mode === "REGISTER"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("RESET");
                  setResetStep("REQUEST");
                  setError(null);
                  setMessage(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  mode === "RESET"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Reset Password
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="leading-relaxed">{message}</div>
                  {verificationCode && (
                    <div className="pt-1 font-mono font-bold text-emerald-300">
                      Security Verification Code: {verificationCode}
                    </div>
                  )}
                </div>
              </div>
            )}

            {mode === "LOGIN" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    Sign in to your account
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your registered email and password to access your workspace.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("RESET");
                        setResetStep("REQUEST");
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/25"
                >
                  {loading ? "Authenticating..." : "Sign In"}
                </button>
              </form>
            )}

            {mode === "REGISTER" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    Customer Registration
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Create your organization account to manage subscriptions and billing.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-2831"
                      className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  {/* Password Policy Indicators */}
                  <div className="grid grid-cols-2 gap-2 mt-2.5 p-3 bg-slate-900/70 rounded-xl border border-white/5 text-[11px]">
                    <div
                      className={`flex items-center gap-1.5 ${
                        checkLength(activePwd) ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      9+ characters ({activePwd.length}/9)
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        checkUpper(activePwd) ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Uppercase letter (A-Z)
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        checkLower(activePwd) ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Lowercase letter (a-z)
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        checkSpecial(activePwd) ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Special character (!@#$)
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/25"
                >
                  {loading ? "Creating Account..." : "Create Customer Account"}
                </button>
              </form>
            )}

            {mode === "RESET" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    Reset your password
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Verify your registered email address to set a new account password.
                  </p>
                </div>

                {resetStep === "REQUEST" ? (
                  <form onSubmit={handleResetRequest} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="customer@acme.com"
                          className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/25"
                    >
                      {loading ? "Sending Verification..." : "Send Reset Verification Code"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetConfirm} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Registered Email
                      </label>
                      <input
                        type="email"
                        disabled
                        value={email}
                        className="w-full px-3.5 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Verification Code
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          value={resetToken}
                          onChange={(e) => setResetToken(e.target.value)}
                          placeholder="6-digit code"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter strong new password"
                        className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white"
                      />
                      <div className="grid grid-cols-2 gap-2 mt-2.5 p-3 bg-slate-900/70 rounded-xl border border-white/5 text-[11px]">
                        <div className={checkLength(newPassword) ? "text-emerald-400" : "text-slate-500"}>
                          ✓ 9+ characters
                        </div>
                        <div className={checkUpper(newPassword) ? "text-emerald-400" : "text-slate-500"}>
                          ✓ Uppercase (A-Z)
                        </div>
                        <div className={checkLower(newPassword) ? "text-emerald-400" : "text-slate-500"}>
                          ✓ Lowercase (a-z)
                        </div>
                        <div className={checkSpecial(newPassword) ? "text-emerald-400" : "text-slate-500"}>
                          ✓ Special char (!@#$)
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-600/25"
                    >
                      {loading ? "Updating Password..." : "Update Password"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
