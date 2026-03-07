// ============================================
// VocaQuest Online - Pixel Art Sprite Generator
// Pre-renders all entity textures at startup
// ============================================

import Phaser from "phaser";

const PX = 2; // Each art pixel = 2x2 screen pixels

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
      // Check if any neighbor is transparent
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
// PLAYER SPRITES (16x22 pixel art)
// ================================================================

const WARRIOR_PALETTE: Record<string, string> = {
  h: "#8B4513",
  H: "#6B3410", // hair
  s: "#FFD5B4",
  S: "#D4A880", // skin
  e: "#1a1a1a", // eyes
  m: "#C47A6A", // mouth
  a: "#CC3333",
  A: "#991818", // armor
  g: "#FFD700", // gold trim
  b: "#5C3A1E",
  B: "#3A2210", // boots
  p: "#4A3728",
  P: "#382818", // pants
  w: "#C8C8C8",
  W: "#888888", // weapon (sword)
  G: "#AA8800", // guard
  c: "#AA2222", // cape
};
const WARRIOR_ART = [
  "......hhhh......",
  ".....Hhhhhh.....",
  ".....hhHhhh.....",
  ".....ssssss.....",
  ".....se.ses.....",
  ".....sSmSss.....",
  "......ssss......",
  "......gaag......",
  ".....AaaaAA.....",
  "....AaaaaAAw....",
  "...sAaaaaAAw....",
  "...sAaaaaAAWw...",
  "....gaaaaaGWw...",
  "....AaaaaAA.....",
  "....AaaaaAA.....",
  "....pppppppp....",
  "....pp....pp....",
  "....pp....pp....",
  "....pP....pP....",
  "....bB....bB....",
  "....BB....BB....",
  "................",
];

const KNIGHT_PALETTE: Record<string, string> = {
  h: "#2F2F2F",
  H: "#1a1a1a", // hair
  s: "#FFD5B4",
  S: "#D4A880", // skin
  e: "#1a1a1a", // eyes
  m: "#C47A6A", // mouth
  a: "#4169E1",
  A: "#2A4A9A", // armor
  g: "#FFD700", // gold trim
  b: "#4A4A5A",
  B: "#333340", // boots (metal)
  p: "#3A3A4A",
  P: "#2A2A38", // pants
  d: "#4A69A1",
  D: "#3A5A8A", // shield
  l: "#888888",
  L: "#666666", // lance
  c: "#6688BB", // cape
};
const KNIGHT_ART = [
  "......hhhh......",
  ".....Hhhhhh.....",
  ".....hHhHhh.....",
  ".....ssssss.....",
  ".....se.ses.....",
  ".....sSmSss.....",
  "......ssss......",
  "......gaag......",
  "....dAaaaaAL....",
  "...dDAaaaaALL...",
  "...dDAaaaaALL...",
  "...dgAaaaaALL...",
  "...dDgaaaagL....",
  "....dAaaaaA.....",
  "....AaaaaAA.....",
  "....pppppppp....",
  "....pp....pp....",
  "....pp....pp....",
  "....pP....pP....",
  "....bB....bB....",
  "....BB....BB....",
  "................",
];

const MAGE_PALETTE: Record<string, string> = {
  h: "#C0C0C0",
  H: "#909090", // hair (silver)
  s: "#FFD5B4",
  S: "#D4A880", // skin
  e: "#1a1a1a", // eyes
  m: "#C47A6A", // mouth
  a: "#7E57C2",
  A: "#5A3A9A", // robe
  g: "#FFD700", // gold trim
  b: "#5A3A9A",
  B: "#3A2270", // boots
  p: "#6A48AA",
  P: "#5A3A9A", // pants (robe)
  t: "#4A148C",
  T: "#2A0860", // hat
  c: "#9B59B6",
  C: "#C77DFF", // crystal
  w: "#8B4513", // staff wood
};
const MAGE_ART = [
  ".......Tg.......",
  "......TTT.......",
  ".....TTTTT......",
  ".....hhhhh......",
  ".....ssssss.....",
  ".....se.ses.....",
  ".....sSmSss.....",
  "......ssss......",
  "......gaag......",
  "....AaaaaAw.....",
  "...sAaaaaAwC....",
  "...sAaaaaAwc....",
  "....gaaaaaAw....",
  "....AaaaaAA.....",
  "....AAAAAAA.....",
  "...AAAAAAAAA....",
  "...AAp..pAAA....",
  "....pp....pp....",
  "....pP....pP....",
  "....bB....bB....",
  "....BB....BB....",
  "................",
];

