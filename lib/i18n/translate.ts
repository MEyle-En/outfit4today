import { lookup, type TranslationKey } from "@/lib/i18n/translations";
import { useLangStore } from "@/lib/store/useLangStore";

export function interpolate(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text;
  let out = text;
  for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}

/** Übersetzen außerhalb von React (Stores, Helfer). In Komponenten besser useTranslation(), damit sie bei Sprachwechsel neu rendern. */
export function translate(key: TranslationKey, vars?: Record<string, string | number>) {
  return interpolate(lookup(useLangStore.getState().lang, key), vars);
}
