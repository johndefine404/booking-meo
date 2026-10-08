#!/usr/bin/env node
// [Define404] 부킹냥 설치 도우미: 질문에 답하면 가게 정보, 설정, 배포, 연결 주소까지 한 번에 맞춘다.
// 사용: npx github:johndefine404/booking-meo init 우리가게
//       cd 우리가게 && npx booking-meo setup   (또는 node cli/booking-meo.mjs setup)
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { stdin, stdout, argv, exit, cwd } from "node:process";
import { fileURLToPath } from "node:url";

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STATE_FILE = ".booking-meo.json"; // 이 컴퓨터에만 두는 설치 기록 (저장소에 올리지 않는다)
const EXAMPLES = {
  1: { label: "빵집·카페", file: null },
  2: { label: "음식점", file: "restaurant.md" },
  3: { label: "미용실", file: "salon.md" },
  4: { label: "학원", file: "academy.md" },
};

// 키보드 입력과 파이프 입력(자동 설치 스크립트) 모두 받도록 줄을 큐에 쌓아 둔다
const rl = createInterface({ input: stdin, terminal: stdin.isTTY });
const lines = [];
const waiters = [];
let closed = false;
rl.on("line", (l) => (waiters.length ? waiters.shift()(l) : lines.push(l)));
rl.on("close", () => {
  closed = true;
  while (waiters.length) waiters.shift()("");
});
const nextLine = () => (lines.length ? Promise.resolve(lines.shift()) : closed ? Promise.resolve("") : new Promise((r) => waiters.push(r)));
const ask = async (q, def = "") => {
  stdout.write(def ? `${q} [${def}]: ` : `${q}: `);
  const a = (await nextLine()).trim();
  if (!stdin.isTTY) stdout.write("\n");
  return a || def;
};
const yes = async (q, def = true) => /^(y|yes|예|네|ㅇ)$/i.test(await ask(`${q} (y/n)`, def ? "y" : "n"));
const say = (s = "") => console.log(s);
const fail = (s) => {
  console.error(`\n[오류] ${s}`);
  rl.close();
  exit(1);
};

function projectRoot() {
  let d = cwd();
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(d, "worker", "wrangler.toml")) && existsSync(join(d, "store", "store.md"))) return d;
    d = dirname(d);
  }
  fail("부킹냥 폴더 안에서 실행해 주세요. 처음이면 먼저 init 으로 폴더를 만듭니다.");
}

const loadState = (root) => {
  try {
    return JSON.parse(readFileSync(join(root, STATE_FILE), "utf8"));
  } catch {
    return {};
  }
};
const saveState = (root, s) => writeFileSync(join(root, STATE_FILE), JSON.stringify(s, null, 2) + "\n", { mode: 0o600 });

function setVar(toml, key, value) {
  const re = new RegExp(`^${key} = ".*"$`, "m");
  const line = `${key} = ${JSON.stringify(value)}`;
  if (!re.test(toml)) fail(`wrangler.toml 에서 ${key} 줄을 찾지 못했습니다.`);
  return toml.replace(re, line);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: opts.input !== undefined ? ["pipe", "inherit", "inherit"] : "inherit", ...opts });
  return r.status === 0;
}

function capture(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  return { ok: r.status === 0, out: `${r.stdout || ""}${r.stderr || ""}` };
}