const ARCHER_PALETTE: Record<string, string> = {
  h: "#228B22",
  H: "#186818", // hair (green)
  s: "#FFD5B4",
  S: "#D4A880", // skin
  e: "#1a1a1a", // eyes
  m: "#C47A6A", // mouth
  a: "#4CAF50",
  A: "#2E7D32", // armor (leather)
  g: "#8B6914", // leather trim
  b: "#5C3A1E",
  B: "#3A2210", // boots
  p: "#4A6A28",
  P: "#3A5A18", // pants
  w: "#8B4513",
  W: "#6B3410", // bow
  q: "#8B4513", // quiver
  r: "#C0C0C0", // arrows
};
const ARCHER_ART = [
  "......hhhh......",
  ".....Hhhhhh.....",
  ".....hhHhhh.....",
  ".....ssssss.....",
  ".....se.ses.....",
  ".....sSmSss.....",
  "......ssss......",
  "......gaag......",
  "....AaaaaAqr....",
  "..W.AaaaaAqr....",
  "..W.AaaaaAqr....",
  "..WsAaaaaAq.....",
  "..W.gaaaaaA.....",
  "....AaaaaAA.....",
  "....AaaaaAA.....",
  "....pppppppp....",
  "....pp....pp....",
  "....pp....pp....",
  "....pP....pP....",
  "....bB....bB....",
  "....BB....BB....",
  "................",
];

// Walk frame: shift legs
const WARRIOR_WALK = [...WARRIOR_ART];
WARRIOR_WALK[16] = "...pp......pp...";
WARRIOR_WALK[17] = "...pp......pp...";
WARRIOR_WALK[18] = "...pP......pP...";
WARRIOR_WALK[19] = "...bB......bB...";
WARRIOR_WALK[20] = "...BB......BB...";

const KNIGHT_WALK = [...KNIGHT_ART];
KNIGHT_WALK[16] = "...pp......pp...";
KNIGHT_WALK[17] = "...pp......pp...";
KNIGHT_WALK[18] = "...pP......pP...";
KNIGHT_WALK[19] = "...bB......bB...";
KNIGHT_WALK[20] = "...BB......BB...";

const MAGE_WALK = [...MAGE_ART];
MAGE_WALK[17] = "...pp......pp...";
MAGE_WALK[18] = "...pP......pP...";
MAGE_WALK[19] = "...bB......bB...";
MAGE_WALK[20] = "...BB......BB...";

const ARCHER_WALK = [...ARCHER_ART];
ARCHER_WALK[16] = "...pp......pp...";
ARCHER_WALK[17] = "...pp......pp...";
ARCHER_WALK[18] = "...pP......pP...";
ARCHER_WALK[19] = "...bB......bB...";
ARCHER_WALK[20] = "...BB......BB...";

// ================================================================
// MOB SPRITES
// ================================================================

// ---- Slime (14x12) ----
const SLIME_PALETTE: Record<string, string> = {
  g: "#44CC66",
  G: "#2AAA48",
  l: "#66EE88",
  L: "#88FFAA",
  w: "#FFFFFF",
  e: "#222222",
  d: "#1A8838",
};
const SLIME_ART = [
  "..............",
  "......gg......",
  "....ggllgg....",
  "...glLllLlg...",
  "..gglwegwelg..",
  "..gggggggggg..",
  ".gGggggggggGg.",
  ".gGGgggggGGGg.",
  ".gGGGGgGGGGGg.",
  "..GGGGGGGGGg..",
  "...dGGGGGGd...",
  "..............",
];

