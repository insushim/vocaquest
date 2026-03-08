// ============================================
// VocaQuest Online - Player Entity
// 100% Original Code - MIT License
// ============================================

import type {
  PlayerData,
  PlayerStats,
  InventorySlot,
  EquipmentSlots,
  EquipmentEnhancements,
  AllocatedStats,
  LootDrop,
  SkillDefinition,
  QuestProgress,
  TradeOffer,
  TradeState,
} from "../../shared/types";
import {
  EntityType,
  Direction,
  PlayerClass,
  EquipSlot,
  ItemType,
  SkillId,
  StatType,
  MAX_INVENTORY_SLOTS,
  HP_REGEN_RATE,
  MP_REGEN_RATE,
  REGEN_INTERVAL,
  STAT_POINTS_PER_LEVEL,
  STAT_EFFECTS,
  ENHANCE_MAX,
  ENHANCE_SUCCESS_RATES,
  ENHANCE_DESTROY_THRESHOLD,
  SET_BONUSES,
  expForLevel,
  getKarmaTitle,
  PacketType,
  TICK_INTERVAL,
} from "../../shared/types";
import { ITEMS } from "./data/items";
import { SKILLS } from "./data/skills";
import type { Connection } from "./network";

// Base stats per class at level 1
const BASE_STATS: Record<
  PlayerClass,
  {
    hp: number;
    mp: number;
    attack: number;
    defense: number;
    speed: number;
    critRate: number;
    critDamage: number;
    dodgeRate: number;
    attackSpeed: number;
    magicAttack: number;
    magicDefense: number;
  }
> = {
  [PlayerClass.WARRIOR]: {
    hp: 120,
    mp: 30,
    attack: 12,
    defense: 8,
    speed: 3,
    critRate: 3,
    critDamage: 1.5,
    dodgeRate: 2,
    attackSpeed: 1.0,
    magicAttack: 2,
    magicDefense: 3,
  },
  [PlayerClass.KNIGHT]: {
    hp: 150,
    mp: 40,
    attack: 8,
    defense: 12,
    speed: 2,
    critRate: 2,
    critDamage: 1.5,
    dodgeRate: 1,
    attackSpeed: 0.9,
    magicAttack: 3,
    magicDefense: 8,
  },
  [PlayerClass.MAGE]: {
    hp: 70,
    mp: 120,
    attack: 4,
    defense: 4,
    speed: 3,
    critRate: 5,
    critDamage: 1.8,
    dodgeRate: 3,
    attackSpeed: 0.8,
    magicAttack: 15,
    magicDefense: 10,
  },
  [PlayerClass.ARCHER]: {
    hp: 90,
    mp: 50,
    attack: 10,
    defense: 5,
    speed: 5,
    critRate: 8,
    critDamage: 1.6,
    dodgeRate: 5,
    attackSpeed: 1.2,
    magicAttack: 3,
    magicDefense: 4,
  },
};

// Per level stat growth
const LEVEL_GROWTH: Record<
  PlayerClass,
  {
    hp: number;
    mp: number;
    attack: number;
    defense: number;
    magicAttack: number;
  }
> = {
  [PlayerClass.WARRIOR]: {
    hp: 14,
    mp: 3,
    attack: 2.5,
    defense: 1.5,
    magicAttack: 0.3,
  },
  [PlayerClass.KNIGHT]: {
    hp: 16,
    mp: 4,
    attack: 1.8,
    defense: 2.2,
    magicAttack: 0.5,
  },
  [PlayerClass.MAGE]: {
    hp: 6,
    mp: 10,
    attack: 0.5,
    defense: 0.8,
    magicAttack: 3.0,
  },
  [PlayerClass.ARCHER]: {
    hp: 10,
    mp: 5,
    attack: 2.2,
    defense: 1.0,
    magicAttack: 0.4,
  },
};

export interface QuizPendingData {
  correct: string;
  mobId: string;
  drops: LootDrop[];
}

export interface PlayerSaveData {
  name: string;
  passwordHash: string;
  playerClass: PlayerClass;
  level: number;
  exp: number;
  gold: number;
  x: number;
  y: number;
  karma: number;
  killStreak: number;
  totalKills: number;
  gradeLevel: number;
  inventory: InventorySlot[];
  equipment: EquipmentSlots;
  equipEnhancements?: EquipmentEnhancements;
  allocatedStats?: AllocatedStats;
  statPoints?: number;
  quests?: QuestProgress[];
  completedQuests?: string[];
  achievements?: string[];
  achievementProgress?: Record<string, number>;
  title?: string;
  titleKo?: string;
}

function defaultAllocatedStats(): AllocatedStats {
  return {
    [StatType.STR]: 0,
    [StatType.DEX]: 0,
    [StatType.INT]: 0,
    [StatType.CON]: 0,
    [StatType.WIS]: 0,
  };
}

function defaultEquipEnhancements(): EquipmentEnhancements {
  return {
    [EquipSlot.WEAPON]: 0,
    [EquipSlot.HELMET]: 0,
    [EquipSlot.CHESTPLATE]: 0,
    [EquipSlot.LEGS]: 0,
    [EquipSlot.BOOTS]: 0,
    [EquipSlot.SHIELD]: 0,
    [EquipSlot.RING]: 0,
    [EquipSlot.PENDANT]: 0,
  };
}

