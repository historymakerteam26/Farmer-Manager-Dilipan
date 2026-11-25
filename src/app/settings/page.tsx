"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/components/common/Toast";
import {
  Settings as SettingsIcon,
  User,
  ShieldCheck,
  Clock,
  Sparkles,
  Loader2,
  Database,
  CheckCircle2,
  Cloud,
} from "lucide-react";
import { IUser } from "@/types";

export default function SettingsPage() {
  const { success, error: toastError } = useToast();
  const [user, setUser] = useState<IUser | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // ignore
      }
    };
    fetchUser();
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        success(data.message || "Database seeded successfully!");
      } else {
        toastError(data.error || "Failed to seed demo data");
      }
    } catch {
      toastError("Network error while seeding database");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <AppLayout title="System Settings">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-100 text-primary-800">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Settings & Configuration
            </h2>
            <p className="text-xs text-slate-500">
              Manage account profile, localization preferences, and cloud integrations.
            </p>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-primary-700" />
            <span>Current Session Profile</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Name</span>
              <div className="text-sm font-bold text-slate-900 mt-1">{user?.name || "Dilipan"}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Mail</span>
              <div className="text-sm font-bold text-slate-900 mt-1">{user?.email || "gvinsemination@gmail.com"}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Designation</span>
              <div className="text-sm font-bold text-emerald-800 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{user?.role === "admin" ? "Artificial Inseminator" : "Staff"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Localization */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-700" />
            <span>Business Logic & Regional Settings</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Timezone</span>
              <div className="text-sm font-extrabold text-slate-800">Asia/Kolkata (IST +05:30)</div>
              <p className="text-[11px] text-slate-500">
                All AI dates, pregnancy diagnosis schedules (Day 90), and calving schedules calculate in Indian Standard Time.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Date Formatting</span>
              <div className="text-sm font-extrabold text-slate-800">DD-MM-YYYY (Indian Standard)</div>
              <p className="text-[11px] text-slate-500">
                Tables, export files, and profiles display dates consistently in standard Indian format.
              </p>
            </div>
          </div>
        </div>

        {/* Cloud & Database Integrations Status */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-primary-700" />
            <span>Integrations & Cloud Services</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-950">MongoDB Atlas / Mongoose</div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Connected with reusable connection pooling and automatic indexes for lightning-fast queries.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
              <Cloud className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-950">Cloudinary Image Storage</div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Integrated with Cloudinary API and built-in safe fallback for farmer, cow, and calf photos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seed Demo Data Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Developer Demo Database Reset
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Need to seed or reset realistic sample Indian dairy farmers, cows, AI records, and follow-ups? Click below to populate the database.
          </p>
          <div className="pt-2">
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary-700 hover:bg-primary-800 rounded-xl transition-all disabled:opacity-50"
            >
              {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Seed Realistic Indian Dairy Data</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
