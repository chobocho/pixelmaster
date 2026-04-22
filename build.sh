#!/usr/bin/env bash
#
# build.sh — release/ 폴더에 단일 파일 dist.js 를 만든다.
#
# 배포물은 브라우저 실행에 꼭 필요한 것만 포함한다:
#   - release/index.html  (엔트리)
#   - release/dist.js     (번들된 앱)
#
# 단계:
#   1) 필요한 devDependency 설치 (최초 1회)
#   2) 엄격 타입 체크 + 전체 테스트
#   3) src/main.ts → release/dist.js 로 번들 (esbuild, IIFE, no sourcemap)
#   4) index.html 복사 + script 태그를 ./dist.js 로 재작성
#
# 실행:
#   bash build.sh
#   또는 npm run release

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

RELEASE_DIR="$ROOT/release"
ENTRY="src/main.ts"

log() {
  printf '\033[1;34m==>\033[0m %s\n' "$*"
}

log "1/4 devDependency 확인"
if [ ! -d node_modules ] || [ ! -x node_modules/.bin/tsc ] || [ ! -x node_modules/.bin/esbuild ]; then
  npm install --no-audit --no-fund --loglevel=error
fi

log "2/4 타입 체크 + 테스트"
npm run typecheck
npm test

log "3/4 src/main.ts → release/dist.js 번들"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"
node_modules/.bin/esbuild "$ENTRY" \
  --bundle \
  --format=iife \
  --target=es2020 \
  --minify \
  --legal-comments=none \
  --outfile="$RELEASE_DIR/dist.js"

log "4/4 index.html 복사 (script 태그 재작성)"
# <script type="module" src="./dist/main.js"> → <script src="./dist.js">
sed -e 's|\./dist/main\.js|./dist.js|g' \
    -e 's| type="module"||g' \
    index.html > "$RELEASE_DIR/index.html"

log "완료: $RELEASE_DIR"
echo
echo "배포물:"
ls -lh "$RELEASE_DIR"
echo
echo "로컬 확인:"
echo "  cd release && python3 -m http.server 8001"
