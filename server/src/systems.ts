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
} from "../../shared/types";
import {
  PacketType,
  EntityType,
  SkillId,
  PlayerClass,
  StatusEffectType,
  KARMA_LOSS_PER_KILL,
  KARMA_GAIN_PER_MOB,
  QUIZ_OPTIONS_COUNT,
  getKarmaTitle,
} from "../../shared/types";
import { ITEMS } from "./data/items";
import { SHOPS } from "./data/shops";
import { SKILLS } from "./data/skills";
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
      );

      if (mob.hp <= 0) {
        mob.die(attacker, world);
        KarmaSystem.onMobKill(attacker);
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
      );

      if (targetPlayer.isDead) {
        KarmaSystem.onPlayerKill(attacker, targetPlayer, world);
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
          );

          // Apply status effect
          if (skill.statusEffect) {
            this.applyStatusEffect(skill, mob.id, player.id, world);
          }

          if (mob.hp <= 0) {
            mob.die(player, world);
            KarmaSystem.onMobKill(player);
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
        );

        if (skill.statusEffect) {
          this.applyStatusEffect(skill, mob.id, player.id, world);
        }

        if (mob.hp <= 0) {
          mob.die(player, world);
          KarmaSystem.onMobKill(player);
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
  },

  getTitle(karma: number): { en: string; ko: string } {
    return getKarmaTitle(karma);
  },
};
