/**
 * Display dates as dd/mm/yyyy across the app.
 * Native `<input type="date">` still uses ISO (yyyy-mm-dd) as its value.
 */

export function formatDateDdMmYyyy(value?: string | Date | null): string {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "—";
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Compact list dates: today → time, yesterday → Yesterday, else dd/mm/yyyy. */
export function formatDateListLabel(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return "Yesterday";
  }
  return formatDateDdMmYyyy(date);
}
