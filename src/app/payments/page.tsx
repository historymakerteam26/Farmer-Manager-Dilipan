"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { useToast } from "@/components/common/Toast";
import { formatDateIndian } from "@/lib/utils";
import { IPayment, IFarmer } from "@/types";
import {
  IndianRupee,
  Plus,
  Search,
  Calendar,
  User,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  RefreshCw,
  Wallet,
  AlertCircle,
  X,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function PaymentsPage() {
  const { success, error: toastError } = useToast();

  // Data states
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [farmers, setFarmers] = useState<IFarmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Summary stats
  const [summary, setSummary] = useState({
    totalPendingAmount: 0,
    pendingCount: 0,
    totalPaidAmount: 0,
    paidCount: 0,
  });

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<"Pending" | "Paid" | "all">("Pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Form states (matching handwritten sketch)
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [farmerSearch, setFarmerSearch] = useState("");
  const [isFarmerDropdownOpen, setIsFarmerDropdownOpen] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch farmers for dropdown
  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const res = await fetch("/api/farmers?limit=300");
        if (res.ok) {
          const data = await res.json();
          setFarmers(data.farmers || []);
        }
      } catch (err) {
        console.error("Failed to load farmers", err);
      }
    };
    fetchFarmers();
  }, []);

  // Fetch payment records
  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("status", activeTab);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch {
      toastError("Failed to load payment records");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery, toastError]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleClearForm = () => {
    setSelectedFarmerId("");
    setFarmerSearch("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setAmount("");
    setNote("");
    setEditingPaymentId(null);
  };

  const handleEditClick = (payment: IPayment) => {
    setEditingPaymentId(payment._id);
    const f = payment.farmerId as IFarmer;
    if (f) {
      setSelectedFarmerId(f._id);
      setFarmerSearch(`${f.name} - ${f.village}`);
    }
    setDate(format(new Date(payment.date), "yyyy-MM-dd"));
    setAmount(payment.amount.toString());
    setNote(payment.note || "");
    // Scroll to form smoothly on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerId) {
      toastError("Please select a farmer");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toastError("Please enter a valid pending amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingPaymentId ? `/api/payments/${editingPaymentId}` : "/api/payments";
      const method = editingPaymentId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId: selectedFarmerId,
          amount: parsedAmount,
          date,
          note: note.trim(),
          status: "Pending",
        }),
      });

      if (res.ok) {
        success(editingPaymentId ? "Payment entry updated!" : "Pending payment saved!");
        handleClearForm();
        fetchPayments();
      } else {
        const data = await res.json();
        toastError(data.error || "Failed to save payment");
      }
    } catch {
      toastError("Network error while saving payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (payment: IPayment) => {
    const newStatus = payment.status === "Pending" ? "Paid" : "Pending";
    try {
      const res = await fetch(`/api/payments/${payment._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        success(newStatus === "Paid" ? "Marked as Paid! ₹" + payment.amount : "Moved back to Pending!");
        fetchPayments();
      }
    } catch {
      toastError("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/payments/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        success("Payment record deleted");
        setDeleteId(null);
        fetchPayments();
      } else {
        const data = await res.json();
        toastError(data.error || "Failed to delete");
      }
    } catch {
      toastError("Network error while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFarmers = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
      f.village.toLowerCase().includes(farmerSearch.toLowerCase()) ||
      f.mobile.includes(farmerSearch)
  );

  const selectedFarmer = farmers.find((f) => f._id === selectedFarmerId);

  return (
    <AppLayout title="Payment Pending Account">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Top Header & Summary Cards */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-[#166534] p-6 rounded-3xl text-white shadow-sm">
          <div>
            <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4" />
              <span>Payment Pending Account (A/C)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              Farmer Dues & Pending Balances
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1">
              Track insemination fee dues, semen straw balances, and settle payments.
            </p>
          </div>

          <button
            onClick={fetchPayments}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-xl backdrop-blur-xs transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* 2 Key Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Total Pending Dues
              </span>
              <div className="text-2xl font-black text-amber-950 mt-1">
                ₹{summary.totalPendingAmount.toLocaleString("en-IN")}
              </div>
              <div className="text-xs font-medium text-amber-800 mt-0.5">
                {summary.pendingCount} unpaid farmer account{summary.pendingCount === 1 ? "" : "s"}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold text-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Total Collected / Paid
              </span>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                ₹{summary.totalPaidAmount.toLocaleString("en-IN")}
              </div>
              <div className="text-xs font-medium text-emerald-800 mt-0.5">
                {summary.paidCount} settled payment{summary.paidCount === 1 ? "" : "s"}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-200/80 text-emerald-900 flex items-center justify-center font-bold text-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-1 p-5 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Quick Navigation
              </span>
              <div className="text-sm font-bold text-slate-800 mt-1">
                Field Operations
              </div>
              <div className="flex gap-2 mt-2">
                <Link
                  href="/farmers/new"
                  className="px-2.5 py-1 text-[11px] font-semibold text-primary-800 bg-[#DCFCE7] rounded-lg hover:bg-emerald-200 transition-colors"
                >
                  + Farmer
                </Link>
                <Link
                  href="/ai-records/new"
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  + AI Record
                </Link>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xl">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Form and List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Payment Pending Entry Form (Directly matching handwritten sketch) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                <span>{editingPaymentId ? "Edit Pending A/C" : "Payment Pending A/C"}</span>
              </h3>
              {editingPaymentId && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Editing Mode
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Farmer Select */}
              <div className="space-y-1.5 relative">
                <label className="block text-xs font-semibold text-slate-700">
                  Farmer <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={farmerSearch}
                    onFocus={() => setIsFarmerDropdownOpen(true)}
                    onChange={(e) => {
                      setFarmerSearch(e.target.value);
                      setIsFarmerDropdownOpen(true);
                    }}
                    placeholder="Search name, mobile or village..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
                  />
                  {farmerSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setFarmerSearch("");
                        setSelectedFarmerId("");
                      }}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Farmer Dropdown results */}
                {isFarmerDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsFarmerDropdownOpen(false)}
                    />
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 divide-y divide-slate-100">
                      {filteredFarmers.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500 text-center">
                          No matching farmers found
                        </div>
                      ) : (
                        filteredFarmers.map((f) => (
                          <div
                            key={f._id}
                            onClick={() => {
                              setSelectedFarmerId(f._id);
                              setFarmerSearch(`${f.name} - ${f.village}`);
                              setIsFarmerDropdownOpen(false);
                            }}
                            className={`p-3 text-xs cursor-pointer hover:bg-emerald-50 transition-colors flex items-center justify-between ${
                              selectedFarmerId === f._id ? "bg-emerald-50/80 font-bold" : ""
                            }`}
                          >
                            <div>
                              <div className="font-bold text-slate-800">{f.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {f.mobile} • {f.village}
                              </div>
                            </div>
                            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-md">
                              Select
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {selectedFarmer && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                    <div>
                      <strong>Selected:</strong> {selectedFarmer.name} ({selectedFarmer.village})
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* 3. Pending Amount */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Pending Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* 4. Note / Reason */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. AI straw fees, checkup balance, paid ₹200 advance..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* 5. Buttons: Save & Clear (matching handwritten sketch) */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingPaymentId ? "Update" : "Save"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearForm}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: Pending Amount List (Matching handwritten sketch "down -> pending Amount list") */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-primary-700" />
                  <span>Pending Amount List</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Showing {payments.length} records
                </span>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("Pending")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === "Pending"
                      ? "bg-amber-500 text-white shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pending ({summary.pendingCount})
                </button>
                <button
                  onClick={() => setActiveTab("Paid")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === "Paid"
                      ? "bg-emerald-600 text-white shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Paid ({summary.paidCount})
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === "all"
                      ? "bg-slate-800 text-white shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by farmer name, mobile, or village..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-primary-600 focus:ring-1 focus:ring-emerald-200"
              />
            </div>

            {/* List Table / Cards */}
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
                Loading payment records...
              </div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <div className="text-3xl">🎉</div>
                <div className="text-sm font-bold text-slate-700">No payment dues found</div>
                <p className="text-xs text-slate-400">
                  {activeTab === "Pending"
                    ? "All farmer payments are settled and clear."
                    : "No payment records match your filters."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-hidden">
                {payments.map((p, idx) => {
                  const f = p.farmerId as IFarmer;
                  const isPaid = p.status === "Paid";

                  return (
                    <div
                      key={p._id}
                      className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-2xl transition-colors"
                    >
                      {/* Farmer Details (e.g. 1. Kannan - Agaram / Amount - ₹500) */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <span>{f ? f.name : "Unlinked Farmer"}</span>
                            {f?.village && (
                              <span className="text-xs font-medium text-slate-500">
                                - {f.village}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                            {f?.mobile && <span>📞 {f.mobile}</span>}
                            <span>• 📅 {formatDateIndian(p.date)}</span>
                            {p.note && (
                              <span className="italic text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                &ldquo;{p.note}&rdquo;
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <div
                            className={`text-base font-black ${
                              isPaid ? "text-emerald-700" : "text-red-600"
                            }`}
                          >
                            ₹{p.amount.toLocaleString("en-IN")}
                          </div>
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                            }`}
                          >
                            {isPaid ? "✓ Paid" : "⏳ Pending"}
                          </button>
                        </div>

                        {/* Actions: Edit & Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="p-1.5 text-slate-400 hover:text-primary-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(p._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        isOpen={!!deleteId}
        title="Delete Payment Record"
        message="Are you sure you want to delete this payment record? This action cannot be undone."
        confirmText="Delete"
        isDanger
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AppLayout>
  );
}
