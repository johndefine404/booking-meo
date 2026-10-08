// 카카오톡 채널 어댑터 (카카오 i 오픈빌더 스킬 서버)
// 가이드: https://kakaobusiness.gitbook.io/main/tool/chatbot/skill_guide
// 오픈빌더 스킬 주소: https://<워커 주소>/kakao/<KAKAO_SKILL_KEY>
// 블록에서 콜백을 켜 두면 5초가 넘는 AI 답변도 나중에 보낼 수 있다.
import { Hono } from "hono";
import type { Env, Reply } from "../env";
import { handleMessage } from "../core/chat";
import { detectLang, t } from "../core/lang";

const kakao = new Hono<{ Bindings: Env }>();

type SkillRequest = {
  userRequest?: { utterance?: string; callbackUrl?: string; user?: { id?: string } };
};

export function toKakao(reply: Reply) {
  const outputs: unknown[] = [];
  if (reply.buttons?.length && reply.text.length <= 400) {
    outputs.push({
      textCard: {
        text: reply.text,
        buttons: reply.buttons.slice(0, 3).map((b) => ({ action: "webLink", label: b.label.slice(0, 14), webLinkUrl: b.url })),
      },
    });
  } else {
    outputs.push({ simpleText: { text: reply.text.slice(0, 1000) } });
    if (reply.buttons?.length) {
      outputs.push({
        textCard: {
          text: t(reply.lang ?? "ko", "bookingHint"),
          buttons: reply.buttons.slice(0, 3).map((b) => ({ action: "webLink", label: b.label.slice(0, 14), webLinkUrl: b.url })),
        },
      });
    }
  }
  return {
    version: "2.0",
    template: {
      outputs,
      quickReplies: (reply.quickReplies ?? []).map((q) => ({ label: q, action: "message", messageText: q })),
    },
  };
}

kakao.post("/:key", async (c) => {
  if (!c.env.KAKAO_SKILL_KEY || c.req.param("key") !== c.env.KAKAO_SKILL_KEY) return c.json({ error: "forbidden" }, 403);

  const body = (await c.req.json().catch(() => null)) as SkillRequest | null;
  const text = body?.userRequest?.utterance?.trim();
  const userId = body?.userRequest?.user?.id;
  if (!text || !userId) return c.json(toKakao({ text: t("ko", "empty") }));
  const lang = detectLang(text) ?? "ko";

  const callbackUrl = body?.userRequest?.callbackUrl;
  if (callbackUrl) {
    // 콜백: 먼저 "준비 중"으로 답하고, 답변이 나오면 콜백 주소로 보낸다 (5분 안, 1회)
    c.executionCtx.waitUntil(
      handleMessage(c.env, "kakao", userId, text)
        .catch(() => ({ text: t(lang, "error") }) as Reply)
        .then((reply) =>
          fetch(callbackUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toKakao(reply)) }),
        ),
    );
    return c.json({ version: "2.0", useCallback: true, data: { text: t(lang, "preparing") } });
  }

  // 콜백을 안 켰으면 5초 안에 답해야 한다
  const timeout = new Promise<Reply>((r) =>
    setTimeout(() => r({ text: t(lang, "late"), quickReplies: [t(lang, "inquiry")] }), 4500),
  );
  return c.json(toKakao(await Promise.race([handleMessage(c.env, "kakao", userId, text), timeout])));
});

export default kakao;
