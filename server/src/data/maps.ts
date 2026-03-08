// ============================================
// VocaQuest Online - Map Generation
// 100% Original Code - MIT License
// ============================================

import type {
  MapData,
  MapZone,
  SpawnPoint,
  NpcPlacement,
} from "../../../shared/types";
import { TileType, COLLISION_TILES } from "../../../shared/types";

// ---- Zone Definitions ----
let zones: MapZone[] = [
  {
    id: "town",
    name: "Town",
    nameKo: "마을",
    x: 80,
    y: 80,
    width: 40,
    height: 40,
    levelRange: [0, 0],
    bgColor: "#A0A0A0",
  },
  {
    id: "starter_meadow",
    name: "Starter Meadow",
    nameKo: "시작의 초원",
    x: 40,
    y: 40,
    width: 40,
    height: 80,
    levelRange: [1, 5],
    bgColor: "#7CFC00",
  },
  {
    id: "dark_forest",
    name: "Dark Forest",
    nameKo: "어둠의 숲",
    x: 120,
    y: 40,
    width: 40,
    height: 40,
    levelRange: [5, 10],
    bgColor: "#2E4600",
  },
  {
    id: "scorching_desert",
    name: "Scorching Desert",
    nameKo: "타오르는 사막",
    x: 120,
    y: 120,
    width: 40,
    height: 40,
    levelRange: [10, 15],
    bgColor: "#EDC9AF",
  },
  {
    id: "frozen_mountains",
    name: "Frozen Mountains",
    nameKo: "얼어붙은 산맥",
    x: 40,
    y: 140,
    width: 40,
    height: 40,
    levelRange: [15, 20],
    bgColor: "#E0E8F0",
  },
  {
    id: "shadow_realm",
    name: "Shadow Realm",
    nameKo: "그림자 영역",
    x: 140,
    y: 80,
    width: 40,
    height: 40,
    levelRange: [20, 30],
    bgColor: "#1A0A2E",
  },
  {
    id: "volcanic_cavern",
    name: "Volcanic Cavern",
    nameKo: "화산 동굴",
    x: 5,
    y: 80,
    width: 35,
    height: 40,
    levelRange: [30, 35],
    bgColor: "#4A1500",
  },
  {
    id: "ancient_ruins",
    name: "Ancient Ruins",
    nameKo: "고대 유적",
    x: 80,
    y: 42,
    width: 40,
    height: 36,
    levelRange: [35, 40],
    bgColor: "#4A3B2A",
  },
  {
    id: "abyssal_depths",
    name: "Abyssal Depths",
    nameKo: "심연의 깊이",
    x: 80,
    y: 160,
    width: 40,
    height: 35,
    levelRange: [40, 45],
    bgColor: "#0A001A",
  },
  {
    id: "dragons_sanctum",
    name: "Dragon's Sanctum",
    nameKo: "드래곤의 성소",
    x: 160,
    y: 160,
    width: 35,
    height: 35,
    levelRange: [45, 50],
    bgColor: "#3A1500",
  },
];

// ---- Seeded RNG for deterministic maps ----
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ---- Helpers ----
function placeTrees(
  tiles: number[][],
  rng: () => number,
  x: number,
  y: number,
  width: number,
  height: number,
  density: number,
) {
  for (let ty = y; ty < y + height; ty++) {
    for (let tx = x; tx < x + width; tx++) {
      if (tx >= 0 && tx < 200 && ty >= 0 && ty < 200) {
        if (rng() < density) {
          tiles[ty][tx] = TileType.TREE;
        }
      }
    }
  }
}

function placeWaterFeature(
  tiles: number[][],
  cx: number,
  cy: number,
  radius: number,
) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      let dist = Math.sqrt(dx * dx + dy * dy);
      let tx = cx + dx;
      let ty = cy + dy;
      if (tx >= 0 && tx < 200 && ty >= 0 && ty < 200 && dist <= radius) {
        tiles[ty][tx] = TileType.WATER;
      }
    }
  }
}

function placeRiver(
  tiles: number[][],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  width: number,
) {
  let steps = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));
  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    let x = Math.round(startX + (endX - startX) * t);
    let y = Math.round(startY + (endY - startY) * t);
    for (let dy = -width; dy <= width; dy++) {
      for (let dx = -width; dx <= width; dx++) {
        let tx = x + dx;
        let ty = y + dy;
        if (tx >= 0 && tx < 200 && ty >= 0 && ty < 200) {
          tiles[ty][tx] = TileType.WATER;
        }
      }
    }
  }
}