// ---- Wolf (18x14) ----
const WOLF_PALETTE: Record<string, string> = {
  b: "#8B7355",
  B: "#6B5535",
  d: "#5A4A30",
  D: "#4A3A22",
  e: "#FF3333",
  n: "#444444",
  w: "#CCBB99",
  t: "#AA9977",
};
const WOLF_ART = [
  "..................",
  "..bd.............",
  ".bBbd............",
  ".BBBb...bbbbbb...",
  "..nBb..bbbbbbbbt.",
  "..eBb.bbBBBBBbb..",
  "..bBbbbbBBBBBbb..",
  "...bbbbbBBBBbb...",
  "....bbbbBBBBb....",
  "....bD.bB.bDb....",
  "....bD.bB.bDb....",
  "....DD.BB.bDD....",
  "....DD..B..DD....",
  "..................",
];

// ---- Goblin (14x18) ----
const GOBLIN_PALETTE: Record<string, string> = {
  g: "#6B8E23",
  G: "#4A6A12",
  s: "#8BAA33",
  S: "#5A7A1A",
  y: "#FFFF00",
  e: "#222222",
  c: "#8B4513",
  C: "#6B3410",
  p: "#4A3A28",
  b: "#3A2A18",
};
const GOBLIN_ART = [
  "..............",
  ".....gggg.....",
  "....gggggg....",
  "..g.gggggg.g..",
  "..Gg.yeye.gG..",
  "...ggggggg.g..",
  "....ggssgg....",
  ".....gggg.....",
  "....GgggGc....",
  "...gGggggGCc..",
  "...sGggggGCc..",
  "...sGggggGc...",
  "....GgGGgG....",
  "....pp..pp....",
  "....pp..pp....",
  "....pp..pp....",
  "....bb..bb....",
  "..............",
];

// ---- Skeleton (14x20) ----
const SKEL_PALETTE: Record<string, string> = {
  w: "#E8E8D5",
  W: "#C8C8B5",
  d: "#AAAAAA",
  r: "#FF2222",
  e: "#222222",
  b: "#888888",
  g: "#666666",
};
const SKEL_ART = [
  "..............",
  ".....wwww.....",
  "....wwwwww....",
  "....wrewrew...",
  "....wwwwwww...",
  ".....wddww....",
  "......ww......",
  ".....wwwww....",
  "....wwwwwww...",
  "..wwwwewwwww..",
  "..ww.www.ww...",
  ".....wwwww....",
  "....wwwwwww...",
  ".....wwwww....",
  ".....ww.ww....",
  ".....ww.ww....",
  ".....ww.ww....",
  ".....gg.gg....",
  ".....gg.gg....",
  "..............",
];

// ---- Spider (16x12) ----
const SPIDER_PALETTE: Record<string, string> = {
  b: "#2F2F2F",
  B: "#1A1A1A",
  r: "#FF2222",
  d: "#444444",
  l: "#3A3A3A",
};
const SPIDER_ART = [
  "................",
  "..l..bbbb..l....",
  ".l..bBBBBb..l...",
  "l..bBBBBBBb..l..",
  "..bBBrBrBBBb....",
  ".bBBBBBBBBBBb...",
  "l.bBBBBBBBBb.l..",
  ".l.bBBBBBBb.l...",
  "..l.bbbbbb.l....",
  "...l......l.....",
  "..l........l....",
  "................",
];

