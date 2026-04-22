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
