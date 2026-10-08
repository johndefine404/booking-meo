import type { Channel, Env, Inquiry } from "../env";
import type { SessionData } from "../core/session";
import type { Lang } from "../core/lang";
import { sendOwnerMessage } from "./solapi";
import { sendMail } from "./mail";

const CHANNEL_NAME: Record<Channel, string> = { web: "홈페이지", kakao: "카카오톡", naver: "네이버 톡톡" };

const LANG_KO: Record<Lang, string> = { ko: "한국어", en: "영어", vi: "베트남어", ja: "일본어", zh: "중국어", th: "태국어" };

// 새 문의: 사장님 휴대폰(알림톡, 실패 시 문자) + 메일
export async function notifyInquiry(env: Env, q: Inquiry, channel: Channel, lang: Lang = "ko"): Promise<void> {
  const ch = lang === "ko" ? CHANNEL_NAME[channel] : `${CHANNEL_NAME[channel]}, 손님 언어 ${LANG_KO[lang]}`;
  const text = `[${env.STORE_NAME}] 새 문의 (${ch})\n이름: ${q.name}\n연락처: ${q.contact}\n내용: ${q.message}`;
  const jobs: Promise<unknown>[] = [
    sendOwnerMessage(env, text, {
      "#{가게}": env.STORE_NAME,
      "#{채널}": ch,
      "#{이름}": q.name,
      "#{연락처}": q.contact,
      "#{내용}": q.message.slice(0, 500),
    }),
    sendMail(env, { subject: `[${env.STORE_NAME}] 새 문의: ${q.name} (${ch})`, text }),
  ];
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("notify", r.reason);
}

// 대화가 끝나면 전체 기록을 사장님 메일로 보낸다 (서버에는 남기지 않는다)
export async function sendTranscript(env: Env, d: SessionData): Promise<void> {
  const when = new Date(d.startedAt + 9 * 3600_000).toISOString().slice(0, 16).replace("T", " ");
  const lines = d.messages.map((m) => `${m.role === "user" ? "손님" : "부킹냥"}: ${m.content}`);
  const inquiries = (d.submitted ?? []).map((q) => `- ${q.name} / ${q.contact} / ${q.message}`);
  const body = [
    `${CHANNEL_NAME[d.channel]} 상담 기록`,
    `시작: ${when} (한국 시간)`,
    ...(d.lang && d.lang !== "ko" ? [`손님 언어: ${LANG_KO[d.lang]}`] : []),
    "",
    ...(inquiries.length ? ["[접수된 문의]", ...inquiries, ""] : []),
    "[대화]",
    ...lines,
    "",
    "이 기록은 메일로만 보내고 챗봇 서버에서는 지웠습니다.",
  ].join("\n");
  await sendMail(env, { subject: `[${env.STORE_NAME}] ${CHANNEL_NAME[d.channel]} 상담 기록 ${when}`, text: body });
}
