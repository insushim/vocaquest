// ============================================
// VocaQuest Online - Pixel Art Sprite Generator v2
// 32x32 sprites with 4-direction support,
// 3-frame walk cycles, visible weapons, and
// unique mob silhouettes
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
// PLAYER SPRITES (16x22 pixel art, kept for compatibility)
// Now with 3-frame walk cycle (idle, step-L, step-R)
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
  H: "#1a1a1a",
  s: "#FFD5B4",
  S: "#D4A880",
  e: "#1a1a1a",
  m: "#C47A6A",
  a: "#4169E1",
  A: "#2A4A9A",
  g: "#FFD700",
  b: "#4A4A5A",
  B: "#333340",
  p: "#3A3A4A",
  P: "#2A2A38",
  d: "#4A69A1",
  D: "#3A5A8A",
  l: "#888888",
  L: "#666666",
  c: "#6688BB",
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
  H: "#909090",
  s: "#FFD5B4",
  S: "#D4A880",
  e: "#1a1a1a",
  m: "#C47A6A",
  a: "#7E57C2",
  A: "#5A3A9A",
  g: "#FFD700",
  b: "#5A3A9A",
  B: "#3A2270",
  p: "#6A48AA",
  P: "#5A3A9A",
  t: "#4A148C",
  T: "#2A0860",
  c: "#9B59B6",
  C: "#C77DFF",
  w: "#8B4513",
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
  H: "#186818",
  s: "#FFD5B4",
  S: "#D4A880",
  e: "#1a1a1a",
  m: "#C47A6A",
  a: "#4CAF50",
  A: "#2E7D32",
  g: "#8B6914",
  b: "#5C3A1E",
  B: "#3A2210",
  p: "#4A6A28",
  P: "#3A5A18",
  w: "#8B4513",
  W: "#6B3410",
  q: "#8B4513",
  r: "#C0C0C0",
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

// Walk frame 1 (step left): left leg forward, right leg back
function makeWalkFrame1(base: string[]): string[] {
  const walk = [...base];
  walk[16] = "...pp......pp...";
  walk[17] = "...pp......pp...";
  walk[18] = "...pP......pP...";
  walk[19] = "...bB......bB...";
  walk[20] = "...BB......BB...";
  return walk;
}

// Walk frame 2 (step right): right leg forward, left leg back
function makeWalkFrame2(base: string[]): string[] {
  const walk = [...base];
  walk[16] = ".....pp..pp.....";
  walk[17] = ".....pp..pp.....";
  walk[18] = ".....pP..pP.....";
  walk[19] = ".....bB..bB.....";
  walk[20] = ".....BB..BB.....";
  return walk;
}

const WARRIOR_WALK1 = makeWalkFrame1(WARRIOR_ART);
const WARRIOR_WALK2 = makeWalkFrame2(WARRIOR_ART);
const KNIGHT_WALK1 = makeWalkFrame1(KNIGHT_ART);
const KNIGHT_WALK2 = makeWalkFrame2(KNIGHT_ART);

const MAGE_WALK1 = (() => {
  const w = [...MAGE_ART];
  w[17] = "...pp......pp...";
  w[18] = "...pP......pP...";
  w[19] = "...bB......bB...";
  w[20] = "...BB......BB...";
  return w;
})();
const MAGE_WALK2 = (() => {
  const w = [...MAGE_ART];
  w[17] = ".....pp..pp.....";
  w[18] = ".....pP..pP.....";
  w[19] = ".....bB..bB.....";
  w[20] = ".....BB..BB.....";
  return w;
})();

const ARCHER_WALK1 = makeWalkFrame1(ARCHER_ART);
const ARCHER_WALK2 = makeWalkFrame2(ARCHER_ART);

// ================================================================
// MOB SPRITES - Unique silhouettes for each mob type
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
  H: "#222222",
  e: "#FF0000",
  g: "#FF6600",
  s: "#882222",
  S: "#661111",
  w: "#881818",
  W: "#551010",
  b: "#442222",
  B: "#331111",
  c: "#222222",
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
  D: "#4A3A22",
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
  g: "#FF8800",
  s: "#9B59B6",
  S: "#7B39A6",
  w: "#8B4513",
  W: "#6B3410",
  h: "#222244",
  H: "#111133",
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

