/* [Define404] 부킹냥(booking-meo) 홈페이지 위젯
 * <script src="https://<워커 주소>/widget.js" data-title="모락 베이커리" defer></script>
 * 선택: data-color="#C94A22" data-greeting="안녕하세요..." data-api="https://<워커 주소>"
 */
(function () {
  var me = document.currentScript;
  var base = (me && me.src ? me.src : location.href).replace(/\/[^/]*$/, "");
  var ds = (me && me.dataset) || {};
  var cfg = {
    api: (ds.api || base).replace(/\/$/, ""),
    title: ds.title || "상담",
    color: ds.color || "#C94A22",
    greeting: ds.greeting || "",
  };
  // 화면 문구. 처음에는 브라우저 언어, 손님이 다른 언어로 쓰면 서버가 알려 준 언어로 바꾼다
  var I18N = {
    ko: { status: "보통 바로 답해 드려요", ph: "메시지를 입력하세요", send: "보내기", ask: "사장님께 직접 문의 남기기", name: "이름", contact: "연락처 (전화 또는 메일)", msg: "문의 내용 (예약이면 날짜, 시간, 인원)", consent: "[필수] 개인정보 수집·이용에 동의합니다. 목적: 문의 답변을 위해 사장님께 전달. 항목: 이름, 연락처, 문의 내용. 보유: 30일 뒤 삭제. 동의하지 않을 수 있으며, 그 경우 문의를 남길 수 없고 상담 창 질문은 계속 쓸 수 있습니다.", cancel: "취소", wait: "답변을 준비하고 있습니다", done: "문의가 접수됐습니다. 사장님이 확인 후 연락드리겠습니다.", hello: "안녕하세요. 궁금한 점을 편하게 물어보세요.", close: "닫기", open: "상담 열기" },
    en: { status: "We usually reply right away", ph: "Type a message", send: "Send", ask: "Leave a message for the owner", name: "Name", contact: "Phone or email", msg: "Message (for bookings: date, time, people)", consent: "[Required] I agree to the collection of personal information. Purpose: passing my message to the owner. Items: name, contact, message. Retention: deleted after 30 days. I may refuse; then I cannot leave a message but can keep chatting.", cancel: "Cancel", wait: "Preparing an answer", done: "Your message has been sent. The owner will contact you soon.", hello: "Hello! Ask us anything.", close: "Close", open: "Open chat" },
    vi: { status: "Thường trả lời ngay", ph: "Nhập tin nhắn", send: "Gửi", ask: "Để lại lời nhắn cho chủ cửa hàng", name: "Tên", contact: "Số điện thoại hoặc email", msg: "Nội dung (đặt chỗ: ngày, giờ, số người)", consent: "[Bắt buộc] Tôi đồng ý cho thu thập thông tin cá nhân. Mục đích: chuyển lời nhắn tới chủ cửa hàng. Thông tin: tên, liên hệ, nội dung. Thời hạn: xóa sau 30 ngày. Tôi có quyền từ chối; khi đó không thể để lại lời nhắn nhưng vẫn trò chuyện được.", cancel: "Hủy", wait: "Đang chuẩn bị câu trả lời", done: "Đã gửi lời nhắn. Chủ cửa hàng sẽ liên hệ với bạn sớm.", hello: "Xin chào! Bạn cứ hỏi nhé.", close: "Đóng", open: "Mở trò chuyện" },
    ja: { status: "通常すぐにお答えします", ph: "メッセージを入力", send: "送信", ask: "店主にお問い合わせ", name: "お名前", contact: "電話番号またはメール", msg: "内容 (ご予約は日付・時間・人数)", consent: "[必須] 個人情報の収集・利用に同意します。目的: 店主へお伝えし返信を受けるため。項目: 名前、連絡先、内容。保管: 30日後に削除。同意しないこともでき、その場合お問い合わせは残せませんがチャットは続けられます。", cancel: "キャンセル", wait: "回答を準備しています", done: "お問い合わせを受け付けました。店主からご連絡します。", hello: "こんにちは。お気軽にご質問ください。", close: "閉じる", open: "チャットを開く" },
    zh: { status: "通常会立即回复", ph: "输入消息", send: "发送", ask: "给店主留言", name: "姓名", contact: "电话或邮箱", msg: "留言内容 (预约请写日期、时间、人数)", consent: "[必选] 我同意收集个人信息。目的：转告店主以便回复。项目：姓名、联系方式、内容。保存：30天后删除。我可以拒绝；拒绝后无法留言，但仍可继续聊天。", cancel: "取消", wait: "正在准备回答", done: "留言已发送，店主确认后会联系您。", hello: "您好！欢迎随时提问。", close: "关闭", open: "打开聊天" },
    th: { status: "ปกติตอบทันที", ph: "พิมพ์ข้อความ", send: "ส่ง", ask: "ฝากข้อความถึงเจ้าของร้าน", name: "ชื่อ", contact: "เบอร์โทรหรืออีเมล", msg: "รายละเอียด (จอง: วันที่ เวลา จำนวนคน)", consent: "[จำเป็น] ฉันยินยอมให้เก็บข้อมูลส่วนบุคคล วัตถุประสงค์: ส่งข้อความถึงเจ้าของร้าน ข้อมูล: ชื่อ ช่องทางติดต่อ ข้อความ ระยะเวลา: ลบหลัง 30 วัน ฉันปฏิเสธได้ แต่จะฝากข้อความไม่ได้ ยังแชตต่อได้", cancel: "ยกเลิก", wait: "กำลังเตรียมคำตอบ", done: "ส่งข้อความแล้ว เจ้าของร้านจะติดต่อกลับเร็วๆ นี้", hello: "สวัสดี! สอบถามได้เลย", close: "ปิด", open: "เปิดแชต" },
  };
  function pickLang(l) { l = String(l || "").slice(0, 2).toLowerCase(); return I18N[l] ? l : "ko"; }
  var LOTTIE = "https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie_light.min.js";

  var KEY = "booking-meo:" + location.host;
  var state = load();
  function load() {
    try {
      var s = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (s && s.id) return s;
    } catch (e) {}
    var id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)).replace(/[^a-zA-Z0-9-]/g, "");
    return { id: id, log: [], lang: pickLang(navigator.language) };
  }
  function save() {
    state.log = state.log.slice(-40);
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  var host = document.createElement("div");
  host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483000";
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  root.innerHTML =
    "<style>" +
    ":host{all:initial}" +
    '*{box-sizing:border-box;font-family:Pretendard,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",sans-serif}' +
    ".wrap{display:flex;flex-direction:column;align-items:flex-end}" +
    ".fab{width:60px;height:60px;border-radius:50%;border:0;padding:4px;background:var(--c);cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.2);transition:transform .15s}" +
    ".fab:hover{transform:translateY(-2px)}" +
    ".fab .cat,.head .cat{width:100%;height:100%}" +
    ".panel{display:none;flex-direction:column;width:min(370px,calc(100vw - 32px));height:min(560px,calc(100vh - 110px));background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,.18);margin-bottom:12px}" +
    ".open .panel{display:flex}" +
    ".head{background:var(--c);color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px}" +
    ".head .av{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.18);padding:2px;flex:none}" +
    ".head .t{flex:1;min-width:0}" +
    ".head .t b{display:block;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".head .t span{font-size:12px;opacity:.85}" +
    ".head button{background:none;border:0;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:4px}" +
    ".log{flex:1;overflow-y:auto;padding:14px;background:#F7F5F3;display:flex;flex-direction:column;gap:8px}" +
    ".b{max-width:85%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.55;white-space:pre-wrap;word-break:keep-all;overflow-wrap:anywhere}" +
    ".bot{background:#fff;border:1px solid #ECE7E3;align-self:flex-start;border-top-left-radius:4px;color:#2A211D}" +
    ".user{background:var(--c);color:#fff;align-self:flex-end;border-top-right-radius:4px}" +
    ".wait{align-self:flex-start;color:#8A7F78;font-size:13px}" +
    ".link{align-self:flex-start;display:inline-block;margin-top:-2px;padding:8px 12px;border-radius:10px;background:#03C75A;color:#fff;font-size:13px;font-weight:600;text-decoration:none}" +
    "form.chat{display:flex;border-top:1px solid #ECE7E3;background:#fff}" +
    "form.chat input{flex:1;border:0;padding:13px 14px;font-size:14px;outline:none;min-width:0}" +
    "form.chat button{border:0;background:none;color:var(--c);font-weight:700;padding:0 14px;cursor:pointer}" +
    ".ask{border:0;border-top:1px solid #ECE7E3;background:#fff;color:#4A403B;font-size:13px;padding:10px;cursor:pointer}" +
    "form.inq{display:none;flex-direction:column;gap:8px;padding:14px;border-top:1px solid #ECE7E3;background:#fff}" +
    ".inq-on form.inq{display:flex}.inq-on form.chat,.inq-on .ask{display:none}" +
    "form.inq input[type=text],form.inq textarea{border:1px solid #DDD5CF;border-radius:8px;padding:9px 10px;font-size:14px;width:100%}" +
    "form.inq textarea{min-height:72px;resize:vertical}" +
    "form.inq label{display:flex;gap:6px;align-items:flex-start;font-size:12px;color:#5A504A;line-height:1.45;word-break:keep-all}" +
    "form.inq .row{display:flex;gap:8px}" +
    "form.inq .row button{flex:1;border:0;border-radius:8px;padding:10px;font-size:14px;cursor:pointer}" +
    ".send{background:var(--c);color:#fff}.cancel{background:#EFEAE6;color:#2A211D}" +
    ".hp{position:absolute;left:-9999px}" +
    ".by{font-size:11px;color:#A0958E;text-align:center;padding:6px;background:#fff}" +
    "</style>" +
    '<div class="wrap" style="--c:' + esc(cfg.color) + '">' +
    '<div class="panel" role="dialog" aria-label="' + esc(cfg.title) + ' 상담">' +
    '<div class="head"><div class="av"><div class="cat" data-cat="head"></div></div>' +
    '<div class="t"><b>' + esc(cfg.title) + '</b><span data-i="status"></span></div>' +
    '<button type="button" class="x" data-i-aria="close">&times;</button></div>' +
    '<div class="log" aria-live="polite"></div>' +
    '<form class="chat"><input name="q" data-i-ph="ph" autocomplete="off" maxlength="1000"><button data-i="send"></button></form>' +
    '<button type="button" class="ask" data-i="ask"></button>' +
    '<form class="inq">' +
    '<input type="text" name="name" data-i-ph="name" maxlength="50" required>' +
    '<input type="text" name="contact" data-i-ph="contact" maxlength="100" required>' +
    '<textarea name="message" data-i-ph="msg" maxlength="2000" required></textarea>' +
    '<label><input type="checkbox" name="consent" required> <span data-i="consent"></span></label>' +
    '<input name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    '<div class="row"><button type="button" class="cancel" data-i="cancel"></button><button class="send" data-i="send"></button></div>' +
    "</form>" +
    '<div class="by">부킹냥</div>' +
    "</div>" +
    '<button type="button" class="fab" data-i-aria="open"><div class="cat" data-cat="fab"></div></button>' +
    "</div>";

  var wrap = root.querySelector(".wrap");
  var log = root.querySelector(".log");
  var chatForm = root.querySelector("form.chat");
  var inqForm = root.querySelector("form.inq");
  var cats = {};

  function L() { return I18N[state.lang] || I18N.ko; }
  function applyLang() {
    var d = L();
    root.querySelectorAll("[data-i]").forEach(function (el) { el.textContent = d[el.getAttribute("data-i")]; });
    root.querySelectorAll("[data-i-ph]").forEach(function (el) { el.placeholder = d[el.getAttribute("data-i-ph")]; el.setAttribute("aria-label", el.placeholder); });
    root.querySelectorAll("[data-i-aria]").forEach(function (el) { el.setAttribute("aria-label", d[el.getAttribute("data-i-aria")]); });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  // 마스코트: 로티가 안 뜨면 정지 이미지로 대신한다
  function mountCats() {
    root.querySelectorAll("[data-cat]").forEach(function (el) {
      el.innerHTML = '<img src="' + base + '/cat.svg" alt="" style="width:100%;height:100%">';
    });
    var s = document.createElement("script");
    s.src = LOTTIE;
    s.onload = function () {
      fetch(base + "/mascot.json").then(function (r) { return r.json(); }).then(function (data) {
        root.querySelectorAll("[data-cat]").forEach(function (el) {
          el.innerHTML = "";
          var a = window.lottie.loadAnimation({ container: el, renderer: "svg", loop: true, autoplay: true, animationData: data });
          a.playSegments([0, 90], true);
          cats[el.getAttribute("data-cat")] = a;
        });
      }).catch(function () {});
    };
    document.head.appendChild(s);
  }
  function typing(on) {
    var a = cats.head;
    if (a) a.playSegments(on ? [90, 150] : [0, 90], true);
  }

  function bubble(cls, text) {
    var d = document.createElement("div");
    d.className = "b " + cls;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }
  function linkBtn(b) {
    if (!/^https:\/\//.test(b.url)) return;
    var a = document.createElement("a");
    a.className = "link";
    a.href = b.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = b.label;
    log.appendChild(a);
    log.scrollTop = log.scrollHeight;
  }
  function render() {
    log.innerHTML = "";
    bubble("bot", cfg.greeting || L().hello);
    state.log.forEach(function (m) {
      bubble(m.r === "u" ? "user" : "bot", m.t);
      (m.b || []).forEach(linkBtn);
    });
  }
  function post(path, body) {
    return fetch(cfg.api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) {
        return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "잠시 후 다시 시도해 주세요"); return j; });
      });
  }

  var started = false;
  root.querySelector(".fab").onclick = function () {
    wrap.classList.toggle("open");
    if (wrap.classList.contains("open")) {
      if (!started) { started = true; render(); }
      chatForm.q.focus();
    }
  };
  root.querySelector(".x").onclick = function () { wrap.classList.remove("open"); };
  root.querySelector(".ask").onclick = function () { wrap.classList.add("inq-on"); inqForm.name.focus(); };
  root.querySelector(".cancel").onclick = function () { wrap.classList.remove("inq-on"); };

  var busy = false;
  chatForm.onsubmit = function (e) {
    e.preventDefault();
    var q = chatForm.q.value.trim();
    if (!q || busy) return;
    busy = true;
    chatForm.q.value = "";
    state.log.push({ r: "u", t: q });
    save();
    bubble("user", q);
    var w = bubble("wait", L().wait);
    typing(true);
    post("/api/chat", { sessionId: state.id, message: q, lang: state.lang })
      .then(function (j) {
        if (j.lang && I18N[j.lang] && j.lang !== state.lang) { state.lang = j.lang; applyLang(); }
        state.log.push({ r: "a", t: j.text, b: j.buttons || [] });
        save();
        w.remove();
        bubble("bot", j.text);
        (j.buttons || []).forEach(linkBtn);
      })
      .catch(function (err) { w.remove(); bubble("bot", err.message); })
      .then(function () { busy = false; typing(false); });
  };

  inqForm.onsubmit = function (e) {
    e.preventDefault();
    var f = inqForm;
    post("/api/inquiry", {
      sessionId: state.id, name: f.name.value, contact: f.contact.value, message: f.message.value,
      consent: f.consent.checked, website: f.website.value, lang: state.lang,
    })
      .then(function () {
        f.reset();
        wrap.classList.remove("inq-on");
        var t = L().done;
        state.log.push({ r: "a", t: t });
        save();
        bubble("bot", t);
      })
      .catch(function (err) { bubble("bot", err.message); wrap.classList.remove("inq-on"); });
  };

  applyLang();
  mountCats();
})();
