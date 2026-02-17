"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) setInviteCode(code.toUpperCase());
  }, [searchParams]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteCode }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/calendar");
      } else {
        setError(data.error || "Signup failed");
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
          <h1 className="text-lg font-semibold mb-4 text-center">
            Join your team
          </h1>

          {error && (
            <div className="mb-4 px-3 py-2 bg-danger/10 border border-danger/20 rounded-md text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-sm text-text-muted mb-1">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary text-sm placeholder:text-text-dim focus:outline-none focus:border-gold/50"
                placeholder="Jane Smith"
              />
            </div>

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
                minLength={6}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary text-sm placeholder:text-text-dim focus:outline-none focus:border-gold/50"
                placeholder="At least 6 characters"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-text-muted mb-1">
                Invite code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary text-sm placeholder:text-text-dim focus:outline-none focus:border-gold/50 font-mono tracking-widest"
                placeholder="ABCD1234"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gold text-bg-primary rounded-lg font-semibold hover:bg-gold-dark disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-gold hover:text-gold-light">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
