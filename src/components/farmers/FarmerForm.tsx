"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "../common/ImageUploader";
import { useToast } from "../common/Toast";
import { IFarmer } from "@/types";
import { User, Phone, MapPin, FileText, ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

interface FarmerFormProps {
  initialData?: IFarmer;
  isEdit?: boolean;
}

export const FarmerForm: React.FC<FarmerFormProps> = ({ initialData, isEdit = false }) => {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState(initialData?.name || "");
  const [mobile, setMobile] = useState(initialData?.mobile || "");
  const [village, setVillage] = useState(initialData?.village || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Farmer Name is required";
    if (!mobile.trim()) {
      errs.mobile = "Mobile Number is required";
    } else {
      const clean = mobile.replace(/\D/g, "");
      if (clean.length < 10) {
        errs.mobile = "Please enter a valid 10-digit mobile number";
      }
    }
    if (!village.trim()) errs.village = "Village is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/farmers/${initialData?._id}` : "/api/farmers";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          village: village.trim(),
          address: address.trim(),
          notes: notes.trim(),
          photoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toastError(data.error || "Failed to save farmer details");
        return;
      }

      success(isEdit ? "Farmer updated successfully!" : "Farmer registered successfully!");
      router.push(`/farmers/${data.farmer?._id || initialData?._id}`);
      router.refresh();
    } catch {
      toastError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href={isEdit ? `/farmers/${initialData?._id}` : "/farmers"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <h2 className="text-xl font-bold text-slate-900">
          {isEdit ? "Edit Farmer Details" : "Register New Farmer"}
        </h2>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
        {/* Photo Uploader */}
        <div>
          <ImageUploader
            label="Farmer Profile Photo (Optional)"
            value={photoUrl}
            onChange={setPhotoUrl}
            folder="farmers"
          />
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Farmer Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Baburao Patil"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  errors.name
                    ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100"
                    : "border-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
                }`}
              />
            </div>
            {errors.name && <p className="text-xs text-red-600 font-medium">{errors.name}</p>}
          </div>

          {/* Mobile */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Mobile Number (10 digits) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                value={mobile}
                maxLength={10}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 9822014589"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  errors.mobile
                    ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100"
                    : "border-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
                }`}
              />
            </div>
            {errors.mobile && <p className="text-xs text-red-600 font-medium">{errors.mobile}</p>}
          </div>

          {/* Village */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Village / Town <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Khandala, Shirur"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  errors.village
                    ? "border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-100"
                    : "border-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
                }`}
              />
            </div>
            {errors.village && <p className="text-xs text-red-600 font-medium">{errors.village}</p>}
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Address / Landmark
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Gat No. 42, Near Datta Mandir"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Notes / Cattle Details (Optional)
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Has 5 HF cross cows and 2 buffaloes; preferred breeding breed..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href={isEdit ? `/farmers/${initialData?._id}` : "/farmers"}
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-primary-700 hover:bg-primary-800 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isEdit ? "Update Farmer" : "Save & Register Farmer"}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