// ---------- init: 새 가게 폴더 만들기 ----------
async function init(target) {
  say("부킹냥 설치를 시작합니다. 엔터를 누르면 [ ] 안의 기본값을 씁니다.\n");
  const dir = resolve(target || (await ask("만들 폴더 이름", "booking-meo")));
  if (existsSync(join(dir, "worker"))) fail(`${dir} 에 이미 부킹냥이 있습니다. 그 폴더에서 setup 을 실행해 주세요.`);
  mkdirSync(dir, { recursive: true });
  for (const p of ["store", "widget", "worker", "tools", "cli", "README.md", "LICENSE", ".gitignore", "package.json"]) {
    if (existsSync(join(PKG_ROOT, p))) {
      cpSync(join(PKG_ROOT, p), join(dir, p), {
        recursive: true,
        filter: (src) => !/node_modules|\.wrangler|\.dev\.vars$|wrangler\.demo\.toml|worker-configuration\.d\.ts/.test(src),
      });
    }
  }

  const store = await ask("가게 이름", "모락 베이커리");
  say("\n업종 예시를 고르세요. 고른 예시를 바탕으로 가게 정보 파일을 만듭니다.");
  for (const [k, v] of Object.entries(EXAMPLES)) say(`  ${k}. ${v.label}`);
  const pick = EXAMPLES[await ask("번호", "1")] || EXAMPLES[1];
  if (pick.file) cpSync(join(dir, "store", "examples", pick.file), join(dir, "store", "store.md"));

  const booking = await ask("\n네이버 예약 주소 (없으면 엔터)");
  const site = await ask("챗봇을 붙일 홈페이지 주소, 여러 개면 쉼표 (없으면 엔터)");
  const color = await ask("상담 버튼 색", "#C94A22");

  const tomlPath = join(dir, "worker", "wrangler.toml");
  let toml = readFileSync(tomlPath, "utf8");
  toml = setVar(toml, "STORE_NAME", store);
  toml = setVar(toml, "BOOKING_URL", booking.startsWith("https://") ? booking : "");
  toml = setVar(toml, "ALLOWED_ORIGINS", site.split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean).join(","));
  writeFileSync(tomlPath, toml);

  saveState(dir, { store, color, createdAt: new Date().toISOString() });
  const gi = join(dir, ".gitignore");
  const g = existsSync(gi) ? readFileSync(gi, "utf8") : "";
  if (!g.includes(STATE_FILE)) writeFileSync(gi, g + (g.endsWith("\n") || !g ? "" : "\n") + STATE_FILE + "\n");

  say(`\n폴더를 만들었습니다: ${dir}`);
  say(`다음 순서:`);
  say(`  1. ${join(dir, "store", "store.md")} 를 열어 영업시간, 메뉴, 가격, 자주 묻는 질문을 우리 가게 내용으로 고칩니다.`);
  say(`  2. cd ${dir} 후 node cli/booking-meo.mjs setup 을 실행합니다.`);
  rl.close();
}

