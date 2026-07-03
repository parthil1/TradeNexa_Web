export interface MarketplaceTheme {
  iconBg: string;
  iconText: string;
  productBadge: string;
  productBadgeText: string;
  pastel: string;
}

/** B2B palette — navy / slate / blue variants only (no consumer rainbow) */
const THEMES: MarketplaceTheme[] = [
  {
    iconBg: "bg-slate-100",
    iconText: "text-slate-700",
    productBadge: "bg-[#1a3a5c]",
    productBadgeText: "text-white",
    pastel: "bg-slate-50",
  },
  {
    iconBg: "bg-blue-50",
    iconText: "text-blue-800",
    productBadge: "bg-blue-800",
    productBadgeText: "text-white",
    pastel: "bg-blue-50/80",
  },
  {
    iconBg: "bg-slate-100",
    iconText: "text-[#234a73]",
    productBadge: "bg-[#234a73]",
    productBadgeText: "text-white",
    pastel: "bg-slate-50",
  },
  {
    iconBg: "bg-blue-100",
    iconText: "text-blue-700",
    productBadge: "bg-primary",
    productBadgeText: "text-white",
    pastel: "bg-blue-50",
  },
  {
    iconBg: "bg-slate-100",
    iconText: "text-slate-600",
    productBadge: "bg-slate-700",
    productBadgeText: "text-white",
    pastel: "bg-slate-50",
  },
  {
    iconBg: "bg-blue-50",
    iconText: "text-[#1a3a5c]",
    productBadge: "bg-[#1a2b4c]",
    productBadgeText: "text-white",
    pastel: "bg-slate-50",
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
export const B2B_HEADING = "#1a2b4c";
export const B2B_NAVY = "#1a3a5c";
export const B2B_NAVY_MID = "#234a73";
