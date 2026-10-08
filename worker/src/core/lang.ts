// 손님 입력 언어 자동 추적.
// 1) 글자 체계로 언어를 고르고  2) 대화마다 마지막으로 확실했던 언어를 기억하고
// 3) AI 에는 그 언어로 답하라고 명시하고  4) 고정 안내 문구도 그 언어로 낸다.
export type Lang = "ko" | "en" | "vi" | "ja" | "zh" | "th";

export const LANG_NAME: Record<Lang, string> = {
  ko: "Korean (한국어)",
  en: "English",
  vi: "Vietnamese (Tiếng Việt)",
  ja: "Japanese (日本語)",
  zh: "Chinese (中文)",
  th: "Thai (ภาษาไทย)",
};

const VI_MARKS = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const VI_WORDS = /\b(không|có|của|tôi|bạn|cho|mấy|giờ|bao nhiêu|được|ở đâu|đặt)\b/i;

// 확실하지 않으면 null (숫자만, 이모티콘만, "ok" 같은 짧은 말)
export function detectLang(text: string): Lang | null {
  const t = text.trim();
  if (!t) return null;
  const count = (re: RegExp) => (t.match(re) || []).length;
  const hangul = count(/[가-힣ㄱ-ㆎ]/g);
  const kana = count(/[぀-ヿ]/g);
  const han = count(/[一-鿿]/g);
  const thai = count(/[฀-๿]/g);
  const latin = count(/[A-Za-zÀ-ỹ]/g);

  if (hangul >= 1 && hangul >= latin / 3) return "ko";
  if (kana >= 1) return "ja";
  if (han >= 1) return "zh";
  if (thai >= 1) return "th";
  if (VI_MARKS.test(t) || VI_WORDS.test(t)) return "vi";
  if (latin >= 4) return "en";
  return null;
}

// 새 입력이 확실하면 그 언어로 바꾸고, 아니면 이전 언어를 유지한다
export function trackLang(prev: Lang | undefined, text: string): Lang {
  return detectLang(text) ?? prev ?? "ko";
}

type Key =
  | "inquiry"
  | "inqStart"
  | "inqContact"
  | "inqMessage"
  | "consent"
  | "agree"
  | "cancel"
  | "cancelled"
  | "received"
  | "booking"
  | "bookingHint"
  | "limit"
  | "error"
  | "empty"
  | "greeting"
  | "preparing"
  | "late";

