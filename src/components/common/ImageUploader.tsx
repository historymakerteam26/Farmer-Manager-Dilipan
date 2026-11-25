"use client";

import React, { useState, useRef } from "react";
import { Camera, UploadCloud, X, Loader2, Image as ImageIcon, FolderOpen } from "lucide-react";

interface ImageUploaderProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  recommendedAspect?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  folder = "farmer-crm",
  recommendedAspect = "Square (1:1)",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Separate refs for Device Upload and Camera Capture
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WebP)");
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size should be less than 10MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Data, folder }),
          });

          const data = await res.json();
          if (res.ok && data.url) {
            onChange(data.url);
          } else {
            // If upload API fails or offline, use base64 directly so user experience isn't blocked!
            onChange(base64Data);
          }
        } catch {
          // Direct fallback to data URL
          onChange(base64Data);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Failed to process image");
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700">
        {label} <span className="text-slate-400 font-normal">({recommendedAspect})</span>
      </label>

      {/* 1. Device Upload Input (NO capture attribute - opens Gallery / Files / Storage) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {/* 2. Direct Camera Trigger Input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      <div
        className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all overflow-hidden ${
          value
            ? "border-emerald-300 bg-emerald-50/30 hover:border-emerald-400"
            : "border-slate-300 bg-slate-50/60"
        }`}
      >
        {value ? (
          <div className="relative group flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="h-36 w-auto max-w-full rounded-xl object-contain mx-auto shadow-sm"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition-all opacity-90 group-hover:opacity-100"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="py-2 flex flex-col items-center justify-center gap-3">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
                <p className="text-xs font-medium text-slate-600">Uploading photo...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-primary-800 flex items-center justify-center shadow-xs">
                  <ImageIcon className="w-6 h-6" />
                </div>

                <div className="text-xs font-bold text-slate-700">
                  Select photo for {label}
                </div>

                {/* 2 Distinct Buttons for Gallery / Device and Camera */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full max-w-xs">
                  {/* Option A: Upload from Device / Gallery */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex-1 min-w-[130px] py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 hover:border-emerald-500 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                  >
                    <FolderOpen className="w-4 h-4 text-emerald-600" />
                    <span>Upload from Device</span>
                  </button>

                  {/* Option B: Take Photo with Camera */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4 text-slate-500" />
                    <span>Take Photo</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  Choose from phone gallery, files, or capture with camera (up to 10MB)
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};
