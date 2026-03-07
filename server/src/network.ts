// ============================================
// VocaQuest Online - Network (WebSocket Server)
// 100% Original Code - MIT License
// ============================================

import { v4 as uuid } from "uuid";
import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import bcrypt from "bcryptjs";
import type { EquipmentSlots, PlayerData } from "../../shared/types";
import {
  PacketType,
  EntityType,
  PlayerClass,
  EquipSlot,
  SkillId,
  StatType,
  NpcType,
  MAX_CHAT_LENGTH,
  TICK_RATE,
  TICK_INTERVAL,
} from "../../shared/types";
import { Config } from "./config";
import { World } from "./world";
import { Player } from "./player";
import type { PlayerSaveData } from "./player";
import { CombatSystem, QuizSystem, ShopSystem } from "./systems";
import { NPCS } from "./data/npcs";
import { SHOPS } from "./data/shops";
import { ITEMS } from "./data/items";

// In-memory account store (used when database is skipped)
let accounts: Map<string, PlayerSaveData & { passwordHash: string }> =
  new Map();

// Database interface (optional)
let db: {
  loadPlayer(
    name: string,
  ): Promise<(PlayerSaveData & { passwordHash: string }) | null>;
  savePlayer(data: PlayerSaveData & { passwordHash: string }): Promise<void>;
  createPlayer(data: PlayerSaveData & { passwordHash: string }): Promise<void>;
} | null = null;

export function setDatabase(database: typeof db): void {
  db = database;
}

export class Connection {
  id: string;
  ws: WebSocket;
  playerId: string | null;
  player: Player | null;
  server: GameServer;

  constructor(ws: WebSocket, server: GameServer) {
    this.id = uuid();
    this.ws = ws;
    this.playerId = null;
    this.player = null;
    this.server = server;

    this.ws.on("message", (raw) => {
      try {
        let str = typeof raw === "string" ? raw : raw.toString();
        let packet = JSON.parse(str);
        if (packet && packet.type) {
          this.handleMessage(packet.type, packet.data || {});
        }
      } catch (err) {
        console.error(`[Connection ${this.id}] Invalid message:`, err);
      }
    });

    this.ws.on("close", () => {
      this.onDisconnect();
    });

    this.ws.on("error", (err) => {
      console.error(`[Connection ${this.id}] WebSocket error:`, err);
    });
  }

