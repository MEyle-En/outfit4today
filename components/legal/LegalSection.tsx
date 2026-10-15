/** Gemeinsame Bausteine der Rechtsseiten (Datenschutz, Impressum, Bedingungen). */
export const LegalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-5 space-y-2">
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    {children}
  </section>
);

export const LegalList = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="ml-6 list-disc space-y-1">
    {items.map((it, i) => (
      <li key={i}>{it}</li>
    ))}
  </ul>
);
