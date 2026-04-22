# PixelMaster

HTML5 Canvas + TypeScript 기반 픽셀 아트 에디터 웹앱.

## 특징

- **외부 런타임 의존성 0** — 네이티브 Canvas 2D API만 사용
- **HiDPI 대응** — devicePixelRatio 기반 렌더러로 선명한 픽셀 출력
- **엄격한 TypeScript** — `strict: true`, `any` 금지, 엄격한 타입 검사
- 지원 캔버스 사이즈: 10×10, 16×16, 20×20, 25×25, 32×32, 64×64

## 디렉토리 구조

자세한 내용은 [`CLAUDE.md`](./CLAUDE.md) §8 참고.

```
src/
├── main.ts              # 진입점
├── app.ts               # 앱 초기화 · 렌더 루프
└── renderer/
    └── Renderer.ts      # HiDPI Canvas 래퍼
tests/
└── renderer.test.ts     # Renderer 단위 테스트
```

## 개발 가이드

### 사전 준비

```bash
npm install
```

### 빌드

```bash
npm run build          # src/ → dist/
```

### 테스트

```bash
npm test               # tsc 컴파일 + node --test 실행
npm run typecheck      # emit 없이 타입 검사만
```

### 실행 (로컬 개발 서버)

```bash
npm start              # python3 -m http.server 8001
# 브라우저에서 http://localhost:8001 접속
```

`file://` 프로토콜로는 ES 모듈이 동작하지 않으므로 반드시 로컬 서버를 사용한다.

## 작업 규칙

- 한 번에 하나의 이슈만 해결 → 테스트 통과 확인 → 커밋
- 변경 이력은 [`history.md`](./history.md)에 한글로 기록
- 설계 → 테스트 → 구현 → 검증 순서 준수
- 커밋 컨벤션: `feat: Issue #N - 설명`

## 이슈 백로그

[`CLAUDE.md`](./CLAUDE.md) §11 백로그 참고.
