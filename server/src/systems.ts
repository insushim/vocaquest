// ============================================
// VocaQuest Online - Game Systems
// (Combat, Quiz, Shop, Karma)
// 100% Original Code - MIT License
// ============================================

import type {
  QuizQuestion,
  VocabData,
  VocabWord,
  SkillDefinition,
  LootDrop,
  StatusEffect,
  QuestDefinition,
  QuestProgress,
  AchievementDefinition,
  CraftingRecipe,
  PartyData,
  PartyMember,
  TradeOffer,
} from "../../shared/types";
import {
  PacketType,
  EntityType,
  SkillId,
  PlayerClass,
  StatusEffectType,
  QuestType,
  QuestStatus,
  AchievementCategory,
  KARMA_LOSS_PER_KILL,
  KARMA_GAIN_PER_MOB,
  QUIZ_OPTIONS_COUNT,
  getKarmaTitle,
} from "../../shared/types";
import { v4 as uuid } from "uuid";
import { ITEMS } from "./data/items";
import { SHOPS } from "./data/shops";
import { SKILLS } from "./data/skills";
import { QUESTS } from "./data/quests";
import { RECIPES, getAllRecipes } from "./data/recipes";
import { ACHIEVEMENTS, getAllAchievements } from "./data/achievements";
import type { Player } from "./player";
import type { Mob } from "./mob";
import type { World } from "./world";

// Load vocabulary data
import vocabJson from "./data/vocabulary.json";
let vocabData = vocabJson as VocabData;

// ---- Combat System ----