export class Player {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: Direction;

  playerClass: PlayerClass;
  level: number;

  stats: PlayerStats;
  karma: number;
  killStreak: number;
  totalKills: number;
  gradeLevel: number;

  inventory: InventorySlot[];
  equipment: EquipmentSlots;
  equipEnhancements: EquipmentEnhancements;
  allocatedStats: AllocatedStats;

  connection: Connection;
  target: { id: string; type: EntityType } | null;
  attackCooldown: number;
  skillCooldowns: Map<string, number>;
  lastRegenTime: number;
  lastCombatTime: number;

  quizPending: boolean;
  quizAnswer: QuizPendingData | null;
  usedWords: Set<string>;

  buffs: Map<string, { endsAt: number; effect: Record<string, number> }>;

  quests: QuestProgress[];
  completedQuests: Set<string>;

  // Achievement system
  achievements: Set<string>;
  achievementProgress: Record<string, number>;
  title?: string;
  titleKo?: string;
  loginTime: number;

  isDead: boolean;
  respawnTimer: number | null;

  // Party system (not persisted)
  partyId: string | null;
  partyInviteFrom: string | null;

  // Trade system (not persisted)
  tradeState: TradeState | null;
  tradeRequestFrom: string | null;

  constructor(
    id: string,
    name: string,
    playerClass: PlayerClass,
    connection: Connection,
  ) {
    this.id = id;
    this.name = name;
    this.playerClass = playerClass;
    this.connection = connection;
    this.x = 100;
    this.y = 100;
    this.direction = Direction.DOWN;

    this.level = 1;
    this.karma = 0;
    this.killStreak = 0;
    this.totalKills = 0;
    this.gradeLevel = 1;

    this.inventory = [];
    this.equipment = {
      [EquipSlot.WEAPON]: null,
      [EquipSlot.HELMET]: null,
      [EquipSlot.CHESTPLATE]: null,
      [EquipSlot.LEGS]: null,
      [EquipSlot.BOOTS]: null,
      [EquipSlot.SHIELD]: null,
      [EquipSlot.RING]: null,
      [EquipSlot.PENDANT]: null,
    };
    this.equipEnhancements = defaultEquipEnhancements();
    this.allocatedStats = defaultAllocatedStats();

    this.target = null;
    this.attackCooldown = 0;
    this.skillCooldowns = new Map();
    this.lastRegenTime = Date.now();
    this.lastCombatTime = 0;

    this.quizPending = false;
    this.quizAnswer = null;
    this.usedWords = new Set();

    this.buffs = new Map();
    this.quests = [];
    this.completedQuests = new Set();
    this.achievements = new Set();
    this.achievementProgress = {};
    this.loginTime = Date.now();
    this.isDead = false;
    this.respawnTimer = null;
    this.partyId = null;
    this.partyInviteFrom = null;
    this.tradeState = null;
    this.tradeRequestFrom = null;

    this.stats = this.calculateStats();
    this.stats.hp = this.stats.maxHp;
    this.stats.mp = this.stats.maxMp;
    this.stats.exp = 0;
    this.stats.expToLevel = expForLevel(this.level);
    this.stats.gold = 100;
    this.stats.statPoints = 0;
  }

  static fromSaveData(
    data: PlayerSaveData,
    id: string,
    connection: Connection,
  ): Player {
    let player = new Player(id, data.name, data.playerClass, connection);
    player.level = data.level;
    player.karma = data.karma;
    player.killStreak = data.killStreak;
    player.totalKills = data.totalKills;
    player.gradeLevel = data.gradeLevel;
    player.x = data.x;
    player.y = data.y;
    player.inventory = data.inventory || [];
    player.equipment = data.equipment || player.equipment;
    player.equipEnhancements =
      data.equipEnhancements || defaultEquipEnhancements();
    player.allocatedStats = data.allocatedStats || defaultAllocatedStats();
    player.quests = data.quests || [];
    player.completedQuests = new Set(data.completedQuests || []);
    player.achievements = new Set(data.achievements || []);
    player.achievementProgress = data.achievementProgress || {};
    player.title = data.title;
    player.titleKo = data.titleKo;

    player.stats = player.calculateStats();
    player.stats.hp = player.stats.maxHp;
    player.stats.mp = player.stats.maxMp;
    player.stats.exp = data.exp;
    player.stats.expToLevel = expForLevel(data.level);
    player.stats.gold = data.gold;
    player.stats.statPoints = data.statPoints || 0;

    return player;
  }

  giveStarterItems(): void {
    switch (this.playerClass) {
      case PlayerClass.WARRIOR:
        this.addItem("wooden_sword", 1);
        break;
      case PlayerClass.KNIGHT:
        this.addItem("iron_spear", 1);
        this.addItem("wooden_shield", 1);
        break;
      case PlayerClass.MAGE:
        this.addItem("oak_staff", 1);
        break;
      case PlayerClass.ARCHER:
        this.addItem("hunting_bow", 1);
        break;
    }
    this.addItem("leather_armor", 1);
    this.addItem("health_potion", 5);
    this.addItem("mana_potion", 3);
    this.addItem("return_scroll", 3);
    this.addItem("enhance_scroll", 2);
  }

