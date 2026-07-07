"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Globe } from "lucide-react";
import type { PortalNavItem } from "@/components/portal/PortalBottomNav";

interface PortalSidebarProps {
  items: PortalNavItem[];
  brand: { title: string; subtitle: string; href: string };
  accent?: "buyer" | "seller";
}

export default function PortalSidebar({ items, brand, accent = "buyer" }: PortalSidebarProps) {
  const pathname = usePathname();
  const activeBorder = accent === "seller" ? "border-[#FF6D00]" : "border-[#5E92F3]";

  return (
    <aside className="hidden h-dvh w-64 shrink-0 flex-col overflow-hidden bg-[#1a2b4c] text-slate-300 lg:flex">
      <div className="shrink-0 border-b border-white/10 px-4 py-4">
        <Link href={brand.href} className="flex flex-col items-center text-center">
          <div className="flex rounded-xl bg-white px-3 py-2 shadow-sm">
            <Image
              src="/tradenexa-logo.png"
              alt="TradeNexa"
              width={600}
              height={600}
              priority
              className="h-8 w-auto max-w-[132px] object-contain object-center mix-blend-darken [clip-path:inset(0_0_24%_0)]"
            />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-400">{brand.title}</p>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto py-3">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 border-l-[3px] py-2.5 pl-4 pr-4 text-sm font-medium transition-colors ${
                active
                  ? `${activeBorder} bg-white/10 text-white`
                  : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.25 : 2} />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="rounded bg-[#FF6D00] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 transition hover:text-white"
        >
          <Globe className="h-4 w-4 shrink-0" />
          Back to Website
        </Link>
      </div>
    </aside>
  );
}
