interface PortalSectionProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
}

export default function PortalSection({
  title,
  subtitle,
  action,
  children,
  compact = false,
}: PortalSectionProps) {
  return (
    <section className={compact ? "mb-6" : "mb-8"}>
      <div
        className={`flex items-start justify-between gap-4 sm:items-end ${
          compact ? "mb-3" : "mb-4"
        }`}
      >
        <div className="min-w-0">
          <h3
            className={`font-semibold tracking-tight text-foreground ${
              compact ? "text-sm sm:text-base" : "text-base sm:text-lg"
            }`}
          >
            {title}
          </h3>
          {subtitle ? (
            <p className={`mt-1 text-muted-fg ${compact ? "text-xs" : "text-sm"}`}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
