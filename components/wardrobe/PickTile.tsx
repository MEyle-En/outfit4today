import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bild-Kachel mit Name; lila Rahmen + Haken bei Auswahl. */
export function PickTile({
  image,
  name,
  selected,
  onClick,
}: {
  image?: string;
  name: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className="group text-center">
      <span
        className={cn(
          "relative block aspect-square overflow-hidden rounded-xl border bg-gradient-to-br from-zinc-700 to-zinc-900 transition",
          selected ? "border-accent ring-2 ring-accent/60" : "border-white/10 group-hover:border-white/30",
        )}
      >
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="h-full w-full object-cover" />
        )}
        {selected && (
          <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-accent">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className={cn("mt-1 block truncate text-xs", selected ? "text-white" : "text-zinc-400")}>{name}</span>
    </button>
  );
}
