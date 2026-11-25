import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isBefore, startOfDay, addDays } from "date-fns";

export const TIMEZONE = "Asia/Kolkata";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateIndian(dateInput?: string | Date | null): string {
  if (!dateInput) return "-";
  try {
    const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date).replace(/\//g, "-");
  } catch {
    return "-";
  }
}

export function formatDateTimeIndian(dateInput?: string | Date | null): string {
  if (!dateInput) return "-";
  try {
    const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "-";
  }
}

export function toInputDateFormat(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  try {
    const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "";
    return format(date, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

export type FollowUpUrgency = "completed" | "overdue" | "today" | "upcoming" | "none";

export function getFollowUpStatus(
  targetDateInput?: string | Date | null,
  status?: string
): { urgency: FollowUpUrgency; label: string; badgeColor: string } {
  if (status && ["Pregnant", "Not Pregnant", "Failed"].includes(status)) {
    return {
      urgency: "completed",
      label: "Completed",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    };
  }

  if (!targetDateInput) {
    return {
      urgency: "none",
      label: "Not Scheduled",
      badgeColor: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  try {
    const date = typeof targetDateInput === "string" ? parseISO(targetDateInput) : targetDateInput;
    if (isNaN(date.getTime())) {
      return {
        urgency: "none",
        label: "Invalid Date",
        badgeColor: "bg-slate-100 text-slate-600 border-slate-200",
      };
    }

    const today = startOfDay(new Date());
    const targetDay = startOfDay(date);

    if (isBefore(targetDay, today)) {
      return {
        urgency: "overdue",
        label: "Overdue",
        badgeColor: "bg-red-100 text-red-700 border-red-300",
      };
    }

    if (targetDay.getTime() === today.getTime()) {
      return {
        urgency: "today",
        label: "Today",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      };
    }

    const sevenDaysFromNow = addDays(today, 7);
    if (isBefore(targetDay, sevenDaysFromNow)) {
      return {
        urgency: "upcoming",
        label: "Upcoming (7d)",
        badgeColor: "bg-blue-100 text-blue-700 border-blue-300",
      };
    }

    return {
      urgency: "upcoming",
      label: "Scheduled",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    };
  } catch {
    return {
      urgency: "none",
      label: "Unknown",
      badgeColor: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }
}
