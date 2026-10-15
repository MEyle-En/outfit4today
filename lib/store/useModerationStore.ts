import { create } from "zustand";
import { translate } from "@/lib/i18n/translate";
import { blockUser, getBlockedIds, unblockUser } from "@/lib/supabase-moderation";
import { toast } from "@/lib/store/useToastStore";

interface ModerationState {
  /** Von mir blockierte Nutzer (Supabase `blocks`), nicht lokal gespeichert */
  blocked: string[];
  load: () => Promise<void>;
  reset: () => void;
  block: (userId: string) => Promise<boolean>;
  unblock: (userId: string) => Promise<boolean>;
}

export const useModerationStore = create<ModerationState>()((set, get) => ({
  blocked: [],
  load: async () => {
    try {
      set({ blocked: await getBlockedIds() });
    } catch (e) {
      console.error("Blockierliste laden fehlgeschlagen:", e);
    }
  },
  reset: () => set({ blocked: [] }),
  block: async (userId) => {
    const r = await blockUser(userId);
    if (!r.ok) {
      toast(translate("mod_errAction"), undefined, "error");
      return false;
    }
    // Sofort ausblenden (Posts/Kommentare dieses Nutzers verschwinden aus allen Listen)
    set({ blocked: Array.from(new Set([...get().blocked, userId])) });
    toast(translate("mod_blockedToast"));
    return true;
  },
  unblock: async (userId) => {
    const r = await unblockUser(userId);
    if (!r.ok) {
      toast(translate("mod_errAction"), undefined, "error");
      return false;
    }
    set({ blocked: get().blocked.filter((id) => id !== userId) });
    toast(translate("mod_unblockedToast"));
    return true;
  },
}));
