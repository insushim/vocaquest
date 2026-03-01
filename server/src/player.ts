// ============================================
// VocaQuest Online - Player Entity
// 100% Original Code - MIT License
// ============================================

import type {
  PlayerData,
  PlayerStats,
  InventorySlot,
  EquipmentSlots,
  ItemDefinition,
  LootDrop,
  SkillDefinition,
} from "../../shared/types";
import {
  EntityType,
  Direction,
  PlayerClass,
  EquipSlot,
  ItemType,
  SkillId,
  MAX_INVENTORY_SLOTS,
  HP_REGEN_RATE,
  MP_REGEN_RATE,
  REGEN_INTERVAL,
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
  { hp: number; mp: number; attack: number; defense: number; speed: number }
> = {
  [PlayerClass.WARRIOR]: { hp: 100, mp: 30, attack: 10, defense: 8, speed: 3 },
  [PlayerClass.MAGE]: { hp: 60, mp: 100, attack: 6, defense: 4, speed: 3 },
  [PlayerClass.ARCHER]: { hp: 80, mp: 50, attack: 8, defense: 5, speed: 5 },
};

// Per level stat growth multipliers (class adjustments)
const LEVEL_GROWTH: Record<
  PlayerClass,
  { hp: number; mp: number; attack: number; defense: number }
> = {
  [PlayerClass.WARRIOR]: { hp: 12, mp: 3, attack: 2.5, defense: 1.5 },
  [PlayerClass.MAGE]: { hp: 6, mp: 8, attack: 2.0, defense: 0.8 },
  [PlayerClass.ARCHER]: { hp: 9, mp: 5, attack: 2.2, defense: 1.0 },
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
}

export class Player {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: Direction;

  playerClass: PlayerClass;
  level: number;
  baseHp: number;
  baseMp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;

  stats: PlayerStats;
  karma: number;
  killStreak: number;
  totalKills: number;
  gradeLevel: number;

  inventory: InventorySlot[];
  equipment: EquipmentSlots;

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

  isDead: boolean;
  respawnTimer: number | null;

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
    let base = BASE_STATS[playerClass];
    this.baseHp = base.hp;
    this.baseMp = base.mp;
    this.baseAttack = base.attack;
    this.baseDefense = base.defense;
    this.baseSpeed = base.speed;

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

    this.target = null;
    this.attackCooldown = 0;
    this.skillCooldowns = new Map();
    this.lastRegenTime = Date.now();
    this.lastCombatTime = 0;

    this.quizPending = false;
    this.quizAnswer = null;
    this.usedWords = new Set();

    this.buffs = new Map();
    this.isDead = false;
    this.respawnTimer = null;

    this.stats = this.calculateStats();
    this.stats.hp = this.stats.maxHp;
    this.stats.mp = this.stats.maxMp;
    this.stats.exp = 0;
    this.stats.expToLevel = expForLevel(this.level);
    this.stats.gold = 100;
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

    // Recalculate base stats for level
    let growth = LEVEL_GROWTH[data.playerClass];
    let base = BASE_STATS[data.playerClass];
    let levelsGained = data.level - 1;
    player.baseHp = base.hp + Math.floor(growth.hp * levelsGained);
    player.baseMp = base.mp + Math.floor(growth.mp * levelsGained);
    player.baseAttack = base.attack + Math.floor(growth.attack * levelsGained);
    player.baseDefense =
      base.defense + Math.floor(growth.defense * levelsGained);

    player.stats = player.calculateStats();
    player.stats.hp = player.stats.maxHp;
    player.stats.mp = player.stats.maxMp;
    player.stats.exp = data.exp;
    player.stats.expToLevel = expForLevel(data.level);
    player.stats.gold = data.gold;

    return player;
  }

  giveStarterItems(): void {
    // Starter weapon by class
    switch (this.playerClass) {
      case PlayerClass.WARRIOR:
        this.addItem("wooden_sword", 1);
        break;
      case PlayerClass.MAGE:
        this.addItem("oak_staff", 1);
        break;
      case PlayerClass.ARCHER:
        this.addItem("hunting_bow", 1);
        break;
    }
    this.addItem("leather_armor", 1);
    this.addItem("health_potion", 3);
    this.addItem("pickaxe", 1);
    this.addItem("axe", 1);
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

    // Apply buff bonuses
    for (let [, buff] of this.buffs) {
      if (Date.now() < buff.endsAt) {
        if (buff.effect.attackPercent) {
          attack = Math.floor(attack * (1 + buff.effect.attackPercent));
        }
        if (buff.effect.speedPercent) {
          speed = Math.floor(speed * (1 + buff.effect.speedPercent));
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

  move(newX: number, newY: number): boolean {
    // Determine direction
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

    // Schedule respawn after 5s
    this.respawnTimer = Date.now() + 5000;
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

    // Recalculate stats
    this.stats = this.calculateStats();
    this.stats.hp = this.stats.maxHp;
    this.stats.mp = this.stats.maxMp;
    this.stats.level = this.level;
    this.stats.expToLevel = expForLevel(this.level);

    // Auto-update grade level based on player level
    if (this.level <= 5) this.gradeLevel = 1;
    else if (this.level <= 12) this.gradeLevel = 2;
    else if (this.level <= 20) this.gradeLevel = 3;
    else this.gradeLevel = 4;

    this.connection.send(PacketType.LEVEL_UP, {
      level: this.level,
      stats: this.stats,
    });
  }

  regen(): void {
    if (this.isDead) return;
    let now = Date.now();
    if (now - this.lastRegenTime < REGEN_INTERVAL) return;
    // No regen during combat (within 5s)
    if (now - this.lastCombatTime < 5000) return;

    this.lastRegenTime = now;
    let hpRegen = Math.floor(this.stats.maxHp * HP_REGEN_RATE);
    let mpRegen = Math.floor(this.stats.maxMp * MP_REGEN_RATE);

    let hpChanged = false;
    let mpChanged = false;

    if (this.stats.hp < this.stats.maxHp) {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + hpRegen);
      hpChanged = true;
    }
    if (this.stats.mp < this.stats.maxMp) {
      this.stats.mp = Math.min(this.stats.maxMp, this.stats.mp + mpRegen);
      mpChanged = true;
    }

    if (hpChanged || mpChanged) {
      this.connection.send(PacketType.STATS_UPDATE, { stats: this.stats });
    }
  }

  addItem(itemId: string, count: number): boolean {
    let item = ITEMS[itemId];
    if (!item) return false;

    if (item.stackable) {
      // Find existing stack
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

    this.inventory.push({ itemId, count });
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

    // Check class requirement
    if (item.classReq && item.classReq !== this.playerClass) {
      this.connection.send(PacketType.NOTIFICATION, {
        message: "Your class cannot use this item.",
        messageKo: "이 직업으로는 사용할 수 없는 아이템입니다.",
      });
      return false;
    }

    // Check level requirement
    if (item.level > this.level) {
      this.connection.send(PacketType.NOTIFICATION, {
        message: `Requires level ${item.level}.`,
        messageKo: `레벨 ${item.level}이 필요합니다.`,
      });
      return false;
    }

    // Unequip current item in that slot first
    let currentEquip = this.equipment[item.equipSlot];
    if (currentEquip) {
      if (this.inventory.length >= MAX_INVENTORY_SLOTS) {
        this.connection.send(PacketType.NOTIFICATION, {
          message: "Inventory is full!",
          messageKo: "인벤토리가 가득 찼습니다!",
        });
        return false;
      }
      this.inventory.push({ itemId: currentEquip, count: 1 });
    }

    // Equip new item
    this.equipment[item.equipSlot] = slot.itemId;
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

    this.equipment[slot] = null;
    this.inventory.push({ itemId, count: 1 });

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

  useItem(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.inventory.length) return false;

    let slot = this.inventory[slotIndex];
    let item = ITEMS[slot.itemId];
    if (!item) return false;

    if (item.type !== ItemType.CONSUMABLE) {
      this.connection.send(PacketType.NOTIFICATION, {
        message: "This item cannot be used.",
        messageKo: "이 아이템은 사용할 수 없습니다.",
      });
      return false;
    }

    let used = false;

    if (item.healAmount && this.stats.hp < this.stats.maxHp) {
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
      // Recalculate stats when buffs expire
      let currentHp = this.stats.hp;
      let currentMp = this.stats.mp;
      let currentExp = this.stats.exp;
      let currentGold = this.stats.gold;
      this.stats = this.calculateStats();
      this.stats.hp = Math.min(currentHp, this.stats.maxHp);
      this.stats.mp = Math.min(currentMp, this.stats.maxMp);
      this.stats.exp = currentExp;
      this.stats.gold = currentGold;
      this.connection.send(PacketType.STATS_UPDATE, { stats: this.stats });
    }
  }

  update(): void {
    if (this.isDead) {
      if (this.respawnTimer && Date.now() >= this.respawnTimer) {
        this.respawn(100, 100);
      }
      return;
    }

    this.regen();
    this.updateBuffs();

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
    };
  }
}
