// ============================================
// VocaQuest Online - Shared Types
// 100% Original Code - MIT License
// ============================================

// ---- Network Packets ----
export enum PacketType {
  // Auth
  LOGIN = "login",
  REGISTER = "register",
  AUTH_SUCCESS = "auth_success",
  AUTH_ERROR = "auth_error",

  // World
  WELCOME = "welcome",
  MAP_DATA = "map_data",
  PLAYER_ENTER = "player_enter",
  PLAYER_LEAVE = "player_leave",

  // Movement
  MOVE = "move",
  ENTITY_MOVE = "entity_move",
  TELEPORT = "teleport",

  // Combat
  ATTACK = "attack",
  COMBAT_HIT = "combat_hit",
  ENTITY_DEATH = "entity_death",
  RESPAWN = "respawn",
  USE_SKILL = "use_skill",
  SKILL_EFFECT = "skill_effect",

  // Stats
  STATS_UPDATE = "stats_update",
  LEVEL_UP = "level_up",
  EXP_GAIN = "exp_gain",
  ALLOCATE_STAT = "allocate_stat",

  // Quiz
  QUIZ_SHOW = "quiz_show",
  QUIZ_ANSWER = "quiz_answer",
  QUIZ_RESULT = "quiz_result",
  SET_GRADE_LEVEL = "set_grade_level",

  // Inventory & Equipment
  INVENTORY_UPDATE = "inventory_update",
  EQUIPMENT_UPDATE = "equipment_update",
  EQUIP_ITEM = "equip_item",
  UNEQUIP_ITEM = "unequip_item",
  DROP_ITEM = "drop_item",
  PICKUP_ITEM = "pickup_item",
  USE_ITEM = "use_item",
  LOOT_DROP = "loot_drop",

  // Enhancement
  ENHANCE_ITEM = "enhance_item",
  ENHANCE_RESULT = "enhance_result",

  // Shop
  SHOP_OPEN = "shop_open",
  SHOP_BUY = "shop_buy",
  SHOP_SELL = "shop_sell",
  SHOP_CLOSE = "shop_close",

  // Chat
  CHAT = "chat",
  CHAT_MESSAGE = "chat_message",

  // Karma / PvP
  KARMA_UPDATE = "karma_update",
  PVP_KILL = "pvp_kill",

  // Notification
  NOTIFICATION = "notification",

  // Entity sync
  ENTITY_LIST = "entity_list",
  MOB_SPAWN = "mob_spawn",
  NPC_INTERACT = "npc_interact",

  // Status Effects
  STATUS_EFFECT = "status_effect",
  STATUS_REMOVE = "status_remove",

  // Quest
  QUEST_LIST = "quest_list",
  QUEST_ACCEPT = "quest_accept",
  QUEST_UPDATE = "quest_update",
  QUEST_COMPLETE = "quest_complete",
  QUEST_ABANDON = "quest_abandon",
  QUEST_AVAILABLE = "quest_available",

  // PK System
  PK_TOGGLE = "pk_toggle",
  PK_ITEM_DROP = "pk_item_drop",
  GROUND_ITEM = "ground_item",
  PICKUP_GROUND_ITEM = "pickup_ground_item",
  GROUND_ITEM_REMOVED = "ground_item_removed",

  // Auto-potion
  AUTO_POTION_TOGGLE = "auto_potion_toggle",

  // System announcement
  SYSTEM_ANNOUNCE = "system_announce",

  // Ping
  PING = "ping",
  PONG = "pong",

  // Achievements
  ACHIEVEMENT_UNLOCK = "achievement_unlock",
  ACHIEVEMENT_LIST = "achievement_list",

  // Crafting
  CRAFT_LIST = "craft_list",
  CRAFT_ITEM = "craft_item",
  CRAFT_RESULT = "craft_result",

