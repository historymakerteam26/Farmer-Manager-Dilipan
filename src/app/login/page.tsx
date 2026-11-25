"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import { Lock, Eye, EyeOff, Loader2, Delete, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const submitLogin = async (passcode: string) => {
    if (passcode.length !== 4) {
      toastError("Please enter 4-digit passcode");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: passcode }),
      });

      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || "Incorrect passcode. Please try again.");
        setPin("");
        return;
      }

      success(`Welcome, ${data.user?.name || "Dilipan"}!`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      toastError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (isLoading) return;
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        submitLogin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    if (isLoading) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitLogin(pin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#052e16] via-[#166534] to-[#14532d] flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform transition-all animate-in zoom-in-95">
        {/* Top Header */}
        <div className="bg-[#166534] p-6 text-center text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center text-3xl shadow-lg border border-white/20 mb-2">
            🐄
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            AI REGISTER
          </h1>
          <p className="text-xs text-emerald-200 mt-0.5 font-medium">
            Dilipan (Artificial Inseminator)
          </p>
        </div>

        {/* PIN Entry Area */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="text-center space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enter 4-Digit Passcode
              </label>
              <p className="text-[11px] text-slate-400">
                Quick secure mobile PIN access
              </p>
            </div>

            {/* 4 Pin Dots / Digits Display */}
            <div className="flex items-center justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pin.length > index;
                const digit = pin[index];
                return (
                  <div
                    key={index}
                    className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                      isFilled
                        ? "border-[#166534] bg-emerald-50 text-[#166534] shadow-sm scale-105"
                        : "border-slate-200 bg-slate-50 text-slate-300"
                    }`}
                  >
                    {isFilled ? (showPin ? digit : "•") : ""}
                  </div>
                );
              })}
            </div>

            {/* Hidden Input for direct typing / virtual keyboard fallback */}
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                autoFocus
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPin(val);
                  if (val.length === 4) submitLogin(val);
                }}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                aria-label="4 digit passcode"
              />
            </div>

            {/* Toggle show/hide PIN */}
            <div className="flex items-center justify-between text-xs px-1 text-slate-500">
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="flex items-center gap-1 hover:text-slate-800 transition-colors"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? "Hide Passcode" : "Show Passcode"}</span>
              </button>
              {pin.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPin("")}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Numeric Keypad (1-9, 0, Backspace) */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  disabled={isLoading}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-emerald-100/70 active:bg-emerald-200 text-slate-800 font-bold text-lg transition-all flex items-center justify-center border border-slate-200/80 active:scale-95 disabled:opacity-50"
                >
                  {num}
                </button>
              ))}

              {/* Blank placeholder */}
              <div />

              {/* 0 */}
              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                disabled={isLoading}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-emerald-100/70 active:bg-emerald-200 text-slate-800 font-bold text-lg transition-all flex items-center justify-center border border-slate-200/80 active:scale-95 disabled:opacity-50"
              >
                0
              </button>

              {/* Backspace */}
              <button
                type="button"
                onClick={handleBackspace}
                disabled={isLoading || pin.length === 0}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-600 active:bg-red-100 transition-all flex items-center justify-center border border-slate-200/80 active:scale-95 disabled:opacity-30"
                title="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Submit / Unlock Button */}
            <button
              type="submit"
              disabled={isLoading || pin.length !== 4}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-primary-700 hover:bg-primary-800 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>Unlock Dashboard</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
