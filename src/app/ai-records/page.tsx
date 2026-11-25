"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FollowUpModal } from "@/components/follow-ups/FollowUpModal";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { useToast } from "@/components/common/Toast";
import { formatDateIndian } from "@/lib/utils";
import { IAIRecord, PDStatus, HeatResult } from "@/types";
import {
  Activity,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Download,
  Calendar,
  X,
  FileSpreadsheet,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import { addDays } from "date-fns";

export default function AIRecordsPage() {
  const { success, error: toastError } = useToast();

  const [records, setRecords] = useState<IAIRecord[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [village, setVillage] = useState("all");
  const [pdStatus, setPdStatus] = useState("all");
  const [heatResult, setHeatResult] = useState("all");
  const [calvingStatus, setCalvingStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("aiDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<IAIRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<IAIRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search.trim(),
        village,
        pdStatus,
        heatResult,
        calvingStatus,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/ai-records?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      }
    } catch {
      toastError("Failed to load AI records");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, village, pdStatus, heatResult, calvingStatus, startDate, endDate, sortBy, sortOrder, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  // Fetch villages for dropdown filter
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

  const handleClearFilters = () => {
    setSearch("");
    setVillage("all");
    setPdStatus("all");
    setHeatResult("all");
    setCalvingStatus("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasActiveFilters =
    search ||
    village !== "all" ||
    pdStatus !== "all" ||
    heatResult !== "all" ||
    calvingStatus !== "all" ||
    startDate ||
    endDate;

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/ai-records/${recordToDelete._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to delete AI record");
        return;
      }
      success("AI Record deleted successfully!");
      setRecordToDelete(null);
      fetchRecords();
    } catch {
      toastError("Failed to delete record");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout title="Cow AI Records">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              AI Insemination Records
            </h2>
            <p className="text-xs text-slate-500">
              Complete searchable registry of cow inseminations, semen pedigree, and follow-ups.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Export Excel button using ExcelJS */}
            <a
              href="/api/reports/ai-records?format=excel"
              download
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-[#DCFCE7] hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary-700" />
              <span>Export Excel</span>
            </a>

            <Link
              href="/ai-records/new"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-700 hover:bg-primary-800 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New AI Record</span>
            </Link>
          </div>
        </div>

        {/* Search & Advanced Filters Panel */}
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-xs space-y-4">
          {/* Main search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by cow name, tag ID, farmer name, mobile number, bull name, or straw code..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
            {/* Village */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Village
              </label>
              <select
                value={village}
                onChange={(e) => {
                  setVillage(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="all">All Villages</option>
                {villages.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* PD Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                PD Status
              </label>
              <select
                value={pdStatus}
                onChange={(e) => {
                  setPdStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="all">All PD Status</option>
                <option value="Pending">Pending</option>
                <option value="Pregnant">Pregnant</option>
                <option value="Not Pregnant">Not Pregnant</option>
                <option value="Recheck Required">Recheck Required</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            {/* Heat Result */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Heat Result
              </label>
              <select
                value={heatResult}
                onChange={(e) => {
                  setHeatResult(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="all">All Heat Results</option>
                <option value="Not Checked">Not Checked</option>
                <option value="Heat Detected">Heat Detected</option>
                <option value="No Heat">No Heat</option>
                <option value="Recheck Required">Recheck Required</option>
              </select>
            </div>

            {/* Calving Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Calving
              </label>
              <select
                value={calvingStatus}
                onChange={(e) => {
                  setCalvingStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="all">All</option>
                <option value="calved">Delivered (Calved)</option>
                <option value="not_calved">Not Yet Calved</option>
              </select>
            </div>

            {/* AI Date From */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                AI Date From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700"
              />
            </div>

            {/* AI Date To */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                AI Date To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Clear Filters indicator */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span>Active filters applied</span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 font-bold text-red-600 hover:text-red-700"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* AI Records Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={6} />
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="text-3xl">🐄</div>
              <h3 className="text-sm font-bold text-slate-800">No AI records found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No cow inseminations match your current search and filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="text-xs text-primary-700 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Cow Details</th>
                    <th className="py-3 px-4">Farmer</th>
                    <th className="py-3 px-4">AI Date</th>
                    <th className="py-3 px-4">Bull / Semen</th>
                    <th className="py-3 px-4">Heat Check</th>
                    <th className="py-3 px-4">Target PD</th>
                    <th className="py-3 px-4 text-center">PD Status</th>
                    <th className="py-3 px-4">Calving</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {records.map((rec) => {
                    const farmer = rec.farmerId as any;
                    return (
                      <tr
                        key={rec._id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Cow Details */}
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/ai-records/${rec._id}`}
                            className="flex items-center gap-2.5 group-hover:text-primary-700"
                          >
                            {rec.cowPhotoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={rec.cowPhotoUrl}
                                alt=""
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-sm font-bold shrink-0">
                                🐄
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-primary-700 flex items-center gap-1.5 flex-wrap">
                                <span>{rec.cowName || rec.cowId}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    (rec.attemptNumber || 1) > 1
                                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                                      : "bg-slate-100 text-slate-700 border border-slate-200"
                                  }`}
                                >
                                  Attempt {rec.attemptNumber || 1}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-normal">
                                Tag: {rec.cowId} • {rec.cattleType || "Cow"} • {rec.cowBreed || "Cross"}
                              </div>
                            </div>
                          </Link>
                        </td>

                        {/* Farmer */}
                        <td className="py-3.5 px-4">
                          {farmer ? (
                            <Link
                              href={`/farmers/${farmer._id}`}
                              className="hover:text-primary-700"
                            >
                              <div className="font-bold text-slate-900">
                                {farmer.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                📱 {farmer.mobile} • {farmer.village}
                              </div>
                            </Link>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* AI Date */}
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {formatDateIndian(rec.aiDate)}
                        </td>

                        {/* Bull / Straw */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">
                            {rec.bullName || "N/A"}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {rec.semenBreed || ""} {rec.strawCode ? `• ${rec.strawCode}` : ""}
                          </div>
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
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <StatusBadge status={rec.pdStatus} type="pd" />
                            {(rec.pdStatus === "Failed" || rec.pdStatus === "Not Pregnant") && (
                              <Link
                                href={`/ai-records/new?farmerId=${farmer?._id || (typeof rec.farmerId === "string" ? rec.farmerId : (rec.farmerId as any)?._id || "")}&cowId=${encodeURIComponent(rec.cowId)}&cowName=${encodeURIComponent(rec.cowName || "")}&cattleType=${encodeURIComponent(rec.cattleType || "Cow")}&cowBreed=${encodeURIComponent(rec.cowBreed || "")}&cowPhotoUrl=${encodeURIComponent(rec.cowPhotoUrl || "")}&attemptNumber=${(rec.attemptNumber || 1) + 1}&prevId=${rec._id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg shadow-xs transition-all whitespace-nowrap active:scale-95"
                                title="Register 2nd / Repeat Attempt for this cow"
                              >
                                <RotateCw className="w-2.5 h-2.5" />
                                <span>Re-attempt ({((rec.attemptNumber || 1) + 1)}nd)</span>
                              </Link>
                            )}
                          </div>
                        </td>

                        {/* Calving */}
                        <td className="py-3.5 px-4">
                          {rec.calvingDate ? (
                            <div className="font-semibold text-emerald-800 flex items-center gap-1 text-xs">
                              <span>👶</span>
                              <div>
                                <span>{formatDateIndian(rec.calvingDate)}</span>
                                <div className="text-[10px] text-emerald-600 font-normal">Delivered</div>
                              </div>
                            </div>
                          ) : rec.aiDate ? (
                            <div className="text-xs">
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <span>📅</span>
                                <span>
                                  {formatDateIndian(
                                    rec.expectedCalvingDate || addDays(new Date(rec.aiDate), 283)
                                  )}
                                </span>
                              </div>
                              <div className="text-[10px] text-primary-700 font-medium">
                                Expected (283d)
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedRecordForModal(rec)}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition-colors"
                            >
                              Update
                            </button>
                            <Link
                              href={`/ai-records/${rec._id}`}
                              className="p-1.5 text-slate-400 hover:text-primary-700 rounded-lg hover:bg-slate-100"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/ai-records/${rec._id}/edit`}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                              title="Edit Record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setRecordToDelete(rec)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={(p) => setPage(p)}
            itemName="AI records"
          />
        </div>
      </div>

      {/* Follow-up Update Modal */}
      {selectedRecordForModal && (
        <FollowUpModal
          record={selectedRecordForModal}
          isOpen={Boolean(selectedRecordForModal)}
          onClose={() => setSelectedRecordForModal(null)}
          onSuccess={fetchRecords}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(recordToDelete)}
        title="Delete AI Record?"
        message={`Are you sure you want to delete AI record ${recordToDelete?.aiRecordId} for cow '${recordToDelete?.cowName || recordToDelete?.cowId}'?`}
        confirmText="Delete Record"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteRecord}
        onCancel={() => setRecordToDelete(null)}
      />
    </AppLayout>
  );
}
