#!/usr/bin/env node
// 네이버 블로그 글쓰기 화면을 열고 제목/본문(+선택: 사진·사진 설명·지도)까지만 채운다.
// 발행 버튼은 절대 누르지 않는다.
//
// 사용: pnpm fill posts/<파일>.md [--photos <사진폴더>] [--no-quote-headings]
// 사전: pnpm chrome 으로 디버깅 크롬을 열고 네이버에 직접 로그인 (세션은 .chrome-profile 에 유지)
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { ROOT, BLOG_ID, requireBlogId, connect, sleep } from "./lib/common.mjs";
import { insertMaps, insertPhotos } from "./lib/media.mjs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const file = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--photos");
if (!file) { console.error("usage: pnpm fill posts/<file>.md [--photos <dir>] [--no-quote-headings]"); process.exit(1); }
requireBlogId();

const quoteHeadings = !flag("--no-quote-headings");
const photosDir = opt("--photos");
const md = readFileSync(file, "utf8");
const title = (md.match(/^\s*#\s+(.+)$/m) || [])[1]?.trim();
if (!title) { console.error("첫 줄에 '# 제목' 필요"); process.exit(1); }

// 본문을 리치텍스트로 클립보드에 (제목 줄 제외)
execFileSync("python3", ["-I", path.join(ROOT, "scripts/copy_html.py"), file, ...(quoteHeadings ? ["--quote-headings"] : [])], { stdio: "inherit" });

let browser;
try { browser = await connect(); } catch (e) { console.error(e.message); process.exit(1); }
const page = await browser.contexts()[0].newPage();
await page.goto(`https://blog.naver.com/${BLOG_ID}?Redirect=Write&`, { waitUntil: "domcontentloaded" });
await sleep(2500);
// 일시적인 로그인 리다이렉트가 있을 수 있어 한 번 더 확인한다
if (new URL(page.url()).hostname === "nid.naver.com") {
  await sleep(4000);
  if (new URL(page.url()).hostname === "nid.naver.com") {
    console.error("네이버 로그아웃 상태. 열린 크롬에서 로그인 후 다시 실행하세요.");
    process.exit(1);
  }
}

// 에디터 iframe
const frame = await (async () => {
  for (let i = 0; i < 120; i++) {
    const f = page.frames().find((x) => x.name() === "mainFrame");
    if (f && (await f.locator(".se-documentTitle, .se-title-text").count())) return f;
    await page.waitForTimeout(500);
  }
  throw new Error("에디터를 찾지 못함 (셀렉터/로그인 확인)");
})();

// 팝업 정리: 이어쓰기 취소, 도움말 닫기
await frame.locator(".se-popup-button-cancel").first().click({ timeout: 2000 }).catch(() => {});
await frame.locator(".se-help-panel-close-button").first().click({ timeout: 2000 }).catch(() => {});

// 제목
await frame.locator(".se-documentTitle .se-text-paragraph").first().click();
await page.keyboard.type(title, { delay: 20 });

// 본문 (클립보드 붙여넣기)
const mod = process.platform === "darwin" ? "Meta" : "Control";
await frame.locator(".se-component.se-text .se-text-paragraph").first().click();
await page.keyboard.press(`${mod}+V`);
await page.waitForTimeout(800);

// 붙여넣은 본문이 가운데 정렬로 들어오는 경우가 있어 왼쪽 정렬로 되돌림 (제목은 선택 범위 밖)
await page.keyboard.press(`${mod}+A`);
await frame.locator(".se-align-center-toolbar-button").first().click().catch(() => {});
await frame.locator(".se-toolbar-option-align-left-button").first().click().catch(() => console.warn("정렬 변경 실패: 수동으로 왼쪽 정렬하세요"));

// 소제목(##)은 버티컬라인 인용구(인용구 2), 그 외 요약 인용구(>)는 기본 인용구(인용구 1)로 구분
if (quoteHeadings) {
  const heads = [...md.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
  const nq = await frame.locator(".se-component.se-quotation").count();
  for (let i = 0; i < nq; i++) {
    const q = frame.locator(".se-component.se-quotation").nth(i);
    const txt = (await q.innerText()).trim();
    await q.scrollIntoViewIfNeeded();
    await q.locator(".se-text-paragraph").first().click();
    await page.waitForTimeout(300);
    const sel = heads.includes(txt) ? ".se-quotation-quotation_line-toolbar-button" : ".se-quotation-default-toolbar-button";
    await frame.locator(sel).first().click({ timeout: 3000 }).catch(() => console.warn(`인용구 스타일 변경 실패: ${txt.slice(0, 15)}`));
  }
}

// 지도([지도: 상호]) 와 사진([사진: 설명 (파일명)]) 자리표시자를 실제 요소로 교체
await insertMaps(page, frame, md);
if (photosDir) await insertPhotos(page, frame, md, path.resolve(photosDir));

console.log(`제목/본문 입력 완료: "${title}"\n카테고리·태그·남은 자리표시자 확인 후 직접 발행하세요. (창을 닫으면 종료)`);
await new Promise((r) => page.on("close", r));
await browser.close();  // CDP 연결만 해제 (크롬은 유지)
