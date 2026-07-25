"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/common/Button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-error/20 bg-error-soft">
        <AlertTriangle className="h-6 w-6 text-error" aria-hidden />
      </span>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-fg">
        This page hit an unexpected error. You can retry, or head back and try again from a
        different place.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[11px] text-muted-placeholder">
          Reference: {error.digest}
        </p>
      ) : null}

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          onClick={reset}
          fullWidth
          className="inline-flex items-center justify-center gap-2 sm:flex-1"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Try again
        </Button>
        <Link href="/" className="sm:flex-1">
          <Button
            fullWidth
            variant="secondary"
            className="inline-flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" aria-hidden />
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
