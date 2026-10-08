// 메일 한 통을 RFC 5322 형식(MIME)으로 만든다. Gmail API 처럼 원문을 그대로 받는 곳에 쓴다.
// 다른 파일을 불러오지 않는다 (단위 시험에서 바로 불러 쓰기 위해).

export type MimeMail = {
  from: string; // "부킹냥 <shop@example.com>" 또는 "shop@example.com"
  to: string;
  subject: string;
  text: string;
  html?: string; // 비우면 text 로 만든다
  replyTo?: string;
  headers?: Record<string, string>; // List-Unsubscribe 처럼 그대로 붙일 머리글
  date?: Date;
  messageId?: string;
  boundary?: string;
};

const enc = new TextEncoder();

function b64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function base64Utf8(s: string): string {
  return b64(enc.encode(s));
}

export function base64url(s: string): string {
  return base64Utf8(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// 76자마다 줄을 바꾼다 (RFC 2045)
function wrap76(s: string): string {
  return s.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

const ASCII_SAFE = /^[\x20-\x7E]*$/;

// 머리글용 글자. 한글 같은 글자가 있으면 =?UTF-8?B?...?= 로, 길면 여러 조각으로 나눈다
export function encodeWord(s: string): string {
  if (ASCII_SAFE.test(s)) return s;
  const words: string[] = [];
  let cur = "";
  for (const ch of s) {
    // 조각 하나가 75자를 넘지 않도록 원문 45바이트 안쪽에서 끊는다 (글자 중간에서 끊지 않는다)
    if (enc.encode(cur + ch).length > 45) {
      words.push(cur);
      cur = "";
    }
    cur += ch;
  }
  if (cur) words.push(cur);
  return words.map((w) => `=?UTF-8?B?${base64Utf8(w)}?=`).join("\r\n ");
}

export function parseAddress(v: string): { name: string; address: string } {
  const m = v.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), address: m[2].trim() };
  return { name: "", address: v.trim() };
}

export function formatAddress(v: string): string {
  const { name, address } = parseAddress(v);
  if (!name) return address;
  const shown = ASCII_SAFE.test(name) ? `"${name.replace(/["\\]/g, "\\$&")}"` : encodeWord(name);
  return `${shown} <${address}>`;
}

export function textToHtml(text: string): string {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return (
    '<!doctype html><html><body><div style="font-family:-apple-system,BlinkMacSystemFont,\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:keep-all">' +
    esc +
    "</div></body></html>"
  );
}

function rand(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function buildMime(m: MimeMail): string {
  const from = parseAddress(m.from);
  const domain = from.address.split("@")[1] || "localhost";
  const boundary = m.boundary ?? `bm_${rand()}`;
  const head: string[] = [
    `From: ${formatAddress(m.from)}`,
    `To: ${formatAddress(m.to)}`,
    ...(m.replyTo ? [`Reply-To: ${formatAddress(m.replyTo)}`] : []),
    `Subject: ${encodeWord(m.subject)}`,
    `Date: ${(m.date ?? new Date()).toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: ${m.messageId ?? `<${rand()}@${domain}>`}`,
    "MIME-Version: 1.0",
  ];
  for (const [k, v] of Object.entries(m.headers ?? {})) {
    if (/^[A-Za-z0-9-]+$/.test(k) && !/[\r\n]/.test(v)) head.push(`${k}: ${v}`);
  }
  head.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  const part = (type: string, body: string) =>
    [`--${boundary}`, `Content-Type: ${type}; charset=UTF-8`, "Content-Transfer-Encoding: base64", "", wrap76(base64Utf8(body))].join(
      "\r\n",
    );
  return [
    head.join("\r\n"),
    "",
    part("text/plain", m.text),
    part("text/html", m.html ?? textToHtml(m.text)),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}
