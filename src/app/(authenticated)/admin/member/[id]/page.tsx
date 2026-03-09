"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { showToast } from "@/components/Toast";

interface MemberDetail {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  color: string;
  isActive: boolean;
  createdAt: string;
  requests: {
    id: string;
    startDate: string;
    endDate: string;
    workingDays: number;
    note: string | null;
    status: string;
    adminNote: string | null;
    createdAt: string;
  }[];
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchMember = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setMember(data.user);
      }
    } catch {
      console.error("Failed to fetch member");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  useEffect(() => {
    if (member) {
      setEditName(member.name);
      setEditEmail(member.email);
    }
  }, [member]);

  async function handleSaveProfile() {
    if (!member) return;
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (editName !== member.name) body.name = editName;
      if (editEmail !== member.email) body.email = editEmail;
      if (editPassword) body.password = editPassword;

      if (Object.keys(body).length === 0) {
        setEditing(false);
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/users/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast("Profile updated", "success");
        setEditing(false);
        setEditPassword("");
        fetchMember();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update", "error");
      }
    } catch {
      showToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleToggle() {
    if (!member) return;
    const newRole = member.role === "ADMIN" ? "MEMBER" : "ADMIN";

    try {
      const res = await fetch(`/api/users/${member.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        showToast(`Role updated to ${newRole.toLowerCase()}`, "success");
        fetchMember();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update role", "error");
      }
    } catch {
      showToast("Failed to update role", "error");
    }
  }

  async function handleRemove() {
    if (!member) return;
    if (
      !confirm(
        `Are you sure you want to remove ${member.name}? Their historical data will be preserved.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/users/${member.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Member removed", "success");
        router.push("/admin");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to remove member", "error");
      }
    } catch {
      showToast("Failed to remove member", "error");
    }
  }

  if (currentUser?.role !== "ADMIN") {
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

  if (!member) {
    return (
      <div className="text-center py-20 text-text-muted">
        Member not found.
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const thisYearRequests = member.requests.filter(
    (r) => new Date(r.startDate).getFullYear() === currentYear
  );
  const approved = thisYearRequests.filter((r) => r.status === "APPROVED");
  const daysTaken = approved.reduce((sum, r) => sum + r.workingDays, 0);

  const statusColors: Record<string, string> = {
    APPROVED: "bg-success/10 text-success",
    PENDING: "bg-pending/10 text-pending",
    REJECTED: "bg-danger/10 text-danger",
  };

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => router.push("/admin")}
        className="text-sm text-text-muted hover:text-text-primary mb-4 flex items-center gap-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to team
      </button>

      {/* Member header */}
      <div className="bg-bg-surface border border-border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-bg-primary"
              style={{ backgroundColor: member.color }}
            >
              {member.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{member.name}</h1>
              <p className="text-sm text-text-muted">{member.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    member.role === "ADMIN"
                      ? "bg-gold/10 text-gold"
                      : "bg-border text-text-muted"
                  }`}
                >
                  {member.role.toLowerCase()}
                </span>
                <span className="text-xs text-text-dim">
                  Joined {format(new Date(member.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Admin actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setEditing(!editing)}
              className="px-3 py-1.5 border border-gold/30 rounded-md text-xs text-gold hover:bg-gold/10 transition-colors"
            >
              {editing ? "Cancel Edit" : "Edit Profile"}
            </button>
            {member.id !== currentUser?.id && (
              <>
                <button
                  onClick={handleRoleToggle}
                  className="px-3 py-1.5 border border-border rounded-md text-xs text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                >
                  {member.role === "ADMIN"
                    ? "Demote to Member"
                    : "Promote to Admin"}
                </button>
                <button
                  onClick={handleRemove}
                  className="px-3 py-1.5 border border-danger/30 rounded-md text-xs text-danger hover:bg-danger/10 transition-colors"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
          <div>
            <div className="text-sm text-text-muted">Days Taken ({currentYear})</div>
            <div className="text-2xl font-bold font-mono text-success">
              {daysTaken}
            </div>
          </div>
          <div>
            <div className="text-sm text-text-muted">Pending Days</div>
            <div className="text-2xl font-bold font-mono text-pending">
              {thisYearRequests
                .filter((r) => r.status === "PENDING")
                .reduce((sum, r) => sum + r.workingDays, 0)}
            </div>
          </div>
          <div>
            <div className="text-sm text-text-muted">Total Requests</div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {member.requests.length}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      {editing && (
        <div className="bg-bg-surface border border-gold/20 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm text-text-muted mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-gold/50"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-gold/50"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">
                New Password{" "}
                <span className="text-text-dim">(leave blank to keep current)</span>
              </label>
              <input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-gold/50"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-4 py-2 bg-gold text-bg-primary rounded-md text-sm font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Request History */}
      <h2 className="text-lg font-semibold mb-4">Request History</h2>

      {member.requests.length === 0 ? (
        <div className="bg-bg-surface border border-border rounded-lg p-6 text-center text-text-muted">
          No requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {member.requests.map((req) => (
            <div
              key={req.id}
              className="bg-bg-surface border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  {format(new Date(req.startDate), "MMM d")} -{" "}
                  {format(new Date(req.endDate), "MMM d, yyyy")}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[req.status]}`}
                >
                  {req.status.toLowerCase()}
                </span>
              </div>
              <div className="text-sm text-text-muted">
                {req.workingDays % 1 === 0 ? req.workingDays : req.workingDays.toFixed(1)} working day{req.workingDays !== 1 ? "s" : ""}
                {req.note && (
                  <span className="text-text-dim"> &middot; {req.note}</span>
                )}
              </div>
              {req.adminNote && (
                <div className="mt-1 text-xs text-text-dim italic">
                  Admin note: {req.adminNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
