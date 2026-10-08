// 사장님 메일 보내기. 설정에 따라 고른다.
// 1) GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET + GMAIL_REFRESH_TOKEN 이 있으면 Gmail API (Google Workspace 메일)
// 2) 아니면 RESEND_API_KEY 가 있으면 Resend
// 3) 둘 다 없으면 보내지 않고 기록만 남긴다
import type { Env } from "../env";
import { base64url, buildMime } from "./mime";

export type MailMessage = { subject: string; text: string; html?: string; headers?: Record<string, string>; replyTo?: string };

export function mailProvider(env: Env): "gmail" | "resend" | "log" {
  if (env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN) return "gmail";
  if (env.RESEND_API_KEY) return "resend";
  return "log";
}

export async function sendMail(env: Env, m: MailMessage): Promise<void> {
  const provider = mailProvider(env);
  if (!env.OWNER_EMAIL || provider === "log") {
    console.log("mail skipped (메일 설정 또는 OWNER_EMAIL 없음)", m.subject);
    return;
  }
  if (provider === "gmail") return sendGmail(env, m);
  return sendResend(env, m);
}

async function sendResend(env: Env, m: MailMessage): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: env.OWNER_EMAIL,
      subject: m.subject,
      text: m.text,
      ...(m.html ? { html: m.html } : {}),
      ...(m.replyTo ? { reply_to: m.replyTo } : {}),
      ...(m.headers ? { headers: m.headers } : {}),
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status} ${(await res.text()).slice(0, 200)}`);
}

// 접근 토큰은 만료 1분 전까지 이 워커 안에서 다시 쓴다
let cached: { token: string; exp: number; client: string } | null = null;

async function gmailToken(env: Env): Promise<string> {
  if (cached && cached.client === env.GMAIL_CLIENT_ID && cached.exp > Date.now() + 60_000) return cached.token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: env.GMAIL_CLIENT_ID!,
      client_secret: env.GMAIL_CLIENT_SECRET!,
      refresh_token: env.GMAIL_REFRESH_TOKEN!,
    }),
  });
  if (!res.ok) throw new Error(`gmail token ${res.status} ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as { access_token: string; expires_in?: number };
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000, client: env.GMAIL_CLIENT_ID! };
  return j.access_token;
}

async function sendGmail(env: Env, m: MailMessage): Promise<void> {
  const raw = buildMime({
    from: env.MAIL_FROM,
    to: env.OWNER_EMAIL!,
    subject: m.subject,
    text: m.text,
    html: m.html,
    replyTo: m.replyTo,
    headers: m.headers,
  });
  const send = async (token: string) =>
    fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: base64url(raw) }),
    });
  let res = await send(await gmailToken(env));
  if (res.status === 401) {
    cached = null; // 토큰이 먼저 만료된 경우 한 번만 다시 받는다
    res = await send(await gmailToken(env));
  }
  if (!res.ok) throw new Error(`gmail ${res.status} ${(await res.text()).slice(0, 200)}`);
}
