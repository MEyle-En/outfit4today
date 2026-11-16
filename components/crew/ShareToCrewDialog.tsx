"use client";

import { useMemo, useState } from "react";
import { Shirt } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PickTile } from "@/components/wardrobe/PickTile";
import { useTranslation } from "@/hooks/useTranslation";
import { isDemoItem } from "@/lib/demo";
import { toast } from "@/lib/store/useToastStore";
import { useCrewStore } from "@/lib/store/useCrewStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { sharedWithCrewId } from "@/lib/visibility";
import type { Crew, Visibility } from "@/types";

/**
 * Sichtbarkeit so ändern, dass GENAU diese Crew das Teil (nicht mehr) sieht – andere Crews bleiben unberührt.
 * crewIds leer/undefined bedeutet "alle Crews"; deshalb wird beim Entfernen aus "alle" die Liste der übrigen Crews gesetzt.
 */
export function crewSharePatch(v: Visibility, crewId: string, share: boolean, allCrewIds: string[]): Partial<Visibility> | null {
  const has = sharedWithCrewId(v, crewId);
  if (share === has) return null;
  if (share) {
    // Bisher gar nicht mit einer Crew geteilt -> nur diese Crew; sonst diese Crew zur Auswahl hinzufügen
    const current = v.sharedWithCrew && !v.isPrivate ? v.crewIds ?? [] : [];
    return { sharedWithCrew: true, crewIds: [...current, crewId] };
  }
  const current = v.crewIds?.length ? v.crewIds : allCrewIds;
  const rest = current.filter((id) => id !== crewId);
  return rest.length ? { sharedWithCrew: true, crewIds: rest } : { sharedWithCrew: false, crewIds: undefined };
}

/** Teile aus dem eigenen Kleiderschrank für eine bestimmte Crew freigeben oder zurückziehen. */
export function ShareToCrewDialog({ crew, open, onOpenChange }: { crew: Crew; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const items = useWardrobeStore((s) => s.items);
  const setVisibility = useWardrobeStore((s) => s.setVisibility);
  const crews = useCrewStore((s) => s.crews);

  const own = useMemo(() => items.filter((i) => !isDemoItem(i)), [items]);
  const [selected, setSelected] = useState<string[]>(() => own.filter((i) => sharedWithCrewId(i.visibility, crew.id)).map((i) => i.id));

  const save = () => {
    const allCrewIds = crews.map((c) => c.id);
    let changed = 0;
    for (const i of own) {
      const patch = crewSharePatch(i.visibility, crew.id, selected.includes(i.id), allCrewIds);
      if (!patch) continue;
      setVisibility(i.id, patch);
      changed += 1;
    }
    if (changed > 0) toast(t("crewShare_saved", { crew: crew.name }));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("crewShare_title", { crew: crew.name })}</DialogTitle>
        <DialogDescription>{t("crewShare_desc")}</DialogDescription>

        <div className="mt-5 space-y-5">
          {own.length === 0 ? (
            <EmptyState compact icon={Shirt} title={t("crewShare_emptyTitle")} description={t("crewShare_emptyDesc")} />
          ) : (
            <div className="grid max-h-80 grid-cols-4 gap-2 overflow-y-auto pr-1">
              {own.map((i) => (
                <PickTile
                  key={i.id}
                  image={i.image}
                  transparent={i.hasTransparentBackground}
                  name={i.name}
                  category={i.category}
                  color={i.color}
                  selected={selected.includes(i.id)}
                  onClick={() => setSelected((s) => (s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id]))}
                />
              ))}
            </div>
          )}

          <Button size="lg" className="w-full" disabled={own.length === 0} onClick={save}>
            {t("crewShare_save", { n: selected.length })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
