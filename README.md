<p align="center"><img src="widget/logo.svg" width="96" alt="부킹냥"></p>

# 부킹냥 (booking-meo)

[Define404]

홈페이지가 없어도 됩니다. 카카오톡 채널, 네이버 톡톡, 홈페이지 어디서 손님이 물어도 가게 정보대로 답하고, 예약은 네이버 예약으로 넘기고, 문의가 오면 사장님 휴대폰으로 알려 주는 소상공인용 AI 상담 챗봇입니다.

- 가게 정보 파일 하나(`store/store.md`)만 채우면 동작합니다
- 서버와 AI는 사장님 본인 Cloudflare 무료 계정에서 돌아갑니다
- 대화 기록은 서버에 남기지 않고 사장님 메일로만 보냅니다
- 오픈소스(MIT)라 누구나 무료로 쓰고 고칠 수 있습니다

## 무엇을 하나

| 기능 | 내용 |
|---|---|
| 가게 정보 답변 | 영업시간, 메뉴·가격, 위치, 주차, 자주 묻는 질문. 파일에 없는 내용은 지어내지 않고 "확인 후 연락드리겠습니다"로 답합니다 |
| 예약 연결 | 예약 이야기가 나오면 네이버 예약 버튼을 보냅니다 |
| 문의 남기기 | 이름, 연락처, 내용을 받습니다. 개인정보 수집 동의를 먼저 받습니다 |
| 사장님 알림 | 알림톡으로 보내고, 실패하면 문자로 보냅니다 (솔라피, 사장님 계정) |
| 대화 기록 | 대화가 30분 멈추면 전체 기록을 사장님 메일로 보내고 서버에서 지웁니다 |
| 외국인 손님 | 메시지마다 입력 언어를 자동으로 판별해 그 언어로 답합니다. 한국어, 영어, 베트남어, 일본어, 중국어, 태국어. 안내 문구와 위젯 화면도 같이 바뀌고, 사장님 알림에는 손님 언어를 적어 드립니다 |
| 보호 장치 | 접속자별 요청 제한, 하루 AI 답변 상한, 가게 정보 바꾸기 요청 거절 |

## 손님이 만나는 창구

1. **카카오톡 채널**: 카카오 i 오픈빌더 스킬로 연결합니다
2. **네이버 톡톡**: 톡톡 챗봇 API로 연결합니다
3. **홈페이지·블로그**: 스크립트 한 줄을 붙입니다

세 창구가 같은 답변 엔진을 씁니다.

```
카카오톡 채널 ─┐
네이버 톡톡 ───┼─> Cloudflare Worker ─> Workers AI (가게 정보만 근거로 답변)
홈페이지 위젯 ─┘        │
                       ├─> 솔라피: 사장님 알림톡 / 문자
                       └─> Resend: 문의·대화 기록 메일
```

## 드는 비용 (사장님 부담, 2026-10 기준)

| 항목 | 비용 |
|---|---|
| Cloudflare Workers, Workers AI, Durable Objects | 무료 할당량 안에서 0원 |
| 알림톡 (솔라피) | 건당 13원 |
| 문자 대체 발송 (솔라피) | 단문 18원, 장문 45원 |
| 메일 (Resend) | 월 3,000건까지 무료 |
| 카카오톡 채널, 오픈빌더, 네이버 톡톡 | 무료 |

Workers AI 무료 할당량으로 하루에 몇 번 답할 수 있는지는 모델과 답변 길이에 따라 다릅니다. `DAILY_AI_LIMIT`(기본 300)를 넘으면 "문의 남기기"로 안내합니다.

## 설치

### 1. 준비물

- Cloudflare 무료 계정
- Node.js 20 이상
- (알림) 솔라피 계정, 발신번호 등록
- (메일) Resend 계정. 도메인이 없으면 가입한 메일로만 받을 수 있습니다

### 2. 가게 정보 쓰기

`store/store.md`를 우리 가게 내용으로 바꿉니다. 업종별 예시는 `store/examples/`에 있습니다 (음식점, 미용실, 학원).

`worker/wrangler.toml`의 `[vars]`에서 가게 이름(`STORE_NAME`)과 네이버 예약 주소(`BOOKING_URL`)를 넣습니다.

### 3. 배포

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put OWNER_EMAIL
npx wrangler deploy
```

배포가 끝나면 `https://booking-meo.<계정>.workers.dev` 주소가 나옵니다. 이 주소를 아래 연결에 씁니다.

### 4. 홈페이지에 붙이기

```html
<script src="https://booking-meo.<계정>.workers.dev/widget.js" data-title="우리 가게" defer></script>
```

선택 속성: `data-color`(버튼 색), `data-greeting`(첫인사). 첫인사를 비우면 손님 브라우저 언어로 인사합니다.

### 5. 카카오톡 채널 연결

