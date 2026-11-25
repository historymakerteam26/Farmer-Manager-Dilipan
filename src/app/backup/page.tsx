"use client";

import React, { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { useToast } from "@/components/common/Toast";
import {
  Database,
  Download,
  UploadCloud,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileCode,
} from "lucide-react";

export default function BackupPage() {
  const { success, error: toastError, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupPreview, setBackupPreview] = useState<any>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toastError("Please select a valid JSON backup file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json || !json.data || !Array.isArray(json.data.farmers) || !Array.isArray(json.data.aiRecords)) {
          toastError("Invalid backup file schema: Missing farmers or AI records data.");
          return;
        }
        setSelectedFile(file);
        setBackupPreview(json);
        info("Backup file verified successfully! Review details below before restoring.");
      } catch {
        toastError("Failed to parse JSON backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!backupPreview) return;
    setIsRestoring(true);

    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupPreview),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to restore backup");
        return;
      }

      success(data.message || "Database restored successfully!");
      setShowConfirmModal(false);
      setSelectedFile(null);
      setBackupPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toastError("Network error while restoring backup");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <AppLayout title="Database Backup & Restore" requiredRole="admin">
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-[#166534] p-6 md:p-8 rounded-3xl text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
              💾
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Restricted Module</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black mt-0.5">
                Database Backup & Disaster Recovery
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 max-w-xl">
            Export full JSON snapshots of the MongoDB database or restore previous backups. Database credentials are encrypted and never exposed in backups.
          </p>
        </div>

        {/* 1. Export Backup Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-emerald-100 text-primary-800 shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                1. Download Database Snapshot (JSON)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Generates a complete structured JSON export containing all registered farmers, cow AI records, follow-up history, and system audit logs.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <a
              href="/api/backup/export"
              download
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-primary-700 hover:bg-primary-800 rounded-xl transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Live Backup (.json)</span>
            </a>
          </div>
        </div>

        {/* 2. Restore Backup Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2. Restore Database from Backup File
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Upload and inspect a previously exported JSON backup file. The system will validate data integrity and merge or restore records safely.
              </p>
            </div>
          </div>

          {/* File input */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-primary-600 transition-colors bg-slate-50/50">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <FileCode className="w-8 h-8 text-primary-700" />
              <div className="text-xs text-slate-700">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-bold text-primary-700 hover:underline"
                >
                  Select JSON backup file
                </button>{" "}
                from your computer
              </div>
              <p className="text-[11px] text-slate-400">Supported: valid Farmer Manager CRM JSON export</p>
            </div>
          </div>

          {/* Backup Preview if verified */}
          {backupPreview && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Backup Metadata:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-emerald-900">
                <div>
                  <span className="text-emerald-700 text-[11px]">Backup Date:</span>
                  <div className="font-bold">{backupPreview.backupDate?.slice(0, 10) || "N/A"}</div>
                </div>
                <div>
                  <span className="text-emerald-700 text-[11px]">Version:</span>
                  <div className="font-bold">{backupPreview.version || "1.0.0"}</div>
                </div>
                <div>
                  <span className="text-emerald-700 text-[11px]">Farmers:</span>
                  <div className="font-bold">{backupPreview.data?.farmers?.length || 0}</div>
                </div>
                <div>
                  <span className="text-emerald-700 text-[11px]">AI Records:</span>
                  <div className="font-bold">{backupPreview.data?.aiRecords?.length || 0}</div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
                >
                  Confirm & Restore Database
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmModal}
        title="Restore Database from Backup?"
        message={`Warning: This will restore ${backupPreview?.data?.farmers?.length || 0} farmers and ${backupPreview?.data?.aiRecords?.length || 0} cow AI records from backup dated ${backupPreview?.backupDate?.slice(0, 10)}. Matching records will be updated safely. Do you wish to proceed?`}
        confirmText="Yes, Restore Database"
        isDanger={true}
        isLoading={isRestoring}
        onConfirm={handleExecuteRestore}
        onCancel={() => setShowConfirmModal(false)}
      />
    </AppLayout>
  );
}
