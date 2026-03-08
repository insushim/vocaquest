// ============================================
// VocaQuest Online - Main Game Scene
// Renders the world, entities, handles input
// ============================================

import Phaser from "phaser";
import {
  PacketType,
  EntityType,
  EntityData,
  PlayerData,
  MobData,
  MapData,
  TileType,
  Position,
  Direction,
  PlayerClass,
  MobBehavior,
} from "@shared/types";
import { socket } from "../../network";
import { ui } from "../../ui";
import { ClientConfig } from "../../config";
import {
  generateAllTextures,
  getPlayerTextureKey,
  getMobTextureKey,
  getNpcTextureKey,
  getTileTextureKey,
  getTileVariantCount,
} from "../sprites";
import { soundEngine } from "../sound";

// ---- Tile color palette (dark medieval fantasy) ----
const TILE_COLORS: Record<number, number> = {
  [TileType.GRASS]: 0x2e5a22,
  [TileType.DIRT]: 0x5c4a32,
  [TileType.STONE]: 0x555560,
  [TileType.WATER]: 0x1a4a7a,
  [TileType.SAND]: 0x8a7a4a,
  [TileType.WALL]: 0x3a3a42,
  [TileType.TREE]: 0x1a3a12,
  [TileType.FLOOR]: 0x6a5e4a,
  [TileType.BRIDGE]: 0x5a4a1a,
  [TileType.LAVA]: 0xaa2200,
  [TileType.SNOW]: 0xc0c5cc,
  [TileType.ICE]: 0x6a9ab8,
  [TileType.SWAMP]: 0x2a3a1a,
  [TileType.DARK_GRASS]: 0x1a2e18,
  [TileType.DARK_STONE]: 0x222228,
  [TileType.PORTAL]: 0x5a2a7a,
};

// Secondary tile colors for detail
const TILE_DETAIL_COLORS: Record<number, number> = {
  [TileType.GRASS]: 0x3a6a2e,
  [TileType.DIRT]: 0x4a3a28,
  [TileType.STONE]: 0x44444e,
  [TileType.WATER]: 0x2a5a8a,
  [TileType.SAND]: 0x7a6a3a,
  [TileType.TREE]: 0x0e2a08,
  [TileType.FLOOR]: 0x5a4e3a,
  [TileType.SWAMP]: 0x1e2e12,
  [TileType.DARK_GRASS]: 0x122210,
  [TileType.SNOW]: 0xd0d5dc,
};

// Tree trunk color
const TREE_TRUNK_COLOR = 0x3a2812;

// ---- Class colors ----
const CLASS_COLORS: Record<string, number> = {
  [PlayerClass.WARRIOR]: 0xf44336,
  [PlayerClass.KNIGHT]: 0x42a5f5,
  [PlayerClass.MAGE]: 0x7e57c2,
  [PlayerClass.ARCHER]: 0x4caf50,
};

// ---- Entity container data interface ----
interface EntityContainerData {
  id: string;
  type: EntityType;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  nameText?: Phaser.GameObjects.Text;
  healthBar?: Phaser.GameObjects.Graphics;
  bodyGraphic?: Phaser.GameObjects.Graphics;
  bodySprite?: Phaser.GameObjects.Image;
  hp?: number;
  maxHp?: number;
  direction?: Direction;
  playerClass?: string;
  level?: number;
  isBoss?: boolean;
  mobId?: string;
  karma?: number;
  pkMode?: boolean;
}

// ---- Zone atmosphere config ----
interface ZoneAtmosphere {
  particleColor: number;
  particleColor2?: number;
  particleDirection: { x: number; y: number }; // velocity bias
  particleShape: "circle" | "leaf" | "snow" | "ember";
  vignetteStrength: number; // 0.0 - 1.0
  vignetteColor: number;
}

const ZONE_ATMOSPHERES: Record<string, ZoneAtmosphere> = {
  town: {
    particleColor: 0xccbb88,
    particleDirection: { x: 0, y: -1 },
    particleShape: "circle",
    vignetteStrength: 0.2,
    vignetteColor: 0x000000,
  },
  starter_meadow: {
    particleColor: 0x88cc44,
    particleColor2: 0xffee44,
    particleDirection: { x: 0.5, y: -0.5 },
    particleShape: "leaf",
    vignetteStrength: 0.15,
    vignetteColor: 0x000000,
  },
  dark_forest: {
    particleColor: 0x44aa44,
    particleColor2: 0xaacc44,
    particleDirection: { x: -0.3, y: 0.8 },
    particleShape: "leaf",
    vignetteStrength: 0.5,
    vignetteColor: 0x001100,
  },
  scorching_desert: {
    particleColor: 0xccaa66,
    particleColor2: 0xddbb77,
    particleDirection: { x: 2, y: -0.2 },
    particleShape: "circle",
    vignetteStrength: 0.25,
    vignetteColor: 0x110800,
  },
  frozen_mountains: {
    particleColor: 0xeeeeff,
    particleColor2: 0xccddee,
    particleDirection: { x: -0.5, y: 1.5 },
    particleShape: "snow",
    vignetteStrength: 0.2,
    vignetteColor: 0x000008,
  },
  shadow_realm: {
    particleColor: 0x8844cc,
    particleColor2: 0xaa66ee,
    particleDirection: { x: 0, y: -0.8 },
    particleShape: "circle",
    vignetteStrength: 0.6,
    vignetteColor: 0x0a0020,
  },
  volcanic_cavern: {
    particleColor: 0xff6600,
    particleColor2: 0xff3300,
    particleDirection: { x: 0.3, y: -2 },
    particleShape: "ember",
    vignetteStrength: 0.5,
    vignetteColor: 0x110000,
  },
  ancient_ruins: {
    particleColor: 0x8866cc,
    particleColor2: 0xaa88ee,
    particleDirection: { x: 0, y: -0.5 },
    particleShape: "circle",
    vignetteStrength: 0.45,
    vignetteColor: 0x080010,
  },
  abyssal_depths: {
    particleColor: 0x4488cc,
    particleColor2: 0x66aaee,
    particleDirection: { x: 0, y: -1.5 },
    particleShape: "circle",
    vignetteStrength: 0.55,
    vignetteColor: 0x000814,
  },
  dragons_sanctum: {
    particleColor: 0xff4400,
    particleColor2: 0xffaa00,
    particleDirection: { x: 0.5, y: -2.5 },
    particleShape: "ember",
    vignetteStrength: 0.5,
    vignetteColor: 0x0c0000,
  },
};

export class GameScene extends Phaser.Scene {
  // ---- Map rendering ----
  private tileLayer: Phaser.GameObjects.Graphics | null = null;
  private tileImages: Map<string, Phaser.GameObjects.Image> = new Map();
  private tileCache: Map<string, boolean> = new Map();
  private renderedChunks: Set<string> = new Set();

  // ---- Entity containers ----
  private playerSprite: Phaser.GameObjects.Container | null = null;
  private otherPlayers: Map<string, Phaser.GameObjects.Container> = new Map();
  private mobs: Map<string, Phaser.GameObjects.Container> = new Map();
  private npcs: Map<string, Phaser.GameObjects.Container> = new Map();
  private itemDrops: Map<string, Phaser.GameObjects.Container> = new Map();
  private groundItemSprites: Map<string, Phaser.GameObjects.Container> =
    new Map();

  // ---- Map data ----
  private mapData: MapData | null = null;
  private playerId: string = "";
  private playerX: number = 0;
  private playerY: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  private isMoving: boolean = false;
  private playerDirection: Direction = Direction.DOWN;

  // ---- Targeting ----
  private selectedTarget: string | null = null;
  private targetIndicator: Phaser.GameObjects.Graphics | null = null;

