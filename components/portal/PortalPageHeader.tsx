import type { ReactNode } from "react";

interface PortalPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PortalPageHeader({ title, subtitle, action }: PortalPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold text-[#0D1B2A] sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[#546E7A]">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
