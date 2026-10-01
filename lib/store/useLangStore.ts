import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/i18n/translations";

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

/** Sprache wird im LocalStorage gehalten (Standard: Deutsch). */
export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: "de",
      setLang: (lang) => set({ lang }),
    }),
    { name: "outfit4today-lang" },
  ),
);
