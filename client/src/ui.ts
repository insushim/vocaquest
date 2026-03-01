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
      cooldown: 2,
    },
    {
      id: SkillId.SHIELD_BASH,
      nameKo: "방패공격",
      icon: "\u26E8",
      mpCost: 15,
      cooldown: 5,
    },
    {
      id: SkillId.WAR_CRY,
      nameKo: "전투함성",
      icon: "\uD83D\uDCA2",
      mpCost: 20,
      cooldown: 10,
    },
  ],
  [PlayerClass.MAGE]: [
    {
      id: SkillId.FIREBALL,
      nameKo: "화염구",
      icon: "\uD83D\uDD25",
      mpCost: 15,
      cooldown: 3,
    },
    {
      id: SkillId.ICE_BLAST,
      nameKo: "얼음폭발",
      icon: "\u2744",
      mpCost: 20,
      cooldown: 5,
    },
    {
      id: SkillId.HEAL,
      nameKo: "치유",
      icon: "\uD83D\uDC9A",
      mpCost: 25,
      cooldown: 8,
    },
  ],
  [PlayerClass.ARCHER]: [
    {
      id: SkillId.POWER_SHOT,
      nameKo: "강력사격",
      icon: "\uD83C\uDFF9",
      mpCost: 10,
      cooldown: 2,
    },
    {
      id: SkillId.MULTI_SHOT,
      nameKo: "다중사격",
      icon: "\uD83C\uDF1F",
      mpCost: 20,
      cooldown: 6,
    },
    {
      id: SkillId.EVASION,
      nameKo: "회피",
      icon: "\uD83D\uDCA8",
      mpCost: 15,
      cooldown: 10,
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
    socket.send(PacketType.LOGIN, { username, password, playerClass });
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

    this.loginError.textContent = "";
    socket.send(PacketType.REGISTER, { username, password, playerClass });
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
        const name = def?.nameKo || def?.name || slot.itemId;

        const icon = document.createElement("div");
        icon.className = "item-icon";
        icon.style.backgroundColor = color;
        slotDiv.appendChild(icon);

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

        // Click to equip/use
        slotDiv.addEventListener("click", () => {
          if (def?.equipSlot) {
            socket.send(PacketType.EQUIP_ITEM, { slotIndex: i });
          } else if (def?.type === ItemType.CONSUMABLE) {
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

  openShop(shopData: { name: string; nameKo: string; items: any[] }): void {
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

    for (let i = 0; i < 3; i++) {
      const skill = this.currentSkills[i];
      const iconEl = document.getElementById(`skill-icon-${i}`);
      const nameEl = document.getElementById(`skill-name-${i}`);

      if (skill && iconEl && nameEl) {
        iconEl.textContent = skill.icon;
        nameEl.textContent = skill.nameKo;
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
  // Close All Panels
  // ================================================

  closeAllPanels(): void {
    this.closeInventory();
    this.closeShop();
    this.hideQuiz();
  }

  isAnyPanelOpen(): boolean {
    return (
      this.inventoryPanel.classList.contains("visible") ||
      this.shopPanel.classList.contains("visible") ||
      this.quizPopup.classList.contains("visible")
    );
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
    socket.on(PacketType.STATS_UPDATE, (data: PlayerStats) => {
      this.updateHP(data.hp, data.maxHp);
      this.updateMP(data.mp, data.maxMp);
      this.updateEXP(data.exp, data.expToLevel);
      this.updateLevel(data.level);
      this.updateGold(data.gold);
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
    socket.on(
      PacketType.INVENTORY_UPDATE,
      (data: { slots: InventorySlot[]; itemDefs?: Record<string, any> }) => {
        this.updateInventory(data.slots, data.itemDefs);
      },
    );

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