  calculateStats(): PlayerStats {
    let growth = LEVEL_GROWTH[this.playerClass];
    let base = BASE_STATS[this.playerClass];
    let levelsGained = this.level - 1;

    let maxHp =
      base.hp +
      Math.floor(growth.hp * levelsGained) +
      this.getEquipmentBonus("hp");
    let maxMp =
      base.mp +
      Math.floor(growth.mp * levelsGained) +
      this.getEquipmentBonus("mp");
    let attack =
      base.attack +
      Math.floor(growth.attack * levelsGained) +
      this.getEquipmentBonus("attack");
    let defense =
      base.defense +
      Math.floor(growth.defense * levelsGained) +
      this.getEquipmentBonus("defense");
    let speed = base.speed + this.getEquipmentBonus("speed");
    let critRate = base.critRate + this.getEquipmentBonus("critRate");
    let critDamage = base.critDamage + this.getEquipmentBonus("critDamage");
    let dodgeRate = base.dodgeRate + this.getEquipmentBonus("dodgeRate");
    let attackSpeed = base.attackSpeed + this.getEquipmentBonus("attackSpeed");
    let magicAttack =
      base.magicAttack +
      Math.floor((growth.magicAttack || 0) * levelsGained) +
      this.getEquipmentBonus("magicAttack");
    let magicDefense =
      base.magicDefense + this.getEquipmentBonus("magicDefense");

    // Apply allocated stat points
    let as = this.allocatedStats;
    let se = STAT_EFFECTS;
    maxHp += as.str * se.str.hp + as.con * se.con.hp;
    maxMp += as.int * se.int.mp + as.wis * se.wis.mp;
    attack += as.str * se.str.attack;
    defense += Math.floor(as.con * se.con.defense);
    speed += Math.floor(as.dex * se.dex.speed);
    critRate += as.dex * se.dex.critRate;
    dodgeRate += as.dex * se.dex.dodgeRate;
    attackSpeed += as.dex * se.dex.attackSpeed;
    magicAttack += Math.floor(as.int * se.int.magicAttack);
    magicDefense +=
      Math.floor(as.con * se.con.magicDefense) +
      Math.floor(as.int * se.int.magicDefense) +
      Math.floor(as.wis * se.wis.magicDefense);

    // Apply enhancement bonuses
    for (let slot of Object.values(EquipSlot)) {
      let itemId = this.equipment[slot];
      let enhance = this.equipEnhancements[slot] || 0;
      if (itemId && enhance > 0) {
        let item = ITEMS[itemId];
        if (item) {
          // Enhancement bonus: base stat * enhance * 0.1 (10% per level)
          if (item.attack) attack += Math.floor(item.attack * enhance * 0.1);
          if (item.defense) defense += Math.floor(item.defense * enhance * 0.1);
          if (item.hp) maxHp += Math.floor(item.hp * enhance * 0.1);
          if (item.mp) maxMp += Math.floor(item.mp * enhance * 0.1);
          if (item.magicAttack)
            magicAttack += Math.floor(item.magicAttack * enhance * 0.1);
          if (item.magicDefense)
            magicDefense += Math.floor(item.magicDefense * enhance * 0.1);
        }
      }
    }

    // Apply set bonuses
    let setCounts: Record<string, number> = {};
    for (let slot of Object.values(EquipSlot)) {
      let itemId = this.equipment[slot];
      if (itemId) {
        let item = ITEMS[itemId];
        if (item && item.setId) {
          setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
        }
      }
    }

    for (let [setId, count] of Object.entries(setCounts)) {
      let setDef = SET_BONUSES[setId];
      if (!setDef) continue;

      for (let tier of setDef.bonuses) {
        if (count < tier.piecesRequired) continue;

        let fx = tier.effects;
        if (fx.hpFlat) maxHp += fx.hpFlat;
        if (fx.mpFlat) maxMp += fx.mpFlat;
        if (fx.hpPercent) maxHp = Math.floor(maxHp * (1 + fx.hpPercent));
        if (fx.attackPercent)
          attack = Math.floor(attack * (1 + fx.attackPercent));
        if (fx.defensePercent)
          defense = Math.floor(defense * (1 + fx.defensePercent));
        if (fx.critRateFlat) critRate += fx.critRateFlat;
        if (fx.critDamageFlat) critDamage += fx.critDamageFlat;
        if (fx.attackSpeedPercent) attackSpeed *= 1 + fx.attackSpeedPercent;
        if (fx.allStatsPercent) {
          maxHp = Math.floor(maxHp * (1 + fx.allStatsPercent));
          maxMp = Math.floor(maxMp * (1 + fx.allStatsPercent));
          attack = Math.floor(attack * (1 + fx.allStatsPercent));
          defense = Math.floor(defense * (1 + fx.allStatsPercent));
          magicAttack = Math.floor(magicAttack * (1 + fx.allStatsPercent));
          magicDefense = Math.floor(magicDefense * (1 + fx.allStatsPercent));
        }
      }
    }

    // Apply buff bonuses
    for (let [, buff] of this.buffs) {
      if (Date.now() < buff.endsAt) {
        if (buff.effect.attackPercent) {
          attack = Math.floor(attack * (1 + buff.effect.attackPercent));
        }
        if (buff.effect.speedPercent) {
          speed = Math.floor(speed * (1 + buff.effect.speedPercent));
        }
        if (buff.effect.defensePercent) {
          defense = Math.floor(defense * (1 + buff.effect.defensePercent));
        }
        if (buff.effect.critRateBonus) {
          critRate += buff.effect.critRateBonus;
        }
      }
    }

    return {
      hp: this.stats?.hp ?? maxHp,
      maxHp,
      mp: this.stats?.mp ?? maxMp,
      maxMp,
      attack,
      defense,
      speed,
      exp: this.stats?.exp ?? 0,
      expToLevel: expForLevel(this.level),
      level: this.level,
      gold: this.stats?.gold ?? 100,
      critRate: Math.min(critRate, 80),
      critDamage,
      dodgeRate: Math.min(dodgeRate, 60),
      attackSpeed: Math.max(0.3, attackSpeed),
      magicAttack,
      magicDefense,
      statPoints: this.stats?.statPoints ?? 0,
      allocatedStats: { ...this.allocatedStats },
    };
  }

