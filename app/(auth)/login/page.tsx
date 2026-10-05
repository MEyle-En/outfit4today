"use client";

import { useState } from "react";
import { Apple, LogIn, UserPlus } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { MIN_PASSWORD, useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mock-Login für das MVP: es gibt kein Backend, das Konto liegt im localStorage. Weiterleitung übernimmt der AuthGuard. */
export default function LoginPage() {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const emailError = submitted && !EMAIL_RE.test(email.trim()) ? t("auth_errEmail") : null;
  const usernameError = submitted && mode === "register" && username.trim().length < 2 ? t("auth_errUsername") : null;

  const passwordError =
    submitted && password.length === 0
      ? t("auth_errPasswordRequired")
      : submitted && mode === "register" && password.length < MIN_PASSWORD
        ? t("auth_errPasswordShort")
        : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setAuthError(null);
    if (!EMAIL_RE.test(email.trim())) return;
    if (mode === "register" && username.trim().length < 2) return;
    if (password.length === 0 || (mode === "register" && password.length < MIN_PASSWORD)) return;
    const result = mode === "register" ? register(email, username, password) : login(email, password);
    if (!result.ok) {
      setAuthError(
        result.error === "exists"
          ? t("auth_errExists")
          : result.error === "weakPassword"
            ? t("auth_errPasswordShort")
            : t("auth_errCredentials"), // unbekannte E-Mail und falsches Passwort bewusst nicht unterscheiden
      );
      return;
    }
    toast(t("auth_welcome", { name: useAuthStore.getState().user?.username ?? "" }));
  };

  const soon = () => toast(t("auth_soonToast"), t("auth_soon"));

  const fields = (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("auth_email")}
          aria-label={t("auth_email")}
          aria-invalid={!!emailError}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(emailError && "border-red-400/70 ring-1 ring-red-400/50")}
        />
        {emailError && <p role="alert" className="text-xs text-red-400">{emailError}</p>}
      </div>

      {mode === "register" && (
        <div className="space-y-1.5">
          <Input
            autoComplete="username"
            placeholder={t("auth_username")}
            aria-label={t("auth_username")}
            aria-invalid={!!usernameError}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={24}
            className={cn(usernameError && "border-red-400/70 ring-1 ring-red-400/50")}
          />
          {usernameError && <p role="alert" className="text-xs text-red-400">{usernameError}</p>}
        </div>
      )}

      <div className="space-y-1.5">
        <Input
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          placeholder={t("auth_password")}
          aria-label={t("auth_password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!passwordError}
          className={cn(passwordError && "border-red-400/70 ring-1 ring-red-400/50")}
        />
        {passwordError ? (
          <p role="alert" className="text-xs text-red-400">{passwordError}</p>
        ) : (
          mode === "register" && <p className="text-[11px] text-zinc-500">{t("auth_passwordHint")}</p>
        )}
      </div>
    </div>
  );

  return (
    <main className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-5 py-10">
      {/* Ambient Glow in Logo-Farben */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/25 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-pink-500/15 blur-[100px]" />

      <div className="relative z-10 space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span style={{ filter: "drop-shadow(0 0 18px rgba(236,72,153,0.5))" }}>
            <Logo size={112} showName={false} />
          </span>
          <h1 className="font-display text-4xl font-bold leading-none tracking-tight">
            Outfit<span className="text-accent-soft">4</span>Today
          </h1>
          <p className="max-w-xs text-sm text-zinc-400">{t("auth_tagline")}</p>
        </div>

        <form onSubmit={submit} noValidate className="space-y-5">
          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v as Mode);
              setSubmitted(false);
              setAuthError(null);
            }}
          >
            <TabsList>
              <TabsTrigger value="login">
                <LogIn className="h-4 w-4" /> {t("auth_login")}
              </TabsTrigger>
              <TabsTrigger value="register">
                <UserPlus className="h-4 w-4" /> {t("auth_register")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">{fields}</TabsContent>
            <TabsContent value="register">{fields}</TabsContent>
          </Tabs>

          {authError && (
            <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">
              {authError}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full">
            {t("auth_continue")}
          </Button>
        </form>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="h-px flex-1 bg-white/10" />
            {t("auth_or")}
            <span className="h-px flex-1 bg-white/10" />
          </div>

          {/* Social Login: noch nicht verfügbar – grau, aber klickbar (Toast) */}
          {[
            { id: "google", label: t("auth_google"), icon: <span className="text-base font-bold">G</span> },
            { id: "apple", label: t("auth_apple"), icon: <Apple className="h-5 w-5" /> },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={soon}
              aria-disabled="true"
              title={t("auth_soon")}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-medium text-zinc-500"
            >
              {p.icon}
              {p.label}
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-400">{t("auth_soon")}</span>
            </button>
          ))}
        </div>

        <p className="flex justify-center gap-4 text-xs text-zinc-500">
          <Link href="/privacy" className="hover:text-white">{t("legal_privacy")}</Link>
          <Link href="/imprint" className="hover:text-white">{t("legal_imprint")}</Link>
        </p>
      </div>
    </main>
  );
}
