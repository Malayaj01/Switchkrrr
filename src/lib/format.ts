import { LeadStatus } from "@prisma/client";

const shortDate = new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" });
const longDate = new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
});

export function formatShortDate(date: Date) {
  return shortDate.format(date);
}

export function formatLongDate(date: Date) {
  return longDate.format(date);
}

export function formatDateTime(date: Date) {
  return dateTime.format(date);
}

/** Turns an enum value such as `TO_APPLY` into a readable `To Apply`. */
export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function leadStatusClassName(status: LeadStatus) {
  if (status === LeadStatus.OFFER || status === LeadStatus.INTERVIEW || status === LeadStatus.CALLBACK) {
    return "interview";
  }
  if (status === LeadStatus.APPLIED) return "applied";
  return "todo";
}

export function experienceRange(years: number) {
  if (years >= 10) return "10+ years";
  if (years >= 7) return "7-9 years";
  if (years >= 4) return "4-6 years";
  return "0-3 years";
}

export function formatList(values: string[], limit = 4) {
  return values.length > 0 ? values.slice(0, limit).join(", ") : "";
}

/**
 * Whole-day difference between two dates, ignoring the time of day, so
 * "due today" stays "due today" regardless of when the page is rendered.
 */
export function calendarDaysBetween(from: Date, to: Date) {
  const startOfFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const startOfTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((startOfTo - startOfFrom) / 86_400_000);
}

/** Human label for a follow-up date relative to `now`, e.g. `Overdue by 3 days`. */
export function describeFollowUp(followUpDate: Date, now: Date) {
  const days = calendarDaysBetween(now, followUpDate);
  if (days < -1) return `Overdue by ${Math.abs(days)} days`;
  if (days === -1) return "Overdue by 1 day";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}
