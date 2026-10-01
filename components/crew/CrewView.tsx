"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Globe, Plus, Shirt, Sparkles, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { FitCheckPost } from "@/components/crew/FitCheckPost";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryPicker } from "@/components/wardrobe/CategoryPicker";
import { useTranslation } from "@/hooks/useTranslation";
import { categoryLabel, useCategoryOptions } from "@/lib/categories";
import { FRIEND_ITEMS, MOCK_FRIENDS, getPerson } from "@/lib/mock/crew";
import { inviteLink, useCrewStore, type CrewTab } from "@/lib/store/useCrewStore";
import { cn } from "@/lib/utils";
import type { ItemCategory } from "@/types";

function CreateCrewDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const createCrew = useCrewStore((s) => s.createCrew);
  const [name, setName] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("crew_new")}</DialogTitle>
        <DialogDescription>{t("crew_newDesc")}</DialogDescription>
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createCrew(name);
            setName("");
            onOpenChange(false);
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("crew_namePlaceholder")} aria-label={t("crew_nameAria")} autoFocus />
          <Button type="submit" size="lg" className="w-full" disabled={!name.trim()}>
            {t("crew_create")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CrewView() {
  const { t } = useTranslation();
  const router = useRouter();
  const categoryOptions = useCategoryOptions();
  const crews = useCrewStore((s) => s.crews);
  const activeCrewId = useCrewStore((s) => s.activeCrewId);
  const setActiveCrew = useCrewStore((s) => s.setActiveCrew);
  const allPosts = useCrewStore((s) => s.posts);
  const tab = useCrewStore((s) => s.crewTab);
  const setTab = useCrewStore((s) => s.setCrewTab);

  const [createOpen, setCreateOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [owner, setOwner] = useState<string>("all");
  const [category, setCategory] = useState<ItemCategory | "all">("all");

  const CATEGORY_FILTER = [{ id: "all" as const, label: t("all") }, ...categoryOptions];

  const noCrew = (
    <EmptyState
      icon={Users}
      title={t("crew_noneTitle")}
      description={t("crew_noneDesc")}
      actionLabel={t("crew_create")}
      onAction={() => setCreateOpen(true)}
    />
  );

  const publicPosts = useMemo(
    () => allPosts.filter((p) => p.isPublic).sort((a, b) => b.createdAt - a.createdAt),
    [allPosts],
  );

  const crew = crews.find((c) => c.id === activeCrewId) ?? crews[0];
  const posts = useMemo(
    () => allPosts.filter((p) => p.crewId === crew?.id).sort((a, b) => b.createdAt - a.createdAt),
    [allPosts, crew?.id],
  );
  const friendItems = useMemo(
    () =>
      FRIEND_ITEMS.filter(
        (i) =>
          crew?.memberIds.includes(i.ownerId) &&
          i.sharedWithCrew && // Privacy: nur freigegebene Teile
          (owner === "all" || i.ownerId === owner) &&
          (category === "all" || i.category === category),
      ),
    [crew, owner, category],
  );

  const copy = async () => {
    if (!crew) return;
    try {
      await navigator.clipboard.writeText(inviteLink(crew.inviteCode));
    } catch {
      /* Clipboard nicht verfügbar – Link bleibt sichtbar */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-4">
      {/* Crew-Auswahl */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {crews.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCrew(c.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium",
              c.id === crew?.id ? "border-accent/60 bg-accent/20" : "border-white/10 bg-white/5 text-zinc-400",
            )}
          >
            {c.name}
          </button>
        ))}
        <button
          onClick={() => setCreateOpen(true)}
          aria-label={t("crew_new")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-dashed border-white/20 text-zinc-400 hover:border-accent hover:text-accent-soft"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <CreateCrewDialog open={createOpen} onOpenChange={setCreateOpen} />

      {crew && (
        <div className="glass space-y-3 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {crew.memberIds.map((id) => (
                <div key={id} title={getPerson(id).name} className={cn("h-8 w-8 rounded-full border-2 border-surface bg-gradient-to-br", getPerson(id).gradient)} />
              ))}
            </div>
            <span className="text-xs text-zinc-500">{t("crew_members", { n: crew.memberIds.length + 1 })}</span>
          </div>
          <div className="flex items-center gap-2">
            <div dir="ltr" className="min-w-0 flex-1 truncate rounded-xl bg-black/30 px-3 py-2 text-xs text-zinc-400">
              {inviteLink(crew.inviteCode)}
            </div>
            <Button size="sm" variant="glass" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t("crew_copied") : t("crew_invite")}
            </Button>
          </div>
          <p className="text-[11px] text-zinc-500">{t("crew_inviteMock")}</p>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as CrewTab)}>
        <TabsList className="grid-cols-3">
          <TabsTrigger value="fits">{t("crew_tabFits")}</TabsTrigger>
          <TabsTrigger value="items">{t("crew_tabItems")}</TabsTrigger>
          <TabsTrigger value="public">{t("crew_tabPublic")}</TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="space-y-4">
          {publicPosts.length === 0 ? (
            <EmptyState
              icon={Globe}
              title={t("public_emptyTitle")}
              description={t("public_emptyDesc")}
              actionLabel={t("toLab")}
              onAction={() => router.push("/lab")}
            />
          ) : (
            publicPosts.map((p) => <FitCheckPost key={p.id} post={p} />)
          )}
        </TabsContent>

        <TabsContent value="fits" className="space-y-4">
          {!crew ? (
            noCrew
          ) : posts.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title={t("crew_noFitsTitle")}
              description={t("crew_noFitsDesc")}
              actionLabel={t("toLab")}
              onAction={() => router.push("/lab")}
            />
          ) : (
            posts.map((p) => <FitCheckPost key={p.id} post={p} />)
          )}
        </TabsContent>

        <TabsContent value="items" className="space-y-3">
          {!crew ? (
            noCrew
          ) : (
            <>
              <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
                {[{ id: "all", name: t("all") }, ...MOCK_FRIENDS.filter((f) => crew.memberIds.includes(f.id))].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOwner(f.id)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
                      owner === f.id ? "border-accent/60 bg-accent/20" : "border-white/10 bg-white/5 text-zinc-400",
                    )}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
              <CategoryPicker value={category} options={CATEGORY_FILTER} onChange={setCategory} />

              <div className="grid grid-cols-2 gap-3">
                {friendItems.map((i) => (
                  <article key={i.id} className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.image} alt={i.name} loading="lazy" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 space-y-1.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-12">
                      <p className="truncate font-display text-base font-semibold leading-tight">{i.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="default">{categoryLabel(i.category)}</Badge>
                        <Badge>{getPerson(i.ownerId).name}</Badge>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {friendItems.length === 0 && (
                <EmptyState compact icon={Shirt} title={t("crew_itemsNoneTitle")} description={t("crew_itemsNoneDesc")} />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
