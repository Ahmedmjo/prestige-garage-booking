/**
 * Normalize an Egyptian phone number for wa.me / tel: links.
 * wa.me requires the full international number without "+" or spaces.
 * Egyptian numbers: 01xxxxxxxxx → 201xxxxxxxxx
 */
export function normalizePhone(phone: string): string {
  let p = phone.replace(/[^0-9]/g, "");
  // Egyptian local format: starts with 0 → replace with country code 20
  if (p.startsWith("0")) {
    p = "20" + p.slice(1);
  }
  // Already has country code 20
  else if (p.startsWith("20")) {
    // keep as is
  }
  // Some other country code — keep as is
  return p;
}

/** Build a wa.me link with optional text */
export function waLink(phone: string, text?: string): string {
  const n = normalizePhone(phone);
  const base = `https://wa.me/${n}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Build a tel: link */
export function telLink(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}
