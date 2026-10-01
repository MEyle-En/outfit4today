import { buildMockItem } from "@/lib/mock/wardrobe";
import type { Crew, FitPost, FriendItem, Person } from "@/types";

export const ME: Person = { id: "me", name: "Du", handle: "du", gradient: "from-purple-500 to-fuchsia-500" };

export const MOCK_FRIENDS: Person[] = [
  { id: "f-mila", name: "Mila", handle: "mila.wears", gradient: "from-purple-500 to-pink-500" },
  { id: "f-jonas", name: "Jonas", handle: "jonas.fits", gradient: "from-emerald-400 to-cyan-500" },
  { id: "f-lea", name: "Lea", handle: "lea.y2k", gradient: "from-pink-500 to-fuchsia-600" },
];

export const getPerson = (id: string): Person => (id === ME.id ? ME : MOCK_FRIENDS.find((f) => f.id === id) ?? ME);

const fi = (
  owner: string,
  n: number,
  name: string,
  category: FriendItem["category"],
  color: string,
  material: string,
  shared = true,
): FriendItem => ({
  ...buildMockItem(`${owner}-${n}`, name, `${owner}-${n}-${name}`, category, color, material, n),
  ownerId: owner,
  sharedWithCrew: shared,
});

/** Die Wardrobes der Freunde (Mock). `shared: false` zeigt, dass Privacy respektiert wird. */
export const FRIEND_ITEMS: FriendItem[] = [
  fi("f-mila", 1, "Baby Tee", "top", "Rosa", "Baumwolle"),
  fi("f-mila", 2, "Low Rise Jeans", "bottom", "Blau", "Denim"),
  fi("f-mila", 3, "Platform Sneakers", "shoes", "Weiß", "Leder"),
  fi("f-mila", 4, "Silberne Kette", "accessory", "Silber", "Metall"),
  fi("f-mila", 5, "Privates Kleid", "dress", "Schwarz", "Satin", false),
  fi("f-jonas", 1, "Shell Jacket", "outerwear", "Grün", "Nylon"),
  fi("f-jonas", 2, "Cargo Pants", "bottom", "Beige", "Baumwolle"),
  fi("f-jonas", 3, "Trail Runner", "shoes", "Grau", "Mesh"),
  fi("f-jonas", 4, "Boxy Tee", "top", "Weiß", "Baumwolle"),
  fi("f-lea", 1, "Slip Dress", "dress", "Schwarz", "Satin"),
  fi("f-lea", 2, "Cropped Cardigan", "top", "Lila", "Wolle"),
  fi("f-lea", 3, "Mini Bag", "accessory", "Silber", "Leder"),
  fi("f-lea", 4, "Faux Fur Coat", "outerwear", "Braun", "Kunstfell"),
];

export const SEED_CREWS: Crew[] = [
  {
    id: "crew-main",
    name: "Main Squad",
    inviteCode: "MAIN42",
    memberIds: MOCK_FRIENDS.map((f) => f.id),
    createdAt: 1,
  },
];

const layer = (owner: string, n: number, x: number, y: number, size: number, rotation = 0) => {
  const it = FRIEND_ITEMS.find((i) => i.id === `${owner}-${n}`)!;
  return { itemId: it.id, name: it.name, category: it.category, x, y, size, rotation };
};

const now = Date.now();

export const SEED_POSTS: FitPost[] = [
  {
    id: "seed-1",
    crewId: "crew-main",
    authorId: "f-mila",
    caption: "Y2K Sonntag – Schuhe noch unsicher? 👀",
    createdAt: now - 1000 * 60 * 42,
    layers: [
      layer("f-mila", 1, 100, 20, 140),
      layer("f-mila", 2, 80, 200, 160),
      layer("f-mila", 3, 240, 300, 100, 10),
      layer("f-mila", 4, 20, 60, 80, -12),
    ],
    reactions: { fire: ["f-jonas", "f-lea"], idea: [], want: ["f-lea"] },
    comments: [
      { id: "sc1", authorId: "f-jonas", kind: "comment", text: "Die Jeans 😮‍💨", createdAt: now - 1000 * 60 * 30 },
    ],
  },
  {
    id: "seed-2",
    crewId: "crew-main",
    isPublic: true,
    authorId: "f-jonas",
    caption: "Gorpcore fürs Wochenende",
    createdAt: now - 1000 * 60 * 60 * 5,
    layers: [layer("f-jonas", 1, 80, 20, 160), layer("f-jonas", 4, 260, 60, 100), layer("f-jonas", 2, 100, 240, 150), layer("f-jonas", 3, 260, 260, 100, -8)],
    reactions: { fire: ["f-mila"], idea: ["f-lea"], want: [] },
    comments: [],
  },
  {
    id: "seed-3",
    crewId: "crew-main",
    isPublic: true,
    authorId: "f-lea",
    caption: "Slip Dress + Fur = Winter-Ready ❄️",
    createdAt: now - 1000 * 60 * 60 * 26,
    layers: [layer("f-lea", 1, 100, 60, 150), layer("f-lea", 4, 60, 20, 170, -6), layer("f-lea", 3, 270, 200, 80, 8)],
    reactions: { fire: ["f-mila", "f-jonas"], idea: [], want: ["f-mila"] },
    comments: [],
  },
];