export let CombatSystem = {
  calculateDamage(
    attackerAtk: number,
    defenderDef: number,
    critRate: number = 0,
    critDamage: number = 1.5,
  ): { damage: number; isCrit: boolean } {
    let base = attackerAtk - Math.floor(defenderDef / 2);
    let variance = Math.floor(Math.random() * 7) - 3; // -3 to +3
    let damage = Math.max(1, base + variance);

    // Critical hit check
    let isCrit = Math.random() * 100 < critRate;
    if (isCrit) {
      damage = Math.floor(damage * critDamage);
    }

    return { damage, isCrit };
  },

  calculateMagicDamage(
    magicAtk: number,
    magicDef: number,
    skillMultiplier: number,
    critRate: number = 0,
    critDamage: number = 1.5,
  ): { damage: number; isCrit: boolean } {
    let base = magicAtk * skillMultiplier - Math.floor(magicDef / 3);
    let variance = Math.floor(Math.random() * 5) - 2;
    let damage = Math.max(1, Math.floor(base) + variance);

    let isCrit = Math.random() * 100 < critRate;
    if (isCrit) {
      damage = Math.floor(damage * critDamage);
    }

    return { damage, isCrit };
  },

  calculateSkillDamage(
    player: Player,
    skill: SkillDefinition,
    targetDef: number,
    targetMagicDef: number = 0,
  ): { damage: number; isCrit: boolean } {
    let isMagicSkill =
      player.playerClass === PlayerClass.MAGE ||
      skill.id === SkillId.HOLY_STRIKE ||
      skill.id === SkillId.JUDGMENT ||
      skill.id === SkillId.HOLY_BLESSING;

    if (isMagicSkill && player.stats.magicAttack > player.stats.attack) {
      return this.calculateMagicDamage(
        player.stats.magicAttack,
        targetMagicDef,
        skill.damage,
        player.stats.critRate,
        player.stats.critDamage,
      );
    }

    let baseDamage = player.stats.attack - Math.floor(targetDef / 2);
    let skillDamage = Math.floor(baseDamage * skill.damage);
    let variance = Math.floor(Math.random() * 5) - 2;
    let damage = Math.max(1, skillDamage + variance);

    let isCrit = Math.random() * 100 < player.stats.critRate;
    if (isCrit) {
      damage = Math.floor(damage * player.stats.critDamage);
    }

    return { damage, isCrit };
  },

  applyStatusEffect(
    skill: SkillDefinition,
    targetId: string,
    attackerId: string,
    world: World,
  ): void {
    if (!skill.statusEffect || !skill.statusDuration) return;

    // For mob targets
    let mob = world.mobs.get(targetId);
    if (mob && !mob.isDead) {
      // Mobs can be stunned/slowed (simplified - just broadcast the effect)
      if (
        skill.statusEffect === StatusEffectType.STUN ||
        skill.statusEffect === StatusEffectType.SLOW
      ) {
        mob.applyStatusEffect(
          skill.statusEffect,
          skill.statusDuration,
          skill.statusValue || 0,
        );
      }
    }

    // For player targets (PvP)
    let targetPlayer = world.players.get(targetId);
    if (targetPlayer && !targetPlayer.isDead) {
      targetPlayer.applyStatusEffect(
        skill.statusEffect,
        skill.statusDuration,
        skill.statusValue || 0,
        attackerId,
      );
    }

    // Broadcast status effect
    world.broadcast(PacketType.STATUS_EFFECT, {
      targetId,
      effectType: skill.statusEffect,
      duration: skill.statusDuration,
      value: skill.statusValue || 0,
    });
  },

  processAttack(attacker: Player, targetId: string, world: World): void {
    // Check if player is stunned
    if (attacker.isStunned()) {
      attacker.connection.send(PacketType.NOTIFICATION, {
        message: "You are stunned!",
        messageKo: "기절 상태입니다!",
      });
      return;
    }

    // Find target - could be mob or player
    let mob = world.mobs.get(targetId);
    if (mob && !mob.isDead) {
      // Check range based on class
      let maxRange = 2;
      if (attacker.playerClass === PlayerClass.ARCHER) maxRange = 6;
      if (attacker.playerClass === PlayerClass.MAGE) maxRange = 5;

      let dist = Math.abs(attacker.x - mob.x) + Math.abs(attacker.y - mob.y);
      if (dist > maxRange) return;

      if (attacker.attackCooldown > 0) return;

      // Attack speed affects cooldown
      let attackInterval = Math.max(
        400,
        Math.floor(1000 / attacker.stats.attackSpeed),
      );
      attacker.attackCooldown = attackInterval;
      attacker.lastCombatTime = Date.now();

      let { damage, isCrit } = this.calculateDamage(
        attacker.stats.attack,
        mob.definition.defense,
        attacker.stats.critRate,
        attacker.stats.critDamage,
      );
      let actualDamage = mob.takeDamage(damage, attacker);

      world.broadcastCombatHit(
        attacker.id,
        EntityType.PLAYER,
        mob.id,
        EntityType.MOB,
        actualDamage,
        isCrit,
        mob.hp,
        mob.definition.hp,
      );

      // Achievement: critical hits
      if (isCrit) {
        AchievementSystem.checkAchievement(attacker, "critical_hit", 1);
      }

      if (mob.hp <= 0) {
        mob.die(attacker, world);
        KarmaSystem.onMobKill(attacker);
        // Achievement: mob kills, boss kills, level, gold
        AchievementSystem.checkAchievement(attacker, "kill_total", 1);
        if (mob.definition.isBoss) {
          AchievementSystem.checkAchievement(attacker, "boss_kill", 1);
        }
        AchievementSystem.checkAchievement(
          attacker,
          "level_reach",
          attacker.level,
        );
        AchievementSystem.checkGold(attacker);
      }
      return;
    }

    // PvP attack
    let targetPlayer = world.players.get(targetId);
    if (
      targetPlayer &&
      !targetPlayer.isDead &&
      targetPlayer.id !== attacker.id
    ) {
      let dist =
        Math.abs(attacker.x - targetPlayer.x) +
        Math.abs(attacker.y - targetPlayer.y);
      if (dist > 2) return;

      if (attacker.attackCooldown > 0) return;
      let attackInterval = Math.max(
        400,
        Math.floor(1000 / attacker.stats.attackSpeed),
      );
      attacker.attackCooldown = attackInterval;
      attacker.lastCombatTime = Date.now();

      let { damage, isCrit } = this.calculateDamage(
        attacker.stats.attack,
        targetPlayer.stats.defense,
        attacker.stats.critRate,
        attacker.stats.critDamage,
      );
      let actualDamage = targetPlayer.takeDamage(damage, attacker.id);

      world.broadcastCombatHit(
        attacker.id,
        EntityType.PLAYER,
        targetPlayer.id,
        EntityType.PLAYER,
        actualDamage,
        isCrit,
        targetPlayer.stats.hp,
        targetPlayer.stats.maxHp,
      );

      if (targetPlayer.isDead) {
        KarmaSystem.onPlayerKill(attacker, targetPlayer, world);
        // Achievement: PvP kills
        AchievementSystem.checkAchievement(attacker, "pvp_kill", 1);
        AchievementSystem.checkAchievement(
          attacker,
          "pvp_streak",
          attacker.killStreak,
        );
        // Achievement: death for victim
        AchievementSystem.checkAchievement(targetPlayer, "death_count", 1);
      }
    }
  },

  processSkill(
    player: Player,
    skillId: SkillId,
    targetId: string | null,
    world: World,
  ): void {
    // Check stun
    if (player.isStunned()) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "You are stunned!",
        messageKo: "기절 상태입니다!",
      });
      return;
    }

    let check = player.canUseSkill(skillId);
    if (!check.ok) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: check.reason,
        messageKo: check.reason,
      });
      return;
    }

    let skill = SKILLS[skillId] as SkillDefinition;
    player.consumeMpForSkill(skillId);

    // Achievement: skill use
    AchievementSystem.checkAchievement(player, "skill_use", 1);

    // --- Self-buff skills ---
    if (skill.damage === 0 && skill.buffDuration && !skill.healAmount) {
      let effect: Record<string, number> = {};

      switch (skillId) {
        case SkillId.WAR_CRY:
          effect.attackPercent = 0.3;
          break;
        case SkillId.BERSERK:
          effect.attackPercent = 0.5;
          effect.speedPercent = 0.3;
          effect.defensePercent = -0.2;
          break;
        case SkillId.EVASION:
          effect.evasion = 1;
          break;
        case SkillId.DIVINE_SHIELD:
          effect.charges = skill.statusValue || 5;
          break;
        case SkillId.MAGIC_BARRIER:
          effect.absorb = skill.statusValue || 200;
          break;
        case SkillId.GUARDIAN_AURA:
          effect.defensePercent = 0.4;
          effect.regenBoost = 1;
          break;
        case SkillId.EAGLE_EYE:
          effect.critRateBonus = 30;
          effect.rangeBonus = 3;
          break;
      }

      let buffKey =
        skillId === SkillId.DIVINE_SHIELD
          ? "divine_shield"
          : skillId === SkillId.MAGIC_BARRIER
            ? "magic_barrier"
            : skillId;

      player.buffs.set(buffKey, {
        endsAt: Date.now() + skill.buffDuration,
        effect,
      });

      // Recalculate stats with buff
      let currentHp = player.stats.hp;
      let currentMp = player.stats.mp;
      let currentExp = player.stats.exp;
      let currentGold = player.stats.gold;
      let sp = player.stats.statPoints;
      player.stats = player.calculateStats();
      player.stats.hp = currentHp;
      player.stats.mp = currentMp;
      player.stats.exp = currentExp;
      player.stats.gold = currentGold;
      player.stats.statPoints = sp;

      player.connection.send(PacketType.STATS_UPDATE, {
        stats: player.stats,
      });
      world.broadcast(PacketType.SKILL_EFFECT, {
        playerId: player.id,
        skillId,
        targetId: player.id,
        damage: 0,
      });
      return;
    }

    // --- Heal + buff combo (Holy Blessing) ---
    if (skill.healAmount && skill.healAmount > 0) {
      let healAmount = Math.floor(player.stats.maxHp * skill.healAmount);
      player.stats.hp = Math.min(
        player.stats.maxHp,
        player.stats.hp + healAmount,
      );

      // Apply defense buff if Holy Blessing
      if (skillId === SkillId.HOLY_BLESSING && skill.buffDuration) {
        player.buffs.set(skillId, {
          endsAt: Date.now() + skill.buffDuration,
          effect: { defensePercent: 0.2 },
        });
        let currentHp = player.stats.hp;
        let currentMp = player.stats.mp;
        let currentExp = player.stats.exp;
        let currentGold = player.stats.gold;
        let sp = player.stats.statPoints;
        player.stats = player.calculateStats();
        player.stats.hp = currentHp;
        player.stats.mp = currentMp;
        player.stats.exp = currentExp;
        player.stats.gold = currentGold;
        player.stats.statPoints = sp;
      }

      player.connection.send(PacketType.STATS_UPDATE, {
        stats: player.stats,
      });
      world.broadcast(PacketType.SKILL_EFFECT, {
        playerId: player.id,
        skillId,
        targetId: player.id,
        damage: -healAmount,
      });
      return;
    }

    // --- Teleport skill ---
    if (skillId === SkillId.TELEPORT_SPELL) {
      player.x = 100;
      player.y = 100;
      player.connection.send(PacketType.TELEPORT, { x: player.x, y: player.y });
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Teleported to town.",
        messageKo: "마을로 텔레포트했습니다.",
      });
      world.broadcast(PacketType.SKILL_EFFECT, {
        playerId: player.id,
        skillId,
        targetId: player.id,
        damage: 0,
      });
      return;
    }

    // --- Damage skills ---
    if (!targetId) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "No target selected.",
        messageKo: "대상을 선택해주세요.",
      });
      return;
    }

    // Check AoE
    if (skill.aoe && skill.aoeRadius) {
      let targetEntity =
        world.mobs.get(targetId) || world.players.get(targetId);
      if (!targetEntity) return;

      let dist =
        Math.abs(player.x - targetEntity.x) +
        Math.abs(player.y - targetEntity.y);
      if (dist > skill.range) {
        player.connection.send(PacketType.NOTIFICATION, {
          message: "Target out of range.",
          messageKo: "대상이 사거리 밖입니다.",
        });
        return;
      }

      // Hit all mobs in AoE radius
      for (let [, mob] of world.mobs) {
        if (mob.isDead) continue;
        let mobDist =
          Math.abs(targetEntity.x - mob.x) + Math.abs(targetEntity.y - mob.y);
        if (mobDist <= skill.aoeRadius) {
          let { damage, isCrit } = this.calculateSkillDamage(
            player,
            skill,
            mob.definition.defense,
            mob.definition.magicDefense || 0,
          );
          let actualDamage = mob.takeDamage(damage, player);
          world.broadcastCombatHit(
            player.id,
            EntityType.PLAYER,
            mob.id,
            EntityType.MOB,
            actualDamage,
            isCrit,
            mob.hp,
            mob.definition.hp,
          );

          // Apply status effect
          if (skill.statusEffect) {
            this.applyStatusEffect(skill, mob.id, player.id, world);
          }

          if (mob.hp <= 0) {
            mob.die(player, world);
            KarmaSystem.onMobKill(player);
            AchievementSystem.checkAchievement(player, "kill_total", 1);
            if (mob.definition.isBoss) {
              AchievementSystem.checkAchievement(player, "boss_kill", 1);
            }
            AchievementSystem.checkGold(player);
          }
        }
      }

      // Also hit players in AoE (PvP)
      for (let [, target] of world.players) {
        if (target.isDead || target.id === player.id) continue;
        let pDist =
          Math.abs(targetEntity.x - target.x) +
          Math.abs(targetEntity.y - target.y);
        if (pDist <= skill.aoeRadius) {
          let { damage, isCrit } = this.calculateSkillDamage(
            player,
            skill,
            target.stats.defense,
            target.stats.magicDefense,
          );
          let actualDamage = target.takeDamage(damage, player.id);
          world.broadcastCombatHit(
            player.id,
            EntityType.PLAYER,
            target.id,
            EntityType.PLAYER,
            actualDamage,
            isCrit,
            target.stats.hp,
            target.stats.maxHp,
          );

          if (skill.statusEffect) {
            this.applyStatusEffect(skill, target.id, player.id, world);
          }

          if (target.isDead) {
            KarmaSystem.onPlayerKill(player, target, world);
          }
        }
      }

      world.broadcast(PacketType.SKILL_EFFECT, {
        playerId: player.id,
        skillId,
        targetId,
        damage: 0,
      });
    } else {
      // Single target skill
      let mob = world.mobs.get(targetId);
      if (mob && !mob.isDead) {
        let dist = Math.abs(player.x - mob.x) + Math.abs(player.y - mob.y);
        if (dist > skill.range) {
          player.connection.send(PacketType.NOTIFICATION, {
            message: "Target out of range.",
            messageKo: "대상이 사거리 밖입니다.",
          });
          return;
        }

        let { damage, isCrit } = this.calculateSkillDamage(
          player,
          skill,
          mob.definition.defense,
          mob.definition.magicDefense || 0,
        );
        let actualDamage = mob.takeDamage(damage, player);
        world.broadcastCombatHit(
          player.id,
          EntityType.PLAYER,
          mob.id,
          EntityType.MOB,
          actualDamage,
          isCrit,
          mob.hp,
          mob.definition.hp,
        );

        if (skill.statusEffect) {
          this.applyStatusEffect(skill, mob.id, player.id, world);
        }

        if (mob.hp <= 0) {
          mob.die(player, world);
          KarmaSystem.onMobKill(player);
          AchievementSystem.checkAchievement(player, "kill_total", 1);
          if (mob.definition.isBoss) {
            AchievementSystem.checkAchievement(player, "boss_kill", 1);
          }
          AchievementSystem.checkGold(player);
        }

        world.broadcast(PacketType.SKILL_EFFECT, {
          playerId: player.id,
          skillId,
          targetId: mob.id,
          damage: actualDamage,
        });
      } else {
        // PvP skill
        let targetPlayer = world.players.get(targetId);
        if (
          targetPlayer &&
          !targetPlayer.isDead &&
          targetPlayer.id !== player.id
        ) {
          let dist =
            Math.abs(player.x - targetPlayer.x) +
            Math.abs(player.y - targetPlayer.y);
          if (dist > skill.range) return;

          let { damage, isCrit } = this.calculateSkillDamage(
            player,
            skill,
            targetPlayer.stats.defense,
            targetPlayer.stats.magicDefense,
          );
          let actualDamage = targetPlayer.takeDamage(damage, player.id);
          world.broadcastCombatHit(
            player.id,
            EntityType.PLAYER,
            targetPlayer.id,
            EntityType.PLAYER,
            actualDamage,
            isCrit,
            targetPlayer.stats.hp,
            targetPlayer.stats.maxHp,
          );

          if (skill.statusEffect) {
            this.applyStatusEffect(skill, targetPlayer.id, player.id, world);
          }

          if (targetPlayer.isDead) {
            KarmaSystem.onPlayerKill(player, targetPlayer, world);
          }

          world.broadcast(PacketType.SKILL_EFFECT, {
            playerId: player.id,
            skillId,
            targetId: targetPlayer.id,
            damage: actualDamage,
          });
        }
      }
    }

    player.connection.send(PacketType.STATS_UPDATE, { stats: player.stats });
  },
};

