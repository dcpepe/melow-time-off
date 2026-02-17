"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/calendar");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
            <span className="text-bg-primary font-bold text-lg">M</span>
          </div>
          <div>
            <span className="font-bold text-xl text-text-primary tracking-tight">
              Melow
            </span>
            <span className="text-text-muted ml-1">Time Off</span>
          </div>
        </div>

        <div className="bg-bg-surface border border-border rounded-lg p-6">
          <h1 className="text-lg font-semibold mb-4 text-center">Sign in</h1>

          {error && (
            <div className="mb-4 px-3 py-2 bg-danger/10 border border-danger/20 rounded-md text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-sm text-text-muted mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary text-sm placeholder:text-text-dim focus:outline-none focus:border-gold/50"
                placeholder="you@melow.ai"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm text-text-muted mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary text-sm placeholder:text-text-dim focus:outline-none focus:border-gold/50"
                placeholder="Enter your password"
              />
            </div>

            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 accent-gold"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-text-muted cursor-pointer"
              >
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gold text-bg-primary rounded-lg font-semibold hover:bg-gold-dark disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-gold hover:text-gold-light">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
