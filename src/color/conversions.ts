import type { RGBA } from './Color.js';

/** HSV(h: 0..360, s/v: 0..1) → RGB(0..255). */
export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const hh = (((h % 360) + 360) % 360) / 60;
  const c = v * s;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hh < 1) {
    r1 = c;
    g1 = x;
  } else if (hh < 2) {
    r1 = x;
    g1 = c;
  } else if (hh < 3) {
    g1 = c;
    b1 = x;
  } else if (hh < 4) {
    g1 = x;
    b1 = c;
  } else if (hh < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }
  const m = v - c;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

/** RGB(0..255) → HSV(h: 0..360, s/v: 0..1). */
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rn) {
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
    } else if (max === gn) {
      h = ((bn - rn) / d + 2) * 60;
    } else {
      h = ((rn - gn) / d + 4) * 60;
    }
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

/** RGBA → #RRGGBB (alpha=255) 또는 #RRGGBBAA. */
export function rgbaToHex(color: RGBA): string {
  const h = (n: number): string => clamp255(n).toString(16).padStart(2, '0');
  if (color.a === 255) {
    return `#${h(color.r)}${h(color.g)}${h(color.b)}`;
  }
  return `#${h(color.r)}${h(color.g)}${h(color.b)}${h(color.a)}`;
}

/**
 * HEX(#RGB / #RGBA / #RRGGBB / #RRGGBBAA) → RGBA.
 * 잘못된 형식이면 null.
 */
export function hexToRgba(hex: string): RGBA | null {
  const cleaned = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) return null;

  let r: string;
  let g: string;
  let b: string;
  let a: string;
  if (cleaned.length === 3) {
    r = cleaned[0] + cleaned[0];
    g = cleaned[1] + cleaned[1];
    b = cleaned[2] + cleaned[2];
    a = 'ff';
  } else if (cleaned.length === 4) {
    r = cleaned[0] + cleaned[0];
    g = cleaned[1] + cleaned[1];
    b = cleaned[2] + cleaned[2];
    a = cleaned[3] + cleaned[3];
  } else if (cleaned.length === 6) {
    r = cleaned.slice(0, 2);
    g = cleaned.slice(2, 4);
    b = cleaned.slice(4, 6);
    a = 'ff';
  } else if (cleaned.length === 8) {
    r = cleaned.slice(0, 2);
    g = cleaned.slice(2, 4);
    b = cleaned.slice(4, 6);
    a = cleaned.slice(6, 8);
  } else {
    return null;
  }
  return {
    r: parseInt(r, 16),
    g: parseInt(g, 16),
    b: parseInt(b, 16),
    a: parseInt(a, 16),
  };
}

function clamp255(n: number): number {
  if (n < 0) return 0;
  if (n > 255) return 255;
  return Math.round(n);
}
