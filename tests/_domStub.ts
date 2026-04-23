/**
 * 최소 DOM 스텁. node --test 환경에서 UILayout 같은 DOM 의존 모듈을
 * 단위 테스트할 때 사용한다. 실제 브라우저 동작을 흉내내지 않고,
 * `buildUILayout` 가 호출하는 API 만 충족한다.
 */

export interface FakeElement {
  tagName: string;
  className: string;
  id: string;
  type: string;
  textContent: string;
  title: string;
  innerHTML: string;
  children: FakeElement[];
  classes: Set<string>;
  attributes: Map<string, string>;
  classList: {
    add(...names: string[]): void;
    contains(name: string): boolean;
  };
  appendChild(child: FakeElement): FakeElement;
  append(...children: FakeElement[]): void;
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  querySelector(selector: string): FakeElement | null;
}

export function createFakeElement(tag: string): FakeElement {
  const classes = new Set<string>();
  const children: FakeElement[] = [];
  const attributes = new Map<string, string>();
  let classNameValue = '';

  const base = {
    tagName: tag.toUpperCase(),
    id: '',
    type: '',
    textContent: '',
    title: '',
    innerHTML: '',
    children,
    classes,
    attributes,
    classList: {
      add(...names: string[]): void {
        for (const n of names) classes.add(n);
        classNameValue = Array.from(classes).join(' ');
      },
      contains(name: string): boolean {
        return classes.has(name);
      },
    },
    appendChild(child: FakeElement): FakeElement {
      children.push(child);
      return child;
    },
    append(...incoming: FakeElement[]): void {
      children.push(...incoming);
    },
    setAttribute(name: string, value: string): void {
      attributes.set(name, value);
    },
    getAttribute(name: string): string | null {
      return attributes.get(name) ?? null;
    },
    querySelector(_selector: string): FakeElement | null {
      return null;
    },
  };
  // className 은 직접 대입(`el.className = 'foo bar'`)도 classes Set 과
  // 동기화되어야 한다. UILayout 의 create() 가 그렇게 사용한다.
  Object.defineProperty(base, 'className', {
    get(): string {
      return classNameValue;
    },
    set(value: string): void {
      classNameValue = value;
      classes.clear();
      for (const n of value.split(/\s+/)) {
        if (n.length > 0) classes.add(n);
      }
    },
    enumerable: true,
    configurable: true,
  });
  return base as FakeElement;
}

interface FakeDocument {
  createElement(tag: string): FakeElement;
}

let originalDocument: unknown = undefined;
let installed = false;

export function installFakeDom(): FakeDocument {
  if (installed) {
    throw new Error('Fake DOM already installed');
  }
  const g = globalThis as { document?: unknown };
  originalDocument = g.document;
  const doc: FakeDocument = {
    createElement(tag: string): FakeElement {
      return createFakeElement(tag);
    },
  };
  g.document = doc;
  installed = true;
  return doc;
}

export function uninstallFakeDom(): void {
  if (!installed) return;
  const g = globalThis as { document?: unknown };
  if (originalDocument === undefined) {
    delete g.document;
  } else {
    g.document = originalDocument;
  }
  originalDocument = undefined;
  installed = false;
}

/** 트리에서 주어진 클래스를 가진 첫 번째 요소를 깊이 우선으로 찾는다. */
export function findByClass(root: FakeElement, className: string): FakeElement | null {
  if (root.classes.has(className)) return root;
  for (const child of root.children) {
    const hit = findByClass(child, className);
    if (hit !== null) return hit;
  }
  return null;
}

/** root 의 직계 자식 중 주어진 객체가 포함되어 있는지. */
export function isDirectChild(root: FakeElement, target: FakeElement): boolean {
  return root.children.includes(target);
}
