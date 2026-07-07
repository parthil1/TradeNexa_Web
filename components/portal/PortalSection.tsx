interface PortalSectionProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function PortalSection({ title, subtitle, action, children }: PortalSectionProps) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-[#0D1B2A] sm:text-lg">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-[#546E7A] sm:text-sm">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
