/* ===========================
   MoodCalendar v3 — JavaScript
   ・今日だけ編集可能
   ・翌日以降は閲覧のみ
   ・スマホ/PC UI判定
   ・ポップなアニメーション制御
=========================== */

/* ---------------------------
   日付フォーマット
--------------------------- */
function formatDateKey(date) {
  return date.toISOString().split("T")[0];
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ---------------------------
   localStorage
--------------------------- */
function loadEntries() {
  return JSON.parse(localStorage.getItem("moodEntries") || "{}");
}

function saveEntries(entries) {
  localStorage.setItem("moodEntries", JSON.stringify(entries));
}

/* ---------------------------
   UI要素取得
--------------------------- */
const calendarEl = document.getElementById("calendar");
const monthLabel = document.getElementById("month-label");
const todayLabel = document.getElementById("today-label");

const modalBackdrop = document.getElementById("modal-backdrop");
const modalClose = document.getElementById("modal-close");
const moodButtons = document.querySelectorAll(".mood-option");
const noteEl = document.getElementById("note");
const charCount = document.getElementById("char-count");
const saveBtn = document.getElementById("save-btn");
const clearBtn = document.getElementById("clear-btn");

const selectedDayInfo = document.getElementById("selected-day-info");
const selectedNoteBox = document.getElementById("selected-note-box");

const graphEl = document.getElementById("graph");
const graphLabelsEl = document.getElementById("graph-labels");
const moodDistributionEl = document.getElementById("mood-distribution");

const helpBtn = document.getElementById("help-btn");
const helpBackdrop = document.getElementById("help-backdrop");
const helpClose = document.getElementById("help-close");

const analysisBtn = document.getElementById("analysis-btn");
const analysisBackdrop = document.getElementById("analysis-backdrop");
const analysisClose = document.getElementById("analysis-close");

const badThingsEl = document.getElementById("bad-things");
const blowAwayBtn = document.getElementById("blow-away-btn");
const effectContainer = document.getElementById("effect-container");

/* ---------------------------
   状態
--------------------------- */
let currentDate = new Date();
let selectedDate = null;
let selectedMood = null;

/* ---------------------------
   スマホ判定
--------------------------- */
function isMobile() {
  return window.innerWidth < 768;
}

/* ---------------------------
   カレンダー描画
--------------------------- */
function renderCalendar() {
  calendarEl.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthLabel.textContent = `${year}年 ${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const entries = loadEntries();
  const today = new Date();

  // 空白
  for (let i = 0; i < startWeekday; i++) {
    const blank = document.createElement("div");
    calendarEl.appendChild(blank);
  }

  // 日付
  for (let d = 1; d <= totalDays; d++) {
    const cell = document.createElement("div");
    cell.className = "day";

    const dateObj = new Date(year, month, d);
    const key = formatDateKey(dateObj);

    // 今日
    if (sameDay(dateObj, today)) {
      cell.classList.add("day-today");
    }

    // mood
    if (entries[key]) {
      const mood = entries[key].mood;
      cell.classList.add(`mood-${mood}`);

      const label = document.createElement("div");
      label.className = "day-mood-label";
      label.textContent = entries[key].label;
      cell.appendChild(label);
    }

    const num = document.createElement("div");
    num.className = "day-number";
    num.textContent = d;
    cell.appendChild(num);

    // クリック
    cell.addEventListener("click", () => onDayClick(dateObj));

    calendarEl.appendChild(cell);
  }
}

/* ---------------------------
   日付クリック
--------------------------- */
function onDayClick(dateObj) {
  selectedDate = dateObj;
  const key = formatDateKey(dateObj);
  const entries = loadEntries();
  const today = new Date();

  // 選択日表示
  updateSelectedDayDisplay();

  // 今日以外 → 編集禁止
  if (!sameDay(dateObj, today)) {
    return; // モーダル開かない
  }

  // 今日 → 編集可能
  openModal();

  // 既存データ
  if (entries[key]) {
    selectedMood = entries[key].mood;
    noteEl.value = entries[key].note;
    charCount.textContent = `${noteEl.value.length} / 120`;

    moodButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mood === selectedMood);
    });
  } else {
    selectedMood = null;
    noteEl.value = "";
    charCount.textContent = "0 / 120";
    moodButtons.forEach((btn) => btn.classList.remove("active"));
  }
}

/* ---------------------------
   選択日表示（右側）
--------------------------- */
function updateSelectedDayDisplay() {
  if (!selectedDate) {
    selectedDayInfo.textContent = "まだ日付が選択されていません。";
    selectedNoteBox.innerHTML = `<span class="note-empty">メモはまだありません。</span>`;
    return;
  }

  const key = formatDateKey(selectedDate);
  const entries = loadEntries();

  selectedDayInfo.textContent = `${selectedDate.getFullYear()}年 ${
    selectedDate.getMonth() + 1
  }月 ${selectedDate.getDate()}日`;

  if (entries[key]) {
    selectedNoteBox.textContent = entries[key].note || "（メモなし）";
  } else {
    selectedNoteBox.innerHTML = `<span class="note-empty">メモはまだありません。</span>`;
  }
}

/* ---------------------------
   モーダル
--------------------------- */
function openModal() {
  modalBackdrop.classList.add("show");
}

function closeModal() {
  modalBackdrop.classList.remove("show");
}

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});

/* ---------------------------
   気分ボタン
--------------------------- */
moodButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    moodButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedMood = btn.dataset.mood;
  });
});

/* ---------------------------
   メモ文字数
--------------------------- */
noteEl.addEventListener("input", () => {
  charCount.textContent = `${noteEl.value.length} / 120`;
});

/* ---------------------------
   保存
--------------------------- */
saveBtn.addEventListener("click", () => {
  if (!selectedDate || !selectedMood) return;

  const key = formatDateKey(selectedDate);
  const entries = loadEntries();

  const moodLabels = {
    bad: "しんどい",
    meh: "ふつう",
    good: "わりと良い",
    great: "最高",
  };

  entries[key] = {
    mood: selectedMood,
    label: moodLabels[selectedMood],
    note: noteEl.value,
    createdAt: new Date().toISOString(),
  };

  saveEntries(entries);
  closeModal();
  renderCalendar();
  updateSelectedDayDisplay();
});

/* ---------------------------
   クリア
--------------------------- */
clearBtn.addEventListener("click", () => {
  noteEl.value = "";
  charCount.textContent = "0 / 120";
});

/* ---------------------------
   月移動
--------------------------- */
document.getElementById("prev-month").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById("next-month").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

/* ---------------------------
   使い方モーダル
--------------------------- */
helpBtn.addEventListener("click", () => {
  helpBackdrop.classList.add("show");
});

helpClose.addEventListener("click", () => {
  helpBackdrop.classList.remove("show");
});

helpBackdrop.addEventListener("click", (e) => {
  if (e.target === helpBackdrop) helpBackdrop.classList.remove("show");
});

/* ---------------------------
   グラフ描画
--------------------------- */
function renderGraph() {
  const entries = loadEntries();
  const today = new Date();

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  graphEl.innerHTML = "";
  graphLabelsEl.innerHTML = "";

  days.forEach((d) => {
    const key = formatDateKey(d);
    const bar = document.createElement("div");
    bar.className = "graph-bar";

    const inner = document.createElement("div");
    inner.className = "graph-bar-inner";

    if (entries[key]) {
      const moodScore = { bad: 1, meh: 2, good: 3, great: 4 }[
        entries[key].mood
      ];
      inner.style.setProperty("--bar-height", `${(moodScore / 4) * 100}%`);
    } else {
      inner.style.setProperty("--bar-height", "0%");
    }

    bar.appendChild(inner);
    graphEl.appendChild(bar);

    const label = document.createElement("div");
    label.textContent = d.getDate();
    graphLabelsEl.appendChild(label);
  });
}

/* ---------------------------
   初期化
--------------------------- */
function init() {
  const today = new Date();
  todayLabel.textContent = `${today.getMonth() + 1}月${today.getDate()}日`;

  renderCalendar();
}

/* ---------------------------
   分析モーダル
--------------------------- */
function openAnalysisModal() {
  renderGraph();
  renderMoodDistribution();
  analysisBackdrop.classList.add("show");
}

function closeAnalysisModal() {
  analysisBackdrop.classList.remove("show");
}

analysisBtn.addEventListener("click", openAnalysisModal);
analysisClose.addEventListener("click", closeAnalysisModal);
analysisBackdrop.addEventListener("click", (e) => {
  if (e.target === analysisBackdrop) closeAnalysisModal();
});

/* ---------------------------
   ムード分布レンダリング
--------------------------- */
function renderMoodDistribution() {
  const entries = loadEntries();
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const moodCounts = { bad: 0, meh: 0, good: 0, great: 0 };
  let total = 0;

  Object.keys(entries).forEach((key) => {
    const date = new Date(key);
    if (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    ) {
      moodCounts[entries[key].mood]++;
      total++;
    }
  });

  moodDistributionEl.innerHTML = "";

  const moods = [
    { key: "bad", label: "しんどい", emoji: "😣" },
    { key: "meh", label: "ふつう", emoji: "😐" },
    { key: "good", label: "わりと良い", emoji: "🙂" },
    { key: "great", label: "最高", emoji: "😄" },
  ];

  moods.forEach((mood) => {
    const count = moodCounts[mood.key];
    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

    const barDiv = document.createElement("div");
    barDiv.className = "mood-dist-bar";

    const label = document.createElement("div");
    label.className = "mood-dist-label";
    label.textContent = `${mood.emoji} ${mood.label}`;

    const container = document.createElement("div");
    container.className = "mood-dist-container";

    const fill = document.createElement("div");
    fill.className = `mood-dist-fill ${mood.key}`;
    fill.style.width = `${percent}%`;
    if (percent > 0) {
      fill.textContent = `${count}`;
    }

    container.appendChild(fill);

    const percentEl = document.createElement("div");
    percentEl.className = "mood-dist-percent";
    percentEl.textContent = `${percent}%`;

    barDiv.appendChild(label);
    barDiv.appendChild(container);
    barDiv.appendChild(percentEl);

    moodDistributionEl.appendChild(barDiv);
  });
}

/* ---------------------------
   嫌なことを飛ばす
--------------------------- */

function destroyBadThings() {
  if (!badThingsEl.value.trim()) {
    alert("嫌なことを書いてから飛ばしてください！");
    return;
  }

  // ランダムに3つの効果から1つを選ぶ
  const effects = ["rocket", "blast", "shredder"];
  const selectedEffect = effects[Math.floor(Math.random() * effects.length)];

  // 画面を揺らす
  document.body.classList.add("screen-shake");
  
  // ボタンとテキストエリアを無効化して視覚効果を追加
  blowAwayBtn.disabled = true;
  blowAwayBtn.classList.add("button-shake");
  badThingsEl.classList.add("textarea-destroying");
  badThingsEl.disabled = true;

  // フラッシュエフェクト
  const flash = document.createElement("div");
  flash.className = "flash-overlay";
  effectContainer.appendChild(flash);

  // テキストエリアの位置情報を取得
  const rect = badThingsEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  if (selectedEffect === "rocket") {
    createRocketEffect(centerX, centerY);
  } else if (selectedEffect === "blast") {
    createBlastEffect(centerX, centerY);
  } else if (selectedEffect === "shredder") {
    createShredderEffect(centerX, centerY);
  }

  // 1.5秒後にリセット
  setTimeout(() => {
    badThingsEl.value = "";
    blowAwayBtn.classList.remove("button-shake");
    badThingsEl.classList.remove("textarea-destroying");
    document.body.classList.remove("screen-shake");
    blowAwayBtn.disabled = false;
    badThingsEl.disabled = false;
    effectContainer.innerHTML = "";
  }, 1500);
}

function createRocketEffect(centerX, centerY) {
  // 複数のロケット
  const rocketCount = 5;
  for (let i = 0; i < rocketCount; i++) {
    const rocket = document.createElement("div");
    rocket.className = "rocket-effect";
    rocket.textContent = "🚀";
    const offsetX = (Math.random() - 0.5) * 150;
    rocket.style.left = (centerX + offsetX) + "px";
    rocket.style.top = centerY + "px";
    rocket.style.animationDelay = i * 0.08 + "s";
    effectContainer.appendChild(rocket);

    // 各ロケットの爆発エフェクト
    const explosion = document.createElement("div");
    explosion.className = "explosion";
    explosion.style.left = (centerX + offsetX - 150) + "px";
    explosion.style.top = (centerY - 800) + "px";
    explosion.style.background = "radial-gradient(circle, rgba(255, 200, 0, 0.7), rgba(255, 100, 0, 0.4), rgba(255, 50, 0, 0.2))";
    explosion.style.animationDelay = (0.35 + i * 0.08) + "s";
    effectContainer.appendChild(explosion);
  }

  // 大量の炎パーティクル
  for (let i = 0; i < 60; i++) {
    const particle = document.createElement("div");
    particle.className = "particle fire";
    const angle = (Math.PI * 2 * i) / 60;
    const velocity = 250 + Math.random() * 200;
    particle.style.left = centerX + "px";
    particle.style.top = centerY + "px";
    const size = 10 + Math.random() * 25;
    particle.style.width = size + "px";
    particle.style.height = size + "px";
    particle.style.animation = "blastFly 1.5s ease-out forwards";
    particle.style.setProperty("--tx", Math.cos(angle) * velocity + "px");
    particle.style.setProperty("--ty", Math.sin(angle) * velocity - 600 + "px");
    if (Math.random() > 0.7) {
      particle.classList.add("particle-big");
    }
    effectContainer.appendChild(particle);
  }

  // 追加の爆発テキスト
  for (let i = 0; i < 3; i++) {
    const boom = document.createElement("div");
    boom.style.position = "fixed";
    boom.style.fontSize = (100 - i * 20) + "px";
    boom.style.fontWeight = "bold";
    boom.style.color = "rgba(255, 200, 0, " + (0.8 - i * 0.2) + ")";
    boom.style.textShadow = "0 0 40px rgba(255, 200, 0, 0.9)";
    boom.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 60 - 30}deg)`;
    boom.style.left = (centerX + (Math.random() - 0.5) * 200) + "px";
    boom.style.top = (centerY + (Math.random() - 0.5) * 150) + "px";
    boom.style.animation = "blastFly 1.5s ease-out forwards";
    boom.style.setProperty("--tx", (Math.random() - 0.5) * 400 + "px");
    boom.style.setProperty("--ty", -600 + "px");
    boom.textContent = "💥";
    boom.style.pointerEvents = "none";
    effectContainer.appendChild(boom);
  }
}

