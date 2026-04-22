import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '../src/editor/EditorState.js';
import { InMemoryProjectStorage } from '../src/storage/InMemoryProjectStorage.js';
import { projectRecordFromState } from '../src/storage/ProjectRecord.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };

function makeRecord(id: string, name: string) {
  const s = new EditorState(16);
  s.activeCanvas.setPixel(0, 0, RED);
  return projectRecordFromState(s, { id, name });
}

test('InMemoryProjectStorage save/load round-trip', async () => {
  const store = new InMemoryProjectStorage();
  const rec = makeRecord('p1', 'First');
  await store.save(rec);
  const loaded = await store.load('p1');
  assert.notEqual(loaded, null);
  assert.equal(loaded!.id, 'p1');
  assert.equal(loaded!.snapshot.size, 16);
});

test('InMemoryProjectStorage load returns null for unknown id', async () => {
  const store = new InMemoryProjectStorage();
  assert.equal(await store.load('missing'), null);
});

test('InMemoryProjectStorage list sorts by updatedAt descending', async () => {
  const store = new InMemoryProjectStorage();
  const first = makeRecord('a', 'First');
  await store.save(first);
  // Bump time by overwriting with newer updatedAt
  const second = makeRecord('b', 'Second');
  second.updatedAt = first.updatedAt + 1000;
  await store.save(second);
  const list = await store.list();
  assert.equal(list.length, 2);
  assert.equal(list[0].id, 'b');
  assert.equal(list[1].id, 'a');
});

test('InMemoryProjectStorage delete removes records', async () => {
  const store = new InMemoryProjectStorage();
  await store.save(makeRecord('x', 'X'));
  assert.equal(store.size, 1);
  await store.delete('x');
  assert.equal(store.size, 0);
  assert.equal(await store.load('x'), null);
});

test('InMemoryProjectStorage load returns a defensive copy', async () => {
  const store = new InMemoryProjectStorage();
  await store.save(makeRecord('p', 'P'));
  const first = await store.load('p');
  first!.snapshot.layers[0].data[0] = 0; // mutate copy
  const second = await store.load('p');
  assert.notEqual(second!.snapshot.layers[0].data[0], 0);
});