// ---- Quiz System ----

export let QuizSystem = {
  generateQuiz(player: Player): QuizQuestion | null {
    let gradeKey = String(player.gradeLevel);
    let level = vocabData.levels[gradeKey];
    if (!level || level.words.length === 0) {
      level = vocabData.levels["1"];
      if (!level) return null;
    }

    let available = level.words.filter((w) => !player.usedWords.has(w.id));

    if (available.length === 0) {
      player.usedWords.clear();
      available = level.words;
    }

    let word = available[Math.floor(Math.random() * available.length)];
    player.usedWords.add(word.id);

    let wrongOptions: string[] = [];
    let allWords = level.words.filter((w) => w.id !== word.id);

    let shuffled = [...allWords].sort(() => Math.random() - 0.5);
    for (let w of shuffled) {
      if (wrongOptions.length >= QUIZ_OPTIONS_COUNT - 1) break;
      if (w.korean !== word.korean) {
        wrongOptions.push(w.korean);
      }
    }

    if (wrongOptions.length < QUIZ_OPTIONS_COUNT - 1) {
      for (let [key, lvl] of Object.entries(vocabData.levels)) {
        if (key === gradeKey) continue;
        for (let w of lvl.words) {
          if (wrongOptions.length >= QUIZ_OPTIONS_COUNT - 1) break;
          if (w.korean !== word.korean && !wrongOptions.includes(w.korean)) {
            wrongOptions.push(w.korean);
          }
        }
      }
    }

    let options = [word.korean, ...wrongOptions];
    options = options.sort(() => Math.random() - 0.5);

    return {
      word: word.english,
      correct: word.korean,
      options,
      category: word.category,
    };
  },

  checkAnswer(
    player: Player,
    answerId: number,
  ): { correct: boolean; drops: Array<{ itemId: string; count: number }> } {
    if (!player.quizPending || !player.quizAnswer) {
      return { correct: false, drops: [] };
    }

    let isCorrect = answerId >= 0;

    let quizData = player.quizAnswer;
    player.quizPending = false;
    player.quizAnswer = null;

    if (isCorrect) {
      let drops: Array<{ itemId: string; count: number }> = [];
      for (let drop of quizData.drops) {
        let count =
          drop.minCount +
          Math.floor(Math.random() * (drop.maxCount - drop.minCount + 1));
        if (player.addItem(drop.itemId, count)) {
          drops.push({ itemId: drop.itemId, count });
        }
      }

      player.karma += 2;

      return { correct: true, drops };
    }

    return { correct: false, drops: [] };
  },
};

// ---- Shop System ----

export let ShopSystem = {
  buyItem(player: Player, shopId: string, itemId: string): boolean {
    let shop = SHOPS[shopId];
    if (!shop) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Shop not found.",
        messageKo: "상점을 찾을 수 없습니다.",
      });
      return false;
    }

    if (!shop.items.includes(itemId)) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "This shop does not sell that item.",
        messageKo: "이 상점에서는 해당 아이템을 판매하지 않습니다.",
      });
      return false;
    }

    let item = ITEMS[itemId];
    if (!item) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Item not found.",
        messageKo: "아이템을 찾을 수 없습니다.",
      });
      return false;
    }

    if (player.stats.gold < item.price) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Not enough gold.",
        messageKo: "골드가 부족합니다.",
      });
      return false;
    }

    if (!player.addItem(itemId, 1)) {
      return false;
    }

    player.stats.gold -= item.price;
    player.connection.send(PacketType.STATS_UPDATE, { stats: player.stats });
    player.connection.send(PacketType.NOTIFICATION, {
      message: `Purchased ${item.name}.`,
      messageKo: `${item.nameKo}을(를) 구매했습니다.`,
    });
    return true;
  },

  sellItem(player: Player, slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= player.inventory.length) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Invalid inventory slot.",
        messageKo: "잘못된 인벤토리 슬롯입니다.",
      });
      return false;
    }

    let slot = player.inventory[slotIndex];
    let item = ITEMS[slot.itemId];
    if (!item) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Item not found.",
        messageKo: "아이템을 찾을 수 없습니다.",
      });
      return false;
    }

    let sellGold = item.sellPrice * slot.count;
    // Enhancement bonus to sell price
    if (slot.enhancement && slot.enhancement > 0) {
      sellGold = Math.floor(sellGold * (1 + slot.enhancement * 0.15));
    }

    player.stats.gold += sellGold;
    player.removeItem(slotIndex, slot.count);

    player.connection.send(PacketType.STATS_UPDATE, { stats: player.stats });
    player.connection.send(PacketType.NOTIFICATION, {
      message: `Sold ${item.name} for ${sellGold}G.`,
      messageKo: `${item.nameKo}을(를) ${sellGold}G에 판매했습니다.`,
    });
    return true;
  },
};

// ---- Karma System ----

