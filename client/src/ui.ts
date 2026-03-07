// ============================================
// VocaQuest Online - UI Manager
// Handles all HTML-based UI elements
// ============================================

import {
  PacketType,
  PlayerClass,
  PlayerStats,
  EquipmentSlots,
  EquipSlot,
  InventorySlot,
  QuizQuestion,
  SkillId,
  ItemType,
  MAX_CHAT_LENGTH,
  MAX_INVENTORY_SLOTS,
  MapData,
  EntityType,
  EntityData,
  Position,
} from "@shared/types";
import { socket } from "./network";

// ---- Skill definitions for display ----
interface SkillDisplay {
  id: SkillId;
  nameKo: string;
  icon: string;
  mpCost: number;
  cooldown: number;
}

const CLASS_SKILLS: Record<PlayerClass, SkillDisplay[]> = {
  [PlayerClass.WARRIOR]: [
    {
      id: SkillId.SLASH,
      nameKo: "베기",
      icon: "\u2694",
      mpCost: 10,
      cooldown: 3,
    },
    {
      id: SkillId.SHIELD_BASH,
      nameKo: "방패강타",
      icon: "\u26E8",
      mpCost: 15,
      cooldown: 5,
    },
    {
      id: SkillId.WAR_CRY,
      nameKo: "전투함성",
      icon: "\uD83D\uDCA2",
      mpCost: 25,
      cooldown: 20,
    },
    {
      id: SkillId.BERSERK,
      nameKo: "광전사",
      icon: "\uD83D\uDD25",
      mpCost: 35,
      cooldown: 30,
    },
    {
      id: SkillId.GROUND_SLAM,
      nameKo: "대지강타",
      icon: "\uD83D\uDCA5",
      mpCost: 30,
      cooldown: 8,
    },
    {
      id: SkillId.WHIRLWIND,
      nameKo: "회전참격",
      icon: "\uD83C\uDF00",
      mpCost: 40,
      cooldown: 12,
    },
  ],
  [PlayerClass.KNIGHT]: [
    {
      id: SkillId.HOLY_STRIKE,
      nameKo: "신성일격",
      icon: "\u2728",
      mpCost: 12,
      cooldown: 3,
    },
    {
      id: SkillId.DIVINE_SHIELD,
      nameKo: "신성방패",
      icon: "\uD83D\uDEE1",
      mpCost: 30,
      cooldown: 25,
    },
    {
      id: SkillId.PROVOKE,
      nameKo: "도발",
      icon: "\uD83D\uDCA2",
      mpCost: 15,
      cooldown: 8,
    },
    {
      id: SkillId.HOLY_BLESSING,
      nameKo: "축복",
      icon: "\uD83D\uDC9A",
      mpCost: 35,
      cooldown: 15,
    },
    {
      id: SkillId.JUDGMENT,
      nameKo: "심판",
      icon: "\u2694",
      mpCost: 40,
      cooldown: 10,
    },
    {
      id: SkillId.GUARDIAN_AURA,
      nameKo: "수호오라",
      icon: "\uD83D\uDCAB",
      mpCost: 50,
      cooldown: 45,
    },
  ],
  [PlayerClass.MAGE]: [
    {
      id: SkillId.FIREBALL,
      nameKo: "파이어볼",
      icon: "\uD83D\uDD25",
      mpCost: 15,
      cooldown: 4,
    },
    {
      id: SkillId.ICE_BLAST,
      nameKo: "아이스블래스트",
      icon: "\u2744",
      mpCost: 20,
      cooldown: 6,
    },
    {
      id: SkillId.HEAL,
      nameKo: "힐",
      icon: "\uD83D\uDC9A",
      mpCost: 30,
      cooldown: 8,
    },
    {
      id: SkillId.LIGHTNING_BOLT,
      nameKo: "라이트닝볼트",
      icon: "\u26A1",
      mpCost: 25,
      cooldown: 5,
    },
    {
      id: SkillId.METEOR,
      nameKo: "메테오",
      icon: "\u2604",
      mpCost: 60,
      cooldown: 20,
    },
    {
      id: SkillId.MAGIC_BARRIER,
      nameKo: "마법장벽",
      icon: "\uD83D\uDEE1",
      mpCost: 40,
      cooldown: 30,
    },
  ],
  [PlayerClass.ARCHER]: [
    {
      id: SkillId.POWER_SHOT,
      nameKo: "파워샷",
      icon: "\uD83C\uDFF9",
      mpCost: 10,
      cooldown: 3,
    },
    {
      id: SkillId.MULTI_SHOT,
      nameKo: "멀티샷",
      icon: "\uD83C\uDF1F",
      mpCost: 20,
      cooldown: 6,
    },
    {
      id: SkillId.EVASION,
      nameKo: "회피",
      icon: "\uD83D\uDCA8",
      mpCost: 25,
      cooldown: 15,
    },
    {
      id: SkillId.POISON_ARROW,
      nameKo: "독화살",
      icon: "\u2620",
      mpCost: 18,
      cooldown: 5,
    },
    {
      id: SkillId.EXPLOSIVE_ARROW,
      nameKo: "폭발화살",
      icon: "\uD83D\uDCA5",
      mpCost: 30,
      cooldown: 10,
    },
    {
      id: SkillId.EAGLE_EYE,
      nameKo: "매의눈",
      icon: "\uD83E\uDD85",
      mpCost: 20,
      cooldown: 25,
    },
  ],
};

// ---- Equipment slot label map ----
const EQUIP_SLOT_NAMES: Record<string, string> = {
  weapon: "\uBB34\uAE30",
  helmet: "\uD22C\uAD6C",
  chestplate: "\uAC11\uC637",
  shield: "\uBC29\uD328",
  legs: "\uD558\uC758",
  boots: "\uC2E0\uBC1C",
  ring: "\uBC18\uC9C0",
  pendant: "\uBAA9\uAC78\uC774",
};

// ---- Item type names ----
const ITEM_TYPE_NAMES: Record<string, string> = {
  weapon: "\uBB34\uAE30",
  helmet: "\uD22C\uAD6C",
  chestplate: "\uAC11\uC637",
  legs: "\uD558\uC758",
  boots: "\uC2E0\uBC1C",
  shield: "\uBC29\uD328",
  ring: "\uBC18\uC9C0",
  pendant: "\uBAA9\uAC78\uC774",
  consumable: "\uC18C\uBAA8\uD488",
  material: "\uC7AC\uB8CC",
  quest: "\uD034\uC2A4\uD2B8",
  tool: "\uB3C4\uAD6C",
  scroll: "\uC8FC\uBB38\uC11C",
};

class UIManager {
  // ---- DOM element references ----
  private loginScreen!: HTMLElement;
  private loginUsername!: HTMLInputElement;
  private loginPassword!: HTMLInputElement;
  private loginClass!: HTMLSelectElement;
  private loginError!: HTMLElement;
  private btnLogin!: HTMLElement;
  private btnRegister!: HTMLElement;

  private hud!: HTMLElement;
  private hpBar!: HTMLElement;
  private mpBar!: HTMLElement;
  private expBar!: HTMLElement;
  private hpText!: HTMLElement;
  private mpText!: HTMLElement;
  private expText!: HTMLElement;
  private hudLevelNum!: HTMLElement;
  private hudGold!: HTMLElement;

  private quizPopup!: HTMLElement;
  private quizWord!: HTMLElement;
  private quizCategory!: HTMLElement;
  private quizOptions!: HTMLElement;
  private quizTimerBar!: HTMLElement;
  private quizResult!: HTMLElement;

  private chatBox!: HTMLElement;
  private chatMessages!: HTMLElement;
  private chatInput!: HTMLInputElement;
  private chatSend!: HTMLElement;

  private inventoryPanel!: HTMLElement;
  private inventoryGrid!: HTMLElement;
  private invGold!: HTMLElement;
  private invClose!: HTMLElement;
  private equipmentSlots!: HTMLElement;

