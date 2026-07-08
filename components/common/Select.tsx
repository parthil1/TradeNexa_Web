"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { inputClassName } from "./FormField";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  options: SelectOption[];
  value?: string;
  onChange?: (e: { target: { value: string; id?: string; name?: string } }) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
  required?: boolean;
  /** Infinite-scroll: more pages available */
  hasMore?: boolean;
  /** Infinite-scroll: loading next page */
  loadingMore?: boolean;
  /** Infinite-scroll: called near bottom of list */
  onLoadMore?: () => void;
}

export function Select({
  id,
  options,
  value = "",
  onChange,
  placeholder = "Select an option",
  error,
  disabled,
  className = "",
  name,
  required,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const loadMoreLock = useRef(false);

  const selected = options.find((opt) => opt.value === value) ?? null;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const selectedEl = listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    selectedEl?.scrollIntoView({ block: "nearest" });
  }, [open, value]);

  useEffect(() => {
    if (!loadingMore) loadMoreLock.current = false;
  }, [loadingMore]);

  function maybeLoadMore(listEl: HTMLUListElement) {
    if (!onLoadMore || !hasMore || loadingMore || loadMoreLock.current) return;
    const remaining = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight;
    if (remaining < 48) {
      loadMoreLock.current = true;
      onLoadMore();
    }
  }

  function selectOption(nextValue: string) {
    onChange?.({ target: { value: nextValue, id, name } });
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-invalid={!!error}
        aria-required={required}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={`${inputClassName(error)} flex h-12 w-full items-center justify-between gap-2 text-left appearance-none pr-10 ${
          !selected ? "text-slate-400" : "text-slate-900"
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className}`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
      </button>

      <ChevronDown
        className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition ${
          open ? "rotate-180" : ""
        }`}
      />

      {open && !disabled ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={id}
          onScroll={(e) => maybeLoadMore(e.currentTarget)}
          className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.15)]"
        >
          {options.length === 0 && !loadingMore ? (
            <li className="px-3.5 py-2.5 text-sm text-slate-400">{placeholder}</li>
          ) : (
            <>
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-primary/8 font-semibold text-primary"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                      onClick={() => selectOption(opt.value)}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                    </button>
                  </li>
                );
              })}
              {(hasMore || loadingMore) && (
                <li className="flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs text-slate-400">
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      Loading more...
                    </>
                  ) : (
                    "Scroll for more"
                  )}
                </li>
              )}
            </>
          )}
        </ul>
      ) : null}
    </div>
  );
}