export let KarmaSystem = {
  onPlayerKill(killer: Player, victim: Player, world: World): void {
    killer.karma -= KARMA_LOSS_PER_KILL;
    killer.killStreak++;
    killer.totalKills++;

    let killerTitle = getKarmaTitle(killer.karma);

    killer.connection.send(PacketType.KARMA_UPDATE, {
      karma: killer.karma,
      title: killerTitle.ko,
      killStreak: killer.killStreak,
      totalKills: killer.totalKills,
    });

    world.broadcast(PacketType.PVP_KILL, {
      killerId: killer.id,
      killerName: killer.name,
      victimId: victim.id,
      victimName: victim.name,
      killStreak: killer.killStreak,
    });

    world.broadcast(PacketType.CHAT_MESSAGE, {
      sender: "System",
      message: `${killer.name} killed ${victim.name}! (Kill Streak: ${killer.killStreak})`,
      messageKo: `${killer.name}이(가) ${victim.name}을(를) 처치했습니다! (킬 스트릭: ${killer.killStreak})`,
      system: true,
    });
  },

  onMobKill(player: Player): void {
    player.karma += KARMA_GAIN_PER_MOB;
    player.killStreak = 0;

    let title = getKarmaTitle(player.karma);
    player.connection.send(PacketType.KARMA_UPDATE, {
      karma: player.karma,
      title: title.ko,
      killStreak: player.killStreak,
      totalKills: player.totalKills,
    });

    // Achievement: karma check
    AchievementSystem.checkKarma(player);
  },

  getTitle(karma: number): { en: string; ko: string } {
    return getKarmaTitle(karma);
  },
};

// ---- Quest System ----

export let QuestSystem = {
  getAvailableQuests(player: Player): QuestDefinition[] {
    let available: QuestDefinition[] = [];
    for (let quest of Object.values(QUESTS)) {
      // Skip if already active
      if (player.quests.find((q) => q.questId === quest.id)) continue;

      // Skip if already completed (unless repeatable)
      if (player.completedQuests.has(quest.id) && !quest.repeatable) continue;

      // Check level requirement
      if (player.level < quest.level) continue;

      // Check prerequisites
      if (quest.prerequisites) {
        let metAll = quest.prerequisites.every((preId) =>
          player.completedQuests.has(preId),
        );
        if (!metAll) continue;
      }

      available.push(quest);
    }
    return available;
  },

  acceptQuest(player: Player, questId: string): boolean {
    let quest = QUESTS[questId];
    if (!quest) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Quest not found.",
        messageKo: "퀘스트를 찾을 수 없습니다.",
      });
      return false;
    }

    // Check if already active
    if (player.quests.find((q) => q.questId === questId)) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Quest already in progress.",
        messageKo: "이미 진행 중인 퀘스트입니다.",
      });
      return false;
    }

    // Check if already completed and not repeatable
    if (player.completedQuests.has(questId) && !quest.repeatable) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Quest already completed.",
        messageKo: "이미 완료한 퀘스트입니다.",
      });
      return false;
    }

    // Check level
    if (player.level < quest.level) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: `Requires level ${quest.level}.`,
        messageKo: `레벨 ${quest.level}이 필요합니다.`,
      });
      return false;
    }

    // Check prerequisites
    if (quest.prerequisites) {
      for (let preId of quest.prerequisites) {
        if (!player.completedQuests.has(preId)) {
          player.connection.send(PacketType.NOTIFICATION, {
            message: "Prerequisites not met.",
            messageKo: "선행 퀘스트를 먼저 완료해야 합니다.",
          });
          return false;
        }
      }
    }

    // Max 10 active quests
    if (player.quests.length >= 10) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Too many active quests (max 10).",
        messageKo: "진행 중인 퀘스트가 너무 많습니다 (최대 10개).",
      });
      return false;
    }

    let progress: QuestProgress = {
      questId,
      status: QuestStatus.IN_PROGRESS,
      objectives: quest.objectives.map(() => ({ current: 0 })),
      startedAt: Date.now(),
    };

    player.quests.push(progress);

    player.connection.send(PacketType.NOTIFICATION, {
      message: `Quest accepted: ${quest.name}`,
      messageKo: `퀘스트 수락: ${quest.nameKo}`,
    });

    // Send updated quest list
    this.sendQuestUpdate(player);
    return true;
  },

  updateProgress(
    player: Player,
    type: QuestType,
    target: string,
    count: number = 1,
  ): void {
    let changed = false;

    for (let progress of player.quests) {
      if (progress.status !== QuestStatus.IN_PROGRESS) continue;

      let quest = QUESTS[progress.questId];
      if (!quest) continue;

      for (let i = 0; i < quest.objectives.length; i++) {
        let obj = quest.objectives[i];
        if (obj.type !== type) continue;

        // Match target: "any" matches all, or exact match
        if (obj.target !== "any" && obj.target !== target) continue;

        let prev = progress.objectives[i].current;
        if (prev >= obj.count) continue; // already done

        progress.objectives[i].current = Math.min(prev + count, obj.count);
        changed = true;
      }

      // Check if all objectives completed
      let allDone = quest.objectives.every(
        (obj, idx) => progress.objectives[idx].current >= obj.count,
      );
      if (allDone && progress.status === QuestStatus.IN_PROGRESS) {
        progress.status = QuestStatus.COMPLETED;
        player.connection.send(PacketType.NOTIFICATION, {
          message: `Quest completed: ${quest.name}! Return to the NPC.`,
          messageKo: `퀘스트 완료: ${quest.nameKo}! NPC에게 돌아가세요.`,
        });
        changed = true;
      }
    }

    if (changed) {
      this.sendQuestUpdate(player);
    }
  },

  completeQuest(player: Player, questId: string): boolean {
    let progressIdx = player.quests.findIndex((q) => q.questId === questId);
    if (progressIdx === -1) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Quest not active.",
        messageKo: "진행 중인 퀘스트가 아닙니다.",
      });
      return false;
    }

    let progress = player.quests[progressIdx];
    if (progress.status !== QuestStatus.COMPLETED) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Quest objectives not yet completed.",
        messageKo: "퀘스트 목표가 아직 완료되지 않았습니다.",
      });
      return false;
    }

    let quest = QUESTS[questId];
    if (!quest) return false;

    // Give rewards
    if (quest.rewards.exp) {
      player.addExp(quest.rewards.exp);
    }
    if (quest.rewards.gold) {
      player.stats.gold += quest.rewards.gold;
    }
    if (quest.rewards.statPoints) {
      player.stats.statPoints += quest.rewards.statPoints;
    }
    if (quest.rewards.items) {
      for (let item of quest.rewards.items) {
        player.addItem(item.itemId, item.count);
      }
    }

    // Remove from active, add to completed
    player.quests.splice(progressIdx, 1);
    player.completedQuests.add(questId);

    player.connection.send(PacketType.STATS_UPDATE, { stats: player.stats });
    player.connection.send(PacketType.QUEST_COMPLETE, {
      questId,
      rewards: quest.rewards,
    });

    let rewardMsg: string[] = [];
    if (quest.rewards.exp) rewardMsg.push(`${quest.rewards.exp} EXP`);
    if (quest.rewards.gold) rewardMsg.push(`${quest.rewards.gold} Gold`);
    if (quest.rewards.statPoints)
      rewardMsg.push(`${quest.rewards.statPoints} Stat Points`);

    player.connection.send(PacketType.NOTIFICATION, {
      message: `Quest turned in: ${quest.name}! Rewards: ${rewardMsg.join(", ")}`,
      messageKo: `퀘스트 보상: ${quest.nameKo}! 보상: ${rewardMsg.join(", ")}`,
    });

    // Auto-accept chain next if available
    if (quest.chainNext && QUESTS[quest.chainNext]) {
      let nextQuest = QUESTS[quest.chainNext];
      if (player.level >= nextQuest.level) {
        this.acceptQuest(player, quest.chainNext);
      }
    }

    this.sendQuestUpdate(player);
    return true;
  },

  abandonQuest(player: Player, questId: string): void {
    let idx = player.quests.findIndex((q) => q.questId === questId);
    if (idx === -1) return;

    let quest = QUESTS[questId];
    player.quests.splice(idx, 1);

    player.connection.send(PacketType.NOTIFICATION, {
      message: `Quest abandoned: ${quest?.name || questId}`,
      messageKo: `퀘스트 포기: ${quest?.nameKo || questId}`,
    });

    this.sendQuestUpdate(player);
  },

  sendQuestUpdate(player: Player): void {
    let activeQuests = player.quests.map((progress) => {
      let quest = QUESTS[progress.questId];
      return {
        ...progress,
        quest: quest
          ? {
              id: quest.id,
              name: quest.name,
              nameKo: quest.nameKo,
              description: quest.description,
              descriptionKo: quest.descriptionKo,
              level: quest.level,
              npcId: quest.npcId,
              objectives: quest.objectives,
              rewards: quest.rewards,
            }
          : null,
      };
    });

    player.connection.send(PacketType.QUEST_UPDATE, {
      quests: activeQuests,
    });
  },

  sendAvailableQuests(player: Player, npcId?: string): void {
    let available = this.getAvailableQuests(player);
    if (npcId) {
      available = available.filter((q) => q.npcId === npcId);
    }
    player.connection.send(PacketType.QUEST_AVAILABLE, {
      quests: available,
    });
  },

  getQuestDef(questId: string): QuestDefinition | undefined {
    return QUESTS[questId];
  },
};

