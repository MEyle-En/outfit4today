"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/lib/store/useAuthStore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Schritt 1 des Zurücksetzens: E-Mail eingeben, Link kommt per Mail (Ziel: /reset-password). */
export function ForgotPassword({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const { t } = useTranslation();
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!EMAIL_RE.test(email.trim())) {
      setError(t("auth_errEmail"));
      return;
    }
    setError(null);
    setBusy(true);
    const result = await requestPasswordReset(email);
    setBusy(false);
    if (result.ok) setSent(true);
    else setError(t("auth_errUnavailable"));
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold">{t("auth_resetTitle")}</h2>
        <p className="text-sm text-zinc-400">{t("auth_resetHint")}</p>
      </div>

      {sent ? (
        <p role="status" className="rounded-xl bg-accent/15 px-3 py-3 text-sm text-zinc-200">
          {t("auth_resetSent")}
        </p>
      ) : (
        <>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("auth_email")}
            aria-label={t("auth_email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth_resetSend")}
          </Button>
        </>
      )}

      <button type="button" onClick={onBack} className="w-full text-center text-sm text-zinc-400 hover:text-white">
        {t("auth_backToLogin")}
      </button>
    </form>
  );
}
