// 모든 채널이 함께 쓰는 답변 엔진.
// 채널 어댑터는 손님 메시지를 넘기고, 돌려받은 Reply 를 자기 형식으로 바꿔 보낸다.
// 손님 언어는 메시지마다 다시 판별하고, 확실하지 않으면 대화의 이전 언어를 유지한다.
import type { Channel, Env, Inquiry, Reply } from "../env";
import { notifyInquiry } from "../notify";
import { generate } from "./llm";
import { isAgree, isCancel, isInquiryTrigger, t, trackLang, type Lang } from "./lang";
import { isBookingIntent } from "./prompt";
import { sessionStub, type SessionData } from "./session";
import { inboxStub } from "./inbox";

function fresh(channel: Channel, userId: string): SessionData {
  return { channel, userId, startedAt: Date.now(), messages: [], inquiry: null, submitted: [] };
}

export async function handleMessage(env: Env, channel: Channel, userId: string, text: string, hint?: Lang): Promise<Reply> {
  const input = text.trim().slice(0, 1000);
  const stub = sessionStub(env, channel, userId);
  const data = (await stub.load()) ?? fresh(channel, userId);

  // 문의 남기기 중에는 이름·번호처럼 언어를 판별할 수 없는 답이 많아서 언어를 바꾸지 않는다
  const lang = data.inquiry ? (data.lang ?? hint ?? "ko") : trackLang(data.lang ?? hint, input);
  data.lang = lang;

  if (data.inquiry) {
    const reply = await inquiryStep(env, data, input, lang);
    await stub.save(data);
    return reply;
  }

  // 대화형 문의 시작 (웹은 화면 양식을 쓰므로 제외)
  if (channel !== "web" && isInquiryTrigger(input)) {
    data.inquiry = { step: "name", draft: {} };
    data.messages.push({ role: "user", content: input });
    const text = t(lang, "inqStart");
    data.messages.push({ role: "assistant", content: text });
    await stub.save(data);
    return { text, lang };
  }

  data.messages.push({ role: "user", content: input });

  let answer: string;
  const allowed = await env.USAGE.get(env.USAGE.idFromName("global")).hit(Number(env.DAILY_AI_LIMIT) || 300);
  if (!allowed) {
    answer = t(lang, "limit");
  } else {
    try {
      answer = (await generate(env, data.messages.slice(-20), lang)) || t(lang, "empty");
    } catch (e) {
      console.error("generate failed", e);
      answer = t(lang, "error");
    }
  }
  data.messages.push({ role: "assistant", content: answer });
  await stub.save(data);

  const reply: Reply = { text: answer, lang };
  if (env.BOOKING_URL && isBookingIntent(input)) {
    reply.buttons = [{ label: t(lang, "booking"), url: env.BOOKING_URL }];
  }
  if (channel !== "web") reply.quickReplies = [t(lang, "inquiry")];
  return reply;
}

async function inquiryStep(env: Env, data: SessionData, input: string, lang: Lang): Promise<Reply> {
  const q = data.inquiry!;
  data.messages.push({ role: "user", content: input });
  const say = (text: string, quickReplies?: string[]): Reply => {
    data.messages.push({ role: "assistant", content: text });
    return { text, quickReplies, lang };
  };
  const consentButtons = [t(lang, "agree"), t(lang, "cancel")];

  if (isCancel(input)) {
    data.inquiry = null;
    return say(t(lang, "cancelled"));
  }

  switch (q.step) {
    case "name":
      q.draft.name = input.slice(0, 50);
      q.step = "contact";
      return say(t(lang, "inqContact"));
    case "contact":
      q.draft.contact = input.slice(0, 100);
      q.step = "message";
      return say(t(lang, "inqMessage"));
    case "message":
      q.draft.message = input.slice(0, 2000);
      q.step = "consent";
      return say(t(lang, "consent"), consentButtons);
    case "consent":
      if (!isAgree(input)) return say(t(lang, "consent"), consentButtons);
      await submitInquiry(env, data, q.draft as Inquiry);
      data.inquiry = null;
      return say(t(lang, "received"));
  }
}

export async function submitInquiry(env: Env, data: SessionData, inquiry: Inquiry): Promise<void> {
  (data.submitted ??= []).push(inquiry);
  try {
    await inboxStub(env).add(inquiry, data.channel, data.lang ?? "ko");
  } catch (e) {
    console.error("inbox failed", e);
  }
  try {
    await notifyInquiry(env, inquiry, data.channel, data.lang);
  } catch (e) {
    console.error("notify failed", e);
  }
}

// 웹 위젯 양식으로 들어온 문의
export async function handleWebInquiry(env: Env, userId: string, inquiry: Inquiry, lang?: Lang): Promise<void> {
  const stub = sessionStub(env, "web", userId);
  const data = (await stub.load()) ?? fresh("web", userId);
  if (lang && !data.lang) data.lang = lang;
  await submitInquiry(env, data, inquiry);
  await stub.save(data);
}
