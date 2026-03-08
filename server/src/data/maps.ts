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

const MAP_W = 500;
const MAP_H = 500;

// ---- Zone Definitions (500x500 map) ----
let zones: MapZone[] = [
  {
    id: "town",
    name: "Town",
    nameKo: "마을",
    x: 230,
    y: 230,
    width: 40,
    height: 40,
    levelRange: [0, 0],
    bgColor: "#A0A0A0",
  },
  // -- Low Level Zones --
  {
    id: "starter_meadow",
    name: "Starter Meadow",
    nameKo: "시작의 초원",
    x: 50,
    y: 50,
    width: 80,
    height: 80,
    levelRange: [1, 5],
    bgColor: "#7CFC00",
  },
  {
    id: "dark_forest",
    name: "Dark Forest",
    nameKo: "어둠의 숲",
    x: 200,
    y: 30,
    width: 80,
    height: 80,
    levelRange: [5, 10],
    bgColor: "#2E4600",
  },
  // -- Mid Level Zones --
  {
    id: "scorching_desert",
    name: "Scorching Desert",
    nameKo: "타오르는 사막",
    x: 350,
    y: 50,
    width: 80,
    height: 80,
    levelRange: [10, 15],
    bgColor: "#EDC9AF",
  },
  {
    id: "frozen_mountains",
    name: "Frozen Mountains",
    nameKo: "얼어붙은 산맥",
    x: 30,
    y: 200,
    width: 80,
    height: 80,
    levelRange: [15, 20],
    bgColor: "#E0E8F0",
  },
  {
    id: "crystal_caverns",
    name: "Crystal Caverns",
    nameKo: "수정 동굴",
    x: 30,
    y: 350,
    width: 80,
    height: 80,
    levelRange: [20, 25],
    bgColor: "#4488AA",
  },
  // -- High Level Zones --
  {
    id: "shadow_realm",
    name: "Shadow Realm",
    nameKo: "그림자 영역",
    x: 350,
    y: 200,
    width: 80,
    height: 80,
    levelRange: [25, 30],
    bgColor: "#1A0A2E",
  },
  {
    id: "volcanic_cavern",
    name: "Volcanic Cavern",
    nameKo: "화산 동굴",
    x: 200,
    y: 350,
    width: 80,
    height: 80,
    levelRange: [30, 35],
    bgColor: "#4A1500",
  },
  {
    id: "ancient_ruins",
    name: "Ancient Ruins",
    nameKo: "고대 유적",
    x: 350,
    y: 350,
    width: 80,
    height: 80,
    levelRange: [35, 40],
    bgColor: "#4A3B2A",
  },
  // -- End Game Zones --
  {
    id: "abyssal_depths",
    name: "Abyssal Depths",
    nameKo: "심연의 깊이",
    x: 180,
    y: 430,
    width: 80,
    height: 60,
    levelRange: [40, 45],
    bgColor: "#0A001A",
  },
  {
    id: "dragons_sanctum",
    name: "Dragon's Sanctum",
    nameKo: "드래곤의 성소",
    x: 350,
    y: 430,
    width: 80,
    height: 60,
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
      if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
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
      if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H && dist <= radius) {
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
        if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
          tiles[ty][tx] = TileType.WATER;
        }
      }
    }
  }
}

function fillZone(
  tiles: number[][],
  x: number,
  y: number,
  w: number,
  h: number,
  tileType: number,
) {
  for (let ty = y; ty < y + h; ty++) {
    for (let tx = x; tx < x + w; tx++) {
      if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
        tiles[ty][tx] = tileType;
      }
    }
  }
}

function scatterTile(
  tiles: number[][],
  rng: () => number,
  x: number,
  y: number,
  w: number,
  h: number,
  tileType: number,
  density: number,
) {
  for (let ty = y; ty < y + h; ty++) {
    for (let tx = x; tx < x + w; tx++) {
      if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
        if (rng() < density) {
          tiles[ty][tx] = tileType;
        }
      }
    }
  }
}

