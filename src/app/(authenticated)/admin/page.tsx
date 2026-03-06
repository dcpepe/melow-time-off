"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { showToast } from "@/components/Toast";

interface MemberStat {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  color: string;
  createdAt: string;
  daysTaken: number;
  daysPending: number;
  totalRequests: number;
  upcoming: {
    startDate: string;
    endDate: string;
    workingDays: number;
  } | null;
}

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<MemberStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "daysTaken" | "role">("name");

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      } else if (res.status === 403) {
        // Role may have just been updated - refresh session and retry once
        await fetch("/api/auth/me");
        const retry = await fetch("/api/admin/stats");
        if (retry.ok) {
          const data = await retry.json();
          setStats(data.stats);
        }
      }
    } catch {
      console.error("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleExport() {
    try {
      const res = await fetch("/api/admin/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `time-off-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Export downloaded", "success");
      }
    } catch {
      showToast("Failed to export", "error");
    }
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="text-center py-20 text-text-muted">
        You don&apos;t have permission to view this page.
      </div>
    );
  }

  const sorted = [...stats].sort((a, b) => {
    if (sortBy === "daysTaken") return b.daysTaken - a.daysTaken;
    if (sortBy === "role") return a.role.localeCompare(b.role);
    return a.name.localeCompare(b.name);
  });

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Team Overview</h1>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 border border-border rounded-md text-sm text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-bg-surface border border-border rounded-lg p-4">
          <div className="text-sm text-text-muted mb-1">Team Members</div>
          <div className="text-3xl font-bold font-mono text-text-primary">
            {stats.length}
          </div>
        </div>
        <div className="bg-bg-surface border border-border rounded-lg p-4">
          <div className="text-sm text-text-muted mb-1">Total Days Taken</div>
          <div className="text-3xl font-bold font-mono text-success">
            {stats.reduce((sum, s) => sum + s.daysTaken, 0)}
          </div>
        </div>
        <div className="bg-bg-surface border border-border rounded-lg p-4">
          <div className="text-sm text-text-muted mb-1">Days Pending</div>
          <div className="text-3xl font-bold font-mono text-pending">
            {stats.reduce((sum, s) => sum + s.daysPending, 0)}
          </div>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex gap-2 mb-4">
        <span className="text-sm text-text-dim">Sort by:</span>
        {(["name", "daysTaken", "role"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`text-xs px-2 py-1 rounded-md border ${
              sortBy === s
                ? "border-gold/30 text-gold bg-gold/10"
                : "border-border text-text-muted hover:text-text-primary"
            }`}
          >
            {s === "daysTaken" ? "Days Taken" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Team Table */}
      <div className="bg-bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                  Member
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">
                  Role
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                  Days Taken
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">
                  Pending
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">
                  Upcoming
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-border last:border-b-0 hover:bg-bg-hover transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-bg-primary shrink-0"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-text-dim">
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        member.role === "ADMIN"
                          ? "bg-gold/10 text-gold"
                          : "bg-border text-text-muted"
                      }`}
                    >
                      {member.role.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-bold text-sm">
                      {member.daysTaken}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="font-mono text-sm text-pending">
                      {member.daysPending}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {member.upcoming ? (
                      <span className="text-xs text-text-muted">
                        {format(new Date(member.upcoming.startDate), "MMM d")} -{" "}
                        {format(new Date(member.upcoming.endDate), "MMM d")}
                      </span>
                    ) : (
                      <span className="text-xs text-text-dim">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/member/${member.id}`}
                      className="text-xs text-text-dim hover:text-gold transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
