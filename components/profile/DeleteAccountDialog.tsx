"use client";

import { useState } from "react";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { deleteMyAccount } from "@/lib/supabase-account";
import { toast } from "@/lib/store/useToastStore";
import { haptic } from "@/lib/utils/haptic";

/** Konto endgültig löschen: erst nach Eintippen von LÖSCHEN (bzw. DELETE) wird der Button scharf. */
export function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const word = t("account_confirmWord");
  const typed = text.trim().toUpperCase();
  const armed = typed === "LÖSCHEN" || typed === "LOESCHEN" || typed === "DELETE" || typed === word.toUpperCase();

  const confirm = async () => {
    if (!armed || busy) return;
    setBusy(true);
    const result = await deleteMyAccount();
    if (!result.ok) {
      setBusy(false);
      haptic("error");
      toast(t(result.step === "storage" ? "account_errStorage" : "account_errRpc"), t("account_errHint"), "error");
      return; // Konto und Anmeldung bleiben unverändert
    }
    // Harter Wechsel zur Login-Seite: alle Stores starten leer, der Toast kommt dort ("Dein Konto wurde gelöscht")
    window.location.replace("/login");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (busy) return; // während des Löschens nicht schließbar
        if (!o) setText("");
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogTitle className="flex items-center gap-2 text-red-300">
          <TriangleAlert className="h-6 w-6" /> {t("account_deleteTitle")}
        </DialogTitle>
        <DialogDescription>{t("account_deleteDesc")}</DialogDescription>

        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-zinc-300">
          <li>{t("account_li1")}</li>
          <li>{t("account_li2")}</li>
          <li>{t("account_li3")}</li>
        </ul>

        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
        >
          <label htmlFor="delete-confirm" className="text-sm text-zinc-300">
            {t("account_typePrompt", { word })}
          </label>
          <Input
            id="delete-confirm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={word}
            autoComplete="off"
            autoCapitalize="characters"
            disabled={busy}
          />
          <Button
            type="submit"
            size="lg"
            className="w-full border border-red-400/50 bg-red-600 text-white hover:bg-red-500 disabled:bg-red-600/30"
            disabled={!armed || busy}
          >
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> {t("account_deleting")}
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5" /> {t("account_deleteBtn")}
              </>
            )}
          </Button>
          <Button type="button" variant="glass" size="lg" className="w-full" onClick={() => onOpenChange(false)} disabled={busy}>
            {t("crop_cancel")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