  // Party
  PARTY_INVITE = "party_invite",
  PARTY_ACCEPT = "party_accept",
  PARTY_DECLINE = "party_decline",
  PARTY_LEAVE = "party_leave",
  PARTY_KICK = "party_kick",
  PARTY_UPDATE = "party_update",
  PARTY_CHAT = "party_chat",

  // Trading
  TRADE_REQUEST = "trade_request",
  TRADE_ACCEPT = "trade_accept",
  TRADE_DECLINE = "trade_decline",
  TRADE_OFFER_UPDATE = "trade_offer_update",
  TRADE_CONFIRM = "trade_confirm",
  TRADE_CANCEL = "trade_cancel",
  TRADE_COMPLETE = "trade_complete",
}

// ---- Trading ----
export interface TradeOffer {
  items: Array<{ slotIndex: number; count: number }>;
  gold: number;
}

export interface TradeState {
  partnerId: string;
  partnerName: string;
  myOffer: TradeOffer;
  partnerOffer: TradeOffer;
  myConfirmed: boolean;
  partnerConfirmed: boolean;
}

// ---- Set Equipment Bonuses ----
export interface SetBonusTier {
  piecesRequired: number;
  effects: Record<string, number>;
  description: string;
  descriptionKo: string;
}

export interface SetBonusDefinition {
  id: string;
  name: string;
  nameKo: string;
  pieces: number;
  bonuses: SetBonusTier[];
}

export const SET_BONUSES: Record<string, SetBonusDefinition> = {
  scholar_set: {
    id: "scholar_set",
    name: "Scholar's Set",
    nameKo: "학자의 세트",
    pieces: 6,
    bonuses: [
      {
        piecesRequired: 2,
        effects: { hpFlat: 100 },
        description: "+100 HP",
        descriptionKo: "HP +100",
      },
      {
        piecesRequired: 4,
        effects: { quizRewardPercent: 0.1 },
        description: "+10% Quiz Rewards",
        descriptionKo: "퀴즈 보상 +10%",
      },
      {
        piecesRequired: 6,
        effects: { expPercent: 0.2 },
        description: "+20% EXP Gain",
        descriptionKo: "경험치 획득 +20%",
      },
    ],
  },
  guardian_set: {
    id: "guardian_set",
    name: "Guardian's Set",
    nameKo: "수호자의 세트",
    pieces: 6,
    bonuses: [
      {
        piecesRequired: 2,
        effects: { hpFlat: 200 },
        description: "+200 HP",
        descriptionKo: "HP +200",
      },
      {
        piecesRequired: 4,
        effects: { defensePercent: 0.15 },
        description: "+15% Defense",
        descriptionKo: "방어력 +15%",
      },
      {
        piecesRequired: 6,
        effects: { defensePercent: 0.3, hpPercent: 0.1 },
        description: "+30% Defense, +10% HP",
        descriptionKo: "방어력 +30%, HP +10%",
      },
    ],
  },
  shadow_set: {
    id: "shadow_set",
    name: "Shadow Set",
    nameKo: "그림자 세트",
    pieces: 6,
    bonuses: [
      {
        piecesRequired: 2,
        effects: { critRateFlat: 10 },
        description: "+10% Crit Rate",
        descriptionKo: "치명타율 +10%",
      },
      {
        piecesRequired: 4,
        effects: { attackSpeedPercent: 0.2 },
        description: "+20% Attack Speed",
        descriptionKo: "공격속도 +20%",
      },
      {
        piecesRequired: 6,
        effects: { critRateFlat: 25, critDamageFlat: 0.15 },
        description: "+25% Crit Rate, +15% Crit Damage",
        descriptionKo: "치명타율 +25%, 치명타 피해 +15%",
      },
    ],
  },
  dragon_set: {
    id: "dragon_set",
    name: "Dragon Set",
    nameKo: "용의 세트",
    pieces: 6,
    bonuses: [
      {
        piecesRequired: 2,
        effects: { attackPercent: 0.15 },
        description: "+15% Attack",
        descriptionKo: "공격력 +15%",
      },
      {
        piecesRequired: 4,
        effects: { critRateFlat: 10 },
        description: "+10% Crit Rate",
        descriptionKo: "치명타율 +10%",
      },
      {
        piecesRequired: 6,
        effects: { attackPercent: 0.25, critDamageFlat: 0.2 },
        description: "+25% Attack, +20% Crit Damage",
        descriptionKo: "공격력 +25%, 치명타 피해 +20%",
      },
    ],
  },
  celestial_set: {
    id: "celestial_set",
    name: "Celestial Set",
    nameKo: "천상의 세트",
    pieces: 6,
    bonuses: [
      {
        piecesRequired: 2,
        effects: { allStatsPercent: 0.1 },
        description: "+10% All Stats",
        descriptionKo: "전체 스탯 +10%",
      },
      {
        piecesRequired: 4,
        effects: { allStatsPercent: 0.15, hpFlat: 200 },
        description: "+15% All Stats, +200 HP",
        descriptionKo: "전체 스탯 +15%, HP +200",
      },
      {
        piecesRequired: 6,
        effects: { allStatsPercent: 0.2, hpFlat: 500, mpFlat: 200 },
        description: "+20% All Stats, +500 HP, +200 MP",
        descriptionKo: "전체 스탯 +20%, HP +500, MP +200",
      },
    ],
  },
};

