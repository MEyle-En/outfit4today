"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { FilePlus2, Type } from "lucide-react";
import { Canvas } from "@/components/lab/Canvas";
import { ExportButton } from "@/components/lab/ExportButton";
import { SendToCrewButton } from "@/components/lab/SendToCrewButton";
import { TrayThumb, WardrobeSidebar } from "@/components/lab/WardrobeSidebar";
import { Button } from "@/components/ui/button";
import { playSound } from "@/lib/sound";
import { haptic } from "@/lib/utils/haptic";
import { useTranslation } from "@/hooks/useTranslation";
import { CANVAS_ID, DEFAULT_SIZE, itemHeight, snapToCanvas } from "@/lib/lab";
import { useLabStore } from "@/lib/store/useLabStore";
import { useWardrobeStore } from "@/lib/store/useWardrobeStore";

export default function LabPage() {
  const { t } = useTranslation();
  const canvasItems = useLabStore((s) => s.items);
  const textCount = useLabStore((s) => s.texts.length);
  const addText = useLabStore((s) => s.addText);
  const { addItemToCanvas, clearCanvas } = useLabStore.getState();
  const wardrobe = useWardrobeStore((s) => s.items);

  const [activeTrayId, setActiveTrayId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>();
  const mounted = useRef(false);
  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  // Frischer Start bei jedem Besuch: altes Canvas wird beim Öffnen geleert (Fits bleiben in "Meine Fits").
  // Ausnahme: ein von der Startseite übernommener Look (keepOnce). Der Ref verhindert, dass React StrictMode
  // (Effekt läuft in der Entwicklung doppelt) den übernommenen Look im zweiten Durchlauf trotzdem löscht.
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const { keepOnce, setKeepOnce, clearCanvas: clear } = useLabStore.getState();
    if (keepOnce) setKeepOnce(false);
    else clear();
  }, []);

  // Maus: ab 4px Bewegung. Touch: 150ms halten, damit Scrollen im Tray/auf der Seite weiter geht.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  // dnd-kit ist nur noch fürs Ziehen aus dem Tray aufs Canvas zuständig.
  // Verschieben/Skalieren/Drehen auf dem Canvas übernimmt react-rnd (DraggableItem).
  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveTrayId(String(active.id).slice("tray:".length));
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTrayId(null);
    if (!over || over.id !== CANVAS_ID) return; // außerhalb losgelassen: nichts ändern
    const r = active.rect.current.translated;
    if (!r) return;
    const { width: cw, height: ch, left, top } = over.rect;
    // Item mittig unter dem Finger/Cursor platzieren
    const cx = r.left + r.width / 2 - left - DEFAULT_SIZE / 2;
    const cy = r.top + r.height / 2 - top - itemHeight(DEFAULT_SIZE) / 2;
    addItemToCanvas(String(active.id).slice("tray:".length), snapToCanvas(cx, cy, DEFAULT_SIZE, cw, ch));
    playSound("whoosh");
    haptic("medium");
  };

  const isEmpty = canvasItems.length === 0 && textCount === 0;

  const onNewFit = () => {
    // Leeres Canvas: nichts zu verlieren. Sonst einmal bestätigen.
    if (!isEmpty && !confirmClear) {
      setConfirmClear(true);
      confirmTimer.current = setTimeout(() => setConfirmClear(false), 2500);
      return;
    }
    clearTimeout(confirmTimer.current);
    setConfirmClear(false);
    clearCanvas();
  };

  const activeTrayItem = wardrobe.find((w) => w.id === activeTrayId);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveTrayId(null)}
    >
      <div className="space-y-4">
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight">{t("lab_title")}</h1>
            <Button
              variant="glass"
              size="sm"
              onClick={onNewFit}
              disabled={isEmpty}
              className={confirmClear ? "border-red-400/60 text-red-300" : "border-accent/40"}
            >
              <FilePlus2 className="h-4 w-4" /> {confirmClear ? t("lab_sure") : t("lab_newFit")}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="glass" onClick={addText} aria-label={t("lab_addText")}>
              <Type className="h-4 w-4" /> {t("lab_plusText")}
            </Button>
            <SendToCrewButton disabled={canvasItems.length === 0} />
            <ExportButton disabled={canvasItems.length === 0} />
          </div>
        </header>

        <Canvas />
        <WardrobeSidebar />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTrayItem ? (
          <div className="w-24 rotate-3">
            <TrayThumb item={activeTrayItem} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