// ---- Dragon (20x20, boss) ----
const DRAGON_PALETTE: Record<string, string> = {
  r: "#CC2200",
  R: "#881500",
  d: "#660E00",
  y: "#FFCC00",
  e: "#FFE066",
  b: "#222222",
  o: "#FF6600",
  w: "#AA1800",
  g: "#CCAA44",
  f: "#FF8800",
  F: "#FF4400",
};
const DRAGON_ART = [
  "....................",
  "..g.........g......",
  "..gr........rg.....",
  "...rr..rrrr.rr.....",
  "...rr.rrrrrrrr.....",
  "....rrryeyrrrr.....",
  "....rrrrrrrrrr.....",
  "..w.rrRRRRRrrr.w...",
  ".ww.rRRRRRRRrr.ww..",
  ".wwrrrRRRRRRrrr.ww.",
  "..wrrrRRoRRRrrrrw..",
  "..wrrrRRRRRRrrrw...",
  "...rrrRRRRRRrrr....",
  "....rrRRRRRrrr.....",
  ".....rrRRRrrr......",
  ".....brr.rrb.......",
  ".....brr.rrb.......",
  ".....bb...bb.......",
  ".....bb...bb.......",
  "....................",
];

// ---- Ghost (14x16) ----
const GHOST_PALETTE: Record<string, string> = {
  p: "#8866CC",
  P: "#6644AA",
  d: "#5533AA",
  w: "#FFFFFF",
  e: "#222222",
  l: "#AA88EE",
};
const GHOST_ART = [
  "..............",
  "......pp......",
  "....pppppp....",
  "...pppppppp...",
  "...pwepwepp...",
  "...pppppppp...",
  "...pppeeppp...",
  "...pppppppp...",
  "....pppppp....",
  "....PPppPP....",
  "...PPPppPPP...",
  "...PPP..PPP...",
  "..dPPd..dPPd..",
  "..dPd....dPd..",
  "...d......d...",
  "..............",
];

// ---- Demon (18x22, boss) ----
const DEMON_PALETTE: Record<string, string> = {
  r: "#AA2222",
  R: "#771111",
  d: "#551111",
  h: "#333333",
  H: "#222222", // horns
  e: "#FF0000",
  g: "#FF6600", // eyes, glow
  s: "#882222",
  S: "#661111", // skin dark
  w: "#881818",
  W: "#551010", // wings
  b: "#442222",
  B: "#331111", // boots
  c: "#222222", // claws
};
const DEMON_ART = [
  "..................",
  "..H..........H...",
  "..Hh........hH...",
  "...hh.rrrr.hh....",
  "....hrrrrrrrh....",
  "....rrerrrerr....",
  "....rrrrrrrr.....",
  ".....rrrrrrr.....",
  ".W..RrrrrrrR..W..",
  ".WW.RrrrrrRR.WW..",
  "..WWRRrrrrRRWW...",
  "..WSRRrrrrRRSW...",
  "...SRRrrrrRRS....",
  "....RRrrrrRR.....",
  "....RRrrrrRR.....",
  ".....rr.rrr......",
  ".....rr..rr......",
  ".....SS..SS......",
  ".....SS..SS......",
  ".....bb..bb......",
  ".....bB..bB......",
  "..................",
];

// ---- Bear (18x14) ----
const BEAR_PALETTE: Record<string, string> = {
  b: "#6B4423",
  B: "#4A2A12",
  d: "#3A1A08",
  n: "#333333",
  e: "#222222",
  s: "#8B6443",
  l: "#5A3418",
};
const BEAR_ART = [
  "..................",
  "..ss.............",
  ".sBBs............",
  ".eBBe..bbbbbbb...",
  "..nBb.bbBBBBBbb..",
  "..bBbbbbBBBBBBb..",
  "...bbbbbBBBBBbb..",
  "....bbbbBBBBBb...",
  "....bbbbBBBBbb...",
  "....bD.bBB.bDb..",
  "....bD.bBB.bDb..",
  "....DD.BBB.bDD..",
  "....DD..BB..DD..",
  "..................",
];

