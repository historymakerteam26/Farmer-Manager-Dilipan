"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FollowUpModal } from "@/components/follow-ups/FollowUpModal";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { formatDateIndian } from "@/lib/utils";
import { IAIRecord } from "@/types";
import {
  CalendarClock,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  Phone,
  Edit2,
  RefreshCw,
  Baby,
} from "lucide-react";
import Link from "next/link";

function FollowUpsContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "overdue";

  const [activeTab, setActiveTab] = useState(initialType);
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    overdueCount: 0,
    todayCount: 0,
    upcomingCount: 0,
    pendingPdCount: 0,
    completedCount: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<IAIRecord | null>(null);

  const fetchFollowUps = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        type: activeTab,
        search: search.trim(),
      });

      const res = await fetch(`/api/follow-ups?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error("Failed to load follow-ups:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFollowUps();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchFollowUps]);

  const tabs = [
    {
      id: "overdue",
      label: "Overdue",
      count: summary.overdueCount,
      badgeColor: "bg-red-600 text-white",
      activeColor: "border-red-600 text-red-600 bg-red-50/50",
    },
    {
      id: "today",
      label: "Today's Checks",
      count: summary.todayCount,
      badgeColor: "bg-amber-500 text-white",
      activeColor: "border-amber-500 text-amber-700 bg-amber-50/50",
    },
    {
      id: "upcoming",
      label: "Upcoming (7d)",
      count: summary.upcomingCount,
      badgeColor: "bg-blue-600 text-white",
      activeColor: "border-blue-600 text-blue-700 bg-blue-50/50",
    },
    {
      id: "pending",
      label: "All Pending PD",
      count: summary.pendingPdCount,
      badgeColor: "bg-slate-700 text-white",
      activeColor: "border-slate-700 text-slate-800 bg-slate-50",
    },
    {
      id: "completed",
      label: "Completed",
      count: summary.completedCount,
      badgeColor: "bg-emerald-600 text-white",
      activeColor: "border-emerald-600 text-emerald-800 bg-emerald-50/50",
    },
    {
      id: "all",
      label: "All Records",
      count: summary.total,
      badgeColor: "bg-slate-400 text-white",
      activeColor: "border-primary-700 text-primary-800 bg-emerald-50/40",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary-700" />
            <span>Follow-up & Diagnosis Management</span>
          </h2>
          <p className="text-xs text-slate-500">
            Field tracker for Pregnancy Diagnoses (Day 90 Post-AI) and Calving schedules.
          </p>
        </div>

        <button
          onClick={fetchFollowUps}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Dynamic Tab Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? tab.activeColor
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? tab.badgeColor : "bg-slate-100 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by cow name, tag ID, farmer name, mobile number, or straw code..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {/* Follow-ups List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-xl">
              ✓
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              No follow-ups in this queue
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Everything in &quot;{tabs.find((t) => t.id === activeTab)?.label}&quot; is up to date!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Cow & Farmer</th>
                  <th className="py-3 px-4">AI Date</th>
                  <th className="py-3 px-4">Heat Check</th>
                  <th className="py-3 px-4">Target PD Date</th>
                  <th className="py-3 px-4 text-center">Current Status</th>
                  <th className="py-3 px-4">Follow-up Due</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records.map((rec) => {
                  const farmer = rec.farmerId as any;
                  const isCompleted = ["Pregnant", "Not Pregnant", "Failed"].includes(
                    rec.pdStatus
                  );

                  return (
                    <tr
                      key={rec._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Cow & Farmer */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/ai-records/${rec._id}`}
                          className="group-hover:text-primary-700"
                        >
                          <div className="font-bold text-slate-900 group-hover:text-primary-700 flex items-center gap-1.5">
                            <span>{rec.cowName || `Cow ${rec.cowId}`}</span>
                            <span className="text-[10px] font-normal text-slate-400">
                              (Tag: {rec.cowId})
                            </span>
                          </div>
                          {farmer && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Farmer: <strong>{farmer.name}</strong> • 📍 {farmer.village}
                            </div>
                          )}
                        </Link>
                      </td>

                      {/* AI Date */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {formatDateIndian(rec.aiDate)}
                      </td>

                      {/* Heat Check */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={rec.heatResult} type="heat" />
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatDateIndian(rec.heatCheckDate)}
                        </div>
                      </td>

                      {/* PD Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {formatDateIndian(rec.pdDate)}
                      </td>

                      {/* PD Status */}
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={rec.pdStatus} type="pd" />
                      </td>

                      {/* Urgency Badge */}
                      <td className="py-3.5 px-4">
                        {isCompleted ? (
                          <StatusBadge status="Completed" type="urgency" />
                        ) : rec.followUpCategory === "overdue" ? (
                          <StatusBadge status="Overdue" type="urgency" />
                        ) : rec.followUpCategory === "today" ? (
                          <StatusBadge status="Today" type="urgency" />
                        ) : (
                          <StatusBadge status="Scheduled" type="urgency" />
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordForModal(rec)}
                          className="px-3 py-1.5 text-xs font-semibold bg-primary-700 hover:bg-primary-800 text-white rounded-xl shadow-xs transition-all"
                        >
                          Update Result
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Follow-up Update Modal */}
      {selectedRecordForModal && (
        <FollowUpModal
          record={selectedRecordForModal}
          isOpen={Boolean(selectedRecordForModal)}
          onClose={() => setSelectedRecordForModal(null)}
          onSuccess={fetchFollowUps}
        />
      )}
    </div>
  );
}

export default function FollowUpsPage() {
  return (
    <AppLayout title="Follow-up Management">
      <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading follow-ups...</div>}>
        <FollowUpsContent />
      </Suspense>
    </AppLayout>
  );
}
