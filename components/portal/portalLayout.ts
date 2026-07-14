/** Shared portal layout tokens — keep spacing consistent across buyer/seller pages. */

export const portalPageContainerClass =
  "mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8";

export const portalMatchedPageContainerClass =
  "mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:max-w-[min(80rem,calc(100vw-16rem))]";

export const portalProductGridClass =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4";

/** Dense surface for lists/tables in portal */
export const portalPanelClass =
  "rounded-xl border border-portal-border bg-card";

export const portalSectionGapClass = "space-y-5 sm:space-y-6";

/** Status / approval filter chips — solid border (not ring) so inactive chips stay visible */
export const portalFilterChipBaseClass =
  "shrink-0 cursor-pointer rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25";

export const portalFilterChipActiveClass = "border-primary bg-primary text-white";

export const portalFilterChipIdleClass =
  "border-border bg-card text-muted-fg hover:border-border-strong hover:text-foreground";

export function portalFilterChipClass(active: boolean): string {
  return `${portalFilterChipBaseClass} ${active ? portalFilterChipActiveClass : portalFilterChipIdleClass}`;
}
