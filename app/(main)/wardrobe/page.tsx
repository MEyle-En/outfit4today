"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Camera, Check, Shirt, Type, Users } from "lucide-react";
import { CrewView } from "@/components/crew/CrewView";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryPicker } from "@/components/wardrobe/CategoryPicker";
import { ColorPicker } from "@/components/wardrobe/ColorPicker";
import { ForgottenTreasures } from "@/components/wardrobe/ForgottenTreasures";
import { ItemCard } from "@/components/wardrobe/ItemCard";
import { MagicUpload } from "@/components/wardrobe/MagicUpload";
import { QuickAdd } from "@/components/wardrobe/QuickAdd";
import { useTranslation } from "@/hooks/useTranslation";
import { useCategoryOptions } from "@/lib/categories";
import { useCrewStore } from "@/lib/store/useCrewStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import type { ItemCategory, ItemColor } from "@/types";

export default function WardrobePage() {
  const { t } = useTranslation();
  const categoryOptions = useCategoryOptions();
  const items = useWardrobeStore((s) => s.items);
  const removeItem = useWardrobeStore((s) => s.removeItem);
  const toggleShared = useWardrobeStore((s) => s.toggleShared);
  const view = useCrewStore((s) => s.wardrobeView);
  const setView = useCrewStore((s) => s.setWardrobeView);

  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<ItemCategory | "all">("all");
  const [colorFilter, setColorFilter] = useState<ItemColor | null>(null);

  const FILTER = [{ id: "all" as const, label: t("all") }, ...categoryOptions];

  const onSaved = (count: number) => {
    setNotice(t("wardrobe_added", { n: count }));
    setTimeout(() => setNotice(null), 2500);
  };

  const visible = items.filter(
    (i) => (filter === "all" || i.category === filter) && (!colorFilter || i.color === colorFilter),
  );
  const clearFilters = () => {
    setFilter("all");
    setColorFilter(null);
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-zinc-500">{view === "mine" ? t("wardrobe_pieces", { n: items.length }) : t("crew_yourCrew")}</p>
        <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight">
          {view === "mine" ? t("wardrobe_title") : t("crew_viewTitle")}
        </h1>
      </header>

      <Tabs value={view} onValueChange={(v) => setView(v as "mine" | "crew")}>
        <TabsList>
          <TabsTrigger value="mine">
            <Shirt className="h-4 w-4" /> {t("wardrobe_mine")}
          </TabsTrigger>
          <TabsTrigger value="crew">
            <Users className="h-4 w-4" /> {t("crew_view")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-6">
          <ForgottenTreasures />

          <Tabs defaultValue="magic">
            <TabsList>
              <TabsTrigger value="magic">
                <Camera className="h-4 w-4" /> {t("wardrobe_magic")}
              </TabsTrigger>
              <TabsTrigger value="quick">
                <Type className="h-4 w-4" /> {t("wardrobe_quick")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="magic">
              <MagicUpload onSaved={onSaved} />
            </TabsContent>
            <TabsContent value="quick">
              <QuickAdd onSaved={onSaved} />
            </TabsContent>
          </Tabs>

          {notice && (
            <p role="status" className="glass flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-accent-soft">
              <Check className="h-4 w-4" /> {notice}
            </p>
          )}

          <div className="space-y-2">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{t("category")}</p>
              <CategoryPicker value={filter} options={FILTER} onChange={setFilter} />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{t("color")}</p>
              <ColorPicker value={colorFilter} onChange={setColorFilter} noneLabel={t("all")} />
            </div>
          </div>

          {visible.length === 0 && (
            <EmptyState
              icon={Shirt}
              title={items.length === 0 ? t("wardrobe_emptyTitle") : t("wardrobe_noMatchTitle")}
              description={items.length === 0 ? t("wardrobe_emptyDesc") : t("wardrobe_noMatchDesc")}
              actionLabel={items.length === 0 ? t("wardrobe_emptyAction") : t("wardrobe_showAll")}
              onAction={() => (items.length === 0 ? window.scrollTo({ top: 0, behavior: "smooth" }) : clearFilters())}
            />
          )}

          <section className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {visible.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onToggleShared={() => toggleShared(item.id)}
                />
              ))}
            </AnimatePresence>
          </section>
        </TabsContent>

        <TabsContent value="crew">
          <CrewView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
