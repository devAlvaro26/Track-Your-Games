const ISO_FULL = /^(\d{4})-(\d{2})-(\d{2})$/;
const DMY_FULL = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const YEAR_ONLY = /^\d{4}$/;

function isRealDate(y: number, m: number, d: number): boolean {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Keeps dates in dd/mm/yyyy form and converts ISO dates from older records. */
export function normalizeDate(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const value = raw.trim();
  if (!value) return "";

  if (YEAR_ONLY.test(value)) return value;

  const iso = value.match(ISO_FULL);
  if (iso) {
    const [, year, month, day] = iso;
    if (isRealDate(Number(year), Number(month), Number(day))) {
      return `${day}/${month}/${year}`;
    }
    return "";
  }

  const dmy = value.match(DMY_FULL);
  if (dmy) {
    const [, day, month, year] = dmy;
    if (isRealDate(Number(year), Number(month), Number(day))) {
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
  }

  return value;
}

export function isFullDate(value: string | undefined): boolean {
  return Boolean(value && DMY_FULL.test(normalizeDate(value)));
}

export function todayDate(): string {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
}

/** Sortable timestamp for a dd/mm/yyyy date or year; 0 when missing or invalid. */
export function dateToTimestamp(value: string | undefined): number {
  const normalized = normalizeDate(value ?? "");
  if (YEAR_ONLY.test(normalized)) return Date.UTC(Number(normalized), 0, 1);
  const dmy = normalized.match(DMY_FULL);
  if (!dmy) return 0;
  const [, day, month, year] = dmy;
  return isRealDate(Number(year), Number(month), Number(day))
    ? Date.UTC(Number(year), Number(month) - 1, Number(day))
    : 0;
}

export function formatDisplayDate(value: string | undefined): string {
  return normalizeDate(value ?? "");
}
