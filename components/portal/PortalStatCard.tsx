import type { LucideIcon } from "lucide-react";

interface PortalStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  compact?: boolean;
}

export default function PortalStatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  compact = false,
}: PortalStatCardProps) {
  return (
    <div
      className={`surface-card-hover rounded-xl ${compact ? "p-4" : "p-5"}`}
    >
      <div className={`inline-flex rounded-xl ${compact ? "mb-3 p-2" : "mb-4 p-2.5"} ${bg}`}>
        <Icon className={`${compact ? "h-4 w-4" : "h-5 w-5"} ${color}`} />
      </div>
      <p className={`font-semibold tracking-tight text-portal-fg ${compact ? "text-lg" : "text-2xl"}`}>
        {value}
      </p>
      <p className={`mt-1 font-medium text-portal-muted ${compact ? "text-xs" : "text-sm"}`}>
        {title}
      </p>
    </div>
  );
}
