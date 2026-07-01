import Image from "next/image";
import Link from "next/link";

type LogoSize = "xs" | "sm" | "nav" | "md" | "lg";

const sizeClasses: Record<Exclude<LogoSize, "nav">, string> = {
  xs: "h-8 max-w-[120px]",
  sm: "h-9 max-w-[140px] sm:h-10",
  md: "h-11 max-w-[160px] sm:h-12",
  lg: "h-16 max-w-[220px] sm:h-20",
};

interface LogoProps {
  size?: LogoSize;
  /** Set to false to render without a link */
  href?: string | false;
  className?: string;
  priority?: boolean;
}

/** Navbar: 60×60px display box — source image is 600×600 */
function NavbarLogo({ priority, className = "" }: { priority?: boolean; className?: string }) {
  return (
    <Image
      src="/tradenexa-logo.png"
      alt="TradeNexa"
      width={600}
      height={600}
      priority={priority}
      className={`size-[60px] object-contain object-left mix-blend-darken [clip-path:inset(0_0_24%_0)] ${className}`}
    />
  );
}

export function Logo({
  size = "md",
  href = "/",
  className = "",
  priority = false,
}: LogoProps) {
  if (size === "nav") {
    const navLogo = <NavbarLogo priority={priority} className={className} />;

    if (href !== false) {
      return (
        <Link href={href} className="inline-flex shrink-0 items-center" aria-label="TradeNexa home">
          {navLogo}
        </Link>
      );
    }
    return navLogo;
  }

  const image = (
    <Image
      src="/tradenexa-logo.png"
      alt="TradeNexa — CONNECT • TRADE • GROW"
      width={600}
      height={600}
      priority={priority}
      className={`w-auto object-contain object-left mix-blend-darken ${sizeClasses[size]} ${className}`}
    />
  );

  if (href !== false) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center" aria-label="TradeNexa home">
        {image}
      </Link>
    );
  }

  return <span className="inline-flex shrink-0 items-center">{image}</span>;
}
