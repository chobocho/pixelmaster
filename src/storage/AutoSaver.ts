export interface SchedulerHandle {
  cancel(): void;
}

export interface Scheduler {
  schedule(callback: () => void, delayMs: number): SchedulerHandle;
}

const realScheduler: Scheduler = {
  schedule(cb, delay) {
    const id = setTimeout(cb, delay);
    return {
      cancel: () => clearTimeout(id),
    };
  },
};

/**
 * 변경 이벤트가 잦을 때 디바운스해서 한 번만 실제 저장을 수행한다.
 * schedule() 이 delayMs 동안 추가 호출이 없으면 save 콜백을 호출.
 */
export class AutoSaver {
  private handle: SchedulerHandle | null = null;
  private pending: Promise<void> | null = null;

  constructor(
    private readonly save: () => Promise<void>,
    private readonly delayMs: number,
    private readonly scheduler: Scheduler = realScheduler,
  ) {}

  schedule(): void {
    if (this.handle !== null) this.handle.cancel();
    this.handle = this.scheduler.schedule(() => {
      this.handle = null;
      this.pending = this.save().finally(() => {
        this.pending = null;
      });
    }, this.delayMs);
  }

  cancel(): void {
    if (this.handle !== null) {
      this.handle.cancel();
      this.handle = null;
    }
  }

  /** 예약된 저장을 즉시 실행하고, 이미 진행 중인 저장은 완료를 기다린다. */
  async flush(): Promise<void> {
    if (this.handle !== null) {
      this.handle.cancel();
      this.handle = null;
      await this.save();
      return;
    }
    if (this.pending !== null) {
      await this.pending;
    }
  }
}