// ---- Entities ----
export enum EntityType {
  PLAYER = "player",
  MOB = "mob",
  NPC = "npc",
  ITEM_DROP = "item_drop",
  PROJECTILE = "projectile",
}

export enum Direction {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
}

export interface Position {
  x: number;
  y: number;
}

export interface EntityData {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  name: string;
  direction: Direction;
}

// ---- Player ----
export enum PlayerClass {
  WARRIOR = "warrior",
  KNIGHT = "knight",
  MAGE = "mage",
  ARCHER = "archer",
}

// Stat allocation types
export enum StatType {
  STR = "str",
  DEX = "dex",
  INT = "int",
  CON = "con",
  WIS = "wis",
}

export interface AllocatedStats {
  [StatType.STR]: number;
  [StatType.DEX]: number;
  [StatType.INT]: number;
  [StatType.CON]: number;
  [StatType.WIS]: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  exp: number;
  expToLevel: number;
  level: number;
  gold: number;
  // Extended combat stats
  critRate: number; // % chance (0-100)
  critDamage: number; // multiplier (e.g. 1.5 = 150%)
  dodgeRate: number; // % chance (0-100)
  attackSpeed: number; // attacks per second
  magicAttack: number; // for mage scaling
  magicDefense: number;
  // Stat points
  statPoints: number;
  allocatedStats: AllocatedStats;
}

export interface PlayerData extends EntityData {
  type: EntityType.PLAYER;
  class: PlayerClass;
  stats: PlayerStats;
  karma: number;
  karmaTitle: string;
  gradeLevel: number;
  equipment: EquipmentSlots;
  pkMode?: boolean;
  invulnerable?: boolean;
}

// ---- Status Effects ----
export enum StatusEffectType {
  POISON = "poison",
  STUN = "stun",
  SLOW = "slow",
  CURSE = "curse",
  BLEED = "bleed",
  BURN = "burn",
  FREEZE = "freeze",
  BLIND = "blind",
  SHIELD_BUFF = "shield_buff",
  ATTACK_BUFF = "attack_buff",
  SPEED_BUFF = "speed_buff",
  REGEN_BUFF = "regen_buff",
  MAGIC_BARRIER = "magic_barrier",
}

export interface StatusEffect {
  type: StatusEffectType;
  duration: number; // ms remaining
  value: number; // effect magnitude
  sourceId: string; // who applied it
}

// ---- Mob ----
export enum MobBehavior {
  PASSIVE = "passive",
  NORMAL = "normal",
  AGGRESSIVE = "aggressive",
  BOSS = "boss",
}

