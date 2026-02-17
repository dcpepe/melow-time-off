"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { showToast } from "@/components/Toast";

interface InviteInfo {
  id: string;
  code: string;
  createdAt: string;
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);

  const fetchInvite = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/invite");
      if (res.ok) {
        const data = await res.json();
        setInvite(data.invite);
      }
    } catch {
      console.error("Failed to fetch invite");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvite();
  }, [fetchInvite]);

  async function handleRotate() {
    setRotating(true);
    try {
      const res = await fetch("/api/admin/invite", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setInvite(data.invite);
        showToast("Invite code rotated", "success");
      }
    } catch {
      showToast("Failed to rotate invite code", "error");
    } finally {
      setRotating(false);
    }
  }

  function copyCode() {
    if (invite?.code) {
      navigator.clipboard.writeText(invite.code);
      showToast("Copied to clipboard", "success");
    }
  }

  function copyLink() {
    if (invite?.code) {
      const url = `${window.location.origin}/signup?code=${invite.code}`;
      navigator.clipboard.writeText(url);
      showToast("Invite link copied", "success");
    }
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="text-center py-20 text-text-muted">
        You don&apos;t have permission to view this page.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center animate-pulse">
          <span className="text-bg-primary font-bold text-sm">M</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Settings</h1>

      {/* Invite Code */}
      <div className="bg-bg-surface border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-1">Team Invite Code</h2>
        <p className="text-sm text-text-muted mb-4">
          Share this code with team members so they can sign up.
        </p>

        {invite && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 bg-bg-primary border border-border rounded-lg px-4 py-3 font-mono text-xl tracking-[0.3em] text-gold text-center font-bold">
                {invite.code}
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={copyCode}
                className="flex-1 px-3 py-2 border border-border rounded-md text-sm text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
              >
                Copy Code
              </button>
              <button
                onClick={copyLink}
                className="flex-1 px-3 py-2 border border-border rounded-md text-sm text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
              >
                Copy Invite Link
              </button>
            </div>

            <hr className="border-border mb-4" />

            <button
              onClick={handleRotate}
              disabled={rotating}
              className="px-3 py-2 border border-danger/30 rounded-md text-sm text-danger hover:bg-danger/10 disabled:opacity-50 transition-colors"
            >
              {rotating ? "Rotating..." : "Rotate Code"}
            </button>
            <p className="mt-2 text-xs text-text-dim">
              This will invalidate the current code and generate a new one.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
