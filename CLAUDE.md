# naver-blog-writing-automation

네이버 블로그 글 작성 도구. **작성과 에디터 입력까지만 하고, 발행(발행 버튼 클릭)은 사용자가 직접 한다. 발행 자동화 금지.**

- 처음 설정: `.env.example` → `.env` (NAVER_BLOG_ID 등) → `pnpm install` → `pnpm init-skill` (내 블로그 스킬 생성, `--with coupang,myrealtrip` 선택)
- 글 작성: `/naver-blog <주제>` (스킬: `.claude/skills/naver-blog/SKILL.md` — `pnpm init-skill` 로 생성, 내 블로그에 맞게 수정)
- 글 저장: `posts/YYYY-MM-DD-<slug>.md` (git 제외)
- 에디터 입력: `pnpm chrome` (디버깅 크롬, 최초 1회 직접 로그인) → `pnpm fill posts/<파일>.md [--photos <사진폴더>]`
- 이미 열린 에디터에 사진·지도만: `pnpm media posts/<파일>.md --photos <사진폴더>`
- 클립보드만: `python3 -I scripts/copy_html.py posts/<파일>.md` → 에디터에 붙여넣기 (macOS)
- 키워드 조사(선택): `pnpm keywords "키워드1" "키워드2"`
- `.env`, `.chrome-profile/`(로그인 세션), `posts/` 는 절대 커밋하지 않는다.
