import React from "react";
import { LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  href?: string;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
}) => {
  const variantStyles = {
    default: {
      border: "border-slate-200/80",
      bgIcon: "bg-emerald-50 text-emerald-700",
      accent: "text-slate-900",
    },
    success: {
      border: "border-emerald-200",
      bgIcon: "bg-[#DCFCE7] text-[#166534]",
      accent: "text-[#166534]",
    },
    warning: {
      border: "border-amber-200",
      bgIcon: "bg-amber-50 text-amber-700",
      accent: "text-amber-800",
    },
    danger: {
      border: "border-red-200",
      bgIcon: "bg-red-50 text-red-600",
      accent: "text-red-700",
    },
    info: {
      border: "border-blue-200",
      bgIcon: "bg-blue-50 text-blue-700",
      accent: "text-blue-800",
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`p-5 rounded-2xl bg-white border ${style.border} shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </div>
          <div className={`mt-2 text-3xl font-extrabold tracking-tight ${style.accent}`}>
            {value}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${style.bgIcon} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {subtitle && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
          {subtitle}
        </div>
      )}
    </div>
  );
};
