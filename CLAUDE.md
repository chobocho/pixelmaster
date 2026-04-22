# CLAUDE.md — PixelMaster Clone

## 1. 프로젝트 개요

**목표**: HTML5 Canvas + TypeScript 기반 픽셀 아트 에디터 웹앱  
**엔진/언어**: TypeScript (외부 런타임 라이브러리 금지)  
**실행 환경**: `python -m http.server 8001` (localhost 기반, file:// 미사용)

### 지원 캔버스 사이즈

| 사이즈    | 용도 예시                |
|-----------|--------------------------|
| 16×16     | 게임 타일/스프라이트     |
| 24×24     | 소형 아이콘              |
| 32×32     | 표준 스프라이트          |
| 48×48     | 중형 아이콘              |
| 64×64     | 고해상도 픽셀 아트       |
| 128×128   | 대형 아트 / 커버 이미지  |
| 160×160   | 와이드 스프라이트        |
| 192×192   | 최대 해상도              |

---

## 2. 작업 규칙

- 모든 변경은 **설계 → 테스트 작성 → 구현 → 검증** 순서로 진행
- **한 번에 하나의 이슈만** 해결하고 테스트 통과 확인 후 git push
- 작업 완료 후 `history.md`에 한글로 이력 기록
- `readme.md`는 한글로 유지
- 관리 에이전트가 개발, 검증, 디자인 에이전트 관리

---

## 3. 개발 주의사항

- 실행 시 **외부 라이브러리 참조 금지** (CDN 포함)
- **HTML5 Canvas 기반** 렌더링만 사용
- `global` 변수 사용 **금지**
- **하드코딩된 좌표값 금지** (상수 또는 레이아웃 계산으로 대체)
- 사용하지 않는 코드·에셋은 **즉시 삭제**

---

## 4. 핵심 기능 (Core Features)

### 4.1 캔버스 / 뷰포트

- HiDPI(`devicePixelRatio`) 대응 렌더러
- 캔버스 사이즈 전환 시 기존 작업 보존 또는 경고
- 줌(Zoom): 1×~32× (스크롤 휠 + 버튼)
- 그리드 표시/숨김 토글
- 체커보드 배경 (투명 영역 표현)

### 4.2 드로잉 도구

| 도구                  | 단축키 |
|-----------------------|--------|
| 연필 (Pencil)         | P      |
| 지우개 (Eraser)       | E      |
| 채우기 (Flood Fill)   | F      |
| 스포이드 (Eyedropper) | I      |
| 선 (Line)             | L      |
| 사각형 (Rectangle)    | R      |
| 원 (Ellipse)          | O      |
| 선택 영역 (Select)    | S      |
| 이동 (Move)           | M      |

### 4.3 색상 시스템

- 전경색 / 배경색 (좌클릭 / 우클릭)
- 팔레트: 최대 32색, 커스텀 팔레트 저장/불러오기
- HSV 컬러피커 + HEX 직접 입력
- 투명도(Alpha) 지원

### 4.4 레이어

- 다중 레이어 (추가/삭제/순서 변경/가시성/불투명도)
- 레이어 병합 (Merge Down / Flatten All)

### 4.5 히스토리 (Undo/Redo)

- 최대 50단계 Undo/Redo
- 단축키: `Ctrl+Z` / `Ctrl+Y` (또는 `Ctrl+Shift+Z`)

### 4.6 내보내기 / 저장

- PNG 다운로드 (원본 해상도)
- PNG 다운로드 (2×, 4×, 8× 스케일업)
- GIF 애니메이션 내보내기 (프레임 지원 시)
- JSON 프로젝트 파일 저장/불러오기

---

## 5. 데이터 & 저장

- **IndexedDB**: 자동저장, 프로젝트 목록 관리, 이어하기 지원
- **JSON**: 팔레트, 레이어, 픽셀 데이터, 캔버스 사이즈 포함
- **localStorage**: 사용자 환경설정 (UI 레이아웃, 단축키 등)

---

## 6. 이미지 · 사운드 리소스

- UI 아이콘은 **이모지 최대 활용**
- 외부 무료 이미지 사용 시 출처 표기 (`/assets/CREDITS.md`)
- 외부 무료 오디오 사용 시 출처 표기 + **base64로 변환하여 JS에 포함**
- 효과음 예시: 클릭, 채우기 완료, 저장 완료

---

## 7. 코딩 규칙

- 변수명: `camelCase` / 클래스명: `PascalCase`
- 모든 코드 **모듈화** (파일당 단일 책임 원칙)
- 주석은 코드의 **의도**를 명확히 설명
- 렌더 루프: `requestAnimationFrame` 기반 60 FPS
- 타입 안전성: `any` 사용 금지, 엄격한 TypeScript 설정 (`strict: true`)

---

## 8. 디렉토리 구조

```
/
├── index.html
├── readme.md
├── history.md
├── CLAUDE.md
├── tsconfig.json
├── assets/
│   ├── sounds/              # base64 변환 TS 파일 보관
│   └── CREDITS.md           # 외부 리소스 출처 목록
├── src/
│   ├── main.ts              # 진입점
│   ├── app.ts               # 앱 초기화 · 메인 루프
│   ├── renderer/
│   │   ├── Renderer.ts            # HiDPI Canvas 래퍼
│   │   ├── GridRenderer.ts        # 그리드 · 체커보드
│   │   └── PreviewRenderer.ts     # 미리보기 패널
│   ├── editor/
│   │   ├── PixelCanvas.ts         # 픽셀 데이터 모델 (Uint8ClampedArray)
│   │   ├── LayerManager.ts        # 레이어 CRUD · 합성
│   │   ├── HistoryManager.ts      # Undo/Redo 스택 (최대 50단계)
│   │   └── CanvasSize.ts          # 사이즈 상수 · 전환 로직
│   ├── tools/
│   │   ├── ToolManager.ts         # 도구 등록 · 이벤트 디스패치
│   │   ├── PencilTool.ts
│   │   ├── EraserTool.ts
│   │   ├── FillTool.ts            # BFS Flood Fill
│   │   ├── EyedropperTool.ts
│   │   ├── LineTool.ts            # Bresenham 직선
│   │   ├── RectTool.ts
│   │   ├── EllipseTool.ts         # Midpoint Circle Algorithm
│   │   ├── SelectTool.ts
│   │   └── MoveTool.ts
│   ├── color/
│   │   ├── ColorPicker.ts         # HSV ↔ RGB ↔ HEX 변환
│   │   └── PaletteManager.ts      # 팔레트 저장/불러오기
│   ├── ui/
│   │   ├── UILayout.ts            # 패널 배치 · 리사이즈
│   │   ├── Toolbar.ts
│   │   ├── LayerPanel.ts
│   │   ├── PalettePanel.ts
│   │   └── StatusBar.ts
│   ├── io/
│   │   ├── ProjectIO.ts           # JSON 저장/불러오기
│   │   ├── PngExporter.ts         # PNG 내보내기 (원본 + 스케일업)
│   │   └── GifExporter.ts         # GIF 내보내기 (프레임 기반)
│   └── storage/
│       └── IndexedDBStorage.ts    # 자동저장 · 프로젝트 목록
├── data/
│   └── default-palettes.json      # 기본 팔레트 데이터
└── tests/
    ├── pixelCanvas.test.ts
    ├── floodFill.test.ts
    ├── layerManager.test.ts
    ├── historyManager.test.ts
    ├── colorPicker.test.ts
    └── pngExporter.test.ts
```

---

## 9. 상수 정의

```typescript
// src/editor/CanvasSize.ts

/** 지원하는 캔버스 사이즈 목록 */
export const CANVAS_SIZES = [16, 24, 32, 48, 64, 128, 160, 192] as const;
export type CanvasSize = typeof CANVAS_SIZES[number];

/** 각 캔버스 사이즈별 기본 줌 배율 (편집 영역 ~320px 기준) */
export const DEFAULT_ZOOM: Record<CanvasSize, number> = {
   16: 20,  //  16×20 = 320px
   24: 14,  //  24×14 = 336px
   32: 10,  //  32×10 = 320px
   48:  8,  //  48× 8 = 384px
   64:  6,  //  64× 6 = 384px
  128:  3,  // 128× 3 = 384px
  160:  2,  // 160× 2 = 320px
  192:  2,  // 192× 2 = 384px
};

export const MAX_UNDO_STEPS     = 50;   // Undo/Redo 최대 단계
export const TARGET_FPS         = 60;   // 목표 프레임레이트
export const MAX_PALETTE_COLORS = 32;   // 팔레트 최대 색상 수
export const MAX_ZOOM           = 32;   // 최대 줌 배율
export const MIN_ZOOM           = 1;    // 최소 줌 배율
```

---

## 10. 알고리즘 가이드

### Flood Fill (BFS 방식)
재귀 DFS 방식은 64×64에서도 스택 오버플로 위험이 있으므로 **BFS(Queue) 방식**을 사용한다.

```typescript
// src/tools/FillTool.ts (의사 코드)
function floodFill(canvas: PixelCanvas, startX: number, startY: number, fillColor: RGBA): void {
  const targetColor = canvas.getPixel(startX, startY);
  if (colorEquals(targetColor, fillColor)) return;

  const queue: [number, number][] = [[startX, startY]];
  const visited = new Uint8Array(canvas.width * canvas.height); // 방문 여부 비트맵

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const idx = y * canvas.width + x;

    if (visited[idx]) continue;
    if (!colorEquals(canvas.getPixel(x, y), targetColor)) continue;

    visited[idx] = 1;
    canvas.setPixel(x, y, fillColor);

    // 4방향 인접 픽셀 추가 (상하좌우)
    if (x > 0)               queue.push([x - 1, y]);
    if (x < canvas.width - 1) queue.push([x + 1, y]);
    if (y > 0)               queue.push([x, y - 1]);
    if (y < canvas.height - 1) queue.push([x, y + 1]);
  }
}
```

### Bresenham 직선 알고리즘 (LineTool)
부동소수점 없이 정수 연산만으로 픽셀 직선을 그린다.

### Midpoint Circle Algorithm (EllipseTool)
8방향 대칭성을 이용해 원/타원을 효율적으로 래스터라이즈한다.

### HiDPI 렌더러 패턴

```typescript
// src/renderer/Renderer.ts
export class Renderer {
  private readonly dpr: number;

  constructor(private canvas: HTMLCanvasElement) {
    this.dpr = window.devicePixelRatio ?? 1;
    this.resize(canvas.clientWidth, canvas.clientHeight);
  }

  resize(cssWidth: number, cssHeight: number): void {
    // 물리 픽셀 = CSS 픽셀 × DPR
    this.canvas.width  = Math.floor(cssWidth  * this.dpr);
    this.canvas.height = Math.floor(cssHeight * this.dpr);
    this.canvas.style.width  = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;

    const ctx = this.canvas.getContext('2d')!;
    ctx.scale(this.dpr, this.dpr); // 이후 모든 드로우는 CSS 단위 기준
  }
}
```

---

## 11. 이슈 백로그

| # | 제목 | 상태 |
|---|------|------|
| 1 | 프로젝트 스캐폴딩 + HiDPI 렌더러 | ✅ DONE |
| 2 | PixelCanvas 모델 + 캔버스 사이즈 6종 | ✅ DONE |
| 3 | 연필·지우개 도구 + 마우스 입력 | ✅ DONE |
| 4 | 줌 + 그리드·체커보드 렌더러 | ✅ DONE |
| 5 | 채우기 도구 (BFS Flood Fill) | ✅ DONE |
| 6 | 색상 시스템 (HSV 피커 + 팔레트) | ✅ DONE |
| 7 | 선·사각형·원 도구 | ✅ DONE |
| 8 | 레이어 시스템 | ✅ DONE |
| 9 | Undo/Redo (히스토리 50단계) | ✅ DONE |
| 10 | PNG 내보내기 (원본 + 스케일업) | ✅ DONE |
| 11 | IndexedDB 자동저장 + 이어하기 | ✅ DONE |
| 12 | UI 레이아웃 + 패널 리사이즈 | ✅ DONE |
| 13 | 선택·이동 도구 | ✅ DONE |
| 14 | GIF 내보내기 (애니메이션) | ✅ DONE |
| 15 | 단축키 시스템 | ✅ DONE |

---

## 12. Git 커밋 컨벤션

```
feat: Issue #N - 기능 설명
fix:  Issue #N - 버그 수정 설명
test: Issue #N - 테스트 추가/수정
docs: readme/history 업데이트
```

**예시**
```
feat: Issue #1 - HiDPI Canvas 렌더러 및 프로젝트 스캐폴딩
test: Issue #1 - Renderer 리사이즈 단위 테스트 추가
```
