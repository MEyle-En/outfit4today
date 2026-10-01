"use client";

import { playSound } from "@/lib/sound";
import { useProfileStore } from "@/lib/store/useProfileStore";

/** const { playSound, isMuted, toggleMute } = useSound();  playSound("success") */
export function useSound() {
  const isMuted = useProfileStore((s) => s.isMuted);
  const setMuted = useProfileStore((s) => s.setMuted);
  return { playSound, isMuted, setMuted, toggleMute: () => setMuted(!isMuted) };
}
