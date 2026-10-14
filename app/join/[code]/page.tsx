"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCrewStore } from "@/lib/store/useCrewStore";
import { sanitizeCode, setPendingJoin } from "@/lib/utils/pendingJoin";

type State = "working" | "invalid" | "failed";

/** Einladungslink: /join/<code>. Funktioniert auch ohne Login (Code wird gemerkt, nach dem Login beigetreten). */
export default function JoinPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const joinCrew = useCrewStore((s) => s.joinCrew);
  const [state, setState] = useState<State>("working");
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);

  const code = sanitizeCode(params?.code);

  useEffect(() => {
    if (!authReady) return;
    if (!code) {
      setState("invalid");
      return;
    }
    if (!isAuthenticated) {
      // Nicht eingeloggt: Code merken, der AuthGuard tritt nach dem Login bei
      setPendingJoin(code);
      router.replace("/login");
      return;
    }
    if (started.current === attempt) return; // Doppelausführung (z. B. Strict Mode) verhindern
    started.current = attempt;
    setState("working");
    void joinCrew(code).then((result) => {
      if (result.ok) {
        useCrewStore.getState().setWardrobeView("crew");
        useCrewStore.getState().setCrewTab("fits");
        router.replace("/wardrobe");
      } else {
        setState(result.error === "invalid" ? "invalid" : "failed");
      }
    });
  }, [authReady, isAuthenticated, code, attempt, joinCrew, router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo size={72} showName={false} />
      {state === "working" ? (
        <div role="status" className="space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent-soft" />
          <p className="font-medium">{t("join_working")}</p>
        </div>
      ) : (
        <div className="glass w-full max-w-sm space-y-4 rounded-2xl p-6">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent/20 text-accent-soft">
            <Users className="h-6 w-6" />
          </span>
          <h1 className="font-display text-xl font-semibold">
            {t(state === "invalid" ? "join_invalidTitle" : "join_failedTitle")}
          </h1>
          <p className="text-sm text-zinc-400">{t(state === "invalid" ? "join_invalidDesc" : "join_failedDesc")}</p>
          {state === "failed" && (
            <Button variant="glass" className="w-full" onClick={() => setAttempt((n) => n + 1)}>
              {t("join_retry")}
            </Button>
          )}
          <Button className="w-full" onClick={() => router.replace("/")}>
            {t("join_toApp")}
          </Button>
        </div>
      )}
    </main>
  );
}
