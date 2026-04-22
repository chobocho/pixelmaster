import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '../src/editor/EditorState.js';
import {
  applyProjectRecord,
  projectRecordFromState,
} from '../src/storage/ProjectRecord.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };

test('projectRecordFromState captures size, layers, and palette', () => {
  const s = new EditorState(32);
  s.activeCanvas.setPixel(1, 1, RED);
  const rec = projectRecordFromState(s, { id: 'p1', name: 'First' });

  assert.equal(rec.id, 'p1');
  assert.equal(rec.name, 'First');
  assert.equal(rec.snapshot.size, 32);
  assert.equal(rec.snapshot.layers.length, 1);
  assert.ok(rec.palette.length > 0);
});

test('applyProjectRecord restores pixel data and palette', () => {
  const a = new EditorState(16);
  a.activeCanvas.setPixel(2, 2, RED);
  a.palette.clear();
  a.palette.add(RED);
  const rec = projectRecordFromState(a, { id: 'p', name: 'test' });

  const b = new EditorState(16);
  applyProjectRecord(b, rec);
  assert.deepEqual(b.activeCanvas.getPixel(2, 2), RED);
  assert.equal(b.palette.count, 1);
  assert.deepEqual(b.palette.get(0), RED);
});

test('applyProjectRecord throws on size mismatch', () => {
  const a = new EditorState(16);
  const rec = projectRecordFromState(a, { id: 'p', name: 't' });
  const b = new EditorState(32);
  assert.throws(() => applyProjectRecord(b, rec), /size/);
});

test('projectRecordFromState uses provided createdAt or now', () => {
  const s = new EditorState(16);
  const rec = projectRecordFromState(s, { id: 'p', name: 't', createdAt: 12345 });
  assert.equal(rec.createdAt, 12345);
  assert.ok(rec.updatedAt >= rec.createdAt);
});
