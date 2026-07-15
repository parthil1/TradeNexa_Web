"use client";

import Link from "next/link";
import { ArrowLeft, Home, Search } from "lucide-react";
import { HideAppChrome } from "@/components/layout/AppChromeVisibility";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/common/Button";

export default function NotFound() {
  return (
    <>
      <HideAppChrome />
      <div className="flex min-h-dvh flex-col bg-portal-bg">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-primary-soft/70 blur-3xl" />
          <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-navy/5 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <Logo size="md" href="/" priority className="mb-8" />

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">404</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Page not found
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-fg">
            This page doesn&apos;t exist or may have moved. Check the URL, or head back to a known
            place on TradeNexa.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="sm:flex-1">
              <Button fullWidth className="inline-flex items-center justify-center gap-2">
                <Home className="h-4 w-4" aria-hidden />
                Go home
              </Button>
            </Link>
            <Link href="/products" className="sm:flex-1">
              <Button
                fullWidth
                variant="secondary"
                className="inline-flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" aria-hidden />
                Browse products
              </Button>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/";
              }
            }}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-fg transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Go back
          </button>
        </div>
      </div>
    </>
  );
}