// ---- Achievement System ----

export let AchievementSystem = {
  // Increment progress and check if any achievement should unlock
  checkAchievement(
    player: Player,
    type: string,
    value: number = 1,
    target?: string,
  ): void {
    for (let achievement of getAllAchievements()) {
      if (player.achievements.has(achievement.id)) continue;
      if (achievement.requirement.type !== type) continue;

      // If achievement requires a specific target, check it
      if (
        achievement.requirement.target &&
        achievement.requirement.target !== target
      )
        continue;

      // Get current progress
      let progressKey = target ? `${type}:${target}` : type;
      let currentProgress = player.achievementProgress[progressKey] || 0;

      // For "reach" type achievements, use the value directly
      let isReachType =
        type === "level_reach" ||
        type === "karma_reach" ||
        type === "karma_negative" ||
        type === "combo_reach" ||
        type === "pvp_streak" ||
        type === "enhance_level" ||
        type === "gold_accumulate" ||
        type === "full_equip" ||
        type === "play_time";

      if (isReachType) {
        currentProgress = Math.max(currentProgress, value);
      } else {
        currentProgress += value;
      }
      player.achievementProgress[progressKey] = currentProgress;

      // Check if requirement is met
      if (currentProgress >= achievement.requirement.count) {
        this.unlockAchievement(player, achievement);
      }
    }
  },

  // Unlock an achievement and send rewards
  unlockAchievement(player: Player, achievement: AchievementDefinition): void {
    if (player.achievements.has(achievement.id)) return;

    player.achievements.add(achievement.id);

    // Apply rewards
    if (achievement.reward) {
      if (achievement.reward.exp) {
        player.addExp(achievement.reward.exp);
      }
      if (achievement.reward.gold) {
        player.stats.gold += achievement.reward.gold;
        player.connection.send(PacketType.STATS_UPDATE, {
          stats: player.stats,
        });
      }
    }

    // Send unlock notification to player
    player.connection.send(PacketType.ACHIEVEMENT_UNLOCK, {
      id: achievement.id,
      name: achievement.name,
      nameKo: achievement.nameKo,
      description: achievement.description,
      descriptionKo: achievement.descriptionKo,
      icon: achievement.icon,
      category: achievement.category,
      reward: achievement.reward,
    });

    console.log(
      `[Achievement] ${player.name} unlocked: ${achievement.nameKo} (${achievement.id})`,
    );
  },

  // Get player's achievement status for the UI
  getPlayerAchievements(player: Player): {
    achievements: Array<{
      id: string;
      name: string;
      nameKo: string;
      description: string;
      descriptionKo: string;
      category: string;
      icon: string;
      requirement: { type: string; target?: string; count: number };
      reward?: {
        exp?: number;
        gold?: number;
        title?: string;
        titleKo?: string;
      };
      hidden?: boolean;
      unlocked: boolean;
      progress: number;
    }>;
  } {
    let all = getAllAchievements();
    let result = all.map((a) => {
      let unlocked = player.achievements.has(a.id);
      let progressKey = a.requirement.target
        ? `${a.requirement.type}:${a.requirement.target}`
        : a.requirement.type;
      let progress = player.achievementProgress[progressKey] || 0;

      return {
        id: a.id,
        name: a.name,
        nameKo: a.nameKo,
        description: a.description,
        descriptionKo: a.descriptionKo,
        category: a.category,
        icon: a.icon,
        requirement: a.requirement,
        reward: a.reward,
        hidden: a.hidden,
        unlocked,
        progress: Math.min(progress, a.requirement.count),
      };
    });

    return { achievements: result };
  },

  // Check play time achievement
  checkPlayTime(player: Player): void {
    let playTimeSeconds = Math.floor((Date.now() - player.loginTime) / 1000);
    this.checkAchievement(player, "play_time", playTimeSeconds);
  },

  // Check early bird (first login)
  checkFirstLogin(player: Player, totalPlayers: number): void {
    if (totalPlayers === 1) {
      this.checkAchievement(player, "first_login", 1);
    }
  },

  // Check full equip
  checkFullEquip(player: Player): void {
    let equippedCount = 0;
    for (let slot of Object.values(player.equipment)) {
      if (slot !== null) equippedCount++;
    }
    this.checkAchievement(player, "full_equip", equippedCount);
  },

  // Check inventory full
  checkInventoryFull(player: Player): void {
    if (player.inventory.length >= 28) {
      this.checkAchievement(player, "inventory_full", 1);
    }
  },

  // Check gold accumulation
  checkGold(player: Player): void {
    this.checkAchievement(player, "gold_accumulate", player.stats.gold);
  },

  // Check karma achievements
  checkKarma(player: Player): void {
    if (player.karma >= 0) {
      this.checkAchievement(player, "karma_reach", player.karma);
    }
    if (player.karma < 0) {
      this.checkAchievement(player, "karma_negative", Math.abs(player.karma));
    }
  },
};

// ---- Party System ----

const PARTY_MAX_SIZE = 4;
const PARTY_EXP_RANGE = 10; // tiles
const INVITE_TIMEOUT = 30000; // 30 seconds

export class Party {
  id: string;
  leaderId: string;
  members: Map<string, Player>;
  maxSize: number = PARTY_MAX_SIZE;

  constructor(leader: Player) {
    this.id = uuid();
    this.leaderId = leader.id;
    this.members = new Map();
    this.members.set(leader.id, leader);
    leader.partyId = this.id;
  }

  addMember(player: Player): boolean {
    if (this.members.size >= this.maxSize) return false;
    if (this.members.has(player.id)) return false;
    this.members.set(player.id, player);
    player.partyId = this.id;
    return true;
  }

  removeMember(playerId: string): void {
    let player = this.members.get(playerId);
    if (player) {
      player.partyId = null;
    }
    this.members.delete(playerId);

    // If leader left, assign new leader
    if (playerId === this.leaderId && this.members.size > 0) {
      let newLeader = this.members.values().next().value;
      if (newLeader) {
        this.leaderId = newLeader.id;
      }
    }
  }

  setLeader(playerId: string): void {
    if (this.members.has(playerId)) {
      this.leaderId = playerId;
    }
  }

  broadcast(type: PacketType, data: unknown): void {
    for (let [, member] of this.members) {
      member.connection.send(type, data);
    }
  }

  getMemberData(player: Player): PartyMember {
    return {
      id: player.id,
      name: player.name,
      level: player.level,
      hp: player.stats.hp,
      maxHp: player.stats.maxHp,
      playerClass: player.playerClass,
    };
  }

  getPartyData(): PartyData {
    let members: PartyMember[] = [];
    for (let [, member] of this.members) {
      members.push(this.getMemberData(member));
    }
    return {
      id: this.id,
      leaderId: this.leaderId,
      members,
      maxSize: this.maxSize,
    };
  }

  distributeExp(amount: number, killerX: number, killerY: number): void {
    let nearbyMembers: Player[] = [];
    for (let [, member] of this.members) {
      if (member.isDead) continue;
      let dist = Math.abs(member.x - killerX) + Math.abs(member.y - killerY);
      if (dist <= PARTY_EXP_RANGE) {
        nearbyMembers.push(member);
      }
    }

    if (nearbyMembers.length === 0) return;

    // Bonus: +10% per party member beyond the first
    let bonus = 1 + 0.1 * (nearbyMembers.length - 1);
    let perMember = Math.floor((amount / nearbyMembers.length) * bonus);

    for (let member of nearbyMembers) {
      member.addExp(perMember);
      member.connection.send(PacketType.STATS_UPDATE, { stats: member.stats });
    }
  }

