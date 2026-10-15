import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Nutzungsbedingungen / Terms of Use" };

const SUPPORT = LEGAL.supportEmail;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-5 space-y-2">
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    {children}
  </section>
);

/** Nutzungsbedingungen (DE + EN), öffentlich erreichbar. Vor dem Launch juristisch prüfen lassen. */
export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-background p-6 pb-16 text-zinc-200">
      <Link href="/" className="text-sm text-accent-soft hover:text-white">
        ← Outfit4Today
      </Link>

      {/* ---------------- Deutsch ---------------- */}
      <h1 className="mb-1 mt-4 font-display text-3xl font-bold text-white">Nutzungsbedingungen</h1>
      <p className="mb-6 text-sm text-zinc-500">English version below · Stand: Oktober 2026</p>

      <Section title="1. Geltungsbereich">
        <p>
          Diese Bedingungen gelten für die Nutzung von Outfit4Today (digitaler Kleiderschrank, Fit Lab, Crews und Marktplatz). Mit der
          Registrierung erklärst du dich mit ihnen einverstanden.
        </p>
      </Section>
      <Section title="2. Dein Konto">
        <p>
          Du musst für ein Konto richtige Angaben machen und dein Passwort geheim halten. Du bist für alles verantwortlich, was über dein Konto
          passiert. Du kannst dein Konto jederzeit in der App löschen (Profil → „Konto löschen“).
        </p>
      </Section>
      <Section title="3. Deine Inhalte und Verhaltensregeln">
        <p>
          Du bleibst Inhaber deiner Fotos und Texte, räumst uns aber das Recht ein, sie für den Betrieb der App anzuzeigen und zu speichern.
          Du versicherst, dass du die Rechte an hochgeladenen Inhalten hast.
        </p>
        <p className="font-medium text-white">
          Es sind keine anstößigen, illegalen oder belästigenden Inhalte erlaubt. Insbesondere verboten sind:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Beleidigungen, Mobbing, Bedrohungen, Belästigung oder Hass gegen Personen oder Gruppen</li>
          <li>sexuell explizite, pornografische oder gewaltverherrlichende Inhalte sowie Nacktheit</li>
          <li>rechtswidrige Inhalte, Urheberrechts- und Markenverletzungen, gefälschte Ware</li>
          <li>Spam, Werbung ohne Zustimmung, Betrug und Täuschung</li>
          <li>Fotos von anderen Personen ohne deren Einwilligung und Inhalte von Minderjährigen mit Gefährdungspotenzial</li>
        </ul>
      </Section>
      <Section title="4. Melden, Blockieren und Moderation">
        <p>
          Du kannst Posts, Kommentare und Nutzer in der App melden und Nutzer blockieren. Gemeldete Inhalte prüfen wir zeitnah, in der Regel
          innerhalb von 24 Stunden. Wir entfernen Inhalte und sperren Konten, die gegen diese Bedingungen verstoßen, ohne Vorankündigung.
        </p>
      </Section>
      <Section title="5. Marktplatz">
        <p>
          Outfit4Today vermittelt nur den Kontakt zwischen Nutzern zum Tauschen und Verkaufen. Kaufverträge kommen ausschließlich zwischen den
          Nutzern zustande; wir wickeln keine Zahlungen ab und haften nicht für Angebote, Qualität, Lieferung oder Zahlung.
        </p>
      </Section>
      <Section title="6. Haftung und Änderungen">
        <p>
          Wir stellen die App „wie sie ist“ bereit und haften nur bei Vorsatz und grober Fahrlässigkeit sowie nach den gesetzlichen Regeln für
          Verletzung von Leben, Körper und Gesundheit. Wir können diese Bedingungen mit Wirkung für die Zukunft ändern; über wesentliche
          Änderungen informieren wir in der App.
        </p>
      </Section>
      <Section title="7. Kontakt">
        <p>
          Fragen, Meldungen und Moderationsanliegen:{" "}
          <a className="text-accent-soft underline" href={`mailto:${SUPPORT}`}>
            {SUPPORT}
          </a>{" "}
          · <Link className="text-accent-soft underline" href="/contact">Kontaktseite</Link> ·{" "}
          <Link className="text-accent-soft underline" href="/privacy">Datenschutz</Link>
        </p>
      </Section>

      {/* ---------------- English ---------------- */}
      <hr className="my-8 border-white/10" />
      <h2 className="mb-1 font-display text-3xl font-bold text-white">Terms of Use</h2>
      <p className="mb-6 text-sm text-zinc-500">Last updated: October 2026</p>

      <Section title="1. Scope">
        <p>
          These terms apply to your use of Outfit4Today (digital wardrobe, Fit Lab, crews and marketplace). By signing up you agree to them.
        </p>
      </Section>
      <Section title="2. Your account">
        <p>
          You must provide accurate information and keep your password secret. You are responsible for all activity on your account. You can delete
          your account at any time in the app (Profile → “Delete account”).
        </p>
      </Section>
      <Section title="3. Your content and rules of conduct">
        <p>
          You keep ownership of your photos and text, but you grant us the right to store and display them to operate the app. You confirm you hold the
          rights to the content you upload.
        </p>
        <p className="font-medium text-white">No offensive, illegal or harassing content is allowed. In particular, the following is prohibited:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li>insults, bullying, threats, harassment or hate against people or groups</li>
          <li>sexually explicit, pornographic or violent content, and nudity</li>
          <li>unlawful content, copyright or trademark infringement, counterfeit goods</li>
          <li>spam, unsolicited advertising, fraud and deception</li>
          <li>photos of other people without their consent, and content that endangers minors</li>
        </ul>
      </Section>
      <Section title="4. Reporting, blocking and moderation">
        <p>
          You can report posts, comments and users in the app and block users. We review reports promptly, usually within 24 hours. We remove content
          and suspend accounts that violate these terms without prior notice.
        </p>
      </Section>
      <Section title="5. Marketplace">
        <p>
          Outfit4Today only connects users for swapping and selling. Contracts are concluded solely between users; we do not process payments and are
          not liable for listings, quality, delivery or payment.
        </p>
      </Section>
      <Section title="6. Liability and changes">
        <p>
          The app is provided “as is”. We are liable only for intent and gross negligence and as required by law for injury to life, body or health. We
          may change these terms with effect for the future; we will announce material changes in the app.
        </p>
      </Section>
      <Section title="7. Contact">
        <p>
          Questions, reports and moderation requests:{" "}
          <a className="text-accent-soft underline" href={`mailto:${SUPPORT}`}>
            {SUPPORT}
          </a>{" "}
          · <Link className="text-accent-soft underline" href="/contact">Contact page</Link> ·{" "}
          <Link className="text-accent-soft underline" href="/privacy">Privacy</Link>
        </p>
      </Section>
    </main>
  );
}
