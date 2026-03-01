// ============================================
// VocaQuest Online - Client Entry Point
// ============================================

import Phaser from "phaser";
import { GameScene } from "./game/scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: window.innerWidth,
  height: window.innerHeight,
  pixelArt: true,
  backgroundColor: "#1a1a2e",
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // No physics - movement handled via tile-based logic
  render: {
    antialias: false,
    roundPixels: true,
  },
};

const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener("resize", () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

export default game;
