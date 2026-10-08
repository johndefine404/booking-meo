// 홈페이지·블로그 위젯 어댑터
import { Hono } from "hono";
import type { Env } from "../env";
import { handleMessage, handleWebInquiry } from "../core/chat";
import { LANG_NAME, type Lang } from "../core/lang";

// 위젯이 브라우저 언어를 첫 힌트로 보낸다. 실제 언어는 손님이 쓴 글로 다시 판별한다
const hintLang = (v: unknown): Lang | undefined => (typeof v === "string" && v in LANG_NAME ? (v as Lang) : undefined);

const web = new Hono<{ Bindings: Env }>();
const SESSION_ID = /^[a-zA-Z0-9-]{16,64}$/;

web.post("/chat", async (c) => {
  const b = (await c.req.json().catch(() => null)) as { sessionId?: string; message?: string; lang?: string } | null;
  const message = String(b?.message ?? "").trim();
  if (!b?.sessionId || !SESSION_ID.test(b.sessionId) || !message) return c.json({ error: "잘못된 요청입니다" }, 400);
  const reply = await handleMessage(c.env, "web", b.sessionId, message, hintLang(b.lang));
  return c.json(reply);
});

web.post("/inquiry", async (c) => {
  const b = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b || typeof b !== "object") return c.json({ error: "잘못된 요청입니다" }, 400);
  if (b.website) return c.json({ ok: true }); // 봇이 채우는 숨은 칸
  const sessionId = String(b.sessionId ?? "");
  const name = String(b.name ?? "").trim().slice(0, 50);
  const contact = String(b.contact ?? "").trim().slice(0, 100);
  const message = String(b.message ?? "").trim().slice(0, 2000);
  if (!SESSION_ID.test(sessionId) || !name || !contact || !message) {
    return c.json({ error: "이름, 연락처, 내용을 모두 적어 주세요" }, 400);
  }
  if (b.consent !== true) return c.json({ error: "개인정보 수집·이용에 동의해 주세요" }, 400);
  await handleWebInquiry(c.env, sessionId, { name, contact, message }, hintLang(b.lang));
  return c.json({ ok: true });
});

web.get("/config", (c) =>
  c.json({ storeName: c.env.STORE_NAME, booking: Boolean(c.env.BOOKING_URL), bookingUrl: c.env.BOOKING_URL || null }),
);

export default web;
