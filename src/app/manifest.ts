import { MetadataRoute } from "next";

export default function manifest(): any {
  return {
    id: "/?source=pwa",
    name: "AI REGISTER - Dilipan",
    short_name: "AI Register",
    description: "Dairy Cattle Artificial Insemination, Pregnancy Diagnosis & Payment CRM",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "window-controls-overlay"] as any,
    background_color: "#166534",
    theme_color: "#166534",
    orientation: "portrait",
    lang: "en",
    dir: "ltr",
    categories: ["business", "productivity", "utilities"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/icons/screenshot-mobile.png",
        sizes: "720x1280",
        type: "image/png",
        form_factor: "narrow" as any,
        label: "AI Register Mobile Dashboard",
      },
      {
        src: "/icons/screenshot-desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide" as any,
        label: "AI Register Desktop Overview",
      },
    ],
    shortcuts: [
      {
        name: "New AI Record",
        short_name: "New AI",
        description: "Register cow artificial insemination",
        url: "/ai-records/new",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Payment Pending A/C",
        short_name: "Payments",
        description: "Track farmer dues and pending amounts",
        url: "/payments",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Register Farmer",
        short_name: "Add Farmer",
        description: "Register a new farmer",
        url: "/farmers/new",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
