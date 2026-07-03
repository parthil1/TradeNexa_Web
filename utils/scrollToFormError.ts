export interface ScrollToFormErrorOptions {
  /** Validation order — first error in this list is scrolled to */
  fieldOrder?: string[];
  /** Map error keys to DOM element ids */
  fieldIds?: Record<string, string>;
  /** Try `#${idPrefix}${key}` when id / data-form-field lookup fails */
  idPrefix?: string;
  /** Scrollable container (e.g. modal body). Auto-detected when omitted. */
  scrollContainer?: HTMLElement | null;
}

function focusElement(el: HTMLElement) {
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLButtonElement
  ) {
    if (!el.disabled && el.type !== "hidden") {
      el.focus({ preventScroll: true });
    }
    return;
  }

  const focusable = el.querySelector<HTMLElement>(
    'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  focusable?.focus({ preventScroll: true });
}

function scrollElementIntoContainer(element: HTMLElement, container: HTMLElement) {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const offsetTop =
    elementRect.top -
    containerRect.top +
    container.scrollTop -
    container.clientHeight / 2 +
    elementRect.height / 2;

  container.scrollTo({
    top: Math.max(0, offsetTop),
    behavior: "smooth",
  });
}

function resolveFieldElement(
  key: string,
  options?: ScrollToFormErrorOptions
): HTMLElement | null {
  const mappedId = options?.fieldIds?.[key];
  if (mappedId) {
    const byId = document.getElementById(mappedId);
    if (byId) return byId;

    const byMappedField = document.querySelector<HTMLElement>(
      `[data-form-field="${mappedId}"]`
    );
    if (byMappedField) return byMappedField;
  }

  const prefixedId = options?.idPrefix ? `${options.idPrefix}${key}` : undefined;
  if (prefixedId) {
    const byPrefixed = document.getElementById(prefixedId);
    if (byPrefixed) return byPrefixed;
  }

  const byFieldAttr = document.querySelector<HTMLElement>(`[data-form-field="${key}"]`);
  if (byFieldAttr) return byFieldAttr;

  if (prefixedId) {
    const byPrefixedAttr = document.querySelector<HTMLElement>(
      `[data-form-field="${prefixedId}"]`
    );
    if (byPrefixedAttr) return byPrefixedAttr;
  }

  const byName = document.querySelector<HTMLElement>(`[name="${key}"]`);
  if (byName) return byName;

  return document.getElementById(key);
}

function resolveScrollContainer(
  element: HTMLElement,
  explicit?: HTMLElement | null
): HTMLElement | null {
  if (explicit) return explicit;

  const marked = element.closest("[data-form-scroll-container]") as HTMLElement | null;
  if (marked) return marked;

  const modalBody = element.closest(".overflow-y-auto") as HTMLElement | null;
  return modalBody;
}

/**
 * Scrolls to and focuses the first field with a validation error.
 */
export function scrollToFirstFormError(
  errors: Record<string, string>,
  options?: ScrollToFormErrorOptions
) {
  const errorKeys = Object.keys(errors).filter((key) => errors[key]);
  if (errorKeys.length === 0) return;

  const orderedKeys = options?.fieldOrder?.filter((key) => errors[key]) ?? errorKeys;
  const firstKey = orderedKeys[0];
  if (!firstKey) return;

  requestAnimationFrame(() => {
    setTimeout(() => {
      const element = resolveFieldElement(firstKey, options);
      if (!element) return;

      const container = resolveScrollContainer(element, options?.scrollContainer);

      if (container && container !== document.documentElement && container !== document.body) {
        scrollElementIntoContainer(element, container);
      } else {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      focusElement(element);
    }, 50);
  });
}
