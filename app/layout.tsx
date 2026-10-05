import type { Metadata, Viewport } from "next";
import { Caveat, Inter } from "next/font/google";
import "./globals.css";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Toaster } from "@/components/ui/Toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Handschrift für Texte im Fit Lab
const caveat = Caveat({ subsets: ["latin"], variable: "--font-hand", weight: ["500", "700"] });

export const metadata: Metadata = {
  applicationName: "Outfit4Today",
  icons: {
    icon: [{ url: "/icons/192", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/icons/180", sizes: "180x180", type: "image/png" }],
  },
  title: { default: "Outfit4Today – Digital Wardrobe & AI Stylist", template: "%s · Outfit4Today" },
  description: "Outfit4Today: dein digitaler Kleiderschrank mit AI Stylist – ohne Tipparbeit.",
  appleWebApp: { capable: true, title: "Outfit4Today", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "Outfit4Today",
    description: "Digital Wardrobe & AI Stylist",
    siteName: "Outfit4Today",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${inter.variable} ${caveat.variable} dark`}>
      <head>
        {/* Clash Display via Fontshare – fällt auf Inter zurück, falls nicht ladbar. */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: `:root{--font-clash:"Clash Display"}` }} />
      </head>
      <body className="min-h-dvh bg-background font-sans antialiased">
        <div className="mx-auto min-h-dvh max-w-md">
          <AuthGuard>{children}</AuthGuard>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
