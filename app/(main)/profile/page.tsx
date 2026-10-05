"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, FileText, Heart, LogOut, Shield, RotateCcw, Shirt, Sparkles, Trash2, User, Volume2, VolumeX } from "lucide-react";
import { ImageCropper } from "@/components/profile/ImageCropper";
import { FitCheckPost } from "@/components/crew/FitCheckPost";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { MyListings } from "@/components/market/MyListings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import { useVibeTheme } from "@/hooks/useVibeTheme";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/categories";
import { colorLabel, swatchOf } from "@/lib/colors";
import { LANGS, type Lang } from "@/lib/i18n/translations";
import { fileToDataUrl } from "@/lib/image";
import { QUIZ_STEPS } from "@/lib/mock/quiz";
import { LEGACY_STORAGE, STORAGE } from "@/lib/storage-keys";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useBundleStore } from "@/lib/store/useBundleStore";
import { useChatStore } from "@/lib/store/useChatStore";
import { useCrewStore } from "@/lib/store/useCrewStore";
import { useLabStore } from "@/lib/store/useLabStore";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { usePreferencesStore } from "@/lib/store/usePreferencesStore";
import { useProfileStore } from "@/lib/store/useProfileStore";
import { useStyleStore } from "@/lib/store/useStyleStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import type { ItemCategory, ItemColor } from "@/types";

// Zusätzliche Persist-Keys (Chat, Benachrichtigungen, Likes, Bundles, Vorlieben, Profil) – die Sprache bleibt beim Zurücksetzen erhalten
const EXTRA_KEYS = [
  "outfit4today-chat",
  "outfit4today-notifications",
  "outfit4today-social",
  "outfit4today-bundles",
  "outfit4today-prefs",
  "outfit4today-profile",
];
const STORAGE_KEYS = [...Object.values(STORAGE), ...Object.values(LEGACY_STORAGE), ...EXTRA_KEYS];

/** Top-Einträge einer Zähl-Map, absteigend. */
const top = (m: Record<string, number>, n = 3) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);

