"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { ToastProvider } from "../common/Toast";
import { IUser } from "@/types";
import { Loader2 } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  requiredRole?: "admin";
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  requiredRole,
}) => {
  const router = useRouter();
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (data.authenticated && data.user) {
          if (requiredRole && data.user.role !== requiredRole) {
            router.push("/dashboard");
            return;
          }
          if (isMounted) setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [router, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#166534] flex items-center justify-center text-2xl shadow-lg animate-bounce">
          🐄
        </div>
        <div className="flex items-center gap-2 text-primary-800 font-semibold text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-primary-700" />
          <span>Loading AI Register...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* Sidebar */}
      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        <Navbar
          user={user}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          title={title}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-16">
          {children}
        </main>
      </div>
    </div>
  );
};