  private shopPanel!: HTMLElement;
  private shopTitle!: HTMLElement;
  private shopItems!: HTMLElement;
  private shopClose!: HTMLElement;

  private notificationArea!: HTMLElement;

  private minimap!: HTMLElement;
  private minimapCanvas!: HTMLCanvasElement;
  private minimapCtx!: CanvasRenderingContext2D;

  private karmaDisplay!: HTMLElement;
  private karmaTitleText!: HTMLElement;
  private karmaValueText!: HTMLElement;

  private skillsBar!: HTMLElement;
  private gradeSelector!: HTMLElement;
  private gradeSelect!: HTMLSelectElement;

  private tooltip!: HTMLElement;
  private ttName!: HTMLElement;
  private ttType!: HTMLElement;
  private ttStats!: HTMLElement;
  private ttDesc!: HTMLElement;
  private ttPrice!: HTMLElement;

  private statPanel!: HTMLElement;
  private statClose!: HTMLElement;
  private statPointsEl!: HTMLElement;
  private hudStatBtn!: HTMLElement;

  private enhancePanel!: HTMLElement;
  private enhanceClose!: HTMLElement;
  private enhanceItemSlot!: HTMLElement;
  private enhanceScrollSlot!: HTMLElement;
  private enhanceBtn!: HTMLElement;
  private enhanceResultText!: HTMLElement;

  // ---- State ----
  private currentPlayerClass: PlayerClass = PlayerClass.WARRIOR;
  private currentSkills: SkillDisplay[] = [];
  private skillCooldowns: Map<number, number> = new Map();
  private inventory: InventorySlot[] = [];
  private equipment: EquipmentSlots = {
    [EquipSlot.WEAPON]: null,
    [EquipSlot.HELMET]: null,
    [EquipSlot.CHESTPLATE]: null,
    [EquipSlot.LEGS]: null,
    [EquipSlot.BOOTS]: null,
    [EquipSlot.SHIELD]: null,
    [EquipSlot.RING]: null,
    [EquipSlot.PENDANT]: null,
  };
  private quizTimerAnimation: number | null = null;
  private currentQuizAnswer: string | null = null;
  private chatFocused = false;
  private currentShopItems: any[] = [];
  // Item definitions cache (received from server with inventory data)
  private itemDefs: Map<string, any> = new Map();
  private enhanceItemIndex: number = -1;
  private enhanceScrollIndex: number = -1;
  private isEnhanceMode: boolean = false;

  // Character creation stats
  private creationStats: Record<string, number> = {
    str: 0,
    dex: 0,
    int: 0,
    con: 0,
    wis: 0,
  };
  private creationPointsTotal: number = 10;
  private isRegisterMode: boolean = false;

  // Auto-attack
  private autoAttackEnabled: boolean = false;
  private autoAttackBtn!: HTMLElement;

  // Kill combo
  private comboCount: number = 0;
  private comboTimer: number | null = null;
  private comboDisplay!: HTMLElement;
  private comboCountEl!: HTMLElement;
  private comboBonusEl!: HTMLElement;

  // Death screen
  private deathScreen!: HTMLElement;
  private deathRespawnBtn!: HTMLElement;
  private deathTimer!: HTMLElement;
  private deathPenalty!: HTMLElement;
  private deathMessage!: HTMLElement;

  // Zone name
  private zoneNameEl!: HTMLElement;
  private zoneNameText!: HTMLElement;
  private zoneLevelText!: HTMLElement;
  private currentZone: string = "";

  // Boss announce
  private bossAnnounce!: HTMLElement;
  private bossAnnounceText!: HTMLElement;
  private bossAnnounceSub!: HTMLElement;

  // Potion quickslot
  private potionQuickslot!: HTMLElement;
  private potionHpCount!: HTMLElement;
  private potionMpCount!: HTMLElement;

  // Map data ref for zone detection
  private mapZones: Array<{
    id: string;
    nameKo: string;
    x: number;
    y: number;
    width: number;
    height: number;
    levelRange: [number, number];
  }> = [];
  private playerX: number = 0;
  private playerY: number = 0;

