"use client";

import { useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useAuthorsStore } from "@/lib/store/useAuthorsStore";

/** Anzeigename einer Person: ich = mein Username, andere = Username aus `profiles`. */
export function usePersonName() {
  const { t } = useTranslation();
  const meId = useAuthStore((s) => s.user?.id);
  const meName = useAuthStore((s) => s.user?.username);
  const profiles = useAuthorsStore((s) => s.profiles);
  return useCallback(
    (id: string) => (id === meId ? meName ?? t("you") : profiles[id]?.username || t("user_unknown")),
    [meId, meName, profiles, t],
  );
}
