/**
 * Branch color system
 * -------------------
 * Branches in the data model (BranchItem) do not carry their own color field,
 * so we derive a stable accent per branch from its position in the sorted list.
 *
 * The palette intentionally avoids indigo / blue (per project styling rules) and
 * pairs well with the app's crimson primary on a near-black background.
 *
 * Each entry exposes:
 *   - dot   : solid hex used for the small status dot
 *   - ring  : rgba used for a soft glow / outline around the dot
 *   - soft  : rgba used for tinted chip backgrounds (call / WhatsApp pills)
 */

export interface BranchColor {
  dot: string;
  ring: string;
  soft: string;
}

const PALETTE: BranchColor[] = [
  { dot: "#DC143C", ring: "rgba(220,20,60,0.45)",  soft: "rgba(220,20,60,0.12)"  }, // crimson
  { dot: "#EAB308", ring: "rgba(234,179,8,0.45)",  soft: "rgba(234,179,8,0.12)"  }, // gold
  { dot: "#10B981", ring: "rgba(16,185,129,0.45)", soft: "rgba(16,185,129,0.12)" }, // emerald
  { dot: "#F97316", ring: "rgba(249,115,22,0.45)", soft: "rgba(249,115,22,0.12)" }, // orange
  { dot: "#A855F7", ring: "rgba(168,85,247,0.45)", soft: "rgba(168,85,247,0.12)" }, // purple
  { dot: "#EC4899", ring: "rgba(236,72,153,0.45)", soft: "rgba(236,72,153,0.12)" }, // rose
  { dot: "#D946EF", ring: "rgba(217,70,239,0.45)", soft: "rgba(217,70,239,0.12)" }, // fuchsia
  { dot: "#84CC16", ring: "rgba(132,204,22,0.45)", soft: "rgba(132,204,22,0.12)" }, // lime
];

const FALLBACK_COLOR: BranchColor = {
  dot: "#DC143C",
  ring: "rgba(220,20,60,0.45)",
  soft: "rgba(220,20,60,0.12)",
};

/**
 * Returns a stable accent color for a branch by its index in the sorted list.
 * Falls back gracefully for out-of-range indices.
 */
export function branchColor(index: number): BranchColor {
  if (!Number.isFinite(index) || index < 0) return FALLBACK_COLOR;
  return PALETTE[index % PALETTE.length] ?? FALLBACK_COLOR;
}

/**
 * Deterministic accent keyed by branch id — useful when the visual order may
 * shift but you want a single branch to always keep the same color.
 */
export function branchColorById(id: string): BranchColor {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length] ?? FALLBACK_COLOR;
}

export const BRANCH_PALETTE = PALETTE;
