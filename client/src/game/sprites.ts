// ============================================
// VocaQuest Online - Premium Pixel Art Sprite Generator v3
// 32x44 player sprites, HD mob sprites, rich tiles
// 3-tone shading, detailed weapons/gear, unique silhouettes
// ============================================

import Phaser from "phaser";

const PX = 1; // Each art pixel = 1x1 screen pixel (HD mode)

// ---- Helper: render pixel art string array to a Phaser CanvasTexture ----
function renderPixelArt(
  scene: Phaser.Scene,
  key: string,
  art: string[],
  palette: Record<string, string>,
): void {
  const h = art.length;
  const w = Math.max(...art.map((r) => r.length));
  if (scene.textures.exists(key)) return;
  const ct = scene.textures.createCanvas(key, w * PX, h * PX);
  if (!ct) return;
  const ctx = ct.getContext();
  for (let y = 0; y < h; y++) {
    const row = art[y];
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === "." || c === " ") continue;
      const color = palette[c];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * PX, y * PX, PX, PX);
    }
  }
  ct.refresh();
}

// ---- Helper: render pixel art with outline for better visibility ----
function renderWithOutline(
  scene: Phaser.Scene,
  key: string,
  art: string[],
  palette: Record<string, string>,
): void {
  const h = art.length;
  const w = Math.max(...art.map((r) => r.length));
  if (scene.textures.exists(key)) return;
  const ct = scene.textures.createCanvas(key, (w + 2) * PX, (h + 2) * PX);
  if (!ct) return;
  const ctx = ct.getContext();

  // Draw 1px black outline
  const offX = 1;
  const offY = 1;
  for (let y = 0; y < h; y++) {
    const row = art[y];
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === "." || c === " ") continue;
      if (!palette[c]) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ny = y + dy;
          const nx = x + dx;
          const nc =
            ny >= 0 && ny < h && nx >= 0 && nx < art[ny].length
              ? art[ny][nx]
              : ".";
          if (nc === "." || nc === " " || !palette[nc]) {
            ctx.fillStyle = "#111111";
            ctx.fillRect((x + offX + dx) * PX, (y + offY + dy) * PX, PX, PX);
          }
        }
      }
    }
  }

  // Draw actual pixels on top
  for (let y = 0; y < h; y++) {
    const row = art[y];
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === "." || c === " ") continue;
      const color = palette[c];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect((x + offX) * PX, (y + offY) * PX, PX, PX);
    }
  }
  ct.refresh();
}

// ================================================================
// PLAYER SPRITES (32x44 pixel art, PX=1 for HD detail)
// Chibi RPG proportions: large head (1/3), defined torso, short legs
// 3-tone shading: highlight, mid, shadow per color area
// ================================================================

