"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  CalendarClock,
  FileSpreadsheet,
  IndianRupee,
  Database,
  Settings,
  Layers,
  LogOut,
  X,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { IUser } from "@/types";

interface SidebarProps {
  user: IUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      name: "Farmers",
      href: "/farmers",
      icon: Users,
      adminOnly: false,
    },
    {
      name: "AI Records",
      href: "/ai-records",
      icon: Activity,
      adminOnly: false,
    },
    {
      name: "Follow-ups",
      href: "/follow-ups",
      icon: CalendarClock,
      adminOnly: false,
      badge: "Action Required",
    },
    {
      name: "Payment Pending",
      href: "/payments",
      icon: IndianRupee,
      adminOnly: false,
    },
    {
      name: "Straw Stock",
      href: "/straws",
      icon: Layers,
      adminOnly: false,
    },
    {
      name: "Reports & Export",
      href: "/reports",
      icon: FileSpreadsheet,
      adminOnly: false,
    },
    {
      name: "Backup & Restore",
      href: "/backup",
      icon: Database,
      adminOnly: true,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      adminOnly: false,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#166534] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } shadow-2xl lg:shadow-none border-r border-emerald-800/40`}
      >
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between p-5 border-b border-emerald-800/60">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-lime-300 text-emerald-950 flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform">
                <span className="text-xl">🐄</span>
              </div>
              <div>
                <div className="font-extrabold tracking-tight text-lg text-white group-hover:text-emerald-200 transition-colors">
                  AI REGISTER
                </div>
                <div className="text-[11px] text-emerald-300/80 font-medium tracking-wide uppercase">
                  Artificial Insemination
                </div>
              </div>
            </Link>

            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-800/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
            <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-emerald-300/60">
              Core Modules
            </div>

            {navItems.map((item) => {
              // Hide admin-only items if user is not admin
              if (item.adminOnly && user?.role !== "admin") {
                return null;
              }

              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all group ${
                    isActive
                      ? "bg-[#DCFCE7] text-[#166534] shadow-sm font-semibold"
                      : "text-emerald-100/90 hover:bg-emerald-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive
                          ? "text-[#166534]"
                          : "text-emerald-300 group-hover:text-emerald-100"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && !isActive && (
                    <span className="text-[10px] bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full">
                      !
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-[#166534]" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Sign Out */}
        <div className="p-4 border-t border-emerald-800/60 bg-emerald-900/40">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-700/80 border border-emerald-500/30 flex items-center justify-center font-bold text-white shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {user?.name || "Dilipan"}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 truncate">
                {user?.role === "admin" ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="font-medium text-amber-200">Artificial Inseminator</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>Staff</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-200 hover:text-white bg-emerald-800/40 hover:bg-red-600/80 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
