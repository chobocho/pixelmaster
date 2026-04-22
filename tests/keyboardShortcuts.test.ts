import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseShortcut,
  matchesShortcut,
  KeyboardShortcuts,
  type KeyboardEventLike,
} from '../src/ui/KeyboardShortcuts.js';

function evt(partial: Partial<KeyboardEventLike> & { key: string }): KeyboardEventLike {
  return {
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ...partial,
  };
}

test('parseShortcut handles single-letter descriptors', () => {
  assert.deepEqual(parseShortcut('P'), { key: 'p', ctrl: false, shift: false, alt: false });
});

test('parseShortcut interprets Ctrl and Cmd as the primary modifier', () => {
  assert.deepEqual(parseShortcut('Ctrl+Z'), { key: 'z', ctrl: true, shift: false, alt: false });
  assert.deepEqual(parseShortcut('Cmd+Z'), { key: 'z', ctrl: true, shift: false, alt: false });
  assert.deepEqual(parseShortcut('Meta+Z'), { key: 'z', ctrl: true, shift: false, alt: false });
});

test('parseShortcut combines modifiers', () => {
  assert.deepEqual(parseShortcut('Ctrl+Shift+Z'), {
    key: 'z',
    ctrl: true,
    shift: true,
    alt: false,
  });
});

test('parseShortcut throws on empty input', () => {
  assert.throws(() => parseShortcut(''), /Empty/);
  assert.throws(() => parseShortcut('+'), /Empty/);
});

test('matchesShortcut normalizes meta and ctrl', () => {
  const s = parseShortcut('Ctrl+Z');
  assert.equal(matchesShortcut(evt({ key: 'z', ctrlKey: true }), s), true);
  assert.equal(matchesShortcut(evt({ key: 'z', metaKey: true }), s), true);
  assert.equal(matchesShortcut(evt({ key: 'z' }), s), false);
});

test('matchesShortcut rejects mismatched modifiers', () => {
  const s = parseShortcut('P');
  assert.equal(matchesShortcut(evt({ key: 'p' }), s), true);
  assert.equal(matchesShortcut(evt({ key: 'p', ctrlKey: true }), s), false);
  assert.equal(matchesShortcut(evt({ key: 'p', shiftKey: true }), s), false);
});

test('matchesShortcut is case-insensitive on keys', () => {
  const s = parseShortcut('P');
  assert.equal(matchesShortcut(evt({ key: 'P' }), s), true);
  assert.equal(matchesShortcut(evt({ key: 'p' }), s), true);
});

test('KeyboardShortcuts.handle dispatches matching action', () => {
  const k = new KeyboardShortcuts();
  let called = 0;
  k.register('Ctrl+Z', () => {
    called += 1;
  });
  const handled = k.handle(evt({ key: 'z', ctrlKey: true }));
  assert.equal(handled, true);
  assert.equal(called, 1);
});

test('KeyboardShortcuts.handle returns false when no match', () => {
  const k = new KeyboardShortcuts();
  k.register('P', () => {});
  assert.equal(k.handle(evt({ key: 'q' })), false);
});

test('KeyboardShortcuts registers multiple aliases for redo', () => {
  const k = new KeyboardShortcuts();
  let redos = 0;
  const redo = () => {
    redos += 1;
  };
  k.register('Ctrl+Shift+Z', redo);
  k.register('Ctrl+Y', redo);

  k.handle(evt({ key: 'z', ctrlKey: true, shiftKey: true }));
  k.handle(evt({ key: 'y', ctrlKey: true }));
  assert.equal(redos, 2);
});

test('KeyboardShortcuts.all exposes registered bindings with descriptions', () => {
  const k = new KeyboardShortcuts();
  k.register('P', () => {}, 'Tool: pencil');
  assert.equal(k.all.length, 1);
  assert.equal(k.all[0].descriptor, 'P');
  assert.equal(k.all[0].description, 'Tool: pencil');
});
