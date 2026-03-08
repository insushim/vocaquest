// ============================================
// VocaQuest Online - Mob Entity with AI
// 100% Original Code - MIT License
// ============================================

import { v4 as uuid } from "uuid";
import type { MobData, MobDefinition } from "../../shared/types";
import {
  EntityType,
  Direction,
  MobBehavior,
  TICK_INTERVAL,
  DEAGGRO_DISTANCE,
  DEAGGRO_TIME,
} from "../../shared/types";
import type { Player } from "./player";
import type { World } from "./world";
import { QuestType } from "../../shared/types";

export type MobState =
  | "idle"
  | "roaming"
  | "chasing"
  | "attacking"
  | "dead"
  | "returning";

export class Mob {
  id: string;
  mobId: string;
  definition: MobDefinition;
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
  direction: Direction;
  hp: number;
  maxHp: number;
  target: Player | null;
  state: MobState;
  lastAttackTime: number;
  lastMoveTime: number;
  respawnTimer: number | null;
  isDead: boolean;

  // Status effects
  statusEffects: Map<string, { type: string; endsAt: number; value: number }>;

  // Aggro tracking
  aggroStartTime: number;
  hitByPlayers: Set<string>; // track who hit this mob

  // Internal AI timers
  private roamCooldown: number;
  private moveCooldown: number;

  constructor(definition: MobDefinition, x: number, y: number) {
    this.id = uuid();
    this.mobId = definition.id;
    this.definition = definition;
    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;
    this.direction = Direction.DOWN;
    this.hp = definition.hp;
    this.maxHp = definition.hp;
    this.target = null;
    this.state = "idle";
    this.lastAttackTime = 0;
    this.lastMoveTime = 0;
    this.respawnTimer = null;
    this.isDead = false;
    this.roamCooldown = 0;
    this.moveCooldown = 0;
    this.statusEffects = new Map();
    this.aggroStartTime = 0;
    this.hitByPlayers = new Set();
  }

  applyStatusEffect(type: string, duration: number, value: number): void {
    this.statusEffects.set(type, {
      type,
      endsAt: Date.now() + duration,
      value,
    });
  }

  isStunned(): boolean {
    let stun = this.statusEffects.get("stun");
    return !!stun && Date.now() < stun.endsAt;
  }

  updateStatusEffects(): void {
    let now = Date.now();
    let expired: string[] = [];
    for (let [key, effect] of this.statusEffects) {
      if (now >= effect.endsAt) {
        expired.push(key);
      }
    }
    for (let key of expired) {
      this.statusEffects.delete(key);
    }
  }

  update(world: World, deltaTime: number): void {
    if (this.isDead) {
      if (this.respawnTimer && Date.now() >= this.respawnTimer) {
        this.respawn();
        world.onMobRespawn(this);
      }
      return;
    }

    this.updateStatusEffects();
    this.roamCooldown -= deltaTime;
    this.moveCooldown -= deltaTime;

    // Stunned mobs can't act
    if (this.isStunned()) return;

    // Slowed mobs move slower
    let slowEffect = this.statusEffects.get("slow");
    if (slowEffect && Date.now() < slowEffect.endsAt) {
      this.moveCooldown += deltaTime * 0.5; // 50% slower movement
    }

    switch (this.state) {
      case "idle":
        this.updateIdle(world);
        break;
      case "roaming":
        this.updateRoaming(world);
        break;
      case "chasing":
        this.updateChasing(world);
        break;
      case "attacking":
        this.updateAttacking(world);
        break;
      case "returning":
        this.updateReturning(world);
        break;
    }
  }

  private updateIdle(world: World): void {
    // Check for nearby players (non-passive mobs)
    if (
      this.definition.behavior !== MobBehavior.PASSIVE &&
      this.definition.aggroRange > 0
    ) {
      let nearest = this.findNearestPlayer(world);
      if (nearest) {
        this.target = nearest;
        this.state = "chasing";
        this.aggroStartTime = Date.now();
        return;
      }
    }

    // Random chance to start roaming
    if (this.roamCooldown <= 0 && Math.random() < 0.3) {
      this.state = "roaming";
      this.roamCooldown = 2000 + Math.random() * 3000;
    }
  }

