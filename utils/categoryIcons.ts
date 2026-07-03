import type { LucideIcon } from "lucide-react";
import {
  Sprout,
  FlaskConical,
  Zap,
  Tv,
  Wrench,
  Shirt,
  HardHat,
  Armchair,
  Box,
  Layers,
  Sun,
  Droplets,
  Cpu,
} from "lucide-react";

const SLUG_ICON_MAP: Record<string, LucideIcon> = {
  "agriculture-farming": Sprout,
  chemicals: FlaskConical,
  "solar-products": Sun,
  "water-treatment": Droplets,
  electronics: Tv,
  machinery: Wrench,
  textiles: Shirt,
  construction: HardHat,
  furniture: Armchair,
  packaging: Box,
};

export function getCategoryFallbackIcon(slug?: string, name?: string): LucideIcon {
  if (slug && SLUG_ICON_MAP[slug]) return SLUG_ICON_MAP[slug];

  const key = `${slug || ""} ${name || ""}`.toLowerCase();
  if (key.includes("agriculture") || key.includes("farming")) return Sprout;
  if (key.includes("chemical")) return FlaskConical;
  if (key.includes("solar")) return Sun;
  if (key.includes("water")) return Droplets;
  if (key.includes("electronic")) return Tv;
  if (key.includes("machinery") || key.includes("metal")) return Wrench;
  if (key.includes("textile") || key.includes("fashion")) return Shirt;
  if (key.includes("construct")) return HardHat;
  if (key.includes("furniture")) return Armchair;
  if (key.includes("packag")) return Box;
  if (key.includes("computer") || key.includes("network")) return Cpu;

  return Layers;
}
