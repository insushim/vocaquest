// ============================================
// VocaQuest Online - Game World
// 100% Original Code - MIT License
// ============================================

import { v4 as uuid } from "uuid";
import type {
  MapData,
  MobData,
  EntityData,
  LootDrop,
  GroundItemDrop,
} from "../../shared/types";
import {
  PacketType,
  EntityType,
  Direction,
  TICK_INTERVAL,
  COLLISION_TILES,
} from "../../shared/types";
import { generateMap } from "./data/maps";
import { MONSTERS } from "./data/monsters";
import { NPCS } from "./data/npcs";
import { Player } from "./player";
import { Mob } from "./mob";
import { QuizSystem, AchievementSystem, PartySystem } from "./systems";
import type { Connection } from "./network";

export interface ItemDrop {
  id: string;
  itemId: string;
  count: number;
  x: number;
  y: number;
  createdAt: number;
}

const ITEM_DROP_LIFETIME = 60000; // 60 seconds

export class World {
  map: MapData;
  players: Map<string, Player>;
  mobs: Map<string, Mob>;
  itemDrops: Map<string, ItemDrop>;
  groundItems: Map<string, GroundItemDrop>;
  private lastTickTime: number;
  private broadcastFn:
    | ((type: PacketType, data: unknown, exclude?: string) => void)
    | null;

  constructor() {
    this.map = generateMap();
    this.players = new Map();
    this.mobs = new Map();
    this.itemDrops = new Map();
    this.groundItems = new Map();
    this.lastTickTime = Date.now();
    this.broadcastFn = null;

    this.spawnMobs();

    console.log(`[World] Map generated: ${this.map.width}x${this.map.height}`);
    console.log(
      `[World] Zones: ${this.map.zones.map((z) => z.nameKo).join(", ")}`,
    );
    console.log(`[World] Spawned ${this.mobs.size} mobs`);
    console.log(`[World] Placed ${this.map.npcs.length} NPCs`);
  }

  setBroadcastFunction(
    fn: (type: PacketType, data: unknown, exclude?: string) => void,
  ): void {
    this.broadcastFn = fn;
  }

  tick(): void {
    let now = Date.now();
    let deltaTime = now - this.lastTickTime;
    this.lastTickTime = now;

    // Update all mobs
    for (let [, mob] of this.mobs) {
      mob.update(this, deltaTime);
    }

    // Update all players
    for (let [, player] of this.players) {
      player.update();
    }

    // Periodic party HP sync (every ~2 seconds)
    if (now % 2000 < TICK_INTERVAL) {
      for (let [, party] of PartySystem.parties) {
        if (party.members.size > 1) {
          PartySystem.broadcastPartyUpdate(party);
        }
      }
    }

    // Periodic achievement checks (every ~60 seconds)
    if (now % 60000 < TICK_INTERVAL) {
      for (let [, player] of this.players) {
        AchievementSystem.checkPlayTime(player);
      }
    }

    // Clean up old item drops
    for (let [id, drop] of this.itemDrops) {
      if (now - drop.createdAt > ITEM_DROP_LIFETIME) {
        this.itemDrops.delete(id);
      }
    }

    // Clean up old ground items (60 seconds)
    for (let [id, item] of this.groundItems) {
      if (now - item.createdAt > ITEM_DROP_LIFETIME) {
        this.groundItems.delete(id);
        this.broadcast(PacketType.GROUND_ITEM_REMOVED, { id });
      }
    }
  }

  addPlayer(connection: Connection, playerData: Player): void {
    this.players.set(playerData.id, playerData);

    // Broadcast new player to all existing players
    this.broadcast(
      PacketType.PLAYER_ENTER,
      { player: playerData.toData() },
      playerData.id,
    );

    console.log(
      `[World] Player joined: ${playerData.name} (${this.players.size} online)`,
    );
  }

  removePlayer(playerId: string): void {
    let player = this.players.get(playerId);
    if (!player) return;

    this.players.delete(playerId);

    this.broadcast(PacketType.PLAYER_LEAVE, { playerId });

    // Clear any mobs that were targeting this player
    for (let [, mob] of this.mobs) {
      if (mob.target?.id === playerId) {
        mob.target = null;
        mob.state = "returning";
      }
    }

    console.log(
      `[World] Player left: ${player.name} (${this.players.size} online)`,
    );
  }

  spawnMobs(): void {
    for (let spawn of this.map.spawns) {
      let definition = MONSTERS[spawn.mobId];
      if (!definition) {
        console.warn(`[World] Unknown mob ID in spawn: ${spawn.mobId}`);
        continue;
      }

      for (let i = 0; i < spawn.count; i++) {
        // Random position within spawn radius
        let offsetX =
          Math.floor(Math.random() * spawn.radius * 2) - spawn.radius;
        let offsetY =
          Math.floor(Math.random() * spawn.radius * 2) - spawn.radius;
        let x = Math.max(1, Math.min(this.map.width - 2, spawn.x + offsetX));
        let y = Math.max(1, Math.min(this.map.height - 2, spawn.y + offsetY));

        // Ensure walkable
        if (!this.isWalkable(x, y)) {
          x = spawn.x;
          y = spawn.y;
        }

        let mob = new Mob(definition, x, y);
        this.mobs.set(mob.id, mob);
      }
    }
  }

