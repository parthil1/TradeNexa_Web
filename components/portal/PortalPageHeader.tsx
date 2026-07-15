import type { ReactNode } from "react";

interface PortalPageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export default function PortalPageHeader({ title, subtitle, action }: PortalPageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <div className="max-w-2xl text-sm leading-relaxed text-muted-fg">{subtitle}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