// Aggro ranges by behavior type
export const AGGRO_RANGES: Record<MobBehavior, number> = {
  [MobBehavior.PASSIVE]: 0,
  [MobBehavior.NORMAL]: 3,
  [MobBehavior.AGGRESSIVE]: 5,
  [MobBehavior.BOSS]: 8,
};

// De-aggro constants
export const DEAGGRO_DISTANCE = 15; // tiles from spawn
export const DEAGGRO_TIME = 30000; // 30 seconds

export interface MobData extends EntityData {
  type: EntityType.MOB;
  mobId: string;
  nameKo?: string;
  hp: number;
  maxHp: number;
  level: number;
  behavior: MobBehavior;
  isBoss: boolean;
}

export interface MobDefinition {
  id: string;
  name: string;
  nameKo: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  exp: number;
  gold: number;
  behavior: MobBehavior;
  isBoss: boolean;
  aggroRange: number;
  roamDistance: number;
  respawnTime: number;
  drops: LootDrop[];
  spriteColor: string;
  width: number;
  height: number;
  zone: string;
  magicAttack?: number;
  magicDefense?: number;
  critRate?: number;
  statusEffects?: {
    type: StatusEffectType;
    chance: number;
    duration: number;
    value: number;
  }[];
}

// ---- Items ----
export enum ItemType {
  WEAPON = "weapon",
  HELMET = "helmet",
  CHESTPLATE = "chestplate",
  LEGS = "legs",
  BOOTS = "boots",
  SHIELD = "shield",
  RING = "ring",
  PENDANT = "pendant",
  CONSUMABLE = "consumable",
  MATERIAL = "material",
  QUEST = "quest",
  TOOL = "tool",
  SCROLL = "scroll",
}

export enum EquipSlot {
  WEAPON = "weapon",
  HELMET = "helmet",
  CHESTPLATE = "chestplate",
  LEGS = "legs",
  BOOTS = "boots",
  SHIELD = "shield",
  RING = "ring",
  PENDANT = "pendant",
}

// Weapon sub-types
export enum WeaponType {
  SWORD = "sword",
  TWO_HANDED_SWORD = "two_handed_sword",
  STAFF = "staff",
  BOW = "bow",
  DAGGER = "dagger",
  SPEAR = "spear",
  AXE_WEAPON = "axe_weapon",
  MACE = "mace",
}

export interface ItemDefinition {
  id: string;
  name: string;
  nameKo: string;
  type: ItemType;
  equipSlot?: EquipSlot;
  weaponType?: WeaponType;
  attack?: number;
  defense?: number;
  hp?: number;
  mp?: number;
  speed?: number;
  critRate?: number;
  critDamage?: number;
  dodgeRate?: number;
  attackSpeed?: number;
  magicAttack?: number;
  magicDefense?: number;
  healAmount?: number;
  mpRestore?: number;
  price: number;
  sellPrice: number;
  level: number;
  description: string;
  descriptionKo: string;
  stackable: boolean;
  color: string;
  classReq?: PlayerClass;
  enhanceable?: boolean;
  maxEnhance?: number;
  // Scroll-specific
  scrollType?: "enhance" | "teleport" | "return" | "buff";
  buffType?: StatusEffectType;
  buffDuration?: number;
  buffValue?: number;
  teleportZone?: string;
  // Set equipment
  setId?: string;
}

export interface InventorySlot {
  itemId: string;
  count: number;
  enhancement?: number; // +0 ~ +10
}

export interface EquipmentSlots {
  [EquipSlot.WEAPON]: string | null;
  [EquipSlot.HELMET]: string | null;
  [EquipSlot.CHESTPLATE]: string | null;
  [EquipSlot.LEGS]: string | null;
  [EquipSlot.BOOTS]: string | null;
  [EquipSlot.SHIELD]: string | null;
  [EquipSlot.RING]: string | null;
  [EquipSlot.PENDANT]: string | null;
}

