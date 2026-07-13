"use client";

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  searchPlaceholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
  required?: boolean;
  /** Type in the select field to filter options (default: true) */
  searchable?: boolean;
  /**
   * When set, typing triggers remote search instead of client-side filtering.
   * Parent should debounce and refetch options.
   */
  onSearchChange?: (query: string) => void;
  /** Infinite-scroll: more pages available */
  hasMore?: boolean;
  /** Infinite-scroll: loading next page */
  loadingMore?: boolean;
  /** Infinite-scroll: called near bottom of list */
  onLoadMore?: () => void;
  /** Optional icon rendered inside the trigger, before the label */
  leadingIcon?: React.ReactNode;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "bottom" | "top";
}

const MENU_GAP = 6;
const VIEWPORT_PADDING = 12;
const PREFERRED_MAX_HEIGHT = 240;
const MIN_MENU_HEIGHT = 96;

export function Select({
  id,
  options,
  value = "",
  onChange,
  placeholder = "Select an option",
  searchPlaceholder,
  error,
  disabled,
  className = "",
  name,
  required,
  searchable,
  onSearchChange,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  leadingIcon,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const loadMoreLock = useRef(false);
  const remoteSearch = Boolean(onSearchChange);

  const showSearch = searchable !== false;
  const inputPlaceholder = searchPlaceholder ?? `Type to search — ${placeholder}`;

  const selected = options.find((opt) => opt.value === value) ?? null;

  const filteredOptions = useMemo(() => {
    if (!showSearch || !open || remoteSearch) return options;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(query));
  }, [options, open, remoteSearch, searchQuery, showSearch]);

  useEffect(() => {
    if (!open || !remoteSearch) return;
    onSearchChange?.(searchQuery);
  }, [open, remoteSearch, searchQuery, onSearchChange]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) setSearchQuery("");
  }, [open]);

  useEffect(() => {
    if (!open || !showSearch) return;
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    return () => window.clearTimeout(timer);
  }, [open, showSearch]);

  function openMenu() {
    if (disabled || open) return;
    setSearchQuery("");
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    setSearchQuery("");
    inputRef.current?.blur();
  }

  function toggleMenu() {
    if (disabled) return;
    if (open) closeMenu();
    else openMenu();
  }

  function updateMenuPosition() {
    const anchor = triggerRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
    const spaceAbove = rect.top - VIEWPORT_PADDING;

    const openBelow = spaceBelow >= MIN_MENU_HEIGHT || spaceBelow >= spaceAbove;

    if (openBelow) {
      const maxHeight = Math.min(PREFERRED_MAX_HEIGHT, Math.max(MIN_MENU_HEIGHT, spaceBelow - MENU_GAP));
      setMenuPosition({
        top: rect.bottom + MENU_GAP,
        left: rect.left,
        width: rect.width,
        maxHeight,
        placement: "bottom",
      });
      return;
    }

    const maxHeight = Math.min(PREFERRED_MAX_HEIGHT, Math.max(MIN_MENU_HEIGHT, spaceAbove - MENU_GAP));
    setMenuPosition({
      top: rect.top - MENU_GAP - maxHeight,
      left: rect.left,
      width: rect.width,
      maxHeight,
      placement: "top",
    });
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();
    const raf = window.requestAnimationFrame(updateMenuPosition);

    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [open, options.length, filteredOptions.length]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      closeMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
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
    closeMenu();
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent) {
    if (!showSearch) return;

    if (event.key === "Escape") {
      closeMenu();
      return;
    }

    if (event.key === "Enter" && open && filteredOptions.length === 1) {
      event.preventDefault();
      selectOption(filteredOptions[0].value);
      return;
    }

    if (!open && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      openMenu();
      setSearchQuery(event.key);
      event.preventDefault();
    }
  }

  const openRing = open ? "border-primary ring-2 ring-primary/20" : "";
  const errorRing = error ? "border-error/50 focus:border-error focus:ring-error/20" : "";
  const horizontalPad = leadingIcon ? "pl-9" : "pl-3";

  const triggerClass = `flex h-12 w-full items-center rounded-lg border bg-card text-left text-sm outline-none transition-all duration-200 appearance-none ${horizontalPad} pr-10 ${
    error ? errorRing : `border-border focus:border-primary focus:ring-2 focus:ring-primary/20 ${openRing}`
  } ${disabled ? "cursor-not-allowed opacity-60" : ""} ${className}`;

  const menu =
    open && !disabled && menuPosition ? (
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          top: menuPosition.top,
          left: menuPosition.left,
          width: menuPosition.width,
          maxHeight: menuPosition.maxHeight,
          zIndex: 9999,
        }}
        className={`flex flex-col overflow-hidden border border-border bg-card shadow-[0_12px_40px_-12px_rgba(15,23,42,0.22)] ${
          menuPosition.placement === "bottom" ? "rounded-xl" : "rounded-xl"
        }`}
      >
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={id}
          onScroll={(e) => maybeLoadMore(e.currentTarget)}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong"
        >
          {filteredOptions.length === 0 && !loadingMore ? (
            <li className="px-3 py-2.5 text-sm text-muted-fg">
              {searchQuery.trim() ? "No results found" : placeholder}
            </li>
          ) : (
            <>
              {filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-primary/8 font-semibold text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                      onClick={() => selectOption(opt.value)}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                    </button>
                  </li>
                );
              })}
              {(remoteSearch || !searchQuery.trim()) && (hasMore || loadingMore) ? (
                <li className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-muted-fg">
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      Loading more...
                    </>
                  ) : (
                    "Scroll for more"
                  )}
                </li>
              ) : null}
            </>
          )}
        </ul>
      </div>
    ) : null;

  return (
    <div ref={triggerRef} className={`relative ${open ? "z-30" : ""}`}>
      <div className="relative">
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-fg">
            {leadingIcon}
          </span>
        ) : null}
        {showSearch ? (
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-invalid={!!error}
            aria-required={required}
            readOnly={!open}
            value={open ? searchQuery : (selected?.label ?? "")}
            placeholder={selected || open ? inputPlaceholder : placeholder}
            onChange={(e) => {
              if (open) setSearchQuery(e.target.value);
            }}
            onFocus={() => {
              if (!disabled) openMenu();
            }}
            onKeyDown={handleTriggerKeyDown}
            className={`${triggerClass} ${
              !open && !selected ? "text-muted-fg" : "text-foreground"
            } ${open ? "cursor-text" : "cursor-pointer"}`}
          />
        ) : (
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-invalid={!!error}
            aria-required={required}
            onClick={toggleMenu}
            className={`${triggerClass} ${
              !selected ? "text-muted-fg" : "text-foreground"
            } cursor-pointer`}
          >
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </button>
        )}

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={open ? "Close options" : "Open options"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleMenu}
          className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-fg transition hover:text-foreground disabled:pointer-events-none"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
