interface PortalSectionProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function PortalSection({ title, subtitle, action, children }: PortalSectionProps) {
  return (
    <section className="mb-6 sm:mb-8">
      <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4 sm:items-end">
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-[#0D1B2A] sm:text-lg">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-[#546E7A] sm:text-sm">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