export default function ProfilePage() {
  const router = useRouter();
  const { t, lang, setLang } = useTranslation();
  const theme = useVibeTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((s) => s.user);
  const vibes = useStyleStore((s) => s.vibes);
  const styleColors = useStyleStore((s) => s.colors);
  const resetStyle = useStyleStore((s) => s.reset);
  const avatar = useProfileStore((s) => s.avatar);
  const setAvatar = useProfileStore((s) => s.setAvatar);
  const isMuted = useProfileStore((s) => s.isMuted);
  const setMuted = useProfileStore((s) => s.setMuted);
  const likedCategories = usePreferencesStore((s) => s.likedCategories);
  const likedColors = usePreferencesStore((s) => s.likedColors);
  const likedItems = usePreferencesStore((s) => s.likedItems);
  const items = useWardrobeStore((s) => s.items);
  const crews = useCrewStore((s) => s.crews);
  const posts = useCrewStore((s) => s.posts);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const myFits = posts.filter((p) => p.authorId === "me").sort((a, b) => b.createdAt - a.createdAt);
  const vibeLabels = vibes.map((id) => QUIZ_STEPS[0].options.find((o) => o.id === id)?.label ?? id);

  // Farbverlauf aus den im Vibe Check gewählten Paletten (Style-Badge im Header)
  const styleGradient = useMemo(() => {
    const swatches = styleColors.flatMap((id) => QUIZ_STEPS[1].options.find((o) => o.id === id)?.swatches ?? []);
    if (swatches.length === 0) return null;
    const stops = swatches.length === 1 ? [swatches[0], swatches[0]] : swatches;
    return `linear-gradient(90deg, ${stops.join(", ")})`;
  }, [styleColors]);

  const topCategories = top(likedCategories);
  const topColors = top(likedColors);
  const maxCat = topCategories[0]?.[1] ?? 1;
  const maxCol = topColors[0]?.[1] ?? 1;

  const stats = [
    { label: t("profile_items"), value: items.length },
    { label: t("profile_crews"), value: crews.length },
    { label: t("profile_fitsShared"), value: myFits.length },
  ];

  // Gewähltes Foto nicht sofort übernehmen, sondern erst im Cropper zuschneiden lassen
  const onAvatar = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      setCropSrc(await fileToDataUrl(file, 1200, 0.92));
    } catch {
      /* Bild nicht lesbar – Avatar bleibt unverändert */
    }
  };

  const restartVibeCheck = () => {
    resetStyle();
    router.replace("/vibe-check");
  };

  const deleteAll = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      timer.current = setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    clearTimeout(timer.current);
    useWardrobeStore.getState().clearAll();
    useCrewStore.getState().clearAll();
    useLabStore.getState().clearCanvas();
    useChatStore.getState().clearAll();
    useBundleStore.getState().clearAll();
    usePreferencesStore.getState().reset();
    useNotificationStore.getState().clear();
    setAvatar(null);
    resetStyle();
    router.replace("/vibe-check");
  };

  // Zurück zu Mock-Daten: persistierte Stores entfernen und neu laden -> Seeds greifen wieder
  const restoreDemo = () => {
    STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    window.location.href = "/vibe-check";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="relative flex flex-col items-center text-center">
        <NotificationBell className="absolute right-0 top-0" />

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void onAvatar(e.target.files?.[0])} />
        <button
          onClick={() => fileRef.current?.click()}
          aria-label={t("profile_changePhoto")}
          className="group relative h-28 w-28 overflow-hidden rounded-full bg-surface shadow-glow ring-2 ring-accent/70"
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center">
              <User className="h-12 w-12 text-accent" strokeWidth={1.75} />
            </span>
          )}
          <span className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-0">
            <Camera className="h-6 w-6" />
          </span>
          <span className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-accent ring-2 ring-background">
            <Camera className="h-4 w-4" />
          </span>
        </button>

        <h1 className="mt-4 font-display text-4xl font-bold leading-none tracking-tight">{user?.username ?? t("you")}</h1>
        <p className="mt-1 text-sm text-zinc-500">@{(user?.username ?? "du").toLowerCase().replace(/\s+/g, "")}</p>

        {/* Style-Badge: Verlauf in den Farben aus dem Vibe Check */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {vibeLabels.length ? (
            <span className="relative overflow-hidden rounded-full p-[1.5px]" style={{ background: styleGradient ?? "rgba(168,85,247,0.4)" }}>
              <span className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5" style={{ color: theme.accentColor }} /> {vibeLabels.join(" & ")}
              </span>
            </span>
          ) : (
            <Badge variant="outline">{t("profile_noVibe")}</Badge>
          )}
        </div>
        {styleGradient && <div className="mt-3 h-1.5 w-40 rounded-full" style={{ background: styleGradient }} aria-hidden />}
      </header>

      {cropSrc && (
        <ImageCropper
          image={cropSrc}
          onCancel={() => setCropSrc(null)}
          onDone={(dataUrl) => {
            setAvatar(dataUrl);
            setCropSrc(null);
          }}
        />
      )}

      {/* Stats */}
      <Card>
        <CardContent className="grid grid-cols-3 divide-x divide-white/10 p-0">
          {stats.map((s) => (
            <div key={s.label} className="py-4 text-center">
              <p className="font-display text-3xl font-bold tabular-nums">{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dein Style-Profil: aus Likes gelernt (Grundlage für spätere KI-Empfehlungen) */}
      <section className="space-y-3" aria-labelledby="style-profile">
        <h2 id="style-profile" className="flex items-center gap-2 font-display text-xl font-bold">
          <Heart className="h-5 w-5 text-accent-soft" /> {t("styleProfile_title")}
        </h2>
        {topCategories.length === 0 && topColors.length === 0 ? (
          <p className="glass rounded-2xl p-4 text-sm text-zinc-400">{t("styleProfile_empty")}</p>
        ) : (
          <Card>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t("styleProfile_categories")}</p>
                {topCategories.map(([cat, n]) => (
                  <div key={cat} className="flex items-center gap-3 text-sm">
                    <span className="w-28 shrink-0 truncate">{categoryLabel(cat as ItemCategory)}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${(n / maxCat) * 100}%` }} />
                    </span>
                    <span className="w-5 text-right text-xs tabular-nums text-zinc-400">{n}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t("styleProfile_colors")}</p>
                {topColors.map(([col, n]) => (
                  <div key={col} className="flex items-center gap-3 text-sm">
                    <span className="flex w-28 shrink-0 items-center gap-2 truncate">
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/30" style={{ background: swatchOf(col as ItemColor) }} />
                      {colorLabel(col as ItemColor)}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-accent-soft" style={{ width: `${(n / maxCol) * 100}%` }} />
                    </span>
                    <span className="w-5 text-right text-xs tabular-nums text-zinc-400">{n}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-zinc-500">{t("styleProfile_likes", { n: likedItems.length })}</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Tabs */}
      <Tabs defaultValue="fits">
        <TabsList>
          <TabsTrigger value="fits">{t("profile_myFits")}</TabsTrigger>
          <TabsTrigger value="market">{t("market_mine")}</TabsTrigger>
        </TabsList>

        <TabsContent value="fits" className="space-y-4">
          {myFits.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title={t("profile_noFitsTitle")}
              description={t("profile_noFitsDesc")}
              actionLabel={t("toLab")}
              onAction={() => router.push("/lab")}
            />
          ) : (
            myFits.map((p, i) => <FitCheckPost key={p.id} post={p} index={i} />)
          )}
        </TabsContent>

        <TabsContent value="market">
          <MyListings />
        </TabsContent>
      </Tabs>

      {/* Einstellungen */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t("settings")}</h2>

        <button
          type="button"
          role="switch"
          aria-checked={!isMuted}
          onClick={() => {
            setMuted(!isMuted);
            if (isMuted) playSound("click"); // Rückmeldung beim Einschalten
          }}
          className="glass flex w-full items-center justify-between gap-3 rounded-2xl p-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm">
            {isMuted ? <VolumeX className="h-4 w-4 text-zinc-500" /> : <Volume2 className="h-4 w-4 text-accent-soft" />}
            {t("sound_effects")}
          </span>
          <span className={cn("h-6 w-10 rounded-full p-0.5 transition-colors", isMuted ? "bg-white/15" : "bg-accent")}>
            <span className={cn("block h-5 w-5 rounded-full bg-white transition-transform", !isMuted && "translate-x-4")} />
          </span>
        </button>

        <div className="glass flex items-center justify-between gap-3 rounded-2xl p-3">
          <label htmlFor="lang" className="text-sm">
            {t("language")}
          </label>
          <select
            id="lang"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            {LANGS.map((l) => (
              <option key={l.id} value={l.id} className="bg-surface">
                {l.flag} {l.code} – {l.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="glass"
          className="w-full justify-start"
          onClick={() => {
            // Konto und Daten bleiben erhalten – nur die Sitzung endet. Der AuthGuard leitet zum Login.
            useAuthStore.getState().logout();
            router.replace("/login");
          }}
        >
          <LogOut className="h-4 w-4" /> {t("auth_logout")}
        </Button>
        <Button variant="glass" className="w-full justify-start" onClick={restartVibeCheck}>
          <RotateCcw className="h-4 w-4" /> {t("profile_restartVibe")}
        </Button>
        <Button variant="glass" className="w-full justify-start" onClick={restoreDemo}>
          <Shirt className="h-4 w-4" /> {t("profile_restoreDemo")}
        </Button>
        <Button
          variant="glass"
          className={`w-full justify-start ${confirmDelete ? "border-red-400/60 text-red-300" : ""}`}
          onClick={deleteAll}
        >
          <Trash2 className="h-4 w-4" /> {confirmDelete ? t("profile_deleteConfirm") : t("profile_deleteAll")}
        </Button>

        <div className="flex flex-col gap-1 pt-2 text-sm text-zinc-400">
          <Link href="/privacy" className="flex items-center gap-2 rounded-xl px-2 py-2 hover:text-white">
            <Shield className="h-4 w-4" /> {t("legal_privacyFull")}
          </Link>
          <Link href="/imprint" className="flex items-center gap-2 rounded-xl px-2 py-2 hover:text-white">
            <FileText className="h-4 w-4" /> {t("legal_imprint")}
          </Link>
        </div>
      </section>
    </div>
  );
}
