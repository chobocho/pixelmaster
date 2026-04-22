import type { ProjectStorage } from './ProjectStorage.js';
import type { ProjectRecord, ProjectSummary } from './ProjectRecord.js';

/** 테스트·임시 사용용 인메모리 저장소. 구조적 복사로 외부 간섭을 차단. */
export class InMemoryProjectStorage implements ProjectStorage {
  private readonly records = new Map<string, ProjectRecord>();

  async save(record: ProjectRecord): Promise<void> {
    this.records.set(record.id, cloneRecord(record));
  }

  async load(id: string): Promise<ProjectRecord | null> {
    const r = this.records.get(id);
    return r === undefined ? null : cloneRecord(r);
  }

  async list(): Promise<ProjectSummary[]> {
    const items: ProjectSummary[] = [];
    for (const r of this.records.values()) {
      items.push({
        id: r.id,
        name: r.name,
        size: r.snapshot.size,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      });
    }
    items.sort((a, b) => b.updatedAt - a.updatedAt);
    return items;
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }

  get size(): number {
    return this.records.size;
  }
}

function cloneRecord(r: ProjectRecord): ProjectRecord {
  return {
    id: r.id,
    name: r.name,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    snapshot: {
      size: r.snapshot.size,
      activeIndex: r.snapshot.activeIndex,
      layers: r.snapshot.layers.map((l) => ({
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
        data: new Uint8ClampedArray(l.data),
      })),
    },
    palette: r.palette.map((c) => ({ r: c.r, g: c.g, b: c.b, a: c.a })),
  };
}
