import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PortalBackLinkProps {
  href: string;
  label?: string;
}

export default function PortalBackLink({ href, label = "Back" }: PortalBackLinkProps) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#546E7A] transition hover:text-[#1565C0]"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
