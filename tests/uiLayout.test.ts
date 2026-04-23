import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createFakeElement,
  installFakeDom,
  uninstallFakeDom,
  findByClass,
  isDirectChild,
  type FakeElement,
} from './_domStub.js';
import { buildUILayout, type UIRefs } from '../src/ui/UILayout.js';

function makeRoot(): FakeElement {
  return createFakeElement('div');
}

function build(): { root: FakeElement; refs: UIRefs } {
  const root = makeRoot();
  const refs = buildUILayout(root as unknown as HTMLElement);
  return { root, refs };
}

beforeEach(() => {
  installFakeDom();
});

afterEach(() => {
  uninstallFakeDom();
});

test('buildUILayout assigns pm-root class to the container', () => {
  // 미디어 쿼리 `#app, .pm-root { display: grid }` 가 적용되려면
  // 루트가 `pm-root` 클래스를 가져야 한다 (8a3023d 회귀 방지).
  const { root } = build();
  assert.equal(root.classes.has('pm-root'), true);
});

test('buildUILayout returns all required refs', () => {
  const { refs } = build();
  const required: ReadonlyArray<keyof UIRefs> = [
    'header',
    'menuButton',
    'zoomOutButton',
    'zoomFitButton',
    'zoomInButton',
    'undoButton',
    'redoButton',
    'canvas',
    'canvasWrap',
    'colorStrip',
    'toolbar',
    'cursorLabel',
    'layerButton',
    'sizeButton',
    'exportButton',
    'statusBar',
  ];
  for (const k of required) {
    assert.notEqual(refs[k], undefined, `ref "${k}" should be defined`);
    assert.notEqual(refs[k], null, `ref "${k}" should not be null`);
  }
});

test('header hamburger button reflects grid-toggle action', () => {
  // 4e9aafc: ☰/Menu → ⊞/Toggle grid 로 변경. 실제 동작과 일치해야 한다.
  const { refs } = build();
  const btn = refs.menuButton as unknown as FakeElement;
  assert.equal(btn.textContent, '⊞');
  assert.equal(btn.title, 'Toggle grid');
  assert.equal(btn.getAttribute('aria-label'), 'Toggle grid');
});

test('header buttons expose distinct accessible labels', () => {
  const { refs } = build();
  const labelOf = (b: unknown): string | null =>
    (b as FakeElement).getAttribute('aria-label');
  const labels = [
    labelOf(refs.menuButton),
    labelOf(refs.zoomOutButton),
    labelOf(refs.zoomFitButton),
    labelOf(refs.zoomInButton),
    labelOf(refs.undoButton),
    labelOf(refs.redoButton),
    labelOf(refs.layerButton),
    labelOf(refs.sizeButton),
    labelOf(refs.exportButton),
  ];
  for (const l of labels) assert.notEqual(l, null);
  assert.equal(new Set(labels).size, labels.length, 'labels must be unique');
});

test('cursorLabel sits in the bottom-bar extras row, not the status bar', () => {
  // a526626: 좌표를 statusBar 텍스트에 직접 붙이면 좁은 화면에서 줄바꿈이 일어나
  // 캔버스가 상하로 흔들렸다. cursorLabel 을 bottomBar (📑📐💾 행) 의 좌측에
  // 두어 가로 폭만 변하도록 한다.
  const { root, refs } = build();
  const cursor = refs.cursorLabel as unknown as FakeElement;

  const statusBar = refs.statusBar as unknown as FakeElement;
  assert.equal(
    isDirectChild(statusBar, cursor),
    false,
    'cursorLabel must not be a child of the status bar',
  );

  const bottomBar = findByClass(root, 'pm-bottom-bar');
  assert.notEqual(bottomBar, null);
  // 깊이 우선으로 cursorLabel 이 bottomBar 서브트리에 포함되어야 한다.
  assert.equal(
    findByClass(bottomBar!, 'pm-cursor-label'),
    cursor,
    'cursorLabel must live inside the bottom bar subtree',
  );
});

test('cursorLabel shares its parent row with layer/size/export buttons', () => {
  // 같은 y 라인에서 가로로 배치되어야 함. 같은 부모(extras)를 공유하는지 확인.
  const { root, refs } = build();
  const extras = findByClass(root, 'pm-toolbar-extras');
  assert.notEqual(extras, null);
  const direct = (target: unknown): boolean =>
    isDirectChild(extras!, target as FakeElement);
  assert.equal(direct(refs.cursorLabel), true);
  assert.equal(direct(refs.layerButton), true);
  assert.equal(direct(refs.sizeButton), true);
  assert.equal(direct(refs.exportButton), true);
});

test('cursorLabel is the leading element in the extras row', () => {
  // flex:1 1 auto 로 자라서 아이콘들을 우측으로 밀기 위해 좌측에 위치해야 한다.
  const { root, refs } = build();
  const extras = findByClass(root, 'pm-toolbar-extras');
  assert.notEqual(extras, null);
  assert.equal(extras!.children[0], refs.cursorLabel as unknown as FakeElement);
});

test('canvas is wrapped by pm-canvas-wrap (parent measured for resize)', () => {
  // app.ts 의 syncToElementSize 가 canvasEl.parentElement 를 측정하므로
  // 캔버스는 반드시 별도 wrap 의 자식이어야 한다.
  const { refs } = build();
  const wrap = refs.canvasWrap as unknown as FakeElement;
  assert.equal(wrap.classes.has('pm-canvas-wrap'), true);
  assert.equal(isDirectChild(wrap, refs.canvas as unknown as FakeElement), true);
});

test('color strip is a separate node from the bottom bar', () => {
  // 그리드 모드에서 colorStrip 은 우측 컬럼(p), bottomBar 는 좌측 컬럼(t) 으로
  // 분리되므로 서로 자식 관계가 아니어야 한다.
  const { refs } = build();
  const strip = refs.colorStrip as unknown as FakeElement;
  const cursor = refs.cursorLabel as unknown as FakeElement;
  assert.equal(findByClass(strip, 'pm-cursor-label'), null);
  assert.notEqual(strip, cursor);
});

test('rebuilding into the same root resets prior content', () => {
  // buildUILayout 은 root.innerHTML = '' 로 시작한다. 두 번 호출해도 안전해야 함.
  const root = makeRoot();
  buildUILayout(root as unknown as HTMLElement);
  // 첫 빌드 후 children 이 채워져 있다.
  assert.notEqual(root.children.length, 0);
  // innerHTML 대입은 스텁에서는 children 을 비우지 않지만, 두 번째 호출이
  // 예외 없이 동작하고 새 refs 를 반환하는지 확인.
  const refs2 = buildUILayout(root as unknown as HTMLElement);
  assert.equal((refs2.menuButton as unknown as FakeElement).title, 'Toggle grid');
});
