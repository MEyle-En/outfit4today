import type { Metadata } from "next";

/**
 * Vorschau für geteilte Einladungslinks (WhatsApp, iMessage …): eigener Titel und Text statt der allgemeinen App-Beschreibung.
 * Der Code selbst wird bewusst nicht in die Vorschau geschrieben.
 */
export const metadata: Metadata = {
  title: "Komm in meine Crew – Outfit4Today",
  description: "Wir teilen Outfits und Teile nur unter uns. Tippe, um der Crew beizutreten.",
  openGraph: {
    title: "Komm in meine Crew auf Outfit4Today",
    description: "Wir teilen Outfits und Teile nur unter uns. Tippe, um der Crew beizutreten.",
    siteName: "Outfit4Today",
    type: "website",
    images: [{ url: "/icons/512", width: 512, height: 512, alt: "Outfit4Today" }],
  },
  robots: { index: false },
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
