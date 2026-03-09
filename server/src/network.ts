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
  QuestType,
  MAX_CHAT_LENGTH,
  TICK_RATE,
  TICK_INTERVAL,
} from "../../shared/types";
import { Config } from "./config";
import { World } from "./world";
import { Player } from "./player";
import type { PlayerSaveData } from "./player";
import {
  CombatSystem,
  QuizSystem,
  ShopSystem,
  QuestSystem,
  AchievementSystem,
  CraftingSystem,
  PartySystem,
  TradeSystem,
} from "./systems";
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

    this.ws.on("message", async (raw) => {
      try {
        let str = typeof raw === "string" ? raw : raw.toString();
        let packet = JSON.parse(str);
        if (packet && packet.type) {
          await this.handleMessage(packet.type, packet.data || {});
        }
      } catch (err) {
        console.error(`[Connection ${this.id}] Message error:`, err);
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
      case PacketType.QUEST_LIST:
        this.handleQuestList(data);
        break;
      case PacketType.QUEST_ACCEPT:
        this.handleQuestAccept(data);
        break;
      case PacketType.QUEST_COMPLETE:
        this.handleQuestComplete(data);
        break;
      case PacketType.QUEST_ABANDON:
        this.handleQuestAbandon(data);
        break;
      case PacketType.ACHIEVEMENT_LIST:
        this.handleAchievementList();
        break;
      case PacketType.CRAFT_LIST:
        this.handleCraftList();
        break;
      case PacketType.CRAFT_ITEM:
        this.handleCraftItem(data);
        break;
      case PacketType.PARTY_INVITE:
        this.handlePartyInvite(data);
        break;
      case PacketType.PARTY_ACCEPT:
        this.handlePartyAccept();
        break;
      case PacketType.PARTY_DECLINE:
        this.handlePartyDecline();
        break;
      case PacketType.PARTY_LEAVE:
        this.handlePartyLeave();
        break;
      case PacketType.PARTY_KICK:
        this.handlePartyKick(data);
        break;
      case PacketType.PARTY_CHAT:
        this.handlePartyChat(data);
        break;
      case PacketType.TRADE_REQUEST:
        this.handleTradeRequest(data);
        break;
      case PacketType.TRADE_ACCEPT:
        this.handleTradeAccept(data);
        break;
      case PacketType.TRADE_DECLINE:
        this.handleTradeDecline();
        break;
      case PacketType.TRADE_OFFER_UPDATE:
        this.handleTradeOfferUpdate(data);
        break;
      case PacketType.TRADE_CONFIRM:
        this.handleTradeConfirm();
        break;
      case PacketType.TRADE_CANCEL:
        this.handleTradeCancel();
        break;
      case PacketType.PK_TOGGLE:
        this.handlePkToggle();
        break;
      case PacketType.AUTO_POTION_TOGGLE:
        this.handleAutoPotionToggle();
        break;
      case PacketType.PICKUP_GROUND_ITEM:
        this.handlePickupGroundItem(data);
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
    console.log(
      `[Auth] Login attempt: ${name}, hash exists: ${!!savedData.passwordHash}, hash length: ${savedData.passwordHash?.length}`,
    );
    let passwordValid = false;
    try {
      passwordValid = await bcrypt.compare(password, savedData.passwordHash);
    } catch (err) {
      console.error(`[Auth] bcrypt.compare error:`, err);
    }
    if (!passwordValid) {
      console.log(`[Auth] Password mismatch for ${name}`);
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

    // Validate spawn position - if outside map or in invalid zone, reset to town
    let spawn = this.server.world.map.playerSpawn;
    let mapW = this.server.world.map.width;
    let mapH = this.server.world.map.height;
    if (
      player.x < 0 ||
      player.x >= mapW ||
      player.y < 0 ||
      player.y >= mapH ||
      this.server.world.map.collisions[player.y]?.[player.x]
    ) {
      console.log(
        `[Auth] Resetting ${name} position from (${player.x},${player.y}) to spawn (${spawn.x},${spawn.y})`,
      );
      player.x = spawn.x;
      player.y = spawn.y;
    }

    this.server.world.addPlayer(this, player);
    this.sendWelcome(player);

    // Process daily login reward
    player.processDailyLogin();

    // Achievement: early bird check
    AchievementSystem.checkFirstLogin(player, this.server.world.players.size);

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
    console.log(
      `[Auth] Registering: ${name}, password length: ${password.length}`,
    );
    let passwordHash = await bcrypt.hash(password, 10);
    console.log(
      `[Auth] Hash created for ${name}: length=${passwordHash.length}`,
    );
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
      try {
        await db.createPlayer(saveData);
        console.log(`[Auth] Player saved to DB: ${name}`);
      } catch (err) {
        console.error(`[Auth] DB createPlayer failed for ${name}:`, err);
        // Still let player enter game - will retry save on disconnect
      }
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

    // Send ground items
    let groundItems = this.server.world.getGroundItemsNear(
      player.x,
      player.y,
      100,
    );
    for (let item of groundItems) {
      this.send(PacketType.GROUND_ITEM, { item });
    }

    // Send quest data
    QuestSystem.sendQuestUpdate(player);
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

    // Achievement: walk tiles
    AchievementSystem.checkAchievement(this.player, "walk_tiles", 1);

    // Check zone entry for EXPLORE quests and achievements
    for (let zone of this.server.world.map.zones) {
      if (
        x >= zone.x &&
        x < zone.x + zone.width &&
        y >= zone.y &&
        y < zone.y + zone.height
      ) {
        QuestSystem.updateProgress(this.player, QuestType.EXPLORE, zone.id, 1);
        // Achievement: unique zone visits
        let zoneKey = `zone_visited:${zone.id}`;
        if (!this.player.achievementProgress[zoneKey]) {
          this.player.achievementProgress[zoneKey] = 1;
          let totalZones = 0;
          for (let z of this.server.world.map.zones) {
            if (this.player.achievementProgress[`zone_visited:${z.id}`])
              totalZones++;
          }
          AchievementSystem.checkAchievement(
            this.player,
            "zone_visit",
            totalZones,
          );
        }
        break;
      }
    }

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

    // Party chat command: /p message
    if (message.startsWith("/p ")) {
      let partyMsg = message.slice(3).trim();
      if (partyMsg) {
        let party = PartySystem.getParty(this.player.id);
        if (party) {
          party.broadcast(PacketType.PARTY_CHAT, {
            sender: this.player.name,
            senderId: this.player.id,
            message: partyMsg,
          });
        } else {
          this.send(PacketType.NOTIFICATION, {
            message: "You are not in a party.",
            messageKo: "파티에 속해 있지 않습니다.",
          });
        }
      }
      return;
    }

    // Invite command: /invite playerName
    if (message.startsWith("/invite ")) {
      let targetName = message.slice(8).trim();
      if (targetName) {
        let targetPlayer: Player | null = null;
        for (let [, p] of this.server.world.players) {
          if (p.name.toLowerCase() === targetName.toLowerCase()) {
            targetPlayer = p;
            break;
          }
        }
        if (targetPlayer) {
          PartySystem.invitePlayer(
            this.player,
            targetPlayer.id,
            this.server.world,
          );
        } else {
          this.send(PacketType.NOTIFICATION, {
            message: `Player "${targetName}" not found.`,
            messageKo: `"${targetName}" 플레이어를 찾을 수 없습니다.`,
          });
        }
      }
      return;
    }

    // Party leave command
    if (message === "/leave") {
      PartySystem.leaveParty(this.player);
      return;
    }

    this.server.broadcast(PacketType.CHAT_MESSAGE, {
      sender: this.player.name,
      senderId: this.player.id,
      message,
      system: false,
    });

    // Achievement: chat messages
    AchievementSystem.checkAchievement(this.player, "chat_send", 1);
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

      // Update quest progress for vocab quests
      QuestSystem.updateProgress(this.player, QuestType.VOCAB, "any", 1);

      // Achievement: quiz correct, quiz streak, item pickup
      AchievementSystem.checkAchievement(this.player, "quiz_correct", 1);
      let streak = (this.player.achievementProgress["_quiz_streak"] || 0) + 1;
      this.player.achievementProgress["_quiz_streak"] = streak;
      AchievementSystem.checkAchievement(this.player, "quiz_streak", streak);
      if (drops.length > 0) {
        AchievementSystem.checkAchievement(this.player, "item_pickup", 1);
        AchievementSystem.checkInventoryFull(this.player);
      }
      // Achievement: gold check
      AchievementSystem.checkGold(this.player);

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
      // Reset quiz streak on wrong answer
      if (this.player.achievementProgress["_quiz_streak"]) {
        this.player.achievementProgress["_quiz_streak"] = 0;
      }
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

    let equipped = this.player.equipItem(slotIndex);
    if (equipped) {
      AchievementSystem.checkFullEquip(this.player);
    }
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
    // Achievement: death & respawn
    AchievementSystem.checkAchievement(this.player, "death_count", 1);
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
    } else if (npcDef.type === NpcType.CRAFT) {
      // Open crafting panel - send recipe list
      CraftingSystem.sendRecipeList(this.player!);
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

    // Update TALK quest progress
    QuestSystem.updateProgress(this.player, QuestType.TALK, npcId, 1);

    // Send available quests from this NPC
    QuestSystem.sendAvailableQuests(this.player, npcId);
    QuestSystem.sendQuestUpdate(this.player);

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
      reset: result.reset,
      newLevel: result.newLevel,
      itemName,
      failResult: result.failResult,
    });

    if (result.success) {
      // Achievement: enhance success and enhance level
      AchievementSystem.checkAchievement(this.player, "enhance_success", 1);
      AchievementSystem.checkAchievement(
        this.player,
        "enhance_level",
        result.newLevel,
      );
      this.send(PacketType.NOTIFICATION, {
        message: `Enhancement success! +${result.newLevel}`,
        messageKo: `강화 성공! +${result.newLevel}`,
      });

      // Broadcast announcement for +7 and above
      if (result.newLevel >= 7) {
        let glowLabel =
          result.newLevel >= 13
            ? "[PURPLE]"
            : result.newLevel >= 10
              ? "[RED]"
              : result.newLevel >= 7
                ? "[GOLD]"
                : "";
        this.server.broadcast(PacketType.CHAT_MESSAGE, {
          sender: "System",
          message: `${this.player.name} has enhanced ${itemName} to +${result.newLevel}! ${glowLabel}`,
          messageKo: `${this.player.name}이(가) ${itemName}을(를) +${result.newLevel}(으)로 강화에 성공했습니다! ${glowLabel}`,
          system: true,
        });
      }
    } else if (result.destroyed) {
      this.send(PacketType.NOTIFICATION, {
        message: `Enhancement failed! Item destroyed!`,
        messageKo: `강화 실패! 아이템이 파괴되었습니다!`,
      });
    } else if (result.reset) {
      this.send(PacketType.NOTIFICATION, {
        message: `Enhancement failed! Item reset to +0!`,
        messageKo: `강화 실패! 아이템이 +0으로 초기화되었습니다!`,
      });
    } else if (result.failResult === "nothing") {
      this.send(PacketType.NOTIFICATION, {
        message: `Enhancement failed. Item is safe.`,
        messageKo: `강화 실패. 아이템은 안전합니다.`,
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

  private handlePkToggle(): void {
    if (!this.player) return;
    this.player.pkMode = !this.player.pkMode;

    // Cancel invulnerability when enabling PK mode
    if (this.player.pkMode) {
      this.player.invulnerableUntil = 0;
    }

    this.send(PacketType.PK_TOGGLE, { pkMode: this.player.pkMode });
    this.send(PacketType.NOTIFICATION, {
      message: this.player.pkMode
        ? "PK mode enabled. You can now attack other players."
        : "PK mode disabled.",
      messageKo: this.player.pkMode
        ? "PK 모드 활성화. 다른 플레이어를 공격할 수 있습니다."
        : "PK 모드 비활성화.",
    });

    // Broadcast to other players so they can see the PK flag
    this.server.broadcast(
      PacketType.ENTITY_MOVE,
      {
        id: this.player.id,
        type: EntityType.PLAYER,
        x: this.player.x,
        y: this.player.y,
        direction: this.player.direction,
        pkMode: this.player.pkMode,
      },
      this.id,
    );
  }

  private handleAutoPotionToggle(): void {
    if (!this.player) return;
    this.player.autoPotion = !this.player.autoPotion;
    this.send(PacketType.AUTO_POTION_TOGGLE, {
      autoPotion: this.player.autoPotion,
    });
    this.send(PacketType.NOTIFICATION, {
      message: this.player.autoPotion
        ? "Auto-potion enabled."
        : "Auto-potion disabled.",
      messageKo: this.player.autoPotion
        ? "자동 물약 사용 활성화."
        : "자동 물약 사용 비활성화.",
    });
  }

  private handlePickupGroundItem(data: Record<string, unknown>): void {
    if (!this.player || this.player.isDead) return;

    let itemId = String(data.itemId || "");
    if (!itemId) return;

    let success = this.server.world.pickupGroundItem(this.player, itemId);
    if (success) {
      this.send(PacketType.NOTIFICATION, {
        message: "Item picked up!",
        messageKo: "아이템을 획득했습니다!",
      });
    }
  }

  private handleQuestList(data: Record<string, unknown>): void {
    if (!this.player) return;
    let npcId = data.npcId ? String(data.npcId) : undefined;
    QuestSystem.sendQuestUpdate(this.player);
    QuestSystem.sendAvailableQuests(this.player, npcId);
  }

  private handleQuestAccept(data: Record<string, unknown>): void {
    if (!this.player) return;
    let questId = String(data.questId || "");
    if (!questId) return;
    QuestSystem.acceptQuest(this.player, questId);
  }

  private handleQuestComplete(data: Record<string, unknown>): void {
    if (!this.player) return;
    let questId = String(data.questId || "");
    if (!questId) return;
    QuestSystem.completeQuest(this.player, questId);
  }

  private handleQuestAbandon(data: Record<string, unknown>): void {
    if (!this.player) return;
    let questId = String(data.questId || "");
    if (!questId) return;
    QuestSystem.abandonQuest(this.player, questId);
  }

  private handleAchievementList(): void {
    if (!this.player) return;
    let data = AchievementSystem.getPlayerAchievements(this.player);
    this.send(PacketType.ACHIEVEMENT_LIST, data);
  }

  // ---- Crafting handlers ----

  private handleCraftList(): void {
    if (!this.player) return;
    CraftingSystem.sendRecipeList(this.player);
  }

  private handleCraftItem(data: Record<string, unknown>): void {
    if (!this.player) return;
    let recipeId = String(data.recipeId || "");
    if (!recipeId) return;
    CraftingSystem.craft(this.player, recipeId);
  }

  // ---- Party handlers ----

  private handlePartyInvite(data: Record<string, unknown>): void {
    if (!this.player) return;
    let targetId = String(data.targetId || "");
    if (!targetId) return;
    PartySystem.invitePlayer(this.player, targetId, this.server.world);
  }

  private handlePartyAccept(): void {
    if (!this.player) return;
    PartySystem.acceptInvite(this.player, this.server.world);
  }

  private handlePartyDecline(): void {
    if (!this.player) return;
    PartySystem.declineInvite(this.player);
  }

  private handlePartyLeave(): void {
    if (!this.player) return;
    PartySystem.leaveParty(this.player);
  }

  private handlePartyKick(data: Record<string, unknown>): void {
    if (!this.player) return;
    let targetId = String(data.targetId || "");
    if (!targetId) return;
    PartySystem.kickMember(this.player, targetId);
  }

  private handlePartyChat(data: Record<string, unknown>): void {
    if (!this.player) return;
    let message = String(data.message || "").trim();
    if (!message || message.length > MAX_CHAT_LENGTH) return;

    let party = PartySystem.getParty(this.player.id);
    if (!party) {
      this.send(PacketType.NOTIFICATION, {
        message: "You are not in a party.",
        messageKo: "파티에 속해 있지 않습니다.",
      });
      return;
    }

    party.broadcast(PacketType.PARTY_CHAT, {
      sender: this.player.name,
      senderId: this.player.id,
      message,
    });
  }

  // ---- Trade handlers ----
  private handleTradeRequest(data: Record<string, unknown>): void {
    if (!this.player) return;
    let targetId = String(data.targetId || "");
    if (!targetId) return;
    TradeSystem.requestTrade(this.player, targetId, this.server.world);
  }

  private handleTradeAccept(data: Record<string, unknown>): void {
    if (!this.player) return;
    let requesterId = String(data.requesterId || "");
    if (!requesterId) return;
    TradeSystem.acceptTrade(this.player, requesterId, this.server.world);
  }

  private handleTradeDecline(): void {
    if (!this.player) return;
    TradeSystem.declineTrade(this.player, this.server.world);
  }

  private handleTradeOfferUpdate(data: Record<string, unknown>): void {
    if (!this.player) return;
    let items =
      (data.items as Array<{ slotIndex: number; count: number }>) || [];
    let gold = Number(data.gold) || 0;
    TradeSystem.updateOffer(this.player, { items, gold }, this.server.world);
  }

  private handleTradeConfirm(): void {
    if (!this.player) return;
    TradeSystem.confirmTrade(this.player, this.server.world);
  }

  private handleTradeCancel(): void {
    if (!this.player) return;
    TradeSystem.cancelTrade(this.player, this.server.world);
  }

  private passwordHash: string = "";

  private async onDisconnect(): Promise<void> {
    if (this.player) {
      // Clean up trade on disconnect
      if (this.player.tradeState) {
        TradeSystem.cancelTrade(this.player, this.server.world);
      }

      // Clean up party before saving
      PartySystem.onPlayerDisconnect(this.player.id);

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
