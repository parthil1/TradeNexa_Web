import type { ReactNode } from "react";

interface RfqListSidebarProps {
  stats: { label: string; value: string | number; highlight?: boolean }[];
  action?: ReactNode;
}

export default function RfqListSidebar({ stats, action }: RfqListSidebarProps) {
  return (
    <aside className="mt-6 hidden lg:mt-0 lg:block">
      <div className="sticky top-20 space-y-4">
        <div className="surface-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-placeholder">
            Quick stats
          </p>
          <dl className="mt-3 space-y-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs text-muted-fg">{stat.label}</dt>
                <dd
                  className={`text-2xl font-semibold tracking-tight ${
                    stat.highlight ? "text-primary" : "text-foreground"
                  }`}
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {action ?? null}
      </div>
    </aside>
  );
}
