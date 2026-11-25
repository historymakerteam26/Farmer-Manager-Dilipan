"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle,
  Users,
  Activity,
  FileText,
} from "lucide-react";

export default function ReportsPage() {
  const [villages, setVillages] = useState<string[]>([]);
  const [selectedVillage, setSelectedVillage] = useState("all");
  const [selectedPdStatus, setSelectedPdStatus] = useState("all");

  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const res = await fetch("/api/farmers?limit=1");
        if (res.ok) {
          const data = await res.json();
          setVillages(data.villages || []);
        }
      } catch {
        // ignore
      }
    };
    fetchVillages();
  }, []);

  const getFilteredExcelUrl = () => {
    const params = new URLSearchParams({
      format: "excel",
      village: selectedVillage,
      pdStatus: selectedPdStatus,
    });
    return `/api/reports/ai-records?${params.toString()}`;
  };

  const getFilteredCsvUrl = () => {
    const params = new URLSearchParams({
      format: "csv",
      village: selectedVillage,
      pdStatus: selectedPdStatus,
    });
    return `/api/reports/ai-records?${params.toString()}`;
  };

  return (
    <AppLayout title="Reports & Data Export">
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#166534] to-[#14532d] p-6 md:p-8 rounded-3xl text-white shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl mb-3">
            📊
          </div>
          <h2 className="text-xl md:text-2xl font-black">
            Reports & Export Center
          </h2>
          <p className="text-xs text-emerald-200 mt-1 max-w-xl">
            Generate and export official dairy breeding reports, farmer rolls, and AI records into professional formatted Excel (.xlsx) spreadsheets or raw CSV formats.
          </p>
        </div>

        {/* 1. Quick Full Exports */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Farmers Export */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Full Farmer Directory Report
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Download a complete roster of all registered dairy farmers with mobile numbers, village clusters, and registration dates.
                </p>
              </div>
            </div>

            <a
              href="/api/reports/farmers?format=csv"
              download
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download Farmers List (CSV)</span>
            </a>
          </div>

          {/* Complete AI Records Excel */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-[#DCFCE7] text-[#166534] shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Comprehensive AI Master Sheet (Excel)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Formatted spreadsheet created with ExcelJS including farmer names, cow tag IDs, bull breeds, heat checks, and colored PD statuses.
                </p>
              </div>
            </div>

            <a
              href="/api/reports/ai-records?format=excel"
              download
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-primary-700 hover:bg-primary-800 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download AI Records (Excel .xlsx)</span>
            </a>
          </div>
        </div>

        {/* 2. Custom Filtered Reports */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Filter className="w-4 h-4 text-primary-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Custom Filtered Report Builder
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Filter by Village
              </label>
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white"
              >
                <option value="all">All Villages (Entire Region)</option>
                {villages.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Filter by Pregnancy Status (PD)
              </label>
              <select
                value={selectedPdStatus}
                onChange={(e) => setSelectedPdStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white"
              >
                <option value="all">All PD Statuses</option>
                <option value="Pregnant">Pregnant (Positive Only)</option>
                <option value="Pending">Pending Check Only</option>
                <option value="Not Pregnant">Not Pregnant (Negative)</option>
                <option value="Recheck Required">Recheck Required</option>
                <option value="Failed">Failed / Aborted</option>
              </select>
            </div>
          </div>

          {/* Action Download Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
            <a
              href={getFilteredCsvUrl()}
              download
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Export Filtered CSV</span>
            </a>

            <a
              href={getFilteredExcelUrl()}
              download
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-primary-700 hover:bg-primary-800 rounded-xl transition-all shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Generate Filtered Excel (.xlsx)</span>
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
