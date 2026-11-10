// 에디터에 사진(+사진 설명)과 지도를 넣는 헬퍼.
// 글(md)에 아래 자리표시자를 "단독 문단"으로 써 두면 해당 위치에 실제 사진/지도로 바꿔 넣는다.
//   [사진: 사진 설명 (파일명)]            파일명은 확장자 생략 가능, 여러 장은 (a, b)
//   [지도: 상호 또는 검색어]
// 주의: 네이버 스마트에디터 ONE 의 DOM 셀렉터에 의존하므로 에디터 개편 시 깨질 수 있다.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { sleep } from "./common.mjs";

const SETTLE_MS = Number(process.env.UPLOAD_SETTLE_MS || 4000);
const norm = (s) => s.replace(/\s+/g, " ").trim();

export function parsePhotoTags(md) {
  return [...md.matchAll(/\[사진:\s*([^\]]*?)\s*\(([^()\]]+)\)\]/g)].map((m) => ({
    tag: m[0],
    desc: m[1].trim(),
    names: m[2].split(",").map((s) => s.trim()).filter(Boolean),
  }));
}

export function parseMapTags(md) {
  return [...md.matchAll(/\[지도:\s*([^\]]+?)\s*\]/g)].map((m) => ({ tag: m[0], query: m[1].trim() }));
}

function resolveFile(dir, name) {
  const direct = path.join(dir, name);
  if (path.extname(name) && fs.existsSync(direct)) return direct;
  const base = path.basename(name, path.extname(name)).toLowerCase();
  const hit = fs.readdirSync(dir).find((f) => path.basename(f, path.extname(f)).toLowerCase() === base);
  if (!hit) throw new Error(`사진 파일을 찾지 못함: ${name} (폴더: ${dir})`);
  return path.join(dir, hit);
}

// HEIC/HEIF 는 에디터 업로드 호환을 위해 JPEG 로 변환 (macOS sips 사용)
function prepare(file) {
  if (!/\.(heic|heif)$/i.test(file)) return file;
  if (process.platform !== "darwin") throw new Error(`HEIC 변환은 macOS 에서만 지원됩니다. JPEG/PNG 로 변환해 주세요: ${file}`);
  const outDir = path.join(os.tmpdir(), "naver-blog-media");
  fs.mkdirSync(outDir, { recursive: true });
  const dst = path.join(outDir, path.basename(file, path.extname(file)) + ".jpg");
  execFileSync("sips", ["-s", "format", "jpeg", "-Z", "2000", file, "--out", dst], { stdio: "ignore" });
  return dst;
}

const imageIds = (frame) =>
  frame.locator(".se-component.se-image .se-module-image").evaluateAll((els) => els.map((e) => e.id));

async function waitUntil(fn, timeoutMs) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) { if (await fn()) return true; await sleep(500); }
  return false;
}

async function placeholderParagraph(frame, tag, key) {
  const para = frame.locator(".se-text-paragraph", { hasText: key }).first();
  if (!(await para.count())) { console.warn(`자리표시자 없음(이미 삽입됐을 수 있음): ${tag}`); return null; }
  if (norm(await para.innerText()) !== norm(tag)) {
    console.warn(`건너뜀: 자리표시자가 다른 글과 같은 문단에 있습니다. 단독 문단으로 써 주세요 → ${tag}`);
    return null;
  }
  await para.scrollIntoViewIfNeeded();
  await para.click({ clickCount: 3 });
  await para.page().keyboard.press("Backspace");
  return para;
}

async function setCaption(page, frame, id, text) {
  const comp = frame.locator(".se-component.se-image").filter({ has: frame.locator(`[id="${id}"]`) });
  await comp.scrollIntoViewIfNeeded();
  for (let attempt = 0; attempt < 2; attempt++) {
    await comp.locator("img.se-image-resource").click();   // 사진을 먼저 선택해야 설명 칸이 활성화됨
    await sleep(800);
    await comp.locator(".se-caption .se-text-paragraph").first().click({ timeout: 5000 });
    await sleep(500);
    await page.keyboard.type(text, { delay: 20 });
    await sleep(600);
    const now = ((await comp.locator(".se-caption .se-text-paragraph").first().textContent()) || "").trim();
    if (now.includes(text.slice(0, 5))) return true;
  }
  console.warn(`사진 설명 입력 실패: ${text}`);
  return false;
}

export async function insertPhotos(page, frame, md, dir) {
  for (const { tag, desc, names } of parsePhotoTags(md)) {
    const files = names.map((n) => prepare(resolveFile(dir, n)));
    const para = await placeholderParagraph(frame, tag, `(${names[0]}`);
    if (!para) continue;
    const before = await imageIds(frame);
    const [chooser] = await Promise.all([
      page.waitForEvent("filechooser", { timeout: 10000 }),
      frame.locator(".se-image-toolbar-button").first().click(),
    ]);
    await chooser.setFiles(files);
    const ok = await waitUntil(async () => (await imageIds(frame)).length >= before.length + files.length, 60000);
    if (!ok) console.warn(`업로드 확인 시간 초과: ${tag}`);
    await sleep(SETTLE_MS);
    const added = (await imageIds(frame)).filter((id) => !before.includes(id));
    for (const id of added) await setCaption(page, frame, id, desc);
    console.log(`사진 삽입: ${names.join(", ")} (${added.length}장, 설명: ${desc})`);
  }
}

export async function insertMaps(page, frame, md) {
  for (const { tag, query } of parseMapTags(md)) {
    const para = await placeholderParagraph(frame, tag, `[지도: ${query}`);
    if (!para) continue;
    await frame.locator(".se-map-toolbar-button").first().click();
    await sleep(2000);
    const input = frame.locator("input.react-autosuggest__input");
    await input.click();
    await input.fill(query);
    await page.keyboard.press("Enter");
    await sleep(2500);
    const item = frame.locator(".se-place-map-search-result-item").first();
    if (!(await item.count())) {
      console.warn(`지도 검색 결과 없음: ${query} (자리표시자는 지워졌으니 직접 '장소'로 추가하세요)`);
      await frame.locator(".se-popup-close-button").first().click().catch(() => {});
      continue;
    }
    const picked = (await item.innerText()).replace(/\n+/g, " / ");
    await item.click();
    await sleep(1200);
    await frame.locator(".se-place-add-button").first().click();
    await sleep(800);
    await frame.locator(".se-popup-button-confirm").first().click();
    await sleep(3000);
    console.log(`지도 삽입: "${query}" → ${picked}  (맞는 장소인지 확인하세요)`);
  }
}
