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

// ---- Tile color palette ----
const TILE_COLORS: Record<number, number> = {
  [TileType.GRASS]: 0x4a7c3f,
  [TileType.DIRT]: 0x8b7355,
  [TileType.STONE]: 0x808080,
  [TileType.WATER]: 0x4a90d9,
  [TileType.SAND]: 0xd4b96a,
  [TileType.WALL]: 0x5c5c5c,
  [TileType.TREE]: 0x2d5a1e,
  [TileType.FLOOR]: 0xa0927b,
  [TileType.BRIDGE]: 0x8b6914,
  [TileType.LAVA]: 0xff4500,
  [TileType.SNOW]: 0xf0f0f0,
  [TileType.ICE]: 0xb0d4f1,
  [TileType.SWAMP]: 0x556b2f,
  [TileType.DARK_GRASS]: 0x2a4a2a,
  [TileType.DARK_STONE]: 0x3a3a3a,
  [TileType.PORTAL]: 0x9b59b6,
};

// Tree trunk color
const TREE_TRUNK_COLOR = 0x6b4423;

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
  hp?: number;
  maxHp?: number;
  direction?: Direction;
}

export class GameScene extends Phaser.Scene {
  // ---- Map rendering ----
  private tileLayer: Phaser.GameObjects.Graphics | null = null;
  private tileCache: Map<string, boolean> = new Map();
  private renderedChunks: Set<string> = new Set();

  // ---- Entity containers ----
  private playerSprite: Phaser.GameObjects.Container | null = null;
  private otherPlayers: Map<string, Phaser.GameObjects.Container> = new Map();
  private mobs: Map<string, Phaser.GameObjects.Container> = new Map();
  private npcs: Map<string, Phaser.GameObjects.Container> = new Map();
  private itemDrops: Map<string, Phaser.GameObjects.Container> = new Map();

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
  private keyF1: Phaser.Input.Keyboard.Key | null = null;
  private keyF2: Phaser.Input.Keyboard.Key | null = null;

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

  // ---- Player class (for skills) ----
  private playerClass: PlayerClass = PlayerClass.WARRIOR;

  constructor() {
    super({ key: "GameScene" });
  }

  // ================================================
  // Phaser Lifecycle
  // ================================================