function createBlastEffect(centerX, centerY) {
  // 複数の衝撃波
  for (let w = 0; w < 3; w++) {
    const shockwave = document.createElement("div");
    shockwave.className = "shockwave";
    shockwave.style.left = (centerX - 40) + "px";
    shockwave.style.top = (centerY - 40) + "px";
    shockwave.style.animationDelay = (w * 0.15) + "s";
    effectContainer.appendChild(shockwave);
  }

  // 爆発テキスト（大量）
  for (let t = 0; t < 5; t++) {
    const blastText = document.createElement("div");
    blastText.style.position = "fixed";
    blastText.style.left = (centerX + (Math.random() - 0.5) * 200) + "px";
    blastText.style.top = (centerY + (Math.random() - 0.5) * 200) + "px";
    blastText.style.fontSize = (60 + Math.random() * 60) + "px";
    blastText.style.fontWeight = "bold";
    blastText.style.color = "rgba(255, 150, 0, 0.9)";
    blastText.style.textShadow = "0 0 50px rgba(255, 150, 0, 0.8)";
    blastText.style.transform = "translate(-50%, -50%)";
    blastText.style.animation = "blastFly 1.5s ease-out forwards";
    const angle = (Math.PI * 2 * t) / 5;
    blastText.style.setProperty("--tx", Math.cos(angle) * 400 + "px");
    blastText.style.setProperty("--ty", Math.sin(angle) * 400 - 300 + "px");
    blastText.textContent = "💥";
    blastText.style.pointerEvents = "none";
    effectContainer.appendChild(blastText);
  }

  // 大量の破片パーティクル
  for (let i = 0; i < 80; i++) {
    const particle = document.createElement("div");
    particle.className = "particle debris";
    const angle = (Math.PI * 2 * i) / 80;
    const velocity = 300 + Math.random() * 200;
    particle.style.left = centerX + "px";
    particle.style.top = centerY + "px";
    const size = 8 + Math.random() * 20;
    particle.style.width = size + "px";
    particle.style.height = size + "px";
    particle.style.animation = "blastFly 1.5s ease-out forwards";
    particle.style.setProperty("--tx", Math.cos(angle) * velocity + "px");
    particle.style.setProperty("--ty", Math.sin(angle) * velocity - 200 + "px");
    if (Math.random() > 0.6) {
      particle.classList.add("particle-big");
    }
    effectContainer.appendChild(particle);
  }
}