  send(type: PacketType | string, data: unknown): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type, data }));
      } catch (err) {
        console.error(`[Connection ${this.id}] Send error:`, err);
      }
    }
  }

  private async handleMessage(
    type: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    switch (type) {
      case PacketType.LOGIN:
        await this.handleLogin(data);
        break;
      case PacketType.REGISTER:
        await this.handleRegister(data);
        break;
      case PacketType.MOVE:
        this.handleMove(data);
        break;
      case PacketType.ATTACK:
        this.handleAttack(data);
        break;
      case PacketType.CHAT:
        this.handleChat(data);
        break;
      case PacketType.QUIZ_ANSWER:
        this.handleQuizAnswer(data);
        break;
      case PacketType.SHOP_BUY:
        this.handleShopBuy(data);
        break;
      case PacketType.SHOP_SELL:
        this.handleShopSell(data);
        break;
      case PacketType.EQUIP_ITEM:
        this.handleEquipItem(data);
        break;
      case PacketType.UNEQUIP_ITEM:
        this.handleUnequipItem(data);
        break;
      case PacketType.USE_ITEM:
        this.handleUseItem(data);
        break;
      case PacketType.USE_SKILL:
        this.handleUseSkill(data);
        break;
      case PacketType.SET_GRADE_LEVEL:
        this.handleSetGradeLevel(data);
        break;
      case PacketType.ENHANCE_ITEM:
        this.handleEnhanceItem(data);
        break;
      case PacketType.ALLOCATE_STAT:
        this.handleAllocateStat(data);
        break;
      case PacketType.PING:
        this.send(PacketType.PONG, { time: Date.now() });
        break;
      case PacketType.NPC_INTERACT:
        this.handleNpcInteract(data);
        break;
      case PacketType.RESPAWN:
        this.handleRespawn();
        break;
      default:
        console.warn(`[Connection ${this.id}] Unknown packet type: ${type}`);
    }
  }

  private async handleLogin(data: Record<string, unknown>): Promise<void> {
    let name = String(data.name || "").trim();
    let password = String(data.password || "");

    if (!name || !password) {
      this.send(PacketType.AUTH_ERROR, {
        message: "닉네임과 비밀번호를 입력해주세요.",
      });
      return;
    }

    if (name.length < 2 || name.length > 20) {
      this.send(PacketType.AUTH_ERROR, {
        message: "닉네임은 2~20글자여야 합니다.",
      });
      return;
    }

    // Check if already logged in
    for (let [, conn] of this.server.connections) {
      if (conn.player?.name.toLowerCase() === name.toLowerCase()) {
        this.send(PacketType.AUTH_ERROR, {
          message: "이미 접속 중인 캐릭터입니다.",
        });
        return;
      }
    }

    // Load from database or memory
    let savedData: (PlayerSaveData & { passwordHash: string }) | null = null;

    if (db) {
      savedData = await db.loadPlayer(name);
    } else {
      savedData = accounts.get(name.toLowerCase()) || null;
    }

    if (!savedData) {
      this.send(PacketType.AUTH_ERROR, {
        message: "존재하지 않는 계정입니다. 회원가입해주세요.",
      });
      return;
    }

    // Verify password
    let passwordValid = await bcrypt.compare(password, savedData.passwordHash);
    if (!passwordValid) {
      this.send(PacketType.AUTH_ERROR, {
        message: "비밀번호가 일치하지 않습니다.",
      });
      return;
    }

    // Create player from saved data
    let playerId = uuid();
    let player = Player.fromSaveData(savedData, playerId, this);
    this.playerId = playerId;
    this.player = player;
    this.passwordHash = savedData.passwordHash;

    this.server.world.addPlayer(this, player);
    this.sendWelcome(player);

    console.log(`[Auth] Player logged in: ${name}`);
  }

  private async handleRegister(data: Record<string, unknown>): Promise<void> {
    let name = String(data.name || "").trim();
    let password = String(data.password || "");
    let playerClass = String(data.playerClass || "warrior") as PlayerClass;

    if (!name || !password) {
      this.send(PacketType.AUTH_ERROR, {
        message: "닉네임과 비밀번호를 입력해주세요.",
      });
      return;
    }

    if (name.length < 2 || name.length > 20) {
      this.send(PacketType.AUTH_ERROR, {
        message: "닉네임은 2~20글자여야 합니다.",
      });
      return;
    }

    if (password.length < 3) {
      this.send(PacketType.AUTH_ERROR, {
        message: "비밀번호는 3자 이상이어야 합니다.",
      });
      return;
    }

    // Validate class
    if (!Object.values(PlayerClass).includes(playerClass)) {
      playerClass = PlayerClass.WARRIOR;
    }

    // Check if name already exists
    let existing: unknown = null;
    if (db) {
      existing = await db.loadPlayer(name);
    } else {
      existing = accounts.get(name.toLowerCase());
    }

    if (existing) {
      this.send(PacketType.AUTH_ERROR, {
        message: "이미 사용 중인 닉네임입니다.",
      });
      return;
    }

    // Create account
    let passwordHash = await bcrypt.hash(password, 10);
    let playerId = uuid();
    let player = new Player(playerId, name, playerClass, this);
    player.giveStarterItems();

    // Apply initial stats from character creation
    let initialStats = data.initialStats as Record<string, number> | undefined;
    if (initialStats) {
      player.stats.statPoints += 10;
      let totalUsed = 0;
      for (let key of ["str", "dex", "int", "con", "wis"]) {
        let val = Number(initialStats[key]) || 0;
        val = Math.max(0, Math.min(7, val)); // cap per stat
        totalUsed += val;
        if (totalUsed > 10) {
          val -= totalUsed - 10;
          totalUsed = 10;
        }
        if (val > 0) {
          for (let i = 0; i < val; i++) {
            player.allocateStat(key as StatType);
          }
        }
      }
    }

    // Set spawn position
    player.x = this.server.world.map.playerSpawn.x;
    player.y = this.server.world.map.playerSpawn.y;

    let saveData = {
      ...player.toSaveData(passwordHash),
      passwordHash,
    };

    if (db) {
      await db.createPlayer(saveData);
    } else {
      accounts.set(name.toLowerCase(), saveData);
    }

    this.playerId = playerId;
    this.player = player;
    this.passwordHash = passwordHash;

    this.server.world.addPlayer(this, player);
    this.sendWelcome(player);

    console.log(`[Auth] New player registered: ${name} (${playerClass})`);
  }

  private sendWelcome(player: Player): void {
    let entities = this.server.world.getAllEntities();
    let npcs = this.server.world.getNpcData();

    this.send(PacketType.WELCOME, {
      player: player.toData(),
      map: {
        width: this.server.world.map.width,
        height: this.server.world.map.height,
        tileSize: this.server.world.map.tileSize,
        tiles: this.server.world.map.tiles,
        collisions: this.server.world.map.collisions,
        zones: this.server.world.map.zones,
        playerSpawn: this.server.world.map.playerSpawn,
      },
      entities: entities,
      npcs: npcs,
      inventory: player.inventory,
      equipment: player.equipment,
    });

    this.send(PacketType.STATS_UPDATE, { stats: player.stats });
    this.send(PacketType.INVENTORY_UPDATE, { inventory: player.inventory });
    this.send(PacketType.EQUIPMENT_UPDATE, { equipment: player.equipment });
  }

  private handleMove(data: Record<string, unknown>): void {
    if (!this.player || this.player.isDead) return;

    let x = Number(data.x);
    let y = Number(data.y);

    if (isNaN(x) || isNaN(y)) return;

    // Validate bounds
    if (!this.server.world.isWalkable(x, y)) return;

    // Validate distance (max 1 tile at a time, allow diagonal)
    let dx = Math.abs(x - this.player.x);
    let dy = Math.abs(y - this.player.y);
    if (dx > 1 || dy > 1) return;

    this.player.move(x, y);

    this.server.broadcast(
      PacketType.ENTITY_MOVE,
      {
        id: this.player.id,
        type: EntityType.PLAYER,
        x: this.player.x,
        y: this.player.y,
        direction: this.player.direction,
      },
      this.id,
    );
  }

  private handleAttack(data: Record<string, unknown>): void {
    if (!this.player || this.player.isDead) return;

    let targetId = String(data.targetId || "");
    if (!targetId) return;

    this.player.attack(targetId, EntityType.MOB);
    CombatSystem.processAttack(this.player, targetId, this.server.world);
  }

  private handleChat(data: Record<string, unknown>): void {
    if (!this.player) return;

    let message = String(data.message || "").trim();
    if (!message || message.length > MAX_CHAT_LENGTH) return;

    this.server.broadcast(PacketType.CHAT_MESSAGE, {
      sender: this.player.name,
      senderId: this.player.id,
      message,
      system: false,
    });
  }

  private handleQuizAnswer(data: Record<string, unknown>): void {
    if (!this.player || !this.player.quizPending) return;

    let answer = String(data.answer || "");

    // Check if the answer matches the correct answer
    let isCorrect = answer === this.player.quizAnswer?.correct;

    if (isCorrect && this.player.quizAnswer) {
      // Give drops
      let drops: Array<{ itemId: string; count: number }> = [];
      for (let drop of this.player.quizAnswer.drops) {
        let count =
          drop.minCount +
          Math.floor(Math.random() * (drop.maxCount - drop.minCount + 1));
        if (this.player.addItem(drop.itemId, count)) {
          drops.push({ itemId: drop.itemId, count });
        }
      }

      this.player.karma += 2;
      this.player.quizPending = false;
      this.player.quizAnswer = null;

      this.send(PacketType.QUIZ_RESULT, {
        correct: true,
        drops: drops.map((d) => ({
          itemId: d.itemId,
          itemName: ITEMS[d.itemId]?.nameKo || d.itemId,
          count: d.count,
        })),
      });
    } else {
      this.player.quizPending = false;
      this.player.quizAnswer = null;

      this.send(PacketType.QUIZ_RESULT, {
        correct: false,
        drops: [],
      });
    }
  }

  private handleShopBuy(data: Record<string, unknown>): void {
    if (!this.player) return;

    let shopId = String(data.shopId || "");
    let itemId = String(data.itemId || "");

    ShopSystem.buyItem(this.player, shopId, itemId);
  }

  private handleShopSell(data: Record<string, unknown>): void {
    if (!this.player) return;

    let slotIndex = Number(data.slotIndex);
    if (isNaN(slotIndex)) return;

    ShopSystem.sellItem(this.player, slotIndex);
  }

  private handleEquipItem(data: Record<string, unknown>): void {
    if (!this.player) return;

    let slotIndex = Number(data.slotIndex);
    if (isNaN(slotIndex)) return;

    this.player.equipItem(slotIndex);
  }

  private handleUnequipItem(data: Record<string, unknown>): void {
    if (!this.player) return;

    let slot = String(data.slot || "") as EquipSlot;
    if (!Object.values(EquipSlot).includes(slot)) return;

    this.player.unequipItem(slot);
  }

  private handleUseItem(data: Record<string, unknown>): void {
    if (!this.player) return;

    let slotIndex = Number(data.slotIndex);
    if (isNaN(slotIndex)) return;

    this.player.useItem(slotIndex);
  }

  private handleUseSkill(data: Record<string, unknown>): void {
    if (!this.player || this.player.isDead) return;

    let skillId = String(data.skillId || "") as SkillId;
    let targetId = data.targetId ? String(data.targetId) : null;

    if (!Object.values(SkillId).includes(skillId)) return;

    CombatSystem.processSkill(
      this.player,
      skillId,
      targetId,
      this.server.world,
    );
  }

  private handleSetGradeLevel(data: Record<string, unknown>): void {
    if (!this.player) return;

    let level = Number(data.level);
    if (isNaN(level) || level < 1 || level > 4) return;

    this.player.gradeLevel = level;
    this.send(PacketType.NOTIFICATION, {
      message: `Quiz difficulty set to grade ${level}.`,
      messageKo: `퀴즈 난이도가 ${level}단계로 설정되었습니다.`,
    });
  }

  private handleRespawn(): void {
    if (!this.player || !this.player.isDead) return;
    let spawn = this.server.world.map.playerSpawn;
    this.player.respawn(spawn.x, spawn.y);
  }

  private handleNpcInteract(data: Record<string, unknown>): void {
    if (!this.player) return;

    let npcId = String(data.npcId || "");
    let npcDef = NPCS[npcId];
    if (!npcDef) return;

    // Check if player is near the NPC
    let npcPlacement = this.server.world.map.npcs.find(
      (n) => n.npcId === npcId,
    );
    if (npcPlacement) {
      let dist =
        Math.abs(this.player.x - npcPlacement.x) +
        Math.abs(this.player.y - npcPlacement.y);
      if (dist > 3) {
        this.send(PacketType.NOTIFICATION, {
          message: "Too far from NPC.",
          messageKo: "NPC에서 너무 멀리 있습니다.",
        });
        return;
      }
    }

    // Handle ENHANCE NPC (Blacksmith)
    if (npcDef.type === NpcType.ENHANCE) {
      this.send(PacketType.SHOP_OPEN, {
        shopId: "__enhance__",
        name: "Blacksmith",
        nameKo: "대장장이 - 장비 강화",
        items: [],
        isEnhance: true,
      });
    } else if (npcDef.shopId) {
      // Open shop
      let shop = SHOPS[npcDef.shopId];
      if (shop) {
        let shopItems = shop.items
          .map((itemId) => {
            let item = ITEMS[itemId];
            return item
              ? {
                  id: item.id,
                  name: item.name,
                  nameKo: item.nameKo,
                  price: item.price,
                  type: item.type,
                  level: item.level,
                  attack: item.attack,
                  defense: item.defense,
                  hp: item.hp,
                  mp: item.mp,
                  speed: item.speed,
                  healAmount: item.healAmount,
                  mpRestore: item.mpRestore,
                  description: item.description,
                  descriptionKo: item.descriptionKo,
                  color: item.color,
                  enhanceable: item.enhanceable,
                  magicAttack: item.magicAttack,
                  magicDefense: item.magicDefense,
                  critRate: item.critRate,
                  critDamage: item.critDamage,
                  classReq: item.classReq,
                }
              : null;
          })
          .filter(Boolean);

        this.send(PacketType.SHOP_OPEN, {
          shopId: shop.id,
          name: shop.name,
          nameKo: shop.nameKo,
          items: shopItems,
        });
      }
    }

    // Send dialogue regardless
    if (npcDef.dialogue || npcDef.dialogueKo) {
      this.send(PacketType.NOTIFICATION, {
        message: npcDef.dialogue
          ? npcDef.dialogue[Math.floor(Math.random() * npcDef.dialogue.length)]
          : "",
        messageKo: npcDef.dialogueKo
          ? npcDef.dialogueKo[
              Math.floor(Math.random() * npcDef.dialogueKo.length)
            ]
          : "",
        npcName: npcDef.nameKo,
      });
    }
  }

  private handleEnhanceItem(data: Record<string, unknown>): void {
    if (!this.player) return;

    let itemSlotIndex = Number(data.itemSlotIndex);
    let scrollSlotIndex = Number(data.scrollSlotIndex);
    if (isNaN(itemSlotIndex) || isNaN(scrollSlotIndex)) return;

    let result = this.player.enhanceItem(itemSlotIndex, scrollSlotIndex);

    let itemSlot = this.player.inventory[itemSlotIndex];
    let itemName = itemSlot
      ? ITEMS[itemSlot.itemId]?.nameKo || "아이템"
      : "아이템";

    this.send(PacketType.ENHANCE_RESULT, {
      success: result.success,
      destroyed: result.destroyed,
      newLevel: result.newLevel,
      itemName,
    });

    if (result.success) {
      this.send(PacketType.NOTIFICATION, {
        message: `Enhancement success! +${result.newLevel}`,
        messageKo: `강화 성공! +${result.newLevel}`,
      });
    } else if (result.destroyed) {
      this.send(PacketType.NOTIFICATION, {
        message: `Enhancement failed! Item destroyed!`,
        messageKo: `강화 실패! 아이템이 파괴되었습니다!`,
      });
    } else {
      this.send(PacketType.NOTIFICATION, {
        message: `Enhancement failed. Downgraded to +${result.newLevel}`,
        messageKo: `강화 실패. +${result.newLevel}(으)로 하락했습니다.`,
      });
    }
  }

  private handleAllocateStat(data: Record<string, unknown>): void {
    if (!this.player) return;

    let statType = String(data.statType || "") as StatType;
    if (!Object.values(StatType).includes(statType)) return;

    this.player.allocateStat(statType);
  }

  private passwordHash: string = "";

  private async onDisconnect(): Promise<void> {
    if (this.player) {
      // Save player data (use stored passwordHash from login/register)
      let saveData = {
        ...this.player.toSaveData(this.passwordHash),
        passwordHash: this.passwordHash,
      };

      if (this.passwordHash) {
        if (db) {
          try {
            await db.savePlayer(saveData);
          } catch (err) {
            console.error(
              `[Connection] Failed to save player ${this.player.name}:`,
              err,
            );
          }
        } else {
          accounts.set(this.player.name.toLowerCase(), saveData);
        }
      }

      this.server.world.removePlayer(this.player.id);
    }

    this.server.connections.delete(this.id);
    console.log(
      `[Network] Connection closed: ${this.id} (${this.server.connections.size} remaining)`,
    );
  }
}