// ---- NEW: Scorpion (18x14) ----
const SCORPION_PALETTE: Record<string, string> = {
  b: "#8B4513",
  B: "#6B3410",
  d: "#4A2A0A",
  r: "#CC2200",
  c: "#222222",
  p: "#FF4400",
  t: "#AA3311",
};
const SCORPION_ART = [
  "..................",
  "....cc............",
  "...cp.cc..........",
  "...cc...c.........",
  ".......cbbbb......",
  "..t...bBBBBBb.....",
  "..t..bBBBBBBBb....",
  "..t.bBBBBBBBBBb...",
  "....bBBBBBBBBBb...",
  "...bb.bBB.bBB.bb..",
  "..bb..bBB..BB..bb.",
  "..b....BB..BB...b.",
  "........B...B.....",
  "..................",
];

// ---- NEW: Treant (16x22) ----
const TREANT_PALETTE: Record<string, string> = {
  t: "#3A2812",
  T: "#2A1808", // trunk
  l: "#2A6A12",
  L: "#1A5A08", // leaves
  g: "#44AA22",
  G: "#338A18", // bright leaves
  e: "#FFCC00", // eyes
  r: "#5A3818", // roots
  R: "#4A2A08",
};
const TREANT_ART = [
  "................",
  "....lllggg......",
  "...lLLgGGgl.....",
  "..lLLLgGGGgl....",
  "..lLLLGGGGgl....",
  "...lLLGGGgl.....",
  "....llgGgl......",
  ".....tttt.......",
  "....tTeTet......",
  "....tTTTTt......",
  "...ttTTTTtt.....",
  "..rttTTTTttr....",
  "..rtTTTTTTtr....",
  "...tTTTTTTt.....",
  "....tTTTTt......",
  "....tTTTTt......",
  "....tT..Tt......",
  "....tt..tt......",
  "...rRr..rRr.....",
  "..rRRr..rRRr....",
  "..RRR....RRR....",
  "................",
];

// ---- NEW: Golem (16x20) ----
const GOLEM_PALETTE: Record<string, string> = {
  s: "#808080",
  S: "#606060", // stone
  d: "#505050",
  D: "#404040", // dark stone
  c: "#333333", // cracks
  e: "#66CCFF", // eyes (magic glow)
  g: "#4488CC", // glow
  r: "#555555", // rough
};
const GOLEM_ART = [
  "................",
  ".....ssss.......",
  "....sSSSSs......",
  "...sSSeSeSs.....",
  "...sSSSSSSSs....",
  "....sSSSSSs.....",
  "......ss........",
  "...ssssSSSss....",
  "..sSSSSSSSSSs...",
  ".rSSSSSSSSSSS...",
  ".rSSSSSSSSSSSr..",
  "..sSSSSSSSSSr...",
  "...ssSSSSSss....",
  "....sSSSSSs.....",
  "....sS..SSs.....",
  "...sSD..DSs.....",
  "..sSSD..DSSs....",
  "..sSD....DSs....",
  "..dDD....DDd....",
  "................",
];

// ---- NEW: Mushroom Monster (14x16) ----
const MUSHROOM_PALETTE: Record<string, string> = {
  c: "#CC4444",
  C: "#AA2222", // cap
  s: "#FF6666", // spots
  t: "#DDBB88",
  T: "#BB9966", // stem
  e: "#222222", // eyes
  w: "#FFFFFF", // whites
  d: "#664422", // dark
};
const MUSHROOM_ART = [
  "..............",
  "....cccccc....",
  "...cCsCsCCc...",
  "..cCCCsCCCCc..",
  "..cCCCCCCCCc..",
  "...ccCCCCcc...",
  "....cccccc....",
  ".....tTTt.....",
  "....tTweTt....",
  "....tTweTt....",
  "....tTTTTt....",
  ".....tTTt.....",
  ".....tTTt.....",
  "....dttttd....",
  "...dd....dd...",
  "..............",
];

// ---- NPC Merchant (16x22) ----
const NPC_PALETTE: Record<string, string> = {
  h: "#8B4513",
  H: "#6B3410",
  s: "#FFD5B4",
  S: "#D4A880",
  e: "#222222",
  m: "#C47A6A",
  a: "#6B4423",
  A: "#4A2A12",
  g: "#FFD700",
  G: "#CCAA00",
  b: "#5C3A1E",
  B: "#3A2210",
  p: "#4A3728",
  q: "#FFD700",
  Q: "#CCAA00",
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
  A: "#1565C0",
  h: "#1565C0",
  H: "#0D47A1",
};
const NPC_GUIDE_ART = [...NPC_MERCHANT_ART];