function createShredderEffect(centerX, centerY) {
  // シュレッダー刃（複数）
  for (let s = 0; s < 3; s++) {
    const shredder = document.createElement("div");
    shredder.className = "shredder-effect";
    shredder.style.left = (centerX + (s - 1) * 80) + "px";
    shredder.style.top = centerY + "px";
    shredder.style.fontSize = "120px";
    shredder.style.transform = "translate(-50%, -50%)";
    shredder.style.animationDelay = (s * 0.1) + "s";
    shredder.textContent = s % 2 === 0 ? "🔪" : "✂️";
    effectContainer.appendChild(shredder);
  }

  // 粉砕テキスト
  for (let t = 0; t < 4; t++) {
    const slash = document.createElement("div");
    slash.style.position = "fixed";
    slash.style.left = (centerX + (Math.random() - 0.5) * 250) + "px";
    slash.style.top = (centerY + (Math.random() - 0.5) * 200) + "px";
    slash.style.fontSize = (80 + Math.random() * 60) + "px";
    slash.style.animation = "shredderCut 1.5s ease-in forwards";
    slash.style.transform = "translate(-50%, -50%)";
    slash.style.animationDelay = (t * 0.1) + "s";
    slash.textContent = Math.random() > 0.5 ? "✂️" : "🔪";
    slash.style.pointerEvents = "none";
    effectContainer.appendChild(slash);
  }

  // 大量の細切れパーティクル
  for (let i = 0; i < 100; i++) {
    const particle = document.createElement("div");
    particle.className = "shred-particle";
    const angle = (Math.PI * 2 * i) / 100;
    const velocity = 280 + Math.random() * 220;
    particle.style.left = centerX + "px";
    particle.style.top = centerY + "px";
    const size = 4 + Math.random() * 12;
    particle.style.width = size + "px";
    particle.style.height = size + "px";
    particle.style.background = ["linear-gradient(135deg, #f97373, #fc8585)", "linear-gradient(45deg, #ff6b6b, #ff8787)", "radial-gradient(circle, #ff5252, #ff1744)"][Math.floor(Math.random() * 3)];
    particle.style.borderRadius = "50%";
    particle.style.boxShadow = `0 0 ${10 + Math.random() * 15}px rgba(249, 115, 115, 0.8)`;
    particle.style.setProperty("--tx", Math.cos(angle) * velocity + "px");
    particle.style.setProperty("--ty", Math.sin(angle) * velocity - 400 + "px");
    particle.style.setProperty("--rotate", Math.random() * 1080 + "deg");
    if (Math.random() > 0.7) {
      particle.classList.add("particle-big");
    }
    effectContainer.appendChild(particle);
  }
}

