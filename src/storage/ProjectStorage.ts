import type { ProjectRecord, ProjectSummary } from './ProjectRecord.js';

/** 프로젝트 영속화 추상 인터페이스. IndexedDB / in-memory 등이 구현한다. */
export interface ProjectStorage {
  save(record: ProjectRecord): Promise<void>;
  load(id: string): Promise<ProjectRecord | null>;
  list(): Promise<ProjectSummary[]>;
  delete(id: string): Promise<void>;
}
