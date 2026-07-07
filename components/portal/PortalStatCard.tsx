import type { LucideIcon } from "lucide-react";

interface PortalStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export default function PortalStatCard({ title, value, icon: Icon, color, bg }: PortalStatCardProps) {
  return (
    <div className="rounded-2xl border border-[#E8ECF0] bg-white p-4 shadow-sm">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-extrabold text-[#0D1B2A]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#546E7A]">{title}</p>
    </div>
  );
}
