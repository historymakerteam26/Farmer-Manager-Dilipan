"use client";

import React, { useState } from "react";
import { IAIRecord, PDStatus, HeatResult } from "@/types";
import { toInputDateFormat, formatDateIndian } from "@/lib/utils";
import { addDays, format, parseISO } from "date-fns";
import { useToast } from "../common/Toast";
import { ImageUploader } from "../common/ImageUploader";
import { X, Check, Loader2, Calendar } from "lucide-react";
import Link from "next/link";

interface FollowUpModalProps {
  record: IAIRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  record,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();

  const [heatResult, setHeatResult] = useState<HeatResult>(
    record?.heatResult || "Not Checked"
  );
  const [heatCheckDate, setHeatCheckDate] = useState(
    record?.heatCheckDate ? toInputDateFormat(record.heatCheckDate) : ""
  );
  const [pdStatus, setPdStatus] = useState<PDStatus>(record?.pdStatus || "Pending");
  const [pdDate, setPdDate] = useState(
    record?.pdDate ? toInputDateFormat(record.pdDate) : ""
  );
  const [calvingDate, setCalvingDate] = useState(
    record?.calvingDate ? toInputDateFormat(record.calvingDate) : ""
  );
  const [calfPhotoUrl, setCalfPhotoUrl] = useState(record?.calfPhotoUrl || "");
  const [remarks, setRemarks] = useState(record?.remarks || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when record opens
  React.useEffect(() => {
    if (record) {
      setHeatResult(record.heatResult || "Not Checked");
      setHeatCheckDate(record.heatCheckDate ? toInputDateFormat(record.heatCheckDate) : "");
      setPdStatus(record.pdStatus || "Pending");
      setPdDate(record.pdDate ? toInputDateFormat(record.pdDate) : "");
      setCalvingDate(record.calvingDate ? toInputDateFormat(record.calvingDate) : "");
      setCalfPhotoUrl(record.calfPhotoUrl || "");
      setRemarks(record.remarks || "");
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const farmerName =
    typeof record.farmerId === "object" ? (record.farmerId as any).name : "Farmer";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/follow-ups/${record._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heatResult,
          heatCheckDate: heatCheckDate || undefined,
          pdStatus,
          pdDate: pdDate || undefined,
          calvingDate: calvingDate || undefined,
          calfPhotoUrl,
          remarks: remarks.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to update follow-up");
        return;
      }

      success("Follow-up updated successfully!");
      onSuccess();
      onClose();
    } catch {
      toastError("Failed to update. Please check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Update Follow-up & Diagnosis
            </h3>
            <p className="text-xs text-slate-500">
              Cow: <span className="font-semibold text-slate-700">{record.cowName || record.cowId}</span> (
              {farmerName})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Pregnancy Diagnosis (PD) Status */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Pregnancy Diagnosis (PD) Result
            </label>
            <select
              value={pdStatus}
              onChange={(e) => setPdStatus(e.target.value as PDStatus)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="Pending">⏳ Pending Check</option>
              <option value="Pregnant">✅ Pregnant (Confirmed Positive)</option>
              <option value="Not Pregnant">❌ Not Pregnant (Negative)</option>
              <option value="Recheck Required">🔄 Recheck Required (Doubtful)</option>
              <option value="Failed">⚠️ Failed / Aborted</option>
            </select>

            {(pdStatus === "Failed" || pdStatus === "Not Pregnant") && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex items-center justify-between gap-3 text-xs mt-2">
                <div>
                  <p className="font-bold text-amber-950">
                    Cow Not Pregnant / Failed (Attempt #{record.attemptNumber || 1})
                  </p>
                  <p className="text-[11px] text-amber-800">
                    Register a 2nd/repeat AI attempt for this cow with a new date.
                  </p>
                </div>
                <Link
                  href={`/ai-records/new?farmerId=${typeof record.farmerId === "object" ? (record.farmerId as any)._id : record.farmerId}&cowId=${encodeURIComponent(record.cowId)}&cowName=${encodeURIComponent(record.cowName || "")}&cattleType=${encodeURIComponent(record.cattleType || "Cow")}&cowBreed=${encodeURIComponent(record.cowBreed || "")}&cowPhotoUrl=${encodeURIComponent(record.cowPhotoUrl || "")}&attemptNumber=${(record.attemptNumber || 1) + 1}&prevId=${record._id}`}
                  className="px-2.5 py-1.5 font-bold text-[11px] bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all shadow-xs shrink-0 inline-flex items-center gap-1 active:scale-95"
                  onClick={onClose}
                >
                  <span>🔁 Re-attempt</span>
                </Link>
              </div>
            )}
          </div>

          {/* Schedule Next PD Date or Recheck Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              PD Check / Recheck Date
            </label>
            <input
              type="date"
              value={pdDate}
              onChange={(e) => setPdDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-primary-600"
            />
          </div>

          {/* Heat Check Result */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800">
              Heat Check Observation (21 Days)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={heatResult}
                onChange={(e) => setHeatResult(e.target.value as HeatResult)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-primary-600"
              >
                <option value="Not Checked">Not Checked</option>
                <option value="No Heat">No Heat (Good)</option>
                <option value="Heat Detected">Heat Detected (Repeated)</option>
                <option value="Recheck Required">Recheck Required</option>
              </select>
              <input
                type="date"
                value={heatCheckDate}
                onChange={(e) => setHeatCheckDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-primary-600"
                placeholder="Heat Date"
              />
            </div>
          </div>

          {/* Calving Option */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Calving Record (283 Days Gestation)
              </label>
              {record.aiDate && (
                <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                  Expected: {formatDateIndian(addDays(new Date(record.aiDate), 283))}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Delivery / Calving Date
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    value={calvingDate}
                    onChange={(e) => setCalvingDate(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-primary-600"
                  />
                  {record.aiDate && !calvingDate && (
                    <button
                      type="button"
                      onClick={() => setCalvingDate(format(addDays(new Date(record.aiDate), 283), "yyyy-MM-dd"))}
                      className="px-2 py-1 text-[10px] font-semibold text-primary-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Fill 283d
                    </button>
                  )}
                </div>
              </div>
              <div>
                <ImageUploader
                  label="Newborn Calf Photo"
                  value={calfPhotoUrl}
                  onChange={setCalfPhotoUrl}
                  folder="calves"
                />
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800">
              Veterinary Remarks / Field Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Advised farmer on high protein diet, scheduled booster..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-primary-600"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-primary-700 hover:bg-primary-800 rounded-xl shadow-xs disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Save & Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
