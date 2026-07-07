import type { LucideIcon } from "lucide-react";

interface PortalEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function PortalEmptyState({ icon: Icon, title, description, action }: PortalEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E0E6ED] bg-white px-6 py-16 text-center">
      <div className="mb-4 rounded-2xl bg-[#E8EFF9] p-4">
        <Icon className="h-8 w-8 text-[#1565C0]" />
      </div>
      <h3 className="text-lg font-extrabold text-[#0D1B2A]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[#546E7A]">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
