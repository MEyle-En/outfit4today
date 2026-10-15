import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection as S } from "@/components/legal/LegalSection";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Impressum / Legal Notice" };

/**
 * Impressum. TODO (vor dem Launch):
 *  - Österreich: Angaben nach § 5 ECG (E-Commerce-Gesetz); prüfen, ob zusätzlich eine Offenlegung nach § 25 MedienG nötig ist.
 *  - Umsatzsteuer: falls zutreffend den Absatz unten einblenden ("nicht umsatzsteuerpflichtig" oder UID-Nummer).
 *  - Ein zweiter schneller Kontaktweg neben der E-Mail (z. B. Telefon oder Kontaktformular) ist meist vorgeschrieben; die Seite /contact ersetzt kein Formular.
 */
export default function ImprintPage() {
  return (
    <main className="min-h-dvh bg-background p-6 pb-16 text-zinc-200">
      <Link href="/" className="text-sm text-accent-soft hover:text-white">
        ← Outfit4Today
      </Link>
      <h1 className="mb-6 mt-4 font-display text-3xl font-bold text-white">Impressum</h1>

      <S title="Angaben gemäß § 5 ECG">
        <p>
          {LEGAL.name}
          <br />
          {LEGAL.street}
          <br />
          {LEGAL.zipCity}
          <br />
          {LEGAL.country}
        </p>
      </S>

      <S title="Kontakt">
        <p>
          E-Mail:{" "}
          <a className="text-accent-soft underline" href={`mailto:${LEGAL.email}`}>
            {LEGAL.email}
          </a>
        </p>
        {/* TODO: Falls erforderlich: zweiter Kontaktweg (Telefon oder Kontaktformular) ergänzen, falls für dein Land vorgeschrieben */}
      </S>

      {/* TODO: Umsatzsteuer-Hinweis nur einblenden, wenn zutreffend, z. B.:
          <S title="Umsatzsteuer"><p>Nicht umsatzsteuerpflichtig / UID: [Nummer]</p></S> */}

      <S title="Verantwortlich für den Inhalt">
        <p>
          {LEGAL.name}, {LEGAL.street}, {LEGAL.zipCity}, {LEGAL.country}
        </p>
      </S>

      <S title="Haftungsausschluss">
        <p>
          Die Inhalte dieser App wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Für
          Inhalte, die Nutzer einstellen, sind die jeweiligen Nutzer verantwortlich; gemeldete rechtswidrige Inhalte entfernen wir (siehe Nutzungsbedingungen).
        </p>
      </S>

      <p className="mt-6 flex flex-wrap gap-4 text-sm text-zinc-400">
        <Link href="/privacy" className="hover:text-white">Datenschutz / Privacy</Link>
        <Link href="/terms" className="hover:text-white">Nutzungsbedingungen / Terms</Link>
        <Link href="/contact" className="hover:text-white">Kontakt / Contact</Link>
      </p>
      <p className="mt-6 text-sm text-zinc-500">Stand: {LEGAL.updated}</p>
    </main>
  );
}
