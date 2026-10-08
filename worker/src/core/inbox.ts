// 문의함: 메일·문자 알림이 아직 없어도 문의가 사라지지 않게 보관한다.
// 사장님이 확인할 수 있도록 INBOX_DAYS(기본 30일) 동안만 두고 지운다.
import { DurableObject } from "cloudflare:workers";
import type { Channel, Env, Inquiry } from "../env";

export type InboxEntry = Inquiry & { id: string; channel: Channel; lang: string; at: number };

const DAY = 86_400_000;

export class Inbox extends DurableObject<Env> {
  private days() {
    return Math.max(1, Number(this.env.INBOX_DAYS) || 30);
  }

  async add(q: Inquiry, channel: Channel, lang: string): Promise<string> {
    const id = crypto.randomUUID();
    const entry: InboxEntry = { ...q, id, channel, lang, at: Date.now() };
    await this.ctx.storage.put(`q:${entry.at}:${id}`, entry);
    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + DAY);
    return id;
  }

  async list(): Promise<InboxEntry[]> {
    const rows = await this.ctx.storage.list<InboxEntry>({ prefix: "q:", reverse: true, limit: 500 });
    return [...rows.values()];
  }

  async remove(id: string): Promise<boolean> {
    const rows = await this.ctx.storage.list<InboxEntry>({ prefix: "q:" });
    for (const [k, v] of rows) {
      if (v.id === id) {
        await this.ctx.storage.delete(k);
        return true;
      }
    }
    return false;
  }

  // 하루에 한 번 보관 기간이 지난 문의를 지운다
  async alarm(): Promise<void> {
    const cutoff = Date.now() - this.days() * DAY;
    const rows = await this.ctx.storage.list<InboxEntry>({ prefix: "q:" });
    for (const [k, v] of rows) if (v.at < cutoff) await this.ctx.storage.delete(k);
    if (rows.size > 0) await this.ctx.storage.setAlarm(Date.now() + DAY);
  }
}

export const inboxStub = (env: Env) => env.INBOX.get(env.INBOX.idFromName("inbox"));
