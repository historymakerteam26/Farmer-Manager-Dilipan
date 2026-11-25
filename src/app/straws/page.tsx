"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StrawStockModal } from "@/components/straws/StrawStockModal";
import { useToast } from "@/components/common/Toast";
import { IStrawStock } from "@/types";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Package,
  TrendingDown,
  RefreshCw,
  Search,
} from "lucide-react";

export default function StrawsPage() {
  const { success, error: toastError } = useToast();
  const [straws, setStraws] = useState<IStrawStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const fetchStraws = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/straws");
      if (res.ok) {
        const json = await res.json();
        setStraws(json.straws || []);
      }
    } catch {
      toastError("Failed to fetch straw stock");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStraws();
  }, []);

  const filteredStraws = straws.filter((s) =>
    (s.strawTitle || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.bullNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalStrawCount = straws.reduce((acc, curr) => acc + (curr.strawCount || 0), 0);

  return (
    <AppLayout title="Semen Straw Stock Inventory">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-[#166534] p-6 rounded-3xl text-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl backdrop-blur-xs">
              🧪
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                Breeding Straw Stock Inventory
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-0.5">
                Straw Stock List
              </h2>
              <p className="text-xs text-emerald-100/80 mt-1">
                Total available semen straws in tank:{" "}
                <strong className="text-white font-extrabold text-sm">{totalStrawCount} straws</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStraws}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-xl backdrop-blur-xs transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manage &amp; Update Stock</span>
            </button>
          </div>
        </div>

        {/* Straw Stock Grid (Matching Notebook Diagram on Page 16) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>STRAW STOCK LIST (Show Count)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Breeds and current remaining stock in artificial insemination kit.
              </p>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search breed / straw..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold animate-pulse">
              Loading straw stock...
            </div>
          ) : filteredStraws.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No straw stock found</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-3 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl"
              >
                + Add First Straw
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredStraws.map((straw) => {
                const isLow = straw.strawCount < 15;
                const isOut = straw.strawCount === 0;

                return (
                  <div
                    key={straw._id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isOut
                        ? "bg-rose-50/50 border-rose-300 text-rose-900"
                        : isLow
                        ? "bg-amber-50/60 border-amber-300 text-amber-950"
                        : "bg-emerald-50/50 border-emerald-200/80 text-emerald-950 hover:border-emerald-400 hover:shadow-xs"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-sm truncate" title={straw.strawTitle}>
                          {straw.strawTitle}
                        </span>
                        {isLow && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                            Low
                          </span>
                        )}
                      </div>
                      {straw.bullNumber && (
                        <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                          Bull: {straw.bullNumber}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-baseline justify-between">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Count:
                      </span>
                      <span className="text-xl font-black text-slate-900">
                        {straw.strawCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Straw Stock Modal */}
        <StrawStockModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchStraws}
        />
      </div>
    </AppLayout>
  );
}
