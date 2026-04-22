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