  // ---- Input ----
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  } | null = null;
  private keyI: Phaser.Input.Keyboard.Key | null = null;
  private keyM: Phaser.Input.Keyboard.Key | null = null;
  private keyEnter: Phaser.Input.Keyboard.Key | null = null;
  private keyEsc: Phaser.Input.Keyboard.Key | null = null;
  private key1: Phaser.Input.Keyboard.Key | null = null;
  private key2: Phaser.Input.Keyboard.Key | null = null;
  private key3: Phaser.Input.Keyboard.Key | null = null;
  private key4: Phaser.Input.Keyboard.Key | null = null;
  private key5: Phaser.Input.Keyboard.Key | null = null;
  private key6: Phaser.Input.Keyboard.Key | null = null;
  private keyT: Phaser.Input.Keyboard.Key | null = null;
  private keyK: Phaser.Input.Keyboard.Key | null = null;
  private keyF1: Phaser.Input.Keyboard.Key | null = null;
  private keyF2: Phaser.Input.Keyboard.Key | null = null;

  // ---- Enhancement glow effects ----
  private enhanceEffects: Map<
    string,
    {
      particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        alpha: number;
        life: number;
        maxLife: number;
        color: number;
        size: number;
      }>;
      level: number;
    }
  > = new Map();
  private enhanceGlowLayer: Phaser.GameObjects.Graphics | null = null;
  private playerMaxEnhanceLevel: number = 0;

  // ---- Auto attack ----
  private autoAttackTimer: number = 0;
  private autoAttackInterval: number = 1500;

  // ---- Visual effects ----
  private damageTexts: {
    text: Phaser.GameObjects.Text;
    startTime: number;
    startY: number;
  }[] = [];
  private floatingTexts: {
    text: Phaser.GameObjects.Text;
    startTime: number;
    startY: number;
    duration: number;
  }[] = [];

  // ---- Timing ----
  private lastMoveTime: number = 0;
  private moveInterval: number = 250; // ms between move packets
  private minimapTimer: number = 0;
  private animTimer: number = 0;

  // ---- Camera position (for viewport culling) ----
  private lastCamX: number = 0;
  private lastCamY: number = 0;

  // ---- Atmosphere ----
  private vignetteOverlay: Phaser.GameObjects.Graphics | null = null;
  private ambientParticles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    size: number;
    color?: number;
  }[] = [];
  private ambientLayer: Phaser.GameObjects.Graphics | null = null;
  private walkAnimPhase: number = 0;
  private currentZoneId: string = "town";
  private currentAtmosphere: ZoneAtmosphere = ZONE_ATMOSPHERES.town;
  private lastFootstepTime: number = 0;

  // ---- Player class (for skills) ----
  private playerClass: PlayerClass = PlayerClass.WARRIOR;

  // ---- Combat effects ----
  private effectsLayer: Phaser.GameObjects.Graphics | null = null;
  private activeEffects: {
    type: string;
    x: number;
    y: number;
    startTime: number;
    duration: number;
    data?: any;
  }[] = [];
  private waterAnimTimer: number = 0;
  private lavaAnimTimer: number = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  // ================================================
  // Phaser Lifecycle
  // ================================================

  create(): void {
    // Initialize sound engine on first user interaction
    this.input.once("pointerdown", () => soundEngine.init());
    this.input.keyboard?.once("keydown", () => soundEngine.init());

    // Pre-render all sprite textures
    generateAllTextures(this);

    // Create the tile layer graphics
    this.tileLayer = this.add.graphics();
    this.tileLayer.setDepth(0);

    // Create target indicator
    this.targetIndicator = this.add.graphics();
    this.targetIndicator.setDepth(5);
    this.targetIndicator.setVisible(false);

    // Combat effects layer
    this.effectsLayer = this.add.graphics();
    this.effectsLayer.setDepth(12);

    // Enhancement glow effects layer
    this.enhanceGlowLayer = this.add.graphics();
    this.enhanceGlowLayer.setDepth(11);

    // Ambient particle layer
    this.ambientLayer = this.add.graphics();
    this.ambientLayer.setDepth(15);

    // Vignette overlay (dark edges for atmosphere)
    this.vignetteOverlay = this.add.graphics();
    this.vignetteOverlay.setDepth(100);
    this.vignetteOverlay.setScrollFactor(0);
    this.drawVignette();

    // Initialize ambient particles (zone-aware)
    this.initAmbientParticles();

    // Setup input
    this.setupInput();

    // Setup socket event handlers
    this.setupSocketHandlers();

    // Connect to server
    socket.connect();

    // Show login screen
    ui.showLogin();
  }

  update(time: number, delta: number): void {
    if (!this.mapData || !this.playerSprite) return;

    const ts = ClientConfig.TILE_SIZE;

    // ---- Handle keyboard movement ----
    this.handleKeyboardMovement(time);

    // ---- Lerp player sprite to target position ----
    if (this.isMoving && this.playerSprite) {
      const targetPx = this.targetX * ts + ts / 2;
      const targetPy = this.targetY * ts + ts / 2;
      const currentX = this.playerSprite.x;
      const currentY = this.playerSprite.y;

      const dx = targetPx - currentX;
      const dy = targetPy - currentY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) {
        this.playerSprite.x = targetPx;
        this.playerSprite.y = targetPy;
        this.playerX = this.targetX;
        this.playerY = this.targetY;
        this.isMoving = false;
        // Switch to idle frame
        this.swapPlayerTexture(0);
      } else {
        const speed = Math.min(
          dist,
          ClientConfig.MOVE_SPEED * (delta / 1000) * 2.5,
        );
        this.playerSprite.x += (dx / dist) * speed;
        this.playerSprite.y += (dy / dist) * speed;
        // Walking bob + frame swap (3-frame cycle: idle->walk1->walk2)
        const bob = Math.sin(this.walkAnimPhase * Math.PI) * 1.5;
        this.playerSprite.y += bob;
        // 3-frame walk cycle
        const walkCycle = Math.floor(this.walkAnimPhase * 2) % 3; // 0, 1, 2
        this.swapPlayerTexture(walkCycle);
        // Footstep sound (throttled)
        if (Date.now() - this.lastFootstepTime > 400) {
          soundEngine.playFootstep();
          this.lastFootstepTime = Date.now();
        }
        // Flip sprite based on direction
        const ed = this.playerSprite.getData("entityData") as any;
        if (ed?.bodySprite) {
          ed.bodySprite.setFlipX(this.playerDirection === Direction.LEFT);
        }
      }
    }

    // ---- Update camera to follow player ----
    if (this.playerSprite) {
      const camX = this.playerSprite.x;
      const camY = this.playerSprite.y;
      this.cameras.main.centerOn(
        Phaser.Math.Linear(
          this.cameras.main.scrollX + this.cameras.main.width / 2,
          camX,
          ClientConfig.CAMERA_LERP,
        ),
        Phaser.Math.Linear(
          this.cameras.main.scrollY + this.cameras.main.height / 2,
          camY,
          ClientConfig.CAMERA_LERP,
        ),
      );

      // Clamp camera to map bounds
      const worldW = this.mapData.width * ts;
      const worldH = this.mapData.height * ts;
      this.cameras.main.setBounds(0, 0, worldW, worldH);
    }

    // ---- Re-render tiles if camera moved significantly ----
    const camMoved =
      Math.abs(this.cameras.main.scrollX - this.lastCamX) > ts ||
      Math.abs(this.cameras.main.scrollY - this.lastCamY) > ts;
    if (camMoved) {
      this.renderVisibleTiles();
      this.lastCamX = this.cameras.main.scrollX;
      this.lastCamY = this.cameras.main.scrollY;
    }

    // ---- Interpolate other entities ----
    this.interpolateEntities(delta);

    // ---- Update damage texts ----
    this.updateDamageTexts(time);
    this.updateFloatingTexts(time);

    // ---- Update target indicator ----
    this.updateTargetIndicator(time);

    // ---- Walk animation phase ----
    if (this.isMoving) {
      this.walkAnimPhase += delta * 0.008;
    }

    // ---- Animate ambient particles ----
    this.updateAmbientParticles(delta);

    // ---- Update combat effects ----
    this.updateActiveEffects(time);

    // ---- Animate special tiles ----
    this.animTimer += delta;
    if (this.animTimer > 500) {
      this.animTimer = 0;
    }
    // Water/lava animation timers
    this.waterAnimTimer += delta;
    this.lavaAnimTimer += delta;

    // ---- Update minimap periodically ----
    this.minimapTimer += delta;
    if (this.minimapTimer > 1000) {
      this.minimapTimer = 0;
      this.updateMinimap();
    }

    // ---- Update player position for zone tracking ----
    ui.updatePlayerPosition(this.playerX, this.playerY);

    // ---- Update ground items ----
    this.updateGroundItems();

    // ---- Detect zone change for atmosphere ----
    this.updateZoneAtmosphere();

    // ---- Enhancement glow effects ----
    this.updateEnhanceGlowEffects(delta);

    // ---- Auto-attack ----
    if (ui.isAutoAttack() && this.selectedTarget) {
      this.autoAttackTimer += delta;
      if (this.autoAttackTimer >= this.autoAttackInterval) {
        this.autoAttackTimer = 0;
        const targetContainer = this.mobs.get(this.selectedTarget);
        if (targetContainer) {
          socket.send(PacketType.ATTACK, { targetId: this.selectedTarget });
          this.playAttackSound();
        } else {
          // Target gone, find nearest mob
          this.autoSelectNearestMob();
        }
      }
    }
  }

  /** Auto-select nearest mob for auto-attack */
  private autoSelectNearestMob(): void {
    if (!this.playerSprite) return;
    let closestId: string | null = null;
    let closestDist = Infinity;
    const ts = ClientConfig.TILE_SIZE;
    const attackRange = ts * 3;

    for (const [id, container] of this.mobs) {
      const dx = container.x - this.playerSprite.x;
      const dy = container.y - this.playerSprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < attackRange && dist < closestDist) {
        closestDist = dist;
        closestId = id;
      }
    }

    if (closestId) {
      this.selectedTarget = closestId;
      socket.send(PacketType.ATTACK, { targetId: closestId });
    } else {
      this.selectedTarget = null;
    }
  }

  // ================================================
  // Input Setup
  // ================================================

  private setupInput(): void {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.keyEnter = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    );
    this.keyEsc = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC,
    );
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.key3 = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.THREE,
    );
    this.key4 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    this.key5 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);
    this.key6 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SIX);
    this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.keyF1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
    this.keyF2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);

    // Keyboard handlers (only when chat not focused)
    this.keyI.on("down", () => {
      if (!ui.isChatFocused()) ui.toggleInventory();
    });

    this.keyEnter.on("down", () => {
      if (!ui.isChatFocused()) {
        ui.focusChat();
      }
    });

    this.keyEsc.on("down", () => {
      ui.closeAllPanels();
    });

    this.key1.on("down", () => {
      if (!ui.isChatFocused()) ui.useSkill(0);
    });
    this.key2.on("down", () => {
      if (!ui.isChatFocused()) ui.useSkill(1);
    });
    this.key3.on("down", () => {
      if (!ui.isChatFocused()) ui.useSkill(2);
    });
    this.key4.on("down", () => {
      if (!ui.isChatFocused()) ui.useSkill(3);
    });
    this.key5.on("down", () => {
      if (!ui.isChatFocused()) ui.useSkill(4);
    });
    this.key6.on("down", () => {
      if (!ui.isChatFocused()) ui.useSkill(5);
    });
    this.keyT.on("down", () => {
      if (!ui.isChatFocused()) ui.toggleStatPanel();
    });
    this.keyK.on("down", () => {
      if (!ui.isChatFocused()) ui.toggleEnhancePanel();
    });
    this.keyF1.on("down", (e: KeyboardEvent) => {
      e.preventDefault();
      if (!ui.isChatFocused()) ui.useQuickPotionByKey("health");
    });
    this.keyF2.on("down", (e: KeyboardEvent) => {
      e.preventDefault();
      if (!ui.isChatFocused()) ui.useQuickPotionByKey("mana");
    });

    // Click to move / interact
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.mapData) return;
      // Ignore if clicking on UI elements
      if (ui.isChatFocused() || ui.isAnyPanelOpen()) return;

      const worldX = pointer.worldX;
      const worldY = pointer.worldY;
      const tileX = Math.floor(worldX / ClientConfig.TILE_SIZE);
      const tileY = Math.floor(worldY / ClientConfig.TILE_SIZE);

      // Check if clicked on an entity
      const clickedEntity = this.findEntityAt(worldX, worldY);
      if (clickedEntity) {
        this.handleEntityClick(clickedEntity);
        return;
      }

      // Click on ground: move there
      if (
        tileX >= 0 &&
        tileX < this.mapData.width &&
        tileY >= 0 &&
        tileY < this.mapData.height
      ) {
        if (!this.mapData.collisions[tileY]?.[tileX]) {
          this.moveToTile(tileX, tileY);
        }
      }
    });
  }

  // ================================================
  // Keyboard Movement
  // ================================================

  private handleKeyboardMovement(time: number): void {
    if (ui.isChatFocused() || ui.isAnyPanelOpen()) return;
    if (time - this.lastMoveTime < this.moveInterval) return;
    if (!this.mapData) return;

    let dx = 0;
    let dy = 0;

    if (this.cursors?.up.isDown || this.wasd?.W.isDown) {
      dy = -1;
      this.playerDirection = Direction.UP;
    } else if (this.cursors?.down.isDown || this.wasd?.S.isDown) {
      dy = 1;
      this.playerDirection = Direction.DOWN;
    }

    if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
      dx = -1;
      this.playerDirection = Direction.LEFT;
    } else if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
      dx = 1;
      this.playerDirection = Direction.RIGHT;
    }

    if (dx === 0 && dy === 0) return;

    const newX = this.playerX + dx;
    const newY = this.playerY + dy;

    // Bounds check
    if (
      newX < 0 ||
      newX >= this.mapData.width ||
      newY < 0 ||
      newY >= this.mapData.height
    )
      return;

    // Collision check
    if (this.mapData.collisions[newY]?.[newX]) return;

    this.moveToTile(newX, newY);
    this.lastMoveTime = time;
  }

  private moveToTile(tileX: number, tileY: number): void {
    this.targetX = tileX;
    this.targetY = tileY;
    this.isMoving = true;

    // Determine direction
    const dx = tileX - this.playerX;
    const dy = tileY - this.playerY;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.playerDirection = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else if (dy !== 0) {
      this.playerDirection = dy > 0 ? Direction.DOWN : Direction.UP;
    }

    socket.send(PacketType.MOVE, {
      x: tileX,
      y: tileY,
      direction: this.playerDirection,
    });
  }

  // ================================================
  // Entity Clicking
  // ================================================

  private findEntityAt(
    worldX: number,
    worldY: number,
  ): { id: string; type: EntityType } | null {
    const ts = ClientConfig.TILE_SIZE;
    const clickRadius = ts * 0.8;

    // Check mobs
    for (const [id, container] of this.mobs) {
      const dx = worldX - container.x;
      const dy = worldY - container.y;
      if (Math.sqrt(dx * dx + dy * dy) < clickRadius) {
        return { id, type: EntityType.MOB };
      }
    }

    // Check other players
    for (const [id, container] of this.otherPlayers) {
      const dx = worldX - container.x;
      const dy = worldY - container.y;
      if (Math.sqrt(dx * dx + dy * dy) < clickRadius) {
        return { id, type: EntityType.PLAYER };
      }
    }

    // Check NPCs
    for (const [id, container] of this.npcs) {
      const dx = worldX - container.x;
      const dy = worldY - container.y;
      if (Math.sqrt(dx * dx + dy * dy) < clickRadius) {
        return { id, type: EntityType.NPC };
      }
    }

    // Check item drops
    for (const [id, container] of this.itemDrops) {
      const dx = worldX - container.x;
      const dy = worldY - container.y;
      if (Math.sqrt(dx * dx + dy * dy) < clickRadius) {
        return { id, type: EntityType.ITEM_DROP };
      }
    }

    return null;
  }

  private handleEntityClick(entity: { id: string; type: EntityType }): void {
    switch (entity.type) {
      case EntityType.MOB:
        this.selectedTarget = entity.id;
        socket.send(PacketType.ATTACK, { targetId: entity.id });
        this.playAttackSound();
        break;
      case EntityType.PLAYER:
        this.selectedTarget = entity.id;
        // Could attack in PvP or inspect
        socket.send(PacketType.ATTACK, { targetId: entity.id });
        this.playAttackSound();
        break;
      case EntityType.NPC:
        this.selectedTarget = null;
        socket.send(PacketType.NPC_INTERACT, { npcId: entity.id });
        break;
      case EntityType.ITEM_DROP:
        this.selectedTarget = null;
        socket.send(PacketType.PICKUP_ITEM, { dropId: entity.id });
        soundEngine.playPickup();
        break;
    }
  }

  // ================================================
  // Target Indicator
  // ================================================

  private updateTargetIndicator(time: number): void {
    if (!this.targetIndicator) return;

    if (!this.selectedTarget) {
      this.targetIndicator.setVisible(false);
      return;
    }

    // Find target container
    let target =
      this.mobs.get(this.selectedTarget) ||
      this.otherPlayers.get(this.selectedTarget);

    if (!target) {
      this.selectedTarget = null;
      this.targetIndicator.setVisible(false);
      return;
    }

    this.targetIndicator.setVisible(true);
    this.targetIndicator.clear();

    const ts = ClientConfig.TILE_SIZE;
    const pulse = Math.sin(time / 250) * 0.3 + 0.7;
    const rot = (time / 2000) % (Math.PI * 2);

    // Outer ring (red, pulsing)
    this.targetIndicator.lineStyle(2, 0xcc2222, pulse * 0.8);
    this.targetIndicator.strokeCircle(target.x, target.y, ts * 0.65);

    // Inner rotating markers (4 corners)
    this.targetIndicator.lineStyle(2, 0xff4444, pulse);
    for (let i = 0; i < 4; i++) {
      const a = rot + (i * Math.PI) / 2;
      const r = ts * 0.55;
      const x1 = target.x + Math.cos(a) * r;
      const y1 = target.y + Math.sin(a) * r;
      const x2 = target.x + Math.cos(a) * (r + 6);
      const y2 = target.y + Math.sin(a) * (r + 6);
      this.targetIndicator.lineBetween(x1, y1, x2, y2);
    }

    // Ground ellipse (perspective selection ring like Lineage)
    this.targetIndicator.lineStyle(1.5, 0xff3333, pulse * 0.6);
    this.targetIndicator.strokeEllipse(
      target.x,
      target.y + ts * 0.3,
      ts * 0.9,
      ts * 0.3,
    );
  }

  // ================================================
  // Socket Event Handlers
  // ================================================

  private setupSocketHandlers(): void {
    // WELCOME: player enters the world
    socket.on(PacketType.WELCOME, (data: any) => {
      this.playerId = data.playerId || data.player?.id;
      this.mapData = data.map;
      this.playerX = data.player.x;
      this.playerY = data.player.y;
      this.targetX = data.player.x;
      this.targetY = data.player.y;
      this.playerClass = data.player.class;

      // Render the tilemap
      this.renderVisibleTiles();

      // Create player sprite
      this.createPlayerSprite(data.player);

      // Set up camera
      const ts = ClientConfig.TILE_SIZE;
      this.cameras.main.setBounds(
        0,
        0,
        this.mapData!.width * ts,
        this.mapData!.height * ts,
      );
      this.cameras.main.centerOn(
        this.playerX * ts + ts / 2,
        this.playerY * ts + ts / 2,
      );

      // Spawn initial entities (server sends {players:[], mobs:[]} or flat array)
      let entityList: any[] = [];
      if (Array.isArray(data.entities)) {
        entityList = data.entities;
      } else if (data.entities) {
        if (data.entities.players) entityList.push(...data.entities.players);
        if (data.entities.mobs) entityList.push(...data.entities.mobs);
      }
      if (data.npcs && Array.isArray(data.npcs)) {
        for (let npc of data.npcs) {
          entityList.push({ ...npc, type: "npc" });
        }
      }
      for (const entity of entityList) {
        if (entity.id !== this.playerId) {
          this.addEntity(entity);
        }
      }

      // Update UI
      ui.hideLogin();
      ui.showHUD();
      ui.updateSkills(this.playerClass);

      if (data.player.stats) {
        ui.updateHP(data.player.stats.hp, data.player.stats.maxHp);
        ui.updateMP(data.player.stats.mp, data.player.stats.maxMp);
        ui.updateEXP(data.player.stats.exp, data.player.stats.expToLevel);
        ui.updateLevel(data.player.stats.level);
        ui.updateGold(data.player.stats.gold);
      }

      if (data.player.gradeLevel) {
        ui.setGradeLevel(data.player.gradeLevel);
      }

      if (data.player.karma !== undefined) {
        ui.updateKarma(data.player.karma, data.player.karmaTitle);
      }

      // Pass zone data for zone name display
      if (data.map && data.map.zones) {
        ui.setMapZones(data.map.zones);
      }

      ui.addChatMessage(
        "\uC2DC\uC2A4\uD15C",
        "VocaQuest Online\uC5D0 \uC624\uC2E0 \uAC83\uC744 \uD658\uC601\uD569\uB2C8\uB2E4!",
        "system",
      );
    });

    // AUTH_SUCCESS: successful login (server may send welcome separately)
    socket.on(PacketType.AUTH_SUCCESS, () => {
      // Will be followed by WELCOME
    });

    // EQUIPMENT_UPDATE: track max enhance level for glow effects
    socket.on(
      PacketType.EQUIPMENT_UPDATE,
      (data: {
        equipment: Record<string, string | null>;
        itemDefs?: Record<string, any>;
        enhanceLevels?: Record<string, number>;
      }) => {
        // Find highest enhancement level across all equipped items
        let maxLevel = 0;
        if (data.enhanceLevels) {
          for (const lvl of Object.values(data.enhanceLevels)) {
            if (lvl > maxLevel) maxLevel = lvl;
          }
        }
        this.playerMaxEnhanceLevel = maxLevel;
      },
    );

    // ENTITY_LIST: sync all entities
    socket.on(PacketType.ENTITY_LIST, (data: { entities: EntityData[] }) => {
      // Clear existing entities
      this.clearAllEntities();

      for (const entity of data.entities) {
        if (entity.id !== this.playerId) {
          this.addEntity(entity);
        }
      }
    });

    // PLAYER_ENTER: another player joins
    socket.on(PacketType.PLAYER_ENTER, (data: EntityData) => {
      if (data.id !== this.playerId) {
        this.addEntity(data);
      }
    });

    // PLAYER_LEAVE: another player leaves
    socket.on(PacketType.PLAYER_LEAVE, (data: { id: string }) => {
      this.removeEntity(data.id);
    });

    // ENTITY_MOVE: entity moved to a new position
    socket.on(
      PacketType.ENTITY_MOVE,
      (data: {
        id: string;
        x: number;
        y: number;
        direction: Direction;
        pkMode?: boolean;
      }) => {
        if (data.id === this.playerId) {
          // Server confirmed our position (or corrected it)
          this.targetX = data.x;
          this.targetY = data.y;
          this.playerX = data.x;
          this.playerY = data.y;
          this.isMoving = true;
          return;
        }

        const container = this.findContainer(data.id);
        if (container) {
          const entityData = container.getData(
            "entityData",
          ) as EntityContainerData;
          if (entityData) {
            entityData.targetX =
              data.x * ClientConfig.TILE_SIZE + ClientConfig.TILE_SIZE / 2;
            entityData.targetY =
              data.y * ClientConfig.TILE_SIZE + ClientConfig.TILE_SIZE / 2;
            entityData.direction = data.direction;

            // Update PK mode display
            if (
              data.pkMode !== undefined &&
              entityData.pkMode !== data.pkMode
            ) {
              entityData.pkMode = data.pkMode;
              if (entityData.nameText) {
                let name = entityData.nameText.text.replace(/^\[PK\] /, "");
                if (data.pkMode) {
                  entityData.nameText.setText(`[PK] ${name}`);
                  entityData.nameText.setColor("#FF6666");
                } else {
                  entityData.nameText.setText(name);
                  entityData.nameText.setColor("#e8d5b0");
                }
              }
            }
          }
        }
      },
    );

    // MOB_SPAWN: new mob appeared
    socket.on(PacketType.MOB_SPAWN, (data: any) => {
      const mobData: MobData = data.mob || data;
      this.addEntity(mobData);
      // Boss spawn announcement
      if (mobData.behavior === MobBehavior.BOSS && mobData.nameKo) {
        ui.showBossAnnouncement(mobData.nameKo, "");
      }
    });

    // ENTITY_DEATH: entity died
    socket.on(
      PacketType.ENTITY_DEATH,
      (data: {
        id: string;
        killerName?: string;
        killerId?: string;
        expLost?: number;
      }) => {
        // Check if the local player died
        if (data.id === this.playerId) {
          ui.showDeathScreen(data.expLost);
          soundEngine.playPlayerDeath();
          if (this.playerSprite) {
            this.playerSprite.setAlpha(0.3);
          }
          return;
        }

        // Mob/player died — if we killed it, add combo
        if (data.killerId === this.playerId) {
          ui.addCombo();
          soundEngine.playMonsterDeath();
        }

        const container = this.findContainer(data.id);
        if (container) {
          this.playDeathAnimation(container);
        }
        // Remove after animation
        this.time.delayedCall(600, () => {
          this.removeEntity(data.id);
        });
      },
    );

    // COMBAT_HIT: damage dealt
    socket.on(
      PacketType.COMBAT_HIT,
      (data: {
        targetId: string;
        damage: number;
        isCrit?: boolean;
        hp?: number;
        maxHp?: number;
      }) => {
        const container = this.findContainer(data.targetId);
        if (container) {
          // Play hit sound
          if (data.isCrit) {
            soundEngine.playCriticalHit();
          } else {
            soundEngine.playHit();
          }

          // Show damage number
          this.showDamageNumber(
            container.x,
            container.y,
            data.damage,
            data.isCrit,
          );

          // Flash red
          this.flashEntity(container);

          // Update mob health bar
          const entityData = container.getData(
            "entityData",
          ) as EntityContainerData;
          if (entityData && data.hp !== undefined && data.maxHp !== undefined) {
            entityData.hp = data.hp;
            entityData.maxHp = data.maxHp;
            this.updateEntityHealthBar(container, data.hp, data.maxHp);
          }
        }
      },
    );

    // LOOT_DROP: item dropped on ground
    socket.on(
      PacketType.LOOT_DROP,
      (data: {
        id: string;
        x: number;
        y: number;
        itemId: string;
        name?: string;
        nameKo?: string;
        color?: string;
      }) => {
        this.createItemDropSprite(data);
      },
    );

    // SKILL_EFFECT: visual skill effect
    socket.on(
      PacketType.SKILL_EFFECT,
      (data: { skillId: string; x: number; y: number; color?: string }) => {
        this.showSkillEffect(data.x, data.y, data.color || "#ff6600");
        // Play appropriate sound based on skill color (heal=green, otherwise magic)
        const c = (data.color || "").toLowerCase();
        if (c.includes("00ff") || c.includes("44ff") || c === "#00ff00") {
          soundEngine.playHeal();
        } else {
          soundEngine.playMagicHit();
        }
      },
    );

    // LEVEL_UP: level up visual
    socket.on(PacketType.LEVEL_UP, (data: { level: number; id?: string }) => {
      if (!data.id || data.id === this.playerId) {
        soundEngine.playLevelUp();
        if (this.playerSprite) {
          this.showLevelUpEffect(this.playerSprite.x, this.playerSprite.y);
        }
      } else {
        const container = this.otherPlayers.get(data.id);
        if (container) {
          this.showLevelUpEffect(container.x, container.y);
        }
      }
    });

    // TELEPORT: instant position change
    socket.on(
      PacketType.TELEPORT,
      (data: { x: number; y: number; mapData?: MapData }) => {
        const ts = ClientConfig.TILE_SIZE;
        this.playerX = data.x;
        this.playerY = data.y;
        this.targetX = data.x;
        this.targetY = data.y;
        this.isMoving = false;

        if (this.playerSprite) {
          this.playerSprite.x = data.x * ts + ts / 2;
          this.playerSprite.y = data.y * ts + ts / 2;
        }

        if (data.mapData) {
          this.mapData = data.mapData;
          this.renderedChunks.clear();
          if (this.tileLayer) {
            this.tileLayer.clear();
          }
          // Destroy all tile images
          for (const [, img] of this.tileImages) img.destroy();
          this.tileImages.clear();
          this.clearAllEntities();
          this.renderVisibleTiles();
        }

        this.cameras.main.centerOn(data.x * ts + ts / 2, data.y * ts + ts / 2);
      },
    );

    // RESPAWN
    socket.on(
      PacketType.RESPAWN,
      (data: { x: number; y: number; stats?: any }) => {
        const ts = ClientConfig.TILE_SIZE;
        this.playerX = data.x;
        this.playerY = data.y;
        this.targetX = data.x;
        this.targetY = data.y;
        this.isMoving = false;

        if (this.playerSprite) {
          this.playerSprite.x = data.x * ts + ts / 2;
          this.playerSprite.y = data.y * ts + ts / 2;
          this.playerSprite.setAlpha(1);
        }

        // Update stats after respawn
        if (data.stats) {
          ui.updateHP(data.stats.hp, data.stats.maxHp);
          ui.updateMP(data.stats.mp, data.stats.maxMp);
          ui.updateEXP(data.stats.exp, data.stats.expToLevel);
        }

        ui.hideDeathScreen();
        soundEngine.playRespawn();
        this.selectedTarget = null;
      },
    );
  }

  /** Play attack sound based on player class */
  private playAttackSound(): void {
    switch (this.playerClass) {
      case PlayerClass.MAGE:
        soundEngine.playMagicCast();
        break;
      case PlayerClass.ARCHER:
        soundEngine.playBowShot();
        break;
      default:
        soundEngine.playSlash();
        break;
    }
  }

  /** Swap player sprite between idle and walk textures (3-frame cycle) */
  private swapPlayerTexture(walkFrame: number): void {
    if (!this.playerSprite) return;
    const ed = this.playerSprite.getData("entityData") as any;
    if (!ed?.bodySprite) return;
    const texKey = getPlayerTextureKey(this.playerClass, walkFrame);
    if (ed.bodySprite.texture.key !== texKey) {
      ed.bodySprite.setTexture(texKey);
    }
  }

  // ================================================
  // Map Rendering
  // ================================================

  /** Render only tiles visible within the camera viewport + buffer.
   *  Uses pre-rendered tile textures stamped via drawImage for performance. */
  private renderVisibleTiles(): void {
    if (!this.mapData || !this.tileLayer) return;

    const ts = ClientConfig.TILE_SIZE;
    const cam = this.cameras.main;
    const buffer = 3; // extra tiles around viewport

    // Calculate visible tile range
    const startX = Math.max(0, Math.floor(cam.scrollX / ts) - buffer);
    const startY = Math.max(0, Math.floor(cam.scrollY / ts) - buffer);
    const endX = Math.min(
      this.mapData.width,
      Math.ceil((cam.scrollX + cam.width) / ts) + buffer,
    );
    const endY = Math.min(
      this.mapData.height,
      Math.ceil((cam.scrollY + cam.height) / ts) + buffer,
    );

    // Chunk-based rendering: 16x16 tile chunks
    const chunkSize = 16;
    const chunkStartX = Math.floor(startX / chunkSize);
    const chunkStartY = Math.floor(startY / chunkSize);
    const chunkEndX = Math.ceil(endX / chunkSize);
    const chunkEndY = Math.ceil(endY / chunkSize);

    for (let cy = chunkStartY; cy <= chunkEndY; cy++) {
      for (let cx = chunkStartX; cx <= chunkEndX; cx++) {
        const chunkKey = `${cx},${cy}`;
        if (this.renderedChunks.has(chunkKey)) continue;
        this.renderedChunks.add(chunkKey);

        // Render this chunk
        const cStartX = cx * chunkSize;
        const cStartY = cy * chunkSize;
        const cEndX = Math.min(cStartX + chunkSize, this.mapData.width);
        const cEndY = Math.min(cStartY + chunkSize, this.mapData.height);

        for (let ty = cStartY; ty < cEndY; ty++) {
          for (let tx = cStartX; tx < cEndX; tx++) {
            const tileType = this.mapData.tiles[ty]?.[tx];
            if (tileType === undefined) continue;

            const tileKey = `${tx},${ty}`;
            if (this.tileImages.has(tileKey)) continue;

            const px = tx * ts;
            const py = ty * ts;

            // Create an Image from pre-rendered tile texture (with variants)
            const variantCount = getTileVariantCount(tileType);
            const variant =
              variantCount > 1 ? (tx * 7 + ty * 13) % variantCount : 0;
            const texKey = getTileTextureKey(tileType, variant);
            const img = this.add.image(px + ts / 2, py + ts / 2, texKey);
            img.setDepth(0);
            img.setDisplaySize(ts, ts);
            this.tileImages.set(tileKey, img);
          }
        }
      }
    }
  }

  // ================================================
  // Entity Creation
  // ================================================

  private addEntity(data: EntityData): void {
    // Don't re-add if already exists
    if (data.id === this.playerId) return;
    if (this.findContainer(data.id)) return;

    switch (data.type) {
      case EntityType.PLAYER:
        this.createOtherPlayerSprite(data as PlayerData);
        break;
      case EntityType.MOB:
        this.createMobSprite(data as MobData);
        break;
      case EntityType.NPC:
        this.createNpcSprite(data);
        break;
      case EntityType.ITEM_DROP:
        this.createItemDropSprite(data as any);
        break;
    }
  }

  /** Draw a humanoid character on a Graphics object */
  private drawHumanoid(
    g: Phaser.GameObjects.Graphics,
    ts: number,
    classType: string,
    isLocal: boolean,
  ): void {
    const color = CLASS_COLORS[classType] || 0x42a5f5;
    const skinColor = 0xffd5b4;
    const hairColors: Record<string, number> = {
      [PlayerClass.WARRIOR]: 0x8b4513,
      [PlayerClass.KNIGHT]: 0x2f2f2f,
      [PlayerClass.MAGE]: 0xc0c0c0,
      [PlayerClass.ARCHER]: 0x228b22,
    };
    const hairColor = hairColors[classType] || 0x8b4513;
    const s = ts * 0.7; // scale factor (larger for visibility)

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(0, s * 0.48, s * 0.7, s * 0.18);

    // Legs
    g.fillStyle(0x4a3728, 1);
    g.fillRect(-s * 0.2, s * 0.18, s * 0.14, s * 0.28);
    g.fillRect(s * 0.06, s * 0.18, s * 0.14, s * 0.28);

    // Boots
    g.fillStyle(0x5c3a1e, 1);
    g.fillRoundedRect(-s * 0.22, s * 0.38, s * 0.18, s * 0.1, 2);
    g.fillRoundedRect(s * 0.04, s * 0.38, s * 0.18, s * 0.1, 2);

    // Body / Armor
    g.fillStyle(color, 1);
    g.fillRoundedRect(-s * 0.28, -s * 0.15, s * 0.56, s * 0.38, 3);

    // Belt
    g.fillStyle(0x6b4423, 1);
    g.fillRect(-s * 0.28, s * 0.12, s * 0.56, s * 0.06);
    g.fillStyle(0xffd700, 1);
    g.fillRect(-s * 0.04, s * 0.12, s * 0.08, s * 0.06);

    // Arms
    g.fillStyle(color, 1);
    g.fillRect(-s * 0.4, -s * 0.1, s * 0.14, s * 0.28);
    g.fillRect(s * 0.26, -s * 0.1, s * 0.14, s * 0.28);

    // Hands (skin)
    g.fillStyle(skinColor, 1);
    g.fillCircle(-s * 0.33, s * 0.2, s * 0.06);
    g.fillCircle(s * 0.33, s * 0.2, s * 0.06);

    // Head (skin)
    g.fillStyle(skinColor, 1);
    g.fillCircle(0, -s * 0.32, s * 0.2);

    // Hair
    g.fillStyle(hairColor, 1);
    g.fillRoundedRect(-s * 0.22, -s * 0.54, s * 0.44, s * 0.2, 3);
    // Side hair
    g.fillRect(-s * 0.22, -s * 0.44, s * 0.06, s * 0.16);
    g.fillRect(s * 0.16, -s * 0.44, s * 0.06, s * 0.16);

    // Eyes
    g.fillStyle(0x000000, 1);
    g.fillCircle(-s * 0.08, -s * 0.34, s * 0.035);
    g.fillCircle(s * 0.08, -s * 0.34, s * 0.035);
    // Eye whites
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-s * 0.07, -s * 0.345, s * 0.015);
    g.fillCircle(s * 0.09, -s * 0.345, s * 0.015);

    // Mouth
    g.fillStyle(0xc47a6a, 1);
    g.fillRect(-s * 0.05, -s * 0.24, s * 0.1, s * 0.02);

    // Class-specific weapon/accessory
    if (classType === PlayerClass.WARRIOR) {
      // Sword on right hand
      g.fillStyle(0xc0c0c0, 1);
      g.fillRect(s * 0.3, -s * 0.15, s * 0.06, s * 0.4);
      g.fillStyle(0xffd700, 1);
      g.fillRect(s * 0.24, s * 0.02, s * 0.18, s * 0.06);
      g.fillStyle(0x8b0000, 1);
      g.fillRect(s * 0.3, s * 0.08, s * 0.06, s * 0.1);
    } else if (classType === PlayerClass.KNIGHT) {
      // Shield on left hand
      g.fillStyle(0x4169e1, 1);
      g.fillRoundedRect(-s * 0.52, -s * 0.08, s * 0.2, s * 0.28, 3);
      g.lineStyle(1.5, 0xffd700, 1);
      g.strokeRoundedRect(-s * 0.52, -s * 0.08, s * 0.2, s * 0.28, 3);
      g.fillStyle(0xffd700, 1);
      g.fillCircle(-s * 0.42, s * 0.06, s * 0.04);
      // Lance on right
      g.fillStyle(0x808080, 1);
      g.fillRect(s * 0.32, -s * 0.5, s * 0.04, s * 0.7);
      g.fillStyle(0xc0c0c0, 1);
      g.fillTriangle(
        s * 0.34,
        -s * 0.5,
        s * 0.28,
        -s * 0.38,
        s * 0.4,
        -s * 0.38,
      );
    } else if (classType === PlayerClass.MAGE) {
      // Staff
      g.fillStyle(0x8b4513, 1);
      g.fillRect(s * 0.3, -s * 0.5, s * 0.05, s * 0.7);
      // Crystal on top
      g.fillStyle(0x9b59b6, 1);
      g.fillCircle(s * 0.325, -s * 0.55, s * 0.08);
      g.fillStyle(0xc77dff, 0.6);
      g.fillCircle(s * 0.325, -s * 0.55, s * 0.05);
      // Hat
      g.fillStyle(0x4a148c, 1);
      g.fillTriangle(0, -s * 0.75, -s * 0.25, -s * 0.42, s * 0.25, -s * 0.42);
      g.fillStyle(0xffd700, 1);
      g.fillCircle(0, -s * 0.75, s * 0.03);
    } else if (classType === PlayerClass.ARCHER) {
      // Bow on left
      g.lineStyle(2.5, 0x8b4513, 1);
      g.beginPath();
      g.arc(-s * 0.45, 0, s * 0.3, -1.2, 1.2, false);
      g.strokePath();
      g.lineStyle(1, 0xddd, 1);
      g.lineBetween(
        -s * 0.45 + s * 0.3 * Math.cos(-1.2),
        s * 0.3 * Math.sin(-1.2),
        -s * 0.45 + s * 0.3 * Math.cos(1.2),
        s * 0.3 * Math.sin(1.2),
      );
      // Quiver on back
      g.fillStyle(0x8b4513, 1);
      g.fillRect(s * 0.18, -s * 0.4, s * 0.1, s * 0.35);
      g.fillStyle(0xc0c0c0, 1);
      g.fillRect(s * 0.19, -s * 0.48, s * 0.02, s * 0.14);
      g.fillRect(s * 0.23, -s * 0.46, s * 0.02, s * 0.12);
      g.fillRect(s * 0.27, -s * 0.44, s * 0.02, s * 0.1);
    }

    // Local player golden glow
    if (isLocal) {
      g.lineStyle(2, 0xffd700, 0.7);
      g.strokeCircle(0, 0, s * 0.6);
    }
  }

  /** Create the local player sprite */
  private createPlayerSprite(data: PlayerData): void {
    const ts = ClientConfig.TILE_SIZE;
    const container = this.add.container(
      data.x * ts + ts / 2,
      data.y * ts + ts / 2,
    );
    container.setDepth(10);

    // Use pixel art sprite texture
    const texKey = getPlayerTextureKey(data.class);
    const bodySprite = this.add.image(0, -8, texKey);
    bodySprite.setScale(1.4); // Make character 1.4x for visibility
    container.add(bodySprite);

    // Shadow under character
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillEllipse(0, ts * 0.25, ts * 0.5, ts * 0.15);
    container.addAt(shadow, 0);

    // Golden selection ring for local player
    const ring = this.add.graphics();
    ring.lineStyle(1.5, 0xffd700, 0.5);
    ring.strokeEllipse(0, ts * 0.25, ts * 0.6, ts * 0.2);
    container.addAt(ring, 0);

    // Name text
    const nameText = this.add.text(0, -ts * 0.85, data.name, {
      fontSize: "12px",
      color: "#ffd700",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    });
    nameText.setOrigin(0.5, 1);
    container.add(nameText);

    container.setData("entityData", {
      id: data.id || this.playerId,
      type: EntityType.PLAYER,
      bodySprite,
      playerClass: data.class,
    } as any);

    this.playerSprite = container;
  }

  /** Create another player's sprite */
  private createOtherPlayerSprite(data: PlayerData): void {
    const ts = ClientConfig.TILE_SIZE;
    const container = this.add.container(
      data.x * ts + ts / 2,
      data.y * ts + ts / 2,
    );
    container.setDepth(8);

    const texKey = getPlayerTextureKey(data.class);
    const bodySprite = this.add.image(0, -8, texKey);
    bodySprite.setScale(1.4);
    container.add(bodySprite);

    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.25);
    shadow.fillEllipse(0, ts * 0.25, ts * 0.5, ts * 0.15);
    container.addAt(shadow, 0);

    // Name color based on karma and PK mode
    let nameColor = "#e8d5b0";
    let displayName = data.name;
    if (data.karma !== undefined && data.karma < -30) {
      nameColor = "#FF4444"; // Red name for negative karma
    }
    if (data.pkMode) {
      displayName = `[PK] ${data.name}`;
      nameColor = "#FF6666";
    }
    if (data.invulnerable) {
      nameColor = "#88CCFF"; // Blue for invulnerable
    }

    const nameText = this.add.text(0, -ts * 0.85, displayName, {
      fontSize: "11px",
      color: nameColor,
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    });
    nameText.setOrigin(0.5, 1);
    container.add(nameText);

    // Store entity data for interpolation
    container.setData("entityData", {
      id: data.id,
      type: EntityType.PLAYER,
      targetX: data.x * ts + ts / 2,
      targetY: data.y * ts + ts / 2,
      currentX: data.x * ts + ts / 2,
      currentY: data.y * ts + ts / 2,
      nameText,
      bodySprite,
      playerClass: data.class,
      karma: data.karma,
      pkMode: data.pkMode,
    } as EntityContainerData);

    this.otherPlayers.set(data.id, container);
  }

  /** Draw a monster shape based on mob type */
  private drawMonster(
    g: Phaser.GameObjects.Graphics,
    ts: number,
    mobId: string,
    level: number,
    isBoss: boolean,
    behavior: string,
  ): void {
    const scale = isBoss ? 1.4 : 0.9 + Math.min(level, 50) * 0.006;
    const s = ts * 0.65 * scale;

    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(0, s * 0.55, s * 0.8, s * 0.15);

    // Determine mob visual category from id
    const id = mobId.toLowerCase();
    let mainColor = 0xcc4444;
    if (behavior === MobBehavior.PASSIVE) mainColor = 0x88aa44;
    if (behavior === MobBehavior.BOSS || isBoss) mainColor = 0xaa22aa;

    if (id.includes("slime") || id.includes("ooze")) {
      // --- Slime: round blob ---
      const c = id.includes("fire")
        ? 0xff6633
        : id.includes("ice")
          ? 0x66ccff
          : id.includes("poison")
            ? 0x66cc44
            : 0x44cc66;
      g.fillStyle(c, 0.85);
      g.fillEllipse(0, s * 0.1, s * 0.8, s * 0.7);
      g.fillStyle(c, 0.6);
      g.fillEllipse(0, -s * 0.05, s * 0.6, s * 0.5);
      // Eyes
      g.fillStyle(0xffffff, 1);
      g.fillCircle(-s * 0.15, -s * 0.05, s * 0.1);
      g.fillCircle(s * 0.15, -s * 0.05, s * 0.1);
      g.fillStyle(0x000000, 1);
      g.fillCircle(-s * 0.12, -s * 0.03, s * 0.05);
      g.fillCircle(s * 0.18, -s * 0.03, s * 0.05);
      // Mouth
      g.lineStyle(1.5, 0x000000, 0.7);
      g.beginPath();
      g.arc(0, s * 0.12, s * 0.12, 0.2, Math.PI - 0.2, false);
      g.strokePath();
    } else if (
      id.includes("wolf") ||
      id.includes("hound") ||
      id.includes("fox")
    ) {
      // --- Wolf: quadruped ---
      const c = id.includes("dire")
        ? 0x555555
        : id.includes("shadow")
          ? 0x333355
          : 0x8b7355;
      // Body
      g.fillStyle(c, 1);
      g.fillEllipse(0, s * 0.1, s * 0.9, s * 0.45);
      // Legs
      g.fillRect(-s * 0.35, s * 0.25, s * 0.1, s * 0.25);
      g.fillRect(-s * 0.15, s * 0.25, s * 0.1, s * 0.25);
      g.fillRect(s * 0.1, s * 0.25, s * 0.1, s * 0.25);
      g.fillRect(s * 0.28, s * 0.25, s * 0.1, s * 0.25);
      // Head
      g.fillStyle(c, 1);
      g.fillCircle(-s * 0.4, -s * 0.1, s * 0.22);
      // Ears
      g.fillTriangle(
        -s * 0.52,
        -s * 0.35,
        -s * 0.42,
        -s * 0.15,
        -s * 0.55,
        -s * 0.15,
      );
      g.fillTriangle(
        -s * 0.28,
        -s * 0.35,
        -s * 0.38,
        -s * 0.15,
        -s * 0.25,
        -s * 0.15,
      );
      // Eye
      g.fillStyle(0xff3333, 1);
      g.fillCircle(-s * 0.45, -s * 0.12, s * 0.04);
      // Snout
      g.fillStyle(0x666666, 1);
      g.fillCircle(-s * 0.55, -s * 0.05, s * 0.06);
      // Tail
      g.lineStyle(3, c, 1);
      g.beginPath();
      g.arc(s * 0.45, -s * 0.05, s * 0.2, 1.5, 3.5, false);
      g.strokePath();
    } else if (
      id.includes("goblin") ||
      id.includes("imp") ||
      id.includes("orc")
    ) {
      // --- Goblin/Orc: small humanoid ---
      const c = id.includes("orc")
        ? 0x556b2f
        : id.includes("imp")
          ? 0xcc3322
          : 0x6b8e23;
      // Body
      g.fillStyle(c, 1);
      g.fillRoundedRect(-s * 0.25, -s * 0.05, s * 0.5, s * 0.4, 3);
      // Head
      g.fillStyle(c, 1);
      g.fillCircle(0, -s * 0.2, s * 0.22);
      // Ears (pointy)
      g.fillTriangle(
        -s * 0.35,
        -s * 0.25,
        -s * 0.2,
        -s * 0.2,
        -s * 0.22,
        -s * 0.38,
      );
      g.fillTriangle(
        s * 0.35,
        -s * 0.25,
        s * 0.2,
        -s * 0.2,
        s * 0.22,
        -s * 0.38,
      );
      // Eyes (big, yellow)
      g.fillStyle(0xffff00, 1);
      g.fillCircle(-s * 0.1, -s * 0.23, s * 0.06);
      g.fillCircle(s * 0.1, -s * 0.23, s * 0.06);
      g.fillStyle(0x000000, 1);
      g.fillCircle(-s * 0.1, -s * 0.22, s * 0.03);
      g.fillCircle(s * 0.1, -s * 0.22, s * 0.03);
      // Legs
      g.fillStyle(c, 1);
      g.fillRect(-s * 0.18, s * 0.3, s * 0.12, s * 0.2);
      g.fillRect(s * 0.06, s * 0.3, s * 0.12, s * 0.2);
      // Weapon (club)
      g.fillStyle(0x8b4513, 1);
      g.fillRect(s * 0.28, -s * 0.15, s * 0.06, s * 0.4);
      g.fillCircle(s * 0.31, -s * 0.15, s * 0.08);
    } else if (
      id.includes("skeleton") ||
      id.includes("undead") ||
      id.includes("zombie")
    ) {
      // --- Skeleton/Undead ---
      const c = id.includes("zombie") ? 0x556b2f : 0xe8e8d5;
      g.fillStyle(c, 1);
      // Ribcage body
      g.fillRoundedRect(-s * 0.2, -s * 0.05, s * 0.4, s * 0.35, 2);
      if (!id.includes("zombie")) {
        g.fillStyle(0x222222, 1);
        for (let i = 0; i < 3; i++) {
          g.fillRect(-s * 0.12, s * 0.02 + i * s * 0.08, s * 0.24, s * 0.03);
        }
      }
      // Skull
      g.fillStyle(c, 1);
      g.fillCircle(0, -s * 0.2, s * 0.2);
      // Eye sockets
      g.fillStyle(0x000000, 1);
      g.fillCircle(-s * 0.08, -s * 0.22, s * 0.06);
      g.fillCircle(s * 0.08, -s * 0.22, s * 0.06);
      g.fillStyle(0xff0000, 0.8);
      g.fillCircle(-s * 0.08, -s * 0.22, s * 0.03);
      g.fillCircle(s * 0.08, -s * 0.22, s * 0.03);
      // Jaw
      g.fillStyle(c, 1);
      g.fillRect(-s * 0.1, -s * 0.06, s * 0.2, s * 0.04);
      // Arms (bones)
      g.fillStyle(c, 1);
      g.fillRect(-s * 0.35, -s * 0.02, s * 0.16, s * 0.05);
      g.fillRect(s * 0.19, -s * 0.02, s * 0.16, s * 0.05);
      // Legs
      g.fillRect(-s * 0.15, s * 0.28, s * 0.08, s * 0.22);
      g.fillRect(s * 0.07, s * 0.28, s * 0.08, s * 0.22);
    } else if (id.includes("spider") || id.includes("scorpion")) {
      // --- Spider ---
      const c = id.includes("scorpion") ? 0x8b4513 : 0x2f2f2f;
      g.fillStyle(c, 1);
      g.fillEllipse(0, s * 0.05, s * 0.5, s * 0.35);
      g.fillCircle(0, -s * 0.2, s * 0.18);
      // Eyes (8 red dots)
      g.fillStyle(0xff0000, 1);
      for (let i = -2; i <= 1; i++) {
        g.fillCircle(i * s * 0.06 + s * 0.03, -s * 0.22, s * 0.025);
        g.fillCircle(i * s * 0.06 + s * 0.03, -s * 0.17, s * 0.02);
      }
      // Legs (8)
      g.lineStyle(2, c, 1);
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 4; i++) {
          const angle = -0.8 + i * 0.5;
          const x1 = side * s * 0.25;
          const y1 = -s * 0.1 + i * s * 0.08;
          const x2 = side * s * 0.55;
          const y2 = y1 + s * 0.15;
          g.lineBetween(x1, y1, x2, y2);
        }
      }
    } else if (
      id.includes("dragon") ||
      id.includes("drake") ||
      id.includes("wyrm")
    ) {
      // --- Dragon ---
      const c = id.includes("void")
        ? 0x330066
        : id.includes("fire")
          ? 0xcc2200
          : id.includes("ice")
            ? 0x4488cc
            : id.includes("elder")
              ? 0x886600
              : 0x882200;
      // Body
      g.fillStyle(c, 1);
      g.fillEllipse(0, s * 0.1, s * 0.9, s * 0.5);
      // Belly
      g.fillStyle(Phaser.Display.Color.IntegerToColor(c).brighten(30).color, 1);
      g.fillEllipse(0, s * 0.15, s * 0.5, s * 0.3);
      // Head
      g.fillStyle(c, 1);
      g.fillEllipse(0, -s * 0.3, s * 0.4, s * 0.3);
      // Horns
      g.fillStyle(0xccaa44, 1);
      g.fillTriangle(
        -s * 0.18,
        -s * 0.4,
        -s * 0.12,
        -s * 0.3,
        -s * 0.25,
        -s * 0.55,
      );
      g.fillTriangle(
        s * 0.18,
        -s * 0.4,
        s * 0.12,
        -s * 0.3,
        s * 0.25,
        -s * 0.55,
      );
      // Eyes
      g.fillStyle(0xffcc00, 1);
      g.fillCircle(-s * 0.1, -s * 0.33, s * 0.06);
      g.fillCircle(s * 0.1, -s * 0.33, s * 0.06);
      g.fillStyle(0x000000, 1);
      g.fillCircle(-s * 0.1, -s * 0.33, s * 0.03);
      g.fillCircle(s * 0.1, -s * 0.33, s * 0.03);
      // Wings
      g.fillStyle(c, 0.7);
      g.fillTriangle(
        -s * 0.45,
        -s * 0.1,
        -s * 0.9,
        -s * 0.45,
        -s * 0.3,
        s * 0.1,
      );
      g.fillTriangle(s * 0.45, -s * 0.1, s * 0.9, -s * 0.45, s * 0.3, s * 0.1);
      // Claws
      g.fillStyle(0x222222, 1);
      g.fillRect(-s * 0.35, s * 0.3, s * 0.1, s * 0.15);
      g.fillRect(s * 0.25, s * 0.3, s * 0.1, s * 0.15);
      // Nostrils (fire)
      g.fillStyle(0xff4400, 0.5);
      g.fillCircle(-s * 0.06, -s * 0.18, s * 0.025);
      g.fillCircle(s * 0.06, -s * 0.18, s * 0.025);
    } else if (
      id.includes("golem") ||
      id.includes("guardian") ||
      id.includes("knight") ||
      id.includes("warrior")
    ) {
      // --- Golem/Armored: big bulky ---
      const c = id.includes("stone")
        ? 0x808080
        : id.includes("magma")
          ? 0xcc4400
          : id.includes("celestial")
            ? 0xeedd88
            : 0x666688;
      // Body
      g.fillStyle(c, 1);
      g.fillRoundedRect(-s * 0.35, -s * 0.15, s * 0.7, s * 0.5, 5);
      // Head
      g.fillCircle(0, -s * 0.28, s * 0.2);
      // Eyes
      g.fillStyle(id.includes("magma") ? 0xff6600 : 0x66ccff, 1);
      g.fillCircle(-s * 0.08, -s * 0.3, s * 0.05);
      g.fillCircle(s * 0.08, -s * 0.3, s * 0.05);
      // Arms (thick)
      g.fillStyle(c, 1);
      g.fillRoundedRect(-s * 0.55, -s * 0.1, s * 0.22, s * 0.4, 3);
      g.fillRoundedRect(s * 0.33, -s * 0.1, s * 0.22, s * 0.4, 3);
      // Legs
      g.fillRect(-s * 0.25, s * 0.3, s * 0.18, s * 0.2);
      g.fillRect(s * 0.07, s * 0.3, s * 0.18, s * 0.2);
      // Cracks/detail
      g.lineStyle(1, 0x000000, 0.3);
      g.lineBetween(-s * 0.15, -s * 0.05, s * 0.1, s * 0.15);
      g.lineBetween(s * 0.05, 0, -s * 0.1, s * 0.2);
    } else if (
      id.includes("bat") ||
      id.includes("phantom") ||
      id.includes("ghost") ||
      id.includes("wraith") ||
      id.includes("nightmare")
    ) {
      // --- Ghost/Phantom ---
      const c = id.includes("bat") ? 0x443344 : 0x8866cc;
      g.fillStyle(c, 0.7);
      // Floating body
      g.fillEllipse(0, -s * 0.05, s * 0.5, s * 0.55);
      // Wispy bottom
      for (let i = -2; i <= 2; i++) {
        g.fillEllipse(i * s * 0.12, s * 0.3, s * 0.12, s * 0.15);
      }
      // Eyes
      g.fillStyle(0xffffff, 1);
      g.fillCircle(-s * 0.1, -s * 0.1, s * 0.08);
      g.fillCircle(s * 0.1, -s * 0.1, s * 0.08);
      g.fillStyle(0x000000, 1);
      g.fillCircle(-s * 0.1, -s * 0.1, s * 0.04);
      g.fillCircle(s * 0.1, -s * 0.1, s * 0.04);
      // Mouth
      g.fillStyle(0x000000, 0.6);
      g.fillEllipse(0, s * 0.1, s * 0.12, s * 0.08);
    } else if (
      id.includes("snake") ||
      id.includes("serpent") ||
      id.includes("worm")
    ) {
      // --- Serpent ---
      const c = id.includes("void") ? 0x330066 : 0x448844;
      g.lineStyle(s * 0.2, c, 1);
      g.beginPath();
      g.arc(-s * 0.2, 0, s * 0.25, -1.5, 1.5, false);
      g.strokePath();
      g.lineStyle(s * 0.2, c, 1);
      g.beginPath();
      g.arc(s * 0.2, 0, s * 0.25, 1.5, -1.5, false);
      g.strokePath();
      // Head
      g.fillStyle(c, 1);
      g.fillCircle(-s * 0.4, -s * 0.15, s * 0.15);
      g.fillStyle(0xff0000, 1);
      g.fillCircle(-s * 0.43, -s * 0.18, s * 0.04);
      // Tongue
      g.lineStyle(1.5, 0xff0000, 1);
      g.lineBetween(-s * 0.55, -s * 0.15, -s * 0.65, -s * 0.2);
      g.lineBetween(-s * 0.55, -s * 0.15, -s * 0.65, -s * 0.1);
    } else if (id.includes("bear") || id.includes("boar")) {
      // --- Bear/Boar ---
      const c = id.includes("boar") ? 0x8b6914 : 0x6b4423;
      g.fillStyle(c, 1);
      g.fillEllipse(0, s * 0.05, s * 0.8, s * 0.5);
      // Head
      g.fillCircle(-s * 0.3, -s * 0.2, s * 0.2);
      // Ears
      g.fillCircle(-s * 0.4, -s * 0.35, s * 0.08);
      g.fillCircle(-s * 0.2, -s * 0.35, s * 0.08);
      // Eyes
      g.fillStyle(0x000000, 1);
      g.fillCircle(-s * 0.35, -s * 0.22, s * 0.035);
      g.fillCircle(-s * 0.25, -s * 0.22, s * 0.035);
      // Nose
      g.fillStyle(0x333333, 1);
      g.fillCircle(-s * 0.38, -s * 0.15, s * 0.04);
      // Legs
      g.fillStyle(c, 1);
      g.fillRect(-s * 0.3, s * 0.22, s * 0.12, s * 0.2);
      g.fillRect(-s * 0.1, s * 0.22, s * 0.12, s * 0.2);
      g.fillRect(s * 0.1, s * 0.22, s * 0.12, s * 0.2);
      g.fillRect(s * 0.28, s * 0.22, s * 0.12, s * 0.2);
    } else if (
      id.includes("mage") ||
      id.includes("witch") ||
      id.includes("cursed") ||
      id.includes("rune")
    ) {
      // --- Enemy mage ---
      const c = id.includes("cursed") ? 0x550055 : 0x333366;
      g.fillStyle(c, 1);
      g.fillRoundedRect(-s * 0.22, -s * 0.05, s * 0.44, s * 0.4, 3);
      // Hood/head
      g.fillTriangle(0, -s * 0.55, -s * 0.25, -s * 0.1, s * 0.25, -s * 0.1);
      // Eyes in hood
      g.fillStyle(0xff4400, 1);
      g.fillCircle(-s * 0.08, -s * 0.2, s * 0.04);
      g.fillCircle(s * 0.08, -s * 0.2, s * 0.04);
      // Staff
      g.fillStyle(0x8b4513, 1);
      g.fillRect(s * 0.28, -s * 0.45, s * 0.04, s * 0.65);
      g.fillStyle(0x9b59b6, 1);
      g.fillCircle(s * 0.3, -s * 0.5, s * 0.07);
      // Robe bottom
      g.fillStyle(c, 1);
      g.fillTriangle(-s * 0.3, s * 0.35, s * 0.3, s * 0.35, 0, s * 0.5);
    } else if (
      id.includes("demon") ||
      id.includes("chaos") ||
      id.includes("infernal") ||
      id.includes("abyss") ||
      id.includes("dark_overlord") ||
      id.includes("void")
    ) {
      // --- Demon ---
      const c = id.includes("void")
        ? 0x220044
        : id.includes("chaos")
          ? 0x880000
          : 0xaa2222;
      g.fillStyle(c, 1);
      g.fillRoundedRect(-s * 0.3, -s * 0.1, s * 0.6, s * 0.45, 4);
      // Head
      g.fillCircle(0, -s * 0.25, s * 0.22);
      // Horns
      g.fillStyle(0x333333, 1);
      g.fillTriangle(
        -s * 0.2,
        -s * 0.35,
        -s * 0.15,
        -s * 0.2,
        -s * 0.35,
        -s * 0.55,
      );
      g.fillTriangle(
        s * 0.2,
        -s * 0.35,
        s * 0.15,
        -s * 0.2,
        s * 0.35,
        -s * 0.55,
      );
      // Eyes
      g.fillStyle(0xff0000, 1);
      g.fillCircle(-s * 0.1, -s * 0.28, s * 0.06);
      g.fillCircle(s * 0.1, -s * 0.28, s * 0.06);
      // Wings
      g.fillStyle(c, 0.6);
      g.fillTriangle(
        -s * 0.3,
        -s * 0.05,
        -s * 0.8,
        -s * 0.35,
        -s * 0.2,
        s * 0.15,
      );
      g.fillTriangle(s * 0.3, -s * 0.05, s * 0.8, -s * 0.35, s * 0.2, s * 0.15);
      // Arms
      g.fillStyle(c, 1);
      g.fillRect(-s * 0.45, -s * 0.05, s * 0.16, s * 0.35);
      g.fillRect(s * 0.29, -s * 0.05, s * 0.16, s * 0.35);
      // Claws
      g.fillStyle(0x222222, 1);
      g.fillTriangle(
        -s * 0.45,
        s * 0.3,
        -s * 0.5,
        s * 0.4,
        -s * 0.38,
        s * 0.35,
      );
      g.fillTriangle(s * 0.45, s * 0.3, s * 0.5, s * 0.4, s * 0.38, s * 0.35);
      // Legs
      g.fillStyle(c, 1);
      g.fillRect(-s * 0.2, s * 0.3, s * 0.14, s * 0.2);
      g.fillRect(s * 0.06, s * 0.3, s * 0.14, s * 0.2);
    } else {
      // --- Default: generic creature ---
      g.fillStyle(mainColor, 1);
      g.fillEllipse(0, s * 0.05, s * 0.65, s * 0.5);
      g.fillCircle(0, -s * 0.2, s * 0.2);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(-s * 0.08, -s * 0.22, s * 0.06);
      g.fillCircle(s * 0.08, -s * 0.22, s * 0.06);
      g.fillStyle(0x000000, 1);
      g.fillCircle(-s * 0.08, -s * 0.22, s * 0.03);
      g.fillCircle(s * 0.08, -s * 0.22, s * 0.03);
      // Legs
      g.fillStyle(mainColor, 1);
      g.fillRect(-s * 0.2, s * 0.25, s * 0.1, s * 0.2);
      g.fillRect(s * 0.1, s * 0.25, s * 0.1, s * 0.2);
    }

    // Boss golden aura
    if (isBoss) {
      g.lineStyle(2.5, 0xffcc00, 0.8);
      g.strokeCircle(0, 0, s * 0.75);
      g.lineStyle(1.5, 0xffcc00, 0.4);
      g.strokeCircle(0, 0, s * 0.85);
    }
  }

  /** Create a mob sprite */
  private createMobSprite(data: MobData): void {
    const ts = ClientConfig.TILE_SIZE;
    const container = this.add.container(
      data.x * ts + ts / 2,
      data.y * ts + ts / 2,
    );
    container.setDepth(6);

    const sizeMultiplier = data.isBoss ? 1.5 : 1.1;
    const halfSize = ts * 0.4 * sizeMultiplier;

    // Use pixel art mob texture
    const texKey = getMobTextureKey(data.mobId || data.id);
    const bodySprite = this.add.image(0, -4, texKey);
    bodySprite.setScale(sizeMultiplier);
    container.add(bodySprite);

    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.25);
    shadow.fillEllipse(0, ts * 0.2, ts * 0.4 * sizeMultiplier, ts * 0.12);
    container.addAt(shadow, 0);

    // Boss golden aura + red glow
    if (data.isBoss) {
      const aura = this.add.graphics();
      aura.lineStyle(2.5, 0xffcc00, 0.7);
      aura.strokeEllipse(0, 0, ts * 1.0, ts * 0.8);
      aura.lineStyle(1.5, 0xff4444, 0.3);
      aura.strokeEllipse(0, 0, ts * 1.15, ts * 0.9);
      container.addAt(aura, 0);
    }

    // Determine name color based on difficulty relative to player
    const displayName = (data as any).nameKo || data.name || "\uBAB9";
    let nameColor = "#ff9999"; // default red
    if (data.isBoss) {
      nameColor = "#ffcc00"; // gold for bosses
    } else if (data.level <= 5) {
      nameColor = "#88cc88"; // green for easy
    } else if (data.level <= 15) {
      nameColor = "#ffcc66"; // yellow for normal
    } else if (data.level <= 30) {
      nameColor = "#ff8866"; // orange for hard
    } else {
      nameColor = "#cc66ff"; // purple for very hard
    }

    // Boss skull icon prefix
    const namePrefix = data.isBoss ? "\u2620 " : "";

    const nameText = this.add.text(
      0,
      -halfSize - 18,
      `${namePrefix}Lv.${data.level} ${displayName}`,
      {
        fontSize: data.isBoss ? "13px" : "10px",
        color: nameColor,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: data.isBoss ? 4 : 3,
      },
    );
    nameText.setOrigin(0.5, 1);
    container.add(nameText);

    // Health bar
    const healthBar = this.add.graphics();
    this.drawHealthBar(healthBar, data.hp, data.maxHp, halfSize, data.isBoss);
    container.add(healthBar);

    container.setData("entityData", {
      id: data.id,
      type: EntityType.MOB,
      targetX: data.x * ts + ts / 2,
      targetY: data.y * ts + ts / 2,
      currentX: data.x * ts + ts / 2,
      currentY: data.y * ts + ts / 2,
      nameText,
      healthBar,
      bodySprite,
      hp: data.hp,
      maxHp: data.maxHp,
      level: data.level,
      isBoss: data.isBoss,
      mobId: data.mobId || data.id,
    } as EntityContainerData);

    this.mobs.set(data.id, container);
  }

  /** Draw an NPC (merchant/shopkeeper) */
  private drawNpc(
    g: Phaser.GameObjects.Graphics,
    ts: number,
    npcName: string,
  ): void {
    const s = ts * 0.7;
    const skinColor = 0xffd5b4;
    const name = (npcName || "").toLowerCase();

    let robeColor = 0x6b4423;
    let hatColor = 0x8b4513;
    if (name.includes("weapon") || name.includes("blacksmith")) {
      robeColor = 0x555555;
      hatColor = 0x333333;
    } else if (name.includes("armor")) {
      robeColor = 0x4a6fa5;
      hatColor = 0x3a5a8a;
    } else if (name.includes("potion") || name.includes("brewer")) {
      robeColor = 0x6b2fa0;
      hatColor = 0x4a148c;
    } else if (name.includes("jewel")) {
      robeColor = 0xaa7722;
      hatColor = 0x886611;
    } else if (name.includes("scroll")) {
      robeColor = 0x2e4600;
      hatColor = 0x1a3000;
    } else if (name.includes("elite")) {
      robeColor = 0x8b0000;
      hatColor = 0x660000;
    } else if (name.includes("guide")) {
      robeColor = 0x2196f3;
      hatColor = 0x1565c0;
    }

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(0, s * 0.48, s * 0.7, s * 0.18);
    // Legs
    g.fillStyle(0x4a3728, 1);
    g.fillRect(-s * 0.15, s * 0.2, s * 0.12, s * 0.25);
    g.fillRect(s * 0.03, s * 0.2, s * 0.12, s * 0.25);
    // Robe
    g.fillStyle(robeColor, 1);
    g.fillRoundedRect(-s * 0.3, -s * 0.15, s * 0.6, s * 0.45, 4);
    g.fillTriangle(-s * 0.35, s * 0.3, s * 0.35, s * 0.3, 0, s * 0.15);
    // Sash
    g.fillStyle(0xffd700, 0.8);
    g.fillRect(-s * 0.3, s * 0.1, s * 0.6, s * 0.04);
    // Arms
    g.fillStyle(robeColor, 1);
    g.fillRect(-s * 0.42, -s * 0.08, s * 0.14, s * 0.28);
    g.fillRect(s * 0.28, -s * 0.08, s * 0.14, s * 0.28);
    // Hands
    g.fillStyle(skinColor, 1);
    g.fillCircle(-s * 0.35, s * 0.22, s * 0.06);
    g.fillCircle(s * 0.35, s * 0.22, s * 0.06);
    // Head
    g.fillStyle(skinColor, 1);
    g.fillCircle(0, -s * 0.3, s * 0.19);
    // Hat
    g.fillStyle(hatColor, 1);
    g.fillRoundedRect(-s * 0.24, -s * 0.5, s * 0.48, s * 0.18, 3);
    g.fillRect(-s * 0.3, -s * 0.36, s * 0.6, s * 0.06);
    // Eyes
    g.fillStyle(0x000000, 1);
    g.fillCircle(-s * 0.07, -s * 0.32, s * 0.03);
    g.fillCircle(s * 0.07, -s * 0.32, s * 0.03);
    // Smile
    g.lineStyle(1.5, 0xc47a6a, 1);
    g.beginPath();
    g.arc(0, -s * 0.24, s * 0.07, 0.3, Math.PI - 0.3, false);
    g.strokePath();
    // Quest marker "!"
    g.fillStyle(0xffd700, 1);
    g.fillRoundedRect(-s * 0.04, -s * 0.72, s * 0.08, s * 0.14, 2);
    g.fillCircle(0, -s * 0.55, s * 0.035);
  }

  /** Create an NPC sprite */
  private createNpcSprite(data: EntityData): void {
    const ts = ClientConfig.TILE_SIZE;
    const container = this.add.container(
      data.x * ts + ts / 2,
      data.y * ts + ts / 2,
    );
    container.setDepth(7);

    // Use pixel art NPC texture
    const texKey = getNpcTextureKey((data as any).npcId || data.name || "NPC");
    const bodySprite = this.add.image(0, -8, texKey);
    bodySprite.setScale(1.4);
    container.add(bodySprite);

    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.25);
    shadow.fillEllipse(0, ts * 0.25, ts * 0.5, ts * 0.15);
    container.addAt(shadow, 0);

    const displayName = (data as any).nameKo || data.name || "NPC";
    const nameText = this.add.text(0, -ts * 0.85, displayName, {
      fontSize: "11px",
      color: "#ffd700",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    });
    nameText.setOrigin(0.5, 1);
    container.add(nameText);

    container.setData("entityData", {
      id: data.id,
      type: EntityType.NPC,
      targetX: data.x * ts + ts / 2,
      targetY: data.y * ts + ts / 2,
      currentX: data.x * ts + ts / 2,
      currentY: data.y * ts + ts / 2,
      nameText,
      bodySprite,
    } as EntityContainerData);

    this.npcs.set(data.id, container);
  }

  /** Create an item drop sprite on the ground */
  private createItemDropSprite(data: {
    id: string;
    x: number;
    y: number;
    name?: string;
    nameKo?: string;
    color?: string;
  }): void {
    const ts = ClientConfig.TILE_SIZE;
    const container = this.add.container(
      data.x * ts + ts / 2,
      data.y * ts + ts / 2,
    );
    container.setDepth(4);

    const body = this.add.graphics();
    const color = data.color
      ? parseInt(data.color.replace("#", ""), 16)
      : 0xffd700;
    body.fillStyle(color, 1);
    body.fillRoundedRect(-6, -6, 12, 12, 2);
    body.lineStyle(1, 0xffffff, 0.5);
    body.strokeRoundedRect(-6, -6, 12, 12, 2);
    container.add(body);

    // Name label
    if (data.nameKo || data.name) {
      const label = this.add.text(0, 10, data.nameKo || data.name || "", {
        fontSize: "9px",
        color: "#ffd700",
        stroke: "#000000",
        strokeThickness: 1,
      });
      label.setOrigin(0.5, 0);
      container.add(label);
    }

    container.setData("entityData", {
      id: data.id,
      type: EntityType.ITEM_DROP,
      targetX: data.x * ts + ts / 2,
      targetY: data.y * ts + ts / 2,
      currentX: data.x * ts + ts / 2,
      currentY: data.y * ts + ts / 2,
    } as EntityContainerData);

    this.itemDrops.set(data.id, container);
  }

  // ================================================
  // Health Bars
  // ================================================

  private drawHealthBar(
    g: Phaser.GameObjects.Graphics,
    hp: number,
    maxHp: number,
    halfSize: number,
    isBoss: boolean = false,
  ): void {
    g.clear();
    const barWidth = isBoss ? halfSize * 3.0 : halfSize * 2.2;
    const barHeight = isBoss ? 7 : 5;
    const barY = halfSize + 5;

    // Outer border (darker for bosses)
    g.fillStyle(isBoss ? 0x332200 : 0x000000, 0.9);
    g.fillRect(-barWidth / 2 - 2, barY - 2, barWidth + 4, barHeight + 4);

    // Inner border
    g.fillStyle(0x000000, 0.9);
    g.fillRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

    // Boss golden border
    if (isBoss) {
      g.lineStyle(1, 0xffcc00, 0.6);
      g.strokeRect(-barWidth / 2 - 2, barY - 2, barWidth + 4, barHeight + 4);
    }

    // Background
    g.fillStyle(0x1a1a1a, 0.9);
    g.fillRect(-barWidth / 2, barY, barWidth, barHeight);

    // Fill with gradient-like effect
    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    const fillColor =
      ratio > 0.5 ? 0x3a8a3a : ratio > 0.25 ? 0xcc7a00 : 0xaa2222;
    g.fillStyle(fillColor, 1);
    g.fillRect(-barWidth / 2, barY, barWidth * ratio, barHeight);

    // Highlight on top of fill (gradient simulation)
    const brightColor =
      ratio > 0.5 ? 0x5aaa5a : ratio > 0.25 ? 0xeeaa33 : 0xcc4444;
    g.fillStyle(brightColor, 0.4);
    g.fillRect(-barWidth / 2, barY, barWidth * ratio, 2);
  }

  private updateEntityHealthBar(
    container: Phaser.GameObjects.Container,
    hp: number,
    maxHp: number,
  ): void {
    const entityData = container.getData("entityData") as EntityContainerData;
    if (!entityData?.healthBar) return;

    const ts = ClientConfig.TILE_SIZE;
    const isBoss = entityData.isBoss || false;
    const halfSize = ts * 0.35 * (isBoss ? 1.5 : 0.9);

    this.drawHealthBar(entityData.healthBar, hp, maxHp, halfSize, isBoss);
  }

  // ================================================
  // Entity Management
  // ================================================

  private findContainer(id: string): Phaser.GameObjects.Container | null {
    return (
      this.otherPlayers.get(id) ||
      this.mobs.get(id) ||
      this.npcs.get(id) ||
      this.itemDrops.get(id) ||
      null
    );
  }

  private removeEntity(id: string): void {
    const maps = [this.otherPlayers, this.mobs, this.npcs, this.itemDrops];
    for (const map of maps) {
      const container = map.get(id);
      if (container) {
        container.destroy();
        map.delete(id);
        break;
      }
    }

    if (this.selectedTarget === id) {
      this.selectedTarget = null;
    }
  }

  private clearAllEntities(): void {
    for (const [, container] of this.otherPlayers) container.destroy();
    for (const [, container] of this.mobs) container.destroy();
    for (const [, container] of this.npcs) container.destroy();
    for (const [, container] of this.itemDrops) container.destroy();

    this.otherPlayers.clear();
    this.mobs.clear();
    this.npcs.clear();
    this.itemDrops.clear();
    this.selectedTarget = null;
  }

  // ================================================
  // Entity Interpolation
  // ================================================

  private interpolateEntities(delta: number): void {
    const speed = ClientConfig.MOVE_SPEED * (delta / 1000) * 4;

    const interpolate = (container: Phaser.GameObjects.Container) => {
      const data = container.getData("entityData") as EntityContainerData;
      if (!data) return;

      const dx = data.targetX - container.x;
      const dy = data.targetY - container.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) {
        container.x = data.targetX;
        container.y = data.targetY;
      } else if (dist > ClientConfig.TILE_SIZE * 10) {
        // Teleport if too far
        container.x = data.targetX;
        container.y = data.targetY;
      } else {
        const moveSpeed = Math.min(dist, speed);
        container.x += (dx / dist) * moveSpeed;
        container.y += (dy / dist) * moveSpeed;
      }
    };

    this.otherPlayers.forEach(interpolate);
    this.mobs.forEach(interpolate);
  }

  // ================================================
  // Visual Effects
  // ================================================

  /** Show a floating damage number with enhanced visuals */
  private showDamageNumber(
    x: number,
    y: number,
    damage: number,
    isCrit: boolean = false,
  ): void {
    if (isCrit) {
      // Critical hit: "CRITICAL!" label + large golden number + screen shake + particles
      const critLabel = this.add.text(x, y - 30, "CRITICAL!", {
        fontSize: "11px",
        color: "#FFD700",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      });
      critLabel.setOrigin(0.5, 1);
      critLabel.setDepth(52);
      this.tweens.add({
        targets: critLabel,
        y: y - 60,
        alpha: 0,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 900,
        ease: "Power2",
        onComplete: () => critLabel.destroy(),
      });

      // Large damage number
      const dmgText = `${damage}`;
      const text = this.add.text(x, y - 10, dmgText, {
        fontSize: "24px",
        color: "#FFD700",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 5,
      });
      text.setOrigin(0.5, 1);
      text.setDepth(51);
      text.x += (Math.random() - 0.5) * 15;

      this.damageTexts.push({
        text,
        startTime: this.time.now,
        startY: text.y,
      });

      // Screen shake
      this.cameras.main.shake(150, 0.005);

      // Particle burst
      this.showCritParticles(x, y);
    } else {
      // Normal damage
      const dmgText = `-${damage}`;
      const text = this.add.text(x, y - 10, dmgText, {
        fontSize: "16px",
        color: "#ffcc00",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      });
      text.setOrigin(0.5, 1);
      text.setDepth(50);
      text.x += (Math.random() - 0.5) * 20;

      this.damageTexts.push({
        text,
        startTime: this.time.now,
        startY: text.y,
      });
    }
  }

  /** Show heal number (green, with + prefix) */
  private showHealNumber(x: number, y: number, amount: number): void {
    const text = this.add.text(x, y - 10, `+${amount}`, {
      fontSize: "16px",
      color: "#44ff66",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    });
    text.setOrigin(0.5, 1);
    text.setDepth(50);

    this.damageTexts.push({
      text,
      startTime: this.time.now,
      startY: text.y,
    });

    // Green sparkle particles
    for (let i = 0; i < 4; i++) {
      const spark = this.add.graphics();
      spark.fillStyle(0x44ff66, 0.8);
      spark.fillCircle(0, 0, 2);
      spark.setPosition(x + (Math.random() - 0.5) * 20, y - 5);
      spark.setDepth(49);
      this.tweens.add({
        targets: spark,
        y: spark.y - 25 - Math.random() * 15,
        alpha: 0,
        duration: 600 + Math.random() * 300,
        ease: "Power2",
        onComplete: () => spark.destroy(),
      });
    }
  }

  /** Show miss/dodge text */
  private showMissText(x: number, y: number, isDodge: boolean = false): void {
    const text = this.add.text(x, y - 10, isDodge ? "DODGE" : "MISS", {
      fontSize: "13px",
      color: "#888888",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
    text.setOrigin(0.5, 1);
    text.setDepth(50);

    this.damageTexts.push({
      text,
      startTime: this.time.now,
      startY: text.y,
    });
  }

  /** Critical hit particle burst */
  private showCritParticles(x: number, y: number): void {
    const colors = [0xffd700, 0xff6600, 0xffcc00, 0xffffff];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 20 + Math.random() * 15;
      const color = colors[Math.floor(Math.random() * colors.length)];

      const particle = this.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 2 + Math.random() * 1.5);
      particle.setPosition(x, y);
      particle.setDepth(55);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 400 + Math.random() * 200,
        ease: "Power2",
        onComplete: () => particle.destroy(),
      });
    }
  }

  /** Update floating damage texts (rise and fade) */
  private updateDamageTexts(time: number): void {
    const duration = 1000;

    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const dt = this.damageTexts[i];
      const elapsed = time - dt.startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        dt.text.destroy();
        this.damageTexts.splice(i, 1);
        continue;
      }

      // Rise and fade
      dt.text.y = dt.startY - progress * 40;
      dt.text.setAlpha(1 - progress);
    }
  }

  /** Generic floating text (for exp gain, etc.) */
  private showFloatingText(
    x: number,
    y: number,
    message: string,
    color: string,
    duration: number = 1500,
  ): void {
    const text = this.add.text(x, y, message, {
      fontSize: "13px",
      color,
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
    text.setOrigin(0.5, 1);
    text.setDepth(50);

    this.floatingTexts.push({
      text,
      startTime: this.time.now,
      startY: text.y,
      duration,
    });
  }

  private updateFloatingTexts(time: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      const elapsed = time - ft.startTime;
      const progress = elapsed / ft.duration;

      if (progress >= 1) {
        ft.text.destroy();
        this.floatingTexts.splice(i, 1);
        continue;
      }

      ft.text.y = ft.startY - progress * 30;
      ft.text.setAlpha(1 - progress * 0.8);
    }
  }

  /** Flash an entity white->red when hit (uses sprite tint) */
  private flashEntity(container: Phaser.GameObjects.Container): void {
    const data = container.getData("entityData") as EntityContainerData;
    const sprite = data?.bodySprite;

    if (sprite) {
      // White flash first
      sprite.setTint(0xffffff);
      this.time.delayedCall(80, () => {
        sprite.setTint(0xff4444); // Red flash
      });
      this.time.delayedCall(180, () => {
        sprite.setTint(0xffffff); // Brief white
      });
      this.time.delayedCall(280, () => {
        sprite.clearTint(); // Back to normal
      });
    } else {
      // Fallback for non-sprite entities
      const originalAlpha = container.alpha;
      container.setAlpha(0.5);
      this.time.delayedCall(100, () => container.setAlpha(originalAlpha));
      this.time.delayedCall(200, () => container.setAlpha(0.5));
      this.time.delayedCall(300, () => container.setAlpha(originalAlpha));
    }

    // Show attack slash arc effect
    this.showAttackSlash(container.x, container.y);
  }

  /** Show attack slash arc (white arc at target position) */
  private showAttackSlash(x: number, y: number): void {
    const slash = this.add.graphics();
    slash.setPosition(x, y - 5);
    slash.setDepth(45);

    // Draw arc
    const angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25;
    slash.lineStyle(3, 0xffffff, 0.9);
    slash.beginPath();
    slash.arc(0, 0, 16, angle - 1.2, angle + 1.2, false);
    slash.strokePath();
    // Inner brighter arc
    slash.lineStyle(1.5, 0xffffcc, 0.7);
    slash.beginPath();
    slash.arc(0, 0, 13, angle - 1.0, angle + 1.0, false);
    slash.strokePath();

    this.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 250,
      ease: "Power2",
      onComplete: () => slash.destroy(),
    });
  }

  /** Play death animation: fade + sink into ground */
  private playDeathAnimation(container: Phaser.GameObjects.Container): void {
    // Tint gray first
    const data = container.getData("entityData") as EntityContainerData;
    if (data?.bodySprite) {
      data.bodySprite.setTint(0x666666);
    }

    this.tweens.add({
      targets: container,
      alpha: 0,
      scaleX: 0.3,
      scaleY: 0.1, // Flatten (sink into ground)
      y: container.y + 10, // Drop slightly
      duration: 600,
      ease: "Power2",
    });

    // Death particles (dark wisps)
    for (let i = 0; i < 6; i++) {
      const p = this.add.graphics();
      p.fillStyle(0x333333, 0.6);
      p.fillCircle(0, 0, 2 + Math.random() * 2);
      p.setPosition(container.x + (Math.random() - 0.5) * 20, container.y);
      p.setDepth(45);

      this.tweens.add({
        targets: p,
        y: p.y - 20 - Math.random() * 15,
        alpha: 0,
        duration: 500 + Math.random() * 300,
        ease: "Power2",
        onComplete: () => p.destroy(),
      });
    }
  }

  /** Show level up effect: golden pillar of light + expanding ring + particles */
  private showLevelUpEffect(x: number, y: number): void {
    // Golden pillar of light
    const pillar = this.add.graphics();
    pillar.setDepth(55);
    pillar.fillStyle(0xffd700, 0.3);
    pillar.fillRect(x - 8, y - 80, 16, 100);
    pillar.fillStyle(0xffd700, 0.5);
    pillar.fillRect(x - 4, y - 80, 8, 100);
    pillar.fillStyle(0xffffff, 0.3);
    pillar.fillRect(x - 2, y - 80, 4, 100);

    this.tweens.add({
      targets: pillar,
      alpha: 0,
      scaleX: 2,
      duration: 1200,
      ease: "Power2",
      onComplete: () => pillar.destroy(),
    });

    // Expanding ring
    const ring = this.add.graphics();
    ring.setDepth(54);
    ring.lineStyle(3, 0xffd700, 0.8);
    ring.strokeCircle(x, y, 5);

    this.tweens.add({
      targets: ring,
      scaleX: 6,
      scaleY: 6,
      alpha: 0,
      duration: 800,
      ease: "Power2",
      onComplete: () => ring.destroy(),
    });

    // Particles bursting outward
    const particleCount = 16;
    const colors = [0xffd700, 0xffee88, 0xffffff, 0xffcc00];
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const dist = 35 + Math.random() * 25;
      const color = colors[i % colors.length];

      const particle = this.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 2 + Math.random() * 2);
      particle.setPosition(x, y);
      particle.setDepth(60);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - 10,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 800 + Math.random() * 400,
        ease: "Power2",
        onComplete: () => particle.destroy(),
      });
    }

    // "레벨 업!" text (larger, more prominent)
    const text = this.add.text(x, y - 25, "\uB808\uBCA8 \uC5C5!", {
      fontSize: "18px",
      color: "#FFD700",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    });
    text.setOrigin(0.5, 1);
    text.setDepth(61);

    this.tweens.add({
      targets: text,
      y: y - 55,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 2000,
      ease: "Power2",
      onComplete: () => text.destroy(),
    });
  }

  /** Show skill visual effect at position - type-specific visuals */
  private showSkillEffect(tileX: number, tileY: number, color: string): void {
    const ts = ClientConfig.TILE_SIZE;
    const x = tileX * ts + ts / 2;
    const y = tileY * ts + ts / 2;
    const colorNum = parseInt(color.replace("#", ""), 16) || 0xff6600;

    // Determine skill type from color
    const isHeal =
      colorNum === 0x44ff66 || colorNum === 0x00ff00 || color === "#44ff66";
    const isFire =
      colorNum === 0xff6600 || colorNum === 0xff4400 || colorNum === 0xff0000;
    const isIce =
      colorNum === 0x4488cc || colorNum === 0x66ccff || colorNum === 0x0088ff;

    if (isHeal) {
      // Heal: green rising particles
      for (let i = 0; i < 8; i++) {
        const p = this.add.graphics();
        p.fillStyle(0x44ff66, 0.7);
        p.fillCircle(0, 0, 2);
        p.setPosition(x + (Math.random() - 0.5) * 24, y + 5);
        p.setDepth(40);

        this.tweens.add({
          targets: p,
          y: p.y - 30 - Math.random() * 20,
          alpha: 0,
          duration: 700 + Math.random() * 400,
          ease: "Power1",
          onComplete: () => p.destroy(),
        });
      }
    } else if (isFire || isIce) {
      // Magic: expanding impact explosion
      const explosion = this.add.graphics();
      explosion.setDepth(40);

      // Core
      explosion.fillStyle(colorNum, 0.7);
      explosion.fillCircle(x, y, 6);
      // Outer ring
      explosion.lineStyle(2.5, colorNum, 0.9);
      explosion.strokeCircle(x, y, 10);

      this.tweens.add({
        targets: explosion,
        scaleX: 3.5,
        scaleY: 3.5,
        alpha: 0,
        duration: 350,
        ease: "Power2",
        onComplete: () => explosion.destroy(),
      });

      // Scatter particles
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const p = this.add.graphics();
        p.fillStyle(colorNum, 0.8);
        p.fillCircle(0, 0, 2);
        p.setPosition(x, y);
        p.setDepth(41);

        this.tweens.add({
          targets: p,
          x: x + Math.cos(angle) * (15 + Math.random() * 10),
          y: y + Math.sin(angle) * (15 + Math.random() * 10),
          alpha: 0,
          duration: 300 + Math.random() * 200,
          ease: "Power2",
          onComplete: () => p.destroy(),
        });
      }
    } else {
      // Melee: slash arc + ground impact
      const slash = this.add.graphics();
      slash.setDepth(40);
      slash.lineStyle(3, 0xffffff, 0.8);
      slash.beginPath();
      slash.arc(x, y - 5, 18, -1.5, 0.5, false);
      slash.strokePath();
      slash.lineStyle(2, colorNum, 0.6);
      slash.beginPath();
      slash.arc(x, y - 5, 14, -1.3, 0.3, false);
      slash.strokePath();

      this.tweens.add({
        targets: slash,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 300,
        ease: "Power2",
        onComplete: () => slash.destroy(),
      });

      // Ground impact circle
      const ground = this.add.graphics();
      ground.setDepth(39);
      ground.lineStyle(1.5, colorNum, 0.5);
      ground.strokeEllipse(x, y + ts * 0.25, 8, 4);

      this.tweens.add({
        targets: ground,
        scaleX: 3,
        scaleY: 2,
        alpha: 0,
        duration: 300,
        ease: "Power2",
        onComplete: () => ground.destroy(),
      });
    }
  }

  /** Update active combat effects */
  private updateActiveEffects(time: number): void {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      if (time - effect.startTime >= effect.duration) {
        this.activeEffects.splice(i, 1);
      }
    }
  }

  // ================================================
  // Ground Items (PK drops)
  // ================================================

  private updateGroundItems(): void {
    const ts = ClientConfig.TILE_SIZE;
    const groundItems = ui.getGroundItems();

    // Remove sprites for items no longer on the ground
    for (let [id, sprite] of this.groundItemSprites) {
      if (!groundItems.has(id)) {
        sprite.destroy();
        this.groundItemSprites.delete(id);
      }
    }

    // Add sprites for new ground items
    for (let [id, item] of groundItems) {
      if (!this.groundItemSprites.has(id)) {
        this.createGroundItemSprite(id, item);
      }
    }

    // Pulse/bob animation for ground items
    const bobOffset = Math.sin(Date.now() * 0.003) * 2;
    for (let [, sprite] of this.groundItemSprites) {
      const ed = sprite.getData("baseY") as number;
      if (ed !== undefined) {
        sprite.y = ed + bobOffset;
      }
    }
  }

  private createGroundItemSprite(id: string, item: any): void {
    const ts = ClientConfig.TILE_SIZE;
    const px = item.x * ts + ts / 2;
    const py = item.y * ts + ts / 2;

    const container = this.add.container(px, py);
    container.setDepth(5);

    // Glow effect for enhanced items
    let glowColor = 0xffffff;
    if (item.enhancement && item.enhancement >= 7) {
      glowColor = 0xffd700;
    } else if (item.enhancement && item.enhancement >= 4) {
      glowColor = 0x4488ff;
    }

    // Draw a small item bag icon
    const g = this.add.graphics();
    g.fillStyle(glowColor, 0.3);
    g.fillCircle(0, 0, 8);
    g.fillStyle(0xddaa44, 0.9);
    g.fillRoundedRect(-5, -5, 10, 10, 2);
    g.lineStyle(1, 0x886622);
    g.strokeRoundedRect(-5, -5, 10, 10, 2);
    container.add(g);

    // Item name label
    const label = this.add.text(
      0,
      -12,
      item.enhancement ? `+${item.enhancement}` : "",
      {
        fontSize: "8px",
        color: "#FFD700",
        stroke: "#000",
        strokeThickness: 2,
      },
    );
    label.setOrigin(0.5, 1);
    container.add(label);

    container.setData("baseY", py);
    container.setData("groundItemId", id);

    // Click to pickup
    container.setSize(ts * 0.6, ts * 0.6);
    container.setInteractive();
    container.on("pointerdown", () => {
      ui.pickupGroundItem(id);
    });

    this.groundItemSprites.set(id, container);
  }

  // ================================================
  // Minimap
  // ================================================

  private updateMinimap(): void {
    if (!this.mapData) return;

    const entities: { type: EntityType; x: number; y: number }[] = [];
    const ts = ClientConfig.TILE_SIZE;

    for (const [, container] of this.otherPlayers) {
      entities.push({
        type: EntityType.PLAYER,
        x: Math.floor(container.x / ts),
        y: Math.floor(container.y / ts),
      });
    }

    for (const [, container] of this.mobs) {
      entities.push({
        type: EntityType.MOB,
        x: Math.floor(container.x / ts),
        y: Math.floor(container.y / ts),
      });
    }

    for (const [, container] of this.npcs) {
      entities.push({
        type: EntityType.NPC,
        x: Math.floor(container.x / ts),
        y: Math.floor(container.y / ts),
      });
    }

    ui.drawMinimap(
      this.mapData,
      { x: this.playerX, y: this.playerY },
      entities,
    );
  }

  // ================================================
  // Atmosphere & Ambient Effects (Zone-specific)
  // ================================================

  /** Initialize ambient particles */
  private initAmbientParticles(): void {
    this.ambientParticles = [];
    const atm = this.currentAtmosphere;
    for (let i = 0; i < 40; i++) {
      const useColor2 = atm.particleColor2 && Math.random() > 0.5;
      this.ambientParticles.push({
        x: Math.random() * 800 - 400,
        y: Math.random() * 600 - 300,
        vx:
          atm.particleDirection.x * (3 + Math.random() * 5) +
          (Math.random() - 0.5) * 4,
        vy:
          atm.particleDirection.y * (3 + Math.random() * 5) +
          (Math.random() - 0.5) * 2,
        alpha: Math.random() * 0.3 + 0.1,
        size:
          atm.particleShape === "snow"
            ? Math.random() * 2 + 1
            : atm.particleShape === "ember"
              ? Math.random() * 1.5 + 0.5
              : Math.random() * 1.5 + 0.5,
        color: useColor2 ? atm.particleColor2 : atm.particleColor,
      });
    }
  }

  /** Detect zone change and update atmosphere */
  private updateZoneAtmosphere(): void {
    if (!this.mapData || !(this.mapData as any).zones) return;

    const zones = (this.mapData as any).zones as any[];
    let newZoneId = "town";
    for (const zone of zones) {
      if (
        this.playerX >= zone.x &&
        this.playerX < zone.x + zone.width &&
        this.playerY >= zone.y &&
        this.playerY < zone.y + zone.height
      ) {
        newZoneId = zone.id;
        break;
      }
    }

    if (newZoneId !== this.currentZoneId) {
      this.currentZoneId = newZoneId;
      this.currentAtmosphere =
        ZONE_ATMOSPHERES[newZoneId] || ZONE_ATMOSPHERES.town;
      this.initAmbientParticles();
      this.drawVignette(); // Redraw vignette for new zone
      soundEngine.playBgm(newZoneId);
    }
  }

  /** Draw dark vignette overlay - zone-specific intensity/color */
  private drawVignette(): void {
    if (!this.vignetteOverlay) return;
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const atm = this.currentAtmosphere;

    this.vignetteOverlay.clear();

    // Dark edges - gradient-like vignette using concentric rects
    const steps = 10;
    const strength = atm.vignetteStrength;
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const alpha = t * t * strength;
      const inset = (1 - t) * Math.min(w, h) * 0.35;
      this.vignetteOverlay.fillStyle(atm.vignetteColor, alpha);
      this.vignetteOverlay.fillRect(0, 0, w, inset);
      this.vignetteOverlay.fillRect(0, h - inset, w, inset);
      this.vignetteOverlay.fillRect(0, inset, inset, h - inset * 2);
      this.vignetteOverlay.fillRect(w - inset, inset, inset, h - inset * 2);
    }

    // Subtle overall tint
    const overallAlpha = strength * 0.25;
    this.vignetteOverlay.fillStyle(atm.vignetteColor, overallAlpha);
    this.vignetteOverlay.fillRect(0, 0, w, h);
  }

  /** Update floating ambient particles - zone-specific rendering */
  private updateAmbientParticles(delta: number): void {
    if (!this.ambientLayer || !this.playerSprite) return;

    this.ambientLayer.clear();
    const cam = this.cameras.main;
    const cx = cam.scrollX + cam.width / 2;
    const cy = cam.scrollY + cam.height / 2;
    const atm = this.currentAtmosphere;

    for (const p of this.ambientParticles) {
      p.x += p.vx * (delta / 1000);
      p.y += p.vy * (delta / 1000);
      p.alpha += (Math.random() - 0.5) * 0.02;
      p.alpha = Math.max(0.05, Math.min(0.4, p.alpha));

      // Wrap around camera view
      if (p.x < -420) p.x = 420;
      if (p.x > 420) p.x = -420;
      if (p.y < -320) p.y = 320;
      if (p.y > 320) p.y = -320;

      const wx = cx + p.x;
      const wy = cy + p.y;
      const color = p.color || atm.particleColor;

      if (atm.particleShape === "snow") {
        // Snowflake: slight zigzag
        const wobble = Math.sin(p.x * 0.1 + this.time.now * 0.002) * 1;
        this.ambientLayer.fillStyle(color, p.alpha);
        this.ambientLayer.fillCircle(wx + wobble, wy, p.size);
        // Cross detail for larger flakes
        if (p.size > 1.5) {
          this.ambientLayer.fillRect(
            wx + wobble - p.size * 0.5,
            wy - 0.5,
            p.size,
            1,
          );
          this.ambientLayer.fillRect(
            wx + wobble - 0.5,
            wy - p.size * 0.5,
            1,
            p.size,
          );
        }
      } else if (atm.particleShape === "ember") {
        // Ember: bright core with flicker
        const flicker = Math.sin(this.time.now * 0.01 + p.x) * 0.15;
        this.ambientLayer.fillStyle(color, p.alpha + flicker);
        this.ambientLayer.fillCircle(wx, wy, p.size);
        // Bright center
        this.ambientLayer.fillStyle(0xffcc00, (p.alpha + flicker) * 0.6);
        this.ambientLayer.fillCircle(wx, wy, p.size * 0.4);
      } else if (atm.particleShape === "leaf") {
        // Leaf: small ellipse with rotation feel
        this.ambientLayer.fillStyle(color, p.alpha);
        const rot = Math.sin(this.time.now * 0.003 + p.y * 0.1);
        this.ambientLayer.fillEllipse(
          wx,
          wy,
          p.size * 2 * Math.abs(rot + 0.3),
          p.size,
        );
      } else {
        // Default circle (dust motes)
        this.ambientLayer.fillStyle(color, p.alpha);
        this.ambientLayer.fillCircle(wx, wy, p.size);
      }
    }
  }

  // ================================================
  // Enhancement Glow Effects on Player Equipment
  // ================================================

  /** Set the max enhance level for the local player (called from equipment update) */
  setPlayerMaxEnhanceLevel(level: number): void {
    this.playerMaxEnhanceLevel = level;
  }

  /** Get enhance effect config based on level */
  private getEnhanceEffectConfig(level: number): {
    color1: number;
    color2: number;
    particleCount: number;
    speed: number;
    type: "trail" | "aura" | "flame" | "lightning";
  } | null {
    if (level < 4) return null;
    if (level <= 6) {
      return {
        color1: 0x4488ff,
        color2: 0x88bbff,
        particleCount: 4,
        speed: 0.5,
        type: "trail",
      };
    }
    if (level <= 9) {
      return {
        color1: 0xffd700,
        color2: 0xffaa00,
        particleCount: 6,
        speed: 0.8,
        type: "aura",
      };
    }
    if (level <= 12) {
      return {
        color1: 0xff4400,
        color2: 0xff0000,
        particleCount: 8,
        speed: 1.2,
        type: "flame",
      };
    }
    return {
      color1: 0xaa44ff,
      color2: 0xff00ff,
      particleCount: 10,
      speed: 1.5,
      type: "lightning",
    };
  }

  /** Update and render enhancement glow effects for the player */
  private updateEnhanceGlowEffects(delta: number): void {
    if (!this.enhanceGlowLayer || !this.playerSprite) return;

    this.enhanceGlowLayer.clear();

    const config = this.getEnhanceEffectConfig(this.playerMaxEnhanceLevel);
    if (!config) return;

    const spriteX = this.playerSprite.x;
    const spriteY = this.playerSprite.y;
    const ts = ClientConfig.TILE_SIZE;

    // Ensure we have particle data for player
    let effectData = this.enhanceEffects.get("player");
    if (!effectData || effectData.level !== this.playerMaxEnhanceLevel) {
      // (re)initialize particles
      const particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        alpha: number;
        life: number;
        maxLife: number;
        color: number;
        size: number;
      }> = [];
      for (let i = 0; i < config.particleCount; i++) {
        particles.push(this.createEnhanceParticle(config));
      }
      effectData = { particles, level: this.playerMaxEnhanceLevel };
      this.enhanceEffects.set("player", effectData);
    }

    // Update and render particles
    const dt = delta / 1000;
    for (const p of effectData.particles) {
      p.life -= dt;
      if (p.life <= 0) {
        Object.assign(p, this.createEnhanceParticle(config));
      }

      // Update position based on effect type
      switch (config.type) {
        case "trail": {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.alpha = (p.life / p.maxLife) * 0.6;
          break;
        }
        case "aura": {
          const angle = (this.time.now * 0.002 + p.x * 10) % (Math.PI * 2);
          p.x = Math.cos(angle) * (ts * 0.4);
          p.y = Math.sin(angle) * (ts * 0.2) - ts * 0.15;
          p.alpha = 0.3 + Math.sin(this.time.now * 0.005 + p.y) * 0.2;
          break;
        }
        case "flame": {
          p.y += p.vy * dt;
          p.x += Math.sin(this.time.now * 0.01 + p.x * 5) * 0.3;
          p.alpha = (p.life / p.maxLife) * 0.7;
          if (p.life < p.maxLife * 0.3) {
            p.size *= 0.98;
          }
          break;
        }
        case "lightning": {
          // Random jitter for lightning effect
          if (Math.random() < 0.1) {
            p.x = (Math.random() - 0.5) * ts * 0.6;
            p.y = -ts * 0.1 + (Math.random() - 0.5) * ts * 0.5;
            p.alpha = 0.8;
          } else {
            p.alpha *= 0.92;
          }
          break;
        }
      }

      // Render particle
      const wx = spriteX + p.x;
      const wy = spriteY + p.y;
      const color = Math.random() > 0.5 ? config.color1 : config.color2;
      this.enhanceGlowLayer.fillStyle(color, p.alpha);

      if (config.type === "lightning") {
        // Draw short line segments for lightning
        this.enhanceGlowLayer.lineStyle(1.5, color, p.alpha);
        const lx = wx + (Math.random() - 0.5) * 4;
        const ly = wy + (Math.random() - 0.5) * 4;
        this.enhanceGlowLayer.beginPath();
        this.enhanceGlowLayer.moveTo(wx, wy);
        this.enhanceGlowLayer.lineTo(lx, ly);
        this.enhanceGlowLayer.strokePath();
        this.enhanceGlowLayer.fillCircle(wx, wy, p.size * 0.5);
      } else {
        this.enhanceGlowLayer.fillCircle(wx, wy, p.size);
      }
    }
  }

  /** Create a single enhance particle */
  private createEnhanceParticle(config: { speed: number; type: string }): {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    life: number;
    maxLife: number;
    color: number;
    size: number;
  } {
    const ts = ClientConfig.TILE_SIZE;
    const life = 0.5 + Math.random() * 1.5;
    switch (config.type) {
      case "trail":
        return {
          x: (Math.random() - 0.5) * ts * 0.4,
          y: (Math.random() - 0.5) * ts * 0.2,
          vx: (Math.random() - 0.5) * 8,
          vy: -10 - Math.random() * 10,
          alpha: 0.5,
          life,
          maxLife: life,
          color: 0,
          size: 1 + Math.random() * 1.5,
        };
      case "flame":
        return {
          x: (Math.random() - 0.5) * ts * 0.3,
          y: 0,
          vx: (Math.random() - 0.5) * 4,
          vy: -20 - Math.random() * 20,
          alpha: 0.7,
          life,
          maxLife: life,
          color: 0,
          size: 1.5 + Math.random() * 2,
        };
      case "lightning":
        return {
          x: (Math.random() - 0.5) * ts * 0.5,
          y: (Math.random() - 0.5) * ts * 0.4 - ts * 0.1,
          vx: 0,
          vy: 0,
          alpha: 0.8,
          life: 0.1 + Math.random() * 0.3,
          maxLife: 0.4,
          color: 0,
          size: 1 + Math.random(),
        };
      default: // aura
        return {
          x: (Math.random() - 0.5) * ts * 0.4,
          y: (Math.random() - 0.5) * ts * 0.3,
          vx: 0,
          vy: 0,
          alpha: 0.4,
          life,
          maxLife: life,
          color: 0,
          size: 1.5 + Math.random() * 1.5,
        };
    }
  }
}
