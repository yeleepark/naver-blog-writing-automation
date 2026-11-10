#!/bin/sh
# 자동화 플래그 없는 일반 크롬을 디버깅 포트로 연다. 네이버 로그인(2단계 인증 포함)은 열린 창에서 직접 한다.
# 로그인 세션은 레포 안 .chrome-profile 에 저장되어 이후엔 유지된다. (.gitignore 로 제외됨 - 절대 커밋/공유하지 말 것)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
get() { [ -f "$ROOT/.env" ] && grep -E "^$1=" "$ROOT/.env" | head -1 | cut -d= -f2- | tr -d '"'; }
BLOG_ID="${NAVER_BLOG_ID:-$(get NAVER_BLOG_ID)}"
PORT="${CHROME_DEBUG_PORT:-$(get CHROME_DEBUG_PORT)}"; PORT="${PORT:-9222}"
if [ -z "$BLOG_ID" ]; then echo "NAVER_BLOG_ID 가 없습니다. .env 에 설정하세요 (.env.example 참고)." >&2; exit 1; fi
URL="https://nid.naver.com/nidlogin.login?url=https%3A%2F%2Fblog.naver.com%2F${BLOG_ID}"
ARGS="--remote-debugging-port=$PORT --user-data-dir=$ROOT/.chrome-profile --no-first-run"

if [ "$(uname)" = "Darwin" ]; then
  open -na "Google Chrome" --args $ARGS "$URL"
else
  ( command -v google-chrome || command -v chromium || command -v chromium-browser ) >/dev/null 2>&1 \
    && "$( command -v google-chrome || command -v chromium || command -v chromium-browser )" $ARGS "$URL" >/dev/null 2>&1 &
fi
