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
  QuestStatus,
  MAX_CHAT_LENGTH,
  MAX_INVENTORY_SLOTS,
  MapData,
  EntityType,
  EntityData,
  Position,
  SET_BONUSES,
  getEnhanceColor,
} from "@shared/types";
import type {
  QuestDefinition,
  QuestProgress,
  PartyData,
  PartyMember,
  GroundItemDrop,
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
  private enhanceResultOverlay!: HTMLElement;
  private enhanceCurrentLevel!: HTMLElement;
  private enhanceRateRow!: HTMLElement;
  private enhanceRateValue!: HTMLElement;
  private enhanceCostRow!: HTMLElement;
  private enhanceCostValue!: HTMLElement;
  private enhanceScrollInfo!: HTMLElement;
  private enhanceHistoryList!: HTMLElement;

  // Daily reward
  private dailyRewardPopup!: HTMLElement;
  private dailyRewardStreak!: HTMLElement;
  private dailyRewardCalendar!: HTMLElement;
  private dailyRewardToday!: HTMLElement;
  private dailyRewardClaim!: HTMLElement;
  private dailyRewardTimer!: HTMLElement;
  private dailyRewardAutoClose: number | null = null;

  // Milestone popup
  private milestonePopup!: HTMLElement;
  private milestoneTitle!: HTMLElement;
  private milestoneRewards!: HTMLElement;
  private milestoneCloseBtn!: HTMLElement;

  // ---- State ----
  private currentPlayerName: string = "";
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
  private enhanceHistory: Array<{ text: string; type: string }> = [];

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

  // Quest system
  private questPanel!: HTMLElement;
  private questClose!: HTMLElement;
  private questActiveList!: HTMLElement;
  private questAvailableList!: HTMLElement;
  private questDialog!: HTMLElement;
  private questDialogTitle!: HTMLElement;
  private questDialogDesc!: HTMLElement;
  private questDialogObjectives!: HTMLElement;
  private questDialogRewards!: HTMLElement;
  private questDialogClose!: HTMLElement;
  private questDialogAccept!: HTMLElement;
  private questDialogComplete!: HTMLElement;
  private questDialogAbandon!: HTMLElement;
  private hudQuestBtn!: HTMLElement;
  private activeQuests: Array<{
    questId: string;
    status: string;
    objectives: Array<{ current: number }>;
    quest: any;
  }> = [];
  private availableQuests: QuestDefinition[] = [];
  private selectedQuestId: string = "";

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

  // Achievement system
  private achievementPanel!: HTMLElement;
  private achievementList!: HTMLElement;
  private achievementCount!: HTMLElement;
  private achievementClose!: HTMLElement;
  private achievementTabs!: HTMLElement;
  private achievementToast!: HTMLElement;
  private toastIcon!: HTMLElement;
  private toastName!: HTMLElement;
  private toastDesc!: HTMLElement;
  private toastReward!: HTMLElement;
  private hudAchBtn!: HTMLElement;
  private achievementData: any[] = [];
  private achievementCategory: string = "all";
  private toastTimer: number | null = null;

  // Trade system
  private tradePanel!: HTMLElement;
  private tradeRequestPopup!: HTMLElement;
  private tradeRequestName!: HTMLElement;
  private tradeMyItems!: HTMLElement;
  private tradePartnerItems!: HTMLElement;
  private tradeMyGoldInput!: HTMLInputElement;
  private tradePartnerGoldEl!: HTMLElement;
  private tradePartnerNameEl!: HTMLElement;
  private tradeStatus!: HTMLElement;
  private tradeConfirmBtn!: HTMLElement;
  private tradeCancelBtn!: HTMLElement;
  private tradeCloseBtn!: HTMLElement;
  private tradeAcceptBtn!: HTMLElement;
  private tradeDeclineBtn!: HTMLElement;
  private tradeRequesterId: string = "";
  private tradeActive: boolean = false;
  private tradeSelectedSlots: Set<number> = new Set();
  private tradeMyConfirmed: boolean = false;
  private tradePartnerConfirmed: boolean = false;

  // Party system
  private partyFrame!: HTMLElement;
  private partyMembers!: HTMLElement;
  private partyLeaveBtn!: HTMLElement;
  private partyInvitePopup!: HTMLElement;
  private partyInviteText!: HTMLElement;
  private partyInviteAccept!: HTMLElement;
  private partyInviteDecline!: HTMLElement;
  private currentPartyData: PartyData | null = null;
  private currentPlayerId: string = "";

  // PK and Auto-potion
  private pkMode: boolean = false;
  private autoPotion: boolean = false;
  private pkButton!: HTMLElement;
  private autoPotionButton!: HTMLElement;

  // Ground items tracking
  private groundItems: Map<string, GroundItemDrop> = new Map();

  // Crafting system
  private craftingPanel!: HTMLElement;
  private craftingClose!: HTMLElement;
  private craftingTabs!: HTMLElement;
  private craftingRecipeList!: HTMLElement;
  private craftingDetail!: HTMLElement;
  private craftingRecipes: any[] = [];
  private craftingCategory: string = "all";
  private craftingSelectedId: string = "";

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
    this.setupQuestPanel();
    this.setupAchievementPanel();
    this.setupTradePanel();
    this.setupPartyPanel();
    this.setupCraftingPanel();
    this.setupPkAndAutoPotion();
    this.setupDailyReward();
    this.setupMilestonePopup();
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
    this.enhanceResultOverlay = document.getElementById(
      "enhance-result-overlay",
    )!;
    this.enhanceCurrentLevel = document.getElementById(
      "enhance-current-level",
    )!;
    this.enhanceRateRow = document.getElementById("enhance-rate-row")!;
    this.enhanceRateValue = document.getElementById("enhance-rate-value")!;
    this.enhanceCostRow = document.getElementById("enhance-cost-row")!;
    this.enhanceCostValue = document.getElementById("enhance-cost-value")!;
    this.enhanceScrollInfo = document.getElementById("enhance-scroll-info")!;
    this.enhanceHistoryList = document.getElementById("enhance-history-list")!;

    // Daily reward elements
    this.dailyRewardPopup = document.getElementById("daily-reward-popup")!;
    this.dailyRewardStreak = document.getElementById("daily-reward-streak")!;
    this.dailyRewardCalendar = document.getElementById(
      "daily-reward-calendar",
    )!;
    this.dailyRewardToday = document.getElementById("daily-reward-today")!;
    this.dailyRewardClaim = document.getElementById("daily-reward-claim")!;
    this.dailyRewardTimer = document.getElementById("daily-reward-timer")!;

    // Milestone elements
    this.milestonePopup = document.getElementById("milestone-popup")!;
    this.milestoneTitle = document.getElementById("milestone-title")!;
    this.milestoneRewards = document.getElementById("milestone-rewards")!;
    this.milestoneCloseBtn = document.getElementById("milestone-close-btn")!;

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

    // Quest elements
    this.questPanel = document.getElementById("quest-panel")!;
    this.questClose = document.getElementById("quest-close")!;
    this.questActiveList = document.getElementById("quest-active-list")!;
    this.questAvailableList = document.getElementById("quest-available-list")!;
    this.questDialog = document.getElementById("quest-dialog")!;
    this.questDialogTitle = document.getElementById("quest-dialog-title")!;
    this.questDialogDesc = document.getElementById("quest-dialog-desc")!;
    this.questDialogObjectives = document.getElementById(
      "quest-dialog-objectives",
    )!;
    this.questDialogRewards = document.getElementById("quest-dialog-rewards")!;
    this.questDialogClose = document.getElementById("quest-dialog-close")!;
    this.questDialogAccept = document.getElementById("quest-dialog-accept")!;
    this.questDialogComplete = document.getElementById(
      "quest-dialog-complete",
    )!;
    this.questDialogAbandon = document.getElementById("quest-dialog-abandon")!;
    this.hudQuestBtn = document.getElementById("hud-quest-btn")!;

    // Achievement elements
    this.achievementPanel = document.getElementById("achievement-panel")!;
    this.achievementList = document.getElementById("ach-list")!;
    this.achievementCount = document.getElementById("ach-count")!;
    this.achievementClose = document.getElementById("ach-close")!;
    this.achievementTabs = document.getElementById("ach-tabs")!;
    this.achievementToast = document.getElementById("achievement-toast")!;
    this.toastIcon = document.getElementById("toast-icon")!;
    this.toastName = document.getElementById("toast-name")!;
    this.toastDesc = document.getElementById("toast-desc")!;
    this.toastReward = document.getElementById("toast-reward")!;
    this.hudAchBtn = document.getElementById("hud-ach-btn")!;

    // Trade elements
    this.tradePanel = document.getElementById("trade-panel")!;
    this.tradeRequestPopup = document.getElementById("trade-request-popup")!;
    this.tradeRequestName = document.getElementById("trade-request-name")!;
    this.tradeMyItems = document.getElementById("trade-my-items")!;
    this.tradePartnerItems = document.getElementById("trade-partner-items")!;
    this.tradeMyGoldInput = document.getElementById(
      "trade-my-gold",
    ) as HTMLInputElement;
    this.tradePartnerGoldEl = document.getElementById("trade-partner-gold")!;
    this.tradePartnerNameEl = document.getElementById("trade-partner-name")!;
    this.tradeStatus = document.getElementById("trade-status")!;
    this.tradeConfirmBtn = document.getElementById("trade-confirm-btn")!;
    this.tradeCancelBtn = document.getElementById("trade-cancel-btn")!;
    this.tradeCloseBtn = document.getElementById("trade-close")!;
    this.tradeAcceptBtn = document.getElementById("trade-accept-btn")!;
    this.tradeDeclineBtn = document.getElementById("trade-decline-btn")!;

    // Party
    this.partyFrame = document.getElementById("party-frame")!;
    this.partyMembers = document.getElementById("party-members")!;
    this.partyLeaveBtn = document.getElementById("party-leave-btn")!;
    this.partyInvitePopup = document.getElementById("party-invite-popup")!;
    this.partyInviteText = document.getElementById("party-invite-text")!;
    this.partyInviteAccept = document.getElementById("party-invite-accept")!;
    this.partyInviteDecline = document.getElementById("party-invite-decline")!;

    // Crafting elements
    this.craftingPanel = document.getElementById("crafting-panel")!;
    this.craftingClose = document.getElementById("craft-close")!;
    this.craftingTabs = document.getElementById("craft-tabs")!;
    this.craftingRecipeList = document.getElementById("craft-recipe-list")!;
    this.craftingDetail = document.getElementById("craft-detail")!;
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
    const registerSection = document.getElementById("register-section");
    const switchLink = document.getElementById("switch-to-register");
    const modeSwitchDiv = document.getElementById("login-mode-switch");

    this.btnLogin.addEventListener("click", () => {
      this.doLogin();
    });

    this.btnRegister.addEventListener("click", () => {
      this.doRegister();
    });

    // Mode switch link
    if (switchLink) {
      switchLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (!this.isRegisterMode) {
          // Switch to register mode
          this.isRegisterMode = true;
          if (registerSection) registerSection.style.display = "block";
          this.btnLogin.style.display = "none";
          this.btnRegister.textContent = "캐릭터 생성";
          if (switchLink) switchLink.textContent = "로그인으로 돌아가기";
          if (modeSwitchDiv) {
            modeSwitchDiv.innerHTML = `<span style="color:var(--text-dim); font-size:13px;">이미 계정이 있으신가요? </span><a href="#" id="switch-to-login" style="color:var(--accent-blue); font-size:13px; text-decoration:underline; cursor:pointer;">로그인</a>`;
            document
              .getElementById("switch-to-login")
              ?.addEventListener("click", (ev) => {
                ev.preventDefault();
                this.switchToLoginMode();
              });
          }
          this.loginError.textContent = "";
        }
      });
    }

    // Enter key on password field
    this.loginPassword.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (this.isRegisterMode) {
          this.doRegister();
        } else {
          this.doLogin();
        }
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

  private switchToLoginMode(): void {
    this.isRegisterMode = false;
    const registerSection = document.getElementById("register-section");
    const modeSwitchDiv = document.getElementById("login-mode-switch");
    if (registerSection) registerSection.style.display = "none";
    this.btnLogin.style.display = "";
    this.btnRegister.textContent = "회원가입";
    this.btnRegister.style.display = "none";
    this.btnLogin.style.display = "";
    if (modeSwitchDiv) {
      modeSwitchDiv.innerHTML = `<span style="color:var(--text-dim); font-size:13px;">계정이 없으신가요? </span><a href="#" id="switch-to-register2" style="color:var(--accent-blue); font-size:13px; text-decoration:underline; cursor:pointer;">회원가입</a>`;
      document
        .getElementById("switch-to-register2")
        ?.addEventListener("click", (ev) => {
          ev.preventDefault();
          this.isRegisterMode = true;
          if (registerSection) registerSection.style.display = "block";
          this.btnLogin.style.display = "none";
          this.btnRegister.style.display = "";
          this.btnRegister.textContent = "캐릭터 생성";
          if (modeSwitchDiv) {
            modeSwitchDiv.innerHTML = `<span style="color:var(--text-dim); font-size:13px;">이미 계정이 있으신가요? </span><a href="#" id="switch-to-login2" style="color:var(--accent-blue); font-size:13px; text-decoration:underline; cursor:pointer;">로그인</a>`;
            document
              .getElementById("switch-to-login2")
              ?.addEventListener("click", (e2) => {
                e2.preventDefault();
                this.switchToLoginMode();
              });
          }
          this.loginError.textContent = "";
        });
    }
    this.loginError.textContent = "";
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
      this.showLoginError("닉네임을 입력해주세요.");
      return;
    }
    if (username.length < 2 || username.length > 16) {
      this.showLoginError("닉네임은 2~16글자여야 합니다.");
      return;
    }
    if (!password || password.length < 4) {
      this.showLoginError("비밀번호는 4자 이상이어야 합니다.");
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
    } else if (type === "party") {
      senderSpan.style.color = "#40c8c8";
      senderSpan.textContent = sender + ": ";
      msgDiv.style.color = "#a0e8e8";
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
    this.renderSetBonuses();
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
          // Glow color for +4 and above
          let glowColor = getEnhanceColor(slot.enhancement);
          if (glowColor) {
            enhLabel.style.color = glowColor;
            enhLabel.style.textShadow = `0 0 6px ${glowColor}`;
            slotDiv.style.borderColor = glowColor;
            slotDiv.style.boxShadow = `0 0 8px ${glowColor}40`;
          }
          slotDiv.style.position = "relative";
          slotDiv.appendChild(enhLabel);
        }

        const nameLabel = document.createElement("div");
        nameLabel.className = "item-name";
        nameLabel.textContent = name;
        // Color the name for enhanced items
        if (slot.enhancement && slot.enhancement >= 4) {
          let glowColor = getEnhanceColor(slot.enhancement);
          if (glowColor) {
            nameLabel.style.color = glowColor;
          }
        }
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

    // Store player name from login form
    this.currentPlayerName = this.loginUsername.value.trim();

    // Update character info in stat panel
    this.updateCharacterInfo();

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

  private updateCharacterInfo(): void {
    const nameEl = document.getElementById("stat-char-name");
    const classEl = document.getElementById("stat-char-class");
    const iconEl = document.getElementById("stat-char-icon");

    const CLASS_NAMES: Record<string, string> = {
      [PlayerClass.WARRIOR]: "Warrior",
      [PlayerClass.KNIGHT]: "Knight",
      [PlayerClass.MAGE]: "Mage",
      [PlayerClass.ARCHER]: "Archer",
    };

    const CLASS_COLORS: Record<string, string> = {
      [PlayerClass.WARRIOR]: "#e53935",
      [PlayerClass.KNIGHT]: "#1e88e5",
      [PlayerClass.MAGE]: "#ab47bc",
      [PlayerClass.ARCHER]: "#66bb6a",
    };

    if (nameEl) nameEl.textContent = this.currentPlayerName || "-";
    if (classEl)
      classEl.textContent = CLASS_NAMES[this.currentPlayerClass] || "-";
    if (iconEl) {
      iconEl.style.backgroundColor =
        CLASS_COLORS[this.currentPlayerClass] || "#888";
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
    // Combat stats
    const setEl = (id: string, val: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    if (stats.attack !== undefined) setEl("stat-attack", String(stats.attack));
    if (stats.magicAttack !== undefined)
      setEl("stat-magicAttack", String(stats.magicAttack));
    if (stats.defense !== undefined)
      setEl("stat-defense", String(stats.defense));
    if (stats.magicDefense !== undefined)
      setEl("stat-magicDefense", String(stats.magicDefense));
    if (stats.hp !== undefined && stats.maxHp !== undefined) {
      setEl("stat-hp-detail", `${stats.hp} / ${stats.maxHp}`);
    }
    if (stats.mp !== undefined && stats.maxMp !== undefined) {
      setEl("stat-mp-detail", `${stats.mp} / ${stats.maxMp}`);
    }
    if (stats.critRate !== undefined)
      setEl("stat-critRate", `${Number(stats.critRate).toFixed(1)}%`);
    if (stats.attackSpeed !== undefined)
      setEl("stat-attackSpeed", String(Number(stats.attackSpeed).toFixed(2)));
    if (stats.dodgeRate !== undefined)
      setEl("stat-dodgeRate", `${Number(stats.dodgeRate).toFixed(1)}%`);
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
    this.enhanceResultText.style.color = "";
    this.enhanceResultText.style.textShadow = "";
    this.enhanceResultOverlay.className = "enhance-result-overlay";
    this.enhanceResultOverlay.textContent = "";
    this.enhanceCurrentLevel.textContent = "";
    this.enhanceRateRow.style.display = "none";
    this.enhanceCostRow.style.display = "none";
    this.enhanceScrollInfo.style.display = "none";
    this.enhancePanel.classList.add("visible");

    // Also show inventory for selection
    if (!this.inventoryPanel.classList.contains("visible")) {
      this.inventoryPanel.classList.add("visible");
      this.renderInventoryGrid();
    }
  }

  toggleEnhancePanel(): void {
    if (this.enhancePanel.classList.contains("visible")) {
      this.closeEnhancePanel();
    } else {
      this.openEnhancePanel();
    }
  }

  closeEnhancePanel(): void {
    this.isEnhanceMode = false;
    this.enhancePanel.classList.remove("visible");
  }

  private getEnhanceSuccessRate(currentLevel: number): number {
    if (currentLevel <= 3) return 100;
    if (currentLevel <= 6) return 80 - (currentLevel - 3) * 10; // 70, 60, 50
    if (currentLevel <= 9) return 40 - (currentLevel - 6) * 10; // 30, 20, 10
    if (currentLevel <= 12) return 8 - (currentLevel - 9) * 2; // 6, 4, 2
    return 1;
  }

  private getEnhanceCost(currentLevel: number): number {
    return 500 + currentLevel * currentLevel * 200;
  }

  private updateEnhanceInfo(): void {
    if (this.enhanceItemIndex < 0) {
      this.enhanceCurrentLevel.textContent = "";
      this.enhanceRateRow.style.display = "none";
      this.enhanceCostRow.style.display = "none";
      return;
    }

    const slot = this.inventory[this.enhanceItemIndex];
    if (!slot) return;

    const currentLevel = slot.enhancement || 0;
    const rate = this.getEnhanceSuccessRate(currentLevel);
    const cost = this.getEnhanceCost(currentLevel);

    // Current level display with glow
    const def = this.itemDefs.get(slot.itemId);
    const itemName = def?.nameKo || slot.itemId;
    this.enhanceCurrentLevel.textContent =
      currentLevel > 0 ? `+${currentLevel} ${itemName}` : itemName;
    const glowColor = getEnhanceColor(currentLevel);
    if (glowColor && currentLevel >= 4) {
      this.enhanceCurrentLevel.style.color = glowColor;
      this.enhanceCurrentLevel.style.textShadow = `0 0 20px ${glowColor}`;
    } else {
      this.enhanceCurrentLevel.style.color = "";
      this.enhanceCurrentLevel.style.textShadow = "";
    }

    // Success rate
    this.enhanceRateRow.style.display = "flex";
    this.enhanceRateValue.textContent = `${rate}%`;
    this.enhanceRateValue.className = "enhance-rate-value";
    if (rate >= 70) {
      this.enhanceRateValue.classList.add("rate-high");
    } else if (rate >= 30) {
      this.enhanceRateValue.classList.add("rate-mid");
    } else {
      this.enhanceRateValue.classList.add("rate-low");
    }

    // Gold cost
    this.enhanceCostRow.style.display = "flex";
    this.enhanceCostValue.textContent = `${cost.toLocaleString()} Gold`;
  }

  private updateScrollTypeInfo(): void {
    if (this.enhanceScrollIndex < 0) {
      this.enhanceScrollInfo.style.display = "none";
      return;
    }

    const slot = this.inventory[this.enhanceScrollIndex];
    if (!slot) return;

    const def = this.itemDefs.get(slot.itemId);
    const scrollName = (def?.nameKo || slot.itemId).toLowerCase();
    let infoText = "";

    if (scrollName.includes("blessed") || scrollName.includes("\uCD95\uBCF5")) {
      infoText =
        "Blessed Scroll: On failure, item is protected from destruction.";
    } else if (
      scrollName.includes("cursed") ||
      scrollName.includes("\uC800\uC8FC")
    ) {
      infoText =
        "Cursed Scroll: Higher success rate, but failure resets to +0.";
    } else {
      infoText =
        "Normal Scroll: Standard enhancement. Failure may downgrade or destroy.";
    }

    this.enhanceScrollInfo.textContent = infoText;
    this.enhanceScrollInfo.style.display = "block";
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
      // Enhancement glow color
      if (slot.enhancement && slot.enhancement >= 4) {
        let glowColor = getEnhanceColor(slot.enhancement);
        if (glowColor) {
          label.style.color = glowColor;
          label.style.textShadow = `0 0 6px ${glowColor}`;
        }
      }
      this.enhanceItemSlot.appendChild(label);
    }
    this.updateEnhanceInfo();
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
    this.updateScrollTypeInfo();
  }

  private showEnhanceResultAnimation(
    result: "success" | "fail" | "destroy" | "downgrade" | "reset",
    itemName: string,
    newLevel: number,
  ): void {
    // Clear previous
    this.enhanceResultOverlay.className = "enhance-result-overlay";
    // Force reflow
    void this.enhanceResultOverlay.offsetWidth;

    let overlayText = "";
    let overlayClass = "";
    let historyText = "";
    let historyType = "";

    switch (result) {
      case "success":
        overlayText = `SUCCESS! +${newLevel}`;
        overlayClass = "show-success";
        historyText = `+${newLevel} ${itemName} SUCCESS`;
        historyType = "success";
        break;
      case "fail":
      case "downgrade":
        overlayText = `FAILED... -1`;
        overlayClass = "show-fail";
        historyText = `+${newLevel} ${itemName} FAIL`;
        historyType = "fail";
        break;
      case "reset":
        overlayText = `CURSED! Reset to +0`;
        overlayClass = "show-fail";
        historyText = `${itemName} RESET to +0`;
        historyType = "fail";
        break;
      case "destroy":
        overlayText = `DESTROYED!`;
        overlayClass = "show-destroy";
        historyText = `${itemName} DESTROYED`;
        historyType = "destroy";
        break;
    }

    this.enhanceResultOverlay.textContent = overlayText;
    this.enhanceResultOverlay.classList.add(overlayClass);

    // Add to history
    this.enhanceHistory.unshift({ text: historyText, type: historyType });
    if (this.enhanceHistory.length > 5) {
      this.enhanceHistory.pop();
    }
    this.renderEnhanceHistory();

    // Auto-clear overlay
    setTimeout(() => {
      this.enhanceResultOverlay.className = "enhance-result-overlay";
      this.enhanceResultOverlay.textContent = "";
    }, 2000);
  }

  private renderEnhanceHistory(): void {
    this.enhanceHistoryList.innerHTML = "";
    for (const entry of this.enhanceHistory) {
      const div = document.createElement("div");
      div.className = `enhance-history-entry ${entry.type}`;
      div.textContent = entry.text;
      this.enhanceHistoryList.appendChild(div);
    }
  }

  showEnhanceResult(
    success: boolean,
    destroyed: boolean,
    newLevel: number,
    itemName?: string,
  ): void {
    const name = itemName || "Item";

    if (success) {
      this.enhanceResultText.textContent = `\uAC15\uD654 \uC131\uACF5! +${newLevel}`;
      this.enhanceResultText.className = "enhance-result success";
      let glowColor = getEnhanceColor(newLevel);
      if (glowColor) {
        this.enhanceResultText.style.color = glowColor;
        this.enhanceResultText.style.textShadow = `0 0 10px ${glowColor}`;
      } else {
        this.enhanceResultText.style.color = "";
        this.enhanceResultText.style.textShadow = "";
      }
      this.showEnhanceResultAnimation("success", name, newLevel);
    } else if (destroyed) {
      this.enhanceResultText.textContent =
        "\uAC15\uD654 \uC2E4\uD328! \uC544\uC774\uD15C \uD30C\uAD34!";
      this.enhanceResultText.className = "enhance-result fail";
      this.enhanceResultText.style.color = "";
      this.enhanceResultText.style.textShadow = "";
      this.showEnhanceResultAnimation("destroy", name, newLevel);
    } else if (newLevel === 0) {
      this.enhanceResultText.textContent = `\uAC15\uD654 \uC2E4\uD328. +0\uC73C\uB85C \uCD08\uAE30\uD654`;
      this.enhanceResultText.className = "enhance-result fail";
      this.enhanceResultText.style.color = "";
      this.enhanceResultText.style.textShadow = "";
      this.showEnhanceResultAnimation("reset", name, newLevel);
    } else {
      this.enhanceResultText.textContent = `\uAC15\uD654 \uC2E4\uD328. +${newLevel}\uC73C\uB85C \uD558\uB77D`;
      this.enhanceResultText.className = "enhance-result fail";
      this.enhanceResultText.style.color = "";
      this.enhanceResultText.style.textShadow = "";
      this.showEnhanceResultAnimation("downgrade", name, newLevel);
    }

    // Reset selection
    this.enhanceItemIndex = -1;
    this.enhanceScrollIndex = -1;
    this.enhanceItemSlot.innerHTML = "<span>\uC7A5\uBE44</span>";
    this.enhanceItemSlot.classList.remove("filled");
    this.enhanceScrollSlot.innerHTML = "<span>\uC8FC\uBB38\uC11C</span>";
    this.enhanceScrollSlot.classList.remove("filled");
    this.enhanceRateRow.style.display = "none";
    this.enhanceCostRow.style.display = "none";
    this.enhanceScrollInfo.style.display = "none";
    this.enhanceCurrentLevel.textContent = "";
  }

  // ================================================
  // Daily Login Reward
  // ================================================

  private setupDailyReward(): void {
    this.dailyRewardClaim.addEventListener("click", () => {
      socket.send(PacketType.DAILY_REWARD, { action: "claim" });
      this.dailyRewardPopup.classList.remove("visible");
      if (this.dailyRewardAutoClose) {
        clearTimeout(this.dailyRewardAutoClose);
        this.dailyRewardAutoClose = null;
      }
    });
  }

  private showDailyRewardPopup(reward: {
    day: number;
    type: string;
    amount: number;
    itemId?: string;
    streak: number;
  }): void {
    // Streak display
    this.dailyRewardStreak.textContent = `${reward.streak} Day Streak!`;

    // Build 7-day calendar
    const DAILY_REWARDS = [
      { label: "500G", icon: "G" },
      { label: "1000G", icon: "G" },
      { label: "Scroll", icon: "S" },
      { label: "2000G", icon: "G" },
      { label: "Potion", icon: "P" },
      { label: "3000G", icon: "G" },
      { label: "Rare!", icon: "R" },
    ];

    this.dailyRewardCalendar.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const dayNum = i + 1;
      const dayEl = document.createElement("div");
      dayEl.className = "daily-day";

      if (dayNum < reward.day) {
        dayEl.classList.add("claimed");
      } else if (dayNum === reward.day) {
        dayEl.classList.add("today");
      }

      const numEl = document.createElement("div");
      numEl.className = "daily-day-num";
      numEl.textContent = `D${dayNum}`;
      dayEl.appendChild(numEl);

      const rewardEl = document.createElement("div");
      rewardEl.className = "daily-day-reward";
      rewardEl.textContent = DAILY_REWARDS[i].label;
      dayEl.appendChild(rewardEl);

      this.dailyRewardCalendar.appendChild(dayEl);
    }

    // Today's reward text
    let rewardText = "";
    if (reward.type === "gold") {
      rewardText = `${reward.amount.toLocaleString()} Gold`;
    } else if (reward.type === "item" && reward.itemId) {
      const def = this.itemDefs.get(reward.itemId);
      rewardText = `${def?.nameKo || reward.itemId} x${reward.amount}`;
    } else {
      rewardText = `${reward.type} x${reward.amount}`;
    }
    this.dailyRewardToday.textContent = rewardText;

    // Show popup
    this.dailyRewardPopup.classList.add("visible");

    // Auto-dismiss timer
    let remaining = 10;
    this.dailyRewardTimer.textContent = `Auto-claim in ${remaining}s`;
    this.dailyRewardAutoClose = window.setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        if (this.dailyRewardAutoClose) {
          clearInterval(this.dailyRewardAutoClose);
          this.dailyRewardAutoClose = null;
        }
        this.dailyRewardPopup.classList.remove("visible");
        socket.send(PacketType.DAILY_REWARD, { action: "claim" });
      } else {
        this.dailyRewardTimer.textContent = `Auto-claim in ${remaining}s`;
      }
    }, 1000);
  }

  // ================================================
  // Milestone Reward
  // ================================================

  private setupMilestonePopup(): void {
    this.milestoneCloseBtn.addEventListener("click", () => {
      this.milestonePopup.classList.remove("visible");
    });
  }

  private showMilestoneReward(
    level: number,
    rewards: {
      gold: number;
      items?: Array<{ id: string; count: number; name: string }>;
    },
  ): void {
    this.milestoneTitle.textContent = `LEVEL ${level} MILESTONE!`;

    let rewardHtml = "";
    if (rewards.gold > 0) {
      rewardHtml += `<div class="milestone-reward-item"><span class="reward-icon">G</span> ${rewards.gold.toLocaleString()} Gold</div>`;
    }
    if (rewards.items) {
      for (const item of rewards.items) {
        rewardHtml += `<div class="milestone-reward-item"><span class="reward-icon">*</span> ${item.name} x${item.count}</div>`;
      }
    }
    this.milestoneRewards.innerHTML = rewardHtml;

    this.milestonePopup.classList.add("visible");

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      this.milestonePopup.classList.remove("visible");
    }, 8000);
  }

  // ================================================
  // Enhancement Announcement in Chat
  // ================================================

  addEnhanceAnnouncement(
    playerName: string,
    itemName: string,
    level: number,
  ): void {
    const msgDiv = document.createElement("div");
    const isHigh = level >= 10;
    msgDiv.className = isHigh
      ? "chat-msg enhance-announce enhance-announce-high"
      : "chat-msg enhance-announce";

    const senderSpan = document.createElement("span");
    senderSpan.className = "sender";
    senderSpan.textContent = "[ENHANCE] ";
    msgDiv.appendChild(senderSpan);

    const text = `${playerName} has enhanced ${itemName} to +${level}!`;
    msgDiv.appendChild(document.createTextNode(text));
    this.chatMessages.appendChild(msgDiv);

    while (this.chatMessages.childNodes.length > 50) {
      this.chatMessages.removeChild(this.chatMessages.firstChild!);
    }
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  // ================================================
  // Close All Panels
  // ================================================

  closeAllPanels(): void {
    this.closeInventory();
    this.closeShop();
    this.closeEnhancePanel();
    this.closeCraftingPanel();
    this.statPanel.classList.remove("visible");
    this.hideQuiz();
  }

  isAnyPanelOpen(): boolean {
    return (
      this.inventoryPanel.classList.contains("visible") ||
      this.shopPanel.classList.contains("visible") ||
      this.quizPopup.classList.contains("visible") ||
      this.enhancePanel.classList.contains("visible") ||
      this.craftingPanel.classList.contains("visible")
    );
  }

  // ================================================
  // Crafting Panel
  // ================================================

  private setupCraftingPanel(): void {
    if (this.craftingClose) {
      this.craftingClose.addEventListener("click", () => {
        this.closeCraftingPanel();
      });
    }

    if (this.craftingTabs) {
      this.craftingTabs.addEventListener("click", (e) => {
        let target = e.target as HTMLElement;
        if (target.classList.contains("craft-tab")) {
          this.craftingCategory = target.dataset.category || "all";
          this.craftingTabs
            .querySelectorAll(".craft-tab")
            .forEach((t) => t.classList.remove("active"));
          target.classList.add("active");
          this.renderCraftingRecipes();
        }
      });
    }
  }

  openCraftingPanel(): void {
    this.craftingPanel.classList.add("visible");
    this.craftingSelectedId = "";
    this.craftingDetail.innerHTML =
      '<div class="craft-detail-empty">\uB808\uC2DC\uD53C\uB97C \uC120\uD0DD\uD558\uC138\uC694</div>';
    socket.send(PacketType.CRAFT_LIST, {});
  }

  closeCraftingPanel(): void {
    this.craftingPanel.classList.remove("visible");
  }

  private handleCraftList(data: any): void {
    this.craftingRecipes = data.recipes || [];
    this.renderCraftingRecipes();
  }

  private renderCraftingRecipes(): void {
    if (!this.craftingRecipeList) return;
    this.craftingRecipeList.innerHTML = "";

    let filtered = this.craftingRecipes;
    if (this.craftingCategory !== "all") {
      filtered = filtered.filter(
        (r: any) => r.category === this.craftingCategory,
      );
    }

    filtered.sort((a: any, b: any) => {
      if (a.canCraft && !b.canCraft) return -1;
      if (!a.canCraft && b.canCraft) return 1;
      return a.level - b.level;
    });

    for (let recipe of filtered) {
      let div = document.createElement("div");
      div.className = "craft-recipe-item";
      if (recipe.canCraft) div.classList.add("craftable");
      if (recipe.id === this.craftingSelectedId) div.classList.add("selected");

      div.innerHTML = `
        <div class="recipe-icon" style="background-color:${recipe.resultColor}"></div>
        <div class="recipe-info">
          <div class="recipe-name">${recipe.nameKo}</div>
          <div class="recipe-level">Lv.${recipe.level} ${recipe.quizRequired ? "QUIZ" : ""}</div>
        </div>
      `;

      div.addEventListener("click", () => {
        this.craftingSelectedId = recipe.id;
        this.renderCraftingRecipes();
        this.renderCraftingDetail(recipe);
      });

      this.craftingRecipeList.appendChild(div);
    }
  }

  private renderCraftingDetail(recipe: any): void {
    if (!this.craftingDetail) return;

    let statsHtml = "";
    let s = recipe.resultStats;
    let statEntries: string[] = [];
    if (s.attack) statEntries.push(`ATK +${s.attack}`);
    if (s.defense) statEntries.push(`DEF +${s.defense}`);
    if (s.hp) statEntries.push(`HP +${s.hp}`);
    if (s.mp) statEntries.push(`MP +${s.mp}`);
    if (s.magicAttack) statEntries.push(`MATK +${s.magicAttack}`);
    if (s.magicDefense) statEntries.push(`MDEF +${s.magicDefense}`);
    if (s.critRate) statEntries.push(`CRIT +${s.critRate}%`);
    if (s.critDamage)
      statEntries.push(`CDMG +${(s.critDamage * 100).toFixed(0)}%`);
    if (s.dodgeRate) statEntries.push(`DODGE +${s.dodgeRate}%`);
    if (s.attackSpeed) statEntries.push(`ASPD +${s.attackSpeed}`);
    if (s.speed) statEntries.push(`SPD +${s.speed}`);
    if (s.healAmount) statEntries.push(`HEAL ${s.healAmount}`);
    if (s.mpRestore) statEntries.push(`MP\uD68C\uBCF5 ${s.mpRestore}`);

    if (statEntries.length > 0) {
      statsHtml = `<div class="craft-stats">${statEntries.map((e) => `<span>${e}</span>`).join("")}</div>`;
    }

    let matsHtml = recipe.materials
      .map((m: any) => {
        let enough = m.have >= m.need;
        return `<div class="craft-mat-row">
        <div class="craft-mat-icon" style="background-color:${m.color}"></div>
        <span class="craft-mat-name">${m.itemName}</span>
        <span class="craft-mat-count ${enough ? "enough" : "not-enough"}">${m.have}/${m.need}</span>
      </div>`;
      })
      .join("");

    let quizBadge = recipe.quizRequired
      ? '<div class="craft-quiz-badge">QUIZ REQUIRED</div>'
      : "";

    this.craftingDetail.innerHTML = `
      <div class="craft-detail-header">
        <div class="craft-detail-icon" style="background-color:${recipe.resultColor}"></div>
        <div>
          <div class="craft-detail-title">${recipe.nameKo}</div>
          <div class="craft-detail-desc">${recipe.resultDescription}</div>
          ${recipe.resultCount > 1 ? `<div class="craft-detail-count">x${recipe.resultCount}</div>` : ""}
        </div>
      </div>
      ${statsHtml}
      ${quizBadge}
      <div class="craft-materials">
        <div class="craft-materials-title">\uD544\uC694 \uC7AC\uB8CC</div>
        ${matsHtml}
      </div>
      <div class="craft-gold-cost">\uBE44\uC6A9: ${recipe.goldCost.toLocaleString()}G</div>
      <button class="craft-btn" id="craft-do-btn" ${recipe.canCraft ? "" : "disabled"}>\uC81C\uC791\uD558\uAE30</button>
    `;

    let craftBtn = document.getElementById("craft-do-btn");
    if (craftBtn) {
      craftBtn.addEventListener("click", () => {
        socket.send(PacketType.CRAFT_ITEM, { recipeId: recipe.id });
      });
    }
  }

  private handleCraftResult(data: any): void {
    if (data.success) {
      this.showNotification(
        `${data.itemName} x${data.count} \uC81C\uC791 \uC644\uB8CC!`,
        "success",
      );
      socket.send(PacketType.CRAFT_LIST, {});
    }
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
    this.autoAttackBtn.textContent = `AUTO (A): ${this.autoAttackEnabled ? "ON" : "OFF"}`;
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
  // PK Mode & Auto-Potion Toggle
  // ================================================

  private setupPkAndAutoPotion(): void {
    // Create PK toggle button near potion quickslot
    let quickslotArea = document.getElementById("potion-quickslot");
    if (quickslotArea) {
      // PK button
      this.pkButton = document.createElement("div");
      this.pkButton.id = "pk-toggle";
      this.pkButton.className = "pk-btn";
      this.pkButton.textContent = "PK: OFF";
      this.pkButton.style.cssText =
        "position:absolute;right:-70px;top:0;width:60px;height:24px;line-height:24px;text-align:center;background:#333;color:#aaa;border:1px solid #555;border-radius:4px;cursor:pointer;font-size:11px;user-select:none;z-index:100;";
      this.pkButton.addEventListener("click", () => {
        socket.send(PacketType.PK_TOGGLE, {});
      });
      quickslotArea.style.position = "relative";
      quickslotArea.appendChild(this.pkButton);

      // Auto-potion button
      this.autoPotionButton = document.createElement("div");
      this.autoPotionButton.id = "auto-potion-toggle";
      this.autoPotionButton.textContent = "AUTO: OFF";
      this.autoPotionButton.style.cssText =
        "position:absolute;right:-70px;top:28px;width:60px;height:24px;line-height:24px;text-align:center;background:#333;color:#aaa;border:1px solid #555;border-radius:4px;cursor:pointer;font-size:11px;user-select:none;z-index:100;";
      this.autoPotionButton.addEventListener("click", () => {
        socket.send(PacketType.AUTO_POTION_TOGGLE, {});
      });
      quickslotArea.appendChild(this.autoPotionButton);
    }
  }

  updatePkMode(enabled: boolean): void {
    this.pkMode = enabled;
    if (this.pkButton) {
      this.pkButton.textContent = enabled ? "PK: ON" : "PK: OFF";
      this.pkButton.style.color = enabled ? "#FF4444" : "#aaa";
      this.pkButton.style.borderColor = enabled ? "#FF4444" : "#555";
      this.pkButton.style.background = enabled ? "#441111" : "#333";
    }
  }

  getGroundItems(): Map<string, GroundItemDrop> {
    return this.groundItems;
  }

  pickupGroundItem(itemId: string): void {
    socket.send(PacketType.PICKUP_GROUND_ITEM, { itemId });
  }

  updateAutoPotion(enabled: boolean): void {
    this.autoPotion = enabled;
    if (this.autoPotionButton) {
      this.autoPotionButton.textContent = enabled ? "AUTO: ON" : "AUTO: OFF";
      this.autoPotionButton.style.color = enabled ? "#44FF44" : "#aaa";
      this.autoPotionButton.style.borderColor = enabled ? "#44FF44" : "#555";
      this.autoPotionButton.style.background = enabled ? "#114411" : "#333";
    }
  }

  // ================================================
  // Socket Event Listeners
  // ================================================

  // ================================================
  // Quest System
  // ================================================

  private setupQuestPanel(): void {
    // Toggle quest panel
    this.hudQuestBtn.addEventListener("click", () => {
      this.toggleQuestPanel();
    });

    // Close quest panel
    this.questClose.addEventListener("click", () => {
      this.questPanel.classList.remove("visible");
      this.questPanel.style.display = "none";
    });

    // Tab switching
    let tabs = this.questPanel.querySelectorAll(".quest-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        let tabId = (tab as HTMLElement).dataset.tab;
        if (tabId === "active") {
          this.questActiveList.style.display = "";
          this.questAvailableList.style.display = "none";
        } else {
          this.questActiveList.style.display = "none";
          this.questAvailableList.style.display = "";
          // Request available quests
          socket.send(PacketType.QUEST_LIST, {});
        }
      });
    });

    // Dialog close
    this.questDialogClose.addEventListener("click", () => {
      this.questDialog.classList.remove("visible");
      this.questDialog.style.display = "none";
    });

    // Accept quest
    this.questDialogAccept.addEventListener("click", () => {
      if (this.selectedQuestId) {
        socket.send(PacketType.QUEST_ACCEPT, { questId: this.selectedQuestId });
        this.questDialog.classList.remove("visible");
        this.questDialog.style.display = "none";
      }
    });

    // Complete/turn-in quest
    this.questDialogComplete.addEventListener("click", () => {
      if (this.selectedQuestId) {
        socket.send(PacketType.QUEST_COMPLETE, {
          questId: this.selectedQuestId,
        });
        this.questDialog.classList.remove("visible");
        this.questDialog.style.display = "none";
      }
    });

    // Abandon quest
    this.questDialogAbandon.addEventListener("click", () => {
      if (this.selectedQuestId) {
        socket.send(PacketType.QUEST_ABANDON, {
          questId: this.selectedQuestId,
        });
        this.questDialog.classList.remove("visible");
        this.questDialog.style.display = "none";
      }
    });

    // Keyboard shortcut J
    document.addEventListener("keydown", (e) => {
      if (this.chatFocused) return;
      if (e.key === "j" || e.key === "J") {
        this.toggleQuestPanel();
      }
    });
  }

  private toggleQuestPanel(): void {
    let isVisible = this.questPanel.classList.contains("visible");
    if (isVisible) {
      this.questPanel.classList.remove("visible");
      this.questPanel.style.display = "none";
    } else {
      this.questPanel.classList.add("visible");
      this.questPanel.style.display = "flex";
      // Request latest quest data
      socket.send(PacketType.QUEST_LIST, {});
    }
  }

  private renderActiveQuests(): void {
    if (!this.questActiveList) return;

    if (this.activeQuests.length === 0) {
      this.questActiveList.innerHTML =
        '<div class="quest-empty">No active quests. Talk to NPCs to find quests!</div>';
      return;
    }

    let html = "";
    for (let aq of this.activeQuests) {
      let q = aq.quest;
      if (!q) continue;

      let isCompleted = aq.status === "completed";
      let totalProgress = 0;
      let totalRequired = 0;

      for (let i = 0; i < q.objectives.length; i++) {
        let obj = q.objectives[i];
        let cur = aq.objectives[i]?.current || 0;
        totalProgress += Math.min(cur, obj.count);
        totalRequired += obj.count;
      }

      let pct =
        totalRequired > 0
          ? Math.floor((totalProgress / totalRequired) * 100)
          : 0;
      let progressText = q.objectives
        .map((obj: any, i: number) => {
          let cur = aq.objectives[i]?.current || 0;
          return `${this.getObjectiveLabel(obj)}: ${Math.min(cur, obj.count)}/${obj.count}`;
        })
        .join(" | ");

      html += `
        <div class="quest-item ${isCompleted ? "completed" : ""}" data-quest-id="${aq.questId}" data-quest-mode="active">
          <div class="quest-item-header">
            <span class="quest-item-name">${isCompleted ? "[DONE] " : ""}${q.nameKo}</span>
            <span class="quest-item-level">Lv.${q.level}</span>
          </div>
          <div class="quest-item-desc">${progressText}</div>
          <div class="quest-progress-bar">
            <div class="quest-progress-fill ${isCompleted ? "complete" : ""}" style="width:${pct}%"></div>
          </div>
        </div>`;
    }

    this.questActiveList.innerHTML = html;

    // Click handlers
    this.questActiveList.querySelectorAll(".quest-item").forEach((el) => {
      el.addEventListener("click", () => {
        let questId = (el as HTMLElement).dataset.questId!;
        this.showQuestDialog(questId, "active");
      });
    });
  }

  private renderAvailableQuests(): void {
    if (!this.questAvailableList) return;

    if (this.availableQuests.length === 0) {
      this.questAvailableList.innerHTML =
        '<div class="quest-empty">No new quests available. Level up or complete current quests!</div>';
      return;
    }

    let html = "";
    for (let q of this.availableQuests) {
      html += `
        <div class="quest-item" data-quest-id="${q.id}" data-quest-mode="available">
          <div class="quest-item-header">
            <span class="quest-item-name">${q.nameKo}</span>
            <span class="quest-item-level">Lv.${q.level}</span>
          </div>
          <div class="quest-item-desc">${q.descriptionKo}</div>
        </div>`;
    }

    this.questAvailableList.innerHTML = html;

    this.questAvailableList.querySelectorAll(".quest-item").forEach((el) => {
      el.addEventListener("click", () => {
        let questId = (el as HTMLElement).dataset.questId!;
        this.showQuestDialog(questId, "available");
      });
    });
  }

  private showQuestDialog(questId: string, mode: "active" | "available"): void {
    this.selectedQuestId = questId;

    let quest: any = null;
    let progress: any = null;

    if (mode === "active") {
      let aq = this.activeQuests.find((a) => a.questId === questId);
      if (!aq || !aq.quest) return;
      quest = aq.quest;
      progress = aq;
    } else {
      quest = this.availableQuests.find((q) => q.id === questId);
      if (!quest) return;
    }

    this.questDialogTitle.textContent = quest.nameKo;
    this.questDialogDesc.textContent = quest.descriptionKo;

    // Objectives
    let objHtml = '<div class="quest-obj-title">Objectives</div>';
    for (let i = 0; i < quest.objectives.length; i++) {
      let obj = quest.objectives[i];
      let cur = progress ? progress.objectives[i]?.current || 0 : 0;
      let isDone = cur >= obj.count;
      objHtml += `
        <div class="quest-obj-item">
          <span class="quest-obj-check ${isDone ? "done" : ""}">${isDone ? "V" : ""}</span>
          <span>${this.getObjectiveLabel(obj)}: ${cur}/${obj.count}</span>
        </div>`;
    }
    this.questDialogObjectives.innerHTML = objHtml;

    // Rewards
    let rewHtml = '<div class="quest-reward-title">Rewards</div>';
    if (quest.rewards.exp) {
      rewHtml += `<div class="quest-reward-item">EXP: ${quest.rewards.exp}</div>`;
    }
    if (quest.rewards.gold) {
      rewHtml += `<div class="quest-reward-item">Gold: ${quest.rewards.gold}</div>`;
    }
    if (quest.rewards.statPoints) {
      rewHtml += `<div class="quest-reward-item">Stat Points: ${quest.rewards.statPoints}</div>`;
    }
    if (quest.rewards.items) {
      for (let item of quest.rewards.items) {
        rewHtml += `<div class="quest-reward-item">Item: ${item.itemId} x${item.count}</div>`;
      }
    }
    this.questDialogRewards.innerHTML = rewHtml;

    // Show/hide buttons based on mode
    if (mode === "available") {
      this.questDialogAccept.style.display = "";
      this.questDialogComplete.style.display = "none";
      this.questDialogAbandon.style.display = "none";
    } else {
      this.questDialogAccept.style.display = "none";
      let isCompleted = progress?.status === "completed";
      this.questDialogComplete.style.display = isCompleted ? "" : "none";
      this.questDialogAbandon.style.display = "";
    }

    this.questDialog.style.display = "flex";
    this.questDialog.classList.add("visible");
  }

  private getObjectiveLabel(obj: any): string {
    switch (obj.type) {
      case "kill":
        return `Defeat ${obj.target}`;
      case "boss":
        return `Defeat Boss ${obj.target}`;
      case "collect":
        return `Collect ${obj.target}`;
      case "vocab":
        return `Answer quiz correctly`;
      case "explore":
        return `Visit ${obj.target}`;
      case "talk":
        return `Talk to NPC`;
      default:
        return obj.type;
    }
  }

  // ================================================
  // Achievement System
  // ================================================

  private setupAchievementPanel(): void {
    // Close button
    this.achievementClose?.addEventListener("click", () => {
      this.achievementPanel.classList.remove("visible");
    });

    // HUD button
    this.hudAchBtn?.addEventListener("click", () => {
      this.toggleAchievementPanel();
    });

    // Tab buttons
    this.achievementTabs?.addEventListener("click", (e) => {
      let target = e.target as HTMLElement;
      if (target.classList.contains("ach-tab")) {
        this.achievementCategory = target.dataset.category || "all";
        this.achievementTabs
          .querySelectorAll(".ach-tab")
          .forEach((t) => t.classList.remove("active"));
        target.classList.add("active");
        this.renderAchievements();
      }
    });

    // Keyboard shortcut Y
    document.addEventListener("keydown", (e) => {
      if (this.chatFocused) return;
      if (e.key === "y" || e.key === "Y") {
        this.toggleAchievementPanel();
      }
    });
  }

  private toggleAchievementPanel(): void {
    let isVisible = this.achievementPanel.classList.contains("visible");
    if (isVisible) {
      this.achievementPanel.classList.remove("visible");
    } else {
      this.achievementPanel.classList.add("visible");
      // Request latest achievement data
      socket.send(PacketType.ACHIEVEMENT_LIST, {});
    }
  }

  private renderAchievements(): void {
    if (!this.achievementList) return;

    let filtered =
      this.achievementCategory === "all"
        ? this.achievementData
        : this.achievementData.filter(
            (a: any) => a.category === this.achievementCategory,
          );

    // Sort: unlocked first, then by progress percentage
    filtered.sort((a: any, b: any) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      let aPct = a.requirement.count > 0 ? a.progress / a.requirement.count : 0;
      let bPct = b.requirement.count > 0 ? b.progress / b.requirement.count : 0;
      return bPct - aPct;
    });

    let unlockedCount = this.achievementData.filter(
      (a: any) => a.unlocked,
    ).length;
    this.achievementCount.textContent = `${unlockedCount} / ${this.achievementData.length}`;

    let html = "";
    for (let ach of filtered) {
      let isHidden = ach.hidden && !ach.unlocked;
      let pct =
        ach.requirement.count > 0
          ? Math.floor((ach.progress / ach.requirement.count) * 100)
          : 0;
      pct = Math.min(pct, 100);

      let icon = isHidden ? "?" : ach.icon;
      let name = isHidden ? "???" : ach.nameKo;
      let desc = isHidden ? "Hidden achievement" : ach.descriptionKo;

      let rewardText = "";
      if (ach.reward) {
        if (ach.reward.exp) rewardText += `+${ach.reward.exp} EXP`;
        if (ach.reward.gold) rewardText += ` +${ach.reward.gold}G`;
        if (ach.reward.titleKo)
          rewardText += `<span class="ach-title-reward">"${ach.reward.titleKo}"</span>`;
      }

      html += `
        <div class="ach-item ${ach.unlocked ? "unlocked" : ""} ${isHidden ? "hidden-locked" : ""}">
          <div class="ach-icon">${icon}</div>
          <div class="ach-info">
            <div class="ach-name">${name}</div>
            <div class="ach-desc">${desc}</div>
            ${
              !ach.unlocked && !isHidden
                ? `<div class="ach-progress">
                    <div class="ach-progress-bar">
                      <div class="ach-progress-fill" style="width:${pct}%"></div>
                    </div>
                    <div class="ach-progress-text">${ach.progress} / ${ach.requirement.count}</div>
                  </div>`
                : ach.unlocked
                  ? `<div class="ach-progress">
                      <div class="ach-progress-bar">
                        <div class="ach-progress-fill" style="width:100%"></div>
                      </div>
                    </div>`
                  : ""
            }
          </div>
          <div class="ach-reward">${rewardText}</div>
        </div>`;
    }

    this.achievementList.innerHTML =
      html ||
      '<div style="text-align:center;color:var(--text-dim);padding:20px;">No achievements in this category</div>';
  }

  private showAchievementToast(data: any): void {
    // Clear existing timer
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.achievementToast.classList.remove("visible");
    }

    this.toastIcon.textContent = data.icon || "";
    this.toastName.textContent = data.nameKo || data.name;
    this.toastDesc.textContent = data.descriptionKo || data.description;

    let rewardParts: string[] = [];
    if (data.reward?.exp) rewardParts.push(`+${data.reward.exp} EXP`);
    if (data.reward?.gold) rewardParts.push(`+${data.reward.gold} Gold`);
    if (data.reward?.titleKo) rewardParts.push(`"${data.reward.titleKo}"`);
    this.toastReward.textContent = rewardParts.join(" ");

    // Trigger animation
    void this.achievementToast.offsetHeight;
    this.achievementToast.classList.add("visible");

    this.toastTimer = window.setTimeout(() => {
      this.achievementToast.classList.remove("visible");
      this.toastTimer = null;
    }, 4000);
  }

  private setupSocketListeners(): void {
    // Store player ID from WELCOME
    socket.on(PacketType.WELCOME, (data: any) => {
      this.currentPlayerId = data.playerId || data.player?.id || "";
    });

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
      (data: {
        success: boolean;
        destroyed: boolean;
        newLevel: number;
        itemName?: string;
      }) => {
        this.showEnhanceResult(
          data.success,
          data.destroyed,
          data.newLevel,
          data.itemName,
        );
      },
    );

    // Enhancement server-wide announcement (+7 and above)
    socket.on(
      PacketType.ENHANCE_ANNOUNCE,
      (data: { playerName: string; itemName: string; level: number }) => {
        this.addEnhanceAnnouncement(data.playerName, data.itemName, data.level);
      },
    );

    // Daily login reward
    socket.on(
      PacketType.DAILY_REWARD,
      (data: {
        day: number;
        type: string;
        amount: number;
        itemId?: string;
        streak: number;
      }) => {
        this.showDailyRewardPopup(data);
      },
    );

    // Milestone reward
    socket.on(
      PacketType.MILESTONE_REWARD,
      (data: {
        level: number;
        rewards: {
          gold: number;
          items?: Array<{ id: string; count: number; name: string }>;
        };
      }) => {
        this.showMilestoneReward(data.level, data.rewards);
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

    // Quest updates
    socket.on(PacketType.QUEST_UPDATE, (data: any) => {
      this.activeQuests = data.quests || [];
      this.renderActiveQuests();
    });

    socket.on(PacketType.QUEST_AVAILABLE, (data: any) => {
      this.availableQuests = data.quests || [];
      this.renderAvailableQuests();
    });

    socket.on(PacketType.QUEST_COMPLETE, (data: any) => {
      this.showNotification(`Quest reward received!`, "success");
    });

    // Achievement unlock toast
    socket.on(PacketType.ACHIEVEMENT_UNLOCK, (data: any) => {
      this.showAchievementToast(data);
    });

    // Achievement list response
    socket.on(PacketType.ACHIEVEMENT_LIST, (data: any) => {
      this.achievementData = data.achievements || [];
      this.renderAchievements();
    });

    // Crafting
    socket.on(PacketType.CRAFT_LIST, (data: any) => {
      this.handleCraftList(data);
      // Open crafting panel if not already open
      if (!this.craftingPanel.classList.contains("visible")) {
        this.craftingPanel.classList.add("visible");
      }
    });

    socket.on(PacketType.CRAFT_RESULT, (data: any) => {
      this.handleCraftResult(data);
    });

    // Respawn
    socket.on(PacketType.RESPAWN, () => {
      this.hideDeathScreen();
    });

    // Trade
    socket.on(PacketType.TRADE_REQUEST, (data: any) => {
      this.tradeRequesterId = data.requesterId;
      this.tradeRequestName.textContent = `${data.requesterName} wants to trade.`;
      this.tradeRequestPopup.style.display = "block";
    });
    socket.on(PacketType.TRADE_ACCEPT, (data: any) => {
      this.openTrade(data.partnerName);
    });
    socket.on(PacketType.TRADE_DECLINE, (data: any) => {
      this.showNotification(
        `${data.playerName || "Player"} declined the trade.`,
        "info",
      );
    });
    socket.on(PacketType.TRADE_OFFER_UPDATE, (data: any) => {
      if (data.from === "partner") {
        this.renderTradePartnerOffer(data.items || [], data.gold || 0);
        this.tradeMyConfirmed = false;
        this.tradePartnerConfirmed = false;
        this.updateTradeStatus();
      }
    });
    socket.on(PacketType.TRADE_CONFIRM, (data: any) => {
      if (data.who === "self") this.tradeMyConfirmed = true;
      if (data.who === "partner") this.tradePartnerConfirmed = true;
      this.updateTradeStatus();
    });
    socket.on(PacketType.TRADE_CANCEL, (data: any) => {
      this.closeTrade();
      if (data.reason) this.showNotification(data.reason, "info");
    });
    socket.on(PacketType.TRADE_COMPLETE, () => {
      this.closeTrade();
      this.showNotification("Trade completed!", "success");
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

    // Party invite
    socket.on(
      PacketType.PARTY_INVITE,
      (data: { fromId: string; fromName: string }) => {
        this.showPartyInvite(data.fromName);
      },
    );

    // Party update (members, HP, etc.)
    socket.on(PacketType.PARTY_UPDATE, (data: { party: PartyData | null }) => {
      this.currentPartyData = data.party;
      this.renderPartyFrame();
    });

    // Party chat
    socket.on(
      PacketType.PARTY_CHAT,
      (data: { sender: string; message: string }) => {
        this.addChatMessage(`[P] ${data.sender}`, data.message, "party");
      },
    );

    // PK mode toggle response
    socket.on(PacketType.PK_TOGGLE, (data: { pkMode: boolean }) => {
      this.updatePkMode(data.pkMode);
    });

    // Auto-potion toggle response
    socket.on(
      PacketType.AUTO_POTION_TOGGLE,
      (data: { autoPotion: boolean }) => {
        this.updateAutoPotion(data.autoPotion);
      },
    );

    // Ground item spawned
    socket.on(PacketType.GROUND_ITEM, (data: { item: GroundItemDrop }) => {
      this.groundItems.set(data.item.id, data.item);
    });

    // Ground item removed (picked up or expired)
    socket.on(PacketType.GROUND_ITEM_REMOVED, (data: { id: string }) => {
      this.groundItems.delete(data.id);
    });
  }

  // ================================================
  // Party System
  // ================================================

  private setupPartyPanel(): void {
    this.partyLeaveBtn.addEventListener("click", () => {
      socket.send(PacketType.PARTY_LEAVE);
    });

    this.partyInviteAccept.addEventListener("click", () => {
      this.partyInvitePopup.classList.remove("visible");
      socket.send(PacketType.PARTY_ACCEPT);
    });

    this.partyInviteDecline.addEventListener("click", () => {
      this.partyInvitePopup.classList.remove("visible");
      socket.send(PacketType.PARTY_DECLINE);
    });
  }

  private showPartyInvite(fromName: string): void {
    this.partyInviteText.textContent = `${fromName} invites you to a party.`;
    this.partyInvitePopup.classList.add("visible");

    // Auto-hide after 30 seconds
    setTimeout(() => {
      this.partyInvitePopup.classList.remove("visible");
    }, 30000);
  }

  private renderPartyFrame(): void {
    if (!this.currentPartyData || this.currentPartyData.members.length === 0) {
      this.partyFrame.classList.remove("visible");
      this.currentPartyData = null;
      return;
    }

    this.partyFrame.classList.add("visible");
    let html = "";

    const classIcons: Record<string, string> = {
      warrior: "W",
      knight: "K",
      mage: "M",
      archer: "A",
    };

    for (let member of this.currentPartyData.members) {
      let isLeader = member.id === this.currentPartyData.leaderId;
      let isMe = member.id === this.currentPlayerId;
      let hpPct =
        member.maxHp > 0
          ? Math.max(0, Math.min(100, (member.hp / member.maxHp) * 100))
          : 0;
      let icon = classIcons[member.playerClass] || "?";

      html += `<div class="party-member" data-member-id="${member.id}">`;
      html += `<div class="party-member-icon ${member.playerClass}">${icon}</div>`;
      html += `<div class="party-member-info">`;
      html += `<div class="party-member-name">`;
      if (isLeader) html += `<span class="party-leader-crown">&#9813;</span>`;
      html += `<span>${member.name}${isMe ? " (me)" : ""}</span>`;
      html += `<span class="party-member-level">Lv.${member.level}</span>`;
      html += `</div>`;
      html += `<div class="party-hp-bar"><div class="party-hp-fill" style="width:${hpPct}%"></div></div>`;
      html += `</div>`;
      html += `</div>`;
    }

    this.partyMembers.innerHTML = html;

    // Right-click context menu for kick (leader only)
    let memberEls = this.partyMembers.querySelectorAll(".party-member");
    memberEls.forEach((el) => {
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        let memberId = (el as HTMLElement).dataset.memberId;
        if (!memberId || memberId === this.currentPlayerId) return;
        if (
          !this.currentPartyData ||
          this.currentPartyData.leaderId !== this.currentPlayerId
        )
          return;

        if (confirm("Kick this member from the party?")) {
          socket.send(PacketType.PARTY_KICK, { targetId: memberId });
        }
      });
    });
  }

  // Public method for GameScene to call when right-clicking a player
  inviteToParty(targetId: string): void {
    socket.send(PacketType.PARTY_INVITE, { targetId });
  }

  private setupTradePanel(): void {
    if (!this.tradeAcceptBtn) return;
    this.tradeAcceptBtn.addEventListener("click", () => {
      if (this.tradeRequesterId)
        socket.send(PacketType.TRADE_ACCEPT, {
          requesterId: this.tradeRequesterId,
        });
      this.tradeRequestPopup.style.display = "none";
      this.tradeRequesterId = "";
    });
    this.tradeDeclineBtn.addEventListener("click", () => {
      socket.send(PacketType.TRADE_DECLINE, {});
      this.tradeRequestPopup.style.display = "none";
      this.tradeRequesterId = "";
    });
    this.tradeConfirmBtn.addEventListener("click", () => {
      this.sendTradeOffer();
      socket.send(PacketType.TRADE_CONFIRM, {});
    });
    this.tradeCancelBtn.addEventListener("click", () => {
      socket.send(PacketType.TRADE_CANCEL, {});
      this.closeTrade();
    });
    this.tradeCloseBtn.addEventListener("click", () => {
      socket.send(PacketType.TRADE_CANCEL, {});
      this.closeTrade();
    });
    this.tradeMyGoldInput.addEventListener("change", () =>
      this.sendTradeOffer(),
    );
  }

  requestTradeWithPlayer(targetId: string): void {
    socket.send(PacketType.TRADE_REQUEST, { targetId });
  }

  private openTrade(pn: string): void {
    this.tradeActive = true;
    this.tradeSelectedSlots.clear();
    this.tradeMyConfirmed = false;
    this.tradePartnerConfirmed = false;
    this.tradePartnerNameEl.textContent = `vs ${pn}`;
    this.tradeMyGoldInput.value = "0";
    this.tradePartnerGoldEl.textContent = "0";
    this.tradeMyItems.innerHTML = "";
    this.tradePartnerItems.innerHTML = "";
    this.tradeStatus.textContent = "";
    this.tradePanel.style.display = "block";
    this.renderTradeMyInventory();
  }

  private closeTrade(): void {
    this.tradeActive = false;
    this.tradeSelectedSlots.clear();
    this.tradePanel.style.display = "none";
  }

  private renderTradeMyInventory(): void {
    this.tradeMyItems.innerHTML = "";
    for (let i = 0; i < this.inventory.length; i++) {
      const s = this.inventory[i];
      if (!s?.itemId) continue;
      const d = this.itemDefs.get(s.itemId);
      const dv = document.createElement("div");
      dv.className =
        "trade-inv-slot" + (this.tradeSelectedSlots.has(i) ? " selected" : "");
      const ic = document.createElement("div");
      ic.className = "trade-item-icon";
      ic.style.backgroundColor = d?.color || "#888";
      dv.appendChild(ic);
      const nm = document.createElement("div");
      nm.className = "trade-item-name";
      let lb = d?.nameKo || s.itemId;
      if (s.enhancement && s.enhancement > 0) lb = `+${s.enhancement} ${lb}`;
      nm.textContent = lb;
      dv.appendChild(nm);
      const idx = i;
      dv.addEventListener("click", () => {
        if (this.tradeSelectedSlots.has(idx))
          this.tradeSelectedSlots.delete(idx);
        else this.tradeSelectedSlots.add(idx);
        this.tradeMyConfirmed = false;
        this.tradePartnerConfirmed = false;
        this.updateTradeStatus();
        this.renderTradeMyInventory();
        this.sendTradeOffer();
      });
      this.tradeMyItems.appendChild(dv);
    }
  }

  private sendTradeOffer(): void {
    const items: Array<{ slotIndex: number; count: number }> = [];
    for (const idx of this.tradeSelectedSlots) {
      const s = this.inventory[idx];
      if (s) items.push({ slotIndex: idx, count: s.count });
    }
    socket.send(PacketType.TRADE_OFFER_UPDATE, {
      items,
      gold: parseInt(this.tradeMyGoldInput.value) || 0,
    });
  }

  private renderTradePartnerOffer(items: any[], gold: number): void {
    this.tradePartnerItems.innerHTML = "";
    for (const it of items) {
      const dv = document.createElement("div");
      dv.className = "trade-inv-slot";
      const ic = document.createElement("div");
      ic.className = "trade-item-icon";
      ic.style.backgroundColor = it.itemColor || "#888";
      dv.appendChild(ic);
      const nm = document.createElement("div");
      nm.className = "trade-item-name";
      let lb = it.itemName || "";
      if (it.enhancement > 0) lb = `+${it.enhancement} ${lb}`;
      if (it.count > 1) lb += ` x${it.count}`;
      nm.textContent = lb;
      dv.appendChild(nm);
      this.tradePartnerItems.appendChild(dv);
    }
    this.tradePartnerGoldEl.textContent = String(gold);
  }

  private updateTradeStatus(): void {
    const p: string[] = [];
    if (this.tradeMyConfirmed) p.push("You: Ready");
    if (this.tradePartnerConfirmed) p.push("Partner: Ready");
    this.tradeStatus.textContent = p.join(" | ");
    this.tradeConfirmBtn.style.opacity = this.tradeMyConfirmed ? "0.5" : "1";
  }

  private renderSetBonuses(): void {
    const ex = document.getElementById("set-bonus-container");
    if (ex) ex.remove();
    const sc: Record<string, number> = {};
    for (const sl of Object.values(EquipSlot)) {
      const iid = this.equipment[sl];
      if (iid) {
        const df = this.itemDefs.get(iid);
        if (df?.setId) sc[df.setId] = (sc[df.setId] || 0) + 1;
      }
    }
    if (Object.keys(sc).length === 0) return;
    const ct = document.createElement("div");
    ct.id = "set-bonus-container";
    ct.className = "set-bonus-section";
    for (const [sid, cnt] of Object.entries(sc)) {
      const sd = SET_BONUSES[sid];
      if (!sd) continue;
      const en = document.createElement("div");
      en.className = "set-bonus-entry";
      const tl = document.createElement("div");
      tl.className = "set-bonus-title";
      tl.textContent = `${sd.nameKo} (${cnt}/${sd.pieces})`;
      en.appendChild(tl);
      for (const tr of sd.bonuses) {
        const te = document.createElement("div");
        te.className =
          "set-bonus-tier " +
          (cnt >= tr.piecesRequired ? "active" : "inactive");
        te.textContent = `(${tr.piecesRequired}) ${tr.descriptionKo}`;
        en.appendChild(te);
      }
      ct.appendChild(en);
    }
    if (this.equipmentSlots?.parentElement)
      this.equipmentSlots.parentElement.insertBefore(
        ct,
        this.equipmentSlots.nextSibling,
      );
  }
}

// Singleton instance
export const ui = new UIManager();
