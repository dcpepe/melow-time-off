"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useAuthStore } from "@/lib/store";
import { showToast } from "@/components/Toast";

interface TimeOffRequest {
  id: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  note: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  createdAt: string;
}

export default function MyTimeOffPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch {
      console.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleCancel(id: string) {
    if (!confirm("Are you sure you want to cancel this request?")) return;

    try {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Request cancelled", "success");
        fetchRequests();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to cancel", "error");
      }
    } catch {
      showToast("Failed to cancel request", "error");
    }
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  const thisYearRequests = requests.filter(
    (r) => new Date(r.startDate).getFullYear() === currentYear
  );

  const approved = thisYearRequests.filter((r) => r.status === "APPROVED");
  const pending = thisYearRequests.filter((r) => r.status === "PENDING");

  const daysTaken = approved.reduce((sum, r) => sum + r.workingDays, 0);
  const daysPending = pending.reduce((sum, r) => sum + r.workingDays, 0);

  const statusColors: Record<string, string> = {
    APPROVED: "bg-success/10 text-success",
    PENDING: "bg-pending/10 text-pending",
    REJECTED: "bg-danger/10 text-danger",
  };

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
      <h1 className="text-2xl font-bold tracking-tight mb-6">My Time Off</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-bg-surface border border-border rounded-lg p-4">
          <div className="text-sm text-text-muted mb-1">Days Taken ({currentYear})</div>
          <div className="text-3xl font-bold font-mono text-success">
            {daysTaken}
          </div>
        </div>
        <div className="bg-bg-surface border border-border rounded-lg p-4">
          <div className="text-sm text-text-muted mb-1">Days Pending</div>
          <div className="text-3xl font-bold font-mono text-pending">
            {daysPending}
          </div>
        </div>
        <div className="bg-bg-surface border border-border rounded-lg p-4">
          <div className="text-sm text-text-muted mb-1">Total Requests</div>
          <div className="text-3xl font-bold font-mono text-text-primary">
            {thisYearRequests.length}
          </div>
        </div>
      </div>

      {/* Requests List */}
      <h2 className="text-lg font-semibold mb-4">Request History</h2>

      {requests.length === 0 ? (
        <div className="bg-bg-surface border border-border rounded-lg p-8 text-center">
          <p className="text-text-muted">No time off requests yet.</p>
          <a
            href="/request"
            className="inline-block mt-3 px-4 py-2 bg-gold text-bg-primary rounded-lg text-sm font-semibold hover:bg-gold-dark transition-colors"
          >
            Request Time Off
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-bg-surface border border-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
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
                  <div className="mt-1 text-xs text-text-dim">
                    Submitted {format(new Date(req.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
                {req.status === "PENDING" && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    className="shrink-0 px-3 py-1.5 border border-border rounded-md text-xs text-text-muted hover:text-danger hover:border-danger/30 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