// ---- Enemy Mage (14x20) ----
const EMAGE_PALETTE: Record<string, string> = {
  r: "#333366",
  R: "#222255",
  d: "#111144",
  e: "#FF4400",
  g: "#FF8800", // eyes
  s: "#9B59B6",
  S: "#7B39A6", // staff crystal
  w: "#8B4513",
  W: "#6B3410", // staff wood
  h: "#222244",
  H: "#111133", // hood
};
const EMAGE_ART = [
  "..............",
  "......Hh......",
  ".....HHhh.....",
  "....HHhhhh....",
  "...HHeehHhh...",
  "...HHhhhHH....",
  "....rrrrrr....",
  "...rrrrrrr.w..",
  "..Rrrrrrrrww..",
  "..RrrrrrrrwS..",
  "..RrrrrrrrwS..",
  "..Rrrrrrrrw...",
  "...rrrrrrrr...",
  "...rrrrrrrr...",
  "..RRrrrrrRR...",
  "..RRRr.rRRR...",
  "...RRr.rRR....",
  "....rr.rr.....",
  "....dd.dd.....",
  "..............",
];

// ---- NPC Merchant (16x22) ----
const NPC_PALETTE: Record<string, string> = {
  h: "#8B4513",
  H: "#6B3410", // hat
  s: "#FFD5B4",
  S: "#D4A880", // skin
  e: "#222222", // eyes
  m: "#C47A6A", // mouth
  a: "#6B4423",
  A: "#4A2A12", // robe
  g: "#FFD700",
  G: "#CCAA00", // gold trim
  b: "#5C3A1E",
  B: "#3A2210", // boots
  p: "#4A3728", // pants
  q: "#FFD700",
  Q: "#CCAA00", // quest marker !
};
const NPC_MERCHANT_ART = [
  "......Qg........",
  "......QQ........",
  ".....HHHH.......",
  "....HhhhHH......",
  "...HHHHHHHH.....",
  ".....ssssss.....",
  ".....se.ses.....",
  ".....sSmSss.....",
  "......ssss......",
  ".....gaaag......",
  "....AaaaaAA.....",
  "...sAaaaaAAs....",
  "...sAaaaaAAs....",
  "....gaaaaaAg....",
  "....AaaaaAAA....",
  "...AAAAAAAAAA...",
  "...AAp...pAAA...",
  "....pp...pp.....",
  "....pp...pp.....",
  "....bB...bB.....",
  "....BB...BB.....",
  "................",
];