// Enhancement levels for equipped items
export interface EquipmentEnhancements {
  [EquipSlot.WEAPON]: number;
  [EquipSlot.HELMET]: number;
  [EquipSlot.CHESTPLATE]: number;
  [EquipSlot.LEGS]: number;
  [EquipSlot.BOOTS]: number;
  [EquipSlot.SHIELD]: number;
  [EquipSlot.RING]: number;
  [EquipSlot.PENDANT]: number;
}

export interface LootDrop {
  itemId: string;
  chance: number;
  minCount: number;
  maxCount: number;
}

// ---- Ground Item Drop ----
export interface GroundItemDrop {
  id: string;
  itemId: string;
  count: number;
  enhancement?: number;
  x: number;
  y: number;
  droppedBy?: string; // player who dropped it (PK death)
  createdAt: number;
}

// ---- Enhancement System ----
export const ENHANCE_MAX = 10;
export const ENHANCE_SUCCESS_RATES: number[] = [
  1.0, // +0 -> +1: 100%
  0.9, // +1 -> +2: 90%
  0.8, // +2 -> +3: 80%
  0.7, // +3 -> +4: 70%
  0.6, // +4 -> +5: 60%
  0.5, // +5 -> +6: 50%
  0.4, // +6 -> +7: 40%
  0.33, // +7 -> +8: 33%
  0.25, // +8 -> +9: 25%
  0.2, // +9 -> +10: 20%
];
// Destruction starts at +4 and above on failure
export const ENHANCE_DESTROY_THRESHOLD = 4;
// Downgrade by 1 on failure below threshold
export const ENHANCE_DOWNGRADE_ON_FAIL = true;

// ---- Map ----
export enum TileType {
  GRASS = 0,
  DIRT = 1,
  STONE = 2,
  WATER = 3,
  SAND = 4,
  WALL = 5,
  TREE = 6,
  FLOOR = 7,
  BRIDGE = 8,
  LAVA = 9,
  SNOW = 10,
  ICE = 11,
  SWAMP = 12,
  DARK_GRASS = 13,
  DARK_STONE = 14,
  PORTAL = 15,
}

export const COLLISION_TILES = [
  TileType.WATER,
  TileType.WALL,
  TileType.TREE,
  TileType.LAVA,
];

export interface MapZone {
  id: string;
  name: string;
  nameKo: string;
  x: number;
  y: number;
  width: number;
  height: number;
  levelRange: [number, number];
  bgColor: string;
}

export interface MapData {
  width: number;
  height: number;
  tileSize: number;
  tiles: number[][];
  collisions: boolean[][];
  zones: MapZone[];
  spawns: SpawnPoint[];
  npcs: NpcPlacement[];
  playerSpawn: Position;
}

export interface SpawnPoint {
  mobId: string;
  x: number;
  y: number;
  count: number;
  radius: number;
}

export interface NpcPlacement {
  npcId: string;
  x: number;
  y: number;
}

// ---- NPC ----
export enum NpcType {
  SHOP = "shop",
  QUEST = "quest",
  INFO = "info",
  ENHANCE = "enhance",
  CRAFT = "craft",
}

export interface NpcDefinition {
  id: string;
  name: string;
  nameKo: string;
  type: NpcType;
  shopId?: string;
  dialogue?: string[];
  dialogueKo?: string[];
  color: string;
}

// ---- Shop ----
export interface ShopDefinition {
  id: string;
  name: string;
  nameKo: string;
  items: string[];
}

// ---- Quiz ----
export interface VocabWord {
  id: string;
  english: string;
  korean: string;
  japanese?: string;
  chinese?: string;
  french?: string;
  spanish?: string;
  german?: string;
  category: string;
  difficulty: number;
}

export interface VocabLevel {
  name: string;
  words: VocabWord[];
}

export interface VocabData {
  levels: Record<string, VocabLevel>;
}

export interface QuizQuestion {
  word: string;
  correct: string;
  options: string[];
  category: string;
}

