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

    preview.innerHTML = `
      <div class="theme-preview-content" style="background: linear-gradient(135deg, ${theme.colors[0]} 0%, ${theme.colors[1]} 100%);">
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
  document.documentElement.setAttribute("data-theme", themeId);
}

initThemeSystem();