import React from "react";
import { PDStatus, HeatResult } from "@/types";

interface StatusBadgeProps {
  status?: PDStatus | HeatResult | string;
  type?: "pd" | "heat" | "urgency";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = "pd",
  className = "",
}) => {
  if (!status) return null;

  let bgClass = "bg-slate-100 text-slate-700 border-slate-200";

  if (type === "pd") {
    switch (status) {
      case "Pregnant":
        bgClass = "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold";
        break;
      case "Pending":
        bgClass = "bg-amber-100 text-amber-800 border-amber-300 font-medium";
        break;
      case "Not Pregnant":
        bgClass = "bg-rose-100 text-rose-800 border-rose-300 font-medium";
        break;
      case "Recheck Required":
        bgClass = "bg-purple-100 text-purple-800 border-purple-300 font-medium";
        break;
      case "Failed":
        bgClass = "bg-red-100 text-red-800 border-red-300 font-medium";
        break;
      default:
        bgClass = "bg-slate-100 text-slate-700 border-slate-200";
    }
  } else if (type === "heat") {
    switch (status) {
      case "Heat Detected":
        bgClass = "bg-orange-100 text-orange-800 border-orange-300 font-semibold";
        break;
      case "No Heat":
        bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        break;
      case "Recheck Required":
        bgClass = "bg-purple-100 text-purple-800 border-purple-300";
        break;
      case "Not Checked":
        bgClass = "bg-slate-100 text-slate-600 border-slate-200";
        break;
    }
  } else if (type === "urgency") {
    switch (status) {
      case "overdue":
      case "Overdue":
        bgClass = "bg-red-100 text-red-700 border-red-300 font-bold animate-pulse";
        break;
      case "today":
      case "Today":
        bgClass = "bg-amber-100 text-amber-800 border-amber-300 font-semibold";
        break;
      case "upcoming":
      case "Upcoming (7d)":
      case "Scheduled":
        bgClass = "bg-sky-100 text-sky-800 border-sky-300 font-medium";
        break;
      case "completed":
      case "Completed":
        bgClass = "bg-emerald-100 text-emerald-800 border-emerald-300 font-medium";
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${bgClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
      {status}
    </span>
  );
};
