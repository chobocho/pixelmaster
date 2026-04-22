import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HistoryManager } from '../src/editor/HistoryManager.js';
import { MAX_UNDO_STEPS } from '../src/editor/CanvasSize.js';

test('HistoryManager default capacity is MAX_UNDO_STEPS', () => {
  const h = new HistoryManager<string>();
  assert.equal(h.capacity, MAX_UNDO_STEPS);
});

test('HistoryManager cannot undo with one or zero entries', () => {
  const h = new HistoryManager<string>();
  assert.equal(h.canUndo(), false);
  h.push('A');
  assert.equal(h.canUndo(), false);
});

test('HistoryManager undo returns prior state', () => {
  const h = new HistoryManager<string>();
  h.push('A');
  h.push('B');
  h.push('C');
  assert.equal(h.canUndo(), true);
  assert.equal(h.undo(), 'B');
  assert.equal(h.undo(), 'A');
  assert.equal(h.undo(), null);
});

test('HistoryManager redo replays after undo', () => {
  const h = new HistoryManager<string>();
  h.push('A');
  h.push('B');
  h.push('C');
  h.undo(); // now at B
  assert.equal(h.canRedo(), true);
  assert.equal(h.redo(), 'C');
  assert.equal(h.canRedo(), false);
});

test('HistoryManager push clears the redo stack', () => {
  const h = new HistoryManager<string>();
  h.push('A');
  h.push('B');
  h.undo(); // now at A, future=[B]
  assert.equal(h.canRedo(), true);
  h.push('C');
  assert.equal(h.canRedo(), false);
});

test('HistoryManager enforces maxSteps by dropping oldest', () => {
  const h = new HistoryManager<number>(3);
  h.push(1);
  h.push(2);
  h.push(3);
  h.push(4); // drops 1
  // past should be [2, 3, 4]
  assert.equal(h.undoDepth, 2);
  assert.equal(h.undo(), 3);
  assert.equal(h.undo(), 2);
  assert.equal(h.undo(), null); // only 2 left
});

test('HistoryManager undoDepth / redoDepth reflect stack state', () => {
  const h = new HistoryManager<string>();
  h.push('A');
  h.push('B');
  h.push('C');
  assert.equal(h.undoDepth, 2);
  assert.equal(h.redoDepth, 0);
  h.undo();
  assert.equal(h.undoDepth, 1);
  assert.equal(h.redoDepth, 1);
});

test('HistoryManager clear resets both stacks', () => {
  const h = new HistoryManager<string>();
  h.push('A');
  h.push('B');
  h.clear();
  assert.equal(h.canUndo(), false);
  assert.equal(h.canRedo(), false);
});

test('HistoryManager rejects non-positive maxSteps', () => {
  assert.throws(() => new HistoryManager(0), /positive/);
  assert.throws(() => new HistoryManager(-1), /positive/);
});

test('HistoryManager interleaved undo/redo/push sequence', () => {
  const h = new HistoryManager<string>();
  h.push('A');
  h.push('B');
  h.push('C');
  assert.equal(h.undo(), 'B');
  assert.equal(h.redo(), 'C');
  h.push('D'); // clears future
  assert.equal(h.canRedo(), false);
  assert.equal(h.undo(), 'C');
  assert.equal(h.undo(), 'B');
  assert.equal(h.redo(), 'C');
  assert.equal(h.redo(), 'D');
});

test('HistoryManager capacity=1 never permits undo', () => {
  const h = new HistoryManager<number>(1);
  h.push(1);
  h.push(2);
  h.push(3);
  assert.equal(h.canUndo(), false);
  assert.equal(h.undoDepth, 0);
});
