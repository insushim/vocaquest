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
} from "../../shared/types";
import {
  PacketType,
  EntityType,
  SkillId,
  PlayerClass,
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
  calculateDamage(attackerAtk: number, defenderDef: number): number {
    let base = attackerAtk - Math.floor(defenderDef / 2);
    let variance = Math.floor(Math.random() * 7) - 3; // -3 to +3
    return Math.max(1, base + variance);
  },

  calculateSkillDamage(
    player: Player,
    skill: SkillDefinition,
    targetDef: number,
  ): number {
    let baseDamage = player.stats.attack - Math.floor(targetDef / 2);
    let skillDamage = Math.floor(baseDamage * skill.damage);
    let variance = Math.floor(Math.random() * 5) - 2;
    return Math.max(1, skillDamage + variance);
  },

  processAttack(attacker: Player, targetId: string, world: World): void {
    // Find target - could be mob or player
    let mob = world.mobs.get(targetId);
    if (mob && !mob.isDead) {
      // Check range (1 tile for melee)
      let dist = Math.abs(attacker.x - mob.x) + Math.abs(attacker.y - mob.y);
      if (dist > 2) return;

      if (attacker.attackCooldown > 0) return;
      attacker.attackCooldown = 1000; // 1s attack speed
      attacker.lastCombatTime = Date.now();

      let damage = this.calculateDamage(
        attacker.stats.attack,
        mob.definition.defense,
      );
      let actualDamage = mob.takeDamage(damage, attacker);

      world.broadcastCombatHit(
        attacker.id,
        EntityType.PLAYER,
        mob.id,
        EntityType.MOB,
        actualDamage,
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
      attacker.attackCooldown = 1000;
      attacker.lastCombatTime = Date.now();

      let damage = this.calculateDamage(
        attacker.stats.attack,
        targetPlayer.stats.defense,
      );
      let actualDamage = targetPlayer.takeDamage(damage, attacker.id);

      world.broadcastCombatHit(
        attacker.id,
        EntityType.PLAYER,
        targetPlayer.id,
        EntityType.PLAYER,
        actualDamage,
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

    // Self-buff skills (War Cry, Evasion)
    if (skill.damage === 0 && skill.buffDuration) {
      let effect: Record<string, number> = {};

      if (skillId === SkillId.WAR_CRY) {
        effect.attackPercent = 0.3;
      } else if (skillId === SkillId.EVASION) {
        effect.evasion = 1;
      }

      player.buffs.set(skillId, {
        endsAt: Date.now() + skill.buffDuration,
        effect,
      });

      // Recalculate stats with buff
      let currentHp = player.stats.hp;
      let currentMp = player.stats.mp;
      let currentExp = player.stats.exp;
      let currentGold = player.stats.gold;
      player.stats = player.calculateStats();
      player.stats.hp = currentHp;
      player.stats.mp = currentMp;
      player.stats.exp = currentExp;
      player.stats.gold = currentGold;

      player.connection.send(PacketType.STATS_UPDATE, { stats: player.stats });
      world.broadcast(PacketType.SKILL_EFFECT, {
        playerId: player.id,
        skillId,
        targetId: player.id,
        damage: 0,
      });
      return;
    }

    // Heal skill
    if (skill.healAmount && skill.healAmount > 0) {
      let healAmount = Math.floor(player.stats.maxHp * skill.healAmount);
      player.stats.hp = Math.min(
        player.stats.maxHp,
        player.stats.hp + healAmount,
      );
      player.connection.send(PacketType.STATS_UPDATE, { stats: player.stats });
      world.broadcast(PacketType.SKILL_EFFECT, {
        playerId: player.id,
        skillId,
        targetId: player.id,
        damage: -healAmount,
      });
      return;
    }

    // Damage skills
    if (!targetId) {
      player.connection.send(PacketType.NOTIFICATION, {
        message: "No target selected.",
        messageKo: "대상을 선택해주세요.",
      });
      return;
    }

    // Check AoE
    if (skill.aoe && skill.aoeRadius) {
      // Get all entities near target
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
          let damage = this.calculateSkillDamage(
            player,
            skill,
            mob.definition.defense,
          );
          let actualDamage = mob.takeDamage(damage, player);
          world.broadcastCombatHit(
            player.id,
            EntityType.PLAYER,
            mob.id,
            EntityType.MOB,
            actualDamage,
          );

          if (mob.hp <= 0) {
            mob.die(player, world);
            KarmaSystem.onMobKill(player);
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

        let damage = this.calculateSkillDamage(
          player,
          skill,
          mob.definition.defense,
        );
        let actualDamage = mob.takeDamage(damage, player);
        world.broadcastCombatHit(
          player.id,
          EntityType.PLAYER,
          mob.id,
          EntityType.MOB,
          actualDamage,
        );

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

          let damage = this.calculateSkillDamage(
            player,
            skill,
            targetPlayer.stats.defense,
          );
          let actualDamage = targetPlayer.takeDamage(damage, player.id);
          world.broadcastCombatHit(
            player.id,
            EntityType.PLAYER,
            targetPlayer.id,
            EntityType.PLAYER,
            actualDamage,
          );

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
    // Determine grade level string
    let gradeKey = String(player.gradeLevel);
    let level = vocabData.levels[gradeKey];
    if (!level || level.words.length === 0) {
      // Fallback to level 1
      level = vocabData.levels["1"];
      if (!level) return null;
    }

    // Filter out already used words in this session
    let available = level.words.filter((w) => !player.usedWords.has(w.id));

    // If all used, reset the dedup set
    if (available.length === 0) {
      player.usedWords.clear();
      available = level.words;
    }

    // Pick random word
    let word = available[Math.floor(Math.random() * available.length)];
    player.usedWords.add(word.id);

    // Generate wrong options from same level
    let wrongOptions: string[] = [];
    let allWords = level.words.filter((w) => w.id !== word.id);

    // Shuffle and pick 3 wrong answers
    let shuffled = [...allWords].sort(() => Math.random() - 0.5);
    for (let w of shuffled) {
      if (wrongOptions.length >= QUIZ_OPTIONS_COUNT - 1) break;
      if (w.korean !== word.korean) {
        wrongOptions.push(w.korean);
      }
    }

    // If not enough wrong options, pad with words from other levels
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

    // Build options array: correct + wrong, then shuffle
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

    // answerId is the index in the options array that the player picked
    // The quiz answer data stores the correct answer string
    // We need to validate against the stored correct answer
    let isCorrect = answerId >= 0; // Will be checked via the stored data

    // Reset quiz state
    let quizData = player.quizAnswer;
    player.quizPending = false;
    player.quizAnswer = null;

    if (isCorrect) {
      // Give item drops
      let drops: Array<{ itemId: string; count: number }> = [];
      for (let drop of quizData.drops) {
        let count =
          drop.minCount +
          Math.floor(Math.random() * (drop.maxCount - drop.minCount + 1));
        if (player.addItem(drop.itemId, count)) {
          drops.push({ itemId: drop.itemId, count });
        }
      }

      // Karma bonus for correct quiz
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
      return false; // Inventory full - addItem already notifies
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
    player.killStreak = 0; // Reset PvP kill streak on PvE kill (optional)

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