blowAwayBtn.addEventListener("click", destroyBadThings);

init();
/* ===========================
   テーマシステム
=========================== */

const THEMES = [
  {
    id: "light",
    name: "Light",
    colors: ["#f8fafc", "#e2e8f0", "#0369a1", "#0284c7"]
  },
  {
    id: "midnight",
    name: "MidNight",
    colors: ["#0f172a", "#020617", "#38bdf8", "#0ea5e9"]
  },
  {
    id: "future",
    name: "Future",
    colors: ["#0a0e27", "#080b1a", "#00ff88", "#00dd77"]
  },
  {
    id: "ruin",
    name: "Ruin",
    colors: ["#3d2817", "#2a1810", "#d4a574", "#c9935e"]
  },
  {
    id: "crystal",
    name: "Crystal",
    colors: ["#0f1419", "#0a0d12", "#a78bfa", "#9f7aea"]
  }
];

// 写実的な写真素材（Unsplash）を背景として利用する
// クエリに w=800 を指定し負荷と帯域を抑制。必要に応じてブラウザが縮小表示
const THEME_PHOTOS = {
  light:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop&q=75",
  midnight:
    // 深夜の夜景（森でなくても可）※暗めトーン
    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=75",
  crystal:
    // ガラスの結晶（クリスタル質感）
    "https://images.unsplash.com/photo-1471879832106-c7ab9e0cee23?w=800&auto=format&fit=crop&q=75",
  future:
    // サイバネティックな未来都市（ネオン高層）
    "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=800&auto=format&fit=crop&q=75",
  ruin:
    // アステカ風の遺跡
    "https://images.unsplash.com/photo-1508264165352-258859e62245?w=800&auto=format&fit=crop&q=75"
};

