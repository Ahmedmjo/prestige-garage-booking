/**
 * Branch media helpers — SHARED between customer-side (ContactScreen) and admin (AdminDashboard).
 *
 * The Branch.mapUrl column in the DB stores ONE of two shapes:
 *   1. A plain map URL string (e.g. "https://maps.google.com/...")
 *   2. A JSON object packing { map, image, video } — used when the admin
 *      uploads a branch photo or video alongside the map link.
 *
 * CRITICAL SAFETY RULES:
 *   - If the JSON is corrupt or unparseable, return empty `map` instead of
 *     blindly treating the raw blob as a map URL. A truncated JSON blob
 *     used to be returned as `map`, which then broke the location link
 *     on the customer side. Now: only strings that genuinely look like a
 *     URL (http(s):// or path-relative) are returned as `map`.
 *   - Image/video URLs that don't pass the URL-shape check are dropped.
 *     This prevents broken <img>/<video> elements on the customer side.
 */

export type BranchMedia = { map: string; image: string; video: string };

const EMPTY: BranchMedia = { map: "", image: "", video: "" };

/** A URL is "safe to render" if it's an http(s) URL, a relative path, or a data URL. */
function isSafeUrl(s: string | undefined | null): s is string {
  if (!s) return false;
  const v = s.trim();
  if (!v) return false;
  return (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("/") ||
    v.startsWith("data:")
  );
}

export function parseBranchMedia(mapUrl: string | null | undefined): BranchMedia {
  if (!mapUrl) return EMPTY;
  const trimmed = mapUrl.trim();
  if (!trimmed) return EMPTY;

  // Try JSON-shape first
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const obj = JSON.parse(trimmed) as Partial<BranchMedia>;
      return {
        map: isSafeUrl(obj.map) ? (obj.map as string) : "",
        image: isSafeUrl(obj.image) ? (obj.image as string) : "",
        video: isSafeUrl(obj.video) ? (obj.video as string) : "",
      };
    } catch {
      // JSON parse failed (likely truncated base64 payload).
      // DO NOT fall through to "treat as plain map URL" — that would
      // return a malformed JSON blob as the map link and break the
      // customer's location button. Return EMPTY instead; the customer
      // side will fall back to an address-based Google Maps search.
      return EMPTY;
    }
  }

  // Plain map URL — validate it actually looks like a URL
  if (isSafeUrl(trimmed)) {
    return { map: trimmed, image: "", video: "" };
  }
  // Garbage value — drop it
  return EMPTY;
}

export function packBranchMedia(
  map: string,
  image: string,
  video: string,
): string | null {
  const hasMedia = !!image || !!video;
  if (!hasMedia) {
    // No media — store plain map URL (or null if empty)
    return map?.trim() || null;
  }
  // Pack as JSON to preserve all three URLs
  return JSON.stringify({
    map: map?.trim() || "",
    image: image?.trim() || "",
    video: video?.trim() || "",
  });
}
