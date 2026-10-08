// 답변 생성. 기본은 사장님 계정의 Workers AI, ANTHROPIC_API_KEY 가 있으면 Claude.
import type { Env, Msg } from "../env";
import { systemPrompt } from "./prompt";
import type { Lang } from "./lang";

export async function generate(env: Env, history: Msg[], lang: Lang): Promise<string> {
  if (env.MOCK === "1") {
    return `[${lang}] 시험 모드 답변입니다. 마지막 질문: "${history[history.length - 1]?.content ?? ""}"`;
  }
  const system = systemPrompt(env, lang);
  const text = env.ANTHROPIC_API_KEY ? await claude(env, system, history) : await workersAI(env, system, history);
  return clean(text);
}

async function workersAI(env: Env, system: string, history: Msg[]): Promise<string> {
  const run = () =>
    env.AI.run(env.AI_MODEL as keyof AiModels, {
      messages: [{ role: "system", content: system }, ...history],
      max_tokens: 400,
      temperature: 0.3,
    } as any) as Promise<{ response?: string }>;
  try {
    return (await run()).response ?? "";
  } catch (e) {
    console.error("workers ai retry", e);
    return (await run()).response ?? "";
  }
}

async function claude(env: Env, system: string, history: Msg[]): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: env.CLAUDE_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system,
      messages: history,
    }),
  });
  if (!res.ok) throw new Error(`claude ${res.status}`);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("");
}

// 모델이 가끔 붙이는 마크다운 기호를 걷어 낸다 (카카오톡·톡톡은 기호가 그대로 보인다)
function clean(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "· ")
    .trim()
    .slice(0, 900);
}
