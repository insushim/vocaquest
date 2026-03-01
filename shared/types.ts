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

  // Ping
  PING = "ping",
  PONG = "pong",
}

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
  MAGE = "mage",
  ARCHER = "archer",
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
}

export interface PlayerData extends EntityData {
  type: EntityType.PLAYER;
  class: PlayerClass;
  stats: PlayerStats;
  karma: number;
  karmaTitle: string;
  gradeLevel: number;
  equipment: EquipmentSlots;
}

// ---- Mob ----
export enum MobBehavior {
  PASSIVE = "passive",
  AGGRESSIVE = "aggressive",
  BOSS = "boss",
}

export interface MobData extends EntityData {
  type: EntityType.MOB;
  mobId: string;
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

export interface ItemDefinition {
  id: string;
  name: string;
  nameKo: string;
  type: ItemType;
  equipSlot?: EquipSlot;
  attack?: number;
  defense?: number;
  hp?: number;
  mp?: number;
  speed?: number;
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
}

export interface InventorySlot {
  itemId: string;
  count: number;
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

export interface LootDrop {
  itemId: string;
  chance: number;
  minCount: number;
  maxCount: number;
}

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
  // Mage
  FIREBALL = "fireball",
  ICE_BLAST = "ice_blast",
  HEAL = "heal",
  // Archer
  POWER_SHOT = "power_shot",
  MULTI_SHOT = "multi_shot",
  EVASION = "evasion",
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
}

// ---- Constants ----
export const TILE_SIZE = 32;
export const TICK_RATE = 20;
export const TICK_INTERVAL = 1000 / TICK_RATE;
export const MAX_INVENTORY_SLOTS = 20;
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

export function expForLevel(level: number): number {
  return Math.floor(EXP_BASE * Math.pow(level, EXP_GROWTH));
}
