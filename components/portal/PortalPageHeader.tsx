import type { ReactNode } from "react";

interface PortalPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PortalPageHeader({ title, subtitle, action }: PortalPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="space-y-1.5 sm:space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-fg sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
