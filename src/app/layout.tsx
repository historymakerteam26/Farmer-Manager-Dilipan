import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/common/Toast";
import { PWAInstaller } from "@/components/common/PWAInstaller";

export const metadata: Metadata = {
  title: "AI REGISTER - Artificial Insemination Management",
  description: "Enterprise Cattle Artificial Insemination (AI), Pregnancy Diagnosis (PD), Farmer Registry, and Calving CRM.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Register",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#166534",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] min-h-screen text-[#0F172A] antialiased">
        <PWAInstaller />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
