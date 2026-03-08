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
  scroll_merchant: {
    id: "scroll_merchant",
    name: "Scroll Merchant",
    nameKo: "주문서 상인",
    type: NpcType.SHOP,
    shopId: "scroll_shop",
    dialogue: [
      "Scrolls of great power await you.",
      "Enhancement scrolls, buff scrolls... I have them all.",
    ],
    dialogueKo: [
      "강력한 주문서들이 기다리고 있습니다.",
      "강화 주문서, 버프 주문서... 모든 것을 갖추고 있죠.",
    ],
    color: "#FF8C00",
  },
  blacksmith: {
    id: "blacksmith",
    name: "Blacksmith",
    nameKo: "대장장이",
    type: NpcType.ENHANCE,
    dialogue: [
      "Want to enhance your equipment?",
      "Bring me an enhancement scroll and I'll do my best.",
      "Be warned... enhancement can fail!",
    ],
    dialogueKo: [
      "장비를 강화하시겠습니까?",
      "강화 주문서를 가져오시면 최선을 다하겠습니다.",
      "주의하세요... 강화에 실패할 수도 있습니다!",
    ],
    color: "#D35400",
  },
  guide: {
    id: "guide",
    name: "Guide",
    nameKo: "안내인",
    type: NpcType.INFO,
    dialogue: [
      "Welcome to VocaQuest Online!",
      "Choose from 4 classes: Warrior, Knight, Mage, or Archer.",
      "To the west lies the Starter Meadow, perfect for beginners.",
      "The Dark Forest to the northeast holds tougher monsters.",
      "The Scorching Desert to the southeast is for experienced fighters.",
      "The Frozen Mountains to the southwest are very dangerous.",
      "The Shadow Realm to the east... only the strongest survive.",
      "Defeat monsters and answer quiz questions to earn items!",
      "Visit the Blacksmith to enhance your gear with scrolls!",
      "Allocate stat points when you level up to customize your build!",
    ],
    dialogueKo: [
      "VocaQuest Online에 오신 것을 환영합니다!",
      "4가지 직업 중 선택하세요: 전사, 기사, 마법사, 궁수.",
      "서쪽의 시작의 초원은 초보자에게 적합합니다.",
      "북동쪽의 어둠의 숲에는 더 강한 몬스터가 있습니다.",
      "남동쪽의 타오르는 사막은 숙련된 전사를 위한 곳입니다.",
      "남서쪽의 얼어붙은 산맥은 매우 위험합니다.",
      "동쪽의 그림자 영역은... 가장 강한 자만이 살아남습니다.",
      "몬스터를 처치하고 퀴즈에 답하면 아이템을 얻을 수 있습니다!",
      "대장장이를 방문하여 주문서로 장비를 강화하세요!",
      "레벨업 시 스탯 포인트를 배분하여 캐릭터를 커스터마이징하세요!",
    ],
    color: "#1ABC9C",
  },
  master_crafter: {
    id: "master_crafter",
    name: "Master Crafter",
    nameKo: "제작 장인",
    type: NpcType.CRAFT,
    dialogue: [
      "Bring me materials and I'll craft something magnificent!",
      "Each recipe requires specific materials from different zones.",
      "The rarest recipes require you to prove your knowledge through quizzes!",
    ],
    dialogueKo: [
      "재료를 가져오시면 멋진 것을 만들어 드리겠습니다!",
      "각 레시피에는 다양한 지역의 특정 재료가 필요합니다.",
      "가장 희귀한 레시피는 퀴즈로 지식을 증명해야 합니다!",
    ],
    color: "#E67E22",
  },
};
