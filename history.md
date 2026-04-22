# 작업 이력

## 2026-04-22

### Issue #1 — 프로젝트 스캐폴딩 + HiDPI 렌더러

**변경 사항**

- `package.json` 추가: `type: module`, `build` / `test` / `typecheck` / `start` 스크립트 정의
- `tsconfig.json` 추가: `strict`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes` 등 엄격 모드 활성화, `src → dist` 컴파일
- `tsconfig.test.json` 추가: 테스트용 설정 (src + tests → dist-test, `types: ["node"]`)
- `.gitignore` 추가: `node_modules/`, `dist/`, `dist-test/` 제외
- `index.html` 추가: 최소 레이아웃, 캔버스 1개, `dist/main.js` ES 모듈 로드
- `src/main.ts` 추가: DOMContentLoaded 후 App 부트스트랩
- `src/app.ts` 추가: App 클래스, Renderer 보유 + requestAnimationFrame 렌더 루프, resize 리스너
- `src/renderer/Renderer.ts` 추가: HiDPI Canvas 래퍼
  - 생성자에서 devicePixelRatio 주입 (테스트 용이성)
  - `resize(cssW, cssH)`: 물리 픽셀 = CSS × DPR, `setTransform → scale(dpr, dpr)` 순으로 행렬 초기화
  - `clear()`, `context`, `devicePixelRatio`, `cssWidth`, `cssHeight` getter 제공
  - 비정상 DPR / 크기 입력을 명시적으로 검증
- `tests/renderer.test.ts` 추가: Mock Canvas / 2D Context 기반 단위 테스트 8건
  - 물리 픽셀 = CSS × DPR 확인
  - 반복 resize 시 변환 행렬 일관성 확인
  - 소수 DPR 내림 처리 확인
  - `clear()`가 CSS 단위로 clearRect 호출 확인
  - 비정상 입력(컨텍스트 없음, DPR ≤ 0, 크기 ≤ 0) 에러 확인
- `readme.md` 추가: 개발 가이드, 빌드/테스트/실행 방법
- `CLAUDE.md`: Issue #1 상태 → `DONE`

**검증**

- `npm run typecheck` 통과 (src + tests 모두)
- `npm test` 8건 모두 통과
- `python3 -m http.server 8001` 로 `index.html`, `dist/main.js`, `dist/app.js`, `dist/renderer/Renderer.js` 200 OK 응답 확인

### Issue #2 — PixelCanvas 모델 + 캔버스 사이즈 6종

**변경 사항**

- `src/editor/CanvasSize.ts` 추가
  - `CANVAS_SIZES = [10, 16, 20, 25, 32, 64]` as const, `CanvasSize` 타입
  - `DEFAULT_ZOOM`: 사이즈별 기본 줌 배율 Record
  - 상수: `MAX_UNDO_STEPS=50`, `TARGET_FPS=60`, `MAX_PALETTE_COLORS=32`, `MAX_ZOOM=32`, `MIN_ZOOM=1`
  - 런타임 타입 가드 `isCanvasSize(n)` 추가
- `src/color/Color.ts` 추가
  - `RGBA` 인터페이스 (r/g/b/a 각 0..255, readonly)
  - `TRANSPARENT` 상수
- `src/editor/PixelCanvas.ts` 추가
  - Uint8ClampedArray 기반 정사각형 픽셀 캔버스 (크기 = size²×4 바이트)
  - getPixel/setPixel: 범위 밖 좌표 시 RangeError
  - fill, clear, clone, isInBounds
  - resize(newSize, mode): `preserve` 는 좌상단 기준 복사(확대 시 나머지 투명, 축소 시 우/하단 잘림), `clear` 는 전체 투명화, 같은 사이즈는 no-op
- 테스트 16건 추가 (`tests/canvasSize.test.ts` 4건, `tests/pixelCanvas.test.ts` 12건)
  - 6개 사이즈 전체 초기화/범위 검증
  - setPixel/getPixel round-trip, 범위 밖 throw
  - fill/clear/clone 독립성
  - resize preserve 확대·축소, clear 모드, same-size no-op
  - Uint8ClampedArray 자동 클램핑 동작 확인
- CLAUDE.md: Issue #2 상태 → `DONE`

**검증**

- `npm test` 24건(Issue #1 8건 + Issue #2 16건) 모두 통과
- `npm run typecheck` 통과 (strict / noUnusedLocals / exactOptionalPropertyTypes 포함)
- `npm run build` 통과

### Issue #3 — 연필·지우개 도구 + 마우스 입력

**변경 사항**

- `src/tools/Tool.ts` 추가: `Tool` 인터페이스, `ToolId` 유니온, `ToolContext`, `ToolPointerEvent`, `PointerButton`
- `src/tools/strokeLine.ts` 추가: Bresenham 직선 알고리즘 (plot 콜백 기반)
- `src/tools/PencilTool.ts` 추가: 좌클릭=전경색 / 우클릭=배경색, 드래그 시 이전 위치와 직선 연결
- `src/tools/EraserTool.ts` 추가: 좌클릭으로 TRANSPARENT 덮어쓰기, 드래그 연결
- `src/tools/ToolManager.ts` 추가: 도구 등록·setActive·포인터 이벤트 디스패치
- `src/editor/EditorState.ts` 추가: PixelCanvas + foreground/background 색 중앙 보관
- `src/renderer/PixelBlitter.ts` 추가: 오프스크린 캔버스에 putImageData 후 nearest-neighbor drawImage 로 HTML 캔버스에 블릿
- `src/ui/pointerMapping.ts` 추가: `mapToPixel`(CSS → 격자), `centeredIntegerFit`(정수 배율 중앙 정렬 blit 영역)
- `src/app.ts` 리팩터링: EditorState / ToolManager / PixelBlitter 연결, pointerdown/move/up/cancel 바인딩, 우클릭 contextmenu 차단, setPointerCapture 처리
- 테스트 27건 추가 (strokeLine 6, pencil 7, eraser 3, toolManager 5, pointerMapping 6)

**검증**

- `npm test` 51건 모두 통과
- `npm run typecheck` 통과
- `npm run build` 통과

### Issue #4 — 줌 + 그리드·체커보드 렌더러

**변경 사항**

- `src/renderer/Viewport.ts` 추가: 줌(1..32) + offset + showGrid, fitToViewport/centerIn, zoomAt(앵커 유지), pan, toggleGrid
- `src/renderer/CheckerboardRenderer.ts` 추가: 투명 표현용 체커 배경 (CSS 단위 셀)
- `src/renderer/GridRenderer.ts` 추가: 격자 라인 (scale ≥ 4일 때만, 0.5 오프셋 crisp stroke)
- `src/app.ts` 업데이트: Viewport 통합, 체커보드 → blit → 그리드 순서로 렌더, wheel 이벤트로 anchor-aware 줌, resize 시 fit 재적용
- 테스트 14건 추가 (viewport 9, checkerboard 2, grid 3)

**검증**

- `npm test` 65건 모두 통과
- `npm run build` 통과

### Issue #5 — 채우기 도구 (BFS Flood Fill)

**변경 사항**

- `src/color/Color.ts`: `colorEquals(a, b)` 유틸 추가
- `src/tools/floodFill.ts` 추가: 4방향 BFS 구현. 재귀 DFS 대신 head 포인터 큐 사용, Uint8Array visited 비트맵, 시작 픽셀 == 채우기 색이면 즉시 반환
- `src/tools/FillTool.ts` 추가: 좌=전경, 우=배경. 이동/up 은 no-op
- `src/app.ts`: FillTool 등록
- 테스트 11건 추가 (floodFill 7, fillTool 4)

**검증**

- `npm test` 76건 모두 통과

### Issue #6 — 색상 시스템 (HSV/HEX 변환 + 팔레트 + 스포이드)

**변경 사항**

- `src/color/conversions.ts` 추가: `hsvToRgb`, `rgbToHsv`(0..360 정규화), `rgbaToHex`(alpha=255 시 6자리, 아니면 8자리), `hexToRgba`(3/4/6/8 자리 모두, 잘못된 입력 null)
- `src/color/PaletteManager.ts` 추가: max 32 (기본) 제한, add/replace/remove/clear/get(방어적 복사)/toJSON/loadJSON
- `src/color/defaultPalette.ts` 추가: 내장 16색 기본 팔레트
- `src/tools/EyedropperTool.ts` 추가: 클릭 픽셀 색 → FG(좌)/BG(우), 콜백 없으면 no-op
- `src/tools/Tool.ts`: `ToolContext` 에 optional `setForegroundColor`/`setBackgroundColor` 콜백 추가
- `src/editor/EditorState.ts`: palette 보관, setFG/BG 메서드, 기본 팔레트 로드
- `src/app.ts`: EyedropperTool 등록, buildContext 에 setter 주입
- `data/default-palettes.json` 추가: 기본 팔레트 JSON 정의
- 테스트 24건 추가 (conversions 9, palette 9, eyedropper 4, defaultPalette 2)

**검증**

- `npm test` 100건 모두 통과
