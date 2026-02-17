import {
  eachDayOfInterval,
  isWeekend,
  format,
  startOfMonth,
  endOfMonth,
  getDay,
  addDays,
  subDays,
} from "date-fns";

export function countWorkingDays(start: Date, end: Date): number {
  const days = eachDayOfInterval({ start, end });
  return days.filter((day) => !isWeekend(day)).length;
}

export function getCalendarDays(year: number, month: number) {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));

  // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
  let startDay = getDay(monthStart);
  // Convert to Monday-based (0 = Monday, 6 = Sunday)
  startDay = startDay === 0 ? 6 : startDay - 1;

  // Fill in days from previous month
  const calendarStart = subDays(monthStart, startDay);

  // Get day of week for last day
  let endDay = getDay(monthEnd);
  endDay = endDay === 0 ? 6 : endDay - 1;

  // Fill in days to complete the week
  const calendarEnd = addDays(monthEnd, 6 - endDay);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return days.map((date) => ({
    date,
    dateStr: format(date, "yyyy-MM-dd"),
    isCurrentMonth: date.getMonth() === month,
    isWeekend: isWeekend(date),
    isToday: format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
  }));
}

export function formatDateRange(start: Date, end: Date): string {
  const startStr = format(start, "MMM d");
  const endStr = format(end, "MMM d, yyyy");
  if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
    return format(start, "MMM d, yyyy");
  }
  return `${startStr} - ${endStr}`;
}
