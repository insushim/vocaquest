// ============================================
// VocaQuest Online - Shop Definitions
// 100% Original Code - MIT License
// ============================================

import type { ShopDefinition } from "../../../shared/types";

export const SHOPS: Record<string, ShopDefinition> = {
  general_store: {
    id: "general_store",
    name: "General Store",
    nameKo: "잡화점",
    items: ["health_potion", "mana_potion", "pickaxe", "axe"],
  },
  weapon_shop: {
    id: "weapon_shop",
    name: "Weapon Shop",
    nameKo: "무기점",
    items: [
      "wooden_sword",
      "iron_sword",
      "steel_sword",
      "mithril_sword",
      "dragon_blade",
      "oak_staff",
      "crystal_staff",
      "hunting_bow",
      "longbow",
    ],
  },
  armor_shop: {
    id: "armor_shop",
    name: "Armor Shop",
    nameKo: "방어구점",
    items: [
      "leather_helmet",
      "iron_helmet",
      "steel_helmet",
      "leather_armor",
      "iron_armor",
      "steel_armor",
      "leather_pants",
      "iron_pants",
      "leather_boots",
      "iron_boots",
      "wooden_shield",
      "iron_shield",
    ],
  },
  potion_shop: {
    id: "potion_shop",
    name: "Potion Shop",
    nameKo: "물약점",
    items: [
      "health_potion",
      "mana_potion",
      "large_health_potion",
      "large_mana_potion",
    ],
  },
  accessory_shop: {
    id: "accessory_shop",
    name: "Accessory Shop",
    nameKo: "장신구점",
    items: ["copper_ring", "silver_ring", "stone_pendant", "ruby_pendant"],
  },
  elite_shop: {
    id: "elite_shop",
    name: "Elite Shop",
    nameKo: "엘리트 상점",
    items: [
      "mithril_sword",
      "dragon_blade",
      "crystal_staff",
      "longbow",
      "steel_helmet",
      "steel_armor",
      "iron_pants",
      "iron_boots",
      "iron_shield",
      "silver_ring",
      "ruby_pendant",
      "large_health_potion",
      "large_mana_potion",
    ],
  },
};