// ---- Main generation function ----
export function generateMap(): MapData {
  let rng = createRng(42);
  let W = MAP_W;
  let H = MAP_H;

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
  fillZone(tiles, 230, 230, 40, 40, TileType.FLOOR);
  // Town walls (border)
  for (let x = 230; x < 270; x++) {
    tiles[230][x] = TileType.WALL;
    tiles[269][x] = TileType.WALL;
  }
  for (let y = 230; y < 270; y++) {
    tiles[y][230] = TileType.WALL;
    tiles[y][269] = TileType.WALL;
  }
  // Town entrances (gaps in walls) - 4 directions
  for (let x = 247; x <= 253; x++) {
    tiles[230][x] = TileType.FLOOR;
    tiles[269][x] = TileType.FLOOR;
  }
  for (let y = 247; y <= 253; y++) {
    tiles[y][230] = TileType.FLOOR;
    tiles[y][269] = TileType.FLOOR;
  }

  // Starter Meadow (50,50, 80x80): bright grass with sparse trees
  placeTrees(tiles, rng, 50, 50, 80, 80, 0.03);

  // Dark Forest (200,30, 80x80): dark grass + dense trees
  fillZone(tiles, 200, 30, 80, 80, TileType.DARK_GRASS);
  placeTrees(tiles, rng, 200, 30, 80, 80, 0.12);

  // Scorching Desert (350,50, 80x80): sand
  fillZone(tiles, 350, 50, 80, 80, TileType.SAND);

  // Frozen Mountains (30,200, 80x80): snow and ice
  for (let ty = 200; ty < 280; ty++) {
    for (let tx = 30; tx < 110; tx++) {
      if (tx < MAP_W && ty < MAP_H) {
        tiles[ty][tx] = rng() < 0.3 ? TileType.ICE : TileType.SNOW;
      }
    }
  }
  scatterTile(tiles, rng, 30, 200, 80, 80, TileType.WALL, 0.04);

  // Crystal Caverns (30,350, 80x80): dark stone with ice/crystal feel
  fillZone(tiles, 30, 350, 80, 80, TileType.DARK_STONE);
  scatterTile(tiles, rng, 30, 350, 80, 80, TileType.ICE, 0.08);
  scatterTile(tiles, rng, 30, 350, 80, 80, TileType.WALL, 0.03);

  // Shadow Realm (350,200, 80x80): dark stone
  fillZone(tiles, 350, 200, 80, 80, TileType.DARK_STONE);
  scatterTile(tiles, rng, 350, 200, 80, 80, TileType.LAVA, 0.03);

  // Volcanic Cavern (200,350, 80x80): dark stone + lava
  fillZone(tiles, 200, 350, 80, 80, TileType.DARK_STONE);
  scatterTile(tiles, rng, 200, 350, 80, 80, TileType.LAVA, 0.06);
  scatterTile(tiles, rng, 200, 350, 80, 80, TileType.WALL, 0.03);

  // Ancient Ruins (350,350, 80x80): stone floor with walls scattered
  fillZone(tiles, 350, 350, 80, 80, TileType.STONE);
  scatterTile(tiles, rng, 350, 350, 80, 80, TileType.WALL, 0.05);
  scatterTile(tiles, rng, 350, 350, 80, 80, TileType.DARK_STONE, 0.03);

  // Abyssal Depths (180,430, 80x60): dark stone and swamp
  for (let ty = 430; ty < 490; ty++) {
    for (let tx = 180; tx < 260; tx++) {
      if (tx < MAP_W && ty < MAP_H) {
        tiles[ty][tx] = rng() < 0.25 ? TileType.SWAMP : TileType.DARK_STONE;
      }
    }
  }
  scatterTile(tiles, rng, 180, 430, 80, 60, TileType.LAVA, 0.02);

  // Dragon's Sanctum (350,430, 80x60): lava and dark stone fortress
  fillZone(tiles, 350, 430, 80, 60, TileType.DARK_STONE);
  scatterTile(tiles, rng, 350, 430, 80, 60, TileType.LAVA, 0.08);
  scatterTile(tiles, rng, 350, 430, 80, 60, TileType.WALL, 0.03);

  // ---- Water features ----
  // Lake near town west
  placeWaterFeature(tiles, 225, 250, 4);
  // Lake near town east
  placeWaterFeature(tiles, 275, 250, 3);
  // Pond in starter meadow
  placeWaterFeature(tiles, 80, 85, 3);
  placeWaterFeature(tiles, 100, 100, 2);
  // River from frozen mountains area south
  placeRiver(tiles, 70, 285, 70, 340, 1);
  // Oasis in desert
  placeWaterFeature(tiles, 400, 100, 3);
  // Lake between dark forest and desert
  placeWaterFeature(tiles, 340, 70, 4);
  // Pond near abyssal depths
  placeWaterFeature(tiles, 210, 425, 2);

  // ---- Zone border trees/barriers ----
  // Starter meadow edges
  placeTrees(tiles, rng, 45, 45, 5, 90, 0.5);
  placeTrees(tiles, rng, 45, 45, 90, 5, 0.5);
  placeTrees(tiles, rng, 130, 45, 5, 90, 0.5);
  placeTrees(tiles, rng, 45, 130, 90, 5, 0.5);
  // Dark forest edges
  placeTrees(tiles, rng, 195, 25, 5, 90, 0.5);
  placeTrees(tiles, rng, 195, 25, 90, 5, 0.5);
  placeTrees(tiles, rng, 280, 25, 5, 90, 0.5);

  // ---- Outer border walls ----
  for (let x = 0; x < W; x++) {
    tiles[0][x] = TileType.WALL;
    tiles[H - 1][x] = TileType.WALL;
  }
  for (let y = 0; y < H; y++) {
    tiles[y][0] = TileType.WALL;
    tiles[y][W - 1] = TileType.WALL;
  }

  // ---- Build collision map ----
  let collisions: boolean[][] = [];
  for (let y = 0; y < H; y++) {
    collisions[y] = [];
    for (let x = 0; x < W; x++) {
      collisions[y][x] = COLLISION_TILES.includes(tiles[y][x]);
    }
  }

  // ---- Spawn points (Lineage-style dense hunting grounds) ----
  let spawns: SpawnPoint[] = [
    // ====== Starter Meadow (50,50 80x80) ======
    // Sub-area 1: Meadow Path (sparse, newbie)
    { mobId: "slime", x: 65, y: 60, count: 5, radius: 8 },
    { mobId: "slime", x: 80, y: 65, count: 4, radius: 7 },
    { mobId: "rat", x: 70, y: 70, count: 4, radius: 8 },
    { mobId: "rat", x: 85, y: 60, count: 3, radius: 6 },
    // Sub-area 2: Dense Grasslands (grinding spot)
    { mobId: "slime", x: 75, y: 90, count: 6, radius: 8 },
    { mobId: "rat", x: 85, y: 95, count: 6, radius: 8 },
    { mobId: "bee", x: 95, y: 88, count: 5, radius: 7 },
    { mobId: "bee", x: 65, y: 95, count: 5, radius: 7 },
    { mobId: "spider", x: 80, y: 98, count: 5, radius: 8 },
    { mobId: "spider", x: 100, y: 92, count: 4, radius: 7 },
    // Sub-area 3: Wolf Den (tougher, fast respawn)
    { mobId: "wolf", x: 100, y: 110, count: 6, radius: 8 },
    { mobId: "wolf", x: 115, y: 105, count: 5, radius: 7 },
    { mobId: "spider", x: 110, y: 115, count: 4, radius: 7 },
    { mobId: "wolf", x: 90, y: 118, count: 4, radius: 8 },
    // Mini-boss + Boss
    { mobId: "giant_slime", x: 85, y: 82, count: 1, radius: 5 },
    { mobId: "slime_king", x: 75, y: 115, count: 1, radius: 3 },

    // ====== Dark Forest (200,30 80x80) ======
    // Sub-area 1: Forest Edge (sparse)
    { mobId: "goblin", x: 215, y: 45, count: 5, radius: 8 },
    { mobId: "goblin", x: 230, y: 50, count: 4, radius: 7 },
    { mobId: "skeleton", x: 220, y: 55, count: 4, radius: 8 },
    { mobId: "forest_snake", x: 210, y: 50, count: 3, radius: 7 },
    // Sub-area 2: Deep Woods (dense grinding)
    { mobId: "skeleton", x: 240, y: 65, count: 6, radius: 8 },
    { mobId: "orc", x: 250, y: 70, count: 6, radius: 8 },
    { mobId: "goblin", x: 235, y: 75, count: 5, radius: 7 },
    { mobId: "orc", x: 260, y: 65, count: 5, radius: 7 },
    { mobId: "skeleton", x: 245, y: 80, count: 5, radius: 8 },
    { mobId: "forest_snake", x: 255, y: 78, count: 4, radius: 7 },
    // Sub-area 3: Ancient Grove (treants, boss)
    { mobId: "treant", x: 225, y: 90, count: 5, radius: 8 },
    { mobId: "treant", x: 240, y: 95, count: 4, radius: 7 },
    { mobId: "forest_snake", x: 250, y: 92, count: 4, radius: 7 },
    { mobId: "orc", x: 235, y: 98, count: 3, radius: 7 },
    // Mini-boss + Boss
    { mobId: "orc_warlord", x: 255, y: 85, count: 1, radius: 5 },
    { mobId: "goblin_chief", x: 230, y: 95, count: 1, radius: 3 },

    // ====== Scorching Desert (350,50 80x80) ======
    // Sub-area 1: Desert Outskirts (sparse)
    { mobId: "scorpion", x: 365, y: 65, count: 5, radius: 8 },
    { mobId: "scorpion", x: 380, y: 60, count: 4, radius: 7 },
    { mobId: "desert_hawk", x: 370, y: 70, count: 3, radius: 8 },
    { mobId: "bandit", x: 390, y: 65, count: 3, radius: 7 },
    // Sub-area 2: Sand Dunes (dense grinding)
    { mobId: "bandit", x: 385, y: 85, count: 6, radius: 8 },
    { mobId: "mummy", x: 395, y: 90, count: 6, radius: 8 },
    { mobId: "scorpion", x: 400, y: 80, count: 5, radius: 7 },
    { mobId: "sand_worm", x: 390, y: 95, count: 5, radius: 7 },
    { mobId: "mummy", x: 380, y: 92, count: 5, radius: 8 },
    { mobId: "bandit", x: 405, y: 88, count: 4, radius: 7 },
    // Sub-area 3: Oasis Ruins (boss)
    { mobId: "sand_worm", x: 410, y: 110, count: 4, radius: 8 },
    { mobId: "desert_hawk", x: 400, y: 115, count: 4, radius: 7 },
    { mobId: "mummy", x: 415, y: 105, count: 3, radius: 7 },
    // Mini-boss + Boss
    { mobId: "sand_king", x: 395, y: 100, count: 1, radius: 5 },
    { mobId: "desert_emperor", x: 410, y: 112, count: 1, radius: 3 },

    // ====== Frozen Mountains (30,200 80x80) ======
    // Sub-area 1: Frozen Trail (sparse)
    { mobId: "ice_golem", x: 50, y: 215, count: 4, radius: 8 },
    { mobId: "ice_golem", x: 65, y: 210, count: 3, radius: 7 },
    { mobId: "dark_knight", x: 55, y: 220, count: 3, radius: 8 },
    { mobId: "harpy", x: 70, y: 215, count: 3, radius: 7 },
    // Sub-area 2: Blizzard Peak (dense grinding)
    { mobId: "dark_knight", x: 60, y: 240, count: 6, radius: 8 },
    { mobId: "harpy", x: 75, y: 245, count: 5, radius: 8 },
    { mobId: "troll", x: 50, y: 250, count: 5, radius: 7 },
    { mobId: "dark_knight", x: 85, y: 240, count: 5, radius: 7 },
    { mobId: "ice_golem", x: 70, y: 252, count: 5, radius: 8 },
    { mobId: "harpy", x: 55, y: 248, count: 4, radius: 7 },
    // Sub-area 3: Dragon Nest
    { mobId: "dragon_whelp", x: 65, y: 265, count: 5, radius: 8 },
    { mobId: "dragon_whelp", x: 80, y: 268, count: 4, radius: 7 },
    { mobId: "troll", x: 55, y: 270, count: 3, radius: 7 },
    // Mini-boss + Boss
    { mobId: "frost_titan", x: 75, y: 255, count: 1, radius: 5 },
    { mobId: "mountain_lord", x: 70, y: 270, count: 1, radius: 3 },

    // ====== Crystal Caverns (30,350 80x80) ======
    // Sub-area 1: Crystal Entrance (sparse)
    { mobId: "crystal_spider", x: 50, y: 365, count: 5, radius: 8 },
    { mobId: "crystal_bat", x: 65, y: 360, count: 4, radius: 7 },
    { mobId: "crystal_spider", x: 45, y: 370, count: 4, radius: 8 },
    { mobId: "crystal_bat", x: 70, y: 365, count: 3, radius: 7 },
    // Sub-area 2: Gem Corridors (dense grinding)
    { mobId: "gem_golem", x: 60, y: 390, count: 6, radius: 8 },
    { mobId: "gem_golem", x: 75, y: 395, count: 6, radius: 8 },
    { mobId: "crystal_spider", x: 50, y: 393, count: 5, radius: 7 },
    { mobId: "crystal_bat", x: 85, y: 388, count: 5, radius: 7 },
    { mobId: "crystal_guardian", x: 65, y: 398, count: 4, radius: 8 },
    { mobId: "gem_golem", x: 90, y: 392, count: 4, radius: 7 },
    // Sub-area 3: Crystal Heart (boss chamber)
    { mobId: "crystal_guardian", x: 70, y: 415, count: 5, radius: 8 },
    { mobId: "crystal_guardian", x: 55, y: 418, count: 4, radius: 7 },
    { mobId: "crystal_bat", x: 80, y: 412, count: 3, radius: 7 },
    // Mini-boss + Boss
    { mobId: "crystal_elemental", x: 75, y: 400, count: 1, radius: 5 },
    { mobId: "crystal_queen", x: 65, y: 420, count: 1, radius: 3 },

    // ====== Shadow Realm (350,200 80x80) ======
    // Sub-area 1: Shadow Gate (sparse)
    { mobId: "demon", x: 365, y: 215, count: 4, radius: 8 },
    { mobId: "demon", x: 380, y: 210, count: 3, radius: 7 },
    { mobId: "lich", x: 370, y: 220, count: 3, radius: 8 },
    { mobId: "death_knight", x: 385, y: 215, count: 3, radius: 7 },
    // Sub-area 2: Cursed Battlefield (dense grinding)
    { mobId: "death_knight", x: 375, y: 240, count: 6, radius: 8 },
    { mobId: "lich", x: 390, y: 245, count: 5, radius: 8 },
    { mobId: "demon", x: 380, y: 250, count: 5, radius: 7 },
    { mobId: "shadow_dragon", x: 400, y: 240, count: 4, radius: 7 },
    { mobId: "death_knight", x: 395, y: 248, count: 5, radius: 8 },
    { mobId: "lich", x: 370, y: 252, count: 4, radius: 7 },
    // Sub-area 3: Dark Throne (boss)
    { mobId: "shadow_dragon", x: 385, y: 265, count: 4, radius: 8 },
    { mobId: "death_knight", x: 400, y: 268, count: 4, radius: 7 },
    { mobId: "shadow_dragon", x: 375, y: 270, count: 3, radius: 7 },
    // Mini-boss + Boss
    { mobId: "shadow_champion", x: 390, y: 255, count: 1, radius: 5 },
    { mobId: "dark_overlord", x: 390, y: 270, count: 1, radius: 3 },

    // ====== Volcanic Cavern (200,350 80x80) ======
    // Sub-area 1: Lava Tunnels (sparse)
    { mobId: "flame_imp", x: 215, y: 365, count: 5, radius: 8 },
    { mobId: "flame_imp", x: 230, y: 360, count: 4, radius: 7 },
    { mobId: "magma_golem", x: 220, y: 370, count: 3, radius: 8 },
    { mobId: "flame_imp", x: 240, y: 365, count: 3, radius: 7 },
    // Sub-area 2: Magma Chamber (dense grinding)
    { mobId: "magma_golem", x: 230, y: 390, count: 6, radius: 8 },
    { mobId: "fire_drake", x: 245, y: 395, count: 5, radius: 8 },
    { mobId: "flame_imp", x: 220, y: 393, count: 5, radius: 7 },
    { mobId: "obsidian_knight", x: 255, y: 388, count: 4, radius: 7 },
    { mobId: "magma_golem", x: 240, y: 398, count: 5, radius: 8 },
    { mobId: "fire_drake", x: 225, y: 395, count: 4, radius: 7 },
    // Sub-area 3: Inferno Core (boss)
    { mobId: "obsidian_knight", x: 235, y: 415, count: 4, radius: 8 },
    { mobId: "fire_drake", x: 250, y: 418, count: 4, radius: 7 },
    { mobId: "obsidian_knight", x: 220, y: 412, count: 3, radius: 7 },
    // Mini-boss + Boss
    { mobId: "lava_wyrm", x: 245, y: 400, count: 1, radius: 5 },
    { mobId: "infernal_guardian", x: 240, y: 420, count: 1, radius: 3 },

    // ====== Ancient Ruins (350,350 80x80) ======
    // Sub-area 1: Ruined Library (sparse)
    { mobId: "cursed_mage", x: 365, y: 365, count: 5, radius: 8 },
    { mobId: "cursed_mage", x: 380, y: 360, count: 4, radius: 7 },
    { mobId: "phantom", x: 370, y: 370, count: 3, radius: 8 },
    { mobId: "rune_knight", x: 385, y: 365, count: 3, radius: 7 },
    // Sub-area 2: Collapsed Hall (dense grinding)
    { mobId: "stone_guardian", x: 375, y: 390, count: 6, radius: 8 },
    { mobId: "rune_knight", x: 390, y: 395, count: 5, radius: 8 },
    { mobId: "cursed_mage", x: 380, y: 393, count: 5, radius: 7 },
    { mobId: "phantom", x: 400, y: 388, count: 4, radius: 7 },
    { mobId: "stone_guardian", x: 395, y: 398, count: 5, radius: 8 },
    { mobId: "rune_knight", x: 370, y: 395, count: 4, radius: 7 },
    // Sub-area 3: Sealed Chamber (boss)
    { mobId: "phantom", x: 385, y: 415, count: 4, radius: 8 },
    { mobId: "rune_knight", x: 400, y: 418, count: 4, radius: 7 },
    { mobId: "stone_guardian", x: 375, y: 420, count: 3, radius: 7 },
    // Mini-boss + Boss
    { mobId: "ancient_sentinel", x: 390, y: 405, count: 1, radius: 5 },
    { mobId: "ancient_dragon", x: 390, y: 420, count: 1, radius: 3 },

    // ====== Abyssal Depths (180,430 80x60) ======
    // Sub-area 1: Abyss Entrance
    { mobId: "abyss_watcher", x: 195, y: 442, count: 4, radius: 8 },
    { mobId: "abyss_watcher", x: 210, y: 438, count: 4, radius: 7 },
    { mobId: "void_serpent", x: 200, y: 445, count: 3, radius: 8 },
    // Sub-area 2: Void Rift (dense)
    { mobId: "void_serpent", x: 220, y: 458, count: 5, radius: 8 },
    { mobId: "chaos_demon", x: 235, y: 462, count: 5, radius: 8 },
    { mobId: "nightmare", x: 225, y: 465, count: 4, radius: 7 },
    { mobId: "abyss_watcher", x: 240, y: 455, count: 4, radius: 7 },
    { mobId: "chaos_demon", x: 215, y: 460, count: 4, radius: 8 },
    { mobId: "void_serpent", x: 245, y: 460, count: 4, radius: 7 },
    // Sub-area 3: Abyss Throne (boss)
    { mobId: "nightmare", x: 230, y: 478, count: 4, radius: 8 },
    { mobId: "chaos_demon", x: 220, y: 475, count: 3, radius: 7 },
    { mobId: "nightmare", x: 240, y: 480, count: 3, radius: 7 },
    // Mini-boss + Boss
    { mobId: "abyssal_behemoth", x: 230, y: 468, count: 1, radius: 5 },
    { mobId: "abyss_lord", x: 230, y: 482, count: 1, radius: 3 },

    // ====== Dragon's Sanctum (350,430 80x60) ======
    // Sub-area 1: Wyrm's Path
    { mobId: "elder_wyrm", x: 365, y: 442, count: 4, radius: 8 },
    { mobId: "elder_wyrm", x: 380, y: 438, count: 4, radius: 7 },
    { mobId: "celestial_guardian", x: 375, y: 445, count: 3, radius: 8 },
    // Sub-area 2: Celestial Garden (dense)
    { mobId: "celestial_guardian", x: 390, y: 458, count: 5, radius: 8 },
    { mobId: "void_dragon", x: 405, y: 462, count: 4, radius: 8 },
    { mobId: "elder_wyrm", x: 395, y: 465, count: 4, radius: 7 },
    { mobId: "celestial_guardian", x: 410, y: 455, count: 4, radius: 7 },
    { mobId: "void_dragon", x: 385, y: 460, count: 4, radius: 8 },
    { mobId: "elder_wyrm", x: 400, y: 460, count: 3, radius: 7 },
    // Sub-area 3: Dragon Emperor's Lair (boss)
    { mobId: "void_dragon", x: 400, y: 478, count: 3, radius: 8 },
    { mobId: "celestial_guardian", x: 390, y: 475, count: 3, radius: 7 },
    { mobId: "void_dragon", x: 410, y: 480, count: 3, radius: 7 },
    // Mini-boss + Boss
    { mobId: "ancient_phoenix", x: 400, y: 468, count: 1, radius: 5 },
    { mobId: "dragon_emperor", x: 400, y: 482, count: 1, radius: 3 },
  ];

  // Ensure spawn points are on walkable tiles
  for (let spawn of spawns) {
    if (spawn.y >= 0 && spawn.y < H && spawn.x >= 0 && spawn.x < W) {
      if (COLLISION_TILES.includes(tiles[spawn.y][spawn.x])) {
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
            case "crystal_caverns":
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
    { npcId: "guide", x: 250, y: 245 },
    { npcId: "shop_keeper", x: 240, y: 240 },
    { npcId: "weapon_master", x: 260, y: 240 },
    { npcId: "armor_smith", x: 240, y: 260 },
    { npcId: "potion_brewer", x: 260, y: 260 },
    { npcId: "jeweler", x: 245, y: 250 },
    { npcId: "elite_merchant", x: 255, y: 250 },
    { npcId: "blacksmith", x: 250, y: 255 },
    { npcId: "scroll_merchant", x: 245, y: 255 },
    { npcId: "master_crafter", x: 255, y: 255 },
  ];

  // Ensure NPC locations are walkable
  for (let npc of npcs) {
    if (npc.y >= 0 && npc.y < H && npc.x >= 0 && npc.x < W) {
      tiles[npc.y][npc.x] = TileType.FLOOR;
      collisions[npc.y][npc.x] = false;
    }
  }

  // Ensure player spawn area is walkable (center of town)
  let playerSpawn = { x: 250, y: 250 };
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
