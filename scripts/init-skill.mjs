#!/usr/bin/env node
// 내 블로그용 Claude Code 스킬(.claude/skills/naver-blog/SKILL.md)을 템플릿에서 생성한다.
// 블로그 프로필·문체·카테고리는 .env 값으로 채워지고, 생성된 SKILL.md 는 자유롭게 수정할 수 있다.
//
// 사용: pnpm init-skill [--with coupang,myrealtrip] [--force]
//   skill/SKILL.template.md 의 {{VAR}} 를 .env(또는 환경변수)로 치환한다.
//   --with  : skill/optional/<이름>.md 규칙(제휴 글 등)을 뒤에 덧붙인다.
//   --force : 이미 있는 SKILL.md 를 덮어쓴다.
import fs from "node:fs";
import path from "node:path";
import { ROOT, BLOG_ID } from "./lib/common.mjs";

const args = process.argv.slice(2);
const force = args.includes("--force");
const withIdx = args.indexOf("--with");
const modules = withIdx >= 0 ? (args[withIdx + 1] || "").split(",").map((s) => s.trim()).filter(Boolean) : [];

const TODO = "<<여기에 입력: .env 의 해당 값을 채우거나 이 파일을 직접 수정>>";
const vars = {
  BLOG_ID: BLOG_ID || TODO,
  BLOG_NAME: process.env.BLOG_NAME || TODO,
  BLOG_TAGLINE: process.env.BLOG_TAGLINE || TODO,
  BLOG_PROFILE: process.env.BLOG_PROFILE || TODO,
  BLOG_CATEGORIES: process.env.BLOG_CATEGORIES || TODO,
  BLOG_TITLE_PATTERN: process.env.BLOG_TITLE_PATTERN || "지역 + 키워드 + 상호명 (+ 내돈내산 솔직 후기)",
  BLOG_TONE: process.env.BLOG_TONE || "개인 경험 글은 평어체(~했다/~다) 1인칭, 정보 글은 합니다/해요체",
};

let out = fs.readFileSync(path.join(ROOT, "skill/SKILL.template.md"), "utf8");
for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{{${k}}}`, v);

for (const m of modules) {
  const p = path.join(ROOT, "skill/optional", `${m}.md`);
  if (!fs.existsSync(p)) { console.error(`없는 모듈: ${m} (skill/optional/ 참고)`); process.exit(1); }
  out += "\n" + fs.readFileSync(p, "utf8").replaceAll("{{BLOG_ID}}", vars.BLOG_ID);
}

const dst = path.join(ROOT, ".claude/skills/naver-blog/SKILL.md");
if (fs.existsSync(dst) && !force) { console.error(`이미 존재: ${dst}\n덮어쓰려면 --force`); process.exit(1); }
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, out);
fs.mkdirSync(path.join(ROOT, "posts"), { recursive: true });

console.log(`생성: ${path.relative(ROOT, dst)}`);
if (out.includes("<<여기에 입력")) console.log("※ <<여기에 입력>> 으로 남은 항목이 있습니다. .env 를 채운 뒤 --force 로 다시 생성하거나 직접 수정하세요.");
console.log("다음: Claude Code 에서 /naver-blog <주제> 로 글 작성");
