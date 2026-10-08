// 메일 원문(MIME) 만들기 시험: node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { base64url, buildMime, encodeWord, formatAddress } from "../src/notify/mime.ts";

const decodeWords = (h: string) =>
  h.replace(/\r\n /g, "").replace(/=\?UTF-8\?B\?([^?]+)\?=/g, (_, b) => Buffer.from(b, "base64").toString("utf8"));

test("한글 제목은 UTF-8 encoded word 로 바뀌고 되돌리면 원문과 같다", () => {
  const subject = "[모락 베이커리] 새 문의: 김손님 (홈페이지) 예약 문의 드립니다 내일 오후 세 시 네 명";
  const raw = buildMime({ from: "부킹냥 <shop@example.com>", to: "owner@example.com", subject, text: "본문" });
  const line = raw.split("\r\n\r\n")[0].match(/^Subject: ([\s\S]*?)\r\n(?=[A-Z][\w-]*: )/m)![1];
  assert.match(line, /^=\?UTF-8\?B\?/);
  for (const w of line.split("\r\n ")) assert.ok(w.length <= 75, `조각 길이 ${w.length}`);
  assert.equal(decodeWords(line), subject);
});

test("보낸 사람 이름도 인코딩하고 주소는 그대로 둔다", () => {
  const from = formatAddress("Define404 문의 <john@example.com>");
  assert.match(from, /^=\?UTF-8\?B\?.+\?= <john@example\.com>$/);
  assert.equal(decodeWords(from.split(" <")[0]), "Define404 문의");
  assert.equal(formatAddress("Shop <a@b.c>"), '"Shop" <a@b.c>');
  assert.equal(encodeWord("plain"), "plain");
});

test("text/plain 과 text/html 두 부분이 모두 있고 필수 머리글이 있다", () => {
  const raw = buildMime({
    from: "부킹냥 <shop@example.com>",
    to: "owner@example.com",
    subject: "새 문의",
    text: "이름: 홍길동\n<내용>",
    replyTo: "guest@example.com",
    headers: { "List-Unsubscribe": "<mailto:u@example.com>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    boundary: "BOUNDARY",
  });
  const [head, body] = [raw.slice(0, raw.indexOf("\r\n\r\n")), raw.slice(raw.indexOf("\r\n\r\n"))];
  for (const h of ["From: ", "To: owner@example.com", "Reply-To: guest@example.com", "Date: ", "Message-ID: <", "MIME-Version: 1.0", "List-Unsubscribe: <mailto:u@example.com>", "List-Unsubscribe-Post: List-Unsubscribe=One-Click", 'Content-Type: multipart/alternative; boundary="BOUNDARY"'])
    assert.ok(head.includes(h), h);
  const parts = body.split("--BOUNDARY").slice(1, 3);
  assert.equal(parts.length, 2);
  assert.match(parts[0], /Content-Type: text\/plain; charset=UTF-8/);
  assert.match(parts[1], /Content-Type: text\/html; charset=UTF-8/);
  const decode = (p: string) => Buffer.from(p.split("\r\n\r\n")[1].replace(/\s/g, ""), "base64").toString("utf8");
  assert.equal(decode(parts[0]), "이름: 홍길동\n<내용>");
  assert.match(decode(parts[1]), /&lt;내용&gt;/);
  assert.ok(raw.endsWith("--BOUNDARY--\r\n"));
});

test("머리글에 줄바꿈을 넣어 다른 머리글을 끼워 넣을 수 없다", () => {
  const raw = buildMime({ from: "a@b.c", to: "o@b.c", subject: "hi\r\nBcc: x@evil.test", text: "t", headers: { "X-A": "1\r\nBcc: y@evil.test" } });
  const head = raw.slice(0, raw.indexOf("\r\n\r\n"));
  assert.ok(!/^Bcc:/m.test(head));
});

test("base64url 은 +, /, = 를 쓰지 않는다", () => {
  assert.doesNotMatch(base64url("???>>>~~~한글"), /[+/=]/);
});