// ---- NPC Guide (16x22) ----
const NPC_GUIDE_PALETTE: Record<string, string> = {
  ...NPC_PALETTE,
  a: "#2196F3",
  A: "#1565C0", // blue robe
  h: "#1565C0",
  H: "#0D47A1", // blue hat
};
const NPC_GUIDE_ART = [...NPC_MERCHANT_ART]; // Same shape, different colors

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
  // ---- Player sprites (idle + walk frames) ----
  renderWithOutline(scene, "player_warrior", WARRIOR_ART, WARRIOR_PALETTE);
  renderWithOutline(
    scene,
    "player_warrior_walk",
    WARRIOR_WALK,
    WARRIOR_PALETTE,
  );
  renderWithOutline(scene, "player_knight", KNIGHT_ART, KNIGHT_PALETTE);
  renderWithOutline(scene, "player_knight_walk", KNIGHT_WALK, KNIGHT_PALETTE);
  renderWithOutline(scene, "player_mage", MAGE_ART, MAGE_PALETTE);
  renderWithOutline(scene, "player_mage_walk", MAGE_WALK, MAGE_PALETTE);
  renderWithOutline(scene, "player_archer", ARCHER_ART, ARCHER_PALETTE);
  renderWithOutline(scene, "player_archer_walk", ARCHER_WALK, ARCHER_PALETTE);

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

  // Color variants for slime
  const fireSlimePalette = {
    ...SLIME_PALETTE,
    g: "#FF6633",
    G: "#CC4420",
    l: "#FF8855",
    L: "#FFAA77",
    d: "#AA3318",
  };
  const iceSlimePalette = {
    ...SLIME_PALETTE,
    g: "#66CCFF",
    G: "#4499DD",
    l: "#88DDFF",
    L: "#AAEEFF",
    d: "#3377AA",
  };
  const poisonSlimePalette = {
    ...SLIME_PALETTE,
    g: "#66CC44",
    G: "#44AA22",
    l: "#88EE66",
    L: "#AAFF88",
    d: "#338818",
  };
  renderWithOutline(scene, "mob_fire_slime", SLIME_ART, fireSlimePalette);
  renderWithOutline(scene, "mob_ice_slime", SLIME_ART, iceSlimePalette);
  renderWithOutline(scene, "mob_poison_slime", SLIME_ART, poisonSlimePalette);

  // Color variants for wolf
  const direWolfPalette = {
    ...WOLF_PALETTE,
    b: "#444455",
    B: "#333344",
    d: "#222233",
    w: "#999988",
  };
  const shadowWolfPalette = {
    ...WOLF_PALETTE,
    b: "#333355",
    B: "#222244",
    d: "#111133",
    e: "#CC33FF",
  };
  renderWithOutline(scene, "mob_dire_wolf", WOLF_ART, direWolfPalette);
  renderWithOutline(scene, "mob_shadow_wolf", WOLF_ART, shadowWolfPalette);

  // Zombie variant of skeleton
  const zombiePalette = {
    ...SKEL_PALETTE,
    w: "#556B2F",
    W: "#3A4A1A",
    d: "#445522",
    r: "#882222",
  };
  renderWithOutline(scene, "mob_zombie", SKEL_ART, zombiePalette);

  // Orc variant of goblin
  const orcPalette = {
    ...GOBLIN_PALETTE,
    g: "#556B2F",
    G: "#3A4A1A",
    s: "#6B8A3A",
    y: "#FF8800",
  };
  renderWithOutline(scene, "mob_orc", GOBLIN_ART, orcPalette);

  // ---- NPC sprites ----
  renderWithOutline(scene, "npc_merchant", NPC_MERCHANT_ART, NPC_PALETTE);
  renderWithOutline(scene, "npc_guide", NPC_GUIDE_ART, NPC_GUIDE_PALETTE);

  // Weapon shop NPC
  const weaponNpcPalette = {
    ...NPC_PALETTE,
    a: "#555555",
    A: "#333333",
    h: "#333333",
    H: "#222222",
  };
  renderWithOutline(scene, "npc_weapon", NPC_MERCHANT_ART, weaponNpcPalette);

  // Armor shop NPC
  const armorNpcPalette = {
    ...NPC_PALETTE,
    a: "#4A6FA5",
    A: "#3A5A8A",
    h: "#3A5A8A",
    H: "#2A4A7A",
  };
  renderWithOutline(scene, "npc_armor", NPC_MERCHANT_ART, armorNpcPalette);

  // Potion shop NPC
  const potionNpcPalette = {
    ...NPC_PALETTE,
    a: "#6B2FA0",
    A: "#4A148C",
    h: "#4A148C",
    H: "#2A0860",
  };
  renderWithOutline(scene, "npc_potion", NPC_MERCHANT_ART, potionNpcPalette);

  // Elite shop NPC
  const eliteNpcPalette = {
    ...NPC_PALETTE,
    a: "#8B0000",
    A: "#660000",
    h: "#660000",
    H: "#440000",
  };
  renderWithOutline(scene, "npc_elite", NPC_MERCHANT_ART, eliteNpcPalette);

  // ---- Tile textures ----
  generateTileTextures(scene);
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

  if (id.includes("spider") || id.includes("scorpion")) return "mob_spider";

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
    id.includes("void")
  )
    return "mob_demon";

  if (
    id.includes("golem") ||
    id.includes("guardian") ||
    id.includes("knight") ||
    id.includes("warrior")
  )
    return "mob_skeleton"; // fallback

  if (id.includes("snake") || id.includes("serpent") || id.includes("worm"))
    return "mob_slime"; // fallback

  return "mob_goblin"; // default fallback
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

