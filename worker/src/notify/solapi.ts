// 솔라피 메시지 발송. 알림톡 설정이 있으면 알림톡, 실패하면 솔라피가 문자로 대체 발송한다.
// 문서: https://developers.solapi.com
import type { Env } from "../env";

async function authHeader(key: string, secret: string): Promise<string> {
  const date = new Date().toISOString();
  const salt = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(date + salt));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `HMAC-SHA256 apiKey=${key}, date=${date}, salt=${salt}, signature=${hex}`;
}

export function solapiReady(env: Env): boolean {
  return Boolean(env.SOLAPI_API_KEY && env.SOLAPI_API_SECRET && env.SOLAPI_SENDER && env.OWNER_PHONE);
}

export async function sendOwnerMessage(env: Env, text: string, variables: Record<string, string>): Promise<void> {
  if (!solapiReady(env)) return;
  const message: Record<string, unknown> = {
    to: env.OWNER_PHONE!.replace(/\D/g, ""),
    from: env.SOLAPI_SENDER!.replace(/\D/g, ""),
    text, // 문자 대체 발송 때 쓰이는 본문
  };
  if (env.SOLAPI_PFID && env.SOLAPI_TEMPLATE_ID) {
    message.kakaoOptions = {
      pfId: env.SOLAPI_PFID,
      templateId: env.SOLAPI_TEMPLATE_ID,
      variables,
      disableSms: false, // 알림톡 실패 시 문자로 보낸다
    };
  }
  const res = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: {
      Authorization: await authHeader(env.SOLAPI_API_KEY!, env.SOLAPI_API_SECRET!),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`solapi ${res.status} ${(await res.text()).slice(0, 200)}`);
}
