"use client";

import { useEffect, useState } from "react";
import { Copy, Download, Loader2, Mail, MessageCircle, Share2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CANVAS_ID } from "@/lib/lab";
import { playSound } from "@/lib/sound";
import { toast } from "@/lib/store/useToastStore";
import { haptic } from "@/lib/utils/haptic";

const FILE_NAME = () => `outfit4today-fit-${Date.now()}.png`;

/** Canvas -> PNG mit transparentem Hintergrund (freigestellte Teile behalten ihre Form). */
async function renderFit(): Promise<Blob> {
  const node = document.getElementById(CANVAS_ID);
  if (!node) throw new Error("canvas missing");
  // Auswahlrahmen, Griffe und Toolbar vor dem Foto wegnehmen
  window.dispatchEvent(new Event("lab:deselect"));
  await new Promise((r) => setTimeout(r, 120));
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(node, {
    backgroundColor: null,
    useCORS: true,
    scale: 2,
    onclone: (doc) => {
      const el = doc.getElementById(CANVAS_ID);
      if (el) {
        el.style.background = "transparent";
        el.style.backgroundImage = "none";
        el.style.border = "none";
      }
      doc.querySelectorAll("[data-export-hide]").forEach((n) => n.remove());
    },
  });
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) throw new Error("toBlob failed");
  return blob;
}

/** Unterstützt dieses Gerät das Teilen von Dateien (Handy: natives Share-Sheet)? */
const canShareFiles = (file: File) => {
  try {
    return typeof navigator.share === "function" && !!navigator.canShare?.({ files: [file] });
  } catch {
    return false;
  }
};

/**
 * "Fit teilen": Handy -> natives Share-Sheet mit dem Bild (WhatsApp, Mail …).
 * Sonst: Bild in die Zwischenablage + Dialog mit WhatsApp, E-Mail und Download.
 */
export function ExportButton({ disabled }: { disabled?: boolean }) {
  const { t } = useTranslation();
  const [rendering, setRendering] = useState(false);
  const [shared, setShared] = useState<{ blob: Blob; url: string; file: File; copied: boolean } | null>(null);

  // Vorschau-URL wieder freigeben
  useEffect(() => () => (shared ? URL.revokeObjectURL(shared.url) : undefined), [shared]);

  const text = () => `${t("share_text")} ${window.location.origin}`;

  const download = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = FILE_NAME();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(t("export_done"));
  };

  const copyImage = async (blob: Blob): Promise<boolean> => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return true;
    } catch {
      return false;
    }
  };

  const nativeShare = async (file: File): Promise<"done" | "aborted" | "failed"> => {
    try {
      await navigator.share({ files: [file], title: t("shareFit_title"), text: text() });
      return "done";
    } catch (e) {
      return (e as DOMException)?.name === "AbortError" ? "aborted" : "failed";
    }
  };

  const shareFit = async () => {
    if (rendering) return;
    setRendering(true);
    try {
      const blob = await renderFit();
      const file = new File([blob], FILE_NAME(), { type: "image/png" });

      if (canShareFiles(file)) {
        const result = await nativeShare(file);
        if (result === "done") {
          playSound("success");
          haptic("success");
          toast(t("share_done"));
          return;
        }
        if (result === "aborted") return; // Nutzer hat das Share-Sheet geschlossen
        // z. B. iOS verlangt eine frische Berührung: Dialog mit eigenem "Teilen"-Button anbieten
      }

      const copied = await copyImage(blob);
      if (copied) toast(t("share_copied"));
      setShared({ blob, file, copied, url: URL.createObjectURL(blob) });
      haptic("success");
    } catch (error) {
      console.error("Share failed:", error);
      haptic("error");
      toast(t("share_failed"), undefined, "error");
    } finally {
      setRendering(false);
    }
  };

  const close = () => setShared(null);

  return (
    <>
      <Button size="sm" className="flex-1" onClick={() => void shareFit()} disabled={disabled || rendering}>
        {rendering ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {t("export_rendering")}
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" /> {t("export_fit")}
          </>
        )}
      </Button>

      <Dialog open={!!shared} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogTitle>{t("share_dialogTitle")}</DialogTitle>
          <DialogDescription>{shared?.copied ? t("share_dialogCopied") : t("share_dialogDesc")}</DialogDescription>
          {shared && (
            <div className="mt-4 space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shared.url} alt="" className="mx-auto max-h-56 rounded-xl bg-white/5 object-contain" />

              {canShareFiles(shared.file) && (
                <Button
                  className="w-full"
                  onClick={async () => {
                    const r = await nativeShare(shared.file);
                    if (r === "done") {
                      toast(t("share_done"));
                      close();
                    } else if (r === "failed") toast(t("share_failed"), undefined, "error");
                  }}
                >
                  <Share2 className="h-4 w-4" /> {t("share_native")}
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="glass">
                  <a href={`https://wa.me/?text=${encodeURIComponent(text())}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" /> {t("share_whatsapp")}
                  </a>
                </Button>
                <Button asChild variant="glass">
                  <a href={`mailto:?subject=${encodeURIComponent(t("shareFit_title"))}&body=${encodeURIComponent(text())}`}>
                    <Mail className="h-4 w-4" /> {t("share_mail")}
                  </a>
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={async () => toast((await copyImage(shared.blob)) ? t("share_copied") : t("share_copyFailed"))}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white"
                >
                  <Copy className="h-3.5 w-3.5" /> {t("share_copyAgain")}
                </button>
                <button
                  type="button"
                  onClick={() => download(shared.blob)}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" /> {t("share_download")}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
