// ============================================
// VocaQuest Online - NPC Definitions
// 100% Original Code - MIT License
// ============================================

import type { NpcDefinition } from "../../../shared/types";
import { NpcType } from "../../../shared/types";

export const NPCS: Record<string, NpcDefinition> = {
  shop_keeper: {
    id: "shop_keeper",
    name: "Shopkeeper",
    nameKo: "잡화점 주인",
    type: NpcType.SHOP,
    shopId: "general_store",
    dialogue: ["Welcome to my shop!", "I have everything an adventurer needs."],
    dialogueKo: [
      "제 가게에 오신 걸 환영합니다!",
      "모험가에게 필요한 모든 것이 있답니다.",
    ],
    color: "#2ECC71",
  },
  weapon_master: {
    id: "weapon_master",
    name: "Weapon Master",
    nameKo: "무기 장인",
    type: NpcType.SHOP,
    shopId: "weapon_shop",
    dialogue: [
      "Looking for a fine weapon?",
      "My blades are the sharpest in the land.",
    ],
    dialogueKo: [
      "좋은 무기를 찾고 계신가요?",
      "제 검은 이 땅에서 가장 날카롭습니다.",
    ],
    color: "#E74C3C",
  },
  armor_smith: {
    id: "armor_smith",
    name: "Armor Smith",
    nameKo: "갑옷 대장장이",
    type: NpcType.SHOP,
    shopId: "armor_shop",
    dialogue: [
      "Need some protection?",
      "My armor will keep you safe out there.",
    ],
    dialogueKo: [
      "보호가 필요하신가요?",
      "제 갑옷이 당신을 안전하게 지켜줄 겁니다.",
    ],
    color: "#3498DB",
  },
  potion_brewer: {
    id: "potion_brewer",
    name: "Potion Brewer",
    nameKo: "물약 제조사",
    type: NpcType.SHOP,
    shopId: "potion_shop",
    dialogue: [
      "Potions for every occasion!",
      "Health, mana... I brew them all.",
    ],
    dialogueKo: [
      "모든 상황에 맞는 물약이 있습니다!",
      "체력, 마나... 모든 물약을 만듭니다.",
    ],
    color: "#9B59B6",
  },
  jeweler: {
    id: "jeweler",
    name: "Jeweler",
    nameKo: "보석상",
    type: NpcType.SHOP,
    shopId: "accessory_shop",
    dialogue: [
      "Rings and pendants of great power!",
      "Each gem holds a unique enchantment.",
    ],
    dialogueKo: [
      "강력한 반지와 목걸이가 있습니다!",
      "각 보석에는 특별한 마법이 깃들어 있습니다.",
    ],
    color: "#F1C40F",
  },
  elite_merchant: {
    id: "elite_merchant",
    name: "Elite Merchant",
    nameKo: "엘리트 상인",
    type: NpcType.SHOP,
    shopId: "elite_shop",
    dialogue: [
      "Only the finest goods for seasoned warriors.",
      "These items are not for beginners.",
    ],
    dialogueKo: [
      "숙련된 전사만을 위한 최고급 상품입니다.",
      "이 아이템들은 초보자용이 아닙니다.",
    ],
    color: "#E67E22",
  },
  guide: {
    id: "guide",
    name: "Guide",
    nameKo: "안내인",
    type: NpcType.INFO,
    dialogue: [
      "Welcome to VocaQuest Online!",
      "To the west lies the Starter Meadow, perfect for beginners.",
      "The Dark Forest to the northeast holds tougher monsters.",
      "The Scorching Desert to the southeast is for experienced fighters.",
      "The Frozen Mountains to the southwest are very dangerous.",
      "And the Shadow Realm to the far east... only the strongest survive there.",
      "Defeat monsters and answer quiz questions to earn items!",
      "Visit the shops in town to buy weapons and armor.",
    ],
    dialogueKo: [
      "VocaQuest Online에 오신 것을 환영합니다!",
      "서쪽에는 초보자에게 적합한 시작의 초원이 있습니다.",
      "북동쪽의 어둠의 숲에는 더 강한 몬스터가 있습니다.",
      "남동쪽의 타오르는 사막은 숙련된 전사를 위한 곳입니다.",
      "남서쪽의 얼어붙은 산맥은 매우 위험합니다.",
      "그리고 동쪽 끝의 그림자 영역은... 가장 강한 자만이 살아남습니다.",
      "몬스터를 처치하고 퀴즈에 답하면 아이템을 얻을 수 있습니다!",
      "마을의 상점에서 무기와 갑옷을 구매하세요.",
    ],
    color: "#1ABC9C",
  },
};
