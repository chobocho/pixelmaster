import type { RGBA } from './Color.js';
import { hexToRgba } from './conversions.js';

/** 기본 팔레트: 고전 16색(EGA 기반) 재배치. */
const DEFAULT_HEX_COLORS: readonly string[] = [
  '#000000',
  '#FFFFFF',
  '#7F7F7F',
  '#C3C3C3',
  '#880000',
  '#FF0000',
  '#FF7F00',
  '#FFFF00',
  '#008800',
  '#00FF00',
  '#008888',
  '#00FFFF',
  '#000088',
  '#0000FF',
  '#7F007F',
  '#FF00FF',
];

export const DEFAULT_PALETTE: readonly RGBA[] = DEFAULT_HEX_COLORS.map((hex) => {
  const c = hexToRgba(hex);
  if (c === null) throw new Error(`Invalid default palette entry: ${hex}`);
  return c;
});
