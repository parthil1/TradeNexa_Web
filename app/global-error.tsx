"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: catches errors thrown by the root layout itself, where
 * app/error.tsx cannot render. Must ship its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center bg-[#f4f6f9] p-6 font-sans text-[#0d1b2a] antialiased">
        <div className="w-full max-w-md rounded-xl border border-[#e0e6ed] bg-white p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Application error</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#546e7a]">
            TradeNexa failed to load. Reload the page, and if it keeps happening try again in a
            few minutes.
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-[11px] text-[#90a4ae]">Reference: {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-[#1565c0] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1255a8]"
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}
