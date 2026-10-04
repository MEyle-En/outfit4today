import { MOCK_ITEMS, PORTRAITS } from "@/lib/mock-data";
import { buildMockItem } from "@/lib/mock/wardrobe";
import type { Crew, FitLayer, FitPost, FriendItem, Person } from "@/types";

export const ME: Person = { id: "me", name: "Du", handle: "du", gradient: "from-purple-500 to-fuchsia-500" };

export const MOCK_FRIENDS: Person[] = [
  { id: "f-mila", name: "Mila", handle: "mila.wears", gradient: "from-purple-500 to-pink-500", avatar: PORTRAITS["f-mila"] },
  { id: "f-jonas", name: "Jonas", handle: "jonas.fits", gradient: "from-emerald-400 to-cyan-500", avatar: PORTRAITS["f-jonas"] },
  { id: "f-lea", name: "Lea", handle: "lea.y2k", gradient: "from-pink-500 to-fuchsia-600", avatar: PORTRAITS["f-lea"] },
  { id: "f-ava", name: "Ava", handle: "ava.vintage", gradient: "from-amber-400 to-orange-600", avatar: PORTRAITS["f-ava"] },
];

export const getPerson = (id: string): Person => (id === ME.id ? ME : MOCK_FRIENDS.find((f) => f.id === id) ?? ME);

/** Die Wardrobes der Freunde: je 3 Teile aus dem Katalog (lib/mock-data.ts). */
export const FRIEND_ITEMS: FriendItem[] = MOCK_ITEMS.filter((m) => m.owner !== "me").map((m, i) => ({
  ...buildMockItem(m, i + 1),
  ownerId: m.owner,
}));

export const SEED_CREWS: Crew[] = [
  {
    id: "crew-main",
    name: "Main Squad",
    inviteCode: "MAIN42",
    memberIds: MOCK_FRIENDS.map((f) => f.id),
    createdAt: 1,
  },
];

const layer = (id: string, x: number, y: number, size: number, rotation = 0): FitLayer => {
  const it = FRIEND_ITEMS.find((i) => i.id === id)!;
  return { itemId: it.id, name: it.name, category: it.category, x, y, size, rotation };
};

const now = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

/** Seed-Feed: 6 Posts mit je 2–3 Teilen des jeweiligen Freundes. */
export const SEED_POSTS: FitPost[] = [
  {
    id: "seed-1",
    crewId: "crew-main",
    authorId: "f-mila",
    caption: "Monday Mood ❤️",
    createdAt: now - 42 * MIN,
    layers: [layer("f-mila-2", 90, 20, 170), layer("f-mila-3", 40, 240, 100, -8)],
    reactions: { fire: ["f-jonas", "f-lea", "f-ava"], idea: [], want: ["f-lea"] },
    comments: [{ id: "sc1", authorId: "f-jonas", kind: "comment", text: "Das Rot 😮‍💨", createdAt: now - 30 * MIN }],
  },
  {
    id: "seed-2",
    crewId: "crew-main",
    isPublic: true,
    authorId: "f-jonas",
    caption: "Weekend Vibes",
    createdAt: now - 5 * HOUR,
    layers: [layer("f-jonas-2", 80, 20, 170), layer("f-jonas-1", 270, 40, 100, 6), layer("f-jonas-3", 120, 250, 140, -4)],
    reactions: { fire: ["f-mila", "f-ava"], idea: ["f-lea"], want: [] },
    comments: [],
  },
  {
    id: "seed-3",
    crewId: "crew-main",
    isPublic: true,
    authorId: "f-lea",
    caption: "Sunday Brunch Fit 🥂",
    createdAt: now - 26 * HOUR,
    layers: [layer("f-lea-1", 110, 60, 150), layer("f-lea-3", 40, 20, 100, -6), layer("f-lea-2", 270, 220, 90, 8)],
    reactions: { fire: ["f-mila", "f-jonas"], idea: [], want: ["f-mila"] },
    comments: [],
  },
  {
    id: "seed-4",
    crewId: "crew-main",
    authorId: "f-ava",
    caption: "Skirt Szn 🍂",
    createdAt: now - 3 * HOUR,
    layers: [layer("f-ava-1", 70, 30, 160), layer("f-ava-3", 250, 230, 110, -6)],
    reactions: { fire: ["f-lea"], idea: ["f-mila"], want: [] },
    comments: [],
  },
  {
    id: "seed-5",
    crewId: "crew-main",
    isPublic: true,
    authorId: "f-mila",
    caption: "Pink Friday 💗",
    createdAt: now - 50 * HOUR,
    layers: [layer("f-mila-1", 100, 30, 170), layer("f-mila-3", 270, 200, 90, 10)],
    reactions: { fire: ["f-ava", "f-lea"], idea: [], want: ["f-ava"] },
    comments: [],
  },
  {
    id: "seed-6",
    crewId: "crew-main",
    authorId: "f-jonas",
    caption: "Layer Up",
    createdAt: now - 72 * HOUR,
    layers: [layer("f-jonas-2", 60, 30, 160), layer("f-jonas-3", 230, 210, 120, -5)],
    reactions: { fire: ["f-mila"], idea: [], want: [] },
    comments: [],
  },
];
