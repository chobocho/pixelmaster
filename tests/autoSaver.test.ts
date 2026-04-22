import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AutoSaver,
  type Scheduler,
  type SchedulerHandle,
} from '../src/storage/AutoSaver.js';

class FakeScheduler implements Scheduler {
  pending: Array<{ cb: () => void; delay: number; cancelled: boolean }> = [];

  schedule(cb: () => void, delay: number): SchedulerHandle {
    const entry = { cb, delay, cancelled: false };
    this.pending.push(entry);
    return {
      cancel: () => {
        entry.cancelled = true;
      },
    };
  }

  async fireAll(): Promise<void> {
    const snapshot = this.pending.slice();
    this.pending = [];
    for (const e of snapshot) {
      if (!e.cancelled) e.cb();
    }
    await Promise.resolve();
  }
}

test('AutoSaver fires save after schedule()', async () => {
  const sch = new FakeScheduler();
  let callCount = 0;
  const a = new AutoSaver(async () => {
    callCount += 1;
  }, 100, sch);
  a.schedule();
  await sch.fireAll();
  await Promise.resolve();
  assert.equal(callCount, 1);
});

test('AutoSaver debounces: multiple schedule() calls result in a single save', async () => {
  const sch = new FakeScheduler();
  let callCount = 0;
  const a = new AutoSaver(async () => {
    callCount += 1;
  }, 100, sch);
  a.schedule();
  a.schedule();
  a.schedule();
  // Only the last timer fires
  await sch.fireAll();
  await Promise.resolve();
  assert.equal(callCount, 1);
});

test('AutoSaver cancel prevents pending save', async () => {
  const sch = new FakeScheduler();
  let callCount = 0;
  const a = new AutoSaver(async () => {
    callCount += 1;
  }, 100, sch);
  a.schedule();
  a.cancel();
  await sch.fireAll();
  assert.equal(callCount, 0);
});

test('AutoSaver flush executes pending save immediately', async () => {
  const sch = new FakeScheduler();
  let callCount = 0;
  const a = new AutoSaver(async () => {
    callCount += 1;
  }, 100, sch);
  a.schedule();
  await a.flush();
  assert.equal(callCount, 1);
  // No timer should still be pending (it was cancelled inside flush)
  await sch.fireAll();
  assert.equal(callCount, 1);
});