// ---------- setup: 설치, 로그인, 배포, 비밀값 ----------
async function setup() {
  const root = projectRoot();
  const worker = join(root, "worker");
  const state = loadState(root);

  const storeMd = readFileSync(join(root, "store", "store.md"), "utf8");
  if (storeMd.includes("모락 베이커리") && !(await yes("가게 정보가 아직 예시(모락 베이커리) 그대로입니다. 그래도 계속할까요?", false))) {
    say("store/store.md 를 고친 뒤 다시 실행해 주세요.");
    return rl.close();
  }

  say("\n1/4 필요한 파일을 내려받습니다.");
  if (!existsSync(join(worker, "node_modules")) && !run("npm", ["install", "--no-audit", "--no-fund"], { cwd: worker })) fail("npm install 에 실패했습니다.");

  say("\n2/4 Cloudflare 계정을 확인합니다. 무료 계정이면 됩니다.");
  let who = capture("npx", ["wrangler", "whoami"], { cwd: worker });
  if (!/associated with|logged in/i.test(who.out)) {
    say("로그인이 필요합니다. 브라우저가 열리면 Cloudflare 에 로그인하고 허용을 눌러 주세요.");
    if (!run("npx", ["wrangler", "login"], { cwd: worker })) fail("Cloudflare 로그인에 실패했습니다.");
  }

  say("\n3/4 배포합니다.");
  const dep = capture("npx", ["wrangler", "deploy"], { cwd: worker });
  process.stdout.write(dep.out.split("\n").filter((l) => /Uploaded|Deployed|https:\/\/|error|Error/i.test(l)).join("\n") + "\n");
  if (!dep.ok) fail("배포에 실패했습니다. 위 오류를 확인해 주세요.");
  // 자체 도메인을 붙였으면 그 주소를, 아니면 workers.dev 주소를 쓴다
  const custom = (dep.out.match(/^\s*([a-z0-9.-]+\.[a-z]{2,})\s+\(custom domain\)/im) || [])[1];
  const url = custom ? `https://${custom}` : (dep.out.match(/https:\/\/[^\s]+\.workers\.dev/) || [])[0];
  if (url) state.url = url;

  say("\n4/4 연결 설정을 넣습니다. 지금 없는 것은 엔터로 건너뛰고 나중에 setup 을 다시 실행하면 됩니다.");
  const put = (name, value) => {
    if (!value) return false;
    const ok = run("npx", ["wrangler", "secret", "put", name], { cwd: worker, input: value + "\n" });
    if (!ok) say(`  ${name} 저장에 실패했습니다.`);
    return ok;
  };

  // 카카오·톡톡 주소용 비밀값은 자동으로 만든다
  state.kakaoKey ??= randomBytes(12).toString("hex");
  state.naverKey ??= randomBytes(12).toString("hex");
  state.adminKey ??= randomBytes(24).toString("hex");
  put("KAKAO_SKILL_KEY", state.kakaoKey);
  put("NAVER_WEBHOOK_KEY", state.naverKey);
  put("ADMIN_KEY", state.adminKey);

  if (await yes("\n대화 기록·문의를 메일로 받을까요? (Resend 무료 계정 필요)")) {
    put("OWNER_EMAIL", await ask("  받을 메일 주소"));
    put("RESEND_API_KEY", await ask("  Resend API 키 (re_ 로 시작)"));
  }
  if (await yes("사장님 휴대폰으로 문의 알림을 받을까요? (솔라피 계정, 건당 과금)")) {
    put("SOLAPI_API_KEY", await ask("  솔라피 API 키"));
    put("SOLAPI_API_SECRET", await ask("  솔라피 API 시크릿"));
    put("SOLAPI_SENDER", await ask("  솔라피에 등록한 발신번호"));
    put("OWNER_PHONE", await ask("  알림 받을 휴대폰 번호"));
    if (await yes("  알림톡 템플릿 승인을 받았나요?", false)) {
      put("SOLAPI_PFID", await ask("  카카오 채널 연동 ID (pfId)"));
      put("SOLAPI_TEMPLATE_ID", await ask("  템플릿 ID"));
    }
  }
  if (await yes("네이버 톡톡 챗봇 API 를 신청했나요?", false)) {
    put("NAVER_TALK_TOKEN", await ask("  톡톡 보내기 API 인증값"));
  }

  saveState(root, state);
  rl.close();
  info(root);
}

// ---------- info: 붙여 넣을 주소와 코드 ----------
function info(root = projectRoot()) {
  const s = loadState(root);
  const base = s.url || "https://<배포 주소>";
  say("\n붙여 넣을 곳 정리");
  say("\n[홈페이지·블로그] </body> 바로 앞에 한 줄:");
  say(`  <script src="${base}/widget.js" data-title="${s.store || "우리 가게"}" data-color="${s.color || "#C94A22"}" defer></script>`);
  say("\n[카카오 i 오픈빌더] 스킬 주소 (폴백 블록에 연결, 블록 설정에서 콜백 켜기):");
  say(`  ${base}/kakao/${s.kakaoKey || "<setup 후 생성>"}`);
  say("\n[네이버 톡톡 파트너센터] 웹훅 주소:");
  say(`  ${base}/naver/${s.naverKey || "<setup 후 생성>"}`);
  say("\n[미리보기] 바로 대화해 보기:");
  say(`  ${base}/`);
  say(`\n이 주소들은 ${join(root, STATE_FILE)} 에도 저장돼 있습니다. 비밀값이 들어 있으니 다른 사람에게 보내지 마세요.`);
}

