export interface MarketplaceTheme {
  iconBg: string;
  iconText: string;
  productBadge: string;
  productBadgeText: string;
  pastel: string;
}

const THEMES: MarketplaceTheme[] = [
  {
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    productBadge: "bg-blue-500",
    productBadgeText: "text-white",
    pastel: "bg-blue-50",
  },
  {
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    productBadge: "bg-emerald-500",
    productBadgeText: "text-white",
    pastel: "bg-emerald-50",
  },
  {
    iconBg: "bg-orange-100",
    iconText: "text-orange-500",
    productBadge: "bg-orange-500",
    productBadgeText: "text-white",
    pastel: "bg-orange-50",
  },
  {
    iconBg: "bg-red-100",
    iconText: "text-red-500",
    productBadge: "bg-red-500",
    productBadgeText: "text-white",
    pastel: "bg-red-50",
  },
  {
    iconBg: "bg-violet-100",
    iconText: "text-violet-600",
    productBadge: "bg-violet-500",
    productBadgeText: "text-white",
    pastel: "bg-violet-50",
  },
  {
    iconBg: "bg-teal-100",
    iconText: "text-teal-600",
    productBadge: "bg-teal-500",
    productBadgeText: "text-white",
    pastel: "bg-teal-50",
  },
  {
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
    productBadge: "bg-amber-500",
    productBadgeText: "text-white",
    pastel: "bg-amber-50",
  },
  {
    iconBg: "bg-pink-100",
    iconText: "text-pink-500",
    productBadge: "bg-pink-500",
    productBadgeText: "text-white",
    pastel: "bg-pink-50",
  },
];

export function getMarketplaceTheme(seed: number | string): MarketplaceTheme {
  const index =
    typeof seed === "number"
      ? Math.abs(seed) % THEMES.length
      : Math.abs(hashString(String(seed))) % THEMES.length;
  return THEMES[index];
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export const MARKETPLACE_NAVY = "from-[#1a3a5c] to-[#234a73]";
