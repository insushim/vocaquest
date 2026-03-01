import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/ws": {
        target: "ws://localhost:9001",
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
