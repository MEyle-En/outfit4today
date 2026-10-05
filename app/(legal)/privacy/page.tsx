import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Datenschutzerklärung" };

export default function Page() {
  return (
    <main className="min-h-dvh bg-background p-6 pb-16 text-zinc-200">
      <Link href="/" className="text-sm text-accent-soft hover:text-white">
        ← Zurück
      </Link>
      <h1 className="mb-6 mt-4 font-display text-3xl font-bold text-white">Datenschutzerklärung</h1>
      <section className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold text-white">1. Verantwortlicher</h2>
        <p>
          Outfit4Today
          <br />
          Emel Can
          <br />
          [Straße + Hausnummer, PLZ Ort]
          <br />
          kontakt@zovai.at
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold text-white">2. Erhobene Daten</h2>
        <p>Wir verarbeiten folgende Daten:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li>E-Mail-Adresse und Passwort (zur Kontoerstellung; das Passwort wird nicht im Klartext gespeichert)</li>
          <li>Benutzername (für andere Nutzer sichtbar)</li>
          <li>Hochgeladene Bilder von Kleidungsstücken und Profilbild</li>
          <li>Nutzungsdaten (z. B. Likes, Chats, Fits, Einstellungen)</li>
        </ul>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold text-white">3. Zweck der Verarbeitung</h2>
        <ul className="ml-6 list-disc space-y-1">
          <li>Bereitstellung der App-Funktionen</li>
          <li>Personalisierung von Empfehlungen</li>
          <li>Kommunikation zwischen Nutzern (Chat, Crew, Marktplatz)</li>
        </ul>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold text-white">4. Speicherung</h2>
        <p>
          In der aktuellen Version werden alle Daten ausschließlich lokal in deinem Browser gespeichert (LocalStorage) und nicht an
          unsere Server übertragen. Einzelne Funktionen laden Bilder von externen Anbietern (z. B. Unsplash) und die
          Hintergrund-Entfernung lädt beim ersten Mal ein KI-Modell herunter; dabei kann deine IP-Adresse an diese Anbieter
          übermittelt werden. In künftigen Versionen sollen Daten verschlüsselt auf Servern in der EU gespeichert werden; dann
          wird diese Erklärung angepasst.
        </p>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold text-white">5. Deine Rechte</h2>
        <p>Du hast das Recht auf:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Auskunft über deine gespeicherten Daten</li>
          <li>Berichtigung und Löschung deines Kontos und aller Daten</li>
          <li>Einschränkung der Verarbeitung und Datenübertragbarkeit</li>
          <li>Beschwerde bei einer Datenschutz-Aufsichtsbehörde</li>
        </ul>
      </section>

      <section className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold text-white">6. Kontakt</h2>
        <p>Bei Fragen zum Datenschutz: kontakt@zovai.at</p>
      </section>
      <p className="mt-8 text-sm text-zinc-500">Stand: Oktober 2026</p>
    </main>
  );
}
