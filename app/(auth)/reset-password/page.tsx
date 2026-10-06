"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/lib/supabase";
import { MIN_PASSWORD, useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "@/lib/store/useToastStore";

/** Schritt 2: Der Link aus der E-Mail führt hierher; Supabase legt dabei eine Recovery-Sitzung an. */
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let done = false;
    const ok = () => {
      done = true;
      setState("ready");
    };
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) ok();
    });
    void supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) ok();
    });
    // Ohne gültigen Link entsteht nie eine Sitzung
    const timer = setTimeout(() => {
      if (!done) setState("invalid");
    }, 2500);
    return () => {
      clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < MIN_PASSWORD) {
      setError(t("auth_errPasswordShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth_errMismatch"));
      return;
    }
    setError(null);
    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error === "weakPassword" ? t("auth_errPasswordShort") : t("auth_errUnavailable"));
      return;
    }
    toast(t("auth_passwordUpdated"));
    router.replace("/");
  };

  return (
    <main className="flex min-h-dvh flex-col justify-center gap-8 px-5 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo size={72} showName={false} />
        <h1 className="font-display text-2xl font-bold">{t("auth_newPasswordTitle")}</h1>
      </div>

      {state === "checking" && <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-400" />}

      {state === "invalid" && (
        <div className="space-y-4 text-center">
          <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-3 text-sm text-red-400">
            {t("auth_resetInvalid")}
          </p>
          <Button className="w-full" onClick={() => router.replace("/login")}>
            {t("auth_backToLogin")}
          </Button>
        </div>
      )}

      {state === "ready" && (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Input
            type="password"
            autoComplete="new-password"
            placeholder={t("auth_newPassword")}
            aria-label={t("auth_newPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            autoComplete="new-password"
            placeholder={t("auth_confirmPassword")}
            aria-label={t("auth_confirmPassword")}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <p className="text-[11px] text-zinc-500">{t("auth_passwordHint")}</p>
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth_newPasswordSave")}
          </Button>
        </form>
      )}
    </main>
  );
}
