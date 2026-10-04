/** Kleine Abschnitts-Überschrift, damit Kategorie, Farbe & Co. klar getrennte Bereiche sind. */
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{children}</p>;
}