  getEquipmentBonus(stat: string): number {
    let bonus = 0;
    for (let slot of Object.values(EquipSlot)) {
      let itemId = this.equipment[slot];
      if (itemId) {
        let item = ITEMS[itemId];
        if (item) {
          let value = (item as unknown as Record<string, unknown>)[stat];
          if (typeof value === "number") {
            bonus += value;
          }
        }
      }
    }
    return bonus;
  }

  allocateStat(statType: StatType): boolean {
    if (this.stats.statPoints <= 0) {
      this.connection.send(PacketType.NOTIFICATION, {
        message: "No stat points available.",
        messageKo: "배분할 스탯 포인트가 없습니다.",
      });
      return false;
    }

    this.allocatedStats[statType]++;
    this.stats.statPoints--;

    // Recalculate stats
    let currentHp = this.stats.hp;
    let currentMp = this.stats.mp;
    let currentExp = this.stats.exp;
    let currentGold = this.stats.gold;
    let currentStatPoints = this.stats.statPoints;
    this.stats = this.calculateStats();
    this.stats.hp = Math.min(currentHp, this.stats.maxHp);
    this.stats.mp = Math.min(currentMp, this.stats.maxMp);
    this.stats.exp = currentExp;
    this.stats.gold = currentGold;
    this.stats.statPoints = currentStatPoints;

    // If HP/MP increased, give the bonus
    if (this.stats.maxHp > currentHp) {
      this.stats.hp = Math.min(
        this.stats.maxHp,
        currentHp + (this.stats.maxHp - currentHp),
      );
    }
    if (this.stats.maxMp > currentMp) {
      this.stats.mp = Math.min(
        this.stats.maxMp,
        currentMp + (this.stats.maxMp - currentMp),
      );
    }

    this.connection.send(PacketType.STATS_UPDATE, { stats: this.stats });
    return true;
  }