function initThemeSystem() {
  const themeBtn = document.getElementById("theme-btn");
  const themeBackdrop = document.getElementById("theme-backdrop");
  const themeClose = document.getElementById("theme-close");
  const themePreviewGrid = document.getElementById("theme-preview-grid");

  // 保存されたテーマを読み込む
  const savedTheme = localStorage.getItem("moodTheme") || "midnight";
  applyTheme(savedTheme);

  // テーマプレビューグリッドを生成
  THEMES.forEach((theme) => {
    const preview = document.createElement("div");
    preview.className = "theme-preview";
    if (theme.id === savedTheme) {
      preview.classList.add("selected");
    }

    const photoUrl = THEME_PHOTOS[theme.id];
    preview.innerHTML = `
      <div class="theme-preview-content" style="background: linear-gradient(135deg, ${theme.colors[0]} 0%, ${theme.colors[1]} 100%);">
        ${
          photoUrl
            ? `<div class="theme-preview-photo" style="background-image:url('${photoUrl}');"></div>`
            : ""
        }
        <div class="theme-preview-illustration theme-ill-${theme.id}">
          ${getThemeIllustrationSVG(theme.id)}
        </div>
        <div class="theme-preview-overlay"></div>
        <div class="theme-preview-name" style="color: ${theme.id === "light" ? "#1e293b" : "#e5e7eb"};">
          ${theme.name}
        </div>
        <div class="theme-preview-colors">
          ${theme.colors
            .map(
              (color) => `
            <div class="theme-preview-color-swatch" style="background-color: ${color};"></div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    preview.addEventListener("click", () => {
      applyTheme(theme.id);
      localStorage.setItem("moodTheme", theme.id);

      // 選択状態を更新
      document
        .querySelectorAll(".theme-preview")
        .forEach((p) => p.classList.remove("selected"));
      preview.classList.add("selected");
    });

    themePreviewGrid.appendChild(preview);
  });

  // テーマボタンのイベント
  themeBtn.addEventListener("click", () => {
    themeBackdrop.classList.add("active");
  });

  themeClose.addEventListener("click", () => {
    themeBackdrop.classList.remove("active");
  });

  themeBackdrop.addEventListener("click", (e) => {
    if (e.target === themeBackdrop) {
      themeBackdrop.classList.remove("active");
    }
  });
}

