import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

export const metadata: Metadata = { title: "Kontakt / Contact" };

const SUPPORT = "support@outfit4today.com"; // Platzhalter, später anpassen

/** Öffentliche Kontaktseite für Support und Moderation (DE + EN). */
export default function ContactPage() {
  return (
    <main className="min-h-dvh bg-background p-6 pb-16 text-zinc-200">
      <Link href="/" className="text-sm text-accent-soft hover:text-white">
        ← Outfit4Today
      </Link>
      <h1 className="mb-4 mt-4 font-display text-3xl font-bold text-white">Kontakt &amp; Support</h1>

      <a
        href={`mailto:${SUPPORT}`}
        className="mb-6 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 font-medium text-white"
      >
        <Mail className="h-5 w-5 text-accent-soft" /> {SUPPORT}
      </a>

      <section className="space-y-2">
        <p>
          Schreib uns bei Fragen, Problemen, Hinweisen auf unangemessene Inhalte oder wenn du Hilfe bei der Kontolöschung brauchst. Inhalte kannst du
          direkt in der App über das Menü (⋮) am Post, am Kommentar oder in der Mitgliederliste melden. Gemeldete Inhalte prüfen wir in der Regel
          innerhalb von 24 Stunden.
        </p>
      </section>
      <section className="mt-6 space-y-2">
        <p>
          Questions, problems, reports of inappropriate content or help deleting your account? Email us. You can report content directly in the app via the
          ⋮ menu on a post, a comment or in the member list. We usually review reports within 24 hours.
        </p>
      </section>

      <p className="mt-8 flex flex-wrap gap-4 text-sm text-zinc-400">
        <Link href="/terms" className="hover:text-white">Nutzungsbedingungen / Terms</Link>
        <Link href="/privacy" className="hover:text-white">Datenschutz / Privacy</Link>
        <Link href="/imprint" className="hover:text-white">Impressum</Link>
        <Link href="/account-deletion" className="hover:text-white">Konto löschen / Delete account</Link>
      </p>
    </main>
  );
}
