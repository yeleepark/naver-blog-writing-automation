# naver-blog-writing-automation — 네이버 블로그 글쓰기 자동화

주제만 말하면 **블로그 글 초안을 쓰고**, 내가 로그인해 둔 크롬의 **네이버 글쓰기 화면에 제목·본문·사진·사진 설명·지도까지 채워 주는** 도구입니다.

> ⚠️ **발행 버튼은 절대 누르지 않습니다.** 마지막 확인과 발행은 항상 내가 직접 합니다.

> English: A [Claude Code](https://claude.com/claude-code) workflow that drafts Naver Blog posts as Markdown and fills them into the Naver SmartEditor ONE in your own logged-in Chrome (title, rich-text body, photos with captions, map). It never clicks "publish". Korean-language project, macOS only for now.

---

## 한눈에 보기

```
① 주제 입력            ② 초안 작성              ③ 에디터에 자동 입력           ④ 내가 마무리
Claude Code에서   →   posts/날짜-주제.md   →   pnpm fill 글.md           →   빈칸 채우기, 카테고리,
/naver-blog 주제       (마크다운 초안)           --photos 사진폴더              사진 확인 후 "발행" 클릭
                                                 제목·본문·사진·설명·지도
```

- 글 문체와 구조는 **내 블로그에 맞춘 스킬**로 정합니다. (처음 한 번 `pnpm init-skill` 로 만듭니다)
- 초안에는 내가 직접 겪은 내용을 적을 **빈칸**(`[내 경험 추가: …]`)과 확인이 필요한 곳(`[확인 필요: …]`)이 빨간 글씨로 남습니다. **경험을 대신 지어내지 않습니다.**
- 사진은 폴더만 알려주면 글 속 `[사진: 설명 (파일명)]` 자리에 올라가고, 설명(캡션)도 자동으로 입력됩니다.

---

## 준비물

- [ ] **macOS** (현재는 macOS만 지원합니다. 클립보드와 HEIC 변환에 macOS 기능을 씁니다)
- [ ] [Node.js](https://nodejs.org) 20.12 이상 · [pnpm](https://pnpm.io) · Python 3 · Google Chrome
- [ ] 네이버 블로그 계정
- [ ] [Claude Code](https://claude.com/claude-code) — 글 초안을 쓸 때 필요합니다. (직접 마크다운 글을 쓸 거라면 없어도 에디터 입력 기능은 쓸 수 있어요)

---

## 설치와 설정 (처음 한 번)

터미널에서 순서대로 실행하세요.

### 1) 내려받고 설치

```sh
git clone https://github.com/yeleepark/naver-blog-writing-automation.git
cd naver-blog-writing-automation
pnpm install
```

### 2) 내 블로그 정보 입력

```sh
cp .env.example .env
```

`.env` 파일을 열어 **`NAVER_BLOG_ID`** 를 채웁니다. (`blog.naver.com/` 뒤의 아이디)
나머지 `BLOG_NAME`, `BLOG_CATEGORIES`, `BLOG_TONE` 등은 3단계에서 만들 스킬에 들어가는 내 블로그 소개입니다. 비워 두어도 되고, 나중에 스킬 파일을 직접 고쳐도 됩니다.

```env
NAVER_BLOG_ID=내블로그아이디
BLOG_NAME=내 블로그 이름
BLOG_CATEGORIES=맛집 · 카페 · 후기
BLOG_TONE=개인 경험 글은 평어체(~했다/~다), 정보 글은 합니다체
```

### 3) 내 블로그용 스킬 만들기

```sh
pnpm init-skill
```

`.claude/skills/naver-blog/SKILL.md` 가 만들어집니다. 글쓰기 규칙(문체, 목차, 해시태그 등)이 담긴 파일이고, **내 취향대로 자유롭게 고쳐도 됩니다.**
쿠팡 파트너스나 여행 제휴 글을 쓴다면 `pnpm init-skill --with coupang,myrealtrip` 로 해당 표기 규칙을 같이 넣을 수 있어요.

### 4) 네이버 로그인용 크롬 열기

```sh
pnpm chrome
```

크롬 창이 열리면 **네이버에 직접 로그인**하세요(2단계 인증 포함). 한 번 로그인하면 이 프로그램 전용 크롬 프로필에 저장되어 다음부터는 다시 로그인하지 않아도 됩니다.
이 크롬 창은 글을 쓰는 동안 **열어 둔 채로** 두세요.

---

## 첫 글 써보기

### 1) Claude Code로 초안 쓰기

이 폴더에서 Claude Code 를 실행하고 주제를 말합니다.

```sh
claude
```

```
/naver-blog 홍대 샌드위치 맛집 후기
```

Claude 가 `posts/2026-01-01-hongdae-sandwich.md` 같은 초안 파일을 만들고 제목 후보를 알려줍니다.
어떤 모양인지 보고 싶다면 [`examples/example-post.md`](examples/example-post.md) 를 열어 보세요.

> 사진이 있다면 “사진은 `~/Pictures/hongdae` 에 있어”라고 함께 알려주세요. 글 속 알맞은 위치에 `[사진: 설명 (파일명)]` 으로 배치해 줍니다.

### 2) 네이버 글쓰기 화면에 자동 입력

```sh
pnpm fill posts/2026-01-01-hongdae-sandwich.md --photos ~/Pictures/hongdae
```

크롬에 글쓰기 화면이 새 탭으로 열리고 아래가 자동으로 채워집니다.

| 자동으로 되는 것 | 설명 |
|---|---|
| 제목 | 글 첫 줄 `# 제목` |
| 본문 | 소제목, 형광펜, 인용구, 목록, 링크, 해시태그까지 서식 그대로 |
| 사진 | `[사진: …]` 자리에 업로드 + **사진 설명** 입력 (HEIC 는 JPEG 로 자동 변환) |
| 지도 | `[지도: 상호]` 자리에 네이버 지도 삽입 (어떤 장소가 잡혔는지 터미널에 출력되니 맞는지 확인) |

> 사진이 없는 글이면 `--photos` 는 빼면 됩니다. 이 명령은 에디터 탭을 닫거나 `Ctrl+C` 를 누를 때까지 실행 상태로 남아 있어요. (크롬은 꺼지지 않습니다)

### 3) 내가 마무리하고 발행

글쓰기 화면에서:

1. 빨간 글씨 `[내 경험 추가: …]`, `[확인 필요: …]` 를 **내 경험과 확인한 사실로 채우고** 파란 `[…]` 자리표시자가 남았는지 확인
2. 카테고리 선택, 사진 대체 텍스트 확인, 지도가 맞는지 확인
3. **직접 발행**

---

## 글 문법 (마크다운)

초안은 일반 마크다운에 몇 가지 약속을 더한 형태입니다.

| 쓰는 법 | 결과 |
|---|---|
| `# 제목` (첫 줄) | 에디터 **제목** (본문에는 들어가지 않음) |
| `## 소제목` | 24px 굵은 소제목 (기본은 세로선 인용구 스타일) |
| `### 소소제목` | 19px 굵은 글씨 |
| `==강조==` | 노란 형광펜 |
| `**굵게**` | 굵게 |
| `- 항목` | 글머리 목록 |
| `> 총평: …` | 인용구 |
| `[텍스트](https://…)` | 링크 |
| `---` | 구분선 |
| `#태그1 #태그2 …` (맨 끝 단독 줄) | 11px 해시태그 줄 |
| `[사진: 설명 (파일명)]` | 파란 자리표시자 → `--photos` 가 있으면 **사진 + 설명**으로 교체 |
| `[사진: 설명 (a, b)]` | 사진 여러 장 한 번에 |
| `[지도: 상호]` | 파란 자리표시자 → **네이버 지도**로 교체 |
| `[내 경험 추가: …]` `[확인 필요: …]` | 빨간 자리표시자 (내가 채울 곳) |

**규칙 두 가지**
- `[사진: …]`, `[지도: …]` 는 **다른 글과 섞지 말고 한 줄(문단)에 단독으로** 쓰세요.
- 사진 파일명은 확장자를 빼도 됩니다. `[사진: 메뉴판 (IMG_0012)]` → 폴더 안의 `IMG_0012.HEIC`/`.jpg` 를 찾아 올립니다.

---

## 명령어

| 명령 | 하는 일 |
|---|---|
| `pnpm chrome` | 로그인용 크롬 열기 |
| `pnpm init-skill [--with coupang,myrealtrip] [--force]` | 내 블로그 스킬 만들기 (`--force`: 다시 만들기) |
| `pnpm fill <글.md> [--photos <사진폴더>]` | 새 글쓰기 탭에 제목·본문(·사진·지도) 입력 |
| `pnpm fill <글.md> --no-quote-headings` | 소제목을 인용구 스타일로 바꾸지 않음 |
| `pnpm media <글.md> --photos <사진폴더>` | **이미 열려 있는** 글쓰기 탭에 사진·지도만 입력 |
| `pnpm media <글.md> --title <제목 일부>` | 에디터에서 제목을 바꿨을 때 탭을 찾을 기준 지정 |
| `pnpm keywords "키워드" …` | 검색광고 API 로 월간 검색수 조회 (선택) |
| `python3 -I scripts/copy_html.py <글.md>` | 본문만 서식 포함으로 클립보드에 복사 → 에디터에 `Cmd+V` |

---

## 설정 (.env)

| 변수 | 필수 | 설명 |
|---|:-:|---|
| `NAVER_BLOG_ID` | ✅ | `blog.naver.com/<여기>` |
| `BLOG_NAME` `BLOG_TAGLINE` `BLOG_PROFILE` `BLOG_CATEGORIES` `BLOG_TITLE_PATTERN` `BLOG_TONE` | | `pnpm init-skill` 이 스킬의 “블로그 프로필”에 넣는 값 |
| `CHROME_DEBUG_PORT` | | 로그인용 크롬 포트 (기본 `9222`) |
| `UPLOAD_SETTLE_MS` | | 사진 업로드 후 설명 입력 전 대기(ms), 느리면 늘리기 (기본 `4000`) |
| `NAVER_AD_CUSTOMER_ID` `NAVER_AD_ACCESS_KEY` `NAVER_AD_SECRET_KEY` | | 키워드 조사용 검색광고 API 키 ([searchad.naver.com](https://searchad.naver.com) > 도구 > API 사용 관리) |

`.env` 는 `.gitignore` 에 들어 있어 깃에 올라가지 않습니다. 실수로 `git add -f` 를 해도 `.githooks/pre-commit` 이 `.env` 파일과 API 키 값이 담긴 커밋을 막습니다. (`pnpm install` 때 자동으로 켜집니다)

### 스킬을 내 것으로 바꾸기

스킬은 사람마다 다르기 때문에 이 레포에는 **템플릿(`skill/SKILL.template.md`)만** 있고, 내 스킬(`.claude/skills/naver-blog/SKILL.md`)은 내 컴퓨터에만 만들어집니다.
생성된 파일에서 블로그 소개·문체·목차 유무·한 줄 요약 사용 여부 같은 **글쓰기 규칙을 마음대로 수정**하세요. 다른 스킬을 쓰고 싶다면 대체해도 되고, 직접 쓴 마크다운(첫 줄 `# 제목`)만 있으면 `pnpm fill` 은 그대로 동작합니다.

---

## 문제 해결

| 증상 | 해결 |
|---|---|
| `디버깅 크롬(…)이 없습니다` | `pnpm chrome` 으로 크롬을 먼저 열기. 이미 열었는데도 나오면 포트가 다른지(`CHROME_DEBUG_PORT`) 확인 |
| `네이버 로그아웃 상태` | 열린 크롬에서 네이버에 다시 로그인한 뒤 다시 실행 (가끔 일시적으로 뜨면 한 번 더 실행) |
| `NAVER_BLOG_ID 가 없습니다` | `.env` 에 `NAVER_BLOG_ID=` 를 채웠는지 확인 |
| 사진 설명이 비어 있다 | 업로드가 느린 경우입니다. `.env` 의 `UPLOAD_SETTLE_MS` 를 `7000` 등으로 늘리기 |
| `건너뜀: 자리표시자가 다른 글과 같은 문단에 있습니다` | `[사진: …]`/`[지도: …]` 를 한 줄에 단독으로 쓰기 |
| 지도에 엉뚱한 장소가 들어갔다 | 터미널에 찍힌 검색 결과를 확인하고, 에디터에서 지도를 지운 뒤 **장소** 버튼으로 직접 추가. 글의 `[지도: 상호 지역]` 처럼 더 구체적으로 쓰면 정확해집니다 |
| 에디터가 안 채워지거나 버튼이 안 눌린다 | 네이버 에디터가 개편되었을 수 있습니다. [이슈](../../issues)로 알려주세요 (아래 “알아둘 점” 참고) |
| 에디터 제목을 바꾼 뒤 `pnpm media` 가 탭을 못 찾는다 | `--title "바꾼 제목의 일부"` 지정 |

---

## 폴더 구조

```
.
├─ posts/                 내 글(마크다운). 깃에 올라가지 않음
├─ examples/example-post.md   글 형식 예시
├─ skill/
│  ├─ SKILL.template.md   내 스킬을 만들 때 쓰는 템플릿
│  └─ optional/           제휴 글 규칙 등 선택 모듈
├─ scripts/
│  ├─ fill-editor.mjs     pnpm fill — 에디터 자동 입력
│  ├─ media.mjs           pnpm media — 사진·지도만 입력
│  ├─ init-skill.mjs      pnpm init-skill — 스킬 생성
│  ├─ copy_html.py        마크다운 → 에디터용 서식 변환
│  ├─ keywords.mjs        키워드 조사
│  ├─ open-chrome.sh      pnpm chrome — 로그인용 크롬
│  └─ lib/                공용 코드
├─ .env.example           설정 예시 (복사해서 .env 로 사용)
└─ .claude/skills/naver-blog/   내 스킬 (pnpm init-skill 이 생성, 깃 제외)
```

---

## 알아둘 점

- **비공식 도구**입니다. 네이버와 무관합니다. 네이버 스마트에디터 ONE 의 화면 구조(CSS 셀렉터)에 의존하므로 **에디터가 개편되면 일부 기능이 동작하지 않을 수 있습니다.** 고칠 곳은 `scripts/fill-editor.mjs`, `scripts/lib/media.mjs` 입니다. 이슈와 PR 을 환영합니다.
- **내 계정, 내 글에만** 사용하세요. 네이버 서비스 이용약관과 블로그 운영 정책을 확인하고, 대량·반복 발행에 쓰지 마세요.
- 협찬·제휴·초대코드처럼 **대가가 있으면 글에 표기**해야 합니다. AI 가 쓴 초안은 **내 경험으로 채우고 사실을 확인한 뒤** 발행하세요.
- 🔒 `.chrome-profile/` 폴더에는 **네이버 로그인 세션**이 들어 있습니다. 절대 커밋하거나 남에게 공유하지 마세요. (`.gitignore` 에 이미 포함)
- 로그인용 크롬의 디버깅 포트(기본 9222)는 내 컴퓨터(127.0.0.1)에서만 쓰세요.

## 라이선스

[MIT](LICENSE) © yelee park
