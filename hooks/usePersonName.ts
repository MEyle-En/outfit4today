"use client";

import { useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { getPerson } from "@/lib/mock/crew";
import { useAuthStore } from "@/lib/store/useAuthStore";

/** Anzeigename einer Person: für "me" der Username aus der Registrierung, sonst der (Mock-)Name. */
export function usePersonName() {
  const { t } = useTranslation();
  const username = useAuthStore((s) => s.user?.username);
  return useCallback((id: string) => (id === "me" ? username ?? t("you") : getPerson(id).name), [username, t]);
}