  private updateRoaming(world: World): void {
    // Check for players while roaming
    if (
      this.definition.behavior !== MobBehavior.PASSIVE &&
      this.definition.aggroRange > 0
    ) {
      let nearest = this.findNearestPlayer(world);
      if (nearest) {
        this.target = nearest;
        this.state = "chasing";
        this.aggroStartTime = Date.now();
        return;
      }
    }

    if (this.moveCooldown <= 0) {
      // Move randomly within roam distance
      let dx = Math.floor(Math.random() * 3) - 1;
      let dy = Math.floor(Math.random() * 3) - 1;
      let newX = this.x + dx;
      let newY = this.y + dy;

      // Stay within roam distance of spawn
      if (
        this.distanceTo(this.spawnX, this.spawnY, newX, newY) <=
        this.definition.roamDistance
      ) {
        if (world.isWalkable(newX, newY)) {
          this.moveTo(newX, newY, world);
        }
      }

      this.moveCooldown = 500 + Math.random() * 1000;
      this.roamCooldown -= TICK_INTERVAL;

      if (this.roamCooldown <= 0) {
        this.state = "idle";
        this.roamCooldown = 3000 + Math.random() * 5000;
      }
    }
  }

  private updateChasing(world: World): void {
    if (!this.target || this.target.isDead) {
      this.target = null;
      this.state = "idle";
      return;
    }

    let dist = this.distanceTo(this.x, this.y, this.target.x, this.target.y);
    let distFromSpawn = this.distanceTo(
      this.x,
      this.y,
      this.spawnX,
      this.spawnY,
    );

    // De-aggro: too far from spawn (15 tiles)
    if (distFromSpawn > DEAGGRO_DISTANCE) {
      this.target = null;
      this.hitByPlayers.clear();
      this.state = "returning";
      return;
    }

    // De-aggro: chase timeout (30 seconds)
    if (
      this.aggroStartTime > 0 &&
      Date.now() - this.aggroStartTime > DEAGGRO_TIME
    ) {
      this.target = null;
      this.aggroStartTime = 0;
      this.hitByPlayers.clear();
      this.state = "returning";
      return;
    }

    // If in attack range, switch to attacking
    if (dist <= 1.5) {
      this.state = "attacking";
      return;
    }

    // Move toward target
    if (this.moveCooldown <= 0) {
      this.moveToward(this.target.x, this.target.y, world);
      // Movement speed based on mob speed: faster mobs move more often
      this.moveCooldown = Math.max(200, 600 - this.definition.speed * 80);
    }
  }

  private updateAttacking(world: World): void {
    if (!this.target || this.target.isDead) {
      this.target = null;
      this.state = "idle";
      return;
    }

    let dist = this.distanceTo(this.x, this.y, this.target.x, this.target.y);

    // Target moved out of range, chase
    if (dist > 1.5) {
      this.state = "chasing";
      return;
    }

    // Attack every 1.5 seconds
    let now = Date.now();
    if (now - this.lastAttackTime >= 1500) {
      this.lastAttackTime = now;

      // Calculate damage
      let damage = Math.max(
        1,
        this.definition.attack - Math.floor(this.target.stats.defense / 2),
      );
      damage += Math.floor(Math.random() * 5) - 2;
      damage = Math.max(1, damage);

      let actualDamage = this.target.takeDamage(damage, this.id);

      world.broadcastCombatHit(
        this.id,
        EntityType.MOB,
        this.target.id,
        EntityType.PLAYER,
        actualDamage,
        false,
        this.target.stats.hp,
        this.target.stats.maxHp,
      );

      // Apply mob status effects
      if (this.definition.statusEffects) {
        for (let se of this.definition.statusEffects) {
          if (Math.random() < se.chance) {
            this.target.applyStatusEffect(
              se.type,
              se.duration,
              se.value,
              this.id,
            );
          }
        }
      }

      if (this.target.isDead) {
        this.target = null;
        this.state = "idle";
      }
    }
  }

  private updateReturning(world: World): void {
    let dist = this.distanceTo(this.x, this.y, this.spawnX, this.spawnY);

    if (dist <= 1) {
      this.x = this.spawnX;
      this.y = this.spawnY;
      this.state = "idle";
      this.hp = this.maxHp; // Heal when returning
      this.aggroStartTime = 0;
      this.hitByPlayers.clear();
      world.broadcastEntityMove(this);
      return;
    }

    if (this.moveCooldown <= 0) {
      this.moveToward(this.spawnX, this.spawnY, world);
      this.moveCooldown = 400;
    }
  }

  private findNearestPlayer(world: World): Player | null {
    let nearestPlayer: Player | null = null;
    let nearestDist = this.definition.aggroRange;

    for (let [, player] of world.players) {
      if (player.isDead) continue;
      let dist = this.distanceTo(this.x, this.y, player.x, player.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestPlayer = player;
      }
    }

    return nearestPlayer;
  }

  takeDamage(amount: number, attacker: Player, world?: World): number {
    let actualDamage = Math.max(1, amount);
    this.hp = Math.max(0, this.hp - actualDamage);

    // Track who hit this mob
    this.hitByPlayers.add(attacker.id);

    // Set attacker as target if not already targeting (aggro on hit - all mobs)
    if (!this.target || this.target.isDead) {
      this.target = attacker;
      this.state = "chasing";
      this.aggroStartTime = Date.now();
    }

    // Multi-aggro: nearby aggressive mobs of same zone join the fight
    if (world) {
      this.alertNearbyMobs(attacker, world);
    }

    return actualDamage;
  }