// ---------- test: 배포한 챗봇에 질문 하나 ----------
async function test() {
  const root = projectRoot();
  const s = loadState(root);
  if (!s.url) fail("배포 주소가 없습니다. 먼저 setup 을 실행해 주세요.");
  const q = (await ask("물어볼 말", "영업시간 알려 주세요")) || "영업시간 알려 주세요";
  rl.close();
  const health = await fetch(`${s.url}/health`).then((r) => r.json()).catch((e) => ({ error: String(e) }));
  say(`상태: ${JSON.stringify(health)}`);
  const r = await fetch(`${s.url}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: new URL(s.url).origin },
    body: JSON.stringify({ sessionId: `cli-test-${randomBytes(8).toString("hex")}`, message: q }),
  });
  say(`답변 (${r.status}): ${JSON.stringify(await r.json())}`);
}

// ---------- inbox: 문의함 보기·지우기 ----------
async function inbox(sub, id) {
  const root = projectRoot();
  const s = loadState(root);
  rl.close();
  if (!s.url || !s.adminKey) fail("배포 주소나 문의함 비밀값이 없습니다. 먼저 setup 을 실행해 주세요.");
  const headers = { Authorization: `Bearer ${s.adminKey}` };
  if (sub === "delete") {
    if (!id) fail("지울 문의 번호를 적어 주세요. 예: inbox delete 3f2a...");
    const r = await fetch(`${s.url}/admin/inquiries/${encodeURIComponent(id)}`, { method: "DELETE", headers });
    return say(r.ok ? "지웠습니다." : `지우지 못했습니다 (${r.status}).`);
  }
  const r = await fetch(`${s.url}/admin/inquiries`, { headers });
  if (!r.ok) fail(`문의함을 열지 못했습니다 (${r.status}).`);
  const { items } = await r.json();
  if (!items.length) return say("문의함이 비어 있습니다.");
  const ch = { web: "홈페이지", kakao: "카카오톡", naver: "네이버 톡톡" };
  for (const q of items) {
    const at = new Date(q.at + 9 * 3600_000).toISOString().slice(0, 16).replace("T", " ");
    say(`\n[${at}] ${ch[q.channel] || q.channel}${q.lang && q.lang !== "ko" ? ` · 손님 언어 ${q.lang}` : ""}`);
    say(`  이름: ${q.name}`);
    say(`  연락처: ${q.contact}`);
    say(`  내용: ${q.message}`);
    say(`  번호: ${q.id}`);
  }
  say(`\n모두 ${items.length}건. 보관 기간이 지나면 자동으로 지워집니다.`);
}

// ---------- doctor: 설정 점검 ----------
function doctor() {
  const root = projectRoot();
  const s = loadState(root);
  const toml = readFileSync(join(root, "worker", "wrangler.toml"), "utf8");
  const v = (k) => (toml.match(new RegExp(`^${k} = "(.*)"$`, "m")) || [])[1] ?? "";
  const store = readFileSync(join(root, "store", "store.md"), "utf8");
  const rows = [
    ["Node 20 이상", Number(process.versions.node.split(".")[0]) >= 20],
    ["가게 이름 설정", Boolean(v("STORE_NAME"))],
    ["가게 정보가 예시가 아님", !store.includes("모락 베이커리") || v("STORE_NAME") === "모락 베이커리"],
    ["네이버 예약 주소 (선택)", Boolean(v("BOOKING_URL"))],
    ["홈페이지 주소 제한 (선택)", Boolean(v("ALLOWED_ORIGINS"))],
    ["배포 주소 기록", Boolean(s.url)],
    ["카카오·톡톡 연결 비밀값 생성", Boolean(s.kakaoKey && s.naverKey)],
  ];
  for (const [label, ok] of rows) say(`${ok ? "[통과]" : "[확인]"} ${label}`);
  rl.close();
}

const HELP = `부킹냥 설치 도우미

  init [폴더]   새 가게 폴더를 만들고 가게 이름, 업종 예시, 예약 주소를 묻습니다
  setup         설치, Cloudflare 로그인, 배포, 메일·알림·톡톡 연결을 차례로 진행합니다
  info          홈페이지 코드, 카카오 스킬 주소, 톡톡 웹훅 주소를 다시 보여 줍니다
  test          배포한 챗봇에 질문을 하나 보내 봅니다
  doctor        설정이 빠진 곳을 점검합니다
  inbox         문의함을 봅니다 (지우기: inbox delete <번호>)`;

const [cmd, arg, arg2] = argv.slice(2);
const cmds = { init: () => init(arg), setup, info: () => (info(), rl.close()), test, doctor, inbox: () => inbox(arg, arg2) };
if (!cmds[cmd]) {
  say(HELP);
  rl.close();
} else {
  await cmds[cmd]();
}
