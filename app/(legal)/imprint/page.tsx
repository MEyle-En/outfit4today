import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Impressum" };

export default function Page() {
  return (
    <main className="min-h-dvh bg-background p-6 pb-16 text-zinc-200">
      <Link href="/" className="text-sm text-accent-soft hover:text-white">
        ← Zurück
      </Link>
      <h1 className="mb-6 mt-4 font-display text-3xl font-bold text-white">Impressum</h1>
      <section className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold text-white">Angaben gemäß § 5 DDG</h2>
        <p>
          Emel Can
          <br />
          [Straße + Hausnummer]
          <br />
          [PLZ + Ort]
          <br />
          [Land]
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold text-white">Kontakt</h2>
        <p>E-Mail: kontakt@zovai.at</p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold text-white">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          Emel Can
          <br />
          [Adresse wie oben]
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold text-white">Haftungsausschluss</h2>
        <p>
          Die Inhalte dieser App wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität
          der Inhalte können wir jedoch keine Gewähr übernehmen.
        </p>
      </section>
      <p className="mt-8 text-sm text-zinc-500">Stand: Oktober 2026</p>
    </main>
  );
}
