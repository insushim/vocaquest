// ============================================
// VocaQuest Online - Server Configuration
// 100% Original Code - MIT License
// ============================================

import dotenv from "dotenv";
dotenv.config();

export const Config = {
  PORT: parseInt(process.env.PORT || "9001"),
  HOST: process.env.HOST || "0.0.0.0",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/vocaquest",
  SKIP_DATABASE: process.env.SKIP_DATABASE !== "false",
  CLIENT_DIR: process.env.CLIENT_DIR || "../client/dist",
  TICK_RATE: 20,
  MAP_WIDTH: 500,
  MAP_HEIGHT: 500,
};