1. 카카오톡 채널을 만들고 [카카오 i 오픈빌더](https://chatbot.kakao.com)에서 봇을 만듭니다
2. 비밀값을 정해 등록합니다: `npx wrangler secret put KAKAO_SKILL_KEY`
3. 오픈빌더 스킬 주소에 `https://<워커 주소>/kakao/<KAKAO_SKILL_KEY>`를 넣습니다
4. 폴백 블록에 이 스킬을 연결하고, 블록 설정에서 **콜백**을 켭니다
   - AI 답변은 5초를 넘길 수 있습니다. 콜백을 켜면 "답변을 준비하고 있습니다"를 먼저 보내고, 답이 나오면 이어서 보냅니다
   - 가이드: https://kakaobusiness.gitbook.io/main/tool/chatbot/skill_guide/ai_chatbot_callback_guide
5. 봇을 배포하고 카카오톡 채널에 연결합니다

### 6. 네이버 톡톡 연결

1. [네이버 톡톡 파트너센터](https://partner.talk.naver.com)에서 챗봇 API를 신청합니다
2. 비밀값을 등록합니다: `NAVER_WEBHOOK_KEY`(웹훅 주소용), `NAVER_TALK_TOKEN`(보내기 API 인증값)
3. 웹훅 주소에 `https://<워커 주소>/naver/<NAVER_WEBHOOK_KEY>`를 넣습니다
4. 문서: https://github.com/navertalk/chatbot-api

### 7. 사장님 알림 (알림톡 + 문자)

```bash
npx wrangler secret put SOLAPI_API_KEY
npx wrangler secret put SOLAPI_API_SECRET
npx wrangler secret put SOLAPI_SENDER    # 솔라피에 등록한 발신번호
npx wrangler secret put OWNER_PHONE      # 알림 받을 사장님 휴대폰
```

여기까지만 하면 문자로 받습니다. 알림톡으로 받으려면 솔라피에서 카카오 비즈니스 채널을 연동하고 아래 템플릿을 승인받은 뒤 두 값을 더 넣습니다.

```bash
npx wrangler secret put SOLAPI_PFID
npx wrangler secret put SOLAPI_TEMPLATE_ID
```

알림톡 템플릿 예시:

```
[#{가게}] 새 문의가 들어왔습니다.

창구: #{채널}
이름: #{이름}
연락처: #{연락처}
내용: #{내용}
```

## 개인정보

- 손님 대화는 대화가 이어지는 동안만 Cloudflare Durable Object에 임시 보관합니다
- 대화가 멈추면(기본 30분) 사장님 메일로 보내고 즉시 지웁니다
- 문의 남기기는 이름과 연락처 수집 동의를 받은 뒤 사장님 휴대폰과 메일로만 전달합니다
- 가게 홈페이지의 개인정보 처리방침에 "상담 챗봇 문의 접수"와 위탁 업체(Cloudflare, 솔라피, Resend)를 적어 두기를 권합니다

## 설정 값

| 이름 | 위치 | 설명 |
|---|---|---|
| `STORE_NAME` | vars | 가게 이름 |
| `BOOKING_URL` | vars | 네이버 예약 주소. 비우면 예약 버튼 없음 |
| `ALLOWED_ORIGINS` | vars | 위젯을 붙일 홈페이지 주소(쉼표 구분). 비우면 제한 없음 |
| `AI_MODEL` | vars | Workers AI 모델 |
| `DAILY_AI_LIMIT` | vars | 하루 AI 답변 상한 |
| `IDLE_MINUTES` | vars | 대화 기록을 메일로 보내기까지 기다리는 시간(분) |
| `ANTHROPIC_API_KEY` | secret | 넣으면 Claude로 답합니다 (선택) |

## 로컬에서 시험하기

```bash
cd worker
npm install
npx wrangler types                # 타입 파일 생성
cp .dev.vars.example .dev.vars
npx wrangler dev --var MOCK:1     # AI 호출 없이 화면과 흐름만 시험
```

`http://localhost:8787/`을 열면 미리보기 페이지가, `/demo.html`을 열면 위젯만 붙인 빈 페이지가 뜹니다. `MOCK`을 빼면 실제 Workers AI로 답합니다 (계정 로그인 필요).

## 마스코트

고양이 마스코트는 `tools/make-mascot.py`가 로티 애니메이션(`widget/mascot.json`)과 로고(`widget/logo.svg`)를 같은 도형에서 만듭니다. 대기 중에는 눈을 깜빡이고 귀를 움직이며, 답변을 준비할 때는 고개를 끄덕입니다.

## 만든 곳

[Define404](https://define404.com) · JohnLKim

설치, 가게 정보 정리, 카카오·톡톡 연결 대행은 Define404에 문의해 주세요.

---

## English

booking-meo is an open-source AI customer chat bot for Korean small businesses. It answers from a single store info file on KakaoTalk Channel (Kakao i Open Builder skill), Naver TalkTalk (chatbot API) and a website widget, hands bookings off to Naver Booking, and notifies the owner by KakaoTalk AlimTalk with SMS fallback (SOLAPI). It runs on the owner's own free Cloudflare account (Workers, Workers AI, Durable Objects). Conversations are not stored: after 30 minutes of inactivity the transcript is emailed to the owner and deleted. MIT licensed.
