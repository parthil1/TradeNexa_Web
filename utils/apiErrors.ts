export interface ApiFieldError {
  field: string;
  message: string;
}

function readErrorData(err: unknown): Record<string, unknown> | null {
  if (!err || typeof err !== "object") return null;
  const data = (err as { data?: unknown }).data;
  return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
}

/** First field-level validation message from an API error response (array order preserved). */
export function getFirstApiValidationMessage(err: unknown): string | null {
  const data = readErrorData(err);
  if (!data || !Array.isArray(data.errors) || data.errors.length === 0) return null;

  for (const item of data.errors) {
    if (!item || typeof item !== "object") continue;
    const message =
      "message" in item ? String((item as ApiFieldError).message).trim() : "";
    if (message) return message;
  }
  return null;
}

/** Extract field-level validation messages from API error responses. */
export function getApiFieldErrors(err: unknown): Record<string, string> {
  const data = readErrorData(err);
  if (!data || !Array.isArray(data.errors)) return {};

  const map: Record<string, string> = {};
  for (const item of data.errors) {
    if (!item || typeof item !== "object") continue;
    const field = "field" in item ? String((item as ApiFieldError).field) : "";
    const message = "message" in item ? String((item as ApiFieldError).message) : "";
    if (field && message && !map[field]) {
      map[field] = message;
    }
  }
  return map;
}

export function formatApiErrorMessage(err: unknown, fallback = "Request failed"): string {
  const firstValidation = getFirstApiValidationMessage(err);
  if (firstValidation) return firstValidation;

  if (err && typeof err !== "object") return fallback;
  if (err && typeof err === "object" && "message" in err) {
    const message = String((err as { message: string }).message).trim();
    // Prefer a real validation field message over the generic envelope.
    if (message && message.toLowerCase() !== "validation failed") return message;
  }
  return fallback;
}

export function formatApiValidationSummary(err: unknown, fallback?: string): string {
  const first = getFirstApiValidationMessage(err);
  if (first) return first;
  return formatApiErrorMessage(err, fallback ?? "Validation failed");
}