// ---- Karma ----
export interface KarmaInfo {
  karma: number;
  title: string;
  killStreak: number;
  totalKills: number;
}

export const KARMA_TITLES: Record<string, [number, string]> = {
  saint: [500, "성인"],
  hero: [200, "영웅"],
  guardian: [100, "수호자"],
  citizen: [0, "시민"],
  outlaw: [-100, "무법자"],
  villain: [-200, "악당"],
  demon: [-500, "마왕"],
};

export function getKarmaTitle(karma: number): { en: string; ko: string } {
  if (karma >= 500) return { en: "Saint", ko: "성인" };
  if (karma >= 200) return { en: "Hero", ko: "영웅" };
  if (karma >= 100) return { en: "Guardian", ko: "수호자" };
  if (karma >= 0) return { en: "Citizen", ko: "시민" };
  if (karma >= -100) return { en: "Outlaw", ko: "무법자" };
  if (karma >= -200) return { en: "Villain", ko: "악당" };
  return { en: "Demon Lord", ko: "마왕" };
}

// ---- Skills ----
export enum SkillId {
  // Warrior
  SLASH = "slash",
  SHIELD_BASH = "shield_bash",
  WAR_CRY = "war_cry",
  BERSERK = "berserk",
  GROUND_SLAM = "ground_slam",
  WHIRLWIND = "whirlwind",
  // Knight
  HOLY_STRIKE = "holy_strike",
  DIVINE_SHIELD = "divine_shield",
  PROVOKE = "provoke",
  HOLY_BLESSING = "holy_blessing",
  JUDGMENT = "judgment",
  GUARDIAN_AURA = "guardian_aura",
  // Mage
  FIREBALL = "fireball",
  ICE_BLAST = "ice_blast",
  HEAL = "heal",
  LIGHTNING_BOLT = "lightning_bolt",
  METEOR = "meteor",
  MAGIC_BARRIER = "magic_barrier",
  TELEPORT_SPELL = "teleport_spell",
  CURSE_SPELL = "curse_spell",
  // Archer
  POWER_SHOT = "power_shot",
  MULTI_SHOT = "multi_shot",
  EVASION = "evasion",
  POISON_ARROW = "poison_arrow",
  EXPLOSIVE_ARROW = "explosive_arrow",
  EAGLE_EYE = "eagle_eye",
}

export interface SkillDefinition {
  id: SkillId;
  name: string;
  nameKo: string;
  class: PlayerClass;
  damage: number;
  mpCost: number;
  cooldown: number;
  range: number;
  level: number;
  description: string;
  descriptionKo: string;
  aoe?: boolean;
  aoeRadius?: number;
  healAmount?: number;
  buffDuration?: number;
  statusEffect?: StatusEffectType;
  statusDuration?: number;
  statusValue?: number;
}

// ---- Quest System ----
export enum QuestType {
  KILL = "kill",
  COLLECT = "collect",
  VOCAB = "vocab",
  EXPLORE = "explore",
  BOSS = "boss",
  TALK = "talk",
}

export enum QuestStatus {
  AVAILABLE = "available",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  TURNED_IN = "turned_in",
}

export interface QuestObjective {
  type: QuestType;
  target: string;
  count: number;
  current?: number;
}

export interface QuestReward {
  exp?: number;
  gold?: number;
  items?: Array<{ itemId: string; count: number }>;
  statPoints?: number;
}

export interface QuestDefinition {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  level: number;
  npcId: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  prerequisites?: string[];
  repeatable?: boolean;
  chainNext?: string;
}

export interface QuestProgress {
  questId: string;
  status: QuestStatus;
  objectives: Array<{ current: number }>;
  startedAt: number;
}

