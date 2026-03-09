"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, addMonths, subMonths } from "date-fns";
import { getCalendarDays } from "@/lib/dates";

interface CalendarRequest {
  id: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED";
  workingDays: number;
  note: string | null;
  user: {
    id: string;
    name: string;
    color: string;
  };
}

interface DayDetail {
  date: string;
  entries: CalendarRequest[];
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [requests, setRequests] = useState<CalendarRequest[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; color: string }[]>([]);
  const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<DayDetail | null>(null);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await fetch(`/api/calendar?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Failed to fetch calendar:", err);
    }
  }, [month, year]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  useEffect(() => {
    fetchCalendar();
    fetchUsers();
  }, [fetchCalendar, fetchUsers]);

  const days = getCalendarDays(year, month);

  function getRequestsForDay(dateStr: string): CalendarRequest[] {
    return requests.filter((r) => {
      if (hiddenUsers.has(r.user.id)) return false;
      const start = r.startDate.split("T")[0];
      const end = r.endDate.split("T")[0];
      return dateStr >= start && dateStr <= end;
    });
  }

  function toggleUser(userId: string) {
    setHiddenUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function handleDayClick(dateStr: string, isCurrentMonth: boolean) {
    if (!isCurrentMonth) return;
    const entries = getRequestsForDay(dateStr);
    if (entries.length > 0) {
      setSelectedDay({ date: dateStr, entries });
    } else {
      // Navigate to request page with this date pre-selected
      router.push(`/request?date=${dateStr}`);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Team Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-md border border-border hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-md border border-border hover:bg-bg-hover text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-md border border-border hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <span className="ml-2 text-lg font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-lg overflow-hidden bg-bg-surface">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-xs font-medium text-text-muted text-center uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayRequests = getRequestsForDay(day.dateStr);
            return (
              <div
                key={day.dateStr}
                onClick={() => handleDayClick(day.dateStr, day.isCurrentMonth)}
                className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-border p-1 sm:p-2 cursor-pointer transition-colors hover:bg-bg-hover ${
                  !day.isCurrentMonth ? "opacity-30" : ""
                } ${day.isWeekend ? "bg-bg-primary/50" : ""}`}
              >
                <div
                  className={`text-xs font-mono mb-1 ${
                    day.isToday
                      ? "bg-gold text-bg-primary w-5 h-5 rounded-full flex items-center justify-center font-bold"
                      : day.isWeekend
                        ? "text-text-dim"
                        : "text-text-muted"
                  }`}
                >
                  {format(day.date, "d")}
                </div>
                <div className="flex flex-col gap-0.5">
                  {dayRequests.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className={`text-[10px] sm:text-xs px-1 py-0.5 rounded truncate font-medium ${
                        r.status === "PENDING"
                          ? "border border-dashed"
                          : ""
                      }`}
                      style={{
                        backgroundColor:
                          r.status === "APPROVED"
                            ? `${r.user.color}20`
                            : "transparent",
                        color: r.user.color,
                        borderColor:
                          r.status === "PENDING" ? r.user.color : "transparent",
                      }}
                      title={`${r.user.name} (${r.status.toLowerCase()})`}
                    >
                      <span className="hidden sm:inline">{r.user.name.split(" ")[0]}</span>
                      <span className="sm:hidden">{r.user.name.charAt(0)}</span>
                    </div>
                  ))}
                  {dayRequests.length > 3 && (
                    <div className="text-[10px] text-text-dim">
                      +{dayRequests.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => toggleUser(u.id)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-border transition-all ${
              hiddenUsers.has(u.id) ? "opacity-30" : ""
            }`}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: u.color }}
            />
            <span className="text-text-muted">{u.name.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-4 text-xs text-text-dim">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-3 rounded bg-gold/20" />
          <span>Approved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-3 rounded border border-dashed border-gold" />
          <span>Pending</span>
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-bg-surface border border-border rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {format(new Date(selectedDay.date + "T12:00:00"), "EEEE, MMMM d, yyyy")}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-text-dim hover:text-text-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {selectedDay.entries.map((r) => {
                const start = new Date(r.startDate);
                const end = new Date(r.endDate);
                return (
                  <div
                    key={r.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-bg-primary shrink-0 mt-0.5"
                      style={{ backgroundColor: r.user.color }}
                    >
                      {r.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium">{r.user.name}</div>
                      <div className="text-sm text-text-muted">
                        {format(start, "MMM d")} - {format(end, "MMM d")} ({r.workingDays % 1 === 0 ? r.workingDays : r.workingDays.toFixed(1)} working day{r.workingDays !== 1 ? "s" : ""})
                      </div>
                      <span
                        className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.status === "APPROVED"
                            ? "bg-success/10 text-success"
                            : "bg-pending/10 text-pending"
                        }`}
                      >
                        {r.status.toLowerCase()}
                      </span>
                      {r.note && (
                        <p className="mt-1 text-xs text-text-dim">{r.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