// ---- WARRIOR: Red/crimson plate, broadsword, cape, gold trim ----
const WARRIOR_PALETTE: Record<string, string> = {
  // Hair (brown)
  h: "#8B5E3C",
  H: "#6B4428",
  J: "#A87650",
  // Skin
  s: "#FFD5B4",
  S: "#E8B898",
  T: "#D4A480",
  // Eyes/mouth
  e: "#1a1a1a",
  E: "#FFFFFF",
  m: "#C47A6A",
  // Armor (crimson, 3-tone)
  a: "#DD3838",
  A: "#B81E1E",
  R: "#8E1010",
  // Gold trim
  g: "#FFD700",
  G: "#DAA520",
  Y: "#B8860B",
  // Cape
  c: "#BB2222",
  C: "#881515",
  K: "#661010",
  // Boots/pants
  b: "#5C3A1E",
  B: "#3A2210",
  p: "#4A3728",
  P: "#382818",
  Q: "#2A1A10",
  // Weapon (silver sword)
  w: "#E8E8EC",
  W: "#B8B8C0",
  v: "#888890",
  // Sword guard
  u: "#DAA520",
  U: "#B8860B",
};
const WARRIOR_ART = [
  "................................",
  "..........JJhhhhJJ..............",
  ".........JhhhhhhhJ..............",
  "........JhhhJJhhhJ.............",
  "........HhhhhhhhhhH............",
  "........HHhJhhJhHH.............",
  ".......HHhhhhhhhhHH............",
  "........ssssssssss..............",
  "........sEe.sEess...............",
  "........sSSmSSsss...............",
  ".........sTTTTss................",
  "..........ssss..................",
  ".........ggaagg.................",
  "........GaaaaaaGw...............",
  ".......RAAaaaaAAWw..............",
  "......cRAaaaaAAaWw..............",
  "......cRAAaaaAAAWw..............",
  ".....CCSAaggaAAAvw..............",
  ".....KCSAaaaaAAAuU..............",
  "......CRAAaaaAAA................",
  ".......RAAaaaAA.................",
  "........AaaaaAA.................",
  "........ggaaaaagg...............",
  "........RAAAAaAR................",
  ".........AAAAAA.................",
  ".........pppppppp...............",
  ".........pp....pp...............",
  ".........pp....pp...............",
  ".........pp....pp...............",
  ".........pP....pP...............",
  ".........pQ....pQ...............",
  "........bBB...bBB...............",
  "........BBB...BBB...............",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

// ---- KNIGHT: Royal blue plate, gold accents, shield+lance, helmet ----
const KNIGHT_PALETTE: Record<string, string> = {
  // Helmet (silver)
  h: "#C8C8D0",
  H: "#A0A0AA",
  J: "#787880",
  // Visor slit
  e: "#1a1a1a",
  E: "#333340",
  // Skin (visible chin)
  s: "#FFD5B4",
  S: "#E8B898",
  // Armor (royal blue, 3-tone)
  a: "#4A7AE8",
  A: "#3060CC",
  R: "#1E48AA",
  // Gold accents
  g: "#FFD700",
  G: "#DAA520",
  Y: "#B8860B",
  // Shield (blue+gold)
  d: "#3A6AD0",
  D: "#2850A8",
  F: "#1E3888",
  // Lance/spear
  w: "#C8C8D0",
  W: "#A0A0AA",
  v: "#787880",
  // Cape (blue)
  c: "#4060BB",
  C: "#304888",
  K: "#203468",
  // Boots/pants
  b: "#4A4A5A",
  B: "#333340",
  p: "#3A3A4A",
  P: "#2A2A38",
  Q: "#1E1E28",
  // Plume
  t: "#DD3838",
  T: "#BB2020",
  m: "#C47A6A",
};
const KNIGHT_ART = [
  "................................",
  "...........tTT..................",
  "..........thhhT.................",
  ".........JhhhhhJ................",
  "........JHhhhhhHJ...............",
  "........HHhhhhhHH...............",
  "........HHeeeEeHH...............",
  ".........HhhhhhH................",
  "..........ssss..................",
  "..........sSms..................",
  "...........ss...................",
  "..........gaag..................",
  ".........GaaaaGw................",
  "........RAAaaaAWw...............",
  "......dDRAAaaaAAWw..............",
  ".....dDDRAAAAaAAWw..............",
  "....dDDFRAAgaAAAWw..............",
  "....dDgFRAAaaAAAvw..............",
  "....dDDFRAAAAAAAAAv..............",
  ".....DDFRAAAAaAA................",
  "......DRAAaaaAA.................",
  ".........AaaaAA.................",
  ".........ggaagg.................",
  ".........RAAAAR.................",
  "..........AAAA..................",
  ".........pppppppp...............",
  ".........pp....pp...............",
  ".........pp....pp...............",
  ".........pp....pp...............",
  ".........pP....pP...............",
  ".........pQ....pQ...............",
  "........bBB...bBB...............",
  "........BBB...BBB...............",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

// ---- MAGE: Purple robes, pointed hat with stars, glowing staff ----
const MAGE_PALETTE: Record<string, string> = {
  // Hair (silver/white)
  h: "#D8D8E0",
  H: "#B0B0BB",
  J: "#E8E8F0",
  // Skin
  s: "#FFD5B4",
  S: "#E8B898",
  T: "#D4A480",
  // Eyes/mouth
  e: "#1a1a1a",
  E: "#FFFFFF",
  m: "#C47A6A",
  // Hat (deep purple, 3-tone)
  t: "#6A3AAA",
  O: "#5028A0",
  V: "#3A1880",
  // Hat stars/decoration
  k: "#FFE066",
  K: "#FFD700",
  // Robes (purple, 3-tone)
  a: "#8B5CC8",
  A: "#6E42A8",
  R: "#5A3090",
  // Gold arcane trim
  g: "#FFD700",
  G: "#DAA520",
  Y: "#B8860B",
  // Staff (wood)
  w: "#8B6940",
  W: "#6B4A28",
  // Staff crystal orb
  c: "#66DDFF",
  C: "#44BBEE",
  q: "#AAEEFF",
  // Boots
  b: "#5A3A9A",
  B: "#3A2270",
  p: "#6A48AA",
  P: "#5A3A9A",
  Q: "#4A2A88",
};
const MAGE_ART = [
  "................................",
  "............kV..................",
  "...........VVV..................",
  "..........VVVVV.................",
  ".........VVOVVVV................",
  "........VOOkOOVV................",
  ".......VVOOOOOOVk...............",
  ".......tOOOtOOOt................",
  ".......hhJHhHhHh................",
  ".......JhhJhhhhJ................",
  "........ssssssss................",
  "........sEe.sEes................",
  "........sSSmSSss................",
  ".........sTTTTs..................",
  "..........ssss..................",
  "..........gaag..................",
  ".........GaaaaGw................",
  "........RAaaaaaWw...............",
  ".......SRAAaaAAAWc..............",
  ".......SRAAaaAAAWC..............",
  "........RAgaaaAAWq..............",
  "........RAAaaAAAW...............",
  ".........AAaaAA.................",
  ".........ggaagg.................",
  ".........RAAAAR.................",
  "........RRAAAARR................",
  "........RRp..pRR................",
  ".........pp..pp.................",
  ".........pp..pp.................",
  ".........pp..pp.................",
  ".........pP..pP.................",
  "........bBB..bBB................",
  "........BBB..BBB................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

// ---- ARCHER: Forest green leather, hood, longbow, quiver ----
const ARCHER_PALETTE: Record<string, string> = {
  // Hood/hair (brown-green)
  h: "#5A7A38",
  H: "#4A6A28",
  J: "#3A5A1A",
  // Skin
  s: "#FFD5B4",
  S: "#E8B898",
  T: "#D4A480",
  // Eyes/mouth
  e: "#1a1a1a",
  E: "#FFFFFF",
  m: "#C47A6A",
  // Leather armor (green, 3-tone)
  a: "#5AAA55",
  A: "#3D8A3A",
  R: "#2A6A28",
  // Leather details (brown)
  g: "#8B6914",
  G: "#6B5010",
  Y: "#B8860B",
  // Cloak (brown-green)
  c: "#5A7040",
  C: "#4A5A30",
  K: "#3A4A22",
  // Bow (wood)
  w: "#8B5E3C",
  W: "#6B4428",
  // Bowstring
  v: "#C8C8C8",
  // Quiver + arrows
  q: "#8B5E3C",
  Q: "#6B4428",
  r: "#C0C0C0",
  // Boots/pants
  b: "#5C3A1E",
  B: "#3A2210",
  p: "#4A6A28",
  P: "#3A5A18",
  Z: "#2A4A10",
};
const ARCHER_ART = [
  "................................",
  ".........JJJJJJJ...............",
  "........JHhhhhhHJ..............",
  ".......JHhhhhhhHHJ.............",
  ".......JHhhhhhhhHJ.............",
  "........HHhhhhhHH..............",
  "........HHhhJhhHH..............",
  "........ssssssssss..............",
  "........sEe.sEess...............",
  "........sSSmSSsss...............",
  ".........sTTTTss................",
  "..........ssss..................",
  ".........ggaagg.................",
  "........GaaaaagGqr..............",
  ".......RAAaaaaAAqr..............",
  "....Wv.RAAaaaaAAqr..............",
  "....Wv.RAAAAaAAAq...............",
  "...Wv.CRAgaaAAA.................",
  "...Wv.CRAAaaAAA.................",
  "....WvCRAAAAaAA.................",
  ".....WRAAAAAAA..................",
  "........AaaaAA..................",
  "........ggaagg..................",
  "........RAAAAR..................",
  ".........AAAA...................",
  ".........pppppppp...............",
  ".........pp....pp...............",
  ".........pp....pp...............",
  ".........pp....pp...............",
  ".........pP....pP...............",
  ".........pZ....pZ...............",
  "........bBB...bBB...............",
  "........BBB...BBB...............",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

// Walk frame generators for 32x44 sprites
function makeWalkFrame1_32(base: string[]): string[] {
  const walk = [...base];
  // Legs spread: left forward, right back
  walk[25] = "........pppppppp...............";
  walk[26] = ".......pp......pp..............";
  walk[27] = ".......pp......pp..............";
  walk[28] = ".......pp......pp..............";
  walk[29] = ".......pP......pP..............";
  walk[30] = ".......pQ......pQ..............";
  walk[31] = "......bBB.....bBB..............";
  walk[32] = "......BBB.....BBB..............";
  return walk;
}

function makeWalkFrame2_32(base: string[]): string[] {
  const walk = [...base];
  // Legs closer together
  walk[25] = "..........pppppp...............";
  walk[26] = "..........pp..pp...............";
  walk[27] = "..........pp..pp...............";
  walk[28] = "..........pp..pp...............";
  walk[29] = "..........pP..pP...............";
  walk[30] = "..........pQ..pQ...............";
  walk[31] = ".........bBB.bBB...............";
  walk[32] = ".........BBB.BBB...............";
  return walk;
}

// Knight walk needs Q -> Q mapping fix
function makeKnightWalk1(base: string[]): string[] {
  const walk = [...base];
  walk[25] = "........pppppppp...............";
  walk[26] = ".......pp......pp..............";
  walk[27] = ".......pp......pp..............";
  walk[28] = ".......pp......pp..............";
  walk[29] = ".......pP......pP..............";
  walk[30] = ".......pQ......pQ..............";
  walk[31] = "......bBB.....bBB..............";
  walk[32] = "......BBB.....BBB..............";
  return walk;
}

function makeKnightWalk2(base: string[]): string[] {
  const walk = [...base];
  walk[25] = "..........pppppp...............";
  walk[26] = "..........pp..pp...............";
  walk[27] = "..........pp..pp...............";
  walk[28] = "..........pp..pp...............";
  walk[29] = "..........pP..pP...............";
  walk[30] = "..........pQ..pQ...............";
  walk[31] = ".........bBB.bBB...............";
  walk[32] = ".........BBB.BBB...............";
  return walk;
}

// Mage walk frames (robe sways)
function makeMageWalk1(base: string[]): string[] {
  const walk = [...base];
  walk[26] = "........RRp..pRR...............";
  walk[27] = ".......pp......pp..............";
  walk[28] = ".......pp......pp..............";
  walk[29] = ".......pp......pp..............";
  walk[30] = ".......pP......pP..............";
  walk[31] = "......bBB.....bBB..............";
  walk[32] = "......BBB.....BBB..............";
  return walk;
}

function makeMageWalk2(base: string[]): string[] {
  const walk = [...base];
  walk[26] = "........RRp..pRR...............";
  walk[27] = "..........pp..pp...............";
  walk[28] = "..........pp..pp...............";
  walk[29] = "..........pp..pp...............";
  walk[30] = "..........pP..pP...............";
  walk[31] = ".........bBB.bBB...............";
  walk[32] = ".........BBB.BBB...............";
  return walk;
}

const WARRIOR_WALK1 = makeWalkFrame1_32(WARRIOR_ART);
const WARRIOR_WALK2 = makeWalkFrame2_32(WARRIOR_ART);
const KNIGHT_WALK1 = makeKnightWalk1(KNIGHT_ART);
const KNIGHT_WALK2 = makeKnightWalk2(KNIGHT_ART);
const MAGE_WALK1 = makeMageWalk1(MAGE_ART);
const MAGE_WALK2 = makeMageWalk2(MAGE_ART);
const ARCHER_WALK1 = makeWalkFrame1_32(ARCHER_ART);
const ARCHER_WALK2 = makeWalkFrame2_32(ARCHER_ART);

// ================================================================
// MOB SPRITES - Unique silhouettes, 3-tone shading, doubled detail
// ================================================================

// ---- Slime (28x24) - Gelatinous blob with transparency, floating eyes ----
const SLIME_PALETTE: Record<string, string> = {
  // Body (green, 3-tone)
  g: "#44CC66",
  G: "#2AAA48",
  d: "#1A8838",
  // Highlight/transparency
  l: "#66EE88",
  L: "#88FFAA",
  q: "#AAFFCC",
  // Eyes
  w: "#FFFFFF",
  e: "#222222",
  p: "#111111",
  // Specular
  k: "#CCFFDD",
};
const SLIME_ART = [
  "............................",
  "............................",
  "..........gggggg............",
  "........gglllllgg...........",
  ".......glLLLLLLLlg..........",
  "......glLLqqqLLLLlg.........",
  ".....gglLLqkqLLLLlgg.......",
  ".....gglLLLLLLLLLLlgg......",
  "....ggllwwe.llwwe.llgg.....",
  "....gglllll.lllll.llgg.....",
  "....ggggggllllllgggggg.....",
  "...gGGggggggggggggGGGgg....",
  "...gGGGggggggggggGGGGg.....",
  "...gGGGGggggggggGGGGGg.....",
  "...gGGGGGGggggGGGGGGGg.....",
  "....GGGGGGGGGGGGGGGGg.....",
  ".....dGGGGGGGGGGGGGd......",
  "......ddGGGGGGGGGdd........",
  ".........ddddddd...........",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
];

// ---- Wolf (36x28) - Muscular quadruped, fangs, bushy tail ----
const WOLF_PALETTE: Record<string, string> = {
  // Fur (brown, 3-tone)
  b: "#9B8565",
  B: "#7B6545",
  D: "#5B4A30",
  // Dark undercoat
  d: "#4A3A22",
  // Belly/light fur
  w: "#CCBB99",
  W: "#BBAA88",
  // Highlight
  l: "#B8A878",
  // Eyes
  e: "#FF3333",
  E: "#CC1111",
  // Nose
  n: "#333333",
  N: "#222222",
  // Teeth
  t: "#FFFFFF",
  // Tail tip
  T: "#AA9977",
};
const WOLF_ART = [
  "....................................",
  "....................................",
  "...bbd..............................",
  "..bBBbd.............................",
  ".bBBBBb.....bbbbbbbbb..............",
  ".bBBBBb...bbbBBBBBBBbb.............",
  "..nBBBb..bbBBBBBBBBBBbb.Tbb.......",
  "..teBb..bBBBBBBBBBBBBBbbTTbb......",
  "..teBb.bbBBBBBBBBBBBBBBbTTTb......",
  "...bBb.bBBBBwwwBBBBBBBBbBTbb......",
  "...bBbbbbBBwwWWwBBBBBBBbbbb.......",
  "....bbbbbBBwwWWwBBBBBBBbb.........",
  ".....bbbbbBBwwwBBBBBBBBb..........",
  "......bbbbbBBBBBBBBBBBbb..........",
  "......bbbbbbBBBBBBBBBbb...........",
  ".......bbbbbBBBBBBBBbb............",
  "........bbbbbBBBBBBb..............",
  ".........bD..bBB.bDb..............",
  ".........bD..bBB.bDb..............",
  ".........bD..bBB.bDb..............",
  ".........DD..BBB..DD..............",
  ".........DD..BBB..DD..............",
  "........dDD..dBB..DDd.............",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
];

// ---- Goblin (28x36) - Hunched, big ears, crude weapon, yellow eyes ----
const GOBLIN_PALETTE: Record<string, string> = {
  // Skin (olive green, 3-tone)
  g: "#7BA833",
  G: "#5A8818",
  d: "#3A6808",
  // Ear inner
  s: "#8BAA33",
  S: "#AABB55",
  // Eyes
  y: "#FFFF00",
  Y: "#CCCC00",
  e: "#222222",
  // Mouth
  m: "#553322",
  // Teeth
  t: "#EEEECC",
  // Cloth/loincloth
  c: "#8B6940",
  C: "#6B4A28",
  // Crude weapon (club)
  w: "#6B4A28",
  W: "#4A3018",
  // Boots
  b: "#4A3A28",
  B: "#3A2A18",
};
const GOBLIN_ART = [
  "............................",
  "............................",
  ".........gggggg.............",
  "........gggggggG............",
  ".......ggggggggg............",
  "....sg.ggggggggg.gs........",
  "...sSg.ggggggggg.gSs......",
  "....dg..yeggyeg..gd........",
  ".......gggggggggg...........",
  "........ggtmmtgg............",
  ".........gggggg.............",
  "..........gggg..............",
  "..........Gggg..............",
  ".........GGggGGw............",
  "........dGGggGGWw...........",
  "........dGGggGGWw...........",
  ".......ggGGggGGGWw..........",
  ".......ggGGGgGGGW...........",
  "........GGGggGG.............",
  "........cccccccc............",
  "........CCccccCC............",
  ".........cc..cc.............",
  ".........cc..cc.............",
  ".........cc..cc.............",
  ".........cc..cc.............",
  ".........bb..bb.............",
  ".........bB..bB.............",
  ".........BB..BB.............",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
];

// ---- Orc (28x38) - Bigger than goblin, tusks, armored ----
const ORC_PALETTE: Record<string, string> = {
  // Skin (darker olive, 3-tone)
  g: "#5A7830",
  G: "#3A5818",
  d: "#2A4808",
  // Eyes
  y: "#FF8800",
  Y: "#CC6600",
  e: "#222222",
  // Mouth/tusks
  m: "#443322",
  t: "#EEEEDD",
  s: "#6B8A3A",
  S: "#4A6A22",
  // Armor (crude metal)
  a: "#777778",
  A: "#555558",
  R: "#3A3A40",
  // Weapon (axe)
  w: "#888890",
  W: "#6B4A28",
  // Boots
  b: "#4A3A28",
  B: "#3A2A18",
  // Belt
  c: "#8B6940",
  C: "#6B4A28",
};
const ORC_ART = [
  "............................",
  "............................",
  "........gggggggg............",
  ".......gggggggggg...........",
  "......ggggggggggg...........",
  "....sg.ggggggggg.gs........",
  "...sSg.ggggggggg.gSs......",
  "....dg..yeggyeg..gd........",
  ".......gggggggggg...........",
  ".......ggtmmmmtgg...........",
  "........ggggggggg...........",
  ".........ggggggg............",
  ".........aaaaaaa............",
  "........AAAaaaaAw...........",
  ".......RAAAAaaAAWw..........",
  ".......RAAAAaaAAWw..........",
  "......ggRAAAAaAAAWw.........",
  "......ggRAAAAaAAAW..........",
  ".......RAAAAaaAA............",
  ".......cccccccccc...........",
  ".......CCccccccCC...........",
  "........cc....cc............",
  "........cc....cc............",
  "........cc....cc............",
  "........cc....cc............",
  "........bb....bb............",
  "........bB....bB............",
  "........BB....BB............",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
];

// ---- Skeleton (28x40) - Ribcage, sword+shield, glowing eyes ----
const SKEL_PALETTE: Record<string, string> = {
  // Bone (3-tone)
  w: "#F0F0DD",
  W: "#D8D8C5",
  d: "#B8B8A5",
  // Dark joints
  D: "#888878",
  // Eye glow
  r: "#FF2222",
  R: "#CC0000",
  e: "#FF6644",
  // Teeth
  t: "#E8E8D5",
  // Sword
  s: "#C8C8D0",
  S: "#A0A0AA",
  // Shield (tattered)
  h: "#6B4A28",
  H: "#4A3018",
  // Tattered cloth
  c: "#555548",
  C: "#3A3A30",
};
const SKEL_ART = [
  "............................",
  "............................",
  "..........wwwwww............",
  ".........wwwwwwww...........",
  "........wwwwwwwwww..........",
  "........wrRwwrRwww..........",
  "........weeWWeeWw...........",
  "........wwwwwwwww...........",
  ".........wdttdww............",
  "..........wwwww..............",
  "...........ww................",
  ".........wwwwww..............",
  "........wwwwwwww.............",
  ".......wwwwDDwwww............",
  "......swWwDDDDwWww...........",
  "......sww.wwww.wwh..........",
  ".......S..wwww..hH..........",
  "..........wwwwww............",
  ".........wwwwwwww...........",
  "..........wwwwww............",
  "...........wwww..............",
  "...........ww.ww............",
  "...........ww.ww............",
  "...........ww.ww............",
  "...........ww.ww............",
  "...........Dw.wD............",
  "..........DD..DD............",
  "..........DD..DD............",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
];

// ---- Zombie (28x40) - Shambling corpse, tattered clothes, green skin ----
const ZOMBIE_PALETTE: Record<string, string> = {
  // Rotting skin (3-tone)
  w: "#6B8B3A",
  W: "#556B2F",
  d: "#3A4A1A",
  // Dark
  D: "#2A3A10",
  // Eyes
  r: "#882222",
  R: "#661111",
  e: "#993333",
  // Teeth
  t: "#AABB88",
  // Tattered cloth
  c: "#4A4A3A",
  C: "#333328",
  s: "#555548",
  S: "#3A3A30",
  h: "#444438",
  H: "#333328",
};
const ZOMBIE_ART = [
  "............................",
  "............................",
  "..........wwwwww............",
  ".........wwWwwwww...........",
  "........wwWWwwwwww..........",
  "........wrRwwrRwww..........",
  "........weeWWeeWw...........",
  "........wwwwwwwww...........",
  ".........wdttdww............",
  "..........wwwww..............",
  "...........ww................",
  ".........cccccc..............",
  "........cCCcccCc.............",
  ".......cCCCCCCCCc............",
  "......wwCCCCCCCCcw...........",
  "......ww.cCCCc.cw...........",
  ".......w..cCCc..w...........",
  "..........cccccc............",
  ".........cccccccc...........",
  "..........cccccc............",
  "...........cccc..............",
  "...........cc.cc............",
  "...........cc.cc............",
  "...........ww.ww............",
  "...........ww.ww............",
  "...........Dw.wD............",
  "..........DD..DD............",
  "..........DD..DD............",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
];

// ---- Spider (32x24) - 8 legs, large abdomen, multiple eyes ----
const SPIDER_PALETTE: Record<string, string> = {
  // Body (dark, 3-tone)
  b: "#3A3A3A",
  B: "#2A2A2A",
  D: "#1A1A1A",
  // Abdomen pattern
  d: "#4A4A4A",
  // Eyes (multiple red dots)
  r: "#FF2222",
  R: "#CC0000",
  // Legs
  l: "#333333",
  L: "#222222",
  // Highlight
  h: "#555555",
  // Fangs
  t: "#CCCCAA",
};
const SPIDER_ART = [
  "................................",
  ".......l..........l.............",
  "......l............l............",
  ".....l..bbbbbbb.....l...........",
  "....l..bBBBBBBBb.....l..........",
  "...l..bBBBBBBBBBb.....l.........",
  "..l..bBBrBrBrBBBBb.....l.......",
  ".l..bBBBBBBBBBBBBBb.....l......",
  "l..bBBBBtBBtBBBBBBBb.....l.....",
  "....bBBBBBBBBBBBBBbb............",
  ".l..bBBBBBBBBBBBBbb.....l......",
  "..l..bBBddBBddBBb.....l........",
  "...l..bBBdddddBb.....l.........",
  "....l..bBBBBBBb.....l..........",
  ".....l..bbbbbb.....l...........",
  "......l..........l.............",
  ".......l........l..............",
  "........l......l...............",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

// ---- Dragon (40x40) - Wings spread, horns, scaled body, fire ----
const DRAGON_PALETTE: Record<string, string> = {
  // Scales (red, 3-tone)
  r: "#DD3322",
  R: "#AA1A10",
  D: "#771008",
  // Belly/underbelly
  y: "#FFCC44",
  Y: "#DDAA22",
  // Eyes
  e: "#FFE066",
  E: "#FFD700",
  // Horns
  h: "#8B6940",
  H: "#6B4A28",
  // Wings (dark red membrane)
  w: "#BB2218",
  W: "#881510",
  M: "#660E08",
  // Teeth/claws
  t: "#F0F0DD",
  // Fire breath
  f: "#FF8800",
  F: "#FFCC00",
  // Wing bone
  b: "#AA8855",
  // Tail spikes
  k: "#CC4422",
};
const DRAGON_ART = [
  "........................................",
  "..hH...................Hh.............",
  "..hhr..................rhh............",
  "...hrr...rrrrrrr...rrh...............",
  "...hrrr.rrrrrrrrrr.rrrh..............",
  "....rrrrrrrrrrrrrrrrrr...............",
  "....rrrreErrreErrrrr.................",
  ".....rrrrrrrrrrrrrrrr................",
  ".....rrrtrrrrrrrtrrr.................",
  "......rrrrrRRRrrrrrr................",
  "..W...rrrRRRRRRrrrr...W............",
  ".WW..rrrrRRYYRRRrrr...WW...........",
  ".WW.rrrrrRYYYYRRRrrrr..WW..........",
  "..WbrrrrRRYYYYYRRrrrrrb.W...........",
  "..WbrrrRRRYYYYRRRrrrrrbW............",
  "...brrrrRRRYYRRRRrrrrb..............",
  "...brrrrrRRRRRRRrrrrrrb.............",
  "....rrrrrrRRRRRrrrrrr...............",
  ".....rrrrrRRRRRrrrrr................",
  "......rrrrrRRRrrrrkk................",
  ".......rrrrRRRrrrkk.................",
  "........rrrRRrrrk...................",
  ".........rrr.rrr....................",
  ".........rrr.rrr....................",
  ".........rDr.rDr....................",
  ".........DDr.rDD....................",
  "........DDD..DDD...................",
  "........DDD..DDD...................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
  "........................................",
];

// ---- Ghost (28x32) - Ethereal, fading bottom, tattered cloak ----
const GHOST_PALETTE: Record<string, string> = {
  // Spectral body (purple, 3-tone)
  p: "#9977DD",
  P: "#7755BB",
  D: "#5533AA",
  // Highlight
  l: "#BB99FF",
  L: "#DDBBFF",
  // Eyes (glowing)
  w: "#FFFFFF",
  e: "#222222",
  E: "#44FFFF",
  // Mouth
  m: "#333355",
  // Fade effect (increasingly transparent-looking)
  f: "#7755BB",
  F: "#5533AA",
  g: "#4422AA",
  G: "#332299",
};
const GHOST_ART = [
  "............................",
  "............................",
  ".........pppppp.............",
  "........ppllllpp............",
  ".......ppllLLllpp...........",
  "......ppplLLLlpppp..........",
  "......ppplllllpppp..........",
  "......ppwEppwEpppp..........",
  "......pppppppppppp..........",
  ".......pppmmmpppp...........",
  ".......pppppppppp...........",
  "........pppppppp............",
  "........PPppppPP............",
  ".......PPPppppPPP...........",
  "......PPPPppPPPPP...........",
  "......PPPPppPPPPP...........",
  ".......PPP..PPPP............",
  ".......DPP..PPD.............",
  "......DDP....PDD............",
  "......DDP....PDD............",
  ".......DD....DD.............",
  "........ff..ff..............",
  ".........f..f...............",
  "..........FF..................",
  "...........g................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
];

// ---- Demon (36x44) - Horns, bat wings, muscular, tail ----
const DEMON_PALETTE: Record<string, string> = {
  // Skin (red, 3-tone)
  r: "#CC3333",
  R: "#AA1818",
  D: "#881010",
  // Horns
  h: "#444444",
  H: "#2A2A2A",
  // Eyes (fire)
  e: "#FF0000",
  E: "#FFCC00",
  // Fangs
  t: "#F0F0DD",
  // Wings (dark membrane)
  w: "#991818",
  W: "#661010",
  M: "#440808",
  // Wing bone
  b: "#772222",
  // Hooves
  c: "#333333",
  C: "#222222",
  // Body dark accent
  s: "#992222",
  S: "#771515",
  // Tail
  T: "#AA2222",
  k: "#662222",
  // Belt/loincloth
  p: "#444444",
  P: "#333333",
};
const DEMON_ART = [
  "....................................",
  "...H.........................H.....",
  "..HHh.......................hHH....",
  "..HHhh.....................hhHH....",
  "...Hhh....rrrrrrrr....hhH.........",
  "....hh...rrrrrrrrrr...hh..........",
  ".........rrrrrrrrrrrr..............",
  ".........rreErrreErrrr.............",
  ".........rrrrrrrrrrrr..............",
  "..........rrrtttrrrrr..............",
  "..........rrrrrrrrrr...............",
  "...........rrrrrrrr................",
  "..W......RRrrrrrrRR......W........",
  ".WW.....RRRrrrrrrRRR.....WW.......",
  ".WW....RRRRrrrrRRRRR.....WW.......",
  "..Wb...RRRRrrrrRRRRR...bW.........",
  "..Wb..SRRRRrrrRRRRRS..bW..........",
  "...b..SRRRRrrrRRRRRS..b...........",
  "...b..SRRRRrrrRRRRRS..b...........",
  "......SRRRRrrrRRRRRS..............",
  ".......RRRRrrrRRRR................",
  "........RRrrrrRRR.................",
  ".........rrrrrr....................",
  ".........pppppp....................",
  "........PPppppPP..................",
  ".........rr..rr....................",
  ".........rr..rr....................",
  ".........rr..rr.......Tk..........",
  ".........RR..RR......Tkk..........",
  ".........RR..RR.....Tk............",
  "........cCC..CCc.....................",
  "........CCC..CCC....................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
];

// ---- Bear (36x28) - Massive, detailed fur, standing ----
const BEAR_PALETTE: Record<string, string> = {
  // Fur (brown, 3-tone)
  b: "#7B5533",
  B: "#5A3A1E",
  D: "#3A2210",
  // Light belly
  l: "#9B7553",
  L: "#8B6543",
  // Muzzle
  s: "#AB8563",
  S: "#9B7553",
  // Nose
  n: "#333333",
  N: "#222222",
  // Eyes
  e: "#222222",
  // Ears
  E: "#6B4A28",
  // Claws
  c: "#CCCCBB",
};
const BEAR_ART = [
  "....................................",
  "...EE.............................",
  "..EBBe.............................",
  "..eBBe....bbbbbbbbb...............",
  "...bBb..bbbBBBBBBBbb..............",
  "...nBb.bbBBBBBBBBBBbb.............",
  "...bBbbbbBBBBBBBBBBBb.............",
  "....bbbbBBBBBBBBBBBBb.............",
  ".....bbbBBBBllBBBBBBb.............",
  "......bbbBBllLLlBBBBb.............",
  ".......bbbBllLLlBBBbb.............",
  "........bbbBlllBBBbb..............",
  ".........bbbBBBBBBb...............",
  "..........bbBBBBBbb...............",
  "..........bD.bBB.bDb..............",
  "..........bD.bBB.bDb..............",
  "..........bD.bBB.bDb..............",
  "..........DD.BBB..DD..............",
  "..........DD.BBB..DD..............",
  ".........DDD.dBB..DDD.............",
  ".........cDD..BB..DDc.............",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
];

// ---- Enemy Mage (28x40) - Dark robes, skull staff, shadowy aura ----
const EMAGE_PALETTE: Record<string, string> = {
  // Hood/robes (dark blue, 3-tone)
  r: "#333366",
  R: "#222255",
  D: "#111144",
  // Skin (pale)
  s: "#DDCCBB",
  S: "#CCBBAA",
  // Eyes (fire)
  e: "#FF4400",
  E: "#FF8800",
  // Mouth
  m: "#886666",
  // Staff (dark wood)
  w: "#4A3018",
  W: "#3A2010",
  // Skull on staff
  k: "#F0F0DD",
  K: "#D8D8C5",
  // Aura particles
  a: "#6644AA",
  A: "#4422AA",
  // Boots
  b: "#222244",
  B: "#111133",
};
const EMAGE_ART = [
  "............................",
  "............................",
  "..........kk................",
  ".........kKKk...............",
  ".........kKKk...............",
  "..........kk................",
  "..........ww................",
  ".........DDDD...............",
  "........DDDDDDw.............",
  ".......DDrrrrDDw............",
  "......DDrrsrrsrDw...........",
  "......DDrrEsEsrDw...........",
  ".......DrrssmssrDw..........",
  "........rrsssrrDw...........",
  ".........rrrrrr.w...........",
  "........rrrrrrrr............",
  ".......RRRrrrrRRw...........",
  "......DRRRrrrrRRRw..........",
  "......DRRRrrrrRRRw..........",
  "......DRRRrrrrRRRw..........",
  ".......RRRrrrrRRR...........",
  ".......RRRrrrrRR............",
  "........RRrrrrRR............",
  "......RRRRrrrrRRRR..........",
  ".....RRRRRrrrrRRRRR.........",
  "....RRRRRRr..rRRRRRR........",
  ".....RRRRr....rRRRR.........",
  "..........rr..rr............",
  "..........rr..rr............",
  "..........rr..rr............",
  "..........bB..bB............",
  "..........BB..BB............",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
];

// ---- Scorpion (36x28) - Large pincers, curved stinger tail ----
const SCORPION_PALETTE: Record<string, string> = {
  // Exoskeleton (brown, 3-tone)
  b: "#9B6633",
  B: "#7B4A22",
  D: "#5A3010",
  // Belly
  d: "#AA7744",
  // Stinger
  r: "#DD3322",
  R: "#AA1A10",
  p: "#FF4433",
  // Eyes
  e: "#222222",
  // Pincers
  c: "#8B5A28",
  C: "#6B3A18",
  // Legs
  l: "#7B4A22",
  L: "#5A3010",
};
const SCORPION_ART = [
  "....................................",
  ".......rr...........................",
  "......rRp...........................",
  ".....rRR............................",
  "....rRR.............................",
  "....RR..............................",
  "....Rb..............................",
  ".cc..bbbbbbb........................",
  "cCCc.bBBBBBBb......................",
  ".cc.bBBBBBBBBb.....................",
  "....bBBBeBeBBBb....................",
  "....bBBBBBBBBBBb...................",
  "....bBBBBBBBBBBBb..................",
  ".cc..bBBBBBBBBBb...................",
  "cCCc..bBBBBBBBb....................",
  ".cc....bBBBBBb.....................",
  "........bBBBb......................",
  ".......ll.ll.ll.ll..................",
  "......ll..ll..ll..ll................",
  ".....LL...LL...LL...LL..............",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
];

// ---- Treant (32x44) - Bark texture, branch arms, leaf crown ----
const TREANT_PALETTE: Record<string, string> = {
  // Trunk/bark (3-tone)
  t: "#5A3818",
  T: "#3A2210",
  V: "#2A1808",
  // Leaves (3-tone)
  l: "#3AAA22",
  L: "#2A8818",
  G: "#1A6610",
  // Bright leaves
  g: "#55CC33",
  // Eyes (amber)
  e: "#FFCC00",
  E: "#FFE066",
  // Roots
  r: "#4A2A10",
  R: "#3A1A08",
  // Moss
  m: "#558833",
  M: "#447722",
  // Bark cracks
  c: "#2A1808",
};
const TREANT_ART = [
  "................................",
  "........lllggggll...............",
  ".......lLLgGGGGgll..............",
  "......lLLLgGGGGGgll.............",
  ".....lLLLLGGGGGGGll.............",
  ".....lLLLLGGGGGGgll.............",
  "......lLLLGGGGGgll..............",
  ".......lllgGGGgl................",
  "..........tttttt................",
  ".........tTtTtTtt...............",
  "........ttTeTeTtt...............",
  "........ttTTTTTTt...............",
  ".......tttTTTTTttt..............",
  "......ttTTTcTTTTttt.............",
  ".....rtttTTTTTTTtttr............",
  "....rrtTTTTTTTTTTtrr............",
  ".....rtTTTmTTTTTtr..............",
  "......tTTTMTTTTTt...............",
  "......tTTTTTTTTTt...............",
  ".......tTTTTTTTt................",
  "........tTTTTTt.................",
  "........tTTTTTt.................",
  "........tT...Tt.................",
  "........tt...tt.................",
  ".......rRr...rRr................",
  "......rRRr...rRRr...............",
  ".....rRRR.....RRRr..............",
  "......RRR.....RRR...............",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

// ---- Golem (32x40) - Cracked stone, glowing runes, massive fists ----
const GOLEM_PALETTE: Record<string, string> = {
  // Stone (3-tone)
  s: "#909090",
  S: "#707070",
  D: "#505050",
  // Dark cracks
  c: "#383838",
  C: "#282828",
  // Glowing runes
  e: "#66CCFF",
  E: "#88EEFF",
  g: "#44AADD",
  // Rough surface
  r: "#606060",
  R: "#4A4A4A",
  // Fists
  f: "#808080",
  F: "#606060",
};
const GOLEM_ART = [
  "................................",
  "...........sssssss..............",
  "..........sSSSSSSSs.............",
  ".........sSSSSSSSSs.............",
  "........sSSeSSeSSSs.............",
  "........sSSSSSSSSSs.............",
  ".........sSSSSSSSSs.............",
  "..........sSSSSss...............",
  "............ss..................",
  "..........ssssssss..............",
  ".........sSSSSSSSSs.............",
  "........sSSSSSSSSSS.............",
  ".......fSSSScSSSSSSf............",
  "......ffSSScCSSSSSSff...........",
  ".....fffSSSSSSSSSSSfff..........",
  ".....ffFSSeSSSSeSSSFff..........",
  "......fFSSSSSSSSSSFf............",
  ".......SSSSSSSSSSSf.............",
  "........SSScSSSSS...............",
  ".........SSSSSSS................",
  "..........SSSSS.................",
  "..........SS.SS.................",
  "..........SS.SS.................",
  ".........sSS.SSs................",
  "........sSSS.SSSs...............",
  "........sSSD.DSS................",
  ".......sSSD...DSSs..............",
  ".......rDDD...DDDr..............",
  "........DDD...DDD...............",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

// ---- Mushroom Monster (28x32) - Spotted cap, stubby legs, menacing face ----
const MUSHROOM_PALETTE: Record<string, string> = {
  // Cap (red, 3-tone)
  c: "#DD4444",
  C: "#BB2222",
  V: "#991111",
  // Spots
  s: "#FF8888",
  S: "#FFAAAA",
  // Stem (3-tone)
  t: "#EEDD99",
  T: "#CCBB77",
  U: "#AA9955",
  // Eyes
  e: "#222222",
  E: "#111111",
  // Whites
  w: "#FFFFFF",
  // Mouth
  m: "#664422",
  // Roots
  r: "#886644",
  R: "#664422",
  // Dark
  d: "#553311",
};
const MUSHROOM_ART = [
  "............................",
  "............................",
  ".........cccccccc...........",
  "........cCCsCCsCCc..........",
  ".......cCCCsCCsCCCc.........",
  "......cCCCCCCCCCCCCc........",
  ".....cCCsCCCCCCsCCCCc.......",
  ".....cCCCCsCCCCCCCCCc.......",
  "......cCCCCCCCCCCCCc........",
  ".......ccCCCCCCCCcc.........",
  "........VcccccccV...........",
  "..........tttttt............",
  ".........tTTTTTTt...........",
  "........tTTweTTTTt..........",
  "........tTTweTTTTt..........",
  "........tTTTmmTTTt..........",
  ".........tTTTTTt............",
  ".........tTTTTTt............",
  "..........tTTt...............",
  "..........tTTt...............",
  ".........rtttttr.............",
  "........rR....Rr............",
  "........RR....RR............",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
  "............................",
];

// ================================================================
// NPC SPRITES (32x44, matching player proportions)
// ================================================================

// ---- NPC Merchant (32x44) - Brown merchant robes, coin pouch ----
const NPC_PALETTE: Record<string, string> = {
  // Hair
  h: "#8B5E3C",
  H: "#6B4428",
  J: "#A87650",
  // Skin
  s: "#FFD5B4",
  S: "#E8B898",
  T: "#D4A480",
  // Eyes/mouth
  e: "#1a1a1a",
  E: "#FFFFFF",
  m: "#C47A6A",
  // Outfit (brown merchant)
  a: "#7B5A33",
  A: "#5A3A1E",
  R: "#3A2210",
  // Gold/coin
  g: "#FFD700",
  G: "#DAA520",
  Y: "#B8860B",
  // Boots
  b: "#5C3A1E",
  B: "#3A2210",
  p: "#4A3728",
  P: "#382818",
  Q: "#2A1A10",
  // Apron
  c: "#DDCC99",
  C: "#BBAA77",
};
const NPC_MERCHANT_ART = [
  "................................",
  "...........Ygg..................",
  "...........YGG..................",
  "..........HHHHHH................",
  ".........HhhhhhHH...............",
  "........HHhJhhJhHH..............",
  "........HHhhhhhhHH..............",
  "........ssssssssss...............",
  "........sEe.sEess...............",
  "........sSSmSSsss...............",
  ".........sTTTTss................",
  "..........ssss..................",
  ".........ggaagg.................",
  "........GaaaaagG................",
  ".......RAAcccaAAR...............",
  "......sRAAcccaAARs..............",
  "......sRAAcCcaAARs..............",
  ".......RAAcccaAAR...............",
  ".......RAAaaaAAR................",
  "........RAAAAaAR................",
  "........ggaaaaagg...............",
  "........RAAAAAAAR...............",
  ".........AAAAAA.................",
  ".........pppppppp...............",
  ".........pp....pp...............",
  ".........pp....pp...............",
  ".........pp....pp...............",
  ".........pP....pP...............",
  ".........pQ....pQ...............",
  "........bBB...bBB...............",
  "........BBB...BBB...............",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

// ---- NPC Guide - Blue outfit variant ----
const NPC_GUIDE_PALETTE: Record<string, string> = {
  ...NPC_PALETTE,
  a: "#3A88CC",
  A: "#2A68AA",
  R: "#1A4888",
  h: "#3A68AA",
  H: "#2A4888",
  J: "#4A88CC",
  c: "#DDCC99",
  C: "#BBAA77",
};
const NPC_GUIDE_ART = [...NPC_MERCHANT_ART];

// ---- NPC Blacksmith (weapon) - Muscular, dark apron, hammer ----
const NPC_BLACKSMITH_PALETTE: Record<string, string> = {
  ...NPC_PALETTE,
  a: "#555555",
  A: "#3A3A3A",
  R: "#222222",
  h: "#333333",
  H: "#222222",
  J: "#444444",
  c: "#444444",
  C: "#333333",
};
const NPC_BLACKSMITH_ART = [
  "................................",
  "...........Ygg..................",
  "...........YGG..................",
  "..........hhhhhh................",
  ".........Hhhhhhhh...............",
  "........HHhhJhJhHH..............",
  "........ssssssssss...............",
  "........sEe.sEess...............",
  "........sSSmSSsss...............",
  ".........sTTTTss................",
  "..........ssss..................",
  ".........ggaagg.................",
  "........GaaaaagG................",
  ".......RAAcccaAAR...............",
  ".....ssRAAcccaAARss.............",
  ".....sSRAAcCcaAARsS.............",
  "......SRAAcccaAAR...............",
  ".......RAAaaaAAR................",
  ".......RAAaaaAAR................",
  "........RAAAAaAR................",
  "........ggaaaaagg...............",
  "........RAAAAAAAR...............",
  ".........AAAAAA.................",
  ".........pppppppp...............",
  ".........pp....pp...............",
  ".........pp....pp...............",
  ".........pp....pp...............",
  ".........pP....pP...............",
  ".........pQ....pQ...............",
  "........bBB...bBB...............",
  "........BBB...BBB...............",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

// ---- NPC Potion/Witch - Purple robes, potion glow ----
const NPC_POTION_PALETTE: Record<string, string> = {
  ...NPC_PALETTE,
  a: "#7B3AAA",
  A: "#5A2288",
  R: "#3A1068",
  h: "#5A2288",
  H: "#3A1068",
  J: "#7B3AAA",
  c: "#44FF44",
  C: "#22CC22",
};
const NPC_POTION_ART = [
  "................................",
  "...........Ygg..................",
  "...........YGG..................",
  "..........HHHHHH................",
  ".........HhhhhhHH...............",
  "........HHhJhhJhHH..............",
  "........HHhhhhhhHH..............",
  "........ssssssssss...............",
  "........sEe.sEess...............",
  "........sSSmSSsss...............",
  ".........sTTTTss................",
  "..........ssss..................",
  ".........ggaagg.................",
  "........GaaaaagG................",
  ".......RAAaaaaAAR...............",
  "......sRAAaaaaAARs..............",
  "......sRAAaaaaAARs..............",
  ".......RAAaaaaAAR...............",
  ".......RAAaaaAAR................",
  "........RAAAAaAR................",
  "........ggaaaaagg...............",
  "........RAAAAAAAR...............",
  ".......RRAAAAAARRR..............",
  "......RRRpp..ppRRR..............",
  ".........pp..pp.................",
  ".........pp..pp.................",
  ".........pp..pp.................",
  ".........pP..pP.................",
  ".........pQ..pQ.................",
  "........bBB..bBB................",
  "........BBB..BBB................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

// ================================================================
// TILE TEXTURES (32x32)
// ================================================================

function generateTileTexture(
  scene: Phaser.Scene,
  key: string,
  baseColor: string,
  drawDetail: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): void {
  if (scene.textures.exists(key)) return;
  const size = 32;
  const ct = scene.textures.createCanvas(key, size, size);
  if (!ct) return;
  const ctx = ct.getContext();
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);
  drawDetail(ctx, size, size);
  ct.refresh();
}

// ================================================================
// MAIN EXPORT: Generate all textures
// ================================================================

export function generateAllTextures(scene: Phaser.Scene): void {
  // ---- Player sprites (idle + 2 walk frames for 3-frame cycle) ----
  renderWithOutline(scene, "player_warrior", WARRIOR_ART, WARRIOR_PALETTE);
  renderWithOutline(
    scene,
    "player_warrior_walk",
    WARRIOR_WALK1,
    WARRIOR_PALETTE,
  );
  renderWithOutline(
    scene,
    "player_warrior_walk2",
    WARRIOR_WALK2,
    WARRIOR_PALETTE,
  );

  renderWithOutline(scene, "player_knight", KNIGHT_ART, KNIGHT_PALETTE);
  renderWithOutline(scene, "player_knight_walk", KNIGHT_WALK1, KNIGHT_PALETTE);
  renderWithOutline(scene, "player_knight_walk2", KNIGHT_WALK2, KNIGHT_PALETTE);

  renderWithOutline(scene, "player_mage", MAGE_ART, MAGE_PALETTE);
  renderWithOutline(scene, "player_mage_walk", MAGE_WALK1, MAGE_PALETTE);
  renderWithOutline(scene, "player_mage_walk2", MAGE_WALK2, MAGE_PALETTE);

  renderWithOutline(scene, "player_archer", ARCHER_ART, ARCHER_PALETTE);
  renderWithOutline(scene, "player_archer_walk", ARCHER_WALK1, ARCHER_PALETTE);
  renderWithOutline(scene, "player_archer_walk2", ARCHER_WALK2, ARCHER_PALETTE);

  // ---- Mob sprites ----
  renderWithOutline(scene, "mob_slime", SLIME_ART, SLIME_PALETTE);
  renderWithOutline(scene, "mob_wolf", WOLF_ART, WOLF_PALETTE);
  renderWithOutline(scene, "mob_goblin", GOBLIN_ART, GOBLIN_PALETTE);
  renderWithOutline(scene, "mob_skeleton", SKEL_ART, SKEL_PALETTE);
  renderWithOutline(scene, "mob_spider", SPIDER_ART, SPIDER_PALETTE);
  renderWithOutline(scene, "mob_dragon", DRAGON_ART, DRAGON_PALETTE);
  renderWithOutline(scene, "mob_ghost", GHOST_ART, GHOST_PALETTE);
  renderWithOutline(scene, "mob_demon", DEMON_ART, DEMON_PALETTE);
  renderWithOutline(scene, "mob_bear", BEAR_ART, BEAR_PALETTE);
  renderWithOutline(scene, "mob_mage", EMAGE_ART, EMAGE_PALETTE);
  renderWithOutline(scene, "mob_scorpion", SCORPION_ART, SCORPION_PALETTE);
  renderWithOutline(scene, "mob_treant", TREANT_ART, TREANT_PALETTE);
  renderWithOutline(scene, "mob_golem", GOLEM_ART, GOLEM_PALETTE);
  renderWithOutline(scene, "mob_mushroom", MUSHROOM_ART, MUSHROOM_PALETTE);
  renderWithOutline(scene, "mob_zombie", ZOMBIE_ART, ZOMBIE_PALETTE);
  renderWithOutline(scene, "mob_orc", ORC_ART, ORC_PALETTE);

  // Color variants for slime
  const fireSlimePalette: Record<string, string> = {
    ...SLIME_PALETTE,
    g: "#FF6633",
    G: "#CC4420",
    d: "#AA3318",
    l: "#FF8855",
    L: "#FFAA77",
    q: "#FFCCAA",
    k: "#FFDDBB",
  };
  const iceSlimePalette: Record<string, string> = {
    ...SLIME_PALETTE,
    g: "#66CCFF",
    G: "#4499DD",
    d: "#3377AA",
    l: "#88DDFF",
    L: "#AAEEFF",
    q: "#CCEFFF",
    k: "#DDEEFF",
  };
  const poisonSlimePalette: Record<string, string> = {
    ...SLIME_PALETTE,
    g: "#66CC44",
    G: "#44AA22",
    d: "#338818",
    l: "#88EE66",
    L: "#AAFF88",
    q: "#CCFFAA",
    k: "#DDFFCC",
  };
  renderWithOutline(scene, "mob_fire_slime", SLIME_ART, fireSlimePalette);
  renderWithOutline(scene, "mob_ice_slime", SLIME_ART, iceSlimePalette);
  renderWithOutline(scene, "mob_poison_slime", SLIME_ART, poisonSlimePalette);

  // Color variants for wolf
  const direWolfPalette: Record<string, string> = {
    ...WOLF_PALETTE,
    b: "#555566",
    B: "#3A3A4A",
    D: "#222233",
    d: "#1A1A28",
    w: "#888899",
    W: "#777788",
    l: "#666677",
  };
  const shadowWolfPalette: Record<string, string> = {
    ...WOLF_PALETTE,
    b: "#3A3A55",
    B: "#2A2A44",
    D: "#1A1A33",
    d: "#111128",
    e: "#CC33FF",
    E: "#AA22DD",
    w: "#555566",
    W: "#444455",
  };
  renderWithOutline(scene, "mob_dire_wolf", WOLF_ART, direWolfPalette);
  renderWithOutline(scene, "mob_shadow_wolf", WOLF_ART, shadowWolfPalette);

  // Magma golem
  const magmaGolemPalette: Record<string, string> = {
    ...GOLEM_PALETTE,
    s: "#AA4400",
    S: "#883300",
    D: "#662200",
    c: "#441100",
    C: "#330800",
    e: "#FF6600",
    E: "#FF8800",
    g: "#FF4400",
    r: "#552200",
    R: "#441100",
  };
  renderWithOutline(scene, "mob_magma_golem", GOLEM_ART, magmaGolemPalette);

  // Ice golem
  const iceGolemPalette: Record<string, string> = {
    ...GOLEM_PALETTE,
    s: "#88BBCC",
    S: "#6699AA",
    D: "#447788",
    c: "#335566",
    C: "#224455",
    e: "#AAEEFF",
    E: "#CCFFFF",
    g: "#88DDFF",
    r: "#446688",
    R: "#335577",
  };
  renderWithOutline(scene, "mob_ice_golem", GOLEM_ART, iceGolemPalette);

  // Dark treant
  const darkTreantPalette: Record<string, string> = {
    ...TREANT_PALETTE,
    t: "#2A2A2A",
    T: "#1A1A1A",
    V: "#111111",
    l: "#2A2A3A",
    L: "#1A1A2A",
    G: "#111122",
    g: "#3A3A5A",
    e: "#FF0000",
    E: "#FF4444",
    r: "#1A1A1A",
    R: "#111111",
    m: "#222233",
    M: "#1A1A28",
  };
  renderWithOutline(scene, "mob_dark_treant", TREANT_ART, darkTreantPalette);

  // Poison mushroom
  const poisonMushroomPalette: Record<string, string> = {
    ...MUSHROOM_PALETTE,
    c: "#44BB22",
    C: "#338818",
    V: "#226610",
    s: "#88FF44",
    S: "#AAFF66",
  };
  renderWithOutline(
    scene,
    "mob_poison_mushroom",
    MUSHROOM_ART,
    poisonMushroomPalette,
  );

  // ---- NPC sprites ----
  renderWithOutline(scene, "npc_merchant", NPC_MERCHANT_ART, NPC_PALETTE);
  renderWithOutline(scene, "npc_guide", NPC_GUIDE_ART, NPC_GUIDE_PALETTE);
  renderWithOutline(
    scene,
    "npc_weapon",
    NPC_BLACKSMITH_ART,
    NPC_BLACKSMITH_PALETTE,
  );

  const armorNpcPalette: Record<string, string> = {
    ...NPC_PALETTE,
    a: "#4A6FA5",
    A: "#3A5A8A",
    R: "#2A4A7A",
    h: "#3A5A8A",
    H: "#2A4A7A",
    J: "#4A6FA5",
    c: "#DDCC99",
    C: "#BBAA77",
  };
  renderWithOutline(scene, "npc_armor", NPC_MERCHANT_ART, armorNpcPalette);

  renderWithOutline(scene, "npc_potion", NPC_POTION_ART, NPC_POTION_PALETTE);

  const eliteNpcPalette: Record<string, string> = {
    ...NPC_PALETTE,
    a: "#8B0000",
    A: "#660000",
    R: "#440000",
    h: "#660000",
    H: "#440000",
    J: "#8B0000",
    c: "#DDCC99",
    C: "#BBAA77",
  };
  renderWithOutline(scene, "npc_elite", NPC_MERCHANT_ART, eliteNpcPalette);

  // ---- Tile textures ----
  generateTileTextures(scene);

  // ---- Effect textures ----
  generateEffectTextures(scene);
}

// ---- Get texture key for a mob ID ----
export function getMobTextureKey(mobId: string): string {
  const id = mobId.toLowerCase();

  if (id.includes("fire") && id.includes("slime")) return "mob_fire_slime";
  if (id.includes("ice") && id.includes("slime")) return "mob_ice_slime";
  if (id.includes("poison") && id.includes("slime")) return "mob_poison_slime";
  if (id.includes("slime") || id.includes("ooze")) return "mob_slime";

  if (id.includes("dire") && (id.includes("wolf") || id.includes("hound")))
    return "mob_dire_wolf";
  if (id.includes("shadow") && (id.includes("wolf") || id.includes("hound")))
    return "mob_shadow_wolf";
  if (id.includes("wolf") || id.includes("hound") || id.includes("fox"))
    return "mob_wolf";

  if (id.includes("orc")) return "mob_orc";
  if (id.includes("goblin") || id.includes("imp")) return "mob_goblin";

  if (id.includes("zombie") || id.includes("undead")) return "mob_zombie";
  if (id.includes("skeleton")) return "mob_skeleton";

  if (id.includes("scorpion")) return "mob_scorpion";
  if (id.includes("spider")) return "mob_spider";

  if (id.includes("dragon") || id.includes("drake") || id.includes("wyrm"))
    return "mob_dragon";

  if (
    id.includes("bat") ||
    id.includes("phantom") ||
    id.includes("ghost") ||
    id.includes("wraith") ||
    id.includes("nightmare")
  )
    return "mob_ghost";

  if (id.includes("bear") || id.includes("boar")) return "mob_bear";

  if (id.includes("treant") || id.includes("ent") || id.includes("plant"))
    return "mob_treant";
  if (id.includes("dark") && id.includes("tree")) return "mob_dark_treant";

  if (id.includes("mushroom") || id.includes("fungus") || id.includes("spore"))
    return "mob_mushroom";
  if (
    id.includes("poison") &&
    (id.includes("mushroom") || id.includes("fungus"))
  )
    return "mob_poison_mushroom";

  if (id.includes("magma") && id.includes("golem")) return "mob_magma_golem";
  if (id.includes("ice") && id.includes("golem")) return "mob_ice_golem";
  if (
    id.includes("golem") ||
    id.includes("guardian") ||
    id.includes("knight") ||
    id.includes("warrior") ||
    id.includes("construct")
  )
    return "mob_golem";

  if (
    id.includes("mage") ||
    id.includes("witch") ||
    id.includes("cursed") ||
    id.includes("rune")
  )
    return "mob_mage";

  if (
    id.includes("demon") ||
    id.includes("chaos") ||
    id.includes("infernal") ||
    id.includes("abyss") ||
    id.includes("dark_overlord") ||
    id.includes("void") ||
    id.includes("behemoth")
  )
    return "mob_demon";

  if (id.includes("snake") || id.includes("serpent") || id.includes("worm"))
    return "mob_slime";

  if (id.includes("phoenix") || id.includes("hawk") || id.includes("harpy"))
    return "mob_dragon";

  if (
    id.includes("titan") ||
    id.includes("sentinel") ||
    id.includes("champion") ||
    id.includes("elemental")
  )
    return "mob_golem";

  if (id.includes("queen") || id.includes("king") || id.includes("emperor"))
    return "mob_demon";

  return "mob_goblin";
}

// ---- Get texture key for an NPC ----
export function getNpcTextureKey(npcId: string): string {
  const id = (npcId || "").toLowerCase();
  if (id.includes("weapon") || id.includes("blacksmith")) return "npc_weapon";
  if (id.includes("armor")) return "npc_armor";
  if (id.includes("potion") || id.includes("brewer")) return "npc_potion";
  if (id.includes("elite")) return "npc_elite";
  if (id.includes("guide")) return "npc_guide";
  return "npc_merchant";
}

// ---- Get player texture key (with 3-frame walk cycle) ----
export function getPlayerTextureKey(
  playerClass: string,
  walkFrame: number = 0, // 0=idle, 1=walk1, 2=walk2
): string {
  const suffix = walkFrame === 1 ? "_walk" : walkFrame === 2 ? "_walk2" : "";
  switch (playerClass) {
    case "warrior":
      return `player_warrior${suffix}`;
    case "knight":
      return `player_knight${suffix}`;
    case "mage":
      return `player_mage${suffix}`;
    case "archer":
      return `player_archer${suffix}`;
    default:
      return `player_warrior${suffix}`;
  }
}

// ================================================================
// Tile texture generation with variants
// ================================================================

function generateTileTextures(scene: Phaser.Scene): void {
  const S = 32;

  // Seeded random for consistent tile variants
  const seededRng = (seed: number) => {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  };

  // Grass tile with tufts and detail - 3 variants
  for (let v = 0; v < 3; v++) {
    const key = v === 0 ? "tile_grass" : `tile_grass_v${v}`;
    const rng = seededRng(v * 1337);
    generateTileTexture(scene, key, "#2E5A22", (ctx, w) => {
      // Large variation patches
      ctx.fillStyle = "#3A6A2E";
      ctx.fillRect(4 + rng() * 10, 4 + rng() * 8, 8 + rng() * 4, 6 + rng() * 4);
      ctx.fillRect(
        16 + rng() * 6,
        12 + rng() * 6,
        8 + rng() * 6,
        6 + rng() * 6,
      );
      // Mid-tone patches
      ctx.fillStyle = "#356830";
      ctx.fillRect(2 + rng() * 12, 14 + rng() * 8, 5, 4);
      // Grass blade tufts
      ctx.fillStyle = "#4A8A3A";
      for (let i = 0; i < 6 + v * 2; i++) {
        const x = Math.floor(rng() * 28) + 2;
        const y = Math.floor(rng() * 22) + 4;
        ctx.fillRect(x, y, 1, 2 + Math.floor(rng() * 3));
        ctx.fillRect(x + 1, y + 1, 1, 1 + Math.floor(rng() * 2));
      }
      // Darker grass tips
      ctx.fillStyle = "#2A5222";
      for (let i = 0; i < 3; i++) {
        const x = Math.floor(rng() * 26) + 3;
        const y = Math.floor(rng() * 20) + 6;
        ctx.fillRect(x, y, 1, 2);
      }
      // Small pebbles
      ctx.fillStyle = "#7A7A6A";
      ctx.globalAlpha = 0.3;
      if (v >= 1) {
        ctx.fillRect(
          Math.floor(rng() * 24) + 4,
          Math.floor(rng() * 24) + 4,
          2,
          1,
        );
      }
      ctx.globalAlpha = 1;
      // Small flowers on variant 2
      if (v === 2) {
        ctx.fillStyle = "#FFEE44";
        ctx.fillRect(8, 14, 2, 2);
        ctx.fillStyle = "#FFFF88";
        ctx.fillRect(9, 14, 1, 1);
        ctx.fillStyle = "#FF6688";
        ctx.fillRect(22, 8, 2, 2);
        ctx.fillStyle = "#FF99AA";
        ctx.fillRect(23, 8, 1, 1);
      }
      // Subtle edge shadows for depth
      ctx.fillStyle = "#000000";
      ctx.globalAlpha = 0.06;
      ctx.fillRect(0, 0, w, 1);
      ctx.fillRect(0, 0, 1, w);
      ctx.globalAlpha = 0.03;
      ctx.fillRect(0, w - 1, w, 1);
      ctx.fillRect(w - 1, 0, 1, w);
      ctx.globalAlpha = 1;
    });
  }

  // Dark grass - 2 variants
  for (let v = 0; v < 2; v++) {
    const key = v === 0 ? "tile_dark_grass" : `tile_dark_grass_v${v}`;
    generateTileTexture(scene, key, "#1A2E18", (ctx) => {
      ctx.fillStyle = "#223A1E";
      ctx.fillRect(2 + v * 6, 8 - v * 4, 10, 8);
      ctx.fillRect(16 + v * 2, 2 + v * 6, 12, 10);
      ctx.fillStyle = "#2A4A24";
      ctx.fillRect(8 + v * 4, 14, 1, 3);
      ctx.fillRect(20 - v * 4, 18, 1, 3);
      // Dead grass blades
      ctx.fillStyle = "#334828";
      ctx.fillRect(6 + v * 3, 10, 1, 3);
      ctx.fillRect(18 - v * 2, 6, 1, 4);
      ctx.fillRect(24, 16, 1, 3);
      // Mushroom on variant 1
      if (v === 1) {
        ctx.fillStyle = "#664422";
        ctx.fillRect(6, 22, 2, 4);
        ctx.fillStyle = "#884422";
        ctx.fillRect(4, 20, 6, 3);
        ctx.fillStyle = "#995533";
        ctx.fillRect(5, 20, 4, 2);
      }
      // Subtle ambient darkening
      ctx.fillStyle = "#000000";
      ctx.globalAlpha = 0.08;
      ctx.fillRect(0, 0, 32, 1);
      ctx.fillRect(0, 0, 1, 32);
      ctx.globalAlpha = 1;
    });
  }

  // Dirt - pebbles and texture
  generateTileTexture(scene, "tile_dirt", "#5C4A32", (ctx) => {
    // Color patches
    ctx.fillStyle = "#4A3A28";
    ctx.fillRect(6, 4, 8, 6);
    ctx.fillRect(20, 18, 8, 6);
    ctx.fillStyle = "#6A5A42";
    ctx.fillRect(10, 14, 4, 3);
    ctx.fillRect(24, 8, 3, 2);
    ctx.fillRect(3, 20, 5, 3);
    // Pebbles
    ctx.fillStyle = "#7A6A52";
    ctx.fillRect(14, 6, 3, 2);
    ctx.fillRect(8, 24, 2, 2);
    ctx.fillStyle = "#4A3A22";
    ctx.fillRect(4, 22, 2, 2);
    ctx.fillRect(26, 14, 2, 1);
    // Subtle tracks
    ctx.fillStyle = "#000000";
    ctx.globalAlpha = 0.05;
    ctx.fillRect(8, 16, 16, 1);
    ctx.globalAlpha = 1;
  });

  // Stone - mortar lines, moss patches - 2 variants
  for (let v = 0; v < 2; v++) {
    const key = v === 0 ? "tile_stone" : `tile_stone_v${v}`;
    generateTileTexture(scene, key, "#555560", (ctx, w, h) => {
      // Mortar lines (dark)
      ctx.fillStyle = "#000000";
      ctx.globalAlpha = 0.25;
      ctx.fillRect(0, 0, w, 1);
      ctx.fillRect(0, 0, 1, h);
      ctx.fillRect(0, 15 + v * 2, w, 1);
      ctx.fillRect(12 + v * 4, 0, 1, 16);
      ctx.fillRect(24 - v * 4, 16, 1, 16);
      ctx.globalAlpha = 1;
      // Stone texture highlights
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.08;
      ctx.fillRect(2, 2, 8, 1);
      ctx.fillRect(14, 18, 8, 1);
      ctx.fillRect(4, 6, 1, 4);
      ctx.globalAlpha = 1;
      // Darker patches
      ctx.fillStyle = "#4A4A55";
      ctx.fillRect(6 + v * 3, 4, 3, 3);
      ctx.fillRect(20 - v * 2, 22, 4, 3);
      // Cracks on variant 1
      if (v === 1) {
        ctx.strokeStyle = "#333338";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(8, 8);
        ctx.lineTo(14, 12);
        ctx.lineTo(18, 10);
        ctx.stroke();
        // Moss patch
        ctx.fillStyle = "#3A5A2A";
        ctx.globalAlpha = 0.3;
        ctx.fillRect(22, 4, 4, 3);
        ctx.globalAlpha = 1;
      }
    });
  }

  // Water - ripples, depth, sparkles
  generateTileTexture(scene, "tile_water", "#1A4A7A", (ctx, w) => {
    // Depth gradient (darker center)
    ctx.fillStyle = "#0E3A5E";
    ctx.globalAlpha = 0.4;
    ctx.fillRect(2, 2, w - 4, w - 4);
    ctx.globalAlpha = 0.2;
    ctx.fillRect(4, 4, w - 8, w - 8);
    ctx.globalAlpha = 1;
    // Ripple lines
    ctx.fillStyle = "#3A7AAA";
    ctx.globalAlpha = 0.35;
    ctx.fillRect(3, 8, 20, 1);
    ctx.fillRect(8, 20, 16, 1);
    ctx.fillRect(2, 26, 12, 1);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#4A8ABA";
    ctx.fillRect(6, 14, 14, 1);
    ctx.fillRect(14, 4, 10, 1);
    ctx.globalAlpha = 1;
    // Sparkle highlights
    ctx.fillStyle = "#88CCEE";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(10, 6, 2, 1);
    ctx.fillRect(20, 16, 2, 1);
    ctx.fillRect(6, 22, 1, 1);
    ctx.fillStyle = "#AADDFF";
    ctx.globalAlpha = 0.3;
    ctx.fillRect(16, 10, 1, 1);
    ctx.fillRect(24, 24, 1, 1);
    ctx.globalAlpha = 1;
  });

  // Sand - dunes, pebbles
  generateTileTexture(scene, "tile_sand", "#8A7A4A", (ctx) => {
    // Dune lines
    ctx.fillStyle = "#9A8A5A";
    ctx.globalAlpha = 0.25;
    ctx.fillRect(3, 10, 26, 1);
    ctx.fillRect(6, 22, 20, 1);
    ctx.globalAlpha = 0.15;
    ctx.fillRect(10, 4, 14, 1);
    ctx.fillRect(2, 16, 18, 1);
    ctx.globalAlpha = 1;
    // Light patches
    ctx.fillStyle = "#A89A5A";
    ctx.globalAlpha = 0.2;
    ctx.fillRect(8, 6, 6, 4);
    ctx.fillRect(18, 18, 8, 5);
    ctx.globalAlpha = 1;
    // Scattered pebbles
    ctx.fillStyle = "#7A6A3A";
    ctx.fillRect(14, 18, 2, 2);
    ctx.fillRect(8, 26, 2, 1);
    ctx.fillRect(22, 8, 1, 1);
  });

  // Wall - brick pattern with highlights
  generateTileTexture(scene, "tile_wall", "#3A3A42", (ctx, w, h) => {
    // Brick lines
    ctx.fillStyle = "#000000";
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, w, 1);
    ctx.fillRect(0, 0, 1, h);
    ctx.fillRect(0, 16, w, 1);
    ctx.fillRect(14, 0, 1, 16);
    ctx.fillRect(26, 16, 1, 16);
    ctx.fillRect(8, 16, 1, 16);
    ctx.globalAlpha = 1;
    // Highlight on some bricks
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.08;
    ctx.fillRect(2, 2, 10, 1);
    ctx.fillRect(16, 18, 8, 1);
    ctx.fillRect(2, 4, 1, 6);
    ctx.globalAlpha = 1;
    // Darker mortar
    ctx.fillStyle = "#2A2A30";
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 15, w, 2);
    ctx.globalAlpha = 1;
  });

  // Tree - detailed canopy, trunk, roots
  generateTileTexture(scene, "tile_tree", "#1A3A12", (ctx, w) => {
    // Ground shadow
    ctx.fillStyle = "#122A0E";
    ctx.fillRect(2, 22, w - 4, 10);
    // Trunk
    ctx.fillStyle = "#3A2812";
    ctx.fillRect(12, 12, 8, 20);
    // Trunk detail (bark)
    ctx.fillStyle = "#2A1A08";
    ctx.globalAlpha = 0.4;
    ctx.fillRect(13, 16, 2, 4);
    ctx.fillRect(17, 20, 2, 3);
    ctx.fillRect(14, 26, 1, 3);
    ctx.globalAlpha = 1;
    // Roots
    ctx.fillStyle = "#3A2812";
    ctx.fillRect(10, 28, 3, 2);
    ctx.fillRect(19, 28, 3, 2);
    // Canopy layers (back to front for depth)
    ctx.fillStyle = "#1A4A0E";
    ctx.beginPath();
    ctx.arc(12, 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, 11, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#224E16";
    ctx.beginPath();
    ctx.arc(16, 7, 10, 0, Math.PI * 2);
    ctx.fill();
    // Highlight leaves
    ctx.fillStyle = "#2A5A1E";
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(14, 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Individual leaf clusters
    ctx.fillStyle = "#3A6A2A";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(8, 4, 3, 2);
    ctx.fillRect(18, 2, 2, 2);
    ctx.fillRect(22, 8, 2, 3);
    ctx.globalAlpha = 1;
  });

  // Floor - wooden planks
  generateTileTexture(scene, "tile_floor", "#6A5E4A", (ctx, w, h) => {
    // Plank lines
    ctx.fillStyle = "#000000";
    ctx.globalAlpha = 0.12;
    ctx.fillRect(0, 0, w, 1);
    ctx.fillRect(0, 0, 1, h);
    ctx.fillRect(0, 8, w, 1);
    ctx.fillRect(0, 16, w, 1);
    ctx.fillRect(0, 24, w, 1);
    ctx.globalAlpha = 1;
    // Grain highlights
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.06;
    ctx.fillRect(2, 2, 8, 1);
    ctx.fillRect(14, 10, 6, 1);
    ctx.fillRect(4, 18, 10, 1);
    ctx.fillRect(20, 26, 8, 1);
    ctx.globalAlpha = 1;
    // Knot
    ctx.fillStyle = "#5A4E3A";
    ctx.fillRect(20, 4, 3, 3);
  });

  // Bridge - wooden planks with railings
  generateTileTexture(scene, "tile_bridge", "#5A4A1A", (ctx, w, h) => {
    // Plank gaps
    ctx.fillStyle = "#3A2A0A";
    ctx.globalAlpha = 0.35;
    for (let y = 0; y < h; y += 8) {
      ctx.fillRect(0, y + 1, w, 1);
    }
    ctx.globalAlpha = 1;
    // Railings
    ctx.fillStyle = "#4A3A10";
    ctx.globalAlpha = 0.6;
    ctx.fillRect(0, 0, 2, h);
    ctx.fillRect(w - 2, 0, 2, h);
    ctx.globalAlpha = 1;
    // Plank highlights
    ctx.fillStyle = "#6A5A2A";
    ctx.globalAlpha = 0.2;
    ctx.fillRect(4, 3, 10, 1);
    ctx.fillRect(8, 11, 12, 1);
    ctx.fillRect(6, 19, 8, 1);
    ctx.fillRect(12, 27, 10, 1);
    ctx.globalAlpha = 1;
    // Nail heads
    ctx.fillStyle = "#333333";
    ctx.fillRect(3, 4, 1, 1);
    ctx.fillRect(28, 12, 1, 1);
    ctx.fillRect(3, 20, 1, 1);
    ctx.fillRect(28, 28, 1, 1);
  });

  // Lava - glowing flow, dark crust, bright spots
  generateTileTexture(scene, "tile_lava", "#882200", (ctx) => {
    // Dark crust areas
    ctx.fillStyle = "#551100";
    ctx.fillRect(0, 0, 10, 8);
    ctx.fillRect(20, 18, 12, 8);
    ctx.fillRect(24, 0, 8, 6);
    // Bright lava flow
    ctx.fillStyle = "#CC4400";
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(12, 16, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FF6600";
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(20, 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Hot spots (yellow-white)
    ctx.fillStyle = "#FFCC00";
    ctx.globalAlpha = 0.4;
    ctx.fillRect(10, 14, 4, 2);
    ctx.fillRect(18, 8, 3, 2);
    ctx.globalAlpha = 1;
    // Embers
    ctx.fillStyle = "#FF8800";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(6, 10, 2, 1);
    ctx.fillRect(26, 20, 1, 1);
    ctx.fillRect(14, 26, 2, 1);
    ctx.globalAlpha = 1;
    // Crust edge cracks
    ctx.fillStyle = "#FF4400";
    ctx.globalAlpha = 0.3;
    ctx.fillRect(8, 6, 1, 3);
    ctx.fillRect(22, 16, 1, 2);
    ctx.globalAlpha = 1;
  });

  // Snow - sparkles, footprint hints, varied white
  generateTileTexture(scene, "tile_snow", "#C0C5CC", (ctx) => {
    // Lighter patches
    ctx.fillStyle = "#D0D5DC";
    ctx.fillRect(4, 4, 10, 8);
    ctx.fillRect(18, 16, 10, 10);
    ctx.fillRect(2, 20, 6, 6);
    // Sparkle highlights
    ctx.fillStyle = "#FFFFFF";
    ctx.globalAlpha = 0.4;
    ctx.fillRect(8, 10, 2, 1);
    ctx.fillRect(22, 6, 1, 1);
    ctx.fillRect(14, 22, 1, 1);
    ctx.fillRect(26, 14, 2, 1);
    ctx.globalAlpha = 1;
    // Subtle blue shadows
    ctx.fillStyle = "#A8B0C0";
    ctx.globalAlpha = 0.2;
    ctx.fillRect(12, 8, 4, 2);
    ctx.fillRect(6, 26, 3, 2);
    ctx.globalAlpha = 1;
    // Footprint impressions
    ctx.fillStyle = "#B0B5BC";
    ctx.globalAlpha = 0.3;
    ctx.fillRect(14, 20, 3, 2);
    ctx.fillRect(16, 24, 3, 2);
    ctx.globalAlpha = 1;
  });

  // Ice
  generateTileTexture(scene, "tile_ice", "#6A9AB8", (ctx) => {
    // Crack lines
    ctx.fillStyle = "#8ABACE";
    ctx.globalAlpha = 0.35;
    ctx.fillRect(8, 4, 1, 12);
    ctx.fillRect(14, 10, 10, 1);
    ctx.fillRect(22, 2, 1, 8);
    ctx.fillRect(4, 18, 1, 10);
    ctx.globalAlpha = 1;
    // Reflective highlights
    ctx.fillStyle = "#AADDEE";
    ctx.globalAlpha = 0.3;
    ctx.fillRect(12, 8, 4, 1);
    ctx.fillRect(4, 18, 6, 1);
    ctx.fillRect(20, 22, 3, 1);
    ctx.globalAlpha = 1;
    // Bright spot
    ctx.fillStyle = "#CCEEFF";
    ctx.globalAlpha = 0.2;
    ctx.fillRect(14, 14, 3, 2);
    ctx.globalAlpha = 1;
  });

  // Swamp
  generateTileTexture(scene, "tile_swamp", "#2A3A1A", (ctx) => {
    ctx.fillStyle = "#1A2A0E";
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(14, 14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3A4A2A";
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(8, 20, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Bubbles
    ctx.fillStyle = "#4A5A3A";
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(18, 24, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, 8, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(24, 12, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Reeds
    ctx.fillStyle = "#3A5A2A";
    ctx.fillRect(4, 4, 1, 5);
    ctx.fillRect(26, 16, 1, 4);
  });

  // Dark stone
  generateTileTexture(scene, "tile_dark_stone", "#222228", (ctx, w, h) => {
    ctx.fillStyle = "#000000";
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, 0, w, 1);
    ctx.fillRect(0, 0, 1, h);
    ctx.fillRect(0, 16, w, 1);
    ctx.fillRect(16, 0, 1, 16);
    ctx.fillRect(8, 16, 1, 16);
    ctx.globalAlpha = 1;
    // Faint blue crystal
    ctx.fillStyle = "#334466";
    ctx.globalAlpha = 0.2;
    ctx.fillRect(20, 22, 3, 4);
    ctx.fillRect(21, 21, 1, 1);
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#445588";
    ctx.fillRect(19, 24, 1, 1);
    ctx.globalAlpha = 1;
  });

  // Portal
  generateTileTexture(scene, "tile_portal", "#5A2A7A", (ctx, w) => {
    const cx = w / 2;
    const cy = w / 2;
    ctx.fillStyle = "#8A4AAA";
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#AA6ACC";
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#CC88EE";
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#DDAAFF";
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

// ---- Map TileType enum to texture key ----
const TILE_VARIANT_COUNT: Record<number, number> = {
  0: 3, // GRASS has 3 variants
  13: 2, // DARK_GRASS has 2 variants
  2: 2, // STONE has 2 variants
};

export function getTileTextureKey(tileType: number, variant?: number): string {
  const BASE_MAP: Record<number, string> = {
    0: "tile_grass",
    1: "tile_dirt",
    2: "tile_stone",
    3: "tile_water",
    4: "tile_sand",
    5: "tile_wall",
    6: "tile_tree",
    7: "tile_floor",
    8: "tile_bridge",
    9: "tile_lava",
    10: "tile_snow",
    11: "tile_ice",
    12: "tile_swamp",
    13: "tile_dark_grass",
    14: "tile_dark_stone",
    15: "tile_portal",
  };

  const base = BASE_MAP[tileType] || "tile_grass";
  const maxVariants = TILE_VARIANT_COUNT[tileType] || 1;

  if (maxVariants <= 1 || variant === undefined || variant === 0) {
    return base;
  }

  return `${base}_v${variant}`;
}

/** Get number of variants for a tile type */
export function getTileVariantCount(tileType: number): number {
  return TILE_VARIANT_COUNT[tileType] || 1;
}

// ================================================================
// Effect textures (slash arcs, particles, etc.)
// ================================================================

function generateEffectTextures(scene: Phaser.Scene): void {
  // Slash arc texture (white arc)
  if (!scene.textures.exists("fx_slash")) {
    const ct = scene.textures.createCanvas("fx_slash", 48, 48);
    if (ct) {
      const ctx = ct.getContext();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(24, 24, 18, -Math.PI * 0.8, Math.PI * 0.3, false);
      ctx.stroke();
      // Inner brighter arc
      ctx.strokeStyle = "#FFFFCC";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(24, 24, 16, -Math.PI * 0.7, Math.PI * 0.2, false);
      ctx.stroke();
      ct.refresh();
    }
  }

  // Magic projectile (small glowing orb)
  if (!scene.textures.exists("fx_magic_orb")) {
    const ct = scene.textures.createCanvas("fx_magic_orb", 16, 16);
    if (ct) {
      const ctx = ct.getContext();
      // Outer glow
      ctx.fillStyle = "#FFFFFF";
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(8, 8, 7, 0, Math.PI * 2);
      ctx.fill();
      // Mid
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(8, 8, 5, 0, Math.PI * 2);
      ctx.fill();
      // Core
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(8, 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ct.refresh();
    }
  }

  // Heal particle (green sparkle)
  if (!scene.textures.exists("fx_heal")) {
    const ct = scene.textures.createCanvas("fx_heal", 12, 12);
    if (ct) {
      const ctx = ct.getContext();
      ctx.fillStyle = "#44FF66";
      ctx.globalAlpha = 0.8;
      // Cross shape
      ctx.fillRect(4, 1, 4, 10);
      ctx.fillRect(1, 4, 10, 4);
      // Bright center
      ctx.fillStyle = "#AAFFBB";
      ctx.fillRect(5, 5, 2, 2);
      ct.refresh();
    }
  }

  // Generic particle (circle)
  if (!scene.textures.exists("fx_particle")) {
    const ct = scene.textures.createCanvas("fx_particle", 8, 8);
    if (ct) {
      const ctx = ct.getContext();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(4, 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(4, 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ct.refresh();
    }
  }

  // Star burst (for crits)
  if (!scene.textures.exists("fx_star")) {
    const ct = scene.textures.createCanvas("fx_star", 16, 16);
    if (ct) {
      const ctx = ct.getContext();
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const innerAngle = angle + Math.PI / 5;
        const outerR = 7;
        const innerR = 3;
        if (i === 0)
          ctx.moveTo(
            8 + Math.cos(angle) * outerR,
            8 + Math.sin(angle) * outerR,
          );
        else
          ctx.lineTo(
            8 + Math.cos(angle) * outerR,
            8 + Math.sin(angle) * outerR,
          );
        ctx.lineTo(
          8 + Math.cos(innerAngle) * innerR,
          8 + Math.sin(innerAngle) * innerR,
        );
      }
      ctx.closePath();
      ctx.fill();
      ct.refresh();
    }
  }
}
