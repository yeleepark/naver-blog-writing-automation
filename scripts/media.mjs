#!/usr/bin/env node
// 이미 열려 있는 글쓰기 탭에서 사진(+사진 설명)·지도 자리표시자를 실제 요소로 바꾼다.
// 사용: pnpm media posts/<파일>.md [--photos <사진폴더>] [--title <에디터 제목 일부>]
//   --title 을 생략하면 md 첫 줄 '# 제목' 과 같은 제목의 탭을 찾는다. (에디터에서 제목을 바꿨다면 --title 로 지정)
import { readFileSync } from "node:fs";
import path from "node:path";
import { connect, findEditor } from "./lib/common.mjs";
import { insertMaps, insertPhotos } from "./lib/media.mjs";

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const file = args.find((a, i) => !a.startsWith("--") && !["--photos", "--title"].includes(args[i - 1]));
if (!file) { console.error("usage: pnpm media posts/<file>.md [--photos <dir>] [--title <hint>]"); process.exit(1); }

const md = readFileSync(file, "utf8");
const hint = opt("--title") ?? (md.match(/^\s*#\s+(.+)$/m) || [])[1]?.trim();

let browser;
try { browser = await connect(); } catch (e) { console.error(e.message); process.exit(1); }
const editor = await findEditor(browser, hint);
if (!editor) { console.error(`제목에 "${hint}" 가 포함된 글쓰기 탭을 찾지 못함. --title 로 에디터 제목 일부를 지정하세요.`); process.exit(1); }

await editor.page.bringToFront();
await insertMaps(editor.page, editor.frame, md);
const photos = opt("--photos");
if (photos) await insertPhotos(editor.page, editor.frame, md, path.resolve(photos));
console.log("완료. 발행은 직접 하세요.");
await browser.close();
