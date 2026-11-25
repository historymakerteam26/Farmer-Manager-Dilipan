"use client";

import React, { useState, useEffect } from "react";
import { IStrawStock } from "@/types";
import { useToast } from "../common/Toast";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  Loader2,
  Package,
  Layers,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface StrawStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StrawStockModal: React.FC<StrawStockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();

  const [straws, setStraws] = useState<IStrawStock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [strawTitle, setStrawTitle] = useState("");
  const [strawCount, setStrawCount] = useState<number | string>("");
  const [bullNumber, setBullNumber] = useState("");
  const [description, setDescription] = useState("");

  const fetchStraws = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/straws");
      if (res.ok) {
        const json = await res.json();
        setStraws(json.straws || []);
      }
    } catch {
      toastError("Failed to fetch straw stocks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStraws();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setStrawTitle("");
    setStrawCount("");
    setBullNumber("");
    setDescription("");
  };

  const handleStartEdit = (straw: IStrawStock) => {
    setEditingId(straw._id);
    setIsAdding(true);
    setStrawTitle(straw.strawTitle);
    setStrawCount(straw.strawCount);
    setBullNumber(straw.bullNumber || "");
    setDescription(straw.description || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strawTitle.trim()) {
      toastError("Please enter straw title / breed");
      return;
    }
    const count = parseInt(String(strawCount), 10);
    if (isNaN(count) || count < 0) {
      toastError("Please enter a valid straw count (0 or higher)");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/straws/${editingId}` : "/api/straws";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strawTitle: strawTitle.trim(),
          strawCount: count,
          bullNumber: bullNumber.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to save straw stock");
        return;
      }

      success(editingId ? "Straw stock updated successfully!" : "New straw stock added successfully!");
      resetForm();
      fetchStraws();
      if (onSuccess) onSuccess();
    } catch {
      toastError("Network error while saving straw stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdjust = async (id: string, delta: number) => {
    try {
      const res = await fetch(`/api/straws/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
      if (res.ok) {
        fetchStraws();
        if (onSuccess) onSuccess();
      } else {
        toastError("Failed to update stock");
      }
    } catch {
      toastError("Network error");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove '${title}' from straw inventory?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/straws/${id}`, { method: "DELETE" });
      if (res.ok) {
        success(`'${title}' removed from stock`);
        fetchStraws();
        if (onSuccess) onSuccess();
      } else {
        toastError("Failed to delete straw");
      }
    } catch {
      toastError("Network error");
    }
  };

  if (!isOpen) return null;

  const totalStrawsCount = straws.reduce((acc, curr) => acc + (curr.strawCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-900">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Straw Stock Management
              </h3>
              <p className="text-xs text-slate-500">
                Live Semen Straw Inventory • Total Stock: <strong className="text-emerald-900 font-extrabold">{totalStrawsCount} straws</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Current Stock List</span>
            </div>

            {!isAdding && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item</span>
              </button>
            )}
          </div>

          {/* Form (Add or Edit) */}
          {isAdding && (
            <form
              onSubmit={handleSave}
              className="p-4 bg-slate-50 rounded-2xl border border-emerald-200 space-y-4 animate-in slide-in-from-top-2"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-900">
                  {editingId ? "✏️ Edit Straw Item" : "✨ Add New Straw Item"}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Straw Title / Breed <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={strawTitle}
                    onChange={(e) => setStrawTitle(e.target.value)}
                    placeholder="e.g. HF, Jy, GIR, 94100(CFS)"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Straw Count <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={strawCount}
                    onChange={(e) => setStrawCount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 text-xs font-extrabold text-slate-900 rounded-xl border border-slate-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Bull Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={bullNumber}
                    onChange={(e) => setBullNumber(e.target.value)}
                    placeholder="e.g. HF-IND-01"
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{editingId ? "Update Item" : "Save Item"}</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Straw Items */}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold animate-pulse">
              Loading straw inventory...
            </div>
          ) : straws.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No straw stock items added yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click &quot;+ Add Item&quot; above to create your first semen straw batch.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              {straws.map((item, index) => (
                <div
                  key={item._id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Left: Index & Straw Name */}
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span>{item.strawTitle}</span>
                        {item.bullNumber && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Bull: {item.bullNumber}
                          </span>
                        )}
                        {item.strawCount < 15 && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Low Stock
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Count Badge & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    {/* Count Pill */}
                    <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/80">
                      <span className="text-[10px] font-semibold text-emerald-800 uppercase">Count:</span>
                      <strong className="text-sm font-black text-emerald-950">
                        {item.strawCount}
                      </strong>
                    </div>

                    {/* Quick increment/decrement */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(item._id, 10)}
                        className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Add +10 straws"
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(item._id, 50)}
                        className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Add +50 straws"
                      >
                        +50
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(item._id, -1)}
                        className="px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                        title="Deduct 1 straw"
                        disabled={item.strawCount <= 0}
                      >
                        -1
                      </button>
                    </div>

                    {/* Edit & Delete */}
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit straw details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id, item.strawTitle)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete straw"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Automatically updates on Dashboard &amp; AI Registration.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
