import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalSection as S } from "@/components/legal/LegalSection";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Datenschutzerklärung / Privacy Policy" };

const Mail = ({ to }: { to: string }) => (
  <a className="text-accent-soft underline" href={`mailto:${to}`}>
    {to}
  </a>
);

/**
 * Datenschutzerklärung (DE + EN). Beschreibt den tatsächlichen Stand der App.
 * TODO (vor dem Launch): Auftragsverarbeitungsverträge (AVV/DPA) mit Vercel und Supabase abschließen bzw. prüfen,
 * Mindestalter festlegen, Aufbewahrung von Meldungen (reports) nach einer Kontolöschung klären und die Texte juristisch prüfen lassen.
 */
export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-background p-6 pb-16 text-zinc-200">
      <Link href="/" className="text-sm text-accent-soft hover:text-white">
        ← Outfit4Today
      </Link>

      {/* ======================= DEUTSCH ======================= */}
      <h1 className="mb-1 mt-4 font-display text-3xl font-bold text-white">Datenschutzerklärung</h1>
      <p className="mb-6 text-sm text-zinc-500">English version below · Stand: {LEGAL.updated}</p>

      <S title="1. Verantwortliche Person">
        <p>
          {LEGAL.name}
          <br />
          {LEGAL.street}
          <br />
          {LEGAL.zipCity}, {LEGAL.country}
          <br />
          E-Mail: <Mail to={LEGAL.email} />
        </p>
        <p>
          Wir verarbeiten personenbezogene Daten nur, soweit das für den Betrieb der App nötig ist (Art. 6 Abs. 1 lit. b DSGVO, Vertragserfüllung), zur Sicherheit
          und Missbrauchsabwehr (lit. f, berechtigtes Interesse) oder mit deiner Einwilligung (lit. a).
        </p>
      </S>

      <S title="2. Welche Daten wir verarbeiten">
        <LegalList
          items={[
            "Konto: E-Mail-Adresse, Benutzername und Passwort (das Passwort speichern wir nicht im Klartext; die Verwaltung übernimmt Supabase Auth). Bei Google- oder Apple-Login erhalten wir E-Mail und Namen von dort.",
            "Profil: Profilbild (optional) und Benutzername. Beides ist für andere angemeldete Nutzer sichtbar, etwa in Crews, Posts und Kommentaren.",
            "Kleiderschrank: Fotos, Namen, Kategorien, Farben, Größen, Tags, Sichtbarkeits- und Angebotseinstellungen (Tausch/Verkauf, Preis), Tragehäufigkeit.",
            "Inhalte: Fit-Posts samt Bildausschnitt der verwendeten Teile, Kommentare, Tausch-Vorschläge, Likes und Reaktionen, Crew-Mitgliedschaften.",
            "Chat: Nachrichten zu Marktplatz-Angeboten zwischen Käufer und Verkäufer.",
            "Moderation: Meldungen (Grund, Beschreibung) und Blockierungen.",
            "Technisches: Beim Aufruf der App verarbeiten unsere Dienstleister (siehe 4) technisch notwendige Verbindungsdaten wie IP-Adresse, Zeitpunkt und Browser.",
          ]}
        />
        <p>
          Lokal auf deinem Gerät (nicht auf unseren Servern) liegen Einstellungen wie Sprache, Ton, Antworten aus dem Vibe Check, der Lesestand deiner Chats
          und die Benachrichtigungsliste.
        </p>
      </S>

      <S title="3. Sichtbarkeit deiner Inhalte">
        <LegalList
          items={[
            "Posts in einer Crew sehen nur die Mitglieder dieser Crew. Als „öffentlich“ markierte Posts sehen alle angemeldeten Nutzer.",
            "Teile, die du auf dem Marktplatz anbietest, sehen alle angemeldeten Nutzer. Teile, die du mit der Crew teilst, sehen deine Crew-Mitglieder. Private Teile sind in der App für andere nicht abrufbar.",
            "Fotos liegen im Storage-Bucket „wardrobe-images“ von Supabase. Der Bucket erzeugt öffentlich lesbare URLs: Wer die genaue Bild-URL kennt, kann das Foto ohne Anmeldung öffnen, auch bei privaten Teilen. Die URLs sind nicht erratbar, aber nicht geheim. Teile die Adresse deshalb nicht weiter.",
          ]}
        />
      </S>

      <S title="4. Dienstleister (Auftragsverarbeiter) und Empfänger">
        <LegalList
          items={[
            <>
              <strong>Vercel Inc.</strong> (USA): Hosting der Web-App. Verarbeitet technische Verbindungsdaten.
            </>,
            <>
              <strong>Supabase</strong>: Datenbank, Anmeldung (Auth), Dateispeicher und Realtime für Chat, Posts und Crews. Region der Datenbank: {LEGAL.supabaseRegion}. Das Vereinigte Königreich hat einen Angemessenheitsbeschluss der EU-Kommission; ein Datenschutzniveau wie in der EU gilt damit als gewährleistet.
            </>,
            <>
              <strong>Google Ireland Limited</strong>: nur wenn du dich mit Google anmeldest.
            </>,
            <>
              <strong>Apple Inc.</strong>: nur wenn du dich mit Apple anmeldest.
            </>,
          ]}
        />
        <p>
          Mit Dienstleistern außerhalb der EU (z. B. Vercel, USA) sind Datenübermittlungen möglich; diese stützen sich auf EU-Standardvertragsklauseln bzw. das EU-US Data Privacy
          Framework. Wir geben deine Daten nicht zu Marketingzwecken weiter und verkaufen sie nicht.
        </p>
      </S>

      <S title="5. Fotos, KI-Hintergrundentfernung und externe Inhalte">
        <LegalList
          items={[
            "Die Hintergrundentfernung läuft in deinem Browser (auf deinem Gerät). Dein Foto wird dafür nicht an einen KI-Dienst gesendet. Beim ersten Einsatz lädt dein Browser einmalig das KI-Modell von einem CDN (staticimgly.com) herunter; dabei sieht der Betreiber des CDN deine IP-Adresse.",
            "Die Schriftart „Clash Display“ laden wir von Fontshare (api.fontshare.com); dabei wird deine IP-Adresse übermittelt.",
            "Beispiel-Inhalte (Demo-Kleidung) zeigen Fotos von Unsplash (images.unsplash.com); dabei wird deine IP-Adresse übermittelt.",
            "Wenn du einen Fit teilst, geschieht das über dein Betriebssystem, WhatsApp oder deine E-Mail-App. Das veranlasst du selbst; wir sehen das nicht.",
          ]}
        />
      </S>

      <S title="6. App-Installation, lokaler Speicher und Cookies">
        <p>
          Die App kann als Web-App (PWA) installiert werden. Dafür nutzt sie einen Service Worker (Zwischenspeicher für Programmdateien und eine Offline-Seite) sowie
          localStorage und sessionStorage deines Browsers für Einstellungen, deine Anmeldung (Supabase-Token) und kleine Merker (z. B. „Installationshinweis gesehen“). Das ist
          technisch notwendig. Wir setzen keine Tracking- oder Werbe-Cookies, nutzen keine Analyse-Tools und zeigen keine Werbung.
        </p>
      </S>

      <S title="7. Speicherdauer">
        <p>
          Wir speichern deine Daten, bis du dein Konto löschst. Mit der Löschung entfernen wir dein Profil, deine Kleidungsstücke samt Fotos, Posts, Kommentare, Likes, Chats und
          Mitgliedschaften sowie dein Login. Verbindungsdaten bei den Dienstleistern werden nach deren Fristen gelöscht.
        </p>
      </S>

      <S title="8. Deine Rechte">
        <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO).</p>
        <LegalList
          items={[
            <>
              Konto und Daten löschen: direkt in der App unter Profil → „Konto löschen“ oder über die Seite{" "}
              <Link className="text-accent-soft underline" href="/account-deletion">
                /account-deletion
              </Link>
              . Ohne Zugang zum Konto per E-Mail an <Mail to={LEGAL.email} />.
            </>,
            <>
              Auskunft, Berichtigung oder Datenkopie: E-Mail an <Mail to={LEGAL.email} />.
            </>,
            "Einwilligungen (z. B. Anmeldung über Google/Apple) kannst du jederzeit widerrufen, indem du dein Konto löschst.",
            <>
              Du kannst dich bei der österreichischen Datenschutzbehörde beschweren (<a className="text-accent-soft underline" href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">dsb.gv.at</a>).
            </>,
          ]}
        />
      </S>

      <S title="9. Änderungen">
        <p>Wir passen diese Erklärung an, wenn sich die App oder die Rechtslage ändert. Den aktuellen Stand findest du hier und im Profil.</p>
      </S>

      {/* ======================= ENGLISH ======================= */}
      <hr className="my-8 border-white/10" />
      <h2 className="mb-1 font-display text-3xl font-bold text-white">Privacy Policy</h2>
      <p className="mb-6 text-sm text-zinc-500">Last updated: {LEGAL.updated}</p>

      <S title="1. Controller">
        <p>
          {LEGAL.name}, {LEGAL.street}, {LEGAL.zipCity}, {LEGAL.countryEn} · <Mail to={LEGAL.email} />
        </p>
        <p>
          We process personal data only as needed to run the app (Art. 6(1)(b) GDPR, contract), for security and abuse prevention (point (f), legitimate interest) or with your
          consent (point (a)).
        </p>
      </S>

      <S title="2. Data we process">
        <LegalList
          items={[
            "Account: email address, username and password (the password is not stored in plain text; Supabase Auth manages it). With Google or Apple sign-in we receive your email and name from them.",
            "Profile: optional profile picture and username, visible to other signed-in users (e.g. in crews, posts and comments).",
            "Wardrobe: photos, names, categories, colors, sizes, tags, visibility and listing settings (swap/sale, price), wear counts.",
            "Content: fit posts including the image snapshot of the items used, comments, swap suggestions, likes and reactions, crew memberships.",
            "Chat: messages about marketplace listings between buyer and seller.",
            "Moderation: reports (reason, description) and blocks.",
            "Technical: when you use the app, our providers (see 4) process technically necessary connection data such as IP address, time and browser.",
          ]}
        />
        <p>Stored only on your device (not on our servers): settings such as language and sound, Vibe Check answers, your chat read state and the notification list.</p>
      </S>

      <S title="3. Who can see your content">
        <LegalList
          items={[
            "Posts in a crew are visible to that crew's members only. Posts marked “public” are visible to all signed-in users.",
            "Items you list on the marketplace are visible to all signed-in users; items shared with your crew are visible to your crew members. Private items cannot be retrieved by others through the app.",
            "Photos are stored in the Supabase storage bucket “wardrobe-images”. The bucket creates publicly readable URLs: anyone who knows the exact image URL can open the photo without signing in, including photos of private items. The URLs are not guessable but not secret. Please do not share them.",
          ]}
        />
      </S>

      <S title="4. Service providers (processors) and recipients">
        <LegalList
          items={[
            <>
              <strong>Vercel Inc.</strong> (USA): hosting of the web app; processes technical connection data.
            </>,
            <>
              <strong>Supabase</strong>: database, authentication, file storage and realtime for chat, posts and crews. Database region: {LEGAL.supabaseRegionEn}. The United Kingdom benefits from an EU Commission adequacy decision, so a level of data protection equivalent to the EU is deemed assured.
            </>,
            <>
              <strong>Google Ireland Limited</strong>: only if you sign in with Google.
            </>,
            <>
              <strong>Apple Inc.</strong>: only if you sign in with Apple.
            </>,
          ]}
        />
        <p>
          Transfers to providers outside the EU (e.g. Vercel, USA) are possible and rely on EU Standard Contractual Clauses or the EU-US Data Privacy Framework. We do not share your data for
          marketing purposes and we do not sell it.
        </p>
      </S>

      <S title="5. Photos, AI background removal and external content">
        <LegalList
          items={[
            "Background removal runs in your browser (on your device). Your photo is not sent to an AI service. On first use your browser downloads the AI model once from a CDN (staticimgly.com); the CDN operator sees your IP address.",
            "We load the font “Clash Display” from Fontshare (api.fontshare.com); your IP address is transmitted.",
            "Example content (demo clothing) shows photos from Unsplash (images.unsplash.com); your IP address is transmitted.",
            "Sharing a fit happens via your operating system, WhatsApp or your email app. You initiate it; we do not see it.",
          ]}
        />
      </S>

      <S title="6. App installation, local storage and cookies">
        <p>
          The app can be installed as a web app (PWA). It uses a service worker (cache for program files and an offline page) and your browser&apos;s localStorage and sessionStorage for settings, your
          sign-in (Supabase token) and small flags (e.g. “install hint seen”). This is technically necessary. We use no tracking or advertising cookies, no analytics tools and show no ads.
        </p>
      </S>

      <S title="7. Retention">
        <p>
          We keep your data until you delete your account. Deleting it removes your profile, clothing items and photos, posts, comments, likes, chats, memberships and your login. Connection data at
          our providers is deleted according to their retention periods.
        </p>
      </S>

      <S title="8. Your rights">
        <p>You have the right to access, rectification, erasure, restriction of processing, data portability and objection (Art. 15–21 GDPR).</p>
        <LegalList
          items={[
            <>
              Delete your account and data: in the app under Profile → “Delete account” or on{" "}
              <Link className="text-accent-soft underline" href="/account-deletion">
                /account-deletion
              </Link>
              . Without access to your account, email <Mail to={LEGAL.email} />.
            </>,
            <>
              Access, rectification or a copy of your data: email <Mail to={LEGAL.email} />.
            </>,
            "You can withdraw consent (e.g. Google/Apple sign-in) at any time by deleting your account.",
            <>
              You may lodge a complaint with the Austrian data protection authority (<a className="text-accent-soft underline" href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">dsb.gv.at</a>) or the authority in your country.
            </>,
          ]}
        />
      </S>

      <S title="9. Changes">
        <p>We update this policy when the app or the law changes. The current version is always available here and in your profile.</p>
      </S>

      <p className="mt-6 flex flex-wrap gap-4 text-sm text-zinc-400">
        <Link href="/terms" className="hover:text-white">Nutzungsbedingungen / Terms</Link>
        <Link href="/imprint" className="hover:text-white">Impressum</Link>
        <Link href="/contact" className="hover:text-white">Kontakt / Contact</Link>
      </p>
    </main>
  );
}
