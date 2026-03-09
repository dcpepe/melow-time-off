"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useAuthStore } from "@/lib/store";
import { showToast } from "@/components/Toast";

interface PendingRequest {
  id: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  note: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    color: string;
  };
}

export default function PendingPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [overlaps, setOverlaps] = useState<Record<string, PendingRequest[]>>({});
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/requests?status=PENDING");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);

        // For each request, find overlapping approved/pending requests
        const overlapMap: Record<string, PendingRequest[]> = {};
        for (const req of data.requests) {
          const overlapRes = await fetch(
            `/api/calendar?month=${new Date(req.startDate).getMonth()}&year=${new Date(req.startDate).getFullYear()}`
          );
          if (overlapRes.ok) {
            const calData = await overlapRes.json();
            overlapMap[req.id] = calData.requests.filter(
              (r: PendingRequest) =>
                r.id !== req.id &&
                r.user.id !== req.user.id &&
                new Date(r.startDate) <= new Date(req.endDate) &&
                new Date(r.endDate) >= new Date(req.startDate)
            );
          }
        }
        setOverlaps(overlapMap);
      }
    } catch {
      console.error("Failed to fetch pending requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  async function handleReview(id: string, status: "APPROVED" | "REJECTED") {
    setProcessing(id);
    try {
      const res = await fetch(`/api/requests/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNote: status === "REJECTED" ? adminNote : undefined,
        }),
      });

      if (res.ok) {
        showToast(
          `Request ${status === "APPROVED" ? "approved" : "rejected"}`,
          "success"
        );
        setRejectId(null);
        setAdminNote("");
        fetchPending();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to review", "error");
      }
    } catch {
      showToast("Failed to review request", "error");
    } finally {
      setProcessing(null);
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

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Pending Requests</h1>
        {requests.length > 0 && (
          <span className="bg-gold/10 text-gold text-xs px-2 py-0.5 rounded-full font-medium">
            {requests.length}
          </span>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="bg-bg-surface border border-border rounded-lg p-8 text-center">
          <p className="text-text-muted">No pending requests. All caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-bg-surface border border-border rounded-lg p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-bg-primary shrink-0"
                    style={{ backgroundColor: req.user.color }}
                  >
                    {req.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{req.user.name}</div>
                    <div className="text-sm text-text-muted mt-0.5">
                      {format(new Date(req.startDate), "MMM d")} -{" "}
                      {format(new Date(req.endDate), "MMM d, yyyy")}
                      <span className="text-text-dim">
                        {" "}
                        &middot; {req.workingDays % 1 === 0 ? req.workingDays : req.workingDays.toFixed(1)} working day
                        {req.workingDays !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {req.note && (
                      <p className="mt-1 text-sm text-text-dim">
                        &quot;{req.note}&quot;
                      </p>
                    )}
                    <div className="text-xs text-text-dim mt-1">
                      Submitted{" "}
                      {format(new Date(req.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>

                    {/* Overlap info */}
                    {overlaps[req.id] && overlaps[req.id].length > 0 && (
                      <div className="mt-3 p-2 bg-bg-primary border border-border rounded-md">
                        <div className="text-xs text-text-dim mb-1 font-medium">
                          Also off during these dates:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {overlaps[req.id].map((o) => (
                            <span
                              key={o.id}
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-border"
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: o.user.color }}
                              />
                              {o.user.name.split(" ")[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {rejectId === req.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Reason for rejection (optional)"
                        className="w-48 px-2 py-1.5 bg-bg-primary border border-border rounded text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-danger/50 resize-none"
                        rows={2}
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleReview(req.id, "REJECTED")}
                          disabled={processing === req.id}
                          className="px-2.5 py-1 bg-danger/10 text-danger rounded text-xs font-medium hover:bg-danger/20 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setRejectId(null);
                            setAdminNote("");
                          }}
                          className="px-2.5 py-1 border border-border rounded text-xs text-text-muted hover:bg-bg-hover"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleReview(req.id, "APPROVED")}
                        disabled={processing === req.id}
                        className="px-3 py-1.5 bg-success/10 text-success rounded-md text-sm font-medium hover:bg-success/20 disabled:opacity-50 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectId(req.id)}
                        disabled={processing === req.id}
                        className="px-3 py-1.5 bg-danger/10 text-danger rounded-md text-sm font-medium hover:bg-danger/20 disabled:opacity-50 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
