#!/usr/bin/env python3
"""Markdown(간단) -> 네이버 스마트에디터용 스타일 HTML 변환 후 macOS 클립보드에 리치텍스트로 복사.
사용: python3 -I copy_html.py <post.md> [--quote-headings]  (--quote-headings: ## 소제목을 버티컬라인 인용구용 blockquote로)

지원 문법
  ## 소제목        -> 24px 굵게 (앞에 구분선)
  ### 소소제목     -> 19px 굵게
  **굵게**         -> 굵게
  ==형광펜==       -> 노란 형광펜 강조
  > 인용           -> 네이버 인용구 컴포넌트
  - 목록           -> 글머리 목록
  ---              -> 구분선
  #태그1 #태그2    -> 해시태그 줄(11px, 글 맨 마지막)
  [텍스트](https://..) -> 링크
  [사진: ..] / [영상: ..] / [링크: ..] / [지도: 상호] -> 파란 배경 (직접 사진/영상/링크 넣을 자리)
  [내 경험 추가: ..] / [확인 필요: ..] -> 빨간 배경 (직접 채울 자리)
"""
import html, re, subprocess, sys

LEFT = 'text-align:left'
GAP = f'<p style="{LEFT}"><br></p>'

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"==(.+?)==", r'<span style="background-color:#fff5b1"><b>\1</b></span>', t)
    t = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<a href="\2">\1</a>', t)
    t = re.sub(r"\[((?:사진|영상|링크|지도):[^\]]*)\]", r'<span style="background-color:#d0ebff;color:#1864ab"><b>[\1]</b></span>', t)
    t = re.sub(r"\[((?:내 경험 추가|확인 필요):[^\]]*)\]", r'<span style="background-color:#ffe3e3;color:#c92a2a"><b>[\1]</b></span>', t)
    return t

def convert(md, quote_headings=False):
    out, para, items = [], [], []
    def gap():
        if out and out[-1] != GAP and not out[-1].startswith("<hr") and "font-size:24px" not in out[-1] and "font-size:19px" not in out[-1]:
            out.append(GAP)
    def flush_p():
        if para:
            gap(); out.append(f'<p style="{LEFT}">' + "<br>".join(inline(x) for x in para) + "</p>"); para.clear()
    def flush_l():
        if items:
            gap(); out.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in items) + "</ul>"); items.clear()
    for line in md.splitlines():
        s = line.rstrip()
        if not s.strip(): flush_p(); flush_l(); continue
        if s.startswith("---"): flush_p(); flush_l(); out.append("<hr>"); continue
        if re.fullmatch(r"(#[^\s#]+\s*)+", s.strip()):
            flush_p(); flush_l(); gap(); out.append(f'<p style="{LEFT}"><span style="font-size:11px">{html.escape(s.strip(), quote=False)}</span></p>'); continue
        m = re.match(r"^(#{2,3})\s+(.*)", s)
        if m:
            flush_p(); flush_l()
            size = 24 if len(m.group(1)) == 2 else 19
            if size == 24 and out and out[-1] != "<hr>": out.append("<hr>")
            if quote_headings and size == 24:
                out.append(f'<blockquote><b style="font-size:24px">{inline(m.group(2))}</b></blockquote>')
                continue
            out.append(f'<p style="{LEFT}"><b style="font-size:{size}px">{inline(m.group(2))}</b></p>')
            out.append(GAP)
            continue
        if re.match(r"^[-*]\s+", s): flush_p(); items.append(re.sub(r"^[-*]\s+", "", s)); continue
        if s.startswith(">"): flush_p(); flush_l(); gap(); out.append(f"<blockquote>{inline(s.lstrip('> '))}</blockquote>"); continue
        flush_l(); para.append(s)
    flush_p(); flush_l()
    return "\n".join(out)

def main():
    qh = "--quote-headings" in sys.argv
    src = open([a for a in sys.argv[1:] if not a.startswith("--")][0], encoding="utf-8").read()
    src = re.sub(r"\A---\n.*?\n---\n", "", src, flags=re.S)  # frontmatter 제거
    src = re.sub(r"\A\s*# .*\n", "", src)  # 제목 줄은 에디터 제목란에 직접 입력
    doc = f'<meta charset="utf-8">{convert(src, qh)}'
    subprocess.run(["osascript", "-e", f"set the clipboard to «data HTML{doc.encode('utf-8').hex()}»"], check=True)
    print("클립보드에 복사됨 (리치텍스트). 네이버 에디터 본문에 Cmd+V")

if __name__ == "__main__":
    main()
