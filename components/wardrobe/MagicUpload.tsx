"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Eraser, Loader2, RotateCcw, Sparkles, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TagChips } from "@/components/wardrobe/TagChips";
import { analyzeImage, detectColorFromText } from "@/lib/ai/mock-ai";
import { blobToCompactDataUrl, fileToDataUrl } from "@/lib/image";
import { toast } from "@/lib/store/useToastStore";
import { removeBackgroundFromImage } from "@/lib/utils/backgroundRemover";
import { uid } from "@/lib/mock/wardrobe";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";
import { cn } from "@/lib/utils";
import { categoryLabel, useCategoryOptions } from "@/lib/categories";
import { playSound } from "@/lib/sound";
import { haptic } from "@/lib/utils/haptic";
import { useTranslation } from "@/hooks/useTranslation";
import { detectDominantColor, withColorName } from "@/lib/image-color";
import { CategoryPicker } from "@/components/wardrobe/CategoryPicker";
import { ColorPicker } from "@/components/wardrobe/ColorPicker";
import { FieldLabel } from "@/components/wardrobe/FieldLabel";
import { CategoryBadge } from "@/components/wardrobe/CategoryBadge";
import { colorLabel } from "@/lib/colors";
import { syncTag } from "@/lib/tags";
import type { ItemCategory, ItemColor, ItemTag } from "@/types";

interface Draft {
  id: string;
  image: string;
  name: string;
  category: ItemCategory;
  color?: ItemColor;
  tags: ItemTag[];
  status: "analyzing" | "ready";
  /** Originaldatei (für die Hintergrund-Entfernung) */
  file?: File;
  /** Bild vor dem Freistellen, damit es wiederhergestellt werden kann */
  original?: string;
  removing?: boolean;
}

