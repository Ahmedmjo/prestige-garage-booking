/**
 * Cairo timezone helpers — Egypt is Africa/Cairo (UTC+2 / UTC+3 with DST).
 *
 * Vercel servers run in UTC. If we use `new Date().toISOString()` or
 * `new Date().getHours()`, we get UTC values — but the customer is in Egypt
 * and picks dates/hours in Egypt local time. This mismatch caused bookings
 * to show phantom "past" slots or wrong "today" date.
 *
 * Solution: use Intl.DateTimeFormat to format `Date` objects in Africa/Cairo
 * timezone, regardless of the server's local timezone.
 */

const CAIRO_TZ = "Africa/Cairo";
const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: CAIRO_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
// "en-CA" gives YYYY-MM-DD format (Canadian style) — no further parsing needed.

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: CAIRO_TZ,
  hour: "2-digit",
  hour12: false,
});

/** Returns today's date in Cairo as YYYY-MM-DD string. */
export function cairoToday(): string {
  return dateFmt.format(new Date());
}

/** Returns the current hour (0-23) in Cairo. */
export function cairoCurrentHour(): number {
  const parts = partsFmt.formatToParts(new Date());
  const hourPart = parts.find((p) => p.type === "hour");
  // Intl can return "24" for midnight in some environments — normalize.
  const h = parseInt(hourPart?.value ?? "0", 10);
  return h === 24 ? 0 : h;
}

/**
 * Parses a YYYY-MM-DD date string into a Date that represents the START of
 * that day in Cairo. Useful for comparing with `cairoToday()` and for
 * formatting weekday names in the customer's timezone.
 */
export function cairoDateFromYMD(ymd: string): Date {
  // Construct as noon UTC to avoid any DST-related midnight drift, then
  // we only use the YYYY-MM-DD part for display purposes.
  return new Date(`${ymd}T12:00:00Z`);
}