  getEntitiesNear(x: number, y: number, range: number): EntityData[] {
    let entities: EntityData[] = [];

    for (let [, player] of this.players) {
      if (player.isDead) continue;
      let dist = Math.abs(player.x - x) + Math.abs(player.y - y);
      if (dist <= range) {
        entities.push(player.toData());
      }
    }

    for (let [, mob] of this.mobs) {
      if (mob.isDead) continue;
      let dist = Math.abs(mob.x - x) + Math.abs(mob.y - y);
      if (dist <= range) {
        entities.push(mob.toData());
      }
    }

    return entities;
  }

  isWalkable(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) {
      return false;
    }
    return !this.map.collisions[y][x];
  }

  // Get all entity data for initial sync
  getAllEntities(): {
    players: ReturnType<Player["toData"]>[];
    mobs: MobData[];
  } {
    let players: ReturnType<Player["toData"]>[] = [];
    let mobs: MobData[] = [];

    for (let [, player] of this.players) {
      players.push(player.toData());
    }

    for (let [, mob] of this.mobs) {
      if (!mob.isDead) {
        mobs.push(mob.toData());
      }
    }

    return { players, mobs };
  }

  // Get NPC data for client
  getNpcData(): Array<{
    id: string;
    npcId: string;
    x: number;
    y: number;
    name: string;
    nameKo: string;
    type: string;
    color: string;
  }> {
    return this.map.npcs.map((placement) => {
      let def = NPCS[placement.npcId];
      return {
        id: placement.npcId,
        npcId: placement.npcId,
        x: placement.x,
        y: placement.y,
        name: def?.name || placement.npcId,
        nameKo: def?.nameKo || placement.npcId,
        type: def?.type || "info",
        color: def?.color || "#FFFFFF",
      };
    });
  }

  // Start quiz for player after mob kill
  startQuizForPlayer(
    player: Player,
    mob: Mob,
    drops: Array<{ itemId: string; count: number }>,
  ): void {
    let quiz = QuizSystem.generateQuiz(player);
    if (!quiz) {
      // No quiz available, just give drops directly
      for (let drop of drops) {
        player.addItem(drop.itemId, drop.count);
      }
      return;
    }

    // Convert drops to LootDrop format for storage
    let lootDrops: LootDrop[] = drops.map((d) => ({
      itemId: d.itemId,
      chance: 1,
      minCount: d.count,
      maxCount: d.count,
    }));

    player.quizPending = true;
    player.quizAnswer = {
      correct: quiz.correct,
      mobId: mob.mobId,
      drops: lootDrops,
    };

    player.connection.send(PacketType.QUIZ_SHOW, {
      question: quiz,
      mobName: mob.definition.nameKo,
      mobId: mob.mobId,
    });
  }

  // Ground item drop system (PK drops)
  addGroundItem(
    itemId: string,
    count: number,
    x: number,
    y: number,
    droppedBy?: string,
    enhancement?: number,
  ): void {
    let id = uuid();
    let groundItem: GroundItemDrop = {
      id,
      itemId,
      count,
      x,
      y,
      droppedBy,
      enhancement,
      createdAt: Date.now(),
    };
    this.groundItems.set(id, groundItem);

    // Broadcast to all players
    this.broadcast(PacketType.GROUND_ITEM, { item: groundItem });
  }

  pickupGroundItem(player: Player, groundItemId: string): boolean {
    let item = this.groundItems.get(groundItemId);
    if (!item) return false;

    // Must be within 2 tiles
    let dist = Math.abs(player.x - item.x) + Math.abs(player.y - item.y);
    if (dist > 2) return false;

    // Add to player inventory
    if (!player.addItem(item.itemId, item.count, item.enhancement)) {
      return false;
    }

    // Remove from ground
    this.groundItems.delete(groundItemId);
    this.broadcast(PacketType.GROUND_ITEM_REMOVED, { id: groundItemId });

    return true;
  }

  // Get ground items near a position (for initial sync)
  getGroundItemsNear(x: number, y: number, range: number): GroundItemDrop[] {
    let items: GroundItemDrop[] = [];
    for (let [, item] of this.groundItems) {
      let dist = Math.abs(item.x - x) + Math.abs(item.y - y);
      if (dist <= range) {
        items.push(item);
      }
    }
    return items;
  }

  // Broadcast helpers
  broadcast(type: PacketType, data: unknown, exclude?: string): void {
    if (this.broadcastFn) {
      this.broadcastFn(type, data, exclude);
    }
  }

  broadcastEntityMove(
    entity: { id: string; x: number; y: number; direction: Direction } & (
      | { mobId: string }
      | { playerClass?: string }
    ),
  ): void {
    let entityType: EntityType =
      "mobId" in entity ? EntityType.MOB : EntityType.PLAYER;
    this.broadcast(PacketType.ENTITY_MOVE, {
      id: entity.id,
      type: entityType,
      x: entity.x,
      y: entity.y,
      direction: entity.direction,
    });
  }

  broadcastCombatHit(
    attackerId: string,
    attackerType: EntityType,
    targetId: string,
    targetType: EntityType,
    damage: number,
    isCrit: boolean = false,
    hp?: number,
    maxHp?: number,
  ): void {
    this.broadcast(PacketType.COMBAT_HIT, {
      attackerId,
      attackerType,
      targetId,
      targetType,
      damage,
      isCrit,
      hp,
      maxHp,
    });
  }

  broadcastEntityDeath(
    entityId: string,
    entityType: EntityType,
    killerId?: string,
    expLost?: number,
  ): void {
    this.broadcast(PacketType.ENTITY_DEATH, {
      id: entityId,
      type: entityType,
      killerId,
      expLost,
    });
  }

  onMobRespawn(mob: Mob): void {
    this.broadcast(PacketType.MOB_SPAWN, {
      mob: mob.toData(),
    });
  }
}
