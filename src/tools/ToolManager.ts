import type { Tool, ToolContext, ToolId, ToolPointerEvent } from './Tool.js';

/** 도구 등록·선택·포인터 이벤트 디스패치. */
export class ToolManager {
  private readonly tools = new Map<ToolId, Tool>();
  private activeToolId: ToolId | null = null;

  register(tool: Tool): void {
    this.tools.set(tool.id, tool);
    if (this.activeToolId === null) {
      this.activeToolId = tool.id;
    }
  }

  setActive(id: ToolId): void {
    if (!this.tools.has(id)) {
      throw new Error(`Tool '${id}' is not registered`);
    }
    this.activeToolId = id;
  }

  get activeId(): ToolId | null {
    return this.activeToolId;
  }

  get active(): Tool | null {
    if (this.activeToolId === null) return null;
    return this.tools.get(this.activeToolId) ?? null;
  }

  get registeredIds(): ReadonlyArray<ToolId> {
    return [...this.tools.keys()];
  }

  onPointerDown(ctx: ToolContext, e: ToolPointerEvent): void {
    this.active?.onPointerDown(ctx, e);
  }

  onPointerMove(ctx: ToolContext, e: ToolPointerEvent): void {
    this.active?.onPointerMove(ctx, e);
  }

  onPointerUp(ctx: ToolContext, e: ToolPointerEvent): void {
    this.active?.onPointerUp(ctx, e);
  }
}