  constructor() {
    // Wait for DOM
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      this.init();
    }
  }

  private init(): void {
    this.cacheElements();
    this.setupLoginHandlers();
    this.setupChatInput();
    this.setupInventoryHandlers();
    this.setupShopHandlers();
    this.setupSkillHandlers();
    this.setupGradeSelector();
    this.setupTooltip();
    this.setupStatPanel();
    this.setupEnhancePanel();
    this.setupCreationStats();
    this.setupAutoAttack();
    this.setupDeathScreen();
    this.setupPotionQuickslot();
    this.setupSocketListeners();
  }

  // ================================================
  // DOM Element Caching
  // ================================================

  private cacheElements(): void {
    this.loginScreen = document.getElementById("login-screen")!;
    this.loginUsername = document.getElementById(
      "login-username",
    ) as HTMLInputElement;
    this.loginPassword = document.getElementById(
      "login-password",
    ) as HTMLInputElement;
    this.loginClass = document.getElementById(
      "login-class",
    ) as HTMLSelectElement;
    this.loginError = document.getElementById("login-error")!;
    this.btnLogin = document.getElementById("btn-login")!;
    this.btnRegister = document.getElementById("btn-register")!;

    this.hud = document.getElementById("hud")!;
    this.hpBar = document.getElementById("hp-bar")!;
    this.mpBar = document.getElementById("mp-bar")!;
    this.expBar = document.getElementById("exp-bar")!;
    this.hpText = document.getElementById("hp-text")!;
    this.mpText = document.getElementById("mp-text")!;
    this.expText = document.getElementById("exp-text")!;
    this.hudLevelNum = document.getElementById("hud-level-num")!;
    this.hudGold = document.getElementById("hud-gold")!;

    this.quizPopup = document.getElementById("quiz-popup")!;
    this.quizWord = document.getElementById("quiz-word")!;
    this.quizCategory = document.getElementById("quiz-category")!;
    this.quizOptions = document.getElementById("quiz-options")!;
    this.quizTimerBar = document.getElementById("quiz-timer-bar")!;
    this.quizResult = document.getElementById("quiz-result")!;

    this.chatBox = document.getElementById("chat-box")!;
    this.chatMessages = document.getElementById("chat-messages")!;
    this.chatInput = document.getElementById("chat-input") as HTMLInputElement;
    this.chatSend = document.getElementById("chat-send")!;

    this.inventoryPanel = document.getElementById("inventory-panel")!;
    this.inventoryGrid = document.getElementById("inventory-grid")!;
    this.invGold = document.getElementById("inv-gold")!;
    this.invClose = document.getElementById("inv-close")!;
    this.equipmentSlots = document.getElementById("equipment-slots")!;

    this.shopPanel = document.getElementById("shop-panel")!;
    this.shopTitle = document.getElementById("shop-title")!;
    this.shopItems = document.getElementById("shop-items")!;
    this.shopClose = document.getElementById("shop-close")!;

    this.notificationArea = document.getElementById("notification-area")!;

    this.minimap = document.getElementById("minimap")!;
    this.minimapCanvas = document.getElementById(
      "minimap-canvas",
    ) as HTMLCanvasElement;
    this.minimapCtx = this.minimapCanvas.getContext("2d")!;

    this.karmaDisplay = document.getElementById("karma-display")!;
    this.karmaTitleText = document.getElementById("karma-title-text")!;
    this.karmaValueText = document.getElementById("karma-value-text")!;

    this.skillsBar = document.getElementById("skills-bar")!;
    this.gradeSelector = document.getElementById("grade-selector")!;
    this.gradeSelect = document.getElementById(
      "grade-select",
    ) as HTMLSelectElement;

    this.tooltip = document.getElementById("item-tooltip")!;
    this.ttName = document.getElementById("tt-name")!;
    this.ttType = document.getElementById("tt-type")!;
    this.ttStats = document.getElementById("tt-stats")!;
    this.ttDesc = document.getElementById("tt-desc")!;
    this.ttPrice = document.getElementById("tt-price")!;

    this.statPanel = document.getElementById("stat-panel")!;
    this.statClose = document.getElementById("stat-close")!;
    this.statPointsEl = document.getElementById("stat-points")!;
    this.hudStatBtn = document.getElementById("hud-stat-btn")!;

    this.enhancePanel = document.getElementById("enhance-panel")!;
    this.enhanceClose = document.getElementById("enhance-close")!;
    this.enhanceItemSlot = document.getElementById("enhance-item-slot")!;
    this.enhanceScrollSlot = document.getElementById("enhance-scroll-slot")!;
    this.enhanceBtn = document.getElementById("enhance-btn")!;
    this.enhanceResultText = document.getElementById("enhance-result-text")!;

    // New elements
    this.autoAttackBtn = document.getElementById("hud-auto-attack")!;
    this.comboDisplay = document.getElementById("combo-display")!;
    this.comboCountEl = document.getElementById("combo-count")!;
    this.comboBonusEl = document.getElementById("combo-bonus")!;
    this.deathScreen = document.getElementById("death-screen")!;
    this.deathRespawnBtn = document.getElementById("death-respawn-btn")!;
    this.deathTimer = document.getElementById("death-timer")!;
    this.deathPenalty = document.getElementById("death-penalty")!;
    this.deathMessage = document.getElementById("death-message")!;
    this.zoneNameEl = document.getElementById("zone-name")!;
    this.zoneNameText = document.getElementById("zone-name-text")!;
    this.zoneLevelText = document.getElementById("zone-level-text")!;
    this.bossAnnounce = document.getElementById("boss-announce")!;
    this.bossAnnounceText = document.getElementById("boss-announce-text")!;
    this.bossAnnounceSub = document.getElementById("boss-announce-sub")!;
    this.potionQuickslot = document.getElementById("potion-quickslot")!;
    this.potionHpCount = document.getElementById("potion-hp-count")!;
    this.potionMpCount = document.getElementById("potion-mp-count")!;
  }

  // ================================================
  // Login UI
  // ================================================

  showLogin(): void {
    this.loginScreen.classList.remove("hidden");
    this.loginError.textContent = "";
    this.loginUsername.focus();
  }

  hideLogin(): void {
    this.loginScreen.classList.add("hidden");
  }

  showLoginError(message: string): void {
    this.loginError.textContent = message;
  }

  private setupLoginHandlers(): void {
    this.btnLogin.addEventListener("click", () => {
      this.doLogin();
    });

    this.btnRegister.addEventListener("click", () => {
      this.doRegister();
    });

    // Enter key on password field
    this.loginPassword.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.doLogin();
      }
    });

    this.loginUsername.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.loginPassword.focus();
      }
    });

    // Class preview update
    this.loginClass.addEventListener("change", () => {
      this.updateClassPreview();
    });
    this.updateClassPreview();
  }

  private updateClassPreview(): void {
    const cls = this.loginClass.value as PlayerClass;
    const previewIcon = document.getElementById("class-preview-icon");
    const previewDesc = document.getElementById("class-preview-desc");
    const recommended = document.getElementById("creation-recommended");

    const classInfo: Record<
      string,
      { color: string; desc: string; recommend: string }
    > = {
      warrior: {
        color: "#f44336",
        desc: "근접 물리 전투 전문가. 높은 HP와 공격력. 광전사 모드로 폭발적 데미지.",
        recommend: "추천: STR 5, CON 3, DEX 2",
      },
      knight: {
        color: "#42a5f5",
        desc: "팀의 방패. 높은 방어력과 신성 마법. 도발로 적 어그로 집중.",
        recommend: "추천: CON 4, STR 3, WIS 3",
      },
      mage: {
        color: "#7e57c2",
        desc: "강력한 광역 마법 딜러. MP 관리가 핵심. 치유와 텔레포트 가능.",
        recommend: "추천: INT 5, WIS 3, CON 2",
      },
      archer: {
        color: "#4caf50",
        desc: "원거리 물리 딜러. 높은 크리티컬과 회피. 독화살로 지속 데미지.",
        recommend: "추천: DEX 5, STR 3, CON 2",
      },
    };

    const info = classInfo[cls] || classInfo.warrior;
    if (previewIcon) previewIcon.style.background = info.color;
    if (previewDesc) previewDesc.textContent = info.desc;
    if (recommended) recommended.textContent = info.recommend;
  }

  private doLogin(): void {
    const username = this.loginUsername.value.trim();
    const password = this.loginPassword.value.trim();
    const playerClass = this.loginClass.value as PlayerClass;

    if (!username) {
      this.showLoginError(
        "\uB2C9\uB124\uC784\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.",
      );
      return;
    }
    if (!password) {
      this.showLoginError(
        "\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.",
      );
      return;
    }

    this.loginError.textContent = "";
    socket.send(PacketType.LOGIN, { name: username, password, playerClass });
  }

  private doRegister(): void {
    const username = this.loginUsername.value.trim();
    const password = this.loginPassword.value.trim();
    const playerClass = this.loginClass.value as PlayerClass;

    if (!username) {
      this.showLoginError(
        "\uB2C9\uB124\uC784\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.",
      );
      return;
    }
    if (username.length < 2 || username.length > 16) {
      this.showLoginError(
        "\uB2C9\uB124\uC784\uC740 2~16\uAE00\uC790\uC5EC\uC57C \uD569\uB2C8\uB2E4.",
      );
      return;
    }
    if (!password || password.length < 4) {
      this.showLoginError(
        "\uBE44\uBC00\uBC88\uD638\uB294 4\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.",
      );
      return;
    }

    // If not in register mode yet, show stat allocation panel first
    if (!this.isRegisterMode) {
      this.isRegisterMode = true;
      const creationStatsEl = document.getElementById("creation-stats");
      if (creationStatsEl) creationStatsEl.style.display = "block";
      this.btnRegister.textContent = "캐릭터 생성";
      this.showLoginError("스탯을 배분한 후 '캐릭터 생성'을 다시 누르세요.");
      return;
    }

    this.loginError.textContent = "";
    socket.send(PacketType.REGISTER, {
      name: username,
      password,
      playerClass,
      initialStats: { ...this.creationStats },
    });
  }

  // ================================================
  // HUD
  // ================================================

  showHUD(): void {
    this.hud.classList.add("visible");
    this.chatBox.classList.add("visible");
    this.minimap.classList.add("visible");
    this.karmaDisplay.classList.add("visible");
    this.skillsBar.classList.add("visible");
    this.gradeSelector.classList.add("visible");
    this.potionQuickslot.classList.add("visible");
  }

  hideHUD(): void {
    this.hud.classList.remove("visible");
    this.chatBox.classList.remove("visible");
    this.minimap.classList.remove("visible");
    this.karmaDisplay.classList.remove("visible");
    this.skillsBar.classList.remove("visible");
    this.gradeSelector.classList.remove("visible");
  }

  updateHP(hp: number, maxHp: number): void {
    const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    this.hpBar.style.width = pct + "%";
    this.hpText.textContent = `${Math.floor(hp)} / ${maxHp}`;
  }

  updateMP(mp: number, maxMp: number): void {
    const pct = Math.max(0, Math.min(100, (mp / maxMp) * 100));
    this.mpBar.style.width = pct + "%";
    this.mpText.textContent = `${Math.floor(mp)} / ${maxMp}`;
  }

  updateEXP(exp: number, expToLevel: number): void {
    const pct =
      expToLevel > 0 ? Math.max(0, Math.min(100, (exp / expToLevel) * 100)) : 0;
    this.expBar.style.width = pct + "%";
    this.expText.textContent = `${exp} / ${expToLevel}`;
  }

  updateLevel(level: number): void {
    this.hudLevelNum.textContent = String(level);
  }

  updateGold(gold: number): void {
    this.hudGold.textContent = `${gold.toLocaleString()} Gold`;
    this.invGold.textContent = `${gold.toLocaleString()} Gold`;
  }

  // ================================================
  // Quiz
  // ================================================

  showQuiz(question: QuizQuestion): void {
    this.quizWord.textContent = question.word;
    this.quizCategory.textContent = question.category || "";
    this.quizResult.textContent = "";
    this.quizResult.className = "quiz-result";
    this.currentQuizAnswer = question.correct;

    // Set up option buttons
    const buttons = this.quizOptions.querySelectorAll(".quiz-option");
    buttons.forEach((btn, i) => {
      const button = btn as HTMLButtonElement;
      button.textContent = question.options[i] || "";
      button.className = "quiz-option";
      button.disabled = false;
      button.onclick = () => {
        this.answerQuiz(i, question.options[i]);
      };
    });

    // Start timer animation
    this.quizTimerBar.classList.remove("animate");
    // Force reflow to restart animation
    void this.quizTimerBar.offsetWidth;
    this.quizTimerBar.classList.add("animate");

    // Auto-timeout after 15 seconds
    if (this.quizTimerAnimation !== null) {
      clearTimeout(this.quizTimerAnimation);
    }
    this.quizTimerAnimation = window.setTimeout(() => {
      this.quizTimerAnimation = null;
      // Time's up - send empty answer
      socket.send(PacketType.QUIZ_ANSWER, { answer: "" });
    }, 15000);

    this.quizPopup.classList.add("visible");
  }

  private answerQuiz(index: number, answer: string): void {
    // Disable all buttons
    const buttons = this.quizOptions.querySelectorAll(".quiz-option");
    buttons.forEach((btn) => {
      (btn as HTMLButtonElement).disabled = true;
    });

    // Cancel timer
    if (this.quizTimerAnimation !== null) {
      clearTimeout(this.quizTimerAnimation);
      this.quizTimerAnimation = null;
    }

    // Highlight selected
    const selectedBtn = buttons[index] as HTMLElement;
    if (answer === this.currentQuizAnswer) {
      selectedBtn.classList.add("correct");
    } else {
      selectedBtn.classList.add("wrong");
      // Highlight correct answer
      buttons.forEach((btn) => {
        if ((btn as HTMLElement).textContent === this.currentQuizAnswer) {
          (btn as HTMLElement).classList.add("correct");
        }
      });
    }

    // Send answer to server
    socket.send(PacketType.QUIZ_ANSWER, { answer });
  }

  hideQuiz(): void {
    this.quizPopup.classList.remove("visible");
    if (this.quizTimerAnimation !== null) {
      clearTimeout(this.quizTimerAnimation);
      this.quizTimerAnimation = null;
    }
  }

  showQuizResult(correct: boolean, reward?: string): void {
    if (correct) {
      this.quizResult.textContent = reward
        ? `\uC815\uB2F5! ${reward}`
        : "\uC815\uB2F5!";
      this.quizResult.className = "quiz-result correct";
    } else {
      this.quizResult.textContent = "\uC624\uB2F5...";
      this.quizResult.className = "quiz-result wrong";
    }

    // Auto-hide after 2 seconds
    setTimeout(() => {
      this.hideQuiz();
    }, 2000);
  }

  // ================================================
  // Chat
  // ================================================

  addChatMessage(
    sender: string,
    message: string,
    type: string = "normal",
  ): void {
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg";

    const senderSpan = document.createElement("span");
    senderSpan.className = "sender";

    if (type === "system") {
      senderSpan.classList.add("system");
      senderSpan.textContent = "[" + sender + "] ";
    } else if (type === "me") {
      senderSpan.classList.add("me");
      senderSpan.textContent = sender + ": ";
    } else {
      senderSpan.textContent = sender + ": ";
    }

    msgDiv.appendChild(senderSpan);
    msgDiv.appendChild(document.createTextNode(message));
    this.chatMessages.appendChild(msgDiv);

    // Limit to 50 messages
    while (this.chatMessages.childNodes.length > 50) {
      this.chatMessages.removeChild(this.chatMessages.firstChild!);
    }

    // Auto-scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  private setupChatInput(): void {
    this.chatInput.addEventListener("keydown", (e) => {
      e.stopPropagation(); // Prevent game from receiving key events while typing
      if (e.key === "Enter") {
        this.sendChat();
      }
      if (e.key === "Escape") {
        this.chatInput.blur();
      }
    });

    this.chatInput.addEventListener("focus", () => {
      this.chatFocused = true;
    });

    this.chatInput.addEventListener("blur", () => {
      this.chatFocused = false;
    });

    this.chatSend.addEventListener("click", () => {
      this.sendChat();
    });
  }

  private sendChat(): void {
    const message = this.chatInput.value.trim();
    if (!message) return;
    if (message.length > MAX_CHAT_LENGTH) return;

    socket.send(PacketType.CHAT, { message });
    this.chatInput.value = "";
  }

  isChatFocused(): boolean {
    return this.chatFocused;
  }

  focusChat(): void {
    this.chatInput.focus();
  }

  // ================================================
  // Inventory
  // ================================================

  toggleInventory(): void {
    if (this.inventoryPanel.classList.contains("visible")) {
      this.inventoryPanel.classList.remove("visible");
    } else {
      this.inventoryPanel.classList.add("visible");
      this.renderInventoryGrid();
    }
  }

  closeInventory(): void {
    this.inventoryPanel.classList.remove("visible");
  }

  updateInventory(
    slots: InventorySlot[],
    itemDefs?: Record<string, any>,
  ): void {
    this.inventory = slots;

    // Cache item definitions if provided
    if (itemDefs) {
      for (const [id, def] of Object.entries(itemDefs)) {
        this.itemDefs.set(id, def);
      }
    }

    this.renderInventoryGrid();
  }

  updateEquipment(
    equipment: EquipmentSlots,
    itemDefs?: Record<string, any>,
  ): void {
    this.equipment = equipment;

    if (itemDefs) {
      for (const [id, def] of Object.entries(itemDefs)) {
        this.itemDefs.set(id, def);
      }
    }

    this.renderEquipmentSlots();
  }

  private renderInventoryGrid(): void {
    this.inventoryGrid.innerHTML = "";

    for (let i = 0; i < MAX_INVENTORY_SLOTS; i++) {
      const slot = this.inventory[i];
      const slotDiv = document.createElement("div");
      slotDiv.className = "inv-slot";
      slotDiv.dataset.index = String(i);

      if (slot && slot.itemId) {
        const def = this.itemDefs.get(slot.itemId);
        const color = def?.color || "#888";
        let name = def?.nameKo || def?.name || slot.itemId;

        // Show enhancement level
        if (slot.enhancement && slot.enhancement > 0) {
          name = `+${slot.enhancement} ${name}`;
        }

        const icon = document.createElement("div");
        icon.className = "item-icon";
        icon.style.backgroundColor = color;
        slotDiv.appendChild(icon);

        if (slot.enhancement && slot.enhancement > 0) {
          const enhLabel = document.createElement("div");
          enhLabel.className = "item-enhance";
          enhLabel.textContent = `+${slot.enhancement}`;
          slotDiv.style.position = "relative";
          slotDiv.appendChild(enhLabel);
        }

        const nameLabel = document.createElement("div");
        nameLabel.className = "item-name";
        nameLabel.textContent = name;
        slotDiv.appendChild(nameLabel);

        if (slot.count > 1) {
          const countLabel = document.createElement("div");
          countLabel.className = "item-count";
          countLabel.textContent = String(slot.count);
          slotDiv.appendChild(countLabel);
        }

        // Click handling
        slotDiv.addEventListener("click", () => {
          if (this.isEnhanceMode) {
            // In enhance mode, select item or scroll
            if (def?.enhanceable) {
              this.selectEnhanceItem(i);
            } else if (def?.scrollType === "enhance") {
              this.selectEnhanceScroll(i);
            }
            return;
          }

          if (def?.equipSlot) {
            socket.send(PacketType.EQUIP_ITEM, { slotIndex: i });
          } else if (
            def?.type === ItemType.CONSUMABLE ||
            def?.type === ItemType.SCROLL
          ) {
            socket.send(PacketType.USE_ITEM, { slotIndex: i });
          }
        });

        // Hover for tooltip
        slotDiv.addEventListener("mouseenter", (e) => {
          this.showItemTooltip(def, e);
        });
        slotDiv.addEventListener("mousemove", (e) => {
          this.moveTooltip(e);
        });
        slotDiv.addEventListener("mouseleave", () => {
          this.hideTooltip();
        });
      }

      this.inventoryGrid.appendChild(slotDiv);
    }
  }

  private renderEquipmentSlots(): void {
    const slotElements = this.equipmentSlots.querySelectorAll(".equip-slot");
    slotElements.forEach((slotEl) => {
      const el = slotEl as HTMLElement;
      const slotName = el.dataset.slot as EquipSlot;
      const itemId = this.equipment[slotName];

      // Clear previous item indicator
      const existingIcon = el.querySelector(".item-icon");
      if (existingIcon) existingIcon.remove();

      if (itemId) {
        el.classList.add("filled");
        const def = this.itemDefs.get(itemId);
        const icon = document.createElement("div");
        icon.className = "item-icon";
        icon.style.backgroundColor = def?.color || "#888";
        icon.style.width = "20px";
        icon.style.height = "20px";
        el.insertBefore(icon, el.firstChild);

        el.onclick = () => {
          socket.send(PacketType.UNEQUIP_ITEM, { slot: slotName });
        };

        el.onmouseenter = (e) => {
          this.showItemTooltip(def, e);
        };
        el.onmousemove = (e) => {
          this.moveTooltip(e);
        };
        el.onmouseleave = () => {
          this.hideTooltip();
        };
      } else {
        el.classList.remove("filled");
        el.onclick = null;
        el.onmouseenter = null;
        el.onmouseleave = null;
      }
    });
  }

  private setupInventoryHandlers(): void {
    this.invClose.addEventListener("click", () => {
      this.closeInventory();
    });
  }

  // ================================================
  // Item Tooltip
  // ================================================

  private setupTooltip(): void {
    // Tooltip hides when mouse leaves
    document.addEventListener("click", () => {
      this.hideTooltip();
    });
  }

  private showItemTooltip(def: any, e: MouseEvent): void {
    if (!def) return;

    this.ttName.textContent = def.nameKo || def.name || "";
    this.ttType.textContent = ITEM_TYPE_NAMES[def.type] || def.type || "";

    // Build stats text
    const stats: string[] = [];
    if (def.attack) stats.push(`\uACF5\uACA9\uB825 +${def.attack}`);
    if (def.defense) stats.push(`\uBC29\uC5B4\uB825 +${def.defense}`);
    if (def.hp) stats.push(`HP +${def.hp}`);
    if (def.mp) stats.push(`MP +${def.mp}`);
    if (def.speed) stats.push(`\uC2A4\uD53C\uB4DC +${def.speed}`);
    if (def.critRate) stats.push(`\uCE58\uBA85\uD0C0 +${def.critRate}%`);
    if (def.critDamage)
      stats.push(`\uCE58\uBA85\uD0C0\uD53C\uD574 +${def.critDamage}`);
    if (def.magicAttack)
      stats.push(`\uB9C8\uBC95\uACF5\uACA9 +${def.magicAttack}`);
    if (def.magicDefense)
      stats.push(`\uB9C8\uBC95\uBC29\uC5B4 +${def.magicDefense}`);
    if (def.healAmount) stats.push(`HP \uD68C\uBCF5 ${def.healAmount}`);
    if (def.mpRestore) stats.push(`MP \uD68C\uBCF5 ${def.mpRestore}`);
    this.ttStats.textContent = stats.join("\n");

    this.ttDesc.textContent = def.descriptionKo || def.description || "";
    this.ttPrice.textContent = def.price
      ? `\uAC00\uACA9: ${def.price} Gold`
      : "";

    this.moveTooltip(e);
    this.tooltip.classList.add("visible");
  }

  private moveTooltip(e: MouseEvent): void {
    let x = e.clientX + 12;
    let y = e.clientY + 12;

    // Keep tooltip on screen
    const rect = this.tooltip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) {
      x = e.clientX - rect.width - 12;
    }
    if (y + rect.height > window.innerHeight) {
      y = e.clientY - rect.height - 12;
    }

    this.tooltip.style.left = x + "px";
    this.tooltip.style.top = y + "px";
  }

  private hideTooltip(): void {
    this.tooltip.classList.remove("visible");
  }

  // ================================================
  // Shop
  // ================================================

  openShop(shopData: {
    name: string;
    nameKo: string;
    items: any[];
    isEnhance?: boolean;
    shopId?: string;
  }): void {
    if (shopData.isEnhance || shopData.shopId === "__enhance__") {
      this.openEnhancePanel();
      return;
    }

    this.shopTitle.textContent =
      shopData.nameKo || shopData.name || "\uC0C1\uC810";
    this.currentShopItems = shopData.items || [];
    this.renderShopItems();
    this.shopPanel.classList.add("visible");
  }

  closeShop(): void {
    this.shopPanel.classList.remove("visible");
  }

  private renderShopItems(): void {
    this.shopItems.innerHTML = "";

    for (const item of this.currentShopItems) {
      const row = document.createElement("div");
      row.className = "shop-item";

      const icon = document.createElement("div");
      icon.className = "shop-item-icon";
      icon.style.backgroundColor = item.color || "#888";
      row.appendChild(icon);

      const info = document.createElement("div");
      info.className = "shop-item-info";

      const name = document.createElement("div");
      name.className = "shop-item-name";
      name.textContent = item.nameKo || item.name || item.id;
      info.appendChild(name);

      const desc = document.createElement("div");
      desc.className = "shop-item-desc";
      desc.textContent = item.descriptionKo || item.description || "";
      info.appendChild(desc);

      row.appendChild(info);

      const price = document.createElement("div");
      price.className = "shop-item-price";
      price.textContent = `${item.price} G`;
      row.appendChild(price);

      const buyBtn = document.createElement("button");
      buyBtn.className = "shop-buy-btn";
      buyBtn.textContent = "\uAD6C\uB9E4";
      buyBtn.addEventListener("click", () => {
        socket.send(PacketType.SHOP_BUY, { itemId: item.id });
      });
      row.appendChild(buyBtn);

      this.shopItems.appendChild(row);
    }
  }

  private setupShopHandlers(): void {
    this.shopClose.addEventListener("click", () => {
      this.closeShop();
      socket.send(PacketType.SHOP_CLOSE, {});
    });
  }

  // ================================================
  // Skills
  // ================================================

  updateSkills(playerClass: PlayerClass): void {
    this.currentPlayerClass = playerClass;
    this.currentSkills = CLASS_SKILLS[playerClass] || [];

    for (let i = 0; i < 6; i++) {
      const skill = this.currentSkills[i];
      const iconEl = document.getElementById(`skill-icon-${i}`);
      const nameEl = document.getElementById(`skill-name-${i}`);

      if (iconEl && nameEl) {
        if (skill) {
          iconEl.textContent = skill.icon;
          nameEl.textContent = skill.nameKo;
        } else {
          iconEl.textContent = "-";
          nameEl.textContent = "";
        }
      }
    }
  }

  useSkill(index: number): void {
    const skill = this.currentSkills[index];
    if (!skill) return;

    // Check cooldown
    if (this.skillCooldowns.has(index)) return;

    socket.send(PacketType.USE_SKILL, { skillId: skill.id });

    // Start cooldown display
    this.startSkillCooldown(index, skill.cooldown);
  }

  private startSkillCooldown(index: number, duration: number): void {
    const cdOverlay = document.getElementById(`skill-cd-${index}`);
    if (!cdOverlay) return;

    this.skillCooldowns.set(index, duration);
    let remaining = duration;
    cdOverlay.textContent = String(remaining);
    cdOverlay.classList.add("active");

    const interval = window.setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(interval);
        this.skillCooldowns.delete(index);
        cdOverlay.classList.remove("active");
        cdOverlay.textContent = "";
      } else {
        cdOverlay.textContent = String(remaining);
      }
    }, 1000);
  }

  private setupSkillHandlers(): void {
    const skillBtns = this.skillsBar.querySelectorAll(".skill-btn");
    skillBtns.forEach((btn) => {
      const el = btn as HTMLElement;
      el.addEventListener("click", () => {
        const index = parseInt(el.dataset.skill || "0", 10);
        this.useSkill(index);
      });
    });
  }

  // ================================================
  // Notifications
  // ================================================

  showNotification(message: string, type: string = "info"): void {
    const toast = document.createElement("div");
    toast.className = `notification-toast ${type}`;
    toast.textContent = message;
    this.notificationArea.appendChild(toast);

    // Auto-remove after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // ================================================
  // Karma
  // ================================================

  updateKarma(karma: number, title: string): void {
    this.karmaTitleText.textContent = title || "\uC2DC\uBBFC";
    this.karmaValueText.textContent = `\uCE74\uB974\uB9C8: ${karma}`;

    // Color based on karma
    if (karma >= 100) {
      this.karmaTitleText.style.color = "#4caf50";
    } else if (karma >= 0) {
      this.karmaTitleText.style.color = "#c8a84e";
    } else {
      this.karmaTitleText.style.color = "#f44336";
    }
  }

  // ================================================
  // Grade Selector
  // ================================================

  private setupGradeSelector(): void {
    this.gradeSelect.addEventListener("change", () => {
      const grade = parseInt(this.gradeSelect.value, 10);
      socket.send(PacketType.SET_GRADE_LEVEL, { gradeLevel: grade });
      this.showNotification(
        `${grade}\uD559\uB144 \uB2E8\uC5B4\uB85C \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
        "info",
      );
    });
  }

  setGradeLevel(grade: number): void {
    this.gradeSelect.value = String(grade);
  }

  // ================================================
  // Minimap
  // ================================================

  drawMinimap(
    mapData: MapData | null,
    playerPos: Position,
    entities: { type: EntityType; x: number; y: number }[],
  ): void {
    if (!mapData) return;

    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, w, h);

    // Scale: map tiles to minimap pixels
    const scaleX = w / mapData.width;
    const scaleY = h / mapData.height;

    // Draw simplified map (sample every few tiles for performance)
    const step = Math.max(1, Math.floor(mapData.width / w));
    for (let ty = 0; ty < mapData.height; ty += step) {
      for (let tx = 0; tx < mapData.width; tx += step) {
        const tile = mapData.tiles[ty]?.[tx];
        if (tile === undefined) continue;

        let color: string;
        switch (tile) {
          case 0:
            color = "#3a6830";
            break; // GRASS
          case 1:
            color = "#6b5540";
            break; // DIRT
          case 2:
            color = "#606060";
            break; // STONE
          case 3:
            color = "#3070a0";
            break; // WATER
          case 4:
            color = "#b09050";
            break; // SAND
          case 5:
            color = "#404040";
            break; // WALL
          case 6:
            color = "#1e4a15";
            break; // TREE
          case 7:
            color = "#807060";
            break; // FLOOR
          case 8:
            color = "#705010";
            break; // BRIDGE
          case 9:
            color = "#cc3500";
            break; // LAVA
          case 10:
            color = "#d0d0d0";
            break; // SNOW
          case 11:
            color = "#90b4d0";
            break; // ICE
          case 12:
            color = "#405020";
            break; // SWAMP
          case 13:
            color = "#1a3a1a";
            break; // DARK_GRASS
          case 14:
            color = "#2a2a2a";
            break; // DARK_STONE
          case 15:
            color = "#7040a0";
            break; // PORTAL
          default:
            color = "#1a1a2e";
        }

        ctx.fillStyle = color;
        ctx.fillRect(
          Math.floor(tx * scaleX),
          Math.floor(ty * scaleY),
          Math.max(1, Math.ceil(step * scaleX)),
          Math.max(1, Math.ceil(step * scaleY)),
        );
      }
    }

    // Draw entities
    for (const entity of entities) {
      const ex = Math.floor(entity.x * scaleX);
      const ey = Math.floor(entity.y * scaleY);

      switch (entity.type) {
        case EntityType.PLAYER:
          ctx.fillStyle = "#42a5f5"; // blue for other players
          ctx.fillRect(ex - 1, ey - 1, 3, 3);
          break;
        case EntityType.MOB:
          ctx.fillStyle = "#f44336"; // red for mobs
          ctx.fillRect(ex, ey, 2, 2);
          break;
        case EntityType.NPC:
          ctx.fillStyle = "#ffffff"; // white for NPCs
          ctx.fillRect(ex, ey, 2, 2);
          break;
      }
    }

    // Draw player (green, larger)
    const px = Math.floor(playerPos.x * scaleX);
    const py = Math.floor(playerPos.y * scaleY);
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(px - 2, py - 2, 5, 5);

    // Player border
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 2, py - 2, 5, 5);
  }

  // ================================================
  // Stat Allocation Panel
  // ================================================

  private setupStatPanel(): void {
    this.hudStatBtn.addEventListener("click", () => {
      this.toggleStatPanel();
    });

    this.statClose.addEventListener("click", () => {
      this.statPanel.classList.remove("visible");
    });

    // Stat add buttons
    const addBtns = document.querySelectorAll(".stat-add-btn");
    addBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const statType = (btn as HTMLElement).dataset.stat;
        if (statType) {
          socket.send(PacketType.ALLOCATE_STAT, { statType });
        }
      });
    });
  }

  toggleStatPanel(): void {
    if (this.statPanel.classList.contains("visible")) {
      this.statPanel.classList.remove("visible");
    } else {
      this.statPanel.classList.add("visible");
    }
  }

  updateStatPanel(stats: any): void {
    if (stats.statPoints !== undefined) {
      this.statPointsEl.textContent = String(stats.statPoints);
    }
    if (stats.allocatedStats) {
      const as = stats.allocatedStats;
      const strEl = document.getElementById("stat-str");
      const dexEl = document.getElementById("stat-dex");
      const intEl = document.getElementById("stat-int");
      const conEl = document.getElementById("stat-con");
      const wisEl = document.getElementById("stat-wis");
      if (strEl) strEl.textContent = String(as.str || 0);
      if (dexEl) dexEl.textContent = String(as.dex || 0);
      if (intEl) intEl.textContent = String(as.int || 0);
      if (conEl) conEl.textContent = String(as.con || 0);
      if (wisEl) wisEl.textContent = String(as.wis || 0);
    }
  }

  // ================================================
  // Enhancement Panel
  // ================================================

  private setupEnhancePanel(): void {
    this.enhanceClose.addEventListener("click", () => {
      this.closeEnhancePanel();
    });

    this.enhanceBtn.addEventListener("click", () => {
      if (this.enhanceItemIndex >= 0 && this.enhanceScrollIndex >= 0) {
        socket.send(PacketType.ENHANCE_ITEM, {
          itemSlotIndex: this.enhanceItemIndex,
          scrollSlotIndex: this.enhanceScrollIndex,
        });
      }
    });
  }

  openEnhancePanel(): void {
    this.isEnhanceMode = true;
    this.enhanceItemIndex = -1;
    this.enhanceScrollIndex = -1;
    this.enhanceItemSlot.innerHTML = "<span>\uC7A5\uBE44</span>";
    this.enhanceScrollSlot.innerHTML = "<span>\uC8FC\uBB38\uC11C</span>";
    this.enhanceResultText.textContent = "";
    this.enhanceResultText.className = "enhance-result";
    this.enhancePanel.classList.add("visible");

    // Also show inventory for selection
    if (!this.inventoryPanel.classList.contains("visible")) {
      this.inventoryPanel.classList.add("visible");
      this.renderInventoryGrid();
    }
  }

  closeEnhancePanel(): void {
    this.isEnhanceMode = false;
    this.enhancePanel.classList.remove("visible");
  }

  private selectEnhanceItem(slotIndex: number): void {
    this.enhanceItemIndex = slotIndex;
    const slot = this.inventory[slotIndex];
    if (slot) {
      const def = this.itemDefs.get(slot.itemId);
      let name = def?.nameKo || slot.itemId;
      if (slot.enhancement) name = `+${slot.enhancement} ${name}`;
      this.enhanceItemSlot.innerHTML = "";
      this.enhanceItemSlot.classList.add("filled");
      const icon = document.createElement("div");
      icon.className = "item-icon";
      icon.style.backgroundColor = def?.color || "#888";
      this.enhanceItemSlot.appendChild(icon);
      const label = document.createElement("span");
      label.textContent = name;
      label.style.fontSize = "10px";
      this.enhanceItemSlot.appendChild(label);
    }
  }

  private selectEnhanceScroll(slotIndex: number): void {
    this.enhanceScrollIndex = slotIndex;
    const slot = this.inventory[slotIndex];
    if (slot) {
      const def = this.itemDefs.get(slot.itemId);
      this.enhanceScrollSlot.innerHTML = "";
      this.enhanceScrollSlot.classList.add("filled");
      const icon = document.createElement("div");
      icon.className = "item-icon";
      icon.style.backgroundColor = def?.color || "#888";
      this.enhanceScrollSlot.appendChild(icon);
      const label = document.createElement("span");
      label.textContent = def?.nameKo || slot.itemId;
      label.style.fontSize = "10px";
      this.enhanceScrollSlot.appendChild(label);
    }
  }

  showEnhanceResult(
    success: boolean,
    destroyed: boolean,
    newLevel: number,
  ): void {
    if (success) {
      this.enhanceResultText.textContent = `\uAC15\uD654 \uC131\uACF5! +${newLevel}`;
      this.enhanceResultText.className = "enhance-result success";
    } else if (destroyed) {
      this.enhanceResultText.textContent =
        "\uAC15\uD654 \uC2E4\uD328! \uC544\uC774\uD15C \uD30C\uAD34!";
      this.enhanceResultText.className = "enhance-result fail";
    } else {
      this.enhanceResultText.textContent = `\uAC15\uD654 \uC2E4\uD328. +${newLevel}\uC73C\uB85C \uD558\uB77D`;
      this.enhanceResultText.className = "enhance-result fail";
    }

    // Reset selection
    this.enhanceItemIndex = -1;
    this.enhanceScrollIndex = -1;
    this.enhanceItemSlot.innerHTML = "<span>\uC7A5\uBE44</span>";
    this.enhanceItemSlot.classList.remove("filled");
    this.enhanceScrollSlot.innerHTML = "<span>\uC8FC\uBB38\uC11C</span>";
    this.enhanceScrollSlot.classList.remove("filled");
  }

  // ================================================
  // Close All Panels
  // ================================================

  closeAllPanels(): void {
    this.closeInventory();
    this.closeShop();
    this.closeEnhancePanel();
    this.statPanel.classList.remove("visible");
    this.hideQuiz();
  }

  isAnyPanelOpen(): boolean {
    return (
      this.inventoryPanel.classList.contains("visible") ||
      this.shopPanel.classList.contains("visible") ||
      this.quizPopup.classList.contains("visible") ||
      this.enhancePanel.classList.contains("visible")
    );
  }

  // ================================================
  // Character Creation Stats
  // ================================================

  private setupCreationStats(): void {
    const btns = document.querySelectorAll(".cs-btn");
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const stat = (btn as HTMLElement).dataset.cstat || "";
        const dir = parseInt((btn as HTMLElement).dataset.dir || "0");
        this.adjustCreationStat(stat, dir);
      });
    });
  }

  private adjustCreationStat(stat: string, dir: number): void {
    const current = this.creationStats[stat] || 0;
    const used = Object.values(this.creationStats).reduce((a, b) => a + b, 0);

    if (dir > 0) {
      if (used >= this.creationPointsTotal) return;
      if (current >= 7) return; // max per stat
      this.creationStats[stat] = current + 1;
    } else {
      if (current <= 0) return;
      this.creationStats[stat] = current - 1;
    }

    // Update display
    const el = document.getElementById(`cs-${stat}`);
    if (el) el.textContent = String(this.creationStats[stat]);
    const pointsEl = document.getElementById("creation-points");
    const newUsed = Object.values(this.creationStats).reduce(
      (a, b) => a + b,
      0,
    );
    if (pointsEl)
      pointsEl.textContent = String(this.creationPointsTotal - newUsed);
  }

  // ================================================
  // Auto-Attack
  // ================================================

  private setupAutoAttack(): void {
    this.autoAttackBtn.addEventListener("click", () => {
      this.toggleAutoAttack();
    });
  }

  toggleAutoAttack(): void {
    this.autoAttackEnabled = !this.autoAttackEnabled;
    this.autoAttackBtn.textContent = `자동공격(A): ${this.autoAttackEnabled ? "ON" : "OFF"}`;
    this.autoAttackBtn.classList.toggle("active", this.autoAttackEnabled);
  }

  isAutoAttack(): boolean {
    return this.autoAttackEnabled;
  }

  // ================================================
  // Death Screen
  // ================================================

  private setupDeathScreen(): void {
    this.deathRespawnBtn.addEventListener("click", () => {
      this.hideDeathScreen();
      socket.send(PacketType.RESPAWN, {});
    });
  }

  showDeathScreen(expLost?: number): void {
    this.deathScreen.classList.add("visible");
    if (expLost && expLost > 0) {
      this.deathPenalty.textContent = `경험치 ${expLost} 손실`;
    } else {
      this.deathPenalty.textContent = "경험치 5% 손실";
    }

    // 3 second delay before respawn
    let countdown = 3;
    this.deathTimer.textContent = `${countdown}초 후 부활 가능`;
    this.deathRespawnBtn.style.display = "none";
    const timer = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(timer);
        this.deathTimer.textContent = "";
        this.deathRespawnBtn.style.display = "block";
      } else {
        this.deathTimer.textContent = `${countdown}초 후 부활 가능`;
      }
    }, 1000);
  }

  hideDeathScreen(): void {
    this.deathScreen.classList.remove("visible");
  }

  // ================================================
  // Kill Combo
  // ================================================

  addCombo(): void {
    this.comboCount++;
    this.comboCountEl.textContent = String(this.comboCount);
    const bonusPct = Math.min(this.comboCount * 5, 100);
    this.comboBonusEl.textContent = `+${bonusPct}% EXP`;
    this.comboDisplay.classList.add("visible");

    // Reset animation
    this.comboCountEl.style.animation = "none";
    void this.comboCountEl.offsetHeight; // reflow
    this.comboCountEl.style.animation = "comboPulse 0.3s ease";

    // Reset timer
    if (this.comboTimer) clearTimeout(this.comboTimer);
    this.comboTimer = window.setTimeout(() => {
      this.comboCount = 0;
      this.comboDisplay.classList.remove("visible");
    }, 5000);
  }

  getComboBonus(): number {
    return Math.min(this.comboCount * 5, 100) / 100;
  }

  // ================================================
  // Zone Name Display
  // ================================================

  setMapZones(
    zones: Array<{
      id: string;
      nameKo: string;
      x: number;
      y: number;
      width: number;
      height: number;
      levelRange: [number, number];
    }>,
  ): void {
    this.mapZones = zones;
  }

  updatePlayerPosition(x: number, y: number): void {
    this.playerX = x;
    this.playerY = y;
    this.checkZoneChange();
    this.updatePotionCounts();
  }

  private checkZoneChange(): void {
    for (const zone of this.mapZones) {
      if (
        this.playerX >= zone.x &&
        this.playerX < zone.x + zone.width &&
        this.playerY >= zone.y &&
        this.playerY < zone.y + zone.height
      ) {
        if (zone.id !== this.currentZone) {
          this.currentZone = zone.id;
          this.showZoneName(
            zone.nameKo,
            zone.levelRange[0] > 0
              ? `Lv.${zone.levelRange[0]} ~ ${zone.levelRange[1]}`
              : "안전 지역",
          );
        }
        return;
      }
    }
  }

  private showZoneName(name: string, levelText: string): void {
    this.zoneNameText.textContent = name;
    this.zoneLevelText.textContent = levelText;
    this.zoneNameEl.classList.remove("visible");
    void this.zoneNameEl.offsetHeight;
    this.zoneNameEl.classList.add("visible");
    setTimeout(() => {
      this.zoneNameEl.classList.remove("visible");
    }, 3000);
  }

  // ================================================
  // Boss Announcement
  // ================================================

  showBossAnnouncement(bossName: string, zone: string): void {
    this.bossAnnounceText.textContent = `${bossName} 출현!`;
    this.bossAnnounceSub.textContent = `${zone}에 보스 몬스터가 나타났습니다!`;
    this.bossAnnounce.classList.remove("visible");
    void this.bossAnnounce.offsetHeight;
    this.bossAnnounce.classList.add("visible");
    setTimeout(() => {
      this.bossAnnounce.classList.remove("visible");
    }, 4000);
  }

  // ================================================
  // Potion Quick Slot
  // ================================================

  private setupPotionQuickslot(): void {
    document.getElementById("potion-hp")?.addEventListener("click", () => {
      this.useQuickPotion("health");
    });
    document.getElementById("potion-mp")?.addEventListener("click", () => {
      this.useQuickPotion("mana");
    });
  }

  private useQuickPotion(type: "health" | "mana"): void {
    const potionId =
      type === "health"
        ? this.findBestPotion("healAmount")
        : this.findBestPotion("mpRestore");
    if (potionId >= 0) {
      socket.send(PacketType.USE_ITEM, { slotIndex: potionId });
    }
  }

  private findBestPotion(statKey: string): number {
    // Find highest-tier potion in inventory
    for (let i = this.inventory.length - 1; i >= 0; i--) {
      const slot = this.inventory[i];
      if (!slot || !slot.itemId) continue;
      const def = this.itemDefs.get(slot.itemId);
      if (def && def[statKey] && def[statKey] > 0) return i;
    }
    // Search forward for any
    for (let i = 0; i < this.inventory.length; i++) {
      const slot = this.inventory[i];
      if (!slot || !slot.itemId) continue;
      const def = this.itemDefs.get(slot.itemId);
      if (def && def[statKey] && def[statKey] > 0) return i;
    }
    return -1;
  }

  useQuickPotionByKey(type: "health" | "mana"): void {
    this.useQuickPotion(type);
  }

  private updatePotionCounts(): void {
    let hpCount = 0;
    let mpCount = 0;
    for (const slot of this.inventory) {
      if (!slot || !slot.itemId) continue;
      const def = this.itemDefs.get(slot.itemId);
      if (!def) continue;
      if (def.healAmount && def.healAmount > 0) hpCount += slot.count;
      if (def.mpRestore && def.mpRestore > 0 && !def.healAmount)
        mpCount += slot.count;
    }
    this.potionHpCount.textContent = String(hpCount);
    this.potionMpCount.textContent = String(mpCount);
  }

  // ================================================
  // Socket Event Listeners
  // ================================================

  private setupSocketListeners(): void {
    // Auth
    socket.on(PacketType.AUTH_ERROR, (data: { message: string }) => {
      this.showLoginError(data.message || "\uB85C\uADF8\uC778 \uC2E4\uD328");
    });

    // Stats updates
    socket.on(PacketType.STATS_UPDATE, (data: any) => {
      let s = data.stats || data;
      this.updateHP(s.hp, s.maxHp);
      this.updateMP(s.mp, s.maxMp);
      this.updateEXP(s.exp, s.expToLevel);
      this.updateLevel(s.level);
      if (s.gold != null) this.updateGold(s.gold);
      this.updateStatPanel(s);
    });

    // Quiz
    socket.on(PacketType.QUIZ_SHOW, (data: QuizQuestion) => {
      this.showQuiz(data);
    });

    socket.on(
      PacketType.QUIZ_RESULT,
      (data: { correct: boolean; reward?: string }) => {
        this.showQuizResult(data.correct, data.reward);
      },
    );

    // Inventory & Equipment
    socket.on(PacketType.INVENTORY_UPDATE, (data: any) => {
      let slots = data.slots || data.inventory || [];
      this.updateInventory(slots, data.itemDefs);
    });

    socket.on(
      PacketType.EQUIPMENT_UPDATE,
      (data: { equipment: EquipmentSlots; itemDefs?: Record<string, any> }) => {
        this.updateEquipment(data.equipment, data.itemDefs);
      },
    );

    // Shop
    socket.on(PacketType.SHOP_OPEN, (data: any) => {
      this.openShop(data);
    });

    // Chat
    socket.on(
      PacketType.CHAT_MESSAGE,
      (data: { sender: string; message: string; type?: string }) => {
        this.addChatMessage(data.sender, data.message, data.type);
      },
    );

    // Notifications
    socket.on(
      PacketType.NOTIFICATION,
      (data: { message: string; type?: string }) => {
        this.showNotification(data.message, data.type || "info");
      },
    );

    // Karma
    socket.on(
      PacketType.KARMA_UPDATE,
      (data: { karma: number; title: string }) => {
        this.updateKarma(data.karma, data.title);
      },
    );

    // Level up
    socket.on(PacketType.LEVEL_UP, (data: { level: number }) => {
      this.showNotification(
        `\uB808\uBCA8 \uC5C5! Lv.${data.level}\uC5D0 \uB3C4\uB2EC\uD588\uC2B5\uB2C8\uB2E4!`,
        "levelup",
      );
      this.updateLevel(data.level);
    });

    // EXP gain
    socket.on(PacketType.EXP_GAIN, (data: { amount: number }) => {
      this.showNotification(`+${data.amount} EXP`, "success");
    });

    // Enhancement result
    socket.on(
      PacketType.ENHANCE_RESULT,
      (data: { success: boolean; destroyed: boolean; newLevel: number }) => {
        this.showEnhanceResult(data.success, data.destroyed, data.newLevel);
      },
    );

    // Entity death - check for player death (show death screen)
    socket.on(PacketType.ENTITY_DEATH, (data: any) => {
      if (data.type === EntityType.PLAYER) {
        // Could be our player - GameScene will check
      }
      if (data.type === EntityType.MOB) {
        this.addCombo();
      }
    });

    // Boss spawn announcement
    socket.on(PacketType.MOB_SPAWN, (data: any) => {
      if (data.mob && data.mob.isBoss) {
        const mobName = data.mob.name || "Boss";
        this.showBossAnnouncement(mobName, "");
      }
    });

    // Respawn
    socket.on(PacketType.RESPAWN, () => {
      this.hideDeathScreen();
    });

    // Connection events
    socket.on("disconnected", () => {
      this.showNotification(
        "\uC11C\uBC84\uC640 \uC5F0\uACB0\uC774 \uB04A\uC5B4\uC84C\uC2B5\uB2C8\uB2E4...",
        "error",
      );
    });

    socket.on("reconnect_failed", () => {
      this.showNotification(
        "\uC11C\uBC84\uC5D0 \uC5F0\uACB0\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uD398\uC774\uC9C0\uB97C \uC0C8\uB85C\uACE0\uCE68\uD574\uC8FC\uC138\uC694.",
        "error",
      );
    });
  }
}

// Singleton instance
export const ui = new UIManager();
