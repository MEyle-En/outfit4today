import { useProfileStore } from "@/lib/store/useProfileStore";

export type SoundName = "click" | "success" | "cash" | "notification" | "whoosh";

// Leise Lautstärken, damit die Effekte nicht aufdringlich werden (Dateien liegen in /public/sounds)
const VOLUME: Record<SoundName, number> = {
  click: 0.35,
  success: 0.5,
  cash: 0.5,
  notification: 0.4,
  whoosh: 0.3,
};

// Maximale Abspieldauer in ms. Längere Dateien werden am Ende weich ausgeblendet,
// damit z.B. ein 3-Sekunden-Pop beim Liken nicht nervt.
const MAX_MS: Record<SoundName, number> = {
  click: 400,
  success: 1500,
  cash: 1100,
  notification: 1000,
  whoosh: 900,
};
const FADE_MS = 250;

// Akzeptierte Dateinamen: sauber (click.mp3) oder doppelt (click.mp3.wav), jeweils auch als .wav
const EXTENSIONS = [".mp3", ".mp3.wav", ".wav"];

const cache = new Map<SoundName, HTMLAudioElement>();
const stopTimers = new Map<SoundName, ReturnType<typeof setTimeout>>();
const fadeTimers = new Map<SoundName, ReturnType<typeof setInterval>>();

function load(key: SoundName): HTMLAudioElement {
  const audio = new Audio();
  let attempt = 0;
  // Fehlt die erste Variante, wird die nächste Endung probiert
  audio.addEventListener("error", () => {
    attempt += 1;
    if (attempt < EXTENSIONS.length) {
      audio.src = `/sounds/${key}${EXTENSIONS[attempt]}`;
      audio.load();
    }
  });
  audio.preload = "auto";
  audio.src = `/sounds/${key}${EXTENSIONS[0]}`;
  return audio;
}

/**
 * Spielt /sounds/<name> ab. Auch außerhalb von React nutzbar (Stores, Timer).
 * Stumm geschaltet, im Server-Render oder bei fehlender Datei passiert einfach nichts.
 */
export function playSound(name: SoundName | `${SoundName}.mp3`) {
  try {
    if (typeof window === "undefined") return;
    if (useProfileStore.getState().isMuted) return;
    const key = name.replace(/\.mp3$/, "") as SoundName;
    let audio = cache.get(key);
    if (!audio) {
      audio = load(key);
      cache.set(key, audio);
    }

    clearTimeout(stopTimers.get(key));
    clearInterval(fadeTimers.get(key));
    const volume = VOLUME[key] ?? 0.4;
    audio.volume = volume;
    audio.currentTime = 0; // schnelle Klicks starten den Sound jedes Mal neu statt abzuhacken
    // Autoplay-Sperre oder fehlende Datei lehnen das Promise ab – das ist kein Fehler
    void audio.play().catch(() => {});

    const limit = MAX_MS[key];
    stopTimers.set(
      key,
      setTimeout(() => {
        const a = audio;
        if (!a || a.paused || a.ended) return;
        const steps = 10;
        let i = 0;
        fadeTimers.set(
          key,
          setInterval(() => {
            i += 1;
            a.volume = Math.max(0, volume * (1 - i / steps));
            if (i >= steps) {
              clearInterval(fadeTimers.get(key));
              a.pause();
              a.volume = volume;
            }
          }, FADE_MS / steps),
        );
      }, Math.max(0, limit - FADE_MS)),
    );
  } catch {
    /* Audio nicht verfügbar – App läuft ohne Ton weiter */
  }
}