  move(newX: number, newY: number): boolean {
    let dx = newX - this.x;
    let dy = newY - this.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    } else if (dy !== 0) {
      this.direction = dy > 0 ? Direction.DOWN : Direction.UP;
    }
    this.x = newX;
    this.y = newY;
    return true;
  }

  attack(targetId: string, targetType: EntityType): void {
    this.target = { id: targetId, type: targetType };
    this.lastCombatTime = Date.now();
  }

  takeDamage(amount: number, attackerId?: string): number {
    // Check evasion buff
    if (
      this.buffs.has("evasion") &&
      Date.now() < this.buffs.get("evasion")!.endsAt
    ) {
      return 0;
    }

    // Check dodge
    if (Math.random() * 100 < this.stats.dodgeRate) {
      this.connection.send(PacketType.NOTIFICATION, {
        message: "Dodged!",
        messageKo: "회피!",
      });
      return 0;
    }

    // Check magic barrier
    if (this.buffs.has("magic_barrier")) {
      let barrier = this.buffs.get("magic_barrier")!;
      if (Date.now() < barrier.endsAt && barrier.effect.absorb > 0) {
        let absorbed = Math.min(amount, barrier.effect.absorb);
        barrier.effect.absorb -= absorbed;
        amount -= absorbed;
        if (barrier.effect.absorb <= 0) {
          this.buffs.delete("magic_barrier");
        }
        if (amount <= 0) return 0;
      }
    }

    // Check divine shield
    if (this.buffs.has("divine_shield")) {
      let shield = this.buffs.get("divine_shield")!;
      if (Date.now() < shield.endsAt && shield.effect.charges > 0) {
        shield.effect.charges--;
        if (shield.effect.charges <= 0) {
          this.buffs.delete("divine_shield");
        }
        return 0;
      }
    }

    let actualDamage = Math.max(1, amount);
    this.stats.hp = Math.max(0, this.stats.hp - actualDamage);
    this.lastCombatTime = Date.now();

    if (this.stats.hp <= 0) {
      this.die();
    }

    return actualDamage;
  }

  die(): void {
    this.isDead = true;
    this.target = null;

    // Lose 5% exp
    let expLoss = Math.floor(this.stats.exp * 0.05);
    this.stats.exp = Math.max(0, this.stats.exp - expLoss);

    // Drop some gold (10%)
    let goldDrop = Math.floor(this.stats.gold * 0.1);
    this.stats.gold -= goldDrop;

    this.respawnTimer = Date.now() + 5000;

    // Broadcast death to all clients (including the dead player)
    this.connection.server.world.broadcastEntityDeath(
      this.id,
      EntityType.PLAYER,
      undefined,
      expLoss,
    );

    // Send updated stats to the dead player
    this.connection.send(PacketType.STATS_UPDATE, { stats: this.stats });
  }

  respawn(spawnX: number, spawnY: number): void {
    this.isDead = false;
    this.respawnTimer = null;
    this.x = spawnX;
    this.y = spawnY;
    this.stats.hp = this.stats.maxHp;
    this.stats.mp = Math.floor(this.stats.maxMp * 0.5);
    this.target = null;

    this.connection.send(PacketType.RESPAWN, {
      x: this.x,
      y: this.y,
      stats: this.stats,
    });
  }

  addExp(amount: number): boolean {
    this.stats.exp += amount;
    this.connection.send(PacketType.EXP_GAIN, {
      amount,
      total: this.stats.exp,
    });

    let leveledUp = false;
    while (this.stats.exp >= this.stats.expToLevel) {
      this.stats.exp -= this.stats.expToLevel;
      this.levelUp();
      leveledUp = true;
    }
    return leveledUp;
  }

  levelUp(): void {
    this.level++;

    // Grant stat points
    let statPoints = STAT_POINTS_PER_LEVEL;

    // Recalculate stats
    this.stats = this.calculateStats();
    this.stats.hp = this.stats.maxHp;
    this.stats.mp = this.stats.maxMp;
    this.stats.level = this.level;
    this.stats.expToLevel = expForLevel(this.level);
    this.stats.statPoints += statPoints;

    // Auto-update grade level
    if (this.level <= 5) this.gradeLevel = 1;
    else if (this.level <= 12) this.gradeLevel = 2;
    else if (this.level <= 20) this.gradeLevel = 3;
    else this.gradeLevel = 4;

    this.connection.send(PacketType.LEVEL_UP, {
      level: this.level,
      stats: this.stats,
      statPoints,
    });
  }

  regen(): void {
    if (this.isDead) return;
    let now = Date.now();
    if (now - this.lastRegenTime < REGEN_INTERVAL) return;
    if (now - this.lastCombatTime < 5000) return;

    this.lastRegenTime = now;
    let hpRegenRate = HP_REGEN_RATE;
    let mpRegenRate = MP_REGEN_RATE;

    // Regen buff doubles rate
    if (
      this.buffs.has("regen_buff") &&
      Date.now() < this.buffs.get("regen_buff")!.endsAt
    ) {
      hpRegenRate *= 2;
      mpRegenRate *= 2;
    }

    let hpRegen = Math.floor(this.stats.maxHp * hpRegenRate);
    let mpRegen = Math.floor(this.stats.maxMp * mpRegenRate);

    let changed = false;
    if (this.stats.hp < this.stats.maxHp) {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + hpRegen);
      changed = true;
    }
    if (this.stats.mp < this.stats.maxMp) {
      this.stats.mp = Math.min(this.stats.maxMp, this.stats.mp + mpRegen);
      changed = true;
    }

    if (changed) {
      this.connection.send(PacketType.STATS_UPDATE, { stats: this.stats });
    }
  }

  addItem(itemId: string, count: number, enhancement?: number): boolean {
    let item = ITEMS[itemId];
    if (!item) return false;

    if (item.stackable && !enhancement) {
      let existingSlot = this.inventory.find((s) => s.itemId === itemId);
      if (existingSlot) {
        existingSlot.count += count;
        this.sendInventoryUpdate();
        return true;
      }
    }

    if (this.inventory.length >= MAX_INVENTORY_SLOTS) {
      this.connection.send(PacketType.NOTIFICATION, {
        message: "Inventory is full!",
        messageKo: "인벤토리가 가득 찼습니다!",
      });
      return false;
    }

    let slot: InventorySlot = { itemId, count };
    if (enhancement && enhancement > 0) {
      slot.enhancement = enhancement;
    }
    this.inventory.push(slot);
    this.sendInventoryUpdate();
    return true;
  }

  removeItem(slotIndex: number, count: number = 1): boolean {
    if (slotIndex < 0 || slotIndex >= this.inventory.length) return false;

    let slot = this.inventory[slotIndex];
    slot.count -= count;
    if (slot.count <= 0) {
      this.inventory.splice(slotIndex, 1);
    }

    this.sendInventoryUpdate();
    return true;
  }

  equipItem(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.inventory.length) return false;

    let slot = this.inventory[slotIndex];
    let item = ITEMS[slot.itemId];
    if (!item || !item.equipSlot) return false;

    if (item.classReq && item.classReq !== this.playerClass) {
      this.connection.send(PacketType.NOTIFICATION, {
        message: "Your class cannot use this item.",
        messageKo: "이 직업으로는 사용할 수 없는 아이템입니다.",
      });
      return false;
    }

    if (item.level > this.level) {
      this.connection.send(PacketType.NOTIFICATION, {
        message: `Requires level ${item.level}.`,
        messageKo: `레벨 ${item.level}이 필요합니다.`,
      });
      return false;
    }

    // Unequip current item in that slot
    let currentEquip = this.equipment[item.equipSlot];
    let currentEnhance = this.equipEnhancements[item.equipSlot] || 0;
    if (currentEquip) {
      if (this.inventory.length >= MAX_INVENTORY_SLOTS) {
        this.connection.send(PacketType.NOTIFICATION, {
          message: "Inventory is full!",
          messageKo: "인벤토리가 가득 찼습니다!",
        });
        return false;
      }
      let unequipSlot: InventorySlot = { itemId: currentEquip, count: 1 };
      if (currentEnhance > 0) unequipSlot.enhancement = currentEnhance;
      this.inventory.push(unequipSlot);
    }

    // Equip new item
    this.equipment[item.equipSlot] = slot.itemId;
    this.equipEnhancements[item.equipSlot] = slot.enhancement || 0;
    this.inventory.splice(slotIndex, 1);

    // Recalculate stats
    let currentHp = this.stats.hp;
    let currentMp = this.stats.mp;
    this.stats = this.calculateStats();
    this.stats.hp = Math.min(currentHp, this.stats.maxHp);
    this.stats.mp = Math.min(currentMp, this.stats.maxMp);

    this.sendInventoryUpdate();
    this.sendEquipmentUpdate();
    this.connection.send(PacketType.STATS_UPDATE, { stats: this.stats });
    return true;
  }

  unequipItem(slot: EquipSlot): boolean {
    let itemId = this.equipment[slot];
    if (!itemId) return false;

    if (this.inventory.length >= MAX_INVENTORY_SLOTS) {
      this.connection.send(PacketType.NOTIFICATION, {
        message: "Inventory is full!",
        messageKo: "인벤토리가 가득 찼습니다!",
      });
      return false;
    }

    let enhance = this.equipEnhancements[slot] || 0;
    this.equipment[slot] = null;
    this.equipEnhancements[slot] = 0;

    let invSlot: InventorySlot = { itemId, count: 1 };
    if (enhance > 0) invSlot.enhancement = enhance;
    this.inventory.push(invSlot);

    let currentHp = this.stats.hp;
    let currentMp = this.stats.mp;
    this.stats = this.calculateStats();
    this.stats.hp = Math.min(currentHp, this.stats.maxHp);
    this.stats.mp = Math.min(currentMp, this.stats.maxMp);

    this.sendInventoryUpdate();
    this.sendEquipmentUpdate();
    this.connection.send(PacketType.STATS_UPDATE, { stats: this.stats });
    return true;
  }

  useItem(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.inventory.length) return false;

    let slot = this.inventory[slotIndex];
    let item = ITEMS[slot.itemId];
    if (!item) return false;

    // Consumable
    if (item.type === ItemType.CONSUMABLE) {
      let used = false;

      if (item.healAmount && this.stats.hp < this.stats.maxHp) {
        let heal = Math.min(item.healAmount, this.stats.maxHp - this.stats.hp);
        this.stats.hp = Math.min(
          this.stats.maxHp,
          this.stats.hp + item.healAmount,
        );
        used = true;
      }

      if (item.mpRestore && this.stats.mp < this.stats.maxMp) {
        this.stats.mp = Math.min(
          this.stats.maxMp,
          this.stats.mp + item.mpRestore,
        );
        used = true;
      }

      // Special: antidote removes poison
      if (slot.itemId === "antidote") {
        this.buffs.delete("poison");
        used = true;
      }

      if (!used) {
        this.connection.send(PacketType.NOTIFICATION, {
          message: "HP/MP is already full.",
          messageKo: "HP/MP가 이미 가득 찼습니다.",
        });
        return false;
      }

      this.removeItem(slotIndex, 1);
      this.connection.send(PacketType.STATS_UPDATE, { stats: this.stats });
      return true;
    }

    // Scroll
    if (item.type === ItemType.SCROLL) {
      if (item.scrollType === "return") {
        // Teleport to town
        this.x = 100;
        this.y = 100;
        this.removeItem(slotIndex, 1);
        this.connection.send(PacketType.TELEPORT, { x: this.x, y: this.y });
        this.connection.send(PacketType.NOTIFICATION, {
          message: "Teleported to town.",
          messageKo: "마을로 귀환했습니다.",
        });
        return true;
      }

      if (
        item.scrollType === "buff" &&
        item.buffType &&
        item.buffDuration &&
        item.buffValue
      ) {
        let effect: Record<string, number> = {};
        if (item.buffType === "attack_buff") {
          effect.attackPercent = item.buffValue / 100;
        } else if (item.buffType === "speed_buff") {
          effect.speedPercent = item.buffValue / 100;
        }
        this.buffs.set(item.buffType, {
          endsAt: Date.now() + item.buffDuration,
          effect,
        });

        // Recalculate
        let currentHp = this.stats.hp;
        let currentMp = this.stats.mp;
        let currentExp = this.stats.exp;
        let currentGold = this.stats.gold;
        let sp = this.stats.statPoints;
        this.stats = this.calculateStats();
        this.stats.hp = currentHp;
        this.stats.mp = currentMp;
        this.stats.exp = currentExp;
        this.stats.gold = currentGold;
        this.stats.statPoints = sp;

        this.removeItem(slotIndex, 1);
        this.connection.send(PacketType.STATS_UPDATE, { stats: this.stats });
        this.connection.send(PacketType.NOTIFICATION, {
          message: `Buff activated!`,
          messageKo: `버프가 적용되었습니다!`,
        });
        return true;
      }

      return false;
    }

    this.connection.send(PacketType.NOTIFICATION, {
      message: "This item cannot be used.",
      messageKo: "이 아이템은 사용할 수 없습니다.",
    });
    return false;
  }

  // Enhancement system
  enhanceItem(
    inventorySlotIndex: number,
    scrollSlotIndex: number,
  ): {
    success: boolean;
    destroyed: boolean;
    newLevel: number;
  } {
    if (inventorySlotIndex < 0 || inventorySlotIndex >= this.inventory.length) {
      return { success: false, destroyed: false, newLevel: 0 };
    }
    if (scrollSlotIndex < 0 || scrollSlotIndex >= this.inventory.length) {
      return { success: false, destroyed: false, newLevel: 0 };
    }

    let itemSlot = this.inventory[inventorySlotIndex];
    let scrollSlot = this.inventory[scrollSlotIndex];
    let item = ITEMS[itemSlot.itemId];
    let scroll = ITEMS[scrollSlot.itemId];

    if (!item || !scroll)
      return { success: false, destroyed: false, newLevel: 0 };
    if (!item.enhanceable) {
      this.connection.send(PacketType.NOTIFICATION, {
        message: "This item cannot be enhanced.",
        messageKo: "이 아이템은 강화할 수 없습니다.",
      });
      return { success: false, destroyed: false, newLevel: 0 };
    }
    if (scroll.scrollType !== "enhance") {
      return { success: false, destroyed: false, newLevel: 0 };
    }

    let currentEnhance = itemSlot.enhancement || 0;
    let maxEnhance = item.maxEnhance || ENHANCE_MAX;

    if (currentEnhance >= maxEnhance) {
      this.connection.send(PacketType.NOTIFICATION, {
        message: "Item is already at max enhancement.",
        messageKo: "이미 최대 강화 수치입니다.",
      });
      return { success: false, destroyed: false, newLevel: currentEnhance };
    }

    let successRate = ENHANCE_SUCCESS_RATES[currentEnhance] || 0.2;
    let isBlessed = scrollSlot.itemId === "blessed_enhance_scroll";

    // Consume scroll
    this.removeItem(scrollSlotIndex, 1);
    // Adjust inventory slot index if scroll was before item
    if (scrollSlotIndex < inventorySlotIndex) {
      inventorySlotIndex--;
    }

    let roll = Math.random();
    if (roll < successRate) {
      // Success
      if (inventorySlotIndex < this.inventory.length) {
        this.inventory[inventorySlotIndex].enhancement = currentEnhance + 1;
      }
      this.sendInventoryUpdate();
      return { success: true, destroyed: false, newLevel: currentEnhance + 1 };
    } else {
      // Failure
      let destroyed = false;
      if (!isBlessed && currentEnhance >= ENHANCE_DESTROY_THRESHOLD) {
        // Destroy the item
        if (inventorySlotIndex < this.inventory.length) {
          this.inventory.splice(inventorySlotIndex, 1);
        }
        destroyed = true;
      } else {
        // Downgrade by 1 (min 0)
        if (inventorySlotIndex < this.inventory.length) {
          let newEnhance = Math.max(0, currentEnhance - 1);
          this.inventory[inventorySlotIndex].enhancement =
            newEnhance > 0 ? newEnhance : undefined;
        }
      }
      this.sendInventoryUpdate();
      return {
        success: false,
        destroyed,
        newLevel: destroyed ? 0 : Math.max(0, currentEnhance - 1),
      };
    }
  }

  canUseSkill(skillId: SkillId): { ok: boolean; reason?: string } {
    let skill = SKILLS[skillId] as SkillDefinition | undefined;
    if (!skill) return { ok: false, reason: "Unknown skill." };
    if (skill.class !== this.playerClass)
      return { ok: false, reason: "Wrong class for this skill." };
    if (skill.level > this.level)
      return { ok: false, reason: `Requires level ${skill.level}.` };
    if (this.stats.mp < skill.mpCost)
      return { ok: false, reason: "Not enough MP." };

    let cooldownEnd = this.skillCooldowns.get(skillId) || 0;
    if (Date.now() < cooldownEnd) {
      let remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
      return { ok: false, reason: `Skill on cooldown (${remaining}s).` };
    }

    return { ok: true };
  }

  consumeMpForSkill(skillId: SkillId): void {
    let skill = SKILLS[skillId];
    if (!skill) return;
    this.stats.mp -= skill.mpCost;
    this.skillCooldowns.set(skillId, Date.now() + skill.cooldown);
  }

  // Status effects (debuffs from mobs/players)
  statusEffects: Map<
    string,
    { type: string; endsAt: number; value: number; sourceId: string }
  > = new Map();

  applyStatusEffect(
    type: string,
    duration: number,
    value: number,
    sourceId: string = "",
  ): void {
    this.statusEffects.set(type, {
      type,
      endsAt: Date.now() + duration,
      value,
      sourceId,
    });

    this.connection.send(PacketType.STATUS_EFFECT, {
      targetId: this.id,
      effectType: type,
      duration,
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
        continue;
      }

      // Tick-based effects: poison, burn, bleed
      if (key === "poison" || key === "burn" || key === "bleed") {
        // Apply DoT every 1 second
        if (!effect.sourceId.startsWith("_tick")) {
          // Track last tick
          let lastTick = parseInt(effect.sourceId.split("_tick_")[1] || "0");
          if (now - lastTick >= 1000) {
            let dot = effect.value;
            this.stats.hp = Math.max(1, this.stats.hp - dot);
            effect.sourceId = `_tick_${now}`;
            this.connection.send(PacketType.STATS_UPDATE, {
              stats: this.stats,
            });
          }
        }
      }
    }

    if (expired.length > 0) {
      for (let key of expired) {
        this.statusEffects.delete(key);
        this.connection.send(PacketType.STATUS_REMOVE, {
          targetId: this.id,
          effectType: key,
        });
      }
    }
  }

  updateBuffs(): void {
    let now = Date.now();
    let expired: string[] = [];
    for (let [key, buff] of this.buffs) {
      if (now >= buff.endsAt) {
        expired.push(key);
      }
    }
    if (expired.length > 0) {
      for (let key of expired) {
        this.buffs.delete(key);
      }
      let currentHp = this.stats.hp;
      let currentMp = this.stats.mp;
      let currentExp = this.stats.exp;
      let currentGold = this.stats.gold;
      let sp = this.stats.statPoints;
      this.stats = this.calculateStats();
      this.stats.hp = Math.min(currentHp, this.stats.maxHp);
      this.stats.mp = Math.min(currentMp, this.stats.maxMp);
      this.stats.exp = currentExp;
      this.stats.gold = currentGold;
      this.stats.statPoints = sp;
      this.connection.send(PacketType.STATS_UPDATE, { stats: this.stats });
    }
  }

  update(): void {
    if (this.isDead) {
      if (this.respawnTimer && Date.now() >= this.respawnTimer) {
        let spawn = this.connection.server.world.map.playerSpawn;
        this.respawn(spawn.x, spawn.y);
      }
      return;
    }

    this.regen();
    this.updateBuffs();
    this.updateStatusEffects();

    if (this.attackCooldown > 0) {
      this.attackCooldown -= TICK_INTERVAL;
    }
  }

  sendInventoryUpdate(): void {
    this.connection.send(PacketType.INVENTORY_UPDATE, {
      inventory: this.inventory,
    });
  }

  sendEquipmentUpdate(): void {
    this.connection.send(PacketType.EQUIPMENT_UPDATE, {
      equipment: this.equipment,
      enhancements: this.equipEnhancements,
    });
  }

  toData(): PlayerData {
    let karmaInfo = getKarmaTitle(this.karma);
    return {
      id: this.id,
      type: EntityType.PLAYER,
      x: this.x,
      y: this.y,
      name: this.name,
      direction: this.direction,
      class: this.playerClass,
      stats: this.stats,
      karma: this.karma,
      karmaTitle: karmaInfo.ko,
      gradeLevel: this.gradeLevel,
      equipment: this.equipment,
    };
  }

  toSaveData(passwordHash: string): PlayerSaveData {
    return {
      name: this.name,
      passwordHash,
      playerClass: this.playerClass,
      level: this.level,
      exp: this.stats.exp,
      gold: this.stats.gold,
      x: this.x,
      y: this.y,
      karma: this.karma,
      killStreak: this.killStreak,
      totalKills: this.totalKills,
      gradeLevel: this.gradeLevel,
      inventory: this.inventory,
      equipment: this.equipment,
      equipEnhancements: this.equipEnhancements,
      allocatedStats: this.allocatedStats,
      statPoints: this.stats.statPoints,
      quests: this.quests,
      completedQuests: [...this.completedQuests],
      achievements: [...this.achievements],
      achievementProgress: { ...this.achievementProgress },
      title: this.title,
      titleKo: this.titleKo,
    };
  }
}
