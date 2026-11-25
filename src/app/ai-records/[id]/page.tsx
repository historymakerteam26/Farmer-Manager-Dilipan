"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "../../../components/layout/AppLayout";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { FollowUpModal } from "../../../components/follow-ups/FollowUpModal";
import { ConfirmationDialog } from "../../../components/common/ConfirmationDialog";
import { useToast } from "../../../components/common/Toast";
import { formatDateIndian } from "../../../lib/utils";
import { IAIRecord, IFarmer } from "../../../types";
import {
  ArrowLeft,
  Calendar,
  Edit2,
  Trash2,
  User,
  Clock,
  CheckCircle2,
  Baby,
  Tag,
  Dna,
  FileText,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import Link from "next/link";
import { addDays } from "date-fns";

export default function AIRecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const id = params.id as string;

  const [record, setRecord] = useState<IAIRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRecord = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ai-records/${id}`);
      if (!res.ok) {
        toastError("AI Record not found");
        router.push("/ai-records");
        return;
      }
      const data = await res.json();
      setRecord(data.record);
    } catch {
      toastError("Failed to fetch AI record");
    } finally {
      setIsLoading(false);
    }
  }, [id, router, toastError]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/ai-records/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toastError("Failed to delete AI record");
        return;
      }
      success("AI record deleted successfully");
      router.push("/ai-records");
    } catch {
      toastError("Failed to delete record");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !record) {
    return (
      <AppLayout title="AI Record Details">
        <div className="py-20 text-center text-xs text-slate-500 font-semibold animate-pulse">
          Loading AI record details...
        </div>
      </AppLayout>
    );
  }

  const farmer = record.farmerId as unknown as IFarmer;

  return (
    <AppLayout title={`Record: ${record.aiRecordId}`}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/ai-records"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AI Records</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFollowUpModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-[#DCFCE7] hover:bg-emerald-200 rounded-xl transition-all shadow-xs"
            >
              Update Follow-up
            </button>
            <Link
              href={`/ai-records/${record._id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-xs"
            >
              <Edit2 className="w-4 h-4 text-slate-500" />
              <span>Edit</span>
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-300 transition-colors"
              title="Delete Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Summary Banner */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              {record.cowPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={record.cowPhotoUrl}
                  alt={record.cowName || "Cow"}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center text-3xl font-black shrink-0">
                  🐄
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {record.cowName || `Cow ${record.cowId}`}
                  </h2>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {record.cattleType || "Cow"}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    (record.attemptNumber || 1) > 1
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-slate-100 text-slate-700 border border-slate-300"
                  }`}>
                    Attempt {record.attemptNumber || 1}
                  </span>
                  <StatusBadge status={record.pdStatus} type="pd" />
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">
                  Ear Tag / Cow ID: <strong className="text-slate-800">{record.cowId}</strong> • Breed: {record.cowBreed || "Crossbred"}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Record ID: <span className="font-mono font-bold text-primary-800">{record.aiRecordId}</span>
                </div>
              </div>
            </div>

            {/* Insemination Date */}
            <div className="text-left md:text-right bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Insemination Date
              </div>
              <div className="text-base font-extrabold text-slate-800 mt-0.5">
                {formatDateIndian(record.aiDate)}
              </div>
            </div>
          </div>

          {/* Biological Lifecycle Milestones */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Breeding Lifecycle & Milestone Progress
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Step 1: AI */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>1. Insemination</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xs font-extrabold text-emerald-950 mt-1">
                  {formatDateIndian(record.aiDate)}
                </div>
                <div className="text-[10px] text-emerald-700 mt-0.5">Day 0 (Done)</div>
              </div>

              {/* Step 2: Heat Check */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>2. Heat Check</span>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xs font-extrabold text-slate-900 mt-1">
                  {formatDateIndian(record.heatCheckDate)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Result: <StatusBadge status={record.heatResult} type="heat" />
                </div>
              </div>

              {/* Step 3: PD Check */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  record.pdStatus === "Pregnant"
                    ? "bg-emerald-50 border-emerald-300"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>3. PD Diagnosis (Day 90)</span>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xs font-extrabold text-slate-900 mt-1">
                  {formatDateIndian(record.pdDate)}
                </div>
                <div className="text-[10px] mt-0.5">
                  <StatusBadge status={record.pdStatus} type="pd" />
                </div>
              </div>

              {/* Step 4: Calving */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  record.calvingDate
                    ? "bg-sky-50 border-sky-300"
                    : "bg-emerald-50 border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>4. Calving (283 Days)</span>
                  <Baby className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xs font-extrabold text-slate-900 mt-1">
                  {formatDateIndian(
                    record.calvingDate ||
                      record.expectedCalvingDate ||
                      (record.aiDate ? addDays(new Date(record.aiDate), 283) : undefined)
                  )}
                </div>
                <div className="text-[10px] font-medium mt-0.5">
                  {record.calvingDate ? (
                    <span className="text-emerald-700 font-bold">Delivered</span>
                  ) : (
                    <span className="text-primary-700">Expected (283d from AI)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Re-attempt Banner if Failed or Not Pregnant */}
          {(record.pdStatus === "Failed" || record.pdStatus === "Not Pregnant") && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 text-lg">🔁</div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    Pregnancy Diagnosis Result: {record.pdStatus} (Attempt #{record.attemptNumber || 1})
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Need to repeat AI for this cow? Register Attempt #{((record.attemptNumber || 1) + 1)} with a new date. Total AI count will remain accurate.
                  </p>
                </div>
              </div>
              <Link
                href={`/ai-records/new?farmerId=${typeof record.farmerId === "object" ? (record.farmerId as any)._id : record.farmerId}&cowId=${encodeURIComponent(record.cowId)}&cowName=${encodeURIComponent(record.cowName || "")}&cattleType=${encodeURIComponent(record.cattleType || "Cow")}&cowBreed=${encodeURIComponent(record.cowBreed || "")}&cowPhotoUrl=${encodeURIComponent(record.cowPhotoUrl || "")}&attemptNumber=${(record.attemptNumber || 1) + 1}&prevId=${record._id}`}
                className="px-3.5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-all shadow-xs inline-flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Register Re-attempt (Attempt #{((record.attemptNumber || 1) + 1)})</span>
              </Link>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Farmer Details */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-700" />
                  <span>Owner / Farmer Details</span>
                </h4>
                {farmer && (
                  <Link
                    href={`/farmers/${farmer._id}`}
                    className="text-xs font-bold text-primary-700 hover:underline"
                  >
                    View Profile
                  </Link>
                )}
              </div>

              {farmer ? (
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400">Name:</span>{" "}
                    <strong className="text-slate-800">{farmer.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Mobile:</span>{" "}
                    <a href={`tel:${farmer.mobile}`} className="font-bold text-primary-800">
                      {farmer.mobile}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400">Village:</span>{" "}
                    <span className="font-semibold text-slate-700">{farmer.village}</span>
                  </div>
                  {farmer.address && (
                    <div>
                      <span className="text-slate-400">Address:</span>{" "}
                      <span className="text-slate-600">{farmer.address}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400">Farmer record unlinked</div>
              )}
            </div>

            {/* Bull & Semen Details */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Dna className="w-4 h-4 text-primary-700" />
                <span>Bull & Semen Pedigree</span>
              </h4>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-400">Bull Name:</span>{" "}
                  <strong className="text-slate-800">{record.bullName || "Not Recorded"}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Semen Breed:</span>{" "}
                  <strong className="text-slate-800">{record.semenBreed || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Straw Batch Code:</span>{" "}
                  <span className="font-mono font-bold text-slate-700">{record.strawCode || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Observation Remarks if present */}
          {record.aiRemarks && (
            <div className="pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary-700" />
                <span>Remark & Observation on AI</span>
              </div>
              <p className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/70 text-xs text-slate-800 leading-relaxed font-medium">
                {record.aiRemarks}
              </p>
            </div>
          )}

          {/* Calf Photo & Remarks if present */}
          {(record.calfPhotoUrl || record.remarks) && (
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              {record.calfPhotoUrl && (
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-2">Newborn Calf Photo</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={record.calfPhotoUrl}
                    alt="Calf"
                    className="h-40 rounded-2xl object-cover border border-slate-200 shadow-sm"
                  />
                </div>
              )}

              {record.remarks && (
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-2">
                    Veterinary Observations & Remarks
                  </div>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    {record.remarks}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Follow-up Update Modal */}
      {showFollowUpModal && (
        <FollowUpModal
          record={record}
          isOpen={showFollowUpModal}
          onClose={() => setShowFollowUpModal(false)}
          onSuccess={fetchRecord}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete AI Record?"
        message={`Are you sure you want to permanently delete AI record ${record.aiRecordId}?`}
        confirmText="Confirm Delete"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </AppLayout>
  );
}
