"use client";

import type { ReactNode } from "react";
import PortalSearchBar from "@/components/portal/PortalSearchBar";

interface RfqListToolbarProps {
  countLabel: string;
  loading?: boolean;
  filters?: ReactNode;
  trailing?: ReactNode;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
}

export default function RfqListToolbar({
  countLabel,
  loading,
  filters,
  trailing,
  search,
}: RfqListToolbarProps) {
  return (
    <div className="mb-5 space-y-3 rounded-xl border border-border bg-muted/50 p-3 sm:p-4">
      {search ? (
        <PortalSearchBar
          value={search.value}
          onChange={search.onChange}
          placeholder={search.placeholder ?? "Search..."}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-fg">
          {loading ? "Loading..." : countLabel}
        </p>
        {filters || trailing ? (
          <div className="flex flex-wrap items-center gap-2">
            {filters}
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}
