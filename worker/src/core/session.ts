// 대화 한 건을 잠시 보관하는 Durable Object.
// 대화가 IDLE_MINUTES 동안 멈추면 사장님 메일로 기록을 보내고 저장분을 전부 지운다.
import { DurableObject } from "cloudflare:workers";
import type { Channel, Env, Inquiry, Msg } from "../env";
import { sendTranscript } from "../notify";
import type { Lang } from "./lang";

export type InquiryStep = "name" | "contact" | "message" | "consent";

export type SessionData = {
  channel: Channel;
  userId: string;
  startedAt: number;
  lang?: Lang; // 마지막으로 확실했던 손님 언어
  messages: Msg[];
  inquiry?: { step: InquiryStep; draft: Partial<Inquiry> } | null;
  submitted?: Inquiry[];
};

const MAX_KEEP = 40;

export class Session extends DurableObject<Env> {
  async load(): Promise<SessionData | null> {
    return (await this.ctx.storage.get<SessionData>("data")) ?? null;
  }

  async save(data: SessionData): Promise<void> {
    data.messages = data.messages.slice(-MAX_KEEP);
    await this.ctx.storage.put("data", data);
    const idle = Math.max(1, Number(this.env.IDLE_MINUTES) || 30);
    await this.ctx.storage.setAlarm(Date.now() + idle * 60_000);
  }

  async alarm(): Promise<void> {
    const data = await this.load();
    if (data && (data.messages.length > 0 || data.submitted?.length)) {
      try {
        await sendTranscript(this.env, data);
      } catch (e) {
        console.error("transcript mail failed", e);
      }
    }
    await this.ctx.storage.deleteAll();
  }
}

// 하루 AI 답변 수를 세는 Durable Object (전체에서 하나만 쓴다)
export class Usage extends DurableObject<Env> {
  async hit(limit: number): Promise<boolean> {
    const day = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10); // 한국 날짜
    const key = `n:${day}`;
    const n = ((await this.ctx.storage.get<number>(key)) ?? 0) + 1;
    if (n > limit) return false;
    await this.ctx.storage.put(key, n);
    if (n === 1) {
      const old = await this.ctx.storage.list({ prefix: "n:" });
      for (const k of old.keys()) if (k !== key) await this.ctx.storage.delete(k);
    }
    return true;
  }
}

export function sessionStub(env: Env, channel: Channel, userId: string) {
  return env.SESSION.get(env.SESSION.idFromName(`${channel}:${userId}`));
}