// ---- NEW: NPC Blacksmith (16x22) - muscular, apron ----
const NPC_BLACKSMITH_PALETTE: Record<string, string> = {
  ...NPC_PALETTE,
  a: "#555555",
  A: "#333333", // dark apron/clothes
  h: "#333333",
  H: "#222222",
  n: "#AA4400", // anvil color
};
const NPC_BLACKSMITH_ART = [
  "......Qg........",
  "......QQ........",
  "......hhhh......",
  ".....Hhhhhh.....",
  ".....ssssss.....",
  ".....se.ses.....",
  ".....sSmSss.....",
  "......ssss......",
  ".....gaaag......",
  "...ssAaaaAAs....",
  "...ssAaaaAAs....",
  "...ssAaaaAAs....",
  "....gaaaaaAg....",
  "....AaaaaAAA....",
  "....AaaaaAAA....",
  "....pppppppp....",
  "....pp....pp....",
  "....pp....pp....",
  "....pP....pP....",
  "....bB....bB....",
  "....BB....BB....",
  "................",
];

// ---- NEW: NPC Witch/Potion (16x22) ----
const NPC_POTION_PALETTE: Record<string, string> = {
  ...NPC_PALETTE,
  a: "#6B2FA0",
  A: "#4A148C",
  h: "#4A148C",
  H: "#2A0860",
  c: "#44FF44",
  C: "#22CC22", // potion glow
};
const NPC_POTION_ART = [
  "......Qg........",
  "......QQ........",
  ".....HHHH.......",
  "....HhhhHH......",
  "...HHHHhHHH.....",
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

  // Magma golem
  const magmaGolemPalette = {
    ...GOLEM_PALETTE,
    s: "#AA4400",
    S: "#883300",
    d: "#662200",
    D: "#441100",
    e: "#FF6600",
    g: "#FF4400",
  };
  renderWithOutline(scene, "mob_magma_golem", GOLEM_ART, magmaGolemPalette);

  // Ice golem
  const iceGolemPalette = {
    ...GOLEM_PALETTE,
    s: "#88BBCC",
    S: "#6699AA",
    d: "#447788",
    D: "#335566",
    e: "#AAEEFF",
    g: "#88DDFF",
  };
  renderWithOutline(scene, "mob_ice_golem", GOLEM_ART, iceGolemPalette);

  // Dark treant
  const darkTreantPalette = {
    ...TREANT_PALETTE,
    t: "#1A1A1A",
    T: "#111111",
    l: "#2A2A3A",
    L: "#1A1A2A",
    g: "#3A3A5A",
    G: "#2A2A4A",
    e: "#FF0000",
  };
  renderWithOutline(scene, "mob_dark_treant", TREANT_ART, darkTreantPalette);

  // Poison mushroom
  const poisonMushroomPalette = {
    ...MUSHROOM_PALETTE,
    c: "#44AA22",
    C: "#338818",
    s: "#88FF44",
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

  const armorNpcPalette = {
    ...NPC_PALETTE,
    a: "#4A6FA5",
    A: "#3A5A8A",
    h: "#3A5A8A",
    H: "#2A4A7A",
  };
  renderWithOutline(scene, "npc_armor", NPC_MERCHANT_ART, armorNpcPalette);

  renderWithOutline(scene, "npc_potion", NPC_POTION_ART, NPC_POTION_PALETTE);

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
    id.includes("void")
  )
    return "mob_demon";

  if (id.includes("snake") || id.includes("serpent") || id.includes("worm"))
    return "mob_slime";

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

  // Grass tile with tufts - 3 variants
  for (let v = 0; v < 3; v++) {
    const key = v === 0 ? "tile_grass" : `tile_grass_v${v}`;
    const rng = seededRng(v * 1337);
    generateTileTexture(scene, key, "#2E5A22", (ctx, w) => {
      // Variation patches
      ctx.fillStyle = "#3A6A2E";
      ctx.fillRect(4 + rng() * 10, 4 + rng() * 8, 8 + rng() * 4, 6 + rng() * 4);
      ctx.fillRect(
        16 + rng() * 6,
        12 + rng() * 6,
        8 + rng() * 6,
        6 + rng() * 6,
      );
      // Grass tufts
      ctx.fillStyle = "#4A7A3A";
      for (let i = 0; i < 4 + v; i++) {
        const x = Math.floor(rng() * 28) + 2;
        const y = Math.floor(rng() * 22) + 4;
        ctx.fillRect(x, y, 1, 2 + Math.floor(rng() * 3));
      }
      // Small flowers on some variants
      if (v === 2) {
        ctx.fillStyle = "#FFEE44";
        ctx.fillRect(8, 14, 2, 2);
        ctx.fillStyle = "#FF6688";
        ctx.fillRect(22, 8, 2, 2);
      }
      // Darker edges for depth
      ctx.fillStyle = "#000000";
      ctx.globalAlpha = 0.05;
      ctx.fillRect(0, 0, w, 1);
      ctx.fillRect(0, 0, 1, w);
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
      // Mushroom on variant 1
      if (v === 1) {
        ctx.fillStyle = "#664422";
        ctx.fillRect(6, 22, 2, 4);
        ctx.fillStyle = "#884422";
        ctx.fillRect(4, 20, 6, 3);
      }
    });
  }

  // Dirt
  generateTileTexture(scene, "tile_dirt", "#5C4A32", (ctx) => {
    ctx.fillStyle = "#4A3A28";
    ctx.fillRect(6, 4, 6, 4);
    ctx.fillRect(20, 18, 8, 6);
    ctx.fillStyle = "#6A5A42";
    ctx.fillRect(10, 14, 3, 2);
    ctx.fillRect(24, 8, 2, 2);
    ctx.fillStyle = "#4A3A22";
    ctx.fillRect(4, 22, 2, 2);
  });

  // Stone - 2 variants
  for (let v = 0; v < 2; v++) {
    const key = v === 0 ? "tile_stone" : `tile_stone_v${v}`;
    generateTileTexture(scene, key, "#555560", (ctx, w, h) => {
      ctx.fillStyle = "#000000";
      ctx.globalAlpha = 0.2;
      ctx.fillRect(0, 0, w, 1);
      ctx.fillRect(0, 0, 1, h);
      ctx.fillRect(0, 15 + v * 2, w, 1);
      ctx.fillRect(12 + v * 4, 0, 1, 16);
      ctx.fillRect(24 - v * 4, 16, 1, 16);
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(2, 2, 8, 1);
      ctx.fillRect(14, 18, 8, 1);
      ctx.globalAlpha = 1;
      // Cracks on variant 1
      if (v === 1) {
        ctx.strokeStyle = "#333338";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(8, 8);
        ctx.lineTo(14, 12);
        ctx.lineTo(18, 10);
        ctx.stroke();
      }
    });
  }

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
    // Sparkle highlights
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#88CCEE";
    ctx.fillRect(10, 6, 2, 1);
    ctx.fillRect(20, 16, 2, 1);
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
    // Scattered pebbles
    ctx.fillStyle = "#7A6A3A";
    ctx.fillRect(14, 18, 2, 2);
    ctx.fillRect(8, 26, 2, 1);
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
    ctx.fillStyle = "#122A0E";
    ctx.fillRect(2, 22, w - 4, 10);
    ctx.fillStyle = "#3A2812";
    ctx.fillRect(12, 12, 8, 20);
    ctx.fillStyle = "#2A1A08";
    ctx.globalAlpha = 0.4;
    ctx.fillRect(14, 16, 2, 4);
    ctx.fillRect(17, 20, 2, 3);
    ctx.globalAlpha = 1;
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
    // Bright spots
    ctx.fillStyle = "#FFCC00";
    ctx.globalAlpha = 0.25;
    ctx.fillRect(8, 10, 3, 2);
    ctx.fillRect(22, 20, 2, 2);
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
    // Footprint hint
    ctx.fillStyle = "#B0B5BC";
    ctx.globalAlpha = 0.3;
    ctx.fillRect(14, 20, 3, 2);
    ctx.fillRect(16, 24, 3, 2);
    ctx.globalAlpha = 1;
  });

  // Ice
  generateTileTexture(scene, "tile_ice", "#6A9AB8", (ctx) => {
    ctx.fillStyle = "#8ABACE";
    ctx.globalAlpha = 0.3;
    ctx.fillRect(8, 4, 1, 12);
    ctx.fillRect(14, 10, 10, 1);
    ctx.fillRect(22, 2, 1, 8);
    // Reflective highlights
    ctx.fillStyle = "#AADDEE";
    ctx.globalAlpha = 0.25;
    ctx.fillRect(12, 8, 4, 1);
    ctx.fillRect(4, 18, 6, 1);
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
    // Bubbles
    ctx.fillStyle = "#4A5A3A";
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(18, 24, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, 8, 1.5, 0, Math.PI * 2);
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
    // Faint blue crystal on some tiles
    ctx.fillStyle = "#334466";
    ctx.globalAlpha = 0.15;
    ctx.fillRect(20, 22, 3, 4);
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
