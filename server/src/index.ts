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
    await mongoose.default.connect(Config.MONGODB_URI);
    console.log("[Database] Connected to MongoDB");

    // Define player schema
    let playerSchema = new mongoose.default.Schema(
      {
        name: { type: String, required: true, unique: true, index: true },
        passwordHash: { type: String, required: true },
        playerClass: { type: String, required: true },
        level: { type: Number, default: 1 },
        exp: { type: Number, default: 0 },
        gold: { type: Number, default: 100 },
        x: { type: Number, default: 100 },
        y: { type: Number, default: 100 },
        karma: { type: Number, default: 0 },
        killStreak: { type: Number, default: 0 },
        totalKills: { type: Number, default: 0 },
        gradeLevel: { type: Number, default: 1 },
        inventory: { type: Array, default: [] },
        equipment: { type: Object, default: {} },
      },
      { timestamps: true },
    );

    let PlayerModel = mongoose.default.model("Player", playerSchema);

    setDatabase({
      async loadPlayer(name: string) {
        let doc = await PlayerModel.findOne({
          name: { $regex: new RegExp(`^${name}$`, "i") },
        }).lean();
        if (!doc) return null;
        return {
          name: doc.name as string,
          passwordHash: doc.passwordHash as string,
          playerClass: doc.playerClass as string,
          level: doc.level as number,
          exp: doc.exp as number,
          gold: doc.gold as number,
          x: doc.x as number,
          y: doc.y as number,
          karma: doc.karma as number,
          killStreak: doc.killStreak as number,
          totalKills: doc.totalKills as number,
          gradeLevel: doc.gradeLevel as number,
          inventory: (doc.inventory || []) as Array<{
            itemId: string;
            count: number;
          }>,
          equipment: (doc.equipment || {}) as Record<string, string | null>,
        } as any;
      },
      async savePlayer(data) {
        await PlayerModel.findOneAndUpdate(
          { name: { $regex: new RegExp(`^${data.name}$`, "i") } },
          {
            $set: {
              passwordHash: data.passwordHash,
              playerClass: data.playerClass,
              level: data.level,
              exp: data.exp,
              gold: data.gold,
              x: data.x,
              y: data.y,
              karma: data.karma,
              killStreak: data.killStreak,
              totalKills: data.totalKills,
              gradeLevel: data.gradeLevel,
              inventory: data.inventory,
              equipment: data.equipment,
            },
          },
          { upsert: true },
        );
      },
      async createPlayer(data) {
        await PlayerModel.create({
          name: data.name,
          passwordHash: data.passwordHash,
          playerClass: data.playerClass,
          level: data.level,
          exp: data.exp,
          gold: data.gold,
          x: data.x,
          y: data.y,
          karma: data.karma,
          killStreak: data.killStreak,
          totalKills: data.totalKills,
          gradeLevel: data.gradeLevel,
          inventory: data.inventory,
          equipment: data.equipment,
        });
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
