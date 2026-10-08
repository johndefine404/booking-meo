// 네이버 톡톡 어댑터 (톡톡 챗봇 API)
// 문서: https://github.com/navertalk/chatbot-api
// 파트너센터 웹훅 주소: https://<워커 주소>/naver/<NAVER_WEBHOOK_KEY>
import { Hono } from "hono";
import type { Env, Reply } from "../env";
import { handleMessage } from "../core/chat";
import { t } from "../core/lang";

const naver = new Hono<{ Bindings: Env }>();
const SEND_API = "https://gw.talk.naver.com/chatbot/v1/event";

type TalkEvent = { event?: string; user?: string; textContent?: { text?: string } };

export function toNaver(user: string, reply: Reply) {
  const quickReply = reply.quickReplies?.length
    ? { buttonList: reply.quickReplies.map((q) => ({ type: "TEXT", data: { title: q, code: q } })) }
    : undefined;
  if (reply.buttons?.length) {
    return {
      event: "send",
      user,
      compositeContent: {
        compositeList: [
          {
            description: reply.text.slice(0, 1000),
            buttonList: reply.buttons.map((b) => ({ type: "LINK", data: { title: b.label, url: b.url, mobileUrl: b.url } })),
          },
        ],
        ...(quickReply ? { quickReply } : {}),
      },
    };
  }
  return { event: "send", user, textContent: { text: reply.text.slice(0, 1000), ...(quickReply ? { quickReply } : {}) } };
}

async function send(env: Env, payload: unknown): Promise<void> {
  const res = await fetch(SEND_API, {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=UTF-8", Authorization: env.NAVER_TALK_TOKEN! },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error("naver send", res.status, (await res.text()).slice(0, 200));
}

naver.post("/:key", async (c) => {
  if (!c.env.NAVER_WEBHOOK_KEY || c.req.param("key") !== c.env.NAVER_WEBHOOK_KEY || !c.env.NAVER_TALK_TOKEN) {
    return c.json({ error: "forbidden" }, 403);
  }
  const ev = (await c.req.json().catch(() => null)) as TalkEvent | null;
  const user = ev?.user;
  if (!user) return c.json({ ok: true });

  if (ev.event === "open") {
    c.executionCtx.waitUntil(
      send(c.env, toNaver(user, { text: t("ko", "greeting", { store: c.env.STORE_NAME }), quickReplies: [t("ko", "inquiry")] })),
    );
  } else if (ev.event === "send" && ev.textContent?.text) {
    const text = ev.textContent.text;
    c.executionCtx.waitUntil(handleMessage(c.env, "naver", user, text).then((reply) => send(c.env, toNaver(user, reply))));
  }
  return c.json({ ok: true });
});

export default naver;
