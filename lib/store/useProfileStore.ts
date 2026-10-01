import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProfileState {
  /** Profilbild als (verkleinerte) Data-URL */
  avatar: string | null;
  setAvatar: (dataUrl: string | null) => void;
  /** Sound-Effekte aus? Bleibt über Neuladen erhalten. */
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      avatar: null,
      setAvatar: (avatar) => set({ avatar }),
      isMuted: false,
      setMuted: (isMuted) => set({ isMuted }),
    }),
    { name: "outfit4today-profile" },
  ),
);