  distributeGold(amount: number, killerX: number, killerY: number): void {
    let nearbyMembers: Player[] = [];
    for (let [, member] of this.members) {
      if (member.isDead) continue;
      let dist = Math.abs(member.x - killerX) + Math.abs(member.y - killerY);
      if (dist <= PARTY_EXP_RANGE) {
        nearbyMembers.push(member);
      }
    }

    if (nearbyMembers.length === 0) return;

    let perMember = Math.floor(amount / nearbyMembers.length);
    for (let member of nearbyMembers) {
      member.stats.gold += perMember;
      member.connection.send(PacketType.STATS_UPDATE, { stats: member.stats });
    }
  }
}

export let PartySystem = {
  parties: new Map<string, Party>(),
  playerParties: new Map<string, string>(),
  pendingInvites: new Map<
    string,
    { from: string; partyId?: string; timestamp: number }
  >(),

  invitePlayer(inviter: Player, targetId: string, world: World): void {
    let target = world.players.get(targetId);
    if (!target) {
      inviter.connection.send(PacketType.NOTIFICATION, {
        message: "Player not found.",
        messageKo: "플레이어를 찾을 수 없습니다.",
      });
      return;
    }

    if (target.id === inviter.id) {
      inviter.connection.send(PacketType.NOTIFICATION, {
        message: "You cannot invite yourself.",
        messageKo: "자기 자신을 초대할 수 없습니다.",
      });
      return;
    }

    if (target.partyId) {
      inviter.connection.send(PacketType.NOTIFICATION, {
        message: "That player is already in a party.",
        messageKo: "해당 플레이어는 이미 파티에 속해 있습니다.",
      });
      return;
    }

    let existing = this.pendingInvites.get(target.id);
    if (existing && Date.now() - existing.timestamp < INVITE_TIMEOUT) {
      inviter.connection.send(PacketType.NOTIFICATION, {
        message: "That player already has a pending invite.",
        messageKo: "해당 플레이어에게 이미 초대 요청이 있습니다.",
      });
      return;
    }

    let existingParty = this.getParty(inviter.id);
    if (existingParty && existingParty.members.size >= existingParty.maxSize) {
      inviter.connection.send(PacketType.NOTIFICATION, {
        message: "Party is full.",
        messageKo: "파티가 가득 찼습니다.",
      });
      return;
    }

    if (existingParty && existingParty.leaderId !== inviter.id) {
      inviter.connection.send(PacketType.NOTIFICATION, {
        message: "Only the party leader can invite.",
        messageKo: "파티장만 초대할 수 있습니다.",
      });
      return;
    }

    this.pendingInvites.set(target.id, {
      from: inviter.id,
      partyId: inviter.partyId || undefined,
      timestamp: Date.now(),
    });
    target.partyInviteFrom = inviter.id;

    target.connection.send(PacketType.PARTY_INVITE, {
      fromId: inviter.id,
      fromName: inviter.name,
    });

    inviter.connection.send(PacketType.NOTIFICATION, {
      message: `Invited ${target.name} to party.`,
      messageKo: `${target.name}님에게 파티 초대를 보냈습니다.`,
    });

    setTimeout(() => {
      let invite = this.pendingInvites.get(target.id);
      if (invite && invite.from === inviter.id) {
        this.pendingInvites.delete(target.id);
        if (target.partyInviteFrom === inviter.id) {
          target.partyInviteFrom = null;
        }
      }
    }, INVITE_TIMEOUT);
  },

  acceptInvite(player: Player, world: World): void {
    let invite = this.pendingInvites.get(player.id);
    if (!invite) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "No pending invite.",
        messageKo: "대기 중인 초대가 없습니다.",
      });
      return;
    }

    this.pendingInvites.delete(player.id);
    player.partyInviteFrom = null;

    let inviter = world.players.get(invite.from);
    if (!inviter) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Inviter has gone offline.",
        messageKo: "초대한 플레이어가 접속을 종료했습니다.",
      });
      return;
    }

    let party = this.getParty(inviter.id);
    if (!party) {
      party = new Party(inviter);
      this.parties.set(party.id, party);
      this.playerParties.set(inviter.id, party.id);
    }

    if (party.members.size >= party.maxSize) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Party is full.",
        messageKo: "파티가 가득 찼습니다.",
      });
      return;
    }

    if (!party.addMember(player)) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Could not join party.",
        messageKo: "파티에 참가할 수 없습니다.",
      });
      return;
    }

    this.playerParties.set(player.id, party.id);

    party.broadcast(PacketType.NOTIFICATION, {
      message: `${player.name} joined the party.`,
      messageKo: `${player.name}님이 파티에 참가했습니다.`,
    });

    this.broadcastPartyUpdate(party);
  },

  declineInvite(player: Player): void {
    let invite = this.pendingInvites.get(player.id);
    if (!invite) return;

    this.pendingInvites.delete(player.id);
    player.partyInviteFrom = null;
  },

  leaveParty(player: Player): void {
    let party = this.getParty(player.id);
    if (!party) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "You are not in a party.",
        messageKo: "파티에 속해 있지 않습니다.",
      });
      return;
    }

    party.removeMember(player.id);
    this.playerParties.delete(player.id);

    player.connection.send(PacketType.NOTIFICATION, {
      message: "You left the party.",
      messageKo: "파티를 떠났습니다.",
    });
    player.connection.send(PacketType.PARTY_UPDATE, { party: null });

    if (party.members.size === 0) {
      this.parties.delete(party.id);
    } else if (party.members.size === 1) {
      let lastMember = party.members.values().next().value;
      if (lastMember) {
        party.removeMember(lastMember.id);
        this.playerParties.delete(lastMember.id);
        lastMember.connection.send(PacketType.NOTIFICATION, {
          message: "Party disbanded.",
          messageKo: "파티가 해산되었습니다.",
        });
        lastMember.connection.send(PacketType.PARTY_UPDATE, { party: null });
      }
      this.parties.delete(party.id);
    } else {
      party.broadcast(PacketType.NOTIFICATION, {
        message: `${player.name} left the party.`,
        messageKo: `${player.name}님이 파티를 떠났습니다.`,
      });
      this.broadcastPartyUpdate(party);
    }
  },

  kickMember(leader: Player, targetId: string): void {
    let party = this.getParty(leader.id);
    if (!party) return;

    if (party.leaderId !== leader.id) {
      leader.connection.send(PacketType.NOTIFICATION, {
        message: "Only the leader can kick members.",
        messageKo: "파티장만 멤버를 추방할 수 있습니다.",
      });
      return;
    }

    if (targetId === leader.id) return;

    let target = party.members.get(targetId);
    if (!target) return;

    party.removeMember(targetId);
    this.playerParties.delete(targetId);

    target.connection.send(PacketType.NOTIFICATION, {
      message: "You have been kicked from the party.",
      messageKo: "파티에서 추방되었습니다.",
    });
    target.connection.send(PacketType.PARTY_UPDATE, { party: null });

    if (party.members.size <= 1) {
      let lastMember = party.members.values().next().value;
      if (lastMember) {
        party.removeMember(lastMember.id);
        this.playerParties.delete(lastMember.id);
        lastMember.connection.send(PacketType.NOTIFICATION, {
          message: "Party disbanded.",
          messageKo: "파티가 해산되었습니다.",
        });
        lastMember.connection.send(PacketType.PARTY_UPDATE, { party: null });
      }
      this.parties.delete(party.id);
    } else {
      party.broadcast(PacketType.NOTIFICATION, {
        message: `${target.name} was kicked from the party.`,
        messageKo: `${target.name}님이 파티에서 추방되었습니다.`,
      });
      this.broadcastPartyUpdate(party);
    }
  },

  getParty(playerId: string): Party | null {
    let partyId = this.playerParties.get(playerId);
    if (!partyId) return null;
    return this.parties.get(partyId) || null;
  },

  broadcastPartyUpdate(party: Party): void {
    let partyData = party.getPartyData();
    party.broadcast(PacketType.PARTY_UPDATE, { party: partyData });
  },

  onPlayerDisconnect(playerId: string): void {
    this.pendingInvites.delete(playerId);

    let party = this.getParty(playerId);
    if (!party) return;

    let player = party.members.get(playerId);
    let playerName = player?.name || "???";

    party.removeMember(playerId);
    this.playerParties.delete(playerId);

    if (party.members.size === 0) {
      this.parties.delete(party.id);
    } else if (party.members.size === 1) {
      let lastMember = party.members.values().next().value;
      if (lastMember) {
        party.removeMember(lastMember.id);
        this.playerParties.delete(lastMember.id);
        lastMember.connection.send(PacketType.NOTIFICATION, {
          message: "Party disbanded.",
          messageKo: "파티가 해산되었습니다.",
        });
        lastMember.connection.send(PacketType.PARTY_UPDATE, { party: null });
      }
      this.parties.delete(party.id);
    } else {
      party.broadcast(PacketType.NOTIFICATION, {
        message: `${playerName} disconnected from the party.`,
        messageKo: `${playerName}님의 연결이 끊어졌습니다.`,
      });
      this.broadcastPartyUpdate(party);
    }
  },
};

