export interface Shortcut {
  readonly key: string;
  readonly ctrl: boolean;
  readonly shift: boolean;
  readonly alt: boolean;
}

export interface KeyboardEventLike {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
}

/** "Ctrl+Shift+Z" / "P" / "Ctrl+Y" 같은 문자열을 구조화된 단축키로 파싱한다. */
export function parseShortcut(descriptor: string): Shortcut {
  const parts = descriptor
    .split('+')
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length > 0);
  if (parts.length === 0) {
    throw new Error(`Empty shortcut descriptor: "${descriptor}"`);
  }
  const key = parts[parts.length - 1];
  const mods = new Set(parts.slice(0, -1));
  return {
    key,
    ctrl: mods.has('ctrl') || mods.has('control') || mods.has('cmd') || mods.has('meta'),
    shift: mods.has('shift'),
    alt: mods.has('alt') || mods.has('option'),
  };
}

/** 이벤트가 단축키와 일치하는지 확인한다. ctrl 과 meta 는 동등 취급(cross-platform). */
export function matchesShortcut(ev: KeyboardEventLike, s: Shortcut): boolean {
  if (ev.key.toLowerCase() !== s.key) return false;
  const primary = ev.ctrlKey || ev.metaKey;
  if (s.ctrl !== primary) return false;
  if (s.shift !== ev.shiftKey) return false;
  if (s.alt !== ev.altKey) return false;
  return true;
}

export interface Binding {
  readonly descriptor: string;
  readonly shortcut: Shortcut;
  readonly action: () => void;
  readonly description?: string;
}

/** 단축키 등록·매칭을 담당하는 경량 디스패처. */
export class KeyboardShortcuts {
  private readonly bindings: Binding[] = [];

  register(descriptor: string, action: () => void, description?: string): void {
    this.bindings.push({
      descriptor,
      shortcut: parseShortcut(descriptor),
      action,
      ...(description !== undefined ? { description } : {}),
    });
  }

  /** 이벤트에 매칭되는 바인딩의 액션을 호출하고 성공 여부를 반환. */
  handle(ev: KeyboardEventLike): boolean {
    for (const b of this.bindings) {
      if (matchesShortcut(ev, b.shortcut)) {
        b.action();
        return true;
      }
    }
    return false;
  }

  get all(): readonly Binding[] {
    return this.bindings;
  }
}

/** 입력 필드 등에서는 단축키가 발동하지 않도록 걸러낸다. */
export function isEditingContext(target: EventTarget | null): boolean {
  if (target === null) return false;
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}
