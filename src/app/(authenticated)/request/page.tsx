"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isWeekend, eachDayOfInterval, isBefore, startOfDay, parseISO } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import { showToast } from "@/components/Toast";
import "react-day-picker/style.css";

function getInitialRange(): DateRange | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const dateStr = params.get("date");
  if (!dateStr) return undefined;
  const date = parseISO(dateStr);
  if (isNaN(date.getTime()) || isWeekend(date) || isBefore(date, startOfDay(new Date()))) {
    return undefined;
  }
  return { from: date, to: date };
}

export default function RequestPage() {
  const router = useRouter();
  const initialRange = getInitialRange();
  const [range, setRange] = useState<DateRange | undefined>(initialRange);
  const [month, setMonth] = useState<Date>(initialRange?.from || startOfDay(new Date()));
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [halfDays, setHalfDays] = useState<Set<string>>(new Set());

  const today = startOfDay(new Date());

  const workingDaysList =
    range?.from && range?.to
      ? eachDayOfInterval({ start: range.from, end: range.to }).filter(
          (d) => !isWeekend(d)
        )
      : [];

  const fullWorkingDays = workingDaysList.length;

  const halfDayCount = workingDaysList.filter((d) =>
    halfDays.has(format(d, "yyyy-MM-dd"))
  ).length;

  const workingDays = fullWorkingDays > 0 ? fullWorkingDays - halfDayCount * 0.5 : 0;

  function toggleHalfDay(dateStr: string) {
    setHalfDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (!range?.from || !range?.to) return;

    if (workingDays >= 30 && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: format(range.from, "yyyy-MM-dd"),
          endDate: format(range.to, "yyyy-MM-dd"),
          note: note.trim() || undefined,
          halfDays: Array.from(halfDays),
        }),
      });

      if (res.ok) {
        showToast("Request submitted! Awaiting approval.", "success");
        router.push("/calendar");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to submit request", "error");
      }
    } catch {
      showToast("Failed to submit request", "error");
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-6">
        Request Time Off
      </h1>

      <div className="bg-bg-surface border border-border rounded-lg p-6">
        {/* Date Picker */}
        <div className="flex justify-center mb-4">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={(newRange) => {
              setRange(newRange);
              setHalfDays(new Set());
            }}
            month={month}
            onMonthChange={setMonth}
            disabled={[{ before: today }, { dayOfWeek: [0, 6] }]}
            numberOfMonths={1}
            classNames={{
              root: "text-text-primary",
              months: "relative flex flex-col",
              month_caption: "flex justify-center items-center h-10",
              caption_label: "text-sm font-semibold text-text-primary",
              nav: "absolute top-0 right-0 flex items-center h-10",
              button_previous: "p-1 text-text-muted hover:text-text-primary",
              button_next: "p-1 text-text-muted hover:text-text-primary",
              weekdays: "flex",
              weekday: "text-text-dim text-xs font-medium w-10 text-center",
              week: "flex",
              day: "w-10 h-10 text-center text-sm",
              day_button: "w-10 h-10 rounded-md hover:bg-bg-hover text-text-primary transition-colors cursor-pointer",
              selected: "!bg-gold !text-bg-primary font-semibold",
              range_start: "!bg-gold !text-bg-primary rounded-l-md font-semibold",
              range_end: "!bg-gold !text-bg-primary rounded-r-md font-semibold",
              range_middle: "!bg-gold/20 !text-text-primary",
              disabled: "text-text-dim/30 cursor-not-allowed hover:bg-transparent",
              today: "font-bold text-gold",
              outside: "text-text-dim/20",
              chevron: "fill-text-muted",
            }}
          />
        </div>

        {/* Working days info */}
        {range?.from && (
          <div className="bg-bg-primary border border-border rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-text-muted">Selected dates</div>
                <div className="font-medium">
                  {format(range.from, "MMM d, yyyy")}
                  {range.to &&
                    format(range.from, "yyyy-MM-dd") !==
                      format(range.to, "yyyy-MM-dd") &&
                    ` - ${format(range.to, "MMM d, yyyy")}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-text-muted">Working days</div>
                <div className="text-2xl font-bold font-mono text-gold">
                  {workingDays}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Half day toggles */}
        {range?.from && workingDaysList.length > 0 && (
          <div className="bg-bg-primary border border-border rounded-lg p-4 mb-4">
            <div className="text-sm text-text-muted mb-2">Half day options</div>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {workingDaysList.map((d) => {
                const dateStr = format(d, "yyyy-MM-dd");
                return (
                  <label key={dateStr} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={halfDays.has(dateStr)}
                      onChange={() => toggleHalfDay(dateStr)}
                      className="accent-gold w-4 h-4"
                    />
                    <span className="text-sm">
                      {workingDaysList.length === 1
                        ? "Half day"
                        : `Half day \u2014 ${format(d, "EEE, MMM d")}`}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Note */}
        <div className="mb-4">
          <label className="block text-sm text-text-muted mb-1">
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="E.g., Family trip, personal time..."
            className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary text-sm placeholder:text-text-dim focus:outline-none focus:border-gold/50 resize-none"
            rows={2}
          />
        </div>

        {/* Confirm dialog for long ranges */}
        {showConfirm && (
          <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 mb-4">
            <p className="text-sm text-gold">
              You&apos;re requesting {workingDays} working days off. Are you sure?
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-3 py-1.5 bg-gold text-bg-primary rounded-md text-sm font-semibold hover:bg-gold-dark disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Yes, submit"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 border border-border rounded-md text-sm text-text-muted hover:bg-bg-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Submit button */}
        {!showConfirm && (
          <button
            onClick={handleSubmit}
            disabled={!range?.from || workingDays === 0 || submitting}
            className="w-full py-2.5 bg-gold text-bg-primary rounded-lg font-semibold hover:bg-gold-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        )}
      </div>
    </div>
  );
}
