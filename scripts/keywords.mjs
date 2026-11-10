#!/usr/bin/env node
// 네이버 검색광고 키워드도구로 월간 검색수/경쟁도 조회.
// 사용: pnpm keywords "홍대 샌드위치 후기" "홍대 샌드위치 가격" ...   (최대 5개 시드)
// 필요(선택 기능): .env 에 NAVER_AD_CUSTOMER_ID, NAVER_AD_ACCESS_KEY, NAVER_AD_SECRET_KEY (.env.example 참고)
import { createHmac } from "node:crypto";
import "./lib/common.mjs"; // .env 로드

const { NAVER_AD_CUSTOMER_ID: cid, NAVER_AD_ACCESS_KEY: key, NAVER_AD_SECRET_KEY: secret } = process.env;
const seeds = process.argv.slice(2).map((s) => s.replace(/\s+/g, "")).slice(0, 5); // 도구는 공백 없는 키워드 기준
if (!cid || !key || !secret) { console.error("API 키 없음: .env 에 NAVER_AD_CUSTOMER_ID / NAVER_AD_ACCESS_KEY / NAVER_AD_SECRET_KEY 설정 (README 참고)"); process.exit(1); }
if (!seeds.length) { console.error('usage: pnpm keywords "키워드1" "키워드2"'); process.exit(1); }

const uri = "/keywordstool", ts = String(Date.now());
const sig = createHmac("sha256", secret).update(`${ts}.GET.${uri}`).digest("base64");
const url = `https://api.searchad.naver.com${uri}?hintKeywords=${encodeURIComponent(seeds.join(","))}&showDetail=1`;
const res = await fetch(url, { headers: { "X-Timestamp": ts, "X-API-KEY": key, "X-Customer": cid, "X-Signature": sig } });
if (!res.ok) { console.error(res.status, await res.text()); process.exit(1); }
const { keywordList = [] } = await res.json();
const n = (v) => (typeof v === "number" ? v : 5); // "< 10" 은 문자열로 옴 → 대략 5 처리
const rows = keywordList
  .map((k) => {
    // 응답 필드명이 monthly*QcCnt 로 바뀌었다 (예전 monthly*Qty 도 호환)
    const pc = k.monthlyPcQcCnt ?? k.monthlyPcQty, mo = k.monthlyMobileQcCnt ?? k.monthlyMobileQty;
    return { 키워드: k.relKeyword, 월검색수: n(pc) + n(mo), 모바일: mo, PC: pc, 경쟁: k.compIdx };
  })
  .sort((a, b) => b.월검색수 - a.월검색수)
  .slice(0, 30);
console.table(rows);
