export interface MarketplaceTheme {
  iconBg: string;
  iconText: string;
  productBadge: string;
  productBadgeText: string;
  pastel: string;
}

/** B2B palette — navy / muted / primary variants only (no consumer rainbow) */
const THEMES: MarketplaceTheme[] = [
  {
    iconBg: "bg-muted",
    iconText: "text-navy",
    productBadge: "bg-navy-mid",
    productBadgeText: "text-white",
    pastel: "bg-muted",
  },
  {
    iconBg: "bg-primary-soft",
    iconText: "text-primary",
    productBadge: "bg-primary",
    productBadgeText: "text-white",
    pastel: "bg-primary-soft/80",
  },
  {
    iconBg: "bg-muted",
    iconText: "text-navy-mid",
    productBadge: "bg-navy-mid",
    productBadgeText: "text-white",
    pastel: "bg-muted",
  },
  {
    iconBg: "bg-primary-soft",
    iconText: "text-primary-hover",
    productBadge: "bg-primary",
    productBadgeText: "text-white",
    pastel: "bg-primary-soft",
  },
  {
    iconBg: "bg-muted",
    iconText: "text-muted-fg",
    productBadge: "bg-navy",
    productBadgeText: "text-white",
    pastel: "bg-muted",
  },
  {
    iconBg: "bg-primary-soft",
    iconText: "text-navy-mid",
    productBadge: "bg-navy",
    productBadgeText: "text-white",
    pastel: "bg-muted",
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

export const MARKETPLACE_NAVY = "from-navy to-navy-mid";
export const B2B_HEADING = "#0D1B2A";
export const B2B_NAVY = "#0D1B2A";
export const B2B_NAVY_MID = "#1a3a5c";
