"use client";

import { useState } from "react";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import { Trash2 } from "lucide-react";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/useAuthStore";

const SUPPORT = LEGAL.email;

/** Öffentliche Seite zur Kontolöschung (für Store-Formulare). Ohne Login erreichbar, zweisprachig. */
export default function AccountDeletionPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const [open, setOpen] = useState(false);

  return (
    <main className="min-h-dvh bg-background p-6 pb-16 text-zinc-200">
      <Link href="/" className="text-sm text-accent-soft hover:text-white">
        ← Outfit4Today
      </Link>

      <section className="mt-4 space-y-3">
        <h1 className="font-display text-3xl font-bold text-white">Konto und Daten löschen</h1>
        <p>
          Du kannst dein Outfit4Today-Konto jederzeit selbst löschen. Dabei werden dein Konto, dein Profil (inklusive Profilbild),
          alle deine Kleidungsstücke samt Fotos, deine Posts, Kommentare, Likes, Reaktionen, Crew-Mitgliedschaften und Marktplatz-Einträge
          endgültig entfernt. Das kann nicht rückgängig gemacht werden.
        </p>
        <ol className="ml-5 list-decimal space-y-1">
          <li>Melde dich in der App an.</li>
          <li>Öffne das Profil und scrolle nach unten.</li>
          <li>Tippe auf „Konto löschen“ und bestätige, indem du LÖSCHEN eintippst.</li>
        </ol>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-2xl font-bold text-white">Delete your account and data</h2>
        <p>
          You can delete your Outfit4Today account at any time. This permanently removes your account, profile (including profile
          picture), all clothing items and their photos, posts, comments, likes, reactions, crew memberships and marketplace entries.
          This cannot be undone.
        </p>
        <ol className="ml-5 list-decimal space-y-1">
          <li>Sign in to the app.</li>
          <li>Open your profile and scroll to the bottom.</li>
          <li>Tap “Delete account” and confirm by typing DELETE.</li>
        </ol>
      </section>

      <section className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-surface p-4">
        {authReady && isAuthenticated ? (
          <>
            <p className="text-sm text-zinc-300">Du bist angemeldet. / You are signed in.</p>
            <Button
              className="w-full border border-red-400/50 bg-red-600 text-white hover:bg-red-500"
              onClick={() => setOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Konto jetzt löschen / Delete account now
            </Button>
            <DeleteAccountDialog open={open} onOpenChange={setOpen} />
          </>
        ) : (
          <p className="text-sm text-zinc-300">
            Kein Zugriff mehr auf dein Konto? Schreib uns an <a className="text-accent-soft underline" href={`mailto:${SUPPORT}?subject=Konto%20l%C3%B6schen`}>{SUPPORT}</a>{" "}
            – wir löschen dein Konto auf Anfrage.
            <br />
            <span className="text-zinc-400">
              No access to your account any more? Email us at <a className="text-accent-soft underline" href={`mailto:${SUPPORT}?subject=Delete%20account`}>{SUPPORT}</a> and we will delete it on request.
            </span>
          </p>
        )}
      </section>
    </main>
  );
}
