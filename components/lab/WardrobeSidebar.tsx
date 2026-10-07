"use client";

import { useState } from "react";
import { ItemImage, frameClass } from "@/components/wardrobe/ItemImage";
import { useDraggable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Shirt } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryPicker } from "@/components/wardrobe/CategoryPicker";
import { useTranslation } from "@/hooks/useTranslation";
import { useLabStore } from "@/lib/store/useLabStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { cn } from "@/lib/utils";
import type { WardrobeItem } from "@/types";

export function TrayThumb({ item, dragging }: { item: WardrobeItem; dragging?: boolean }) {
  return (
    <div
      className={cn(
        "relative aspect-[4/5] overflow-hidden rounded-xl",
        frameClass(item.hasTransparentBackground),
        dragging && "border-accent shadow-glow",
      )}
    >
      <ItemImage src={item.image} alt={item.name} transparent={item.hasTransparentBackground} draggable={false} className="pointer-events-none h-full w-full" />
      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-4 text-[10px] font-medium">
        {item.name}
      </span>
    </div>
  );
}

function DraggableThumb({ item, className }: { item: WardrobeItem; className?: string }) {
  const { t } = useTranslation();
  const addItemToCanvas = useLabStore((s) => s.addItemToCanvas);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `tray:${item.id}` });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      // Tap (ohne Drag) legt das Teil direkt aufs Canvas – wichtig für Touch & Tastatur
      onClick={() => addItemToCanvas(item.id)}
      aria-label={t("tray_add", { name: item.name })}
      className={cn("shrink-0 transition-opacity", isDragging && "opacity-30", className)}
    >
      <TrayThumb item={item} />
    </button>
  );
}

/** Auf Mobile als Tray unter dem Canvas: Streifen (scrollbar) oder aufgeklapptes Grid. */
export function WardrobeSidebar() {
  const { t } = useTranslation();
  const everything = useWardrobeStore((s) => s.items);
  // Nur Teile, die im Lab nutzbar sind (Standard: alle)
  const all = everything.filter((i) => i.visibility.availableInLab);
  const [expanded, setExpanded] = useState(false);
  const [group, setGroup] = useState<"all" | "clothes" | "vibe">("all");
  // Lifestyle-Items ("Vibe") liegen neben der Kleidung im selben Tray und verhalten sich auf dem Canvas identisch
  const items = all.filter((i) => group === "all" || (group === "vibe") === (i.category === "lifestyle"));
  const router = useRouter();

  return (
    <section className="glass rounded-2xl p-3" aria-label={t("navWardrobe")}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">
          {t("navWardrobe")} <span className="text-sm font-normal text-zinc-500">{all.length}</span>
        </h2>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
        >
          {expanded ? t("less") : t("all")}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      <CategoryPicker
        className="mb-2"
        value={group}
        onChange={setGroup}
        options={[
          { id: "all", label: t("all") },
          { id: "clothes", label: t("tray_clothes") },
          { id: "vibe", label: t("tray_vibe") },
        ]}
      />

      {items.length === 0 ? (
        <EmptyState
          compact
          icon={Shirt}
          title={t("tray_emptyTitle")}
          description={t("tray_emptyDesc")}
          actionLabel={t("toWardrobe")}
          onAction={() => router.push("/wardrobe")}
        />
      ) : expanded ? (
        <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto">
          {items.map((item) => (
            <DraggableThumb key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {items.map((item) => (
            <DraggableThumb key={item.id} item={item} className="w-20" />
          ))}
        </div>
      )}
    </section>
  );
}