// ---- Main generation function ----
export function generateMap(): MapData {
  let rng = createRng(42);
  let W = 200;
  let H = 200;

  // Initialize all tiles as grass
  let tiles: number[][] = [];
  for (let y = 0; y < H; y++) {
    tiles[y] = [];
    for (let x = 0; x < W; x++) {
      tiles[y][x] = TileType.GRASS;
    }
  }

  // ---- Apply zone-specific tiles ----

  // Town: stone floor with wall border
  for (let y = 80; y < 120; y++) {
    for (let x = 80; x < 120; x++) {
      tiles[y][x] = TileType.FLOOR;
    }
  }
  // Town walls (border)
  for (let x = 80; x < 120; x++) {
    tiles[80][x] = TileType.WALL;
    tiles[119][x] = TileType.WALL;
  }
  for (let y = 80; y < 120; y++) {
    tiles[y][80] = TileType.WALL;
    tiles[y][119] = TileType.WALL;
  }
  // Town entrances (gaps in walls)
  // North entrance
  for (let x = 97; x <= 103; x++) tiles[80][x] = TileType.FLOOR;
  // South entrance
  for (let x = 97; x <= 103; x++) tiles[119][x] = TileType.FLOOR;
  // West entrance
  for (let y = 97; y <= 103; y++) tiles[y][80] = TileType.FLOOR;
  // East entrance
  for (let y = 97; y <= 103; y++) tiles[y][119] = TileType.FLOOR;

  // Starter Meadow: bright grass (already default, add some trees)
  placeTrees(tiles, rng, 40, 40, 40, 80, 0.03);

  // Dark Forest: dark grass with dense trees
  for (let y = 40; y < 80; y++) {
    for (let x = 120; x < 160; x++) {
      tiles[y][x] = TileType.DARK_GRASS;
    }
  }
  placeTrees(tiles, rng, 120, 40, 40, 40, 0.15);

  // Scorching Desert: sand
  for (let y = 120; y < 160; y++) {
    for (let x = 120; x < 160; x++) {
      tiles[y][x] = TileType.SAND;
    }
  }

  // Frozen Mountains: snow and ice
  for (let y = 140; y < 180; y++) {
    for (let x = 40; x < 80; x++) {
      tiles[y][x] = rng() < 0.3 ? TileType.ICE : TileType.SNOW;
    }
  }
  // Mountain wall clusters
  for (let y = 140; y < 180; y++) {
    for (let x = 40; x < 80; x++) {
      if (rng() < 0.05) {
        tiles[y][x] = TileType.WALL;
      }
    }
  }

  // Shadow Realm: dark stone
  for (let y = 80; y < 120; y++) {
    for (let x = 140; x < 180; x++) {
      tiles[y][x] = TileType.DARK_STONE;
    }
  }
  // Shadow Realm lava pools
  for (let y = 80; y < 120; y++) {
    for (let x = 140; x < 180; x++) {
      if (rng() < 0.04) {
        tiles[y][x] = TileType.LAVA;
      }
    }
  }

  // Volcanic Cavern: dark stone with lava
  for (let y = 80; y < 120; y++) {
    for (let x = 5; x < 40; x++) {
      tiles[y][x] = TileType.DARK_STONE;
    }
  }
  for (let y = 80; y < 120; y++) {
    for (let x = 5; x < 40; x++) {
      if (rng() < 0.08) {
        tiles[y][x] = TileType.LAVA;
      }
    }
  }
  // Volcanic Cavern walls (cave walls)
  for (let y = 80; y < 120; y++) {
    for (let x = 5; x < 40; x++) {
      if (rng() < 0.04) {
        tiles[y][x] = TileType.WALL;
      }
    }
  }

  // Ancient Ruins: stone floor with walls scattered
  for (let y = 42; y < 78; y++) {
    for (let x = 80; x < 120; x++) {
      tiles[y][x] = TileType.STONE;
    }
  }
  for (let y = 42; y < 78; y++) {
    for (let x = 80; x < 120; x++) {
      if (rng() < 0.06) {
        tiles[y][x] = TileType.WALL;
      } else if (rng() < 0.03) {
        tiles[y][x] = TileType.DARK_STONE;
      }
    }
  }

  // Abyssal Depths: dark stone and swamp
  for (let y = 160; y < 195; y++) {
    for (let x = 80; x < 120; x++) {
      tiles[y][x] = rng() < 0.3 ? TileType.SWAMP : TileType.DARK_STONE;
    }
  }
  for (let y = 160; y < 195; y++) {
    for (let x = 80; x < 120; x++) {
      if (rng() < 0.03) {
        tiles[y][x] = TileType.LAVA;
      }
    }
  }

  // Dragon's Sanctum: lava and dark stone fortress
  for (let y = 160; y < 195; y++) {
    for (let x = 160; x < 195; x++) {
      tiles[y][x] = TileType.DARK_STONE;
    }
  }
  for (let y = 160; y < 195; y++) {
    for (let x = 160; x < 195; x++) {
      if (rng() < 0.1) {
        tiles[y][x] = TileType.LAVA;
      } else if (rng() < 0.04) {
        tiles[y][x] = TileType.WALL;
      }
    }
  }

  // ---- Water features ----
  // Lake between town and meadow
  placeWaterFeature(tiles, 78, 100, 3);
  // Lake between dark forest and desert
  placeWaterFeature(tiles, 135, 82, 4);
  // Small pond in meadow
  placeWaterFeature(tiles, 55, 70, 2);
  // River between desert and frozen mountains (south)
  placeRiver(tiles, 80, 135, 115, 155, 1);
  // Small pond near town north
  placeWaterFeature(tiles, 100, 75, 2);

  // ---- Outer border walls ----
  for (let x = 0; x < W; x++) {
    tiles[0][x] = TileType.WALL;
    tiles[H - 1][x] = TileType.WALL;
  }
  for (let y = 0; y < H; y++) {
    tiles[y][0] = TileType.WALL;
    tiles[y][W - 1] = TileType.WALL;
  }

  // ---- Scatter trees along edges of zones as natural barriers ----
  // Between meadow and outer areas
  placeTrees(tiles, rng, 35, 35, 5, 90, 0.4);
  placeTrees(tiles, rng, 35, 35, 50, 5, 0.4);
  // Between dark forest and outer areas
  placeTrees(tiles, rng, 160, 35, 5, 50, 0.4);
  placeTrees(tiles, rng, 115, 35, 50, 5, 0.4);

  // ---- Build collision map ----
  let collisions: boolean[][] = [];
  for (let y = 0; y < H; y++) {
    collisions[y] = [];
    for (let x = 0; x < W; x++) {
      collisions[y][x] = COLLISION_TILES.includes(tiles[y][x]);
    }
  }

  // ---- Spawn points ----
  let spawns: SpawnPoint[] = [
    // Starter Meadow
    { mobId: "slime", x: 50, y: 55, count: 5, radius: 8 },
    { mobId: "slime", x: 65, y: 80, count: 4, radius: 6 },
    { mobId: "rat", x: 55, y: 65, count: 4, radius: 7 },
    { mobId: "rat", x: 70, y: 95, count: 3, radius: 6 },
    { mobId: "bee", x: 60, y: 50, count: 4, radius: 8 },
    { mobId: "bee", x: 45, y: 75, count: 3, radius: 6 },
    { mobId: "spider", x: 55, y: 90, count: 3, radius: 7 },
    { mobId: "spider", x: 70, y: 60, count: 3, radius: 6 },
    { mobId: "wolf", x: 65, y: 105, count: 3, radius: 8 },
    { mobId: "wolf", x: 50, y: 100, count: 2, radius: 6 },
    { mobId: "slime_king", x: 60, y: 75, count: 1, radius: 3 },

    // Dark Forest
    { mobId: "goblin", x: 130, y: 50, count: 4, radius: 7 },
    { mobId: "goblin", x: 145, y: 65, count: 3, radius: 6 },
    { mobId: "skeleton", x: 135, y: 55, count: 3, radius: 7 },
    { mobId: "skeleton", x: 150, y: 50, count: 3, radius: 6 },
    { mobId: "orc", x: 140, y: 60, count: 3, radius: 7 },
    { mobId: "orc", x: 130, y: 70, count: 2, radius: 6 },
    { mobId: "treant", x: 150, y: 70, count: 2, radius: 5 },
    { mobId: "forest_snake", x: 125, y: 65, count: 3, radius: 8 },
    { mobId: "forest_snake", x: 155, y: 55, count: 2, radius: 6 },
    { mobId: "goblin_chief", x: 140, y: 55, count: 1, radius: 3 },

    // Scorching Desert
    { mobId: "scorpion", x: 130, y: 130, count: 4, radius: 8 },
    { mobId: "scorpion", x: 150, y: 145, count: 3, radius: 6 },
    { mobId: "mummy", x: 140, y: 135, count: 3, radius: 7 },
    { mobId: "mummy", x: 125, y: 150, count: 2, radius: 6 },
    { mobId: "bandit", x: 135, y: 145, count: 3, radius: 8 },
    { mobId: "bandit", x: 150, y: 130, count: 2, radius: 6 },
    { mobId: "sand_worm", x: 145, y: 140, count: 2, radius: 7 },
    { mobId: "desert_hawk", x: 130, y: 155, count: 2, radius: 8 },
    { mobId: "desert_hawk", x: 155, y: 135, count: 2, radius: 6 },
    { mobId: "desert_emperor", x: 140, y: 140, count: 1, radius: 3 },

    // Frozen Mountains
    { mobId: "ice_golem", x: 50, y: 150, count: 3, radius: 7 },
    { mobId: "ice_golem", x: 65, y: 165, count: 2, radius: 6 },
    { mobId: "dark_knight", x: 55, y: 155, count: 3, radius: 7 },
    { mobId: "dark_knight", x: 70, y: 150, count: 2, radius: 6 },
    { mobId: "harpy", x: 60, y: 160, count: 2, radius: 8 },
    { mobId: "harpy", x: 45, y: 170, count: 2, radius: 6 },
    { mobId: "troll", x: 50, y: 165, count: 2, radius: 7 },
    { mobId: "troll", x: 70, y: 170, count: 2, radius: 6 },
    { mobId: "dragon_whelp", x: 60, y: 170, count: 2, radius: 7 },
    { mobId: "mountain_lord", x: 60, y: 160, count: 1, radius: 3 },

    // Shadow Realm
    { mobId: "demon", x: 150, y: 90, count: 3, radius: 7 },
    { mobId: "demon", x: 165, y: 100, count: 2, radius: 6 },
    { mobId: "lich", x: 155, y: 95, count: 2, radius: 7 },
    { mobId: "lich", x: 170, y: 105, count: 2, radius: 6 },
    { mobId: "shadow_dragon", x: 160, y: 100, count: 2, radius: 8 },
    { mobId: "death_knight", x: 150, y: 105, count: 2, radius: 7 },
    { mobId: "death_knight", x: 170, y: 90, count: 2, radius: 6 },
    { mobId: "dark_overlord", x: 160, y: 100, count: 1, radius: 3 },

    // Volcanic Cavern
    { mobId: "flame_imp", x: 15, y: 90, count: 4, radius: 7 },
    { mobId: "flame_imp", x: 30, y: 100, count: 3, radius: 6 },
    { mobId: "magma_golem", x: 20, y: 95, count: 3, radius: 7 },
    { mobId: "magma_golem", x: 35, y: 110, count: 2, radius: 6 },
    { mobId: "fire_drake", x: 25, y: 100, count: 2, radius: 8 },
    { mobId: "fire_drake", x: 15, y: 110, count: 2, radius: 6 },
    { mobId: "obsidian_knight", x: 30, y: 90, count: 2, radius: 7 },
    { mobId: "obsidian_knight", x: 20, y: 105, count: 2, radius: 6 },
    { mobId: "infernal_guardian", x: 22, y: 100, count: 1, radius: 3 },

    // Ancient Ruins
    { mobId: "cursed_mage", x: 90, y: 52, count: 3, radius: 7 },
    { mobId: "cursed_mage", x: 105, y: 65, count: 2, radius: 6 },
    { mobId: "stone_guardian", x: 95, y: 55, count: 3, radius: 7 },
    { mobId: "stone_guardian", x: 110, y: 50, count: 2, radius: 6 },
    { mobId: "phantom", x: 100, y: 60, count: 2, radius: 8 },
    { mobId: "phantom", x: 85, y: 70, count: 2, radius: 6 },
    { mobId: "rune_knight", x: 105, y: 55, count: 2, radius: 7 },
    { mobId: "rune_knight", x: 90, y: 68, count: 2, radius: 6 },
    { mobId: "ancient_dragon", x: 100, y: 60, count: 1, radius: 3 },

    // Abyssal Depths
    { mobId: "abyss_watcher", x: 90, y: 170, count: 3, radius: 7 },
    { mobId: "abyss_watcher", x: 105, y: 180, count: 2, radius: 6 },
    { mobId: "void_serpent", x: 95, y: 175, count: 2, radius: 8 },
    { mobId: "void_serpent", x: 110, y: 170, count: 2, radius: 6 },
    { mobId: "chaos_demon", x: 100, y: 180, count: 2, radius: 7 },
    { mobId: "chaos_demon", x: 85, y: 185, count: 2, radius: 6 },
    { mobId: "nightmare", x: 95, y: 185, count: 2, radius: 7 },
    { mobId: "nightmare", x: 110, y: 175, count: 2, radius: 6 },
    { mobId: "abyss_lord", x: 100, y: 178, count: 1, radius: 3 },

    // Dragon's Sanctum
    { mobId: "elder_wyrm", x: 170, y: 170, count: 3, radius: 7 },
    { mobId: "elder_wyrm", x: 185, y: 180, count: 2, radius: 6 },
    { mobId: "celestial_guardian", x: 175, y: 175, count: 2, radius: 7 },
    { mobId: "celestial_guardian", x: 180, y: 185, count: 2, radius: 6 },
    { mobId: "void_dragon", x: 180, y: 175, count: 2, radius: 8 },
    { mobId: "void_dragon", x: 170, y: 185, count: 2, radius: 6 },
    { mobId: "dragon_emperor", x: 178, y: 178, count: 1, radius: 3 },
  ];

  // Ensure spawn points are on walkable tiles
  for (let spawn of spawns) {
    if (spawn.y >= 0 && spawn.y < H && spawn.x >= 0 && spawn.x < W) {
      if (COLLISION_TILES.includes(tiles[spawn.y][spawn.x])) {
        // Find the zone's base tile type
        let zone = zones.find(
          (z) =>
            spawn.x >= z.x &&
            spawn.x < z.x + z.width &&
            spawn.y >= z.y &&
            spawn.y < z.y + z.height,
        );
        if (zone) {
          switch (zone.id) {
            case "dark_forest":
              tiles[spawn.y][spawn.x] = TileType.DARK_GRASS;
              break;
            case "scorching_desert":
              tiles[spawn.y][spawn.x] = TileType.SAND;
              break;
            case "frozen_mountains":
              tiles[spawn.y][spawn.x] = TileType.SNOW;
              break;
            case "shadow_realm":
            case "volcanic_cavern":
            case "abyssal_depths":
            case "dragons_sanctum":
              tiles[spawn.y][spawn.x] = TileType.DARK_STONE;
              break;
            case "ancient_ruins":
              tiles[spawn.y][spawn.x] = TileType.STONE;
              break;
            default:
              tiles[spawn.y][spawn.x] = TileType.GRASS;
              break;
          }
        } else {
          tiles[spawn.y][spawn.x] = TileType.GRASS;
        }
        collisions[spawn.y][spawn.x] = false;
      }
    }
  }

  // ---- NPC placements in town ----
  let npcs: NpcPlacement[] = [
    { npcId: "guide", x: 100, y: 95 },
    { npcId: "shop_keeper", x: 90, y: 90 },
    { npcId: "weapon_master", x: 110, y: 90 },
    { npcId: "armor_smith", x: 90, y: 110 },
    { npcId: "potion_brewer", x: 110, y: 110 },
    { npcId: "jeweler", x: 95, y: 100 },
    { npcId: "elite_merchant", x: 105, y: 100 },
    { npcId: "blacksmith", x: 100, y: 105 },
    { npcId: "scroll_merchant", x: 95, y: 105 },
    { npcId: "master_crafter", x: 105, y: 105 },
  ];

  // Ensure NPC locations are walkable
  for (let npc of npcs) {
    if (npc.y >= 0 && npc.y < H && npc.x >= 0 && npc.x < W) {
      tiles[npc.y][npc.x] = TileType.FLOOR;
      collisions[npc.y][npc.x] = false;
    }
  }

  // Ensure player spawn area is walkable
  let playerSpawn = { x: 100, y: 100 };
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      let py = playerSpawn.y + dy;
      let px = playerSpawn.x + dx;
      if (py >= 0 && py < H && px >= 0 && px < W) {
        tiles[py][px] = TileType.FLOOR;
        collisions[py][px] = false;
      }
    }
  }

  return {
    width: W,
    height: H,
    tileSize: 32,
    tiles,
    collisions,
    zones,
    spawns,
    npcs,
    playerSpawn,
  };
}
