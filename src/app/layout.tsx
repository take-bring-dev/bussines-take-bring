import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { brand } from "@/config/brand";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  applicationName: brand.name,
  title: {
    default: `${brand.name} · ${brand.fullName}`,
    template: `%s · ${brand.name}`,
  },
  description:
    "Take Bring Dispatching — freight marketplace for shippers and carriers.",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/images/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/images/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: brand.name,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ABC629",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full`}
    >
      <body className="min-h-full bg-surface font-sans antialiased">
        <ToastProvider>
          {children}
          <PwaInstallPrompt />
        </ToastProvider>
      </body>
    </html>
  );
}