const T: Record<Lang, Record<Key, string>> = {
  ko: {
    inquiry: "문의 남기기",
    inqStart: "문의를 남겨 주시면 사장님께 바로 전달해 드리겠습니다. 성함을 알려 주세요. (그만두려면 \"취소\")",
    inqContact: "연락받으실 전화번호나 메일 주소를 알려 주세요.",
    inqMessage: "어떤 내용인지 적어 주세요. 예약이면 원하시는 날짜, 시간, 인원을 함께 적어 주세요.",
    consent:
      "[개인정보 수집·이용 동의] 목적: 문의에 답하기 위해 사장님께 전달. 항목: 이름, 연락처, 문의 내용. 보유 기간: 30일 뒤 삭제. 동의하지 않으셔도 됩니다. 다만 동의하지 않으면 문의를 남길 수 없고, 질문은 계속하실 수 있습니다. 동의하시면 \"동의\"를 눌러 주세요.",
    agree: "동의",
    cancel: "취소",
    cancelled: "문의 남기기를 취소했습니다. 궁금한 점이 있으면 편하게 물어보세요.",
    received: "문의가 접수됐습니다. 사장님이 확인 후 연락드리겠습니다.",
    booking: "네이버 예약하기",
    bookingHint: "아래 버튼으로 바로 예약하실 수 있습니다.",
    limit: "지금은 자동 상담이 잠시 쉬고 있습니다. \"문의 남기기\"로 남겨 주시면 사장님이 직접 연락드리겠습니다.",
    error: "잠시 연결이 원활하지 않습니다. 조금 뒤에 다시 물어봐 주시거나 \"문의 남기기\"를 이용해 주세요.",
    empty: "죄송합니다. 다시 한 번 말씀해 주세요.",
    greeting: "안녕하세요, {store}입니다. 궁금한 점을 편하게 물어보세요.",
    preparing: "답변을 준비하고 있습니다.",
    late: "답변이 늦어지고 있습니다. 잠시 후 다시 물어봐 주세요.",
  },
  en: {
    inquiry: "Leave a message",
    inqStart: "We'll pass your message to the owner right away. May I have your name? (type \"cancel\" to stop)",
    inqContact: "What phone number or email should we contact you at?",
    inqMessage: "Please write your message. For a booking, include the date, time and number of people.",
    consent:
      "[Consent to collect personal information] Purpose: passing your message to the owner so they can reply. Items: name, contact, message. Retention: deleted after 30 days. You may refuse; if you do, you cannot leave a message but can keep asking questions. Reply \"agree\" to continue.",
    agree: "agree",
    cancel: "cancel",
    cancelled: "Cancelled. Feel free to ask anything else.",
    received: "Your message has been sent. The owner will contact you soon.",
    booking: "Book on Naver",
    bookingHint: "You can book right away with the button below.",
    limit: "Automatic replies are paused for now. Please leave a message and the owner will contact you.",
    error: "We're having trouble connecting. Please try again shortly or leave a message.",
    empty: "Sorry, could you say that again?",
    greeting: "Hello, this is {store}. Ask us anything.",
    preparing: "Preparing an answer...",
    late: "This is taking longer than usual. Please ask again in a moment.",
  },
  vi: {
    inquiry: "Để lại lời nhắn",
    inqStart: "Chúng tôi sẽ chuyển lời nhắn tới chủ cửa hàng ngay. Bạn tên gì ạ? (gõ \"hủy\" để dừng)",
    inqContact: "Số điện thoại hoặc email để liên hệ với bạn là gì ạ?",
    inqMessage: "Vui lòng ghi nội dung. Nếu đặt chỗ, xin ghi ngày, giờ và số người.",
    consent:
      "[Đồng ý thu thập thông tin cá nhân] Mục đích: chuyển lời nhắn tới chủ cửa hàng để trả lời. Thông tin: tên, liên hệ, nội dung. Thời hạn: xóa sau 30 ngày. Bạn có quyền từ chối; khi đó bạn không thể để lại lời nhắn nhưng vẫn có thể hỏi tiếp. Trả lời \"đồng ý\" để tiếp tục.",
    agree: "đồng ý",
    cancel: "hủy",
    cancelled: "Đã hủy. Bạn cứ hỏi thêm nếu cần nhé.",
    received: "Đã gửi lời nhắn. Chủ cửa hàng sẽ liên hệ với bạn sớm.",
    booking: "Đặt chỗ trên Naver",
    bookingHint: "Bạn có thể đặt chỗ ngay bằng nút bên dưới.",
    limit: "Trả lời tự động đang tạm dừng. Vui lòng để lại lời nhắn, chủ cửa hàng sẽ liên hệ.",
    error: "Kết nối đang gặp sự cố. Vui lòng thử lại sau hoặc để lại lời nhắn.",
    empty: "Xin lỗi, bạn nói lại được không?",
    greeting: "Xin chào, đây là {store}. Bạn cứ hỏi nhé.",
    preparing: "Đang chuẩn bị câu trả lời...",
    late: "Câu trả lời đang chậm. Vui lòng hỏi lại sau giây lát.",
  },
  ja: {
    inquiry: "お問い合わせ",
    inqStart: "店主にすぐお伝えします。お名前を教えてください。(やめる場合は「キャンセル」)",
    inqContact: "ご連絡先の電話番号またはメールアドレスを教えてください。",
    inqMessage: "内容をご記入ください。ご予約の場合は日付、時間、人数もお書きください。",
    consent:
      "[個人情報の収集・利用への同意] 目的: 店主からの返信のためにお伝えします。項目: お名前、連絡先、お問い合わせ内容。保管期間: 30日後に削除。同意しないこともできます。その場合お問い合わせは残せませんが、質問は続けられます。よろしければ「同意」と送ってください。",
    agree: "同意",
    cancel: "キャンセル",
    cancelled: "キャンセルしました。ほかにご質問があればどうぞ。",
    received: "お問い合わせを受け付けました。店主から折り返しご連絡します。",
    booking: "Naverで予約",
    bookingHint: "下のボタンからすぐにご予約いただけます。",
    limit: "ただいま自動応答を休止しています。お問い合わせを残していただければ店主からご連絡します。",
    error: "接続が不安定です。少し後にもう一度お試しいただくか、お問い合わせをご利用ください。",
    empty: "すみません、もう一度お願いします。",
    greeting: "こんにちは、{store}です。お気軽にご質問ください。",
    preparing: "回答を準備しています。",
    late: "回答に時間がかかっています。少し後にもう一度お尋ねください。",
  },
  zh: {
    inquiry: "留言",
    inqStart: "我们会马上转告店主。请问您的姓名？(输入\"取消\"可停止)",
    inqContact: "请留下您的电话或邮箱。",
    inqMessage: "请写下留言内容。如需预约，请注明日期、时间和人数。",
    consent: "[个人信息收集与使用同意] 目的：转告店主以便回复。项目：姓名、联系方式、留言内容。保存期限：30天后删除。您可以拒绝；拒绝后无法留言，但仍可继续提问。同意请回复\"同意\"。",
    agree: "同意",
    cancel: "取消",
    cancelled: "已取消。还有其他问题请随时提问。",
    received: "留言已发送，店主确认后会联系您。",
    booking: "在Naver预约",
    bookingHint: "点击下方按钮即可预约。",
    limit: "自动回复暂时停止。请留言，店主会直接联系您。",
    error: "连接不稳定，请稍后再试或留言。",
    empty: "抱歉，请再说一遍。",
    greeting: "您好，这里是{store}。欢迎随时提问。",
    preparing: "正在准备回答。",
    late: "回答较慢，请稍后再问。",
  },
  th: {
    inquiry: "ฝากข้อความ",
    inqStart: "เราจะส่งข้อความถึงเจ้าของร้านทันที ขอทราบชื่อของคุณ (พิมพ์ \"ยกเลิก\" เพื่อหยุด)",
    inqContact: "ขอเบอร์โทรหรืออีเมลสำหรับติดต่อกลับ",
    inqMessage: "กรุณาเขียนรายละเอียด หากจอง โปรดระบุวันที่ เวลา และจำนวนคน",
    consent:
      "[ความยินยอมเก็บข้อมูลส่วนบุคคล] วัตถุประสงค์: ส่งข้อความถึงเจ้าของร้านเพื่อตอบกลับ ข้อมูล: ชื่อ ช่องทางติดต่อ ข้อความ ระยะเวลา: ลบหลัง 30 วัน คุณปฏิเสธได้ แต่จะฝากข้อความไม่ได้ ยังถามต่อได้ ตอบ \"ยินยอม\" เพื่อดำเนินการต่อ",
    agree: "ยินยอม",
    cancel: "ยกเลิก",
    cancelled: "ยกเลิกแล้ว สอบถามเพิ่มเติมได้เลย",
    received: "ส่งข้อความแล้ว เจ้าของร้านจะติดต่อกลับเร็วๆ นี้",
    booking: "จองผ่าน Naver",
    bookingHint: "กดปุ่มด้านล่างเพื่อจองได้ทันที",
    limit: "ระบบตอบอัตโนมัติหยุดชั่วคราว กรุณาฝากข้อความ เจ้าของร้านจะติดต่อกลับ",
    error: "การเชื่อมต่อขัดข้อง กรุณาลองใหม่ภายหลังหรือฝากข้อความ",
    empty: "ขออภัย ช่วยพูดอีกครั้งได้ไหม",
    greeting: "สวัสดี ที่นี่คือ {store} สอบถามได้เลย",
    preparing: "กำลังเตรียมคำตอบ",
    late: "คำตอบล่าช้า กรุณาถามใหม่อีกครั้งในอีกสักครู่",
  },
};

export function t(lang: Lang, key: Key, vars: Record<string, string> = {}): string {
  return T[lang][key].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

const ALL = (key: Key) => Object.values(T).map((d) => d[key].toLowerCase());
const INQUIRY_EXTRA = ["문의하기", "상담 연결", "사장님 연결", "직원 연결"];

export const isInquiryTrigger = (text: string) => {
  const s = text.trim().toLowerCase();
  return ALL("inquiry").includes(s) || INQUIRY_EXTRA.includes(s);
};
export const isAgree = (text: string) => {
  const s = text.trim().toLowerCase();
  return ALL("agree").includes(s) || ["네", "예", "yes", "ok", "có", "はい", "是", "好"].includes(s);
};
export const isCancel = (text: string) => ALL("cancel").includes(text.trim().toLowerCase());