  // Alert nearby aggressive mobs when this mob is hit
  private alertNearbyMobs(attacker: Player, world: World): void {
    let alertRange = 4; // tiles
    let alerted = 0;
    let maxAlert = 2; // max 2 additional mobs join

    for (let [, mob] of world.mobs) {
      if (mob.id === this.id || mob.isDead) continue;
      if (mob.target) continue; // already has a target
      if (mob.definition.behavior === MobBehavior.PASSIVE) continue;

      let dist = this.distanceTo(this.x, this.y, mob.x, mob.y);
      if (dist <= alertRange) {
        mob.target = attacker;
        mob.state = "chasing";
        mob.aggroStartTime = Date.now();
        alerted++;
        if (alerted >= maxAlert) break;
      }
    }
  }

  die(killer: Player, world: World): void {
    this.isDead = true;
    this.state = "dead";
    this.target = null;
    this.respawnTimer = Date.now() + this.definition.respawnTime;

    // Give exp and gold to killer (or distribute to party)
    let { PartySystem } = require("./systems");
    let party = PartySystem.getParty(killer.id);
    if (party && party.members.size > 1) {
      party.distributeExp(this.definition.exp, killer.x, killer.y);
      party.distributeGold(this.definition.gold, killer.x, killer.y);
    } else {
      killer.addExp(this.definition.exp);
      killer.stats.gold += this.definition.gold;
      killer.connection.send("stats_update", { stats: killer.stats });
    }

    // Broadcast death
    world.broadcastEntityDeath(this.id, EntityType.MOB, killer.id);

    // Update quest progress for kill/boss type
    let { QuestSystem } = require("./systems");
    let questType = this.definition.isBoss ? QuestType.BOSS : QuestType.KILL;
    QuestSystem.updateProgress(killer, questType, this.mobId, 1);

    // Roll loot drops and start quiz
    let drops = this.rollDrops();
    world.startQuizForPlayer(killer, this, drops);
  }

  private rollDrops(): Array<{ itemId: string; count: number }> {
    let drops: Array<{ itemId: string; count: number }> = [];

    for (let drop of this.definition.drops) {
      if (Math.random() <= drop.chance) {
        let count =
          drop.minCount +
          Math.floor(Math.random() * (drop.maxCount - drop.minCount + 1));
        drops.push({ itemId: drop.itemId, count });
      }
    }

    return drops;
  }

  respawn(): void {
    this.isDead = false;
    this.state = "idle";
    this.hp = this.maxHp;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.target = null;
    this.respawnTimer = null;
    this.lastAttackTime = 0;
    this.aggroStartTime = 0;
    this.hitByPlayers.clear();
  }

  moveToward(targetX: number, targetY: number, world: World): void {
    let dx = targetX - this.x;
    let dy = targetY - this.y;

    let moveX = 0;
    let moveY = 0;

    if (Math.abs(dx) > Math.abs(dy)) {
      moveX = dx > 0 ? 1 : -1;
    } else if (dy !== 0) {
      moveY = dy > 0 ? 1 : -1;
    }

    let newX = this.x + moveX;
    let newY = this.y + moveY;

    if (world.isWalkable(newX, newY)) {
      this.moveTo(newX, newY, world);
    } else {
      // Try alternate direction
      if (moveX !== 0 && dy !== 0) {
        newX = this.x;
        newY = this.y + (dy > 0 ? 1 : -1);
        if (world.isWalkable(newX, newY)) {
          this.moveTo(newX, newY, world);
        }
      } else if (moveY !== 0 && dx !== 0) {
        newX = this.x + (dx > 0 ? 1 : -1);
        newY = this.y;
        if (world.isWalkable(newX, newY)) {
          this.moveTo(newX, newY, world);
        }
      }
    }
  }

  private moveTo(newX: number, newY: number, world: World): void {
    let dx = newX - this.x;
    let dy = newY - this.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else if (dy !== 0) {
      this.direction = dy > 0 ? Direction.DOWN : Direction.UP;
    }

    this.x = newX;
    this.y = newY;
    this.lastMoveTime = Date.now();

    world.broadcastEntityMove(this);
  }

  distanceTo(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  toData(): MobData {
    return {
      id: this.id,
      type: EntityType.MOB,
      x: this.x,
      y: this.y,
      name: this.definition.nameKo,
      direction: this.direction,
      mobId: this.mobId,
      hp: this.hp,
      maxHp: this.maxHp,
      level: this.definition.level,
      behavior: this.definition.behavior,
      isBoss: this.definition.isBoss,
    };
  }
}
