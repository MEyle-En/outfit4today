"use client";

import { useState } from "react";
import { Eye, EyeOff, Pencil, Store, Tag, Trash2 } from "lucide-react";
import { ListItemDialog } from "@/components/profile/ListItemDialog";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/wardrobe/CategoryBadge";
import { EditItemDialog } from "@/components/wardrobe/EditItemDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { stagger } from "@/lib/stagger";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";
import type { WardrobeItem } from "@/types";

const actionBtn = "icon-btn grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition-colors";

export function ItemCard({
  item,
  onRemove,
  onTogglePrivate,
  index = 0,
}: {
  item: WardrobeItem;
  onRemove: () => void;
  onTogglePrivate: () => void;
  /** Position in der Liste (für die gestaffelte Eingangs-Animation) */
  index?: number;
}) {
  const { t } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const rest = item.tags.filter((tg) => tg.kind !== "category");
  const visible = !item.visibility.isPrivate;
  const onMarket = item.visibility.onMarketplace;

  const toggle = () => {
    onTogglePrivate();
    toast(t("toast_visibility"), visible ? t("toast_nowPrivate") : t("toast_nowVisible"));
  };

  return (
    <article
      style={stagger(index)}
      className="animate-fade-in-up card-lift group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-surface"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />

      <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
        <button
          onClick={onRemove}
          aria-label={t("item_delete", { name: item.name })}
          className="icon-btn grid h-8 w-8 place-items-center rounded-full bg-black/50 text-zinc-300 opacity-0 backdrop-blur-md transition-opacity hover:text-white focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        {item.isPlaceholder && (
          <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-md">
            {t("item_placeholder")}
          </span>
        )}
      </div>

      {/* Aktionen rechts: Sichtbarkeit, Bearbeiten, Verkaufen */}
      <div className="absolute right-2 top-2 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={visible}
          aria-label={visible ? t("item_visibleAria") : t("item_privateAria")}
          title={visible ? t("item_visible") : t("item_private")}
          className={cn(actionBtn, visible ? "bg-accent/85 text-white" : "bg-black/60 text-zinc-300")}
        >
          {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          aria-label={t("item_edit")}
          title={t("item_edit")}
          className={cn(actionBtn, "bg-black/60 text-zinc-200 hover:text-white")}
        >
          <Pencil className="h-4 w-4" />
        </button>
        {!onMarket && (
          <button
            type="button"
            onClick={() => setSellOpen(true)}
            aria-label={t("item_sell")}
            title={t("item_sell")}
            className={cn(actionBtn, "bg-gradient-to-br from-orange-400 to-pink-500 text-white hover:brightness-110")}
          >
            <Tag className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-12">
        <p className="truncate font-display text-base font-semibold leading-tight">{item.name}</p>
        <div className="flex flex-wrap gap-1.5">
          <CategoryBadge category={item.category} />
          {onMarket && (
            <Badge className="border-amber-300/40 bg-amber-400/20 text-amber-200">
              <Store className="h-3 w-3" /> 💰 {t("item_listed")}
            </Badge>
          )}
          {!visible && <Badge className="border-white/20 bg-black/40 text-zinc-300">{t("item_private")}</Badge>}
          {rest.map((tg) => (
            <Badge key={tg.id} className="hidden group-hover:inline-flex max-md:inline-flex">
              {tg.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Dialoge nur bei Bedarf einhängen (pro Karte wäre sonst je ein Dialog aktiv) */}
      {editOpen && <EditItemDialog item={item} open onOpenChange={setEditOpen} />}
      {sellOpen && <ListItemDialog open onOpenChange={setSellOpen} initialSelected={[item.id]} />}
    </article>
  );
}
