"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Pagination } from "@/components/common/Pagination";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { useToast } from "@/components/common/Toast";
import { formatDateIndian } from "@/lib/utils";
import { IFarmer } from "@/types";
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Download,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function FarmersPage() {
  const { success, error: toastError } = useToast();

  const [farmers, setFarmers] = useState<IFarmer[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Delete modal state
  const [farmerToDelete, setFarmerToDelete] = useState<IFarmer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFarmers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search.trim(),
        village: selectedVillage,
      });

      const res = await fetch(`/api/farmers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFarmers(data.farmers || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setVillages(data.villages || []);
      }
    } catch {
      toastError("Failed to load farmers");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedVillage, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFarmers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchFarmers]);

  const handleDeleteFarmer = async () => {
    if (!farmerToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/farmers/${farmerToDelete._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to delete farmer");
        return;
      }
      success(data.message || "Farmer deleted successfully!");
      setFarmerToDelete(null);
      fetchFarmers();
    } catch {
      toastError("Error deleting farmer");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout title="Farmers Directory">
      <div className="space-y-6">
        {/* Top Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Registered Farmers
            </h2>
            <p className="text-xs text-slate-500">
              Manage producers, cow records, and track dairy breeding history.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <a
              href="/api/reports/farmers?format=csv"
              download
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </a>

            <Link
              href="/farmers/new"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-700 hover:bg-primary-800 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Register Farmer</span>
            </Link>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, mobile, farmer ID, or village..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedVillage}
              onChange={(e) => {
                setSelectedVillage(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">All Villages ({villages.length})</option>
              {villages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Farmers Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : farmers.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
                👨‍🌾
              </div>
              <h3 className="text-sm font-bold text-slate-800">No farmers found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No farmers match your current search or filter query. Try resetting filters or register a new farmer.
              </p>
              <Link
                href="/farmers/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-700 hover:bg-primary-800 rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Register Farmer</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Farmer</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Village</th>
                    <th className="py-3 px-4 text-center">AI Records</th>
                    <th className="py-3 px-4 text-center">Pregnant</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {farmers.map((farmer) => (
                    <tr
                      key={farmer._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Farmer Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/farmers/${farmer._id}`}
                          className="flex items-center gap-3 group-hover:text-primary-700 transition-colors"
                        >
                          {farmer.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={farmer.photoUrl}
                              alt={farmer.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center shrink-0">
                              {farmer.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-primary-700">
                              {farmer.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              ID: {farmer.farmerId}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Mobile */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <a
                          href={`tel:${farmer.mobile}`}
                          className="hover:text-primary-700 hover:underline flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{farmer.mobile}</span>
                        </a>
                      </td>

                      {/* Village */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{farmer.village}</span>
                        </div>
                      </td>

                      {/* Total AI Records */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                          {farmer.aiRecordsCount || 0}
                        </span>
                      </td>

                      {/* Pregnant Cows */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {farmer.pregnantCount || 0}
                        </span>
                      </td>

                      {/* Reg Date */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDateIndian(farmer.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/farmers/${farmer._id}`}
                            className="p-1.5 text-slate-500 hover:text-primary-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Farmer Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/farmers/${farmer._id}/edit`}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Farmer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setFarmerToDelete(farmer)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Farmer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
            itemName="farmers"
          />
        </div>
      </div>

      {/* Confirmation Dialog for Safe Deletion */}
      <ConfirmationDialog
        isOpen={Boolean(farmerToDelete)}
        title="Safe Delete Farmer Record?"
        message={`Are you sure you want to remove '${farmerToDelete?.name}' (${farmerToDelete?.farmerId})? Historical cow AI records and calving statistics will be preserved safely in the audit database.`}
        confirmText="Safe Delete Farmer"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteFarmer}
        onCancel={() => setFarmerToDelete(null)}
      />
    </AppLayout>
  );
}
