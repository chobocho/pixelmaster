import { MAX_UNDO_STEPS } from './CanvasSize.js';

/**
 * 범용 undo/redo 스택. "after" 스냅샷 모델:
 * - 초기 상태를 포함해 항상 현재 상태의 스냅샷이 past 의 top 에 있다.
 * - push 는 새로운 현재 상태를 기록하고 future 를 비운다.
 * - undo 는 past top 을 future 로 이동 후 이전 top 을 반환한다.
 * - redo 는 future top 을 past 로 되돌리고 반환한다.
 *
 * 용량 초과 시 가장 오래된 엔트리를 버린다 (과거 수정 손실).
 */
export class HistoryManager<T> {
  private past: T[] = [];
  private future: T[] = [];
  private readonly maxSteps: number;

  constructor(maxSteps: number = MAX_UNDO_STEPS) {
    if (maxSteps <= 0) throw new Error(`maxSteps must be positive: ${maxSteps}`);
    this.maxSteps = maxSteps;
  }

  push(state: T): void {
    this.past.push(state);
    this.future = [];
    while (this.past.length > this.maxSteps) {
      this.past.shift();
    }
  }

  canUndo(): boolean {
    return this.past.length > 1;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  /** 되돌린 이전 상태를 반환. 불가능하면 null. */
  undo(): T | null {
    if (!this.canUndo()) return null;
    const current = this.past.pop() as T;
    this.future.push(current);
    return this.past[this.past.length - 1];
  }

  /** 되살린 다음 상태를 반환. 불가능하면 null. */
  redo(): T | null {
    if (!this.canRedo()) return null;
    const next = this.future.pop() as T;
    this.past.push(next);
    return next;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }

  get undoDepth(): number {
    return Math.max(0, this.past.length - 1);
  }

  get redoDepth(): number {
    return this.future.length;
  }

  get capacity(): number {
    return this.maxSteps;
  }
}