// ---- Crafting System ----

export let CraftingSystem = {
  getAvailableRecipes(player: Player): CraftingRecipe[] {
    let recipes: CraftingRecipe[] = [];
    for (let recipe of getAllRecipes()) {
      if (player.level >= recipe.level) {
        recipes.push(recipe);
      }
    }
    return recipes;
  },

  canCraft(player: Player, recipeId: string): { ok: boolean; reason?: string } {
    let recipe = RECIPES[recipeId];
    if (!recipe) {
      return { ok: false, reason: "레시피를 찾을 수 없습니다." };
    }

    if (player.level < recipe.level) {
      return { ok: false, reason: `레벨 ${recipe.level}이 필요합니다.` };
    }

    if (player.stats.gold < recipe.goldCost) {
      return {
        ok: false,
        reason: `골드가 부족합니다. (필요: ${recipe.goldCost}G)`,
      };
    }

    for (let mat of recipe.materials) {
      let have = 0;
      for (let slot of player.inventory) {
        if (slot.itemId === mat.itemId) {
          have += slot.count;
        }
      }
      if (have < mat.count) {
        let itemDef = ITEMS[mat.itemId];
        let itemName = itemDef?.nameKo || mat.itemId;
        return {
          ok: false,
          reason: `${itemName}이(가) 부족합니다. (${have}/${mat.count})`,
        };
      }
    }

    return { ok: true };
  },

  craft(player: Player, recipeId: string): boolean {
    let recipe = RECIPES[recipeId];
    if (!recipe) return false;

    let check = this.canCraft(player, recipeId);
    if (!check.ok) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: check.reason,
        messageKo: check.reason,
      });
      return false;
    }

    // Remove materials from inventory
    for (let mat of recipe.materials) {
      let remaining = mat.count;
      for (let i = player.inventory.length - 1; i >= 0 && remaining > 0; i--) {
        if (player.inventory[i].itemId === mat.itemId) {
          let take = Math.min(remaining, player.inventory[i].count);
          player.inventory[i].count -= take;
          remaining -= take;
          if (player.inventory[i].count <= 0) {
            player.inventory.splice(i, 1);
          }
        }
      }
    }

    // Deduct gold
    player.stats.gold -= recipe.goldCost;

    // Add result item
    let added = player.addItem(recipe.resultItemId, recipe.resultCount);
    if (!added) {
      player.stats.gold += recipe.goldCost;
      player.connection.send(PacketType.NOTIFICATION, {
        message: "인벤토리가 가득 찼습니다!",
        messageKo: "인벤토리가 가득 찼습니다!",
      });
      return false;
    }

    let resultItem = ITEMS[recipe.resultItemId];
    let resultName = resultItem?.nameKo || recipe.nameKo;

    player.connection.send(PacketType.STATS_UPDATE, { stats: player.stats });
    player.sendInventoryUpdate();

    player.connection.send(PacketType.CRAFT_RESULT, {
      success: true,
      recipeId,
      itemId: recipe.resultItemId,
      itemName: resultName,
      count: recipe.resultCount,
    });

    player.connection.send(PacketType.NOTIFICATION, {
      message: `Crafted ${resultName} x${recipe.resultCount}!`,
      messageKo: `${resultName} x${recipe.resultCount} 제작 완료!`,
    });

    console.log(
      `[Craft] ${player.name} crafted ${recipe.resultItemId} x${recipe.resultCount}`,
    );

    return true;
  },

  sendRecipeList(player: Player): void {
    let recipes = this.getAvailableRecipes(player);

    let recipeData = recipes.map((recipe) => {
      let materials = recipe.materials.map((mat) => {
        let have = 0;
        for (let slot of player.inventory) {
          if (slot.itemId === mat.itemId) {
            have += slot.count;
          }
        }
        let itemDef = ITEMS[mat.itemId];
        return {
          itemId: mat.itemId,
          itemName: itemDef?.nameKo || mat.itemId,
          need: mat.count,
          have,
          color: itemDef?.color || "#888",
        };
      });

      let resultItem = ITEMS[recipe.resultItemId];

      return {
        id: recipe.id,
        name: recipe.name,
        nameKo: recipe.nameKo,
        resultItemId: recipe.resultItemId,
        resultName: resultItem?.nameKo || recipe.nameKo,
        resultCount: recipe.resultCount,
        resultColor: resultItem?.color || "#888",
        resultType: resultItem?.type || "",
        resultStats: {
          attack: resultItem?.attack,
          defense: resultItem?.defense,
          hp: resultItem?.hp,
          mp: resultItem?.mp,
          magicAttack: resultItem?.magicAttack,
          magicDefense: resultItem?.magicDefense,
          critRate: resultItem?.critRate,
          critDamage: resultItem?.critDamage,
          dodgeRate: resultItem?.dodgeRate,
          attackSpeed: resultItem?.attackSpeed,
          healAmount: resultItem?.healAmount,
          mpRestore: resultItem?.mpRestore,
          speed: resultItem?.speed,
        },
        resultDescription: resultItem?.descriptionKo || "",
        materials,
        goldCost: recipe.goldCost,
        level: recipe.level,
        category: recipe.category,
        quizRequired: recipe.quizRequired || false,
        canCraft: this.canCraft(player, recipe.id).ok,
      };
    });

    player.connection.send(PacketType.CRAFT_LIST, { recipes: recipeData });
  },
};

// ---- Trade System ----

