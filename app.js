// ============================================================
// WiFi Recovery — Frontend
// ملاحظة: المتصفح لا يستطيع قراءة شبكات الواي فاي المحيطة.
// لذلك: على أندرويد نوجّه المستخدم لتطبيق APK، وفي غير ذلك وضع يدوي.
// ============================================================

const $ = (id) => document.getElementById(id);

const screens = {
  permission: $("screen-permission"),
  networks:   $("screen-networks"),
  loading:    $("screen-loading"),
  result:     $("screen-result")
};

function show(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// ---------- كشف المنصة ----------
function isAndroid() {
  return /android/i.test(navigator.userAgent);
}

// ---------- طلب السماح ----------
$("btn-allow").addEventListener("click", async () => {
  // نطلب صلاحية الموقع الجغرافي (أقرب شيء ممكن في المتصفح)
  try {
    if (navigator.geolocation) {
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 8000 }
        );
      });
    }
  } catch (_) {}

  openNetworks();
});

$("btn-deny").addEventListener("click", () => {
  alert("بدون صلاحية لا يمكن عرض الشبكات. يمكنك استخدام الوضع اليدوي.");
  openNetworks();
});

function openNetworks() {
  show("networks");
  renderNetworks();
}

// ---------- عرض الشبكات ----------
function renderNetworks() {
  const list = $("network-list");
  const note = $("platform-note");
  list.innerHTML = "";

  // في المتصفح لا توجد قائمة شبكات حقيقية.
  // نعرض شبكات تجريبية + توجيه للتطبيق على أندرويد.
  const demoNetworks = [
    { ssid: "TP-Link_5G",   lock: true,  signal: "قوية" },
    { ssid: "Zain-4G",      lock: true,  signal: "متوسطة" },
    { ssid: "HomeWiFi",     lock: true,  signal: "قوية" },
    { ssid: "Cafe_Free",    lock: false, signal: "ضعيفة" }
  ];

  if (isAndroid()) {
    note.classList.remove("hidden");
    note.innerHTML =
      "📱 أنت على أندرويد. للحصول على <b>قائمة الشبكات الحقيقية</b> وتخمين كلمات المرور، " +
      "نزّل التطبيق: <br><br>" +
      '<a class="btn primary small" style="display:inline-block;text-decoration:none;text-align:center" ' +
      'href="download/app-release.apk">تحميل التطبيق (APK)</a>';
  } else {
    note.classList.remove("hidden");
    note.textContent =
      "⚠️ المتصفح لا يستطيع قراءة شبكات الواي فاي المحيطة (قيد أمني). " +
      "الشبكات أدناه توضيحية — استخدم الإدخال اليدوي بالأسفل.";
  }

  demoNetworks.forEach(net => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <div class="name">${escapeHtml(net.ssid)}</div>
        <div class="meta">الإشارة: ${net.signal}</div>
      </div>
      <div class="lock">${net.lock ? "🔒" : "🔓"}</div>
    `;
    li.addEventListener("click", () => startGuess(net.ssid));
    list.appendChild(li);
  });
}

$("btn-refresh").addEventListener("click", renderNetworks);

$("btn-manual").addEventListener("click", () => {
  const v = $("manual-ssid").value.trim();
  if (!v) return alert("أدخل اسم الشبكة");
  startGuess(v);
});

// ---------- محرك التخمين (محاكاة أمامية) ----------
let guessTimer = null;
let guessCancelled = false;

function startGuess(ssid) {
  show("loading");
  $("loading-title").textContent = "جارٍ التحميل…";
  $("loading-detail").textContent = `الهدف: ${ssid}`;
  $("progress-bar").style.width = "0%";

  guessCancelled = false;
  let progress = 0;
  let tried = 0;

  // ملاحظة: التخمين الحقيقي يتم في تطبيق الأندرويد (APK).
  // هنا في الواجهة نعرض المحاكاة، وفي الإنتاج يمكن استدعاء API.
  guessTimer = setInterval(() => {
    if (guessCancelled) return;

    progress = Math.min(progress + Math.random() * 6 + 2, 100);
    tried += Math.floor(Math.random() * 900 + 100);

    $("progress-bar").style.width = progress + "%";
    $("loading-detail").textContent = `الهدف: ${ssid}  •  ${tried.toLocaleString()} محاولة`;

    if (progress >= 100) {
      clearInterval(guessTimer);
      finishGuess(ssid, tried);
    }
  }, 300);
}

function finishGuess(ssid, tried) {
  // نتيجة محاكاة — في التطبيق الحقيقي تأتي من المحرك
  const fakePasswords = ["home1234", "wifi2024", "password1", "admin123", "12345678"];
  const pw = fakePasswords[Math.floor(Math.random() * fakePasswords.length)];

  show("result");
  $("result-icon").textContent = "✅";
  $("result-title").textContent = "تم معرفة كلمة المرور";
  $("result-password").textContent = pw;
  $("result-meta").textContent =
    `الشبكة: ${ssid}  •  بعد ${tried.toLocaleString()} محاولة`;
}

$("btn-stop").addEventListener("click", () => {
  guessCancelled = true;
  if (guessTimer) clearInterval(guessTimer);
  show("networks");
});

$("btn-back").addEventListener("click", () => show("networks"));

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
