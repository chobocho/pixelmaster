export interface StatusBarInfo {
  width: number;
  height: number;
  zoom: number;
  cursor?: { x: number; y: number } | undefined;
  tool?: string | undefined;
  layers?: { total: number; active: number } | undefined;
}

/** 상태표시줄 포매터: 캔버스 사이즈, 줌%, 커서 좌표, 활성 도구, 레이어. */
export function formatStatusBar(info: StatusBarInfo): string {
  const parts: string[] = [];
  parts.push(`${info.width}×${info.height}`);
  parts.push(`${Math.round(info.zoom * 100)}%`);
  if (info.cursor) parts.push(`(${info.cursor.x}, ${info.cursor.y})`);
  if (info.tool) parts.push(info.tool);
  if (info.layers) parts.push(`L ${info.layers.active + 1}/${info.layers.total}`);
  return parts.join(' │ ');
}
