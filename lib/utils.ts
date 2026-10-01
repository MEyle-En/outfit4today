import { translate } from "@/lib/i18n/translate";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return translate("ago_now");
  if (m < 60) return translate("ago_min", { n: m });
  const h = Math.floor(m / 60);
  return h < 24 ? translate("ago_hour", { n: h }) : translate("ago_day", { n: Math.floor(h / 24) });
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
