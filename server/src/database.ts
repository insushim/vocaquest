// ============================================
// VocaQuest Online - Database Layer
// 100% Original Code - MIT License
// ============================================

import mongoose, { Schema, type Document } from "mongoose";
import { Config } from "./config";
import type { InventorySlot, EquipmentSlots } from "../../shared/types";
import { EquipSlot, PlayerClass } from "../../shared/types";

// ---- Player Document Interface ----
export interface IPlayerDocument extends Document {
  username: string;
  passwordHash: string;
  class: PlayerClass;
  level: number;
  exp: number;
  hp: number;
  mp: number;
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  gold: number;
  karma: number;
  killStreak: number;
  totalKills: number;
  x: number;
  y: number;
  gradeLevel: number;
  inventory: InventorySlot[];
  equipment: EquipmentSlots;
  createdAt: Date;
  lastLogin: Date;
}

// ---- Player Save/Load Data ----
export interface PlayerSaveData {
  username: string;
  passwordHash: string;
  class: PlayerClass;
  level: number;
  exp: number;
  hp: number;
  mp: number;
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  gold: number;
  karma: number;
  killStreak: number;
  totalKills: number;
  x: number;
  y: number;
  gradeLevel: number;
  inventory: InventorySlot[];
  equipment: EquipmentSlots;
  createdAt?: Date;
  lastLogin?: Date;
}

// ---- Default equipment ----
function defaultEquipment(): EquipmentSlots {
  return {
    [EquipSlot.WEAPON]: null,
    [EquipSlot.HELMET]: null,
    [EquipSlot.CHESTPLATE]: null,
    [EquipSlot.LEGS]: null,
    [EquipSlot.BOOTS]: null,
    [EquipSlot.SHIELD]: null,
    [EquipSlot.RING]: null,
    [EquipSlot.PENDANT]: null,
  };
}

// ---- Mongoose Schema ----
let playerSchema = new Schema<IPlayerDocument>({
  username: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  class: {
    type: String,
    enum: Object.values(PlayerClass),
    default: PlayerClass.WARRIOR,
  },
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  hp: { type: Number, default: 100 },
  mp: { type: Number, default: 50 },
  maxHp: { type: Number, default: 100 },
  maxMp: { type: Number, default: 50 },
  attack: { type: Number, default: 10 },
  defense: { type: Number, default: 5 },
  speed: { type: Number, default: 3 },
  gold: { type: Number, default: 100 },
  karma: { type: Number, default: 0 },
  killStreak: { type: Number, default: 0 },
  totalKills: { type: Number, default: 0 },
  x: { type: Number, default: 100 },
  y: { type: Number, default: 100 },
  gradeLevel: { type: Number, default: 3 },
  inventory: {
    type: [
      {
        itemId: { type: String, required: true },
        count: { type: Number, required: true, default: 1 },
      },
    ],
    default: [],
  },
  equipment: {
    type: Schema.Types.Mixed,
    default: defaultEquipment,
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
});

let PlayerModel = mongoose.model<IPlayerDocument>("Player", playerSchema);

// ---- In-memory storage (used when SKIP_DATABASE is true) ----
let memoryStore = new Map<string, PlayerSaveData>();

// ---- Connection ----
let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (Config.SKIP_DATABASE) {
    console.log("[Database] SKIP_DATABASE=true, using in-memory storage");
    isConnected = true;
    return;
  }

  let maxRetries = 5;
  let retryDelay = 3000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[Database] Connecting to MongoDB (attempt ${attempt}/${maxRetries})...`,
      );
      await mongoose.connect(Config.MONGODB_URI);
      isConnected = true;
      console.log("[Database] Connected to MongoDB successfully");
      return;
    } catch (err) {
      console.error(`[Database] Connection attempt ${attempt} failed:`, err);
      if (attempt < maxRetries) {
        console.log(`[Database] Retrying in ${retryDelay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryDelay *= 2;
      }
    }
  }

  console.error(
    "[Database] All connection attempts failed. Falling back to in-memory storage.",
  );
  isConnected = true;
}

export async function disconnectDatabase(): Promise<void> {
  if (!Config.SKIP_DATABASE && mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console.log("[Database] Disconnected from MongoDB");
  }
  isConnected = false;
}

// ---- Player CRUD ----

export async function createPlayer(
  data: PlayerSaveData,
): Promise<PlayerSaveData | null> {
  if (Config.SKIP_DATABASE) {
    if (memoryStore.has(data.username)) {
      return null;
    }
    let now = new Date();
    let playerData: PlayerSaveData = {
      ...data,
      equipment: data.equipment || defaultEquipment(),
      inventory: data.inventory || [],
      createdAt: now,
      lastLogin: now,
    };
    memoryStore.set(data.username, playerData);
    return playerData;
  }

  try {
    let doc = new PlayerModel(data);
    let saved = await doc.save();
    return docToSaveData(saved);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return null; // Duplicate username
    }
    throw err;
  }
}

export async function loadPlayer(
  username: string,
): Promise<PlayerSaveData | null> {
  if (Config.SKIP_DATABASE) {
    return memoryStore.get(username) || null;
  }

  let doc = await PlayerModel.findOne({ username });
  if (!doc) return null;

  // Update last login
  doc.lastLogin = new Date();
  await doc.save();

  return docToSaveData(doc);
}

export async function savePlayer(
  username: string,
  data: Partial<PlayerSaveData>,
): Promise<void> {
  if (Config.SKIP_DATABASE) {
    let existing = memoryStore.get(username);
    if (existing) {
      memoryStore.set(username, {
        ...existing,
        ...data,
        lastLogin: new Date(),
      });
    }
    return;
  }

  await PlayerModel.updateOne(
    { username },
    { $set: { ...data, lastLogin: new Date() } },
  );
}

export async function deletePlayer(username: string): Promise<boolean> {
  if (Config.SKIP_DATABASE) {
    return memoryStore.delete(username);
  }

  let result = await PlayerModel.deleteOne({ username });
  return result.deletedCount > 0;
}

export async function findPlayerByUsername(
  username: string,
): Promise<PlayerSaveData | null> {
  if (Config.SKIP_DATABASE) {
    return memoryStore.get(username) || null;
  }

  let doc = await PlayerModel.findOne({ username });
  return doc ? docToSaveData(doc) : null;
}

export async function getPlayerCount(): Promise<number> {
  if (Config.SKIP_DATABASE) {
    return memoryStore.size;
  }

  return PlayerModel.countDocuments();
}

// ---- Helpers ----

function docToSaveData(doc: IPlayerDocument): PlayerSaveData {
  return {
    username: doc.username,
    passwordHash: doc.passwordHash,
    class: doc.class,
    level: doc.level,
    exp: doc.exp,
    hp: doc.hp,
    mp: doc.mp,
    maxHp: doc.maxHp,
    maxMp: doc.maxMp,
    attack: doc.attack,
    defense: doc.defense,
    speed: doc.speed,
    gold: doc.gold,
    karma: doc.karma,
    killStreak: doc.killStreak,
    totalKills: doc.totalKills,
    x: doc.x,
    y: doc.y,
    gradeLevel: doc.gradeLevel,
    inventory: doc.inventory.map((slot) => ({
      itemId: slot.itemId,
      count: slot.count,
    })),
    equipment: doc.equipment || defaultEquipment(),
    createdAt: doc.createdAt,
    lastLogin: doc.lastLogin,
  };
}
