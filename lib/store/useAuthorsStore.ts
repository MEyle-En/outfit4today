import { create } from "zustand";
import type { AuthorProfile } from "@/lib/supabase-social";

/** Namen und Avatare anderer Nutzer (aus `profiles`), nur im Speicher. */
interface AuthorsState {
  profiles: Record<string, { username: string; avatar?: string }>;
  add: (list: AuthorProfile[]) => void;
}

export const useAuthorsStore = create<AuthorsState>()((set) => ({
  profiles: {},
  add: (list) =>
    set((s) => ({
      profiles: {
        ...s.profiles,
        ...Object.fromEntries(list.map((p) => [p.id, { username: p.username ?? "", avatar: p.avatar_url ?? undefined }])),
      },
    })),
}));
