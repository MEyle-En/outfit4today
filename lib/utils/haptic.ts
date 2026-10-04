export type HapticType = "light" | "medium" | "success" | "error";

const PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  success: [30, 50, 30],
  error: [50, 100, 50],
};

/** Kurzes Vibrations-Feedback (nur Geräte/Browser mit Vibration API, z.B. Android; iOS Safari ignoriert es). */
export function haptic(type: HapticType) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(PATTERNS[type]);
    }
  } catch {
    /* Vibration nicht erlaubt – ignorieren */
  }
}
