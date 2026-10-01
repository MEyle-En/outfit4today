"use client";

import { useCallback } from "react";
import { interpolate } from "@/lib/i18n/translate";
import { lookup, type TranslationKey } from "@/lib/i18n/translations";
import { useLangStore } from "@/lib/store/useLangStore";

/** const { t, lang, setLang } = useTranslation();  t("navHome"), t("ago_min", { n: 5 }) */
export function useTranslation() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => interpolate(lookup(lang, key), vars),
    [lang],
  );

  return { t, lang, setLang };
}
