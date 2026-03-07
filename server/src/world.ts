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
import { QuizSystem } from "./systems";
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
  private lastTickTime: number;
  private broadcastFn:
    | ((type: PacketType, data: unknown, exclude?: string) => void)
    | null;

  constructor() {
    this.map = generateMap();
    this.players = new Map();
    this.mobs = new Map();
    this.itemDrops = new Map();
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

    // Clean up old item drops
    for (let [id, drop] of this.itemDrops) {
      if (now - drop.createdAt > ITEM_DROP_LIFETIME) {
        this.itemDrops.delete(id);
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
  ): void {
    this.broadcast(PacketType.COMBAT_HIT, {
      attackerId,
      attackerType,
      targetId,
      targetType,
      damage,
      isCrit,
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