export let TradeSystem = {
  requestTrade(requester: Player, targetId: string, world: World): void {
    if (requester.isDead) return;
    if (requester.tradeState) {
      requester.connection.send(PacketType.NOTIFICATION, {
        message: "Already in a trade.",
        messageKo: "이미 거래 중입니다.",
      });
      return;
    }

    let target = world.players.get(targetId);
    if (!target || target.isDead) {
      requester.connection.send(PacketType.NOTIFICATION, {
        message: "Player not found.",
        messageKo: "플레이어를 찾을 수 없습니다.",
      });
      return;
    }

    if (target.tradeState) {
      requester.connection.send(PacketType.NOTIFICATION, {
        message: "That player is already trading.",
        messageKo: "상대방이 이미 거래 중입니다.",
      });
      return;
    }

    let dist =
      Math.abs(requester.x - target.x) + Math.abs(requester.y - target.y);
    if (dist > 5) {
      requester.connection.send(PacketType.NOTIFICATION, {
        message: "Too far from target.",
        messageKo: "대상이 너무 멀리 있습니다.",
      });
      return;
    }

    target.tradeRequestFrom = requester.id;
    target.connection.send(PacketType.TRADE_REQUEST, {
      requesterId: requester.id,
      requesterName: requester.name,
    });

    requester.connection.send(PacketType.NOTIFICATION, {
      message: `Trade request sent to ${target.name}.`,
      messageKo: `${target.name}에게 거래 요청을 보냈습니다.`,
    });
  },

  acceptTrade(player: Player, requesterId: string, world: World): void {
    if (player.tradeRequestFrom !== requesterId) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "No trade request from that player.",
        messageKo: "해당 플레이어의 거래 요청이 없습니다.",
      });
      return;
    }

    let requester = world.players.get(requesterId);
    if (!requester || requester.isDead || requester.tradeState) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "Trade partner is unavailable.",
        messageKo: "거래 상대가 이용 불가능합니다.",
      });
      player.tradeRequestFrom = null;
      return;
    }

    player.tradeRequestFrom = null;

    player.tradeState = {
      partnerId: requester.id,
      partnerName: requester.name,
      myOffer: { items: [], gold: 0 },
      partnerOffer: { items: [], gold: 0 },
      myConfirmed: false,
      partnerConfirmed: false,
    };

    requester.tradeState = {
      partnerId: player.id,
      partnerName: player.name,
      myOffer: { items: [], gold: 0 },
      partnerOffer: { items: [], gold: 0 },
      myConfirmed: false,
      partnerConfirmed: false,
    };

    player.connection.send(PacketType.TRADE_ACCEPT, {
      partnerId: requester.id,
      partnerName: requester.name,
    });

    requester.connection.send(PacketType.TRADE_ACCEPT, {
      partnerId: player.id,
      partnerName: player.name,
    });
  },

  declineTrade(player: Player, world: World): void {
    if (player.tradeRequestFrom) {
      let requester = world.players.get(player.tradeRequestFrom);
      if (requester) {
        requester.connection.send(PacketType.TRADE_DECLINE, {
          playerName: player.name,
        });
      }
      player.tradeRequestFrom = null;
    }
  },

  updateOffer(
    player: Player,
    offer: { items: Array<{ slotIndex: number; count: number }>; gold: number },
    world: World,
  ): void {
    if (!player.tradeState) return;

    let validItems: Array<{ slotIndex: number; count: number }> = [];
    for (let item of offer.items) {
      if (item.slotIndex < 0 || item.slotIndex >= player.inventory.length)
        continue;
      let slot = player.inventory[item.slotIndex];
      if (!slot) continue;
      let count = Math.min(item.count, slot.count);
      if (count <= 0) continue;
      validItems.push({ slotIndex: item.slotIndex, count });
    }

    let gold = Math.max(0, Math.min(offer.gold, player.stats.gold));

    player.tradeState.myOffer = { items: validItems, gold };
    player.tradeState.myConfirmed = false;
    player.tradeState.partnerConfirmed = false;

    let partner = world.players.get(player.tradeState.partnerId);
    if (partner && partner.tradeState) {
      partner.tradeState.partnerOffer = { items: validItems, gold };
      partner.tradeState.myConfirmed = false;
      partner.tradeState.partnerConfirmed = false;

      let offerDetails = validItems.map((vi) => {
        let slot = player.inventory[vi.slotIndex];
        let itemDef = ITEMS[slot.itemId];
        return {
          slotIndex: vi.slotIndex,
          count: vi.count,
          itemId: slot.itemId,
          itemName: itemDef?.nameKo || slot.itemId,
          itemColor: itemDef?.color || "#888",
          enhancement: slot.enhancement || 0,
        };
      });

      partner.connection.send(PacketType.TRADE_OFFER_UPDATE, {
        from: "partner",
        items: offerDetails,
        gold,
      });
    }

    player.connection.send(PacketType.TRADE_OFFER_UPDATE, {
      from: "self",
      items: validItems.map((vi) => {
        let slot = player.inventory[vi.slotIndex];
        let itemDef = ITEMS[slot.itemId];
        return {
          slotIndex: vi.slotIndex,
          count: vi.count,
          itemId: slot.itemId,
          itemName: itemDef?.nameKo || slot.itemId,
          itemColor: itemDef?.color || "#888",
          enhancement: slot.enhancement || 0,
        };
      }),
      gold,
    });
  },

  confirmTrade(player: Player, world: World): void {
    if (!player.tradeState) return;

    player.tradeState.myConfirmed = true;

    let partner = world.players.get(player.tradeState.partnerId);
    if (!partner || !partner.tradeState) {
      this.cancelTrade(player, world);
      return;
    }

    partner.tradeState.partnerConfirmed = true;

    partner.connection.send(PacketType.TRADE_CONFIRM, { who: "partner" });
    player.connection.send(PacketType.TRADE_CONFIRM, { who: "self" });

    if (player.tradeState.myConfirmed && player.tradeState.partnerConfirmed) {
      this.executeTrade(player, partner);
    }
  },

  executeTrade(player1: Player, player2: Player): boolean {
    if (!player1.tradeState || !player2.tradeState) return false;

    let offer1 = player1.tradeState.myOffer;
    let offer2 = player2.tradeState.myOffer;

    if (player1.stats.gold < offer1.gold || player2.stats.gold < offer2.gold) {
      this.cancelTradeWithMessage(player1, player2, "골드가 부족합니다.");
      return false;
    }

    for (let item of offer1.items) {
      if (item.slotIndex >= player1.inventory.length) {
        this.cancelTradeWithMessage(
          player1,
          player2,
          "아이템이 변경되었습니다.",
        );
        return false;
      }
      let slot = player1.inventory[item.slotIndex];
      if (!slot || slot.count < item.count) {
        this.cancelTradeWithMessage(
          player1,
          player2,
          "아이템이 변경되었습니다.",
        );
        return false;
      }
    }
    for (let item of offer2.items) {
      if (item.slotIndex >= player2.inventory.length) {
        this.cancelTradeWithMessage(
          player1,
          player2,
          "아이템이 변경되었습니다.",
        );
        return false;
      }
      let slot = player2.inventory[item.slotIndex];
      if (!slot || slot.count < item.count) {
        this.cancelTradeWithMessage(
          player1,
          player2,
          "아이템이 변경되었습니다.",
        );
        return false;
      }
    }

    // Snapshot items
    let items1To2 = offer1.items.map((item) => {
      let slot = player1.inventory[item.slotIndex];
      return {
        itemId: slot.itemId,
        count: item.count,
        enhancement: slot.enhancement,
      };
    });
    let items2To1 = offer2.items.map((item) => {
      let slot = player2.inventory[item.slotIndex];
      return {
        itemId: slot.itemId,
        count: item.count,
        enhancement: slot.enhancement,
      };
    });

    // Remove items (reverse order)
    let sorted1 = [...offer1.items].sort((a, b) => b.slotIndex - a.slotIndex);
    for (let item of sorted1) player1.removeItem(item.slotIndex, item.count);
    let sorted2 = [...offer2.items].sort((a, b) => b.slotIndex - a.slotIndex);
    for (let item of sorted2) player2.removeItem(item.slotIndex, item.count);

    // Transfer gold
    player1.stats.gold -= offer1.gold;
    player1.stats.gold += offer2.gold;
    player2.stats.gold -= offer2.gold;
    player2.stats.gold += offer1.gold;

    // Add received items
    for (let item of items2To1)
      player1.addItem(item.itemId, item.count, item.enhancement);
    for (let item of items1To2)
      player2.addItem(item.itemId, item.count, item.enhancement);

    player1.connection.send(PacketType.STATS_UPDATE, { stats: player1.stats });
    player2.connection.send(PacketType.STATS_UPDATE, { stats: player2.stats });

    player1.connection.send(PacketType.TRADE_COMPLETE, { success: true });
    player2.connection.send(PacketType.TRADE_COMPLETE, { success: true });

    player1.tradeState = null;
    player2.tradeState = null;

    console.log(`[Trade] Trade completed: ${player1.name} <-> ${player2.name}`);
    return true;
  },

  cancelTrade(player: Player, world: World): void {
    if (!player.tradeState) return;

    let partner = world.players.get(player.tradeState.partnerId);
    if (partner) {
      partner.connection.send(PacketType.TRADE_CANCEL, {
        reason: "상대방이 거래를 취소했습니다.",
      });
      partner.tradeState = null;
    }

    player.connection.send(PacketType.TRADE_CANCEL, {
      reason: "거래가 취소되었습니다.",
    });
    player.tradeState = null;
  },

  cancelTradeWithMessage(
    player1: Player,
    player2: Player,
    message: string,
  ): void {
    player1.connection.send(PacketType.TRADE_CANCEL, { reason: message });
    player2.connection.send(PacketType.TRADE_CANCEL, { reason: message });
    player1.tradeState = null;
    player2.tradeState = null;
  },
};
