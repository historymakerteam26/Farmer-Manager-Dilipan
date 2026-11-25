"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "../common/ImageUploader";
import { useToast } from "../common/Toast";
import { IAIRecord, IFarmer, PDStatus, HeatResult, CattleType, IStrawStock } from "@/types";
import { toInputDateFormat, formatDateIndian } from "@/lib/utils";
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  Tag,
  Search,
  CheckCircle,
  HelpCircle,
  Clock,
  Layers,
} from "lucide-react";
import { StrawStockModal } from "../straws/StrawStockModal";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";

interface AIRecordFormProps {
  initialData?: IAIRecord;
  initialFarmerId?: string;
  initialCowId?: string;
  initialCowName?: string;
  initialCattleType?: CattleType;
  initialCowBreed?: string;
  initialCowPhotoUrl?: string;
  initialAttemptNumber?: number;
  initialPreviousAiRecordId?: string;
  isEdit?: boolean;
}

export const AIRecordForm: React.FC<AIRecordFormProps> = ({
  initialData,
  initialFarmerId,
  initialCowId,
  initialCowName,
  initialCattleType,
  initialCowBreed,
  initialCowPhotoUrl,
  initialAttemptNumber,
  initialPreviousAiRecordId,
  isEdit = false,
}) => {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  // Farmers list for searchable dropdown
  const [farmers, setFarmers] = useState<IFarmer[]>([]);
  const [farmerSearch, setFarmerSearch] = useState("");
  const [selectedFarmerId, setSelectedFarmerId] = useState(
    (typeof initialData?.farmerId === "object"
      ? (initialData.farmerId as IFarmer)._id
      : initialData?.farmerId) ||
      initialFarmerId ||
      ""
  );

  // Cow / Cattle Details
  const [cattleType, setCattleType] = useState<CattleType>(
    initialData?.cattleType || initialCattleType || "Cow"
  );
  const [cowName, setCowName] = useState(
    initialData?.cowName || initialCowName || ""
  );
  const [cowId, setCowId] = useState(
    initialData?.cowId || initialCowId || ""
  );
  const [cowBreed, setCowBreed] = useState(
    initialData?.cowBreed || initialCowBreed || ""
  );
  const [attemptNumber, setAttemptNumber] = useState<number>(
    initialData?.attemptNumber || initialAttemptNumber || 1
  );
  const [previousAiRecordId, setPreviousAiRecordId] = useState<string | undefined>(
    (initialData?.previousAiRecordId
      ? typeof initialData.previousAiRecordId === "object"
        ? (initialData.previousAiRecordId as any)._id
        : initialData.previousAiRecordId
      : initialPreviousAiRecordId) || undefined
  );
  const [aiDate, setAiDate] = useState(
    initialData?.aiDate
      ? toInputDateFormat(initialData.aiDate)
      : format(new Date(), "yyyy-MM-dd")
  );
  const [cowPhotoUrl, setCowPhotoUrl] = useState(
    initialData?.cowPhotoUrl || initialCowPhotoUrl || ""
  );
  const [aiRemarks, setAiRemarks] = useState(initialData?.aiRemarks || "");

  // Semen / Bull / Straw Stock Inventory
  const [strawStocks, setStrawStocks] = useState<IStrawStock[]>([]);
  const [selectedStrawStockId, setSelectedStrawStockId] = useState<string>(
    (typeof initialData?.strawStockId === "object"
      ? (initialData.strawStockId as any)._id
      : initialData?.strawStockId) || ""
  );
  const [strawsDeducted, setStrawsDeducted] = useState<number>(
    initialData?.strawsDeducted !== undefined ? initialData.strawsDeducted : 2
  );
  const [isStrawModalOpen, setIsStrawModalOpen] = useState(false);

  const [semenBreed, setSemenBreed] = useState(initialData?.semenBreed || "");
  const [bullName, setBullName] = useState(initialData?.bullName || "");
  const [strawCode, setStrawCode] = useState(initialData?.strawCode || "");

  // Follow-up
  const [heatCheckDate, setHeatCheckDate] = useState(
    initialData?.heatCheckDate
      ? toInputDateFormat(initialData.heatCheckDate)
      : format(addDays(new Date(), 21), "yyyy-MM-dd")
  );
  const [heatResult, setHeatResult] = useState<HeatResult>(
    initialData?.heatResult || "Not Checked"
  );

  const [pdDate, setPdDate] = useState(
    initialData?.pdDate
      ? toInputDateFormat(initialData.pdDate)
      : format(addDays(new Date(), 90), "yyyy-MM-dd")
  );
  const [pdStatus, setPdStatus] = useState<PDStatus>(
    initialData?.pdStatus || "Pending"
  );

  const [calvingDate, setCalvingDate] = useState(
    initialData?.calvingDate ? toInputDateFormat(initialData.calvingDate) : ""
  );
  const [calfPhotoUrl, setCalfPhotoUrl] = useState(initialData?.calfPhotoUrl || "");
  const [remarks, setRemarks] = useState(initialData?.remarks || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculate PD date (strictly 90 days post-AI) when AI date changes in create mode
  const handleAiDateChange = (newDateStr: string) => {
    setAiDate(newDateStr);
    if (!isEdit && newDateStr) {
      try {
        const parsed = parseISO(newDateStr);
        setPdDate(format(addDays(parsed, 90), "yyyy-MM-dd"));
      } catch {
        // ignore
      }
    }
  };

  const fetchStraws = async () => {
    try {
      const res = await fetch("/api/straws");
      if (res.ok) {
        const data = await res.json();
        setStrawStocks(data.straws || []);
      }
    } catch {
      // ignore
    }
  };

  // Fetch farmers & straws for dropdowns
  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const res = await fetch("/api/farmers?limit=100");
        if (res.ok) {
          const data = await res.json();
          setFarmers(data.farmers || []);
        }
      } catch {
        // ignore
      }
    };
    fetchFarmers();
    fetchStraws();
  }, []);

  const handleStrawSelection = (strawId: string) => {
    setSelectedStrawStockId(strawId);
    if (!strawId) return;

    const found = strawStocks.find((s) => s._id === strawId);
    if (found) {
      setSemenBreed(found.strawTitle);
      if (found.bullNumber && !bullName) {
        setBullName(found.bullNumber);
      }
      if (found.bullNumber && !strawCode) {
        setStrawCode(found.bullNumber);
      }
    }
  };

  const filteredFarmers = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
      f.mobile.includes(farmerSearch) ||
      f.village.toLowerCase().includes(farmerSearch.toLowerCase())
  );

  const selectedFarmer = farmers.find((f) => f._id === selectedFarmerId);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedFarmerId) errs.farmer = "Please select a farmer";
    if (!cowId.trim()) errs.cowId = "Cow ID / Ear Tag is required";
    if (!aiDate) errs.aiDate = "AI Date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/ai-records/${initialData?._id}` : "/api/ai-records";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        farmerId: selectedFarmerId,
        cattleType,
        cowName: cowName.trim(),
        cowId: cowId.trim(),
        cowBreed: cowBreed.trim(),
        attemptNumber,
        previousAiRecordId,
        aiDate,
        cowPhotoUrl,
        aiRemarks: aiRemarks.trim(),
        semenBreed: semenBreed.trim(),
        bullName: bullName.trim(),
        strawCode: strawCode.trim(),
        strawStockId: selectedStrawStockId || undefined,
        strawsDeducted: Math.max(1, strawsDeducted || 2),
        heatCheckDate: heatCheckDate || undefined,
        heatResult,
        pdDate: pdDate || undefined,
        pdStatus,
        calvingDate: calvingDate || undefined,
        calfPhotoUrl,
        remarks: remarks.trim(),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Failed to save AI record");
        return;
      }

      success(isEdit ? "AI Record updated successfully!" : "AI Record created successfully!");
      router.push(`/ai-records/${data.record?._id || initialData?._id}`);
      router.refresh();
    } catch {
      toastError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href={isEdit ? `/ai-records/${initialData?._id}` : "/ai-records"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <h2 className="text-xl font-bold text-slate-900">
          {isEdit ? "Edit AI Record" : "New Cow Insemination (AI) Record"}
        </h2>
      </div>

      <div className="space-y-6">
        {attemptNumber > 1 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 shadow-xs flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 shrink-0 text-xl font-bold">
              🔁
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-950">
                  Repeat AI / Re-attempt (Attempt #{attemptNumber})
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 uppercase">
                  {attemptNumber === 2 ? "2nd Attempt" : attemptNumber === 3 ? "3rd Attempt" : `${attemptNumber}th Attempt`}
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Registering repeat insemination for Cow <strong>{cowName || cowId}</strong> (Tag: <strong>{cowId}</strong>).
                The previous failed record is safely preserved in reports and Total AI count. You can select another AI Date below.
              </p>
            </div>
          </div>
        )}

        {/* Section 1: Farmer Selection */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-600" />
            1. Farmer Information
          </h3>

          {!isEdit && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Search & Select Farmer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, mobile, or village..."
                  value={farmerSearch}
                  onChange={(e) => setFarmerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Farmer dropdown select */}
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                {filteredFarmers.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 text-center">
                    No farmers found.{" "}
                    <Link href="/farmers/new" className="text-primary-700 font-bold underline">
                      Register a new farmer
                    </Link>
                  </div>
                ) : (
                  filteredFarmers.map((farmer) => (
                    <div
                      key={farmer._id}
                      onClick={() => setSelectedFarmerId(farmer._id)}
                      className={`p-3 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        selectedFarmerId === farmer._id
                          ? "bg-emerald-100 text-emerald-900 font-semibold"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-bold">{farmer.name}</div>
                        <div className="text-slate-500 text-[11px]">
                          📱 {farmer.mobile} • 📍 {farmer.village}
                        </div>
                      </div>
                      {selectedFarmerId === farmer._id && (
                        <CheckCircle className="w-4 h-4 text-primary-700" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedFarmer && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-950">{selectedFarmer.name}</div>
                <div className="text-xs text-emerald-800">
                  Mobile: {selectedFarmer.mobile} | Village: {selectedFarmer.village}
                </div>
              </div>
              <span className="text-xs font-semibold bg-emerald-200/80 text-emerald-900 px-2.5 py-1 rounded-lg">
                Selected
              </span>
            </div>
          )}
          {errors.farmer && <p className="text-xs text-red-600 font-medium">{errors.farmer}</p>}
        </div>

        {/* Section 2: Cow / Cattle Information */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-600" />
            2. Cattle Details
          </h3>

          {/* Cattle Type: Cow / Buffalo / Heifer */}
          <div className="space-y-1.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Cattle Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md">
              {(["Cow", "Buffalo", "Heifer"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCattleType(type)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    cattleType === type
                      ? "bg-[#166534] text-white border-[#166534] shadow-xs scale-[1.02]"
                      : "bg-white text-slate-700 border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/40"
                  }`}
                >
                  <span className="text-base">
                    {type === "Cow" ? "🐄" : type === "Buffalo" ? "🐃" : "🐂"}
                  </span>
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Ear Tag / Cow ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cowId}
                onChange={(e) => setCowId(e.target.value)}
                placeholder="e.g. IN-MH-109283"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium ${
                  errors.cowId
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
                }`}
              />
              {errors.cowId && <p className="text-xs text-red-600">{errors.cowId}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Cow Name (Optional)
              </label>
              <input
                type="text"
                value={cowName}
                onChange={(e) => setCowName(e.target.value)}
                placeholder="e.g. Gauri / Kapila"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Cow Breed
              </label>
              <input
                type="text"
                value={cowBreed}
                onChange={(e) => setCowBreed(e.target.value)}
                placeholder="e.g. HF Cross, Gir, Jersey, Murrah"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>AI Attempt</span>
                {attemptNumber > 1 && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                    Re-attempt
                  </span>
                )}
              </label>
              <select
                value={attemptNumber}
                onChange={(e) => setAttemptNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 bg-white focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value={1}>1st Attempt</option>
                <option value={2}>2nd Attempt (Repeat AI)</option>
                <option value={3}>3rd Attempt (Repeat AI)</option>
                <option value={4}>4th Attempt (Repeat AI)</option>
                <option value={5}>5th Attempt (Repeat AI)</option>
                <option value={6}>6th Attempt (Repeat AI)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Insemination (AI) Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={aiDate}
                onChange={(e) => handleAiDateChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <ImageUploader
                label="Cow Photo (Optional)"
                value={cowPhotoUrl}
                onChange={setCowPhotoUrl}
                folder="cows"
              />
            </div>
          </div>

          {/* Remark & Observation on AI */}
          <div className="space-y-1.5 pt-3">
            <label className="block text-xs font-semibold text-slate-700">
              Remark & Observation on AI
            </label>
            <textarea
              rows={2}
              value={aiRemarks}
              onChange={(e) => setAiRemarks(e.target.value)}
              placeholder="e.g. Insemination observations, mucus discharge clear, standing heat intensity, cervix condition, etc."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Section 3: Bull / Semen Details & Straw Stock Inventory */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-600" />
              3. Semen &amp; Bull Information
            </h3>
            <button
              type="button"
              onClick={() => setIsStrawModalOpen(true)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>+ Manage Straw Inventory</span>
            </button>
          </div>

          {/* Straw Stock Selector (Matching Notebook Drawing on Page 17) */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                <span>🧪</span>
                <span>Select Straw from Stock (Auto-Deduct on Dashboard)</span>
              </span>
              <span className="text-[11px] text-emerald-800 font-semibold">
                Available Insemination Straws
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Straw Breed / Title (Available Stock)
                </label>
                <select
                  value={selectedStrawStockId}
                  onChange={(e) => handleStrawSelection(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-emerald-300 text-sm font-bold text-slate-800 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">-- Choose from Available Straw Stock --</option>
                  {strawStocks.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.strawTitle} — Stock: {st.strawCount} straws {st.bullNumber ? `(${st.bullNumber})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Straws Used (Count)
                </label>
                <input
                  type="number"
                  min="1"
                  value={strawsDeducted}
                  onChange={(e) => setStrawsDeducted(Math.max(1, parseInt(e.target.value, 10) || 2))}
                  className="w-full px-3 py-2.5 rounded-xl border border-emerald-300 text-sm font-black text-slate-900 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {selectedStrawStockId && (
              <div className="text-[11px] text-emerald-800 font-semibold bg-emerald-100/70 p-2 rounded-xl flex items-center gap-1.5">
                <span>⚡</span>
                <span>
                  <strong>{strawsDeducted} straw{strawsDeducted > 1 ? "s" : ""}</strong> will be automatically deducted from <strong>{semenBreed}</strong> stock on dashboard upon saving.
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Semen Breed
              </label>
              <input
                type="text"
                value={semenBreed}
                onChange={(e) => setSemenBreed(e.target.value)}
                placeholder="e.g. Pure HF, Gir Sexed, Jersey"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Bull Name / ID
              </label>
              <input
                type="text"
                value={bullName}
                onChange={(e) => setBullName(e.target.value)}
                placeholder="e.g. ABS Supercharge, Maharaja"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Straw Code / Batch
              </label>
              <input
                type="text"
                value={strawCode}
                onChange={(e) => setStrawCode(e.target.value)}
                placeholder="e.g. HF-IND-8921"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Pregnancy Diagnosis (PD 90 Days Post-AI) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-600" />
            4. Pregnancy Diagnosis (PD) Workflow
          </h3>

          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-3">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary-700" />
              <span>Pregnancy Diagnosis (PD 90 Days Post-AI)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-500">
                  PD Date (90 Days Auto-Detect)
                </label>
                <input
                  type="date"
                  value={pdDate}
                  onChange={(e) => setPdDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:border-primary-600 bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-500">
                  PD Status
                </label>
                <select
                  value={pdStatus}
                  onChange={(e) => setPdStatus(e.target.value as PDStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:border-primary-600 bg-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="Pregnant">Pregnant (Confirmed)</option>
                  <option value="Not Pregnant">Not Pregnant (Negative)</option>
                  <option value="Recheck Required">Recheck Required</option>
                  <option value="Failed">Failed / Aborted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Calving Information (Auto 283 Days Post-AI) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="block text-xs font-bold text-slate-800">
                Calving Delivery Information
              </label>
              {aiDate && (
                <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1.5 w-fit">
                  <span>📅</span>
                  <span>Expected Calving (283 Days):</span>
                  <strong className="text-emerald-950 font-bold">
                    {formatDateIndian(addDays(parseISO(aiDate), 283))}
                  </strong>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Actual Calving Date (if delivered)
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={calvingDate}
                    onChange={(e) => setCalvingDate(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600"
                  />
                  {aiDate && !calvingDate && (
                    <button
                      type="button"
                      onClick={() => setCalvingDate(format(addDays(parseISO(aiDate), 283), "yyyy-MM-dd"))}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-primary-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors whitespace-nowrap"
                      title="Set to 283 Days from AI Date"
                    >
                      Fill 283d
                    </button>
                  )}
                </div>
              </div>

              <div>
                <ImageUploader
                  label="Calf Photo (Optional)"
                  value={calfPhotoUrl}
                  onChange={setCalfPhotoUrl}
                  folder="calves"
                />
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Remarks & Veterinary Observations
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Right horn pregnancy confirmed, good health, expected calving date..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:border-primary-600"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href={isEdit ? `/ai-records/${initialData?._id}` : "/ai-records"}
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
            <span>{isEdit ? "Update AI Record" : "Save AI Record"}</span>
          </button>
        </div>
      </div>

      {/* Straw Stock Management Modal */}
      <StrawStockModal
        isOpen={isStrawModalOpen}
        onClose={() => setIsStrawModalOpen(false)}
        onSuccess={fetchStraws}
      />
    </form>
  );
};
