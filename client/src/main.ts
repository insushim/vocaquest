// ============================================
// VocaQuest Online - Client Entry Point
// ============================================

import Phaser from "phaser";
import { GameScene } from "./game/scenes/GameScene";
import { soundEngine } from "./game/sound";

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

// Wire up volume sliders
const masterSlider = document.getElementById(
  "master-volume",
) as HTMLInputElement;
const bgmSlider = document.getElementById("bgm-volume") as HTMLInputElement;
const sfxSlider = document.getElementById("sfx-volume") as HTMLInputElement;

if (masterSlider) {
  masterSlider.addEventListener("input", () => {
    soundEngine.setMasterVolume(parseInt(masterSlider.value, 10) / 100);
  });
}
if (bgmSlider) {
  bgmSlider.addEventListener("input", () => {
    soundEngine.setBgmVolume(parseInt(bgmSlider.value, 10) / 100);
  });
}
if (sfxSlider) {
  sfxSlider.addEventListener("input", () => {
    soundEngine.setSfxVolume(parseInt(sfxSlider.value, 10) / 100);
  });
}

export default game;
