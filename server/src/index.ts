// ============================================
// VocaQuest Online - Server Entry Point
// 100% Original Code - MIT License
// ============================================

import dotenv from "dotenv";
import path from "path";
// Load .env from project root (silent fail if not found)
try {
  dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
} catch {
  // .env not found - using defaults
}

import express from "express";
import { createServer } from "http";
import { Config } from "./config";
import { GameServer, setDatabase } from "./network";

let app = express();

// Serve static client files
let clientDir = path.resolve(process.cwd(), Config.CLIENT_DIR);
app.use(express.static(clientDir));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// SPA fallback - serve index.html for client routes
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDir, "index.html"), (err) => {
    if (err) {
      res.status(404).send("Not found");
    }
  });
});

let httpServer = createServer(app);
let gameServer = new GameServer(httpServer);

// Optional MongoDB connection
async function connectDatabase(): Promise<void> {
  if (Config.SKIP_DATABASE) {
    console.log(
      "[Database] Skipped (SKIP_DATABASE=true, using in-memory store)",
    );
    return;
  }

  try {
    let mongoose = await import("mongoose");
    console.log("[Database] Connecting to MongoDB...");
    await mongoose.default.connect(Config.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("[Database] Connected to MongoDB successfully");

    // Clean up corrupted accounts (empty passwordHash from previous bug)
    let cleaned = await mongoose.default.connection
      .db!.collection("players")
      .deleteMany({ $or: [{ passwordHash: "" }, { passwordHash: null }] });
    if (cleaned.deletedCount > 0) {
      console.log(
        `[Database] Cleaned ${cleaned.deletedCount} corrupted accounts`,
      );
    }

    // Define player schema (strict: false allows saving any extra fields)
    let playerSchema = new mongoose.default.Schema(
      {
        name: { type: String, required: true, unique: true, index: true },
        passwordHash: { type: String, required: true },
        playerClass: { type: String, required: true },
        level: { type: Number, default: 1 },
        exp: { type: Number, default: 0 },
        gold: { type: Number, default: 100 },
        x: { type: Number, default: 250 },
        y: { type: Number, default: 250 },
        karma: { type: Number, default: 0 },
        killStreak: { type: Number, default: 0 },
        totalKills: { type: Number, default: 0 },
        gradeLevel: { type: Number, default: 1 },
        inventory: { type: Array, default: [] },
        equipment: { type: Object, default: {} },
        equipEnhancements: { type: Object, default: {} },
        allocatedStats: { type: Object, default: {} },
        statPoints: { type: Number, default: 0 },
        quests: { type: Array, default: [] },
        completedQuests: { type: Array, default: [] },
        achievements: { type: Array, default: [] },
        achievementProgress: { type: Object, default: {} },
        title: { type: String, default: "" },
        titleKo: { type: String, default: "" },
        lastLoginDate: { type: String, default: "" },
        loginStreak: { type: Number, default: 0 },
      },
      { timestamps: true, strict: false },
    );

    let PlayerModel = mongoose.default.model("Player", playerSchema);

    setDatabase({
      async loadPlayer(name: string) {
        let doc = await PlayerModel.findOne({
          name: { $regex: new RegExp(`^${name}$`, "i") },
        })
          .lean()
          .catch((err: unknown) => {
            console.error(`[Database] loadPlayer error for ${name}:`, err);
            return null;
          });
        if (!doc) return null;
        // Return all fields - strict:false ensures everything is saved/loaded
        let result: any = { ...doc };
        // Rename _id field issues
        delete result._id;
        delete result.__v;
        return result;
      },
      async savePlayer(data) {
        let { name, ...updateData } = data as any;
        await PlayerModel.findOneAndUpdate(
          { name: name },
          { $set: { ...updateData, name } },
          { upsert: true },
        );
      },
      async createPlayer(data) {
        await PlayerModel.create(data);
      },
    });
  } catch (err) {
    console.error("[Database] MongoDB connection failed:", err);
    console.log("[Database] Falling back to in-memory store");
  }
}

// Start server
async function main(): Promise<void> {
  await connectDatabase();

  gameServer.start();

  httpServer.listen(Config.PORT, Config.HOST, () => {
    console.log("============================================");
    console.log("  VocaQuest Online - Server Started");
    console.log("============================================");
    console.log(`  Host: ${Config.HOST}`);
    console.log(`  Port: ${Config.PORT}`);
    console.log(`  Client: ${clientDir}`);
    console.log(
      `  Database: ${Config.SKIP_DATABASE ? "In-Memory" : "MongoDB"}`,
    );
    console.log(`  Tick Rate: ${Config.TICK_RATE} Hz`);
    console.log(`  Map Size: ${Config.MAP_WIDTH}x${Config.MAP_HEIGHT}`);
    console.log("============================================");
  });
}

main().catch((err) => {
  console.error("[Fatal] Server failed to start:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[Server] Shutting down...");
  gameServer.stop();
  httpServer.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM received, shutting down...");
  gameServer.stop();
  httpServer.close();
  process.exit(0);
});