  create(): void {
    // Create the tile layer graphics
    this.tileLayer = this.add.graphics();
    this.tileLayer.setDepth(0);

    // Create target indicator
    this.targetIndicator = this.add.graphics();
    this.targetIndicator.setDepth(5);
    this.targetIndicator.setVisible(false);

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
      } else {
        const speed = Math.min(
          dist,
          ClientConfig.MOVE_SPEED * (delta / 1000) * 2.5,
        );
        this.playerSprite.x += (dx / dist) * speed;
        this.playerSprite.y += (dy / dist) * speed;
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

    // ---- Animate special tiles ----
    this.animTimer += delta;
    if (this.animTimer > 500) {
      this.animTimer = 0;
      // Water/lava/portal shimmer handled via tile re-render
    }

    // ---- Update minimap periodically ----
    this.minimapTimer += delta;
    if (this.minimapTimer > 1000) {
      this.minimapTimer = 0;
      this.updateMinimap();
    }

    // ---- Update player position for zone tracking ----
    ui.updatePlayerPosition(this.playerX, this.playerY);

    // ---- Auto-attack ----
    if (ui.isAutoAttack() && this.selectedTarget) {
      this.autoAttackTimer += delta;
      if (this.autoAttackTimer >= this.autoAttackInterval) {
        this.autoAttackTimer = 0;
        const targetContainer = this.mobs.get(this.selectedTarget);
        if (targetContainer) {
          socket.send(PacketType.ATTACK, { targetId: this.selectedTarget });
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
        break;
      case EntityType.PLAYER:
        this.selectedTarget = entity.id;
        // Could attack in PvP or inspect
        socket.send(PacketType.ATTACK, { targetId: entity.id });
        break;
      case EntityType.NPC:
        this.selectedTarget = null;
        socket.send(PacketType.NPC_INTERACT, { npcId: entity.id });
        break;
      case EntityType.ITEM_DROP:
        this.selectedTarget = null;
        socket.send(PacketType.PICKUP_ITEM, { dropId: entity.id });
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

    // Pulsing circle around target
    const pulse = Math.sin(time / 300) * 0.3 + 0.7;
    this.targetIndicator.lineStyle(2, 0xff0000, pulse);
    this.targetIndicator.strokeCircle(
      target.x,
      target.y,
      ClientConfig.TILE_SIZE * 0.6,
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
      (data: { id: string; x: number; y: number; direction: Direction }) => {
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
          if (this.playerSprite) {
            this.playerSprite.setAlpha(0.3);
          }
          return;
        }

        // Mob/player died — if we killed it, add combo
        if (data.killerId === this.playerId) {
          ui.addCombo();
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
      },
    );

    // LEVEL_UP: level up visual
    socket.on(PacketType.LEVEL_UP, (data: { level: number; id?: string }) => {
      if (!data.id || data.id === this.playerId) {
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
        this.selectedTarget = null;
      },
    );
  }

  // ================================================
  // Map Rendering
  // ================================================

  /** Render only tiles visible within the camera viewport + buffer */
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

            const baseColor = TILE_COLORS[tileType] ?? 0x1a1a2e;
            const px = tx * ts;
            const py = ty * ts;

            // Deterministic pseudo-random per tile for variation
            const hash = ((tx * 2654435761) ^ (ty * 2246822519)) >>> 0;
            const rand01 = (hash % 1000) / 1000; // 0..1
            const rand02 = ((hash >> 10) % 1000) / 1000;
            const rand03 = ((hash >> 20) % 1000) / 1000;

            // Apply slight color variation to natural tiles
            let tileColor = baseColor;
            if (
              tileType === TileType.GRASS ||
              tileType === TileType.DARK_GRASS ||
              tileType === TileType.DIRT ||
              tileType === TileType.SAND ||
              tileType === TileType.SNOW
            ) {
              // Vary brightness by +/- 8%
              const r = (baseColor >> 16) & 0xff;
              const g = (baseColor >> 8) & 0xff;
              const b = baseColor & 0xff;
              const variation = 1.0 + (rand01 - 0.5) * 0.16;
              const nr = Math.min(255, Math.max(0, Math.round(r * variation)));
              const ng = Math.min(255, Math.max(0, Math.round(g * variation)));
              const nb = Math.min(255, Math.max(0, Math.round(b * variation)));
              tileColor = (nr << 16) | (ng << 8) | nb;
            }

            this.tileLayer.fillStyle(tileColor, 1);
            this.tileLayer.fillRect(px, py, ts, ts);

            // Grass decorations: small flowers and pebbles
            if (
              tileType === TileType.GRASS ||
              tileType === TileType.DARK_GRASS
            ) {
              // Subtle grass blades / texture lines
              this.tileLayer.lineStyle(1, 0x3a6b30, 0.15);
              if (rand01 > 0.3) {
                const gx = px + rand02 * ts * 0.6 + ts * 0.2;
                const gy = py + rand03 * ts * 0.6 + ts * 0.2;
                this.tileLayer.beginPath();
                this.tileLayer.moveTo(gx, gy);
                this.tileLayer.lineTo(gx + 2, gy - 4);
                this.tileLayer.strokePath();
              }
              // Small flowers (rare)
              if (rand01 > 0.85) {
                const fx = px + rand02 * ts * 0.6 + ts * 0.2;
                const fy = py + rand03 * ts * 0.6 + ts * 0.2;
                const flowerColors = [0xffee44, 0xff6688, 0xffffff, 0xcc88ff];
                const fc = flowerColors[Math.floor(rand02 * 4)];
                this.tileLayer.fillStyle(fc, 0.8);
                this.tileLayer.fillCircle(fx, fy, 1.5);
              }
              // Small pebbles
              if (rand01 > 0.7 && rand01 <= 0.85) {
                const pbx = px + rand03 * ts * 0.5 + ts * 0.25;
                const pby = py + rand02 * ts * 0.5 + ts * 0.25;
                this.tileLayer.fillStyle(0x8a8a7a, 0.4);
                this.tileLayer.fillCircle(pbx, pby, 1.2);
              }
            }

            // Sand: small dots for texture
            if (tileType === TileType.SAND) {
              if (rand01 > 0.5) {
                this.tileLayer.fillStyle(0xc4a95a, 0.3);
                this.tileLayer.fillCircle(
                  px + rand02 * ts * 0.8 + ts * 0.1,
                  py + rand03 * ts * 0.8 + ts * 0.1,
                  1,
                );
              }
            }

            // Water: wave pattern
            if (tileType === TileType.WATER) {
              this.tileLayer.lineStyle(1, 0x6ab0e8, 0.25);
              const waveY1 = py + ts * 0.3;
              const waveY2 = py + ts * 0.6;
              this.tileLayer.beginPath();
              this.tileLayer.moveTo(px + 2, waveY1);
              this.tileLayer.lineTo(px + ts * 0.25, waveY1 - 2);
              this.tileLayer.lineTo(px + ts * 0.5, waveY1);
              this.tileLayer.lineTo(px + ts * 0.75, waveY1 - 2);
              this.tileLayer.lineTo(px + ts - 2, waveY1);
              this.tileLayer.strokePath();
              this.tileLayer.beginPath();
              this.tileLayer.moveTo(px + ts * 0.1, waveY2);
              this.tileLayer.lineTo(px + ts * 0.35, waveY2 - 2);
              this.tileLayer.lineTo(px + ts * 0.6, waveY2);
              this.tileLayer.lineTo(px + ts * 0.85, waveY2 - 2);
              this.tileLayer.lineTo(px + ts, waveY2);
              this.tileLayer.strokePath();
              // Highlight shimmer
              this.tileLayer.fillStyle(0xffffff, 0.08);
              this.tileLayer.fillCircle(
                px + rand02 * ts * 0.6 + ts * 0.2,
                py + rand03 * ts * 0.6 + ts * 0.2,
                2,
              );
            }

            // Stone/wall: cracks and borders
            if (tileType === TileType.WALL || tileType === TileType.STONE) {
              this.tileLayer.lineStyle(1, 0x444444, 0.3);
              this.tileLayer.strokeRect(px, py, ts, ts);
              // Crack lines
              if (rand01 > 0.6) {
                this.tileLayer.lineStyle(1, 0x555555, 0.25);
                this.tileLayer.beginPath();
                this.tileLayer.moveTo(
                  px + rand02 * ts * 0.4 + ts * 0.1,
                  py + ts * 0.2,
                );
                this.tileLayer.lineTo(
                  px + rand03 * ts * 0.4 + ts * 0.3,
                  py + ts * 0.5,
                );
                this.tileLayer.lineTo(
                  px + rand02 * ts * 0.3 + ts * 0.4,
                  py + ts * 0.8,
                );
                this.tileLayer.strokePath();
              }
            }

            // Draw tree trunks
            if (tileType === TileType.TREE) {
              this.tileLayer.fillStyle(TREE_TRUNK_COLOR, 1);
              this.tileLayer.fillRect(
                px + ts * 0.35,
                py + ts * 0.6,
                ts * 0.3,
                ts * 0.4,
              );
            }

            // Portal glow effect (static part)
            if (tileType === TileType.PORTAL) {
              this.tileLayer.fillStyle(0xc77dff, 0.3);
              this.tileLayer.fillCircle(px + ts / 2, py + ts / 2, ts * 0.3);
            }

            // Faint grid lines on all tiles for depth
            this.tileLayer.lineStyle(1, 0x000000, 0.06);
            this.tileLayer.strokeRect(px, py, ts, ts);
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
    const s = ts * 0.6; // scale factor

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

    const body = this.add.graphics();
    this.drawHumanoid(body, ts, data.class, true);
    container.add(body);

    // Name text
    const nameText = this.add.text(0, -ts * 0.55, data.name, {
      fontSize: "12px",
      color: "#ffd700",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    });
    nameText.setOrigin(0.5, 1);
    container.add(nameText);

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

    const body = this.add.graphics();
    this.drawHumanoid(body, ts, data.class, false);
    container.add(body);

    const nameText = this.add.text(0, -ts * 0.55, data.name, {
      fontSize: "11px",
      color: "#e8d5b0",
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
      bodyGraphic: body,
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
    const scale = isBoss ? 1.3 : 0.85 + Math.min(level, 50) * 0.005;
    const s = ts * 0.6 * scale;

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

    const sizeMultiplier = data.isBoss ? 1.2 : 0.9;
    const halfSize = ts * 0.35 * sizeMultiplier;

    const body = this.add.graphics();
    this.drawMonster(
      body,
      ts,
      data.mobId || data.id,
      data.level || 1,
      !!data.isBoss,
      data.behavior || "",
    );
    container.add(body);

    // Name + level text
    const displayName = data.name || "Mob";
    const nameText = this.add.text(
      0,
      -halfSize - 14,
      `Lv.${data.level} ${displayName}`,
      {
        fontSize: data.isBoss ? "11px" : "10px",
        color: data.isBoss ? "#ffcc00" : "#ff9999",
        stroke: "#000000",
        strokeThickness: 2,
      },
    );
    nameText.setOrigin(0.5, 1);
    container.add(nameText);

    // Health bar
    const healthBar = this.add.graphics();
    this.drawHealthBar(healthBar, data.hp, data.maxHp, halfSize);
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
      bodyGraphic: body,
      hp: data.hp,
      maxHp: data.maxHp,
    } as EntityContainerData);

    this.mobs.set(data.id, container);
  }

  /** Draw an NPC (merchant/shopkeeper) */
  private drawNpc(
    g: Phaser.GameObjects.Graphics,
    ts: number,
    npcName: string,
  ): void {
    const s = ts * 0.6;
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

    const body = this.add.graphics();
    // Use npcId for color detection, nameKo for display
    this.drawNpc(body, ts, (data as any).npcId || data.name || "NPC");
    container.add(body);

    const displayName = (data as any).nameKo || data.name || "NPC";
    const nameText = this.add.text(0, -ts * 0.7, displayName, {
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
      bodyGraphic: body,
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
  ): void {
    g.clear();
    const barWidth = halfSize * 2;
    const barHeight = 4;
    const barY = halfSize + 4;

    // Background
    g.fillStyle(0x333333, 0.8);
    g.fillRect(-barWidth / 2, barY, barWidth, barHeight);

    // Fill
    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    const fillColor =
      ratio > 0.5 ? 0x4caf50 : ratio > 0.25 ? 0xff9800 : 0xf44336;
    g.fillStyle(fillColor, 1);
    g.fillRect(-barWidth / 2, barY, barWidth * ratio, barHeight);
  }

  private updateEntityHealthBar(
    container: Phaser.GameObjects.Container,
    hp: number,
    maxHp: number,
  ): void {
    const entityData = container.getData("entityData") as EntityContainerData;
    if (!entityData?.healthBar) return;

    const ts = ClientConfig.TILE_SIZE;
    const isBoss = container.getData("isBoss") as boolean;
    const halfSize = ts * 0.35 * (isBoss ? 1.2 : 0.9);

    this.drawHealthBar(entityData.healthBar, hp, maxHp, halfSize);
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

  /** Show a floating damage number */
  private showDamageNumber(
    x: number,
    y: number,
    damage: number,
    isCrit: boolean = false,
  ): void {
    const text = this.add.text(x, y - 10, `-${damage}`, {
      fontSize: isCrit ? "18px" : "14px",
      color: isCrit ? "#ff0000" : "#ffcc00",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    });
    text.setOrigin(0.5, 1);
    text.setDepth(50);

    // Add slight random horizontal offset
    text.x += (Math.random() - 0.5) * 20;

    this.damageTexts.push({
      text,
      startTime: this.time.now,
      startY: text.y,
    });
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

  /** Flash an entity red when hit */
  private flashEntity(container: Phaser.GameObjects.Container): void {
    const data = container.getData("entityData") as EntityContainerData;
    if (!data?.bodyGraphic) return;

    // Tint the body graphic red
    const originalAlpha = container.alpha;
    container.setAlpha(0.5);

    this.time.delayedCall(100, () => {
      container.setAlpha(originalAlpha);
    });

    this.time.delayedCall(200, () => {
      container.setAlpha(0.5);
    });

    this.time.delayedCall(300, () => {
      container.setAlpha(originalAlpha);
    });
  }

  /** Play death animation (fade to gray, shrink) */
  private playDeathAnimation(container: Phaser.GameObjects.Container): void {
    this.tweens.add({
      targets: container,
      alpha: 0,
      scaleX: 0.3,
      scaleY: 0.3,
      duration: 500,
      ease: "Power2",
    });
  }

  /** Show level up particle burst effect */
  private showLevelUpEffect(x: number, y: number): void {
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const dist = 30 + Math.random() * 20;

      const particle = this.add.graphics();
      particle.fillStyle(0xffd700, 1);
      particle.fillCircle(0, 0, 3 + Math.random() * 2);
      particle.setPosition(x, y);
      particle.setDepth(60);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 800 + Math.random() * 400,
        ease: "Power2",
        onComplete: () => {
          particle.destroy();
        },
      });
    }

    // Big golden flash
    const flash = this.add.graphics();
    flash.fillStyle(0xffd700, 0.4);
    flash.fillCircle(x, y, 5);
    flash.setDepth(55);

    this.tweens.add({
      targets: flash,
      scaleX: 8,
      scaleY: 8,
      alpha: 0,
      duration: 600,
      ease: "Power2",
      onComplete: () => {
        flash.destroy();
      },
    });

    // "LEVEL UP!" text
    this.showFloatingText(x, y - 20, "LEVEL UP!", "#ffd700", 2000);
  }

  /** Show skill visual effect at position */
  private showSkillEffect(tileX: number, tileY: number, color: string): void {
    const ts = ClientConfig.TILE_SIZE;
    const x = tileX * ts + ts / 2;
    const y = tileY * ts + ts / 2;

    const colorNum = parseInt(color.replace("#", ""), 16) || 0xff6600;

    const effect = this.add.graphics();
    effect.fillStyle(colorNum, 0.6);
    effect.fillCircle(x, y, 5);
    effect.lineStyle(2, colorNum, 0.8);
    effect.strokeCircle(x, y, 8);
    effect.setDepth(40);

    this.tweens.add({
      targets: effect,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 400,
      ease: "Power2",
      onComplete: () => {
        effect.destroy();
      },
    });
  }

  // ================================================
  // Minimap
  // ================================================

  private updateMinimap(): void {
    if (!this.mapData) return;

    const entities: { type: EntityType; x: number; y: number }[] = [];

    const ts = ClientConfig.TILE_SIZE;

    // Collect nearby entities for minimap
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
}
