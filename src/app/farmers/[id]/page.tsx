"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "../../../components/layout/AppLayout";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { FollowUpModal } from "../../../components/follow-ups/FollowUpModal";
import { ConfirmationDialog } from "../../../components/common/ConfirmationDialog";
import { useToast } from "../../../components/common/Toast";
import { formatDateIndian } from "../../../lib/utils";
import { IFarmer, IAIRecord } from "../../../types";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Baby,
  FileText,
  IndianRupee,
  Eye,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import { addDays } from "date-fns";

export default function FarmerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const farmerId = params.id as string;

  const [farmer, setFarmer] = useState<IFarmer | null>(null);
  const [stats, setStats] = useState({
    totalAI: 0,
    pregnantCows: 0,
    pendingPD: 0,
    calvingRecords: 0,
  });
  const [aiRecords, setAiRecords] = useState<IAIRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<IAIRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFarmerDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/farmers/${farmerId}`);
      if (!res.ok) {
        toastError("Farmer not found");
        router.push("/farmers");
        return;
      }
      const data = await res.json();
      setFarmer(data.farmer);
      setStats(data.stats);
      setAiRecords(data.aiRecords || []);
    } catch {
      toastError("Failed to fetch farmer details");
    } finally {
      setIsLoading(false);
    }
  }, [farmerId, router, toastError]);

  useEffect(() => {
    fetchFarmerDetails();
  }, [fetchFarmerDetails]);

  const handleDeleteFarmer = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/farmers/${farmerId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to delete farmer");
        return;
      }
      success(data.message || "Farmer deleted successfully");
      router.push("/farmers");
    } catch {
      toastError("Failed to delete farmer");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !farmer) {
    return (
      <AppLayout title="Farmer Profile">
        <div className="py-20 text-center text-xs text-slate-500 font-semibold animate-pulse">
          Loading farmer profile...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Profile: ${farmer.name}`}>
      <div className="space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/farmers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Farmers</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/ai-records/new?farmerId=${farmer._id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary-700 hover:bg-primary-800 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New AI Record</span>
            </Link>

            <Link
              href={`/farmers/${farmer._id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-xs"
            >
              <Edit2 className="w-4 h-4 text-slate-500" />
              <span>Edit</span>
            </Link>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-300 transition-colors"
              title="Delete Farmer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Farmer Profile Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {farmer.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={farmer.photoUrl}
                alt={farmer.name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/30 shadow-md shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-[#DCFCE7] text-[#166534] font-black text-3xl flex items-center justify-center border-2 border-emerald-500/20 shadow-md shrink-0">
                {farmer.name.charAt(0)}
              </div>
            )}

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {farmer.name}
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  ID: {farmer.farmerId}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 font-medium">
                <a
                  href={`tel:${farmer.mobile}`}
                  className="flex items-center gap-1.5 text-primary-800 font-bold hover:underline"
                >
                  <Phone className="w-3.5 h-3.5 text-primary-700" />
                  <span>{farmer.mobile}</span>
                </a>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {farmer.village}
                    {farmer.address ? `, ${farmer.address}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {formatDateIndian(farmer.createdAt)}</span>
                </div>
              </div>

              {farmer.notes && (
                <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                  <strong>Notes:</strong> {farmer.notes}
                </p>
              )}
            </div>
          </div>

          {/* 4 Farmer Performance Badges / Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-center">
              <div className="text-2xl font-black text-slate-900">{stats.totalAI}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Total AI Records
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-center">
              <div className="text-2xl font-black text-emerald-800">{stats.pregnantCows}</div>
              <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mt-0.5">
                Pregnant Cows
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/60 text-center">
              <div className="text-2xl font-black text-amber-800">{stats.pendingPD}</div>
              <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mt-0.5">
                Pending PD Checks
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200/60 text-center">
              <div className="text-2xl font-black text-sky-800">{stats.calvingRecords}</div>
              <div className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider mt-0.5">
                Calvings
              </div>
            </div>
          </div>
        </div>

        {/* Associated AI History Table */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cow Artificial Insemination History
              </h3>
              <p className="text-xs text-slate-500">
                All breeding records, heat results, PD diagnoses, and calving deliveries.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/payments`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200/80 rounded-xl transition-all"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Pending Dues</span>
              </Link>
              <Link
                href={`/ai-records/new?farmerId=${farmer._id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-800 bg-[#DCFCE7] hover:bg-emerald-200/80 rounded-xl transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </Link>
            </div>
          </div>

          {aiRecords.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="text-3xl">🐄</div>
              <div className="text-xs font-bold text-slate-800">
                No cow insemination records yet
              </div>
              <p className="text-xs text-slate-400">
                Click &quot;New AI Record&quot; above to register this farmer&apos;s first cow insemination.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Cow Tag / Name</th>
                    <th className="py-3 px-3">AI Date</th>
                    <th className="py-3 px-3">Semen / Bull</th>
                    <th className="py-3 px-3">Heat Check</th>
                    <th className="py-3 px-3">PD Date</th>
                    <th className="py-3 px-3 text-center">PD Status</th>
                    <th className="py-3 px-3">Calving</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {aiRecords.map((rec) => (
                    <tr key={rec._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Cow */}
                      <td className="py-3 px-3">
                        <Link
                          href={`/ai-records/${rec._id}`}
                          className="font-bold text-slate-900 hover:text-primary-700 flex items-center gap-2"
                        >
                          {rec.cowPhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={rec.cowPhotoUrl}
                              alt=""
                              className="w-7 h-7 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <span className="text-base">🐄</span>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
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
                            <div className="text-[10px] text-slate-400 font-normal">
                              Tag: {rec.cowId} • {rec.cattleType || "Cow"} • {rec.cowBreed || "Cross"}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* AI Date */}
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {formatDateIndian(rec.aiDate)}
                      </td>

                      {/* Bull / Semen */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">
                          {rec.bullName || "N/A"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {rec.semenBreed || ""} {rec.strawCode ? `(${rec.strawCode})` : ""}
                        </div>
                      </td>

                      {/* Heat */}
                      <td className="py-3 px-3">
                        <StatusBadge status={rec.heatResult} type="heat" />
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatDateIndian(rec.heatCheckDate)}
                        </div>
                      </td>

                      {/* PD Date */}
                      <td className="py-3 px-3 font-medium text-slate-600">
                        {formatDateIndian(rec.pdDate)}
                      </td>

                      {/* PD Status */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <StatusBadge status={rec.pdStatus} type="pd" />
                          {(rec.pdStatus === "Failed" || rec.pdStatus === "Not Pregnant") && (
                            <Link
                              href={`/ai-records/new?farmerId=${farmer._id}&cowId=${encodeURIComponent(rec.cowId)}&cowName=${encodeURIComponent(rec.cowName || "")}&cattleType=${encodeURIComponent(rec.cattleType || "Cow")}&cowBreed=${encodeURIComponent(rec.cowBreed || "")}&cowPhotoUrl=${encodeURIComponent(rec.cowPhotoUrl || "")}&attemptNumber=${(rec.attemptNumber || 1) + 1}&prevId=${rec._id}`}
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
                      <td className="py-3 px-3">
                        {rec.calvingDate ? (
                          <div className="font-semibold text-emerald-800 flex items-center gap-1 text-xs">
                            <span>👶</span>
                            <span>{formatDateIndian(rec.calvingDate)}</span>
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
                      <td className="py-3 px-3 text-right">
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
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                            title="View Record Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Follow-up Update Modal */}
      {selectedRecordForModal && (
        <FollowUpModal
          record={selectedRecordForModal}
          isOpen={Boolean(selectedRecordForModal)}
          onClose={() => setSelectedRecordForModal(null)}
          onSuccess={fetchFarmerDetails}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Safe Delete Farmer Profile?"
        message={`Are you sure you want to delete ${farmer.name}? Historical cow records will be kept safe in database archives.`}
        confirmText="Confirm Delete"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteFarmer}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </AppLayout>
  );
}
