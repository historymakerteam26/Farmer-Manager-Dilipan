"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FollowUpModal } from "@/components/follow-ups/FollowUpModal";
import { StrawStockModal } from "@/components/straws/StrawStockModal";
import { formatDateIndian, formatDateTimeIndian } from "@/lib/utils";
import {
  Users,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Baby,
  CalendarCheck,
  ChevronRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  IndianRupee,
  Wallet,
  Layers,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const PIE_COLORS = ["#166534", "#22c55e", "#eab308", "#f97316", "#ef4444", "#a855f7"];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<any>(null);
  const [isStrawModalOpen, setIsStrawModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reports/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = data?.stats || {
    totalFarmers: 0,
    totalAIRecords: 0,
    pdCompleted: 0,
    pdPending: 0,
    pdOverdue: 0,
    totalCalvings: 0,
    totalPendingPayment: 0,
    pendingPaymentCount: 0,
  };

  const charts = data?.charts || {
    monthlyAIRegistrations: [],
    villageDistribution: [],
    pdStatusDistribution: [],
    monthlyCalvings: [],
  };

  return (
    <AppLayout title="Dilipan AI Dashboard">
      <div className="space-y-8">
        {/* Top Welcome & Refresh Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-[#166534] p-6 rounded-3xl text-white shadow-sm">
          <div>
            <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Live Field CRM
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              Dairy Herd & AI Operations
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1">
              Monitor inseminations, pregnancy diagnosis follow-ups, and calf registrations in real-time.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-xl backdrop-blur-xs transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Stats</span>
          </button>
        </div>

        {/* Key Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          <DashboardStatCard
            title="Farmers"
            value={stats.totalFarmers}
            subtitle="Registered producers"
            icon={Users}
            variant="default"
          />
          <DashboardStatCard
            title="Total AI"
            value={stats.totalAIRecords}
            subtitle="All inseminations"
            icon={Activity}
            variant="info"
          />
          <DashboardStatCard
            title="PD Completed"
            value={stats.pdCompleted}
            subtitle="Examined cows"
            icon={CheckCircle2}
            variant="success"
          />
          <DashboardStatCard
            title="PD Pending"
            value={stats.pdPending}
            subtitle="Awaiting diagnosis"
            icon={Clock}
            variant="warning"
          />
          <DashboardStatCard
            title="PD Overdue"
            value={stats.pdOverdue}
            subtitle="Needs urgent visit"
            icon={AlertTriangle}
            variant="danger"
          />
          <DashboardStatCard
            title="Calvings"
            value={stats.totalCalvings}
            subtitle="Delivered calves"
            icon={Baby}
            variant="success"
          />
          <DashboardStatCard
            title="Payment Pending"
            value={`₹${(stats.totalPendingPayment || 0).toLocaleString("en-IN")}`}
            subtitle={`${stats.pendingPaymentCount || 0} dues pending`}
            icon={IndianRupee}
            variant="warning"
          />
        </div>

        {/* STRAW STOCK LIST (Matches Handwritten Dashboard Diagram) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200/80 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span>STRAW STOCK LIST</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 lowercase border border-emerald-300">
                    show count
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Total Semen Straws in Tank: <strong className="text-emerald-950 font-black">{(data?.strawStocks || []).reduce((acc: number, c: any) => acc + (c.strawCount || 0), 0)} straws</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsStrawModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-all self-start sm:self-auto border border-emerald-300 shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-900" />
              <span>Update Straw Stock</span>
            </button>
          </div>

          {/* Straw Pills Grid matching user drawing: HF (500), Jy (300), 94100(CFS) (50), CBHF (100), GIR (10), KANGAYAM (20) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
            {(data?.strawStocks && data.strawStocks.length > 0
              ? data.strawStocks
              : [
                  { strawTitle: "HF", strawCount: 500 },
                  { strawTitle: "Jy", strawCount: 300 },
                  { strawTitle: "94100(CFS)", strawCount: 50 },
                  { strawTitle: "CBHF", strawCount: 100 },
                  { strawTitle: "GIR", strawCount: 10 },
                  { strawTitle: "KANGAYAM", strawCount: 20 },
                ]
            ).map((st: any) => {
              const isLow = st.strawCount < 15;
              const isOut = st.strawCount === 0;

              return (
                <div
                  key={st._id || st.strawTitle}
                  onClick={() => setIsStrawModalOpen(true)}
                  className={`cursor-pointer p-3 rounded-2xl border text-center transition-all hover:scale-[1.02] flex flex-col justify-between ${
                    isOut
                      ? "bg-rose-50 border-rose-300 text-rose-900"
                      : isLow
                      ? "bg-amber-50/80 border-amber-300 text-amber-950"
                      : "bg-[#F0FDF4] border-emerald-200 text-emerald-950 hover:border-emerald-400"
                  }`}
                  title="Click to update straw count"
                >
                  <div className="font-extrabold text-xs truncate" title={st.strawTitle}>
                    {st.strawTitle}
                  </div>
                  <div className="text-xl sm:text-2xl font-black mt-1 text-slate-900">
                    {st.strawCount}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {isLow ? "⚠️ Low Stock" : "Available"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Field Navigation Actions (Matching handwritten layout) */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-600" />
            <span>Quick Module Shortcuts</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/farmers/new"
              className="px-4 py-2 text-xs font-bold text-emerald-900 bg-emerald-100/90 hover:bg-emerald-200 rounded-xl transition-all shadow-2xs"
            >
              + Farmer Registration
            </Link>
            <Link
              href="/ai-records/new"
              className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-2xs"
            >
              + AI Registration
            </Link>
            <Link
              href="/payments"
              className="px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100/90 hover:bg-amber-200 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 border border-amber-300/80"
            >
              <IndianRupee className="w-3.5 h-3.5 text-amber-800" />
              <span>Payment Pending Account</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsStrawModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-emerald-950 bg-emerald-100/90 hover:bg-emerald-200 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 border border-emerald-300"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-800" />
              <span>Straw Stock List Update</span>
            </button>
          </div>
        </div>

        {/* Action Alerts Section: Overdue & Upcoming Follow-ups */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Follow-ups */}
          <div className="bg-white rounded-2xl p-5 border border-red-200/70 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-red-100 text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-950">
                      Overdue Follow-ups ({stats.pdOverdue || 0})
                    </h3>
                    <p className="text-[11px] text-red-700/80">
                      Cows passed target check date requiring immediate visit
                    </p>
                  </div>
                </div>
                <Link
                  href="/follow-ups?type=overdue"
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {!data?.overdueFollowUps?.length ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium">
                    🎉 Excellent! No overdue follow-ups right now.
                  </div>
                ) : (
                  data.overdueFollowUps.slice(0, 4).map((rec: any) => (
                    <div
                      key={rec._id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {rec.cowName || rec.cowId}{" "}
                          <span className="text-slate-400 font-normal">
                            ({rec.farmerId?.name || "Farmer"})
                          </span>
                        </div>
                        <div className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-0.5">
                          <span>Target PD: {formatDateIndian(rec.pdDate)}</span>
                          <span>• {rec.farmerId?.village || ""}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedRecordForModal(rec)}
                        className="px-2.5 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shrink-0"
                      >
                        Update
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Follow-ups (Next 7 Days) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Upcoming Follow-ups (7 Days)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Planned PD checks for the current week
                    </p>
                  </div>
                </div>
                <Link
                  href="/follow-ups?type=upcoming"
                  className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {!data?.upcomingFollowUps?.length ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium">
                    No upcoming follow-ups scheduled for the next 7 days.
                  </div>
                ) : (
                  data.upcomingFollowUps.slice(0, 4).map((rec: any) => (
                    <div
                      key={rec._id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {rec.cowName || rec.cowId}{" "}
                          <span className="text-slate-400 font-normal">
                            ({rec.farmerId?.name || "Farmer"})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <span>Date: {formatDateIndian(rec.pdDate)}</span>
                          <span>• {rec.farmerId?.village || ""}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedRecordForModal(rec)}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition-colors shrink-0"
                      >
                        Check
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Monthly AI Registrations */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Monthly AI Inseminations
                </h3>
                <p className="text-[11px] text-slate-500">
                  Trend across recent months
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyAIRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#166534" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: PD Status Distribution (Donut Chart) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Pregnancy Diagnosis (PD) Distribution
                </h3>
                <p className="text-[11px] text-slate-500">
                  Confirmed vs Pending vs Negative
                </p>
              </div>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Pie
                    data={charts.pdStatusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {charts.pdStatusDistribution.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2 border-t border-slate-100">
              {charts.pdStatusDistribution.map((entry: any, index: number) => (
                <div key={entry.status} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span>
                    {entry.status}: <strong>{entry.count}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 3: Village Distribution */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Farmer Distribution by Village
                </h3>
                <p className="text-[11px] text-slate-500">
                  Top clusters in coverage area
                </p>
              </div>
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={charts.villageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="village" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#22c55e" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Monthly Calvings */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Monthly Calving Deliveries
                </h3>
                <p className="text-[11px] text-slate-500">
                  Recorded successful births
                </p>
              </div>
              <Baby className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.monthlyCalvings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#166534"
                    strokeWidth={3}
                    dot={{ fill: "#166534", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Farmer Registrations & Recent AI Records Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Farmers */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Recent Farmer Registrations
              </h3>
              <Link
                href="/farmers"
                className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {data?.recentFarmers?.map((farmer: any) => (
                <Link
                  key={farmer._id}
                  href={`/farmers/${farmer._id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0">
                      {farmer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                        {farmer.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        📱 {farmer.mobile} • 📍 {farmer.village}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {formatDateIndian(farmer.createdAt)}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent AI Records */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Recent AI Insemination Records
              </h3>
              <Link
                href="/ai-records"
                className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {data?.recentAIRecords?.map((rec: any) => (
                <Link
                  key={rec._id}
                  href={`/ai-records/${rec._id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                      Cow: {rec.cowName || rec.cowId}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {rec.farmerId?.name || "Farmer"} • Bull: {rec.bullName || "N/A"}
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={rec.pdStatus} type="pd" />
                    <div className="text-[10px] text-slate-400 mt-1">
                      {formatDateIndian(rec.aiDate)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Audit / Activity Logs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Recent System Activity & Insemination Logs
            </h3>
            <span className="text-xs text-slate-400">Live Audit Trail</span>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {data?.recentActivities?.map((act: any) => (
              <div key={act._id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-800">
                    {act.description}
                  </span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Action: <span className="font-medium text-slate-600">{act.action}</span> •
                    Module: <span className="font-medium text-slate-600">{act.module}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-medium shrink-0">
                  {formatDateTimeIndian(act.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Follow-up Modal */}
      {selectedRecordForModal && (
        <FollowUpModal
          record={selectedRecordForModal}
          isOpen={Boolean(selectedRecordForModal)}
          onClose={() => setSelectedRecordForModal(null)}
          onSuccess={fetchDashboardData}
        />
      )}

      {/* Straw Stock Management Modal */}
      <StrawStockModal
        isOpen={isStrawModalOpen}
        onClose={() => setIsStrawModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </AppLayout>
  );
}