export class GameServer {
  wss: WebSocketServer;
  connections: Map<string, Connection>;
  world: World;
  private tickInterval: ReturnType<typeof setInterval> | null;

  constructor(httpServer: HttpServer) {
    this.wss = new WebSocketServer({ server: httpServer });
    this.connections = new Map();
    this.world = new World();
    this.tickInterval = null;

    // Wire up world broadcast to connections
    this.world.setBroadcastFunction((type, data, exclude) => {
      this.broadcast(type, data, exclude);
    });

    this.wss.on("connection", (ws) => {
      let connection = new Connection(ws, this);
      this.connections.set(connection.id, connection);
      console.log(
        `[Network] New connection: ${connection.id} (${this.connections.size} total)`,
      );
    });

    console.log("[Network] WebSocket server created");
  }

  start(): void {
    this.tickInterval = setInterval(() => {
      this.world.tick();
    }, TICK_INTERVAL);

    console.log(
      `[Network] Game loop started at ${TICK_RATE} ticks/s (${TICK_INTERVAL}ms interval)`,
    );
  }

  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.wss.close();
    console.log("[Network] Server stopped");
  }

  broadcast(
    type: PacketType,
    data: unknown,
    excludeConnectionId?: string,
  ): void {
    let message = JSON.stringify({ type, data });
    for (let [id, conn] of this.connections) {
      if (id === excludeConnectionId) continue;
      if (!conn.player) continue; // Only send to authenticated connections
      if (conn.ws.readyState === WebSocket.OPEN) {
        try {
          conn.ws.send(message);
        } catch (err) {
          // Ignore send errors on broadcast
        }
      }
    }
  }
}
