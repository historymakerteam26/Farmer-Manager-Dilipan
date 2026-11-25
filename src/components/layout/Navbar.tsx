"use client";

import React, { useState, useEffect } from "react";
import { Menu, Bell, Plus, Search, CalendarClock } from "lucide-react";
import Link from "next/link";
import { IUser } from "@/types";

interface NavbarProps {
  user: IUser | null;
  onOpenSidebar: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onOpenSidebar, title }) => {
  const [overdueCount, setOverdueCount] = useState<number>(0);

  useEffect(() => {
    // Quick polling or fetch of overdue followups for bell badge
    const fetchBadge = async () => {
      try {
        const res = await fetch("/api/follow-ups?type=overdue");
        if (res.ok) {
          const data = await res.json();
          setOverdueCount(data.summary?.overdueCount || 0);
        }
      } catch {
        // ignore
      }
    };
    fetchBadge();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Sidebar Hamburger */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-sm sm:text-base md:text-xl font-bold text-slate-800 tracking-tight truncate max-w-[130px] sm:max-w-xs md:max-w-none">
            {title}
          </h1>
        )}
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Quick Follow-up Alerts */}
        <Link
          href="/follow-ups"
          className="relative p-2 text-slate-600 hover:text-primary-700 hover:bg-emerald-50 rounded-xl transition-all"
          title="Follow-ups Action Required"
        >
          <Bell className="w-5 h-5" />
          {overdueCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full animate-bounce">
              {overdueCount}
            </span>
          )}
        </Link>

        {/* Quick Add Farmer button */}
        <Link
          href="/farmers/new"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-700 hover:bg-primary-800 rounded-xl shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Farmer</span>
        </Link>

        {/* Quick Add AI button */}
        <Link
          href="/ai-records/new"
          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-primary-800 bg-[#DCFCE7] hover:bg-emerald-200/80 rounded-xl transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">New AI Record</span>
          <span className="sm:hidden">New AI</span>
        </Link>

        {/* User initials bubble */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-300 shrink-0">
          {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
        </div>
      </div>
    </header>
  );
};
