import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "Vision Audit Flow Pro — AI-Powered Inventory Audit System",
    template: "%s · Vision Audit Flow Pro",
  },
  description:
    "Vision Audit Flow Pro is an enterprise-grade, AI-powered automated inventory audit platform powered by Google Gemini Vision. Count, reconcile, and detect anomalies across all your locations in real time.",
  keywords: [
    "inventory audit",
    "AI vision",
    "Gemini",
    "warehouse management",
    "stock counting",
    "automated audit",
  ],
  authors: [{ name: "Vision Audit Flow Pro" }],
  openGraph: {
    title: "Vision Audit Flow Pro",
    description:
      "AI-Powered Automated Inventory Audit System with Google Gemini Vision.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
