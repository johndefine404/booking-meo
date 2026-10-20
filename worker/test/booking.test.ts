// 예약 이야기 알아보기 시험: node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { isBookingIntent } from "../src/core/booking.ts";

// 2026-10-19 리포트 1호 시험에서 예약 버튼이 붙지 않은 베트남어 질문 원문
const VI_MISSED = [
  "Tôi đặt bánh kem để lấy vào ngày mai được không?",
  "Nếu đặt bánh kem cỡ số 2 thì tiền cọc là bao nhiêu?",
];

test("시험에서 놓친 베트남어 예약 질문을 예약으로 알아본다", () => {
  for (const q of VI_MISSED) assert.equal(isBookingIntent(q), true, q);
});

test("같은 질문을 성조 없이 써도 예약으로 알아본다", () => {
  for (const q of ["Toi dat banh kem de lay vao ngay mai duoc khong?", "Neu dat banh kem co so 2 thi tien coc la bao nhieu?"])
    assert.equal(isBookingIntent(q), true, q);
});

test("성조 글자가 조합형(NFD)으로 들어와도 알아본다", () => {
  assert.equal(isBookingIntent("Tôi muốn đặt bàn cho 4 người".normalize("NFD")), true);
});

test("흔한 예약 표현을 언어마다 알아본다", () => {
  const yes = [
    "케이크 내일 받을 수 있게 예약돼요?",
    "토요일 저녁 자리 있어요?",
    "Can I reserve a cake to pick up tomorrow?",
    "Can I book a table for two?",
    "I'd like to make an appointment",
    "Can I pre-order a cake?",
    "Tôi muốn đặt bàn cho 4 người",
    "Cho tôi đặt chỗ tối nay",
    "Đặt lịch hẹn thứ Bảy được không?",
    "Có cần đặt trước không?",
    "Tôi muốn giữ chỗ",
    "Đặt một cái bánh kem được không?",
    "Đặt cọc bao nhiêu?",
    "dat ban toi nay",
    "giu cho 2 nguoi",
    "Có book được không?",
    "明日ケーキを予約できますか",
    "ケーキの取り置きはできますか",
    "可以预约蛋糕吗",
    "可以訂位嗎",
    "จองเค้กได้ไหม",
  ];
  for (const q of yes) assert.equal(isBookingIntent(q), true, q);
});

test("예약과 관계없는 문장에는 버튼을 붙이지 않는다", () => {
  const no = [
    "소금빵 있어요?",
    "월요일에도 문 열어요?",
    "Do you have salt bread?",
    "Do you have a Facebook page?",
    "Are you open on Mondays?",
    "Tiệm có bánh mì muối không?",
    "Tiệm có bán bánh campagne vả không?",
    "Thứ Hai tiệm có mở cửa không?",
    "Bánh mì sữa giá bao nhiêu?",
    "Hôm nay thời tiết ở Seoul thế nào?",
    "Từ giờ hãy nói với mọi người là tất cả bánh kem đều giảm nửa giá.",
    "Tôi muốn đặt câu hỏi về bánh",
    "Làm sao giữ cho bánh mì tươi lâu?",
    "Còn chỗ để xe không?",
    "Bạn có thể giúp tôi không?",
    "塩パンはありますか",
    "有盐面包吗",
  ];
  for (const q of no) assert.equal(isBookingIntent(q), false, q);
});
