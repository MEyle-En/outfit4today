"use client";

import { useEffect, useMemo, useState } from "react";
import { ItemImage, frameClass } from "@/components/wardrobe/ItemImage";
import { useRouter } from "next/navigation";
import { Check, Copy, Globe, LogIn, LogOut, Plus, Shirt, Sparkles, Users } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { getCrewItems } from "@/lib/supabase-crews";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { inviteUrl } from "@/lib/utils/pendingJoin";
import { useCrewStore, type CrewTab } from "@/lib/store/useCrewStore";
import { stagger } from "@/lib/stagger";
import { cn } from "@/lib/utils";
import type { FriendItem, ItemCategory } from "@/types";

const NO_MEMBERS: never[] = [];

function CreateCrewDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const createCrew = useCrewStore((s) => s.createCrew);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("crew_new")}</DialogTitle>
        <DialogDescription>{t("crew_newDesc")}</DialogDescription>
        <form
          className="mt-5 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim() || busy) return;
            setBusy(true);
            const crew = await createCrew(name);
            setBusy(false);
            if (crew) {
              setName("");
              onOpenChange(false);
            }
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("crew_namePlaceholder")} aria-label={t("crew_nameAria")} autoFocus />
          <Button type="submit" size="lg" className="w-full" disabled={!name.trim() || busy}>
            {t("crew_create")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JoinCrewDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const joinCrew = useCrewStore((s) => s.joinCrew);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("crew_join")}</DialogTitle>
        <DialogDescription>{t("crew_joinDesc")}</DialogDescription>
        <form
          className="mt-5 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!code.trim() || busy) return;
            setBusy(true);
            setError(null);
            const result = await joinCrew(code);
            setBusy(false);
            if (result.ok) {
              setCode("");
              onOpenChange(false);
            } else {
              setError(t(result.error === "invalid" ? "crew_errInvalidCode" : "crew_errJoin"));
            }
          }}
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t("crew_codePlaceholder")}
            aria-label={t("crew_code")}
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={16}
            autoFocus
          />
          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={!code.trim() || busy}>
            {t("crew_joinBtn")}
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
  const crewsLoaded = useCrewStore((s) => s.crewsLoaded);
  const leaveCrew = useCrewStore((s) => s.leaveCrew);
  const meId = useAuthStore((s) => s.user?.id);
  const activeCrewId = useCrewStore((s) => s.activeCrewId);
  const setActiveCrew = useCrewStore((s) => s.setActiveCrew);
  const allPosts = useCrewStore((s) => s.posts);
  const postsLoading = useCrewStore((s) => s.postsLoading);
  const loadPosts = useCrewStore((s) => s.loadPosts);
  const tab = useCrewStore((s) => s.crewTab);
  const setTab = useCrewStore((s) => s.setCrewTab);

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [crewItems, setCrewItems] = useState<FriendItem[]>([]);
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
  const members = useCrewStore((s) => (crew ? s.members[crew.id] : undefined)) ?? NO_MEMBERS;
  const memberName = (id: string) => (id === meId ? t("crew_you") : members.find((m) => m.id === id)?.name ?? "");

  // Posts aus Supabase: Crew-Tab = Posts der aktiven Crew, Public-Tab = öffentliche Posts
  const crewId = crew?.id;
  useEffect(() => {
    if (tab === "public") void loadPosts("public");
    else if (tab === "fits" && crewId) void loadPosts(crewId);
  }, [tab, crewId, loadPosts]);

  // Geteilte Teile der anderen Mitglieder aus Supabase (die Datenbank liefert nur, was freigegeben ist)
  const memberKey = crew?.memberIds.join(",") ?? "";
  useEffect(() => {
    let cancelled = false;
    setOwner("all");
    if (!crew) {
      setCrewItems([]);
      return;
    }
    getCrewItems(crew.memberIds)
      .then((items) => !cancelled && setCrewItems(items))
      .catch(() => !cancelled && setCrewItems([]));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crew?.id, memberKey]);

  const friendItems = useMemo(
    () =>
      crewItems.filter(
        (i) => (owner === "all" || i.ownerId === owner) && (category === "all" || i.category === category),
      ),
    [crewItems, owner, category],
  );

  const copy = async () => {
    if (!crew) return;
    try {
      await navigator.clipboard.writeText(inviteUrl(crew.inviteCode)); // immer die echte Origin, nie eine feste Domain
    } catch {
      /* Clipboard nicht verfügbar – der Code bleibt sichtbar */
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
        <button
          onClick={() => setJoinOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-white/20 px-3 text-sm text-zinc-400 hover:border-accent hover:text-accent-soft"
        >
          <LogIn className="h-4 w-4" /> {t("crew_join")}
        </button>
      </div>
      <CreateCrewDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinCrewDialog open={joinOpen} onOpenChange={setJoinOpen} />
      {!crewsLoaded && crews.length === 0 && <Skeleton className="h-24 w-full" />}

      {crew && (
        <div className="glass space-y-3 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {members.slice(0, 8).map((m) =>
                m.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={m.id} src={m.avatar} alt={memberName(m.id)} title={memberName(m.id)} className="h-8 w-8 rounded-full border-2 border-surface object-cover" />
                ) : (
                  <div key={m.id} title={memberName(m.id)} className={cn("h-8 w-8 rounded-full border-2 border-surface bg-gradient-to-br", m.gradient)} />
                ),
              )}
            </div>
            <span className="text-xs text-zinc-500">{t("crew_members", { n: crew.memberIds.length })}</span>
          </div>
          <div className="flex items-center gap-2">
            <div dir="ltr" className="min-w-0 flex-1 rounded-xl bg-black/30 px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wide text-zinc-500">{t("crew_codeManual")}</span>
              <span className="block truncate font-mono text-base font-semibold tracking-widest text-white">{crew.inviteCode}</span>
            </div>
            <Button size="sm" variant="glass" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t("crew_copied") : t("crew_copyLink")}
            </Button>
          </div>
          <button
            onClick={async () => {
              if (!confirmLeave) {
                setConfirmLeave(true);
                setTimeout(() => setConfirmLeave(false), 3000);
                return;
              }
              setConfirmLeave(false);
              await leaveCrew(crew.id);
            }}
            className={cn("flex items-center gap-1.5 text-xs", confirmLeave ? "text-red-300" : "text-zinc-500 hover:text-white")}
          >
            <LogOut className="h-3.5 w-3.5" /> {confirmLeave ? t("crew_leaveConfirm") : t("crew_leave")}
          </button>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as CrewTab)}>
        <TabsList className="grid-cols-3">
          <TabsTrigger value="fits">{t("crew_tabFits")}</TabsTrigger>
          <TabsTrigger value="items">{t("crew_tabItems")}</TabsTrigger>
          <TabsTrigger value="public">{t("crew_tabPublic")}</TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="space-y-4">
          {postsLoading && publicPosts.length === 0 ? (
            <Skeleton className="h-64 w-full" />
          ) : publicPosts.length === 0 ? (
            <EmptyState
              icon={Globe}
              title={t("public_emptyTitle")}
              description={t("public_emptyDesc")}
              actionLabel={t("toLab")}
              onAction={() => router.push("/lab")}
            />
          ) : (
            publicPosts.map((p, i) => <FitCheckPost key={p.id} post={p} index={i} />)
          )}
        </TabsContent>

        <TabsContent value="fits" className="space-y-4">
          {!crew ? (
            crewsLoaded ? noCrew : null
          ) : postsLoading && posts.length === 0 ? (
            <Skeleton className="h-64 w-full" />
          ) : posts.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title={t("crew_noFitsTitle")}
              description={t("crew_noFitsDesc")}
              actionLabel={t("toLab")}
              onAction={() => router.push("/lab")}
            />
          ) : (
            posts.map((p, i) => <FitCheckPost key={p.id} post={p} index={i} />)
          )}
        </TabsContent>

        <TabsContent value="items" className="space-y-3">
          {!crew ? (
            noCrew
          ) : (
            <>
              <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
                {[{ id: "all", name: t("all") }, ...members.filter((m) => m.id !== meId)].map((f) => (
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
                {friendItems.map((i, n) => (
                  <article key={i.id} style={stagger(n)} className={cn("animate-fade-in-up card-lift relative aspect-[4/5] overflow-hidden rounded-2xl", frameClass(i.hasTransparentBackground))}>
                    <ItemImage src={i.image} alt={i.name} transparent={i.hasTransparentBackground} loading="lazy" className="h-full w-full" />
                    <div className="absolute inset-x-0 bottom-0 space-y-1.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-12">
                      <p className="truncate font-display text-base font-semibold leading-tight">{i.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="default">{categoryLabel(i.category)}</Badge>
                        <Badge>{memberName(i.ownerId)}</Badge>
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