// ---- Get player texture key ----
export function getPlayerTextureKey(
  playerClass: string,
  walking: boolean = false,
): string {
  const suffix = walking ? "_walk" : "";
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
// Tile texture generation
// ================================================================

function generateTileTextures(scene: Phaser.Scene): void {
  const S = 32;

  // Grass tile with tufts
  generateTileTexture(scene, "tile_grass", "#2E5A22", (ctx, w) => {
    // Variation patches
    ctx.fillStyle = "#3A6A2E";
    ctx.fillRect(4, 4, 8, 6);
    ctx.fillRect(18, 14, 10, 8);
    // Grass tufts
    ctx.fillStyle = "#4A7A3A";
    ctx.fillRect(6, 10, 1, 4);
    ctx.fillRect(8, 11, 1, 3);
    ctx.fillRect(22, 6, 1, 4);
    ctx.fillRect(24, 7, 1, 3);
    ctx.fillRect(14, 20, 1, 3);
  });

  // Dark grass
  generateTileTexture(scene, "tile_dark_grass", "#1A2E18", (ctx) => {
    ctx.fillStyle = "#223A1E";
    ctx.fillRect(2, 8, 10, 8);
    ctx.fillRect(16, 2, 12, 10);
    ctx.fillStyle = "#2A4A24";
    ctx.fillRect(8, 14, 1, 3);
    ctx.fillRect(20, 18, 1, 3);
  });

  // Dirt
  generateTileTexture(scene, "tile_dirt", "#5C4A32", (ctx) => {
    ctx.fillStyle = "#4A3A28";
    ctx.fillRect(6, 4, 6, 4);
    ctx.fillRect(20, 18, 8, 6);
    // Pebbles
    ctx.fillStyle = "#6A5A42";
    ctx.fillRect(10, 14, 3, 2);
    ctx.fillRect(24, 8, 2, 2);
    ctx.fillStyle = "#4A3A22";
    ctx.fillRect(4, 22, 2, 2);
  });

  // Stone
  generateTileTexture(scene, "tile_stone", "#555560", (ctx, w, h) => {
    // Brick pattern
    ctx.fillStyle = "#000000";
    ctx.globalAlpha = 0.2;
    ctx.fillRect(0, 0, w, 1);
    ctx.fillRect(0, 0, 1, h);
    ctx.fillRect(0, 15, w, 1);
    ctx.fillRect(12, 0, 1, 16);
    ctx.fillRect(24, 16, 1, 16);
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(2, 2, 8, 1);
    ctx.fillRect(14, 18, 8, 1);
    ctx.globalAlpha = 1;
  });

  // Water
  generateTileTexture(scene, "tile_water", "#1A4A7A", (ctx, w) => {
    ctx.fillStyle = "#0E3A5E";
    ctx.globalAlpha = 0.4;
    ctx.fillRect(1, 1, w - 2, w - 2);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#3A7AAA";
    ctx.fillRect(3, 8, 20, 1);
    ctx.fillRect(8, 20, 16, 1);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#4A8ABA";
    ctx.fillRect(6, 14, 12, 1);
    ctx.globalAlpha = 1;
  });

  // Sand
  generateTileTexture(scene, "tile_sand", "#8A7A4A", (ctx) => {
    ctx.fillStyle = "#9A8A5A";
    ctx.globalAlpha = 0.2;
    ctx.fillRect(3, 10, 26, 1);
    ctx.fillRect(6, 22, 20, 1);
    ctx.globalAlpha = 0.15;
    ctx.fillRect(10, 4, 14, 1);
    ctx.globalAlpha = 1;
  });

  // Wall
  generateTileTexture(scene, "tile_wall", "#3A3A42", (ctx, w, h) => {
    ctx.fillStyle = "#000000";
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, 0, w, 1);
    ctx.fillRect(0, 0, 1, h);
    ctx.fillRect(0, 16, w, 1);
    ctx.fillRect(14, 0, 1, 16);
    ctx.fillRect(26, 16, 1, 16);
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(2, 2, 10, 1);
    ctx.fillRect(16, 18, 8, 1);
    ctx.globalAlpha = 1;
  });

  // Tree
  generateTileTexture(scene, "tile_tree", "#1A3A12", (ctx, w) => {
    // Root area
    ctx.fillStyle = "#122A0E";
    ctx.fillRect(2, 22, w - 4, 10);
    // Trunk
    ctx.fillStyle = "#3A2812";
    ctx.fillRect(12, 12, 8, 20);
    // Bark detail
    ctx.fillStyle = "#2A1A08";
    ctx.globalAlpha = 0.4;
    ctx.fillRect(14, 16, 2, 4);
    ctx.fillRect(17, 20, 2, 3);
    ctx.globalAlpha = 1;
    // Canopy layers
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
    // Highlight
    ctx.fillStyle = "#2A5A1E";
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(14, 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // Floor
  generateTileTexture(scene, "tile_floor", "#6A5E4A", (ctx, w, h) => {
    ctx.fillStyle = "#000000";
    ctx.globalAlpha = 0.12;
    ctx.fillRect(0, 0, w, 1);
    ctx.fillRect(0, 0, 1, h);
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(2, 2, 6, 1);
    ctx.globalAlpha = 1;
  });

  // Bridge
  generateTileTexture(scene, "tile_bridge", "#5A4A1A", (ctx, w, h) => {
    ctx.fillStyle = "#3A2A0A";
    ctx.globalAlpha = 0.3;
    for (let y = 0; y < h; y += 8) {
      ctx.fillRect(0, y + 1, w, 1);
    }
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, 0, 2, h);
    ctx.fillRect(w - 2, 0, 2, h);
    ctx.globalAlpha = 1;
  });

  // Lava
  generateTileTexture(scene, "tile_lava", "#AA2200", (ctx) => {
    ctx.fillStyle = "#CC4400";
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(12, 16, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FF8800";
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(20, 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // Snow
  generateTileTexture(scene, "tile_snow", "#C0C5CC", (ctx) => {
    ctx.fillStyle = "#D0D5DC";
    ctx.fillRect(4, 4, 10, 8);
    ctx.fillRect(18, 16, 8, 10);
    ctx.fillStyle = "#FFFFFF";
    ctx.globalAlpha = 0.3;
    ctx.fillRect(8, 10, 2, 2);
    ctx.fillRect(22, 6, 2, 2);
    ctx.globalAlpha = 1;
  });

  // Ice
  generateTileTexture(scene, "tile_ice", "#6A9AB8", (ctx) => {
    ctx.fillStyle = "#8ABACE";
    ctx.globalAlpha = 0.3;
    ctx.fillRect(8, 4, 1, 12);
    ctx.fillRect(14, 10, 10, 1);
    ctx.fillRect(22, 2, 1, 8);
    ctx.globalAlpha = 1;
  });

  // Swamp
  generateTileTexture(scene, "tile_swamp", "#2A3A1A", (ctx) => {
    ctx.fillStyle = "#1A2A0E";
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(14, 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3A4A2A";
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(8, 20, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
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
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#DDAAFF";
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

// ---- Map TileType enum to texture key ----
export function getTileTextureKey(tileType: number): string {
  const MAP: Record<number, string> = {
    0: "tile_grass", // GRASS
    1: "tile_dirt", // DIRT
    2: "tile_stone", // STONE
    3: "tile_water", // WATER
    4: "tile_sand", // SAND
    5: "tile_wall", // WALL
    6: "tile_tree", // TREE
    7: "tile_floor", // FLOOR
    8: "tile_bridge", // BRIDGE
    9: "tile_lava", // LAVA
    10: "tile_snow", // SNOW
    11: "tile_ice", // ICE
    12: "tile_swamp", // SWAMP
    13: "tile_dark_grass", // DARK_GRASS
    14: "tile_dark_stone", // DARK_STONE
    15: "tile_portal", // PORTAL
  };
  return MAP[tileType] || "tile_grass";
}
