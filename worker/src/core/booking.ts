// 손님 말이 예약 이야기인지 알아본다. 맞으면 답 끝에 예약 버튼을 붙인다.
// 베트남어는 성조를 빼고 쓰는 손님이 많아서, 성조를 지운 글로 한 번 더 비교한다.

// 원문(소문자)으로 비교하는 말: 한국어, 일본어, 중국어, 태국어, 성조가 있는 베트남어
const RAW_WORDS = new RegExp(
  [
    "예약", "자리\\s*있", "방문\\s*가능",
    "予約", "取り置き", "空席", "席\\s*(は|が)?\\s*(空|あ)",
    "预约", "预订", "订位", "订座", "訂位", "預約", "預訂",
    "จอง",
    "giữ\\s*chỗ", "còn\\s*bàn",
  ].join("|"),
);

// 성조를 지운 글로 비교하는 말: 영어, 베트남어(성조 유무 둘 다)
// 베트남어 "đặt" 뒤에 오는 말이 자리·날짜·물건(케이크)·예약금일 때만 예약으로 본다.
// "đặt câu hỏi"(질문하다), "đặt tên"(이름 짓다) 같은 말은 고르지 않는다.
const FOLDED_WORDS = new RegExp(
  [
    "\\bbook(ing|ings|ed)?\\b", "\\breserv", "\\bappointment", "\\bpre-?order",
    "\\bdat\\s+(?:(?:mot|1|cai|chiec|truoc|them)\\s+)*(ban|cho|lich|truoc|hen|banh|coc|phong|tiec|suat)\\b",
    "\\bdat\\s+(ngay|gio)\\b", "\\btien\\s+coc\\b", "\\bcoc\\s+truoc\\b",
  ].join("|"),
);

// 성조가 전혀 없는 글에서만 비교하는 말 (성조를 지우면 다른 낱말과 겹치는 것)
// "giu cho" 는 "giữ cho"(~하도록 지키다)와 같아지므로 성조 없이 쓴 손님에게만 쓴다.
const TONELESS_ONLY = /\bgiu\s+cho\b|\bcon\s+ban\s+(trong|khong)\b/;

export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

export function isBookingIntent(text: string): boolean {
  const raw = text.normalize("NFC").toLowerCase();
  if (RAW_WORDS.test(raw)) return true;
  const folded = fold(text);
  if (FOLDED_WORDS.test(folded)) return true;
  return folded === raw && TONELESS_ONLY.test(folded);
}