// ---- Constants ----
export const TILE_SIZE = 32;
export const TICK_RATE = 20;
export const TICK_INTERVAL = 1000 / TICK_RATE;
export const MAX_INVENTORY_SLOTS = 28;
export const MAX_CHAT_LENGTH = 200;
export const QUIZ_TIME_LIMIT = 15000;
export const QUIZ_OPTIONS_COUNT = 4;
export const HP_REGEN_RATE = 0.02;
export const MP_REGEN_RATE = 0.05;
export const REGEN_INTERVAL = 3000;
export const KARMA_LOSS_PER_KILL = 50;
export const KARMA_GAIN_PER_MOB = 1;
export const EXP_BASE = 100;
export const EXP_GROWTH = 1.5;
export const STAT_POINTS_PER_LEVEL = 3;
export const MAX_LEVEL = 50;

export function expForLevel(level: number): number {
  return Math.floor(EXP_BASE * Math.pow(level, EXP_GROWTH));
}

// Stat point effects
export const STAT_EFFECTS = {
  [StatType.STR]: { attack: 1, hp: 3 },
  [StatType.DEX]: {
    dodgeRate: 0.3,
    critRate: 0.2,
    attackSpeed: 0.02,
    speed: 0.1,
  },
  [StatType.INT]: { magicAttack: 1.5, mp: 5, magicDefense: 0.5 },
  [StatType.CON]: { hp: 8, defense: 0.5, magicDefense: 0.3 },
  [StatType.WIS]: { mp: 8, magicDefense: 0.8, healAmount: 0.02 },
};

// ---- Achievement System ----
export enum AchievementCategory {
  COMBAT = "combat",
  VOCABULARY = "vocabulary",
  EXPLORATION = "exploration",
  COLLECTION = "collection",
  SOCIAL = "social",
  SPECIAL = "special",
}

export interface AchievementDefinition {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  category: AchievementCategory;
  icon: string;
  requirement: {
    type: string;
    target?: string;
    count: number;
  };
  reward?: {
    exp?: number;
    gold?: number;
    title?: string;
    titleKo?: string;
  };
  hidden?: boolean;
}

// ---- Crafting System ----
export interface CraftingRecipe {
  id: string;
  name: string;
  nameKo: string;
  resultItemId: string;
  resultCount: number;
  materials: Array<{ itemId: string; count: number }>;
  goldCost: number;
  level: number;
  category: string; // "weapon", "armor", "consumable", "accessory"
  quizRequired?: boolean;
}

// ---- Party System ----
export interface PartyMember {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  playerClass: PlayerClass;
}

export interface PartyData {
  id: string;
  leaderId: string;
  members: PartyMember[];
  maxSize: number;
}

// ---- Enhancement Glow Colors ----
export function getEnhanceColor(level: number): string | null {
  if (level >= 10) return "#FF4444"; // red
  if (level >= 7) return "#FFD700"; // yellow/gold
  if (level >= 4) return "#4488FF"; // blue
  return null;
}

export function getEnhanceDisplayName(
  baseName: string,
  enhancement?: number,
): string {
  if (!enhancement || enhancement <= 0) return baseName;
  let color = getEnhanceColor(enhancement);
  // Return name with enhancement prefix
  return `+${enhancement} ${baseName}`;
}

// ---- Karma Shop Price Multiplier ----
export function getKarmaShopMultiplier(karma: number): number {
  if (karma >= 0) return 1.0;
  if (karma >= -30) return 1.0;
  if (karma >= -50) return 1.2;
  if (karma >= -100) return 1.5;
  return 2.0; // karma < -100
}

// ---- Inventory Weight ----
export function getInventoryWeight(slotCount: number): {
  speedMultiplier: number;
  isHeavy: boolean;
  isFull: boolean;
} {
  let ratio = slotCount / MAX_INVENTORY_SLOTS;
  if (ratio >= 1.0)
    return { speedMultiplier: 0.6, isHeavy: true, isFull: true };
  if (ratio >= 0.8)
    return { speedMultiplier: 0.8, isHeavy: true, isFull: false };
  return { speedMultiplier: 1.0, isHeavy: false, isFull: false };
}

// ---- Respawn Invulnerability ----
export const RESPAWN_INVULN_DURATION = 3000; // 3 seconds
