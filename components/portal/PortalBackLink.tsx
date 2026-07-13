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
      className="-ml-2 mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-muted-fg transition-all duration-200 hover:gap-3 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 sm:mb-6"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
