"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Shield, User, Eye, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected error occurred during sign-in.");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentialsAndLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      email: demoEmail,
      password: "Password123!",
    });

    if (res?.error) {
      setError("Sign-in failed. Please ensure the database has been seeded.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sign in to LOOP</h1>
          <p className="text-xs text-slate-400">
            AI Customer-Feedback Intelligence Platform
          </p>
        </div>

        {/* Demo Credentials Quick Switcher */}
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-indigo-300">
            <span>Portfolio Demo Accounts</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200">One-Click Login</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Select a role to test role-based access control (RBAC) and workspace data isolation:
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => fillCredentialsAndLogin("admin@loop.dev")}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition text-xs font-medium"
            >
              <Shield className="w-4 h-4 mb-1 text-amber-400" />
              <span>Admin</span>
              <span className="text-[9px] opacity-75">Full Access</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentialsAndLogin("analyst@loop.dev")}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition text-xs font-medium"
            >
              <User className="w-4 h-4 mb-1 text-indigo-400" />
              <span>Analyst</span>
              <span className="text-[9px] opacity-75">Triage & Reports</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentialsAndLogin("viewer@loop.dev")}
              disabled={loading}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-slate-300 transition text-xs font-medium"
            >
              <Eye className="w-4 h-4 mb-1 text-slate-400" />
              <span>Viewer</span>
              <span className="text-[9px] opacity-75">Read-Only</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="email">
                Work Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-50 shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Need a new tenant workspace?{" "}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Create an organization
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}