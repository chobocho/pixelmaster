import type { CanvasSize } from '../editor/CanvasSize.js';
import type { EditorSnapshot } from '../editor/snapshot.js';
import type { EditorState } from '../editor/EditorState.js';
import type { RGBA } from '../color/Color.js';

/** 저장소(IndexedDB / JSON 파일)에 영속화되는 프로젝트 레코드. */
export interface ProjectRecord {
  readonly id: string;
  name: string;
  readonly createdAt: number;
  updatedAt: number;
  snapshot: EditorSnapshot;
  palette: RGBA[];
}

/** 에디터 상태로부터 레코드를 생성한다. */
export function projectRecordFromState(
  state: EditorState,
  options: { id: string; name: string; createdAt?: number },
): ProjectRecord {
  const now = Date.now();
  return {
    id: options.id,
    name: options.name,
    createdAt: options.createdAt ?? now,
    updatedAt: now,
    snapshot: state.takeSnapshot(),
    palette: state.palette.toJSON(),
  };
}

/** 레코드의 내용을 에디터 상태에 반영한다. */
export function applyProjectRecord(state: EditorState, record: ProjectRecord): void {
  state.restoreSnapshot(record.snapshot);
  state.palette.loadJSON(record.palette);
}

/** 저장소 목록에 쓰이는 메타데이터. */
export interface ProjectSummary {
  id: string;
  name: string;
  size: CanvasSize;
  createdAt: number;
  updatedAt: number;
}