export function MagicUpload({ onSaved }: { onSaved?: (count: number) => void }) {
  const { t: tr } = useTranslation();
  const categoryOptions = useCategoryOptions();
  const addItems = useWardrobeStore((s) => s.addItems);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [dragging, setDragging] = useState(false);

  const patch = (id: string, p: Partial<Draft>) =>
    setDrafts((d) => d.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const removeBg = async (d: Draft) => {
    if (!d.file || d.removing) return;
    patch(d.id, { removing: true });
    try {
      const blob = await removeBackgroundFromImage(d.file);
      const image = await blobToCompactDataUrl(blob, 800);
      patch(d.id, { image, original: d.original ?? d.image, removing: false });
      playSound("success");
    } catch {
      // Original bleibt erhalten
      patch(d.id, { removing: false });
      toast(tr("bg_failed"), tr("bg_failedHint"), "error");
    }
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;

    // Bulk: alle Drafts sofort als Skeleton anzeigen, Analyse läuft parallel
    const created: { draft: Draft; file: File }[] = files.map((file) => ({
      file,
      draft: { id: uid(), image: "", name: "", category: "top", tags: [], status: "analyzing", file },
    }));
    setDrafts((d) => [...created.map((c) => c.draft), ...d]);

    await Promise.all(
      created.map(async ({ draft, file }) => {
        try {
          const [image, ai] = await Promise.all([fileToDataUrl(file), analyzeImage(file.name)]);
          // Farbe wirklich aus dem Bild lesen; nur wenn das scheitert, gilt der Vorschlag der Mock-KI
          const detected = await detectDominantColor(image);
          // Reihenfolge: Farbname im Dateinamen -> Farbe aus den Pixeln -> Vorschlag der Mock-KI
          const color = detectColorFromText(file.name) ?? detected ?? ai.color;
          const tags = color ? syncTag(ai.tags, "color", colorLabel(color)) : ai.tags;
          const name = color ? withColorName(ai.name, color) : ai.name;
          patch(draft.id, { image, name, category: ai.category, color, tags, status: "ready" });
        } catch {
          setDrafts((d) => d.filter((x) => x.id !== draft.id));
        }
      }),
    );
  };

  const ready = drafts.filter((d) => d.status === "ready");
  const analyzing = drafts.length - ready.length;

  const save = () => {
    addItems(ready.map(({ name, image, tags, category, color }) => ({ name, image, tags, category, color })));
    playSound("success");
    haptic("success");
    onSaved?.(ready.length);
    setDrafts((d) => d.filter((x) => x.status !== "ready"));
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = ""; // gleiche Datei erneut wählbar
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "glass flex w-full flex-col items-center gap-2 rounded-2xl border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-accent bg-accent/10" : "hover:bg-white/10",
        )}
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/20 text-accent-soft">
          <UploadCloud className="h-7 w-7" />
        </span>
        <span className="font-display text-xl font-semibold">{tr("wardrobe_magic")}</span>
        <span className="text-sm text-zinc-400">{tr("magic_hint")}</span>
      </button>

      <AnimatePresence initial={false}>
        {drafts.map((d) => (
          <motion.div
            key={d.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-surface"
          >
            {d.status === "analyzing" ? (
              <div className="flex gap-3 p-3">
                <Skeleton className="h-28 w-24 shrink-0" />
                <div className="flex-1 space-y-3 pt-1">
                  <p className="flex items-center gap-2 text-sm text-accent-soft">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    {tr("magic_analyzing")}
                  </p>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            ) : d.removing ? (
              <div className="flex flex-col items-center gap-4 p-8" role="status">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                <p className="font-medium text-white">{tr("bg_removing")}</p>
                <p className="text-sm text-zinc-400">{tr("bg_removingHint")}</p>
              </div>
            ) : (
              <div className="flex gap-3 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.image} alt={d.name} className="h-28 w-24 shrink-0 rounded-xl bg-black/30 object-cover" />
                <div className="min-w-0 flex-1 space-y-2">
                  {d.category === "lifestyle" && <CategoryBadge category="lifestyle" />}
                  <div className="flex items-start justify-between gap-2">
                    <input
                      value={d.name}
                      onChange={(e) => patch(d.id, { name: e.target.value })}
                      aria-label={tr("edit_name")}
                      className="w-full bg-transparent font-display text-lg font-semibold outline-none focus:text-accent-soft"
                    />
                    <button
                      onClick={() => setDrafts((all) => all.filter((x) => x.id !== d.id))}
                      aria-label={tr("magic_discard")}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <TagChips tags={d.tags} onChange={(tags) => patch(d.id, { tags })} />
                  {d.file &&
                    (d.original ? (
                      <button
                        type="button"
                        onClick={() => patch(d.id, { image: d.original, original: undefined })}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> {tr("bg_restore")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void removeBg(d)}
                        className="flex items-center gap-1.5 text-xs font-medium text-accent-soft hover:text-white"
                      >
                        <Eraser className="h-3.5 w-3.5" /> {tr("bg_remove")}
                      </button>
                    ))}
                  <FieldLabel>{tr("pick_category")}</FieldLabel>
                  <CategoryPicker
                    value={d.category}
                    options={categoryOptions}
                    wrap
                    onChange={(category) =>
                      patch(d.id, {
                        category,
                        // Kategorie-Chip mitziehen, damit Tag und Auswahl nicht auseinanderlaufen
                        tags: d.tags.map((tg) => (tg.kind === "category" ? { ...tg, label: categoryLabel(category) } : tg)),
                      })
                    }
                  />
                  <FieldLabel>{tr("pick_color")}</FieldLabel>
                  <ColorPicker
                    value={d.color}
                    onChange={(c) => c && patch(d.id, { color: c, tags: syncTag(d.tags, "color", colorLabel(c)) })}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {drafts.length > 0 && (
        <Button size="lg" silent className="w-full" onClick={save} disabled={ready.length === 0 || analyzing > 0}>
          {analyzing > 0 ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> {tr("magic_analyzingN", { n: analyzing })}
            </>
          ) : (
            <>
              <Check className="h-5 w-5" /> {ready.length > 1 ? tr("magic_saveN", { n: ready.length }) : tr("magic_save")}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