function applyTheme(themeId) {
  // CSS側は :root[data-theme] と body[data-theme] の両方を参照しているため、両方に付与する
  document.documentElement.setAttribute("data-theme", themeId);
  document.body.setAttribute("data-theme", themeId);

  // プレビューで使用している写真を、実際のテーマ背景にも適用
  const photoUrl = THEME_PHOTOS[themeId];
  if (photoUrl) {
    document.documentElement.style.setProperty("--theme-photo", `url("${photoUrl}")`);
    document.documentElement.style.setProperty("--theme-photo-opacity", "0.42");
  } else {
    document.documentElement.style.setProperty("--theme-photo", "none");
    document.documentElement.style.setProperty("--theme-photo-opacity", "0");
  }
}

initThemeSystem();

/* ---------------------------
   テーマプレビュー用：イラスト（SVG）
--------------------------- */
function getThemeIllustrationSVG(themeId) {
  // NOTE: 外部画像を使わず、写実寄りに作り込んだインラインSVGで描画する
  switch (themeId) {
    case "light":
      return `
        <svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#d9ecff" />
              <stop offset="45%" stop-color="#f1f7ff" />
              <stop offset="100%" stop-color="#fff7df" />
            </linearGradient>
            <radialGradient id="sun" cx="35%" cy="35%" r="60%">
              <stop offset="0%" stop-color="#ffe59a" stop-opacity="0.95"/>
              <stop offset="40%" stop-color="#ffc766" stop-opacity="0.65"/>
              <stop offset="100%" stop-color="#ff9d00" stop-opacity="0.12"/>
            </radialGradient>
            <filter id="cloudBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3"/>
            </filter>
          </defs>
          <rect width="300" height="180" fill="url(#sky)"/>
          <circle cx="75" cy="55" r="48" fill="url(#sun)"/>
          <g stroke="#ffd86b" stroke-opacity="0.55" stroke-width="3" stroke-linecap="round">
            <path d="M75 5 L75 18"/>
            <path d="M35 55 L48 55"/>
            <path d="M102 23 L93 32"/>
            <path d="M48 23 L57 32"/>
            <path d="M102 86 L93 78"/>
          </g>
          <g filter="url(#cloudBlur)" opacity="0.85">
            <g fill="#ffffff">
              <ellipse cx="165" cy="64" rx="56" ry="22"/>
              <ellipse cx="130" cy="70" rx="40" ry="18"/>
              <ellipse cx="200" cy="72" rx="52" ry="20"/>
              <ellipse cx="240" cy="98" rx="60" ry="24"/>
              <ellipse cx="210" cy="104" rx="44" ry="18"/>
              <ellipse cx="270" cy="106" rx="44" ry="18"/>
              <ellipse cx="95" cy="92" rx="40" ry="18" fill="#f4f9ff" opacity="0.9"/>
            </g>
          </g>
          <path d="M0 128 Q50 110 110 120 Q180 134 240 122 Q275 116 300 126 L300 180 L0 180 Z" fill="#d7e5cc" opacity="0.7"/>
          <rect y="128" width="300" height="52" fill="#f7f1dd" opacity="0.35"/>
          <g fill="none" stroke="#1f2937" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round">
            <path d="M210 48 q10 -8 20 0"/>
            <path d="M230 48 q10 -8 20 0"/>
            <path d="M240 38 q8 -6 16 0"/>
            <path d="M256 38 q8 -6 16 0"/>
          </g>
        </svg>
      `;
    case "midnight":
      return `
        <svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#071027"/>
              <stop offset="60%" stop-color="#041029"/>
              <stop offset="100%" stop-color="#020617"/>
            </linearGradient>
            <radialGradient id="moon" cx="70%" cy="30%" r="55%">
              <stop offset="0%" stop-color="#fefefe" stop-opacity="0.6"/>
              <stop offset="45%" stop-color="#fefefe" stop-opacity="0.28"/>
              <stop offset="70%" stop-color="#ffffff" stop-opacity="0.12"/>
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#062042" stop-opacity="0.9"/>
              <stop offset="100%" stop-color="#020617" stop-opacity="1"/>
            </linearGradient>
            <filter id="mGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2"/>
            </filter>
          </defs>
          <rect width="300" height="180" fill="url(#night)"/>
          <circle cx="220" cy="50" r="48" fill="url(#moon)" filter="url(#mGlow)"/>
          <g fill="#c7f0ff" opacity="0.65">
            <circle cx="40" cy="30" r="1.5"/><circle cx="70" cy="18" r="1.2"/><circle cx="120" cy="40" r="1.3"/>
            <circle cx="160" cy="20" r="1.1"/><circle cx="260" cy="26" r="1.2"/><circle cx="200" cy="18" r="1.1"/>
          </g>
          <g fill="#03101e" opacity="0.9">
            <path d="M0 120 L20 78 L40 120 Z"/>
            <path d="M30 120 L55 70 L80 120 Z"/>
            <path d="M70 120 L95 82 L120 120 Z"/>
            <path d="M110 120 L140 65 L170 120 Z"/>
            <path d="M155 120 L180 80 L205 120 Z"/>
            <path d="M195 120 L225 72 L255 120 Z"/>
            <path d="M240 120 L265 85 L290 120 Z"/>
          </g>
          <g fill="#041725" opacity="0.95">
            <path d="M18 132 L38 92 L58 132 Z"/>
            <path d="M92 132 L112 94 L132 132 Z"/>
            <path d="M182 132 L202 94 L222 132 Z"/>
          </g>
          <rect y="118" width="300" height="62" fill="url(#sea)"/>
          <g fill="none" stroke="#38bdf8" stroke-opacity="0.25" stroke-width="2">
            <path d="M0 140 C30 130, 60 150, 90 140 S150 130, 180 140 S240 150, 300 140"/>
            <path d="M0 158 C35 150, 70 166, 105 158 S175 150, 210 158 S260 168, 300 158"/>
          </g>
        </svg>
      `;
    case "crystal":
      return `
        <svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="crBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0b1020"/>
              <stop offset="100%" stop-color="#111827"/>
            </linearGradient>
            <linearGradient id="facet1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#c4b5fd" stop-opacity="0.55"/>
              <stop offset="100%" stop-color="#a78bfa" stop-opacity="0.22"/>
            </linearGradient>
            <linearGradient id="facet2" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.5"/>
              <stop offset="100%" stop-color="#9f7aea" stop-opacity="0.18"/>
            </linearGradient>
            <linearGradient id="facet3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#d8ccff" stop-opacity="0.45"/>
              <stop offset="100%" stop-color="#9f7aea" stop-opacity="0.18"/>
            </linearGradient>
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="b"/>
              <feMerge>
                <feMergeNode in="b"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect width="300" height="180" fill="url(#crBg)"/>
          <circle cx="150" cy="90" r="82" fill="#a78bfa" opacity="0.1"/>
          <ellipse cx="150" cy="150" rx="95" ry="18" fill="#6b5bb6" opacity="0.18"/>
          <g filter="url(#glow)">
            <polygon points="150,18 200,60 182,140 150,168 118,140 100,60" fill="url(#facet1)" stroke="#c4b5fd" stroke-opacity="0.55"/>
            <polygon points="150,18 182,140 150,168" fill="url(#facet2)" opacity="0.92"/>
            <polygon points="150,18 118,140 150,168" fill="url(#facet3)" opacity="0.8"/>
            <polygon points="150,60 175,120 150,140 125,120" fill="#dcd6ff" opacity="0.2"/>
            <polyline points="150,18 150,168" stroke="#e9d5ff" stroke-opacity="0.35" stroke-width="2"/>
            <polyline points="100,60 200,60" stroke="#e9d5ff" stroke-opacity="0.22" stroke-width="2"/>
            <polyline points="118,140 182,140" stroke="#e9d5ff" stroke-opacity="0.18" stroke-width="2"/>
          </g>
          <g fill="#ffffff" opacity="0.55">
            <path d="M40 40 l4 10 l-4 10 l-4-10z"/>
            <path d="M255 55 l3 7 l-3 7 l-3-7z"/>
            <path d="M60 130 l3 8 l-3 8 l-3-8z"/>
          </g>
        </svg>
      `;
    case "future":
      return `
        <svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="fBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#05081a"/>
              <stop offset="70%" stop-color="#070b1f"/>
              <stop offset="100%" stop-color="#020617"/>
            </linearGradient>
            <linearGradient id="neon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#00ff88" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#00ff88" stop-opacity="0.12"/>
            </linearGradient>
            <filter id="ng" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5"/>
            </filter>
            <linearGradient id="skyglow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#00ffcc" stop-opacity="0.18"/>
              <stop offset="100%" stop-color="#00ff88" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <rect width="300" height="180" fill="url(#fBg)"/>
          <rect width="300" height="60" fill="url(#skyglow)"/>
          <g stroke="#00ff88" stroke-opacity="0.10" stroke-width="1">
            <path d="M0 30 H300"/><path d="M0 60 H300"/><path d="M0 90 H300"/><path d="M0 120 H300"/><path d="M0 150 H300"/>
            <path d="M30 0 V180"/><path d="M60 0 V180"/><path d="M90 0 V180"/><path d="M120 0 V180"/><path d="M150 0 V180"/><path d="M180 0 V180"/><path d="M210 0 V180"/><path d="M240 0 V180"/><path d="M270 0 V180"/>
          </g>
          <g>
            <rect x="20" y="78" width="46" height="102" fill="url(#neon)" stroke="#00ff88" stroke-opacity="0.35"/>
            <rect x="76" y="60" width="58" height="120" fill="url(#neon)" stroke="#00ff88" stroke-opacity="0.35"/>
            <rect x="142" y="90" width="52" height="90" fill="url(#neon)" stroke="#00ff88" stroke-opacity="0.35"/>
            <rect x="202" y="52" width="36" height="128" fill="url(#neon)" stroke="#00ff88" stroke-opacity="0.35"/>
            <rect x="244" y="78" width="40" height="102" fill="url(#neon)" stroke="#00ff88" stroke-opacity="0.35"/>
            <rect x="0" y="96" width="32" height="84" fill="#052036" opacity="0.6"/>
            <rect x="120" y="72" width="22" height="108" fill="#04192b" opacity="0.65"/>
          </g>
          <g fill="#00ffff" opacity="0.35" filter="url(#ng)">
            <rect x="28" y="98" width="6" height="10"/><rect x="40" y="98" width="6" height="10"/><rect x="28" y="116" width="6" height="10"/><rect x="40" y="116" width="6" height="10"/>
            <rect x="86" y="82" width="7" height="11"/><rect x="102" y="82" width="7" height="11"/><rect x="118" y="82" width="7" height="11"/>
            <rect x="86" y="104" width="7" height="11"/><rect x="102" y="104" width="7" height="11"/><rect x="118" y="104" width="7" height="11"/>
            <rect x="210" y="74" width="6" height="10"/><rect x="222" y="74" width="6" height="10"/><rect x="210" y="92" width="6" height="10"/><rect x="222" y="92" width="6" height="10"/>
          </g>
          <circle cx="70" cy="50" r="42" fill="#00ffff" opacity="0.10" filter="url(#ng)"/>
          <circle cx="240" cy="40" r="55" fill="#00ff88" opacity="0.10" filter="url(#ng)"/>
          <circle cx="150" cy="30" r="38" fill="#00aaff" opacity="0.08" filter="url(#ng)"/>
        </svg>
      `;
    case "ruin":
      return `
        <svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="rBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2a1810"/>
              <stop offset="60%" stop-color="#3d2817"/>
              <stop offset="100%" stop-color="#1a0f08"/>
            </linearGradient>
            <linearGradient id="stone" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#d4a574" stop-opacity="0.55"/>
              <stop offset="100%" stop-color="#b8855a" stop-opacity="0.28"/>
            </linearGradient>
            <linearGradient id="dust" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#a26f39" stop-opacity="0.18"/>
              <stop offset="100%" stop-color="#2a1810" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <rect width="300" height="180" fill="url(#rBg)"/>
          <rect width="300" height="70" fill="url(#dust)"/>
          <circle cx="250" cy="35" r="34" fill="#d4a574" opacity="0.18"/>
          <g fill="url(#stone)" stroke="#d4a574" stroke-opacity="0.35">
            <rect x="70" y="120" width="160" height="40" rx="2"/>
            <rect x="90" y="100" width="120" height="30" rx="2"/>
            <rect x="110" y="82" width="80" height="24" rx="2"/>
            <rect x="130" y="66" width="40" height="20" rx="2"/>
          </g>
          <g stroke="#8c6236" stroke-width="3" stroke-linecap="round" opacity="0.6">
            <path d="M150 66 V160"/>
          </g>
          <g stroke="#2a1810" stroke-opacity="0.35" stroke-width="2">
            <path d="M70 132 H230"/>
            <path d="M90 112 H210"/>
            <path d="M110 94 H190"/>
            <path d="M130 76 H170"/>
          </g>
          <g fill="none" stroke="#2f5d3a" stroke-opacity="0.45" stroke-width="2" stroke-linecap="round">
            <path d="M78 120 C68 110, 74 100, 82 92"/>
            <path d="M220 120 C232 112, 232 98, 220 90"/>
          </g>
          <g fill="#c9935e" opacity="0.22">
            <rect x="18" y="146" width="26" height="18" rx="2"/>
            <rect x="255" y="150" width="20" height="14" rx="2"/>
          </g>
        </svg>
      `;
    default:
      return "";
  }
}