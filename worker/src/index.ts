// [Define404] 부킹냥 (booking-meo): 한국 소상공인용 AI 상담 챗봇
// 카카오톡 채널 · 네이버 톡톡 · 홈페이지 위젯이 같은 답변 엔진을 쓴다.
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import kakao from "./channels/kakao";
import naver from "./channels/naver";
import web from "./channels/web";

export { Session, Usage } from "./core/session";
export { Inbox } from "./core/inbox";
import { inboxStub } from "./core/inbox";

const app = new Hono<{ Bindings: Env }>();

// 접속자(또는 채널 사용자)별 요청 제한
app.use("/api/*", limit);
app.use("/kakao/*", limit);
app.use("/naver/*", limit);

async function limit(c: any, next: () => Promise<void>) {
  if (c.env.LIMITER) {
    const key = c.req.header("CF-Connecting-IP") || "unknown";
    const { success } = await c.env.LIMITER.limit({ key });
    if (!success) return c.json({ error: "요청이 많습니다. 잠시 후 다시 시도해 주세요" }, 429);
  }
  await next();
}

// 브라우저 요청은 등록한 홈페이지에서 온 것만 받는다 (다른 사이트가 위젯을 가져다 AI 할당량을 쓰지 못하게)
app.use("/api/*", async (c, next) => {
  const origin = c.req.header("Origin");
  const allowed = (c.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (origin && allowed.length && !allowed.includes(origin) && c.req.method !== "OPTIONS") {
    return c.json({ error: "origin not allowed" }, 403);
  }
  await next();
});

app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const allowed = (c.env.ALLOWED_ORIGINS || "").split(",").map((s: string) => s.trim()).filter(Boolean);
      if (allowed.length === 0) return origin || "*";
      return allowed.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/health", (c) => c.json({ ok: true, store: c.env.STORE_NAME }));

// 문의함 조회 (사장님 전용). Authorization: Bearer <ADMIN_KEY>
async function adminOnly(c: any, next: () => Promise<void>) {
  const key = c.env.ADMIN_KEY;
  const got = (c.req.header("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!key || got.length !== key.length || !timingSafeEqual(got, key)) return c.json({ error: "unauthorized" }, 401);
  await next();
}
function timingSafeEqual(a: string, b: string) {
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
app.use("/admin/*", adminOnly);
app.get("/admin/inquiries", async (c) => c.json({ items: await inboxStub(c.env).list() }));
app.delete("/admin/inquiries/:id", async (c) =>
  (await inboxStub(c.env).remove(c.req.param("id"))) ? c.json({ ok: true }) : c.json({ error: "not found" }, 404),
);
app.route("/api", web);
app.route("/kakao", kakao);
app.route("/naver", naver);

app.notFound((c) => c.json({ error: "not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "잠시 후 다시 시도해 주세요" }, 500);
});

export default app;
