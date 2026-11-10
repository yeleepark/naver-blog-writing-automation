// 공용 설정/브라우저 연결 헬퍼. .env 를 읽어 환경변수로 쓴다.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
try { process.loadEnvFile(path.join(ROOT, ".env")); } catch { /* .env 없으면 시스템 환경변수만 사용 */ }

export const BLOG_ID = process.env.NAVER_BLOG_ID;
export const PORT = process.env.CHROME_DEBUG_PORT || "9222";
export const CDP = `http://127.0.0.1:${PORT}`;

export function requireBlogId() {
  if (!BLOG_ID) {
    console.error("NAVER_BLOG_ID 가 없습니다. .env 에 NAVER_BLOG_ID=<내 블로그 ID> 를 설정하세요 (.env.example 참고).");
    process.exit(1);
  }
  return BLOG_ID;
}

// 크롬에 열린 탭이 하나도 없으면 CDP 연결이 실패하므로 빈 탭을 하나 열어 준다.
async function ensureDebugTab() {
  const res = await fetch(`${CDP}/json/list`).catch(() => null);
  if (!res?.ok) return false;
  const list = await res.json();
  if (!list.some((t) => t.type === "page")) await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" }).catch(() => {});
  return true;
}

export async function connect() {
  if (!(await ensureDebugTab())) {
    throw new Error(`디버깅 크롬(${CDP})이 없습니다. 먼저 \`pnpm chrome\` 으로 크롬을 열고 네이버에 로그인하세요.`);
  }
  return chromium.connectOverCDP(CDP);
}

// 글쓰기 탭 찾기: 에디터 제목에 titleHint 가 포함된 탭 (없으면 첫 번째 에디터 탭)
export async function findEditor(browser, titleHint) {
  for (const page of browser.contexts()[0].pages()) {
    const frame = page.frames().find((f) => f.name() === "mainFrame");
    if (!frame) continue;
    const title = (await frame.locator(".se-documentTitle").innerText().catch(() => "")).trim();
    if (!titleHint || title.includes(titleHint)) return { page, frame, title };
  }
  return null;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
