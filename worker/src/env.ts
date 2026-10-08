import type { Session, Usage } from "./core/session";
import type { Inbox } from "./core/inbox";

export interface Env {
  AI: Ai;
  SESSION: DurableObjectNamespace<Session>;
  USAGE: DurableObjectNamespace<Usage>;
  INBOX: DurableObjectNamespace<Inbox>;
  LIMITER?: RateLimit;

  STORE_NAME: string;
  BOOKING_URL?: string;
  ALLOWED_ORIGINS?: string;
  AI_MODEL: string;
  DAILY_AI_LIMIT: string;
  IDLE_MINUTES: string;
  MOCK?: string;
  INBOX_DAYS?: string; // 문의함 보관 일수 (기본 30)
  ADMIN_KEY?: string; // 문의함 조회용 비밀값 (setup 이 만든다)

  // 선택: Claude 로 답변 품질을 올릴 때
  ANTHROPIC_API_KEY?: string;
  CLAUDE_MODEL?: string;

  // 개인정보 처리방침 주소. 있으면 동의 안내에 함께 보낸다
  PRIVACY_URL?: string;

  // 대화 기록·문의 메일. Gmail API 가 먼저, 없으면 Resend, 둘 다 없으면 보내지 않는다
  GMAIL_CLIENT_ID?: string;
  GMAIL_CLIENT_SECRET?: string;
  GMAIL_REFRESH_TOKEN?: string; // gmail.send 권한만 받은 갱신 토큰
  RESEND_API_KEY?: string;
  OWNER_EMAIL?: string;
  MAIL_FROM: string;

  // 사장님 알림 (솔라피: 알림톡 우선, 실패 시 문자)
  SOLAPI_API_KEY?: string;
  SOLAPI_API_SECRET?: string;
  SOLAPI_SENDER?: string; // 솔라피에 등록한 발신번호
  OWNER_PHONE?: string;
  SOLAPI_PFID?: string; // 카카오 비즈니스 채널 연동 ID
  SOLAPI_TEMPLATE_ID?: string; // 승인된 알림톡 템플릿 ID

  // 채널 연결
  KAKAO_SKILL_KEY?: string; // 오픈빌더 스킬 주소에 붙이는 비밀값
  NAVER_WEBHOOK_KEY?: string; // 톡톡 웹훅 주소에 붙이는 비밀값
  NAVER_TALK_TOKEN?: string; // 톡톡 보내기 API 인증값
}

export type Channel = "web" | "kakao" | "naver";

export type Msg = { role: "user" | "assistant"; content: string };

export type Button = { label: string; url: string };

export type Reply = {
  text: string;
  lang?: import("./core/lang").Lang; // 이 답변의 언어 (위젯이 화면 문구를 맞춘다)
  buttons?: Button[];
  quickReplies?: string[];
};

export type Inquiry = {
  name: string;
  contact: string;
  message: string;
};
