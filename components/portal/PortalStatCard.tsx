import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface PortalStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  compact?: boolean;
  href?: string;
}

export default function PortalStatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  compact = false,
  href,
}: PortalStatCardProps) {
  const content = (
    <>
      <div className={`inline-flex rounded-xl ${compact ? "mb-3 p-2" : "mb-4 p-2.5"} ${bg}`}>
        <Icon className={`${compact ? "h-4 w-4" : "h-5 w-5"} ${color}`} strokeWidth={2} aria-hidden />
      </div>
      <p
        className={`font-semibold tracking-tight text-foreground ${compact ? "text-lg" : "text-2xl"}`}
      >
        {value}
      </p>
      <p className={`mt-1 font-medium text-muted-fg ${compact ? "text-xs" : "text-sm"}`}>{title}</p>
    </>
  );

  const className = `surface-card-hover ${compact ? "p-4" : "p-5"} ${
    href ? "relative z-0 block cursor-pointer" : ""
  }`;

  if (href) {
    return (
      <Link href={href} className={className} aria-label={`${title}: ${value}`}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
