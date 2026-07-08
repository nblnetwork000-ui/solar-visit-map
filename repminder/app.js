const storageKey = "repminder-state-v2";

const dailyItems = [
  {
    id: "daily-walk-45",
    name: "ウォーキング",
    detail: "45分",
    note: "週2回：最後10分 速歩"
  },
  {
    id: "daily-draw-in-morning",
    name: "ドローイン 朝",
    detail: "10呼吸"
  },
  {
    id: "daily-draw-in-night",
    name: "ドローイン 夜",
    detail: "10呼吸"
  }
];

const trainingDays = [
  {
    id: "day-1",
    label: "Day1",
    title: "PUSH＋CORE",
    badge: "最後10分早歩き追加",
    items: [
      ["day1-wide-push-up", "プッシュアップ（ワイド）", "20 × 4"],
      ["day1-narrow-push-up", "プッシュアップ（ナロー）", "15 × 3"],
      ["day1-decline-push-up", "ディクラインプッシュアップ", "10 × 3"],
      ["day1-pike-push-up", "パイクプッシュアップ", "10 × 3"],
      ["day1-crunch", "クランチ", "20 × 3"],
      ["day1-leg-raise", "レッグレイズ", "15 × 3"],
      ["day1-plank", "プランク", "60秒 × 2"],
      ["day1-arm-bar", "アームバー", "15 × 4"]
    ]
  },
  {
    id: "day-2",
    label: "Day2",
    title: "下半身＋HIIT",
    sections: [
      {
        title: "朝",
        items: [
          ["day2-hanging-knee-raise", "ハンギングニーレイズ", "15 × 3", "代替：仰向け足上げ"]
        ]
      },
      {
        title: "メイン",
        items: [
          ["day2-squat", "スクワット", "25 × 4"],
          ["day2-bulgarian-squat", "ブルガリアンスクワット", "12 × 3 /脚"],
          ["day2-lunge", "ランジ", "20 × 3"],
          ["day2-hip-lift", "ヒップリフト", "20 × 3"],
          ["day2-burpee", "バーピー", "10 × 5"],
          ["day2-mountain-climber", "マウンテンクライマー", "30秒 × 5"],
          ["day2-plank", "プランク", "45秒 × 2"]
        ]
      }
    ]
  },
  {
    id: "day-3",
    label: "Day3",
    title: "PULL＋CORE",
    badge: "最後10分早歩き追加",
    items: [
      ["day3-hanging-knee-raise", "ハンギングニーレイズ", "15 × 3", "代替：仰向け足上げ"],
      ["day3-reverse-snow-angel", "リバーススノーエンジェル", "15 × 3"],
      ["day3-yt-raise", "YTレイズ", "15 × 3"],
      ["day3-towel-row", "タオルロー", "15 × 3"],
      ["day3-back-extension", "バックエクステンション", "15 × 3"],
      ["day3-russian-twist", "ロシアンツイスト", "20 × 3"],
      ["day3-side-plank", "サイドプランク", "45秒 × 左右"],
      ["day3-leg-raise", "レッグレイズ", "15 × 3"]
    ]
  },
  {
    id: "day-4",
    label: "Day4",
    title: "全身サーキット",
    badge: "6種目 × 4周",
    sections: [
      {
        title: "サーキット",
        items: [
          ["day4-tempo-squat", "テンポスクワット", "15"],
          ["day4-push-up", "プッシュアップ", "12"],
          ["day4-towel-row", "タオルロー", "15"],
          ["day4-hip-hinge", "ヒップヒンジ", "15"],
          ["day4-dead-bug", "デッドバグ", "左右10"],
          ["day4-bear-crawl", "ベアクロール", "30秒"]
        ]
      },
      {
        title: "仕上げ",
        items: [
          ["day4-leg-raise", "レッグレイズ", "20"],
          ["day4-plank", "プランク", "45秒"]
        ]
      }
    ]
  },
  {
    id: "day-5",
    label: "Day5",
    title: "下半身（強度）",
    sections: [
      {
        title: "メイン",
        items: [
          ["day5-squat", "スクワット", "20 × 4"],
          ["day5-bulgarian-squat", "ブルガリアンスクワット", "15 × 3 /脚"],
          ["day5-calf-raise", "カーフレイズ", "30 × 4"],
          ["day5-wall-squat", "壁スクワット", "60秒 × 2"],
          ["day5-reverse-plank", "リバースプランク", "45秒 × 2"]
        ]
      },
      {
        title: "週1回追加（腹強化）",
        items: [
          ["day5-ab-roller-knee", "アブローラー 膝コロ", "10 × 3"],
          ["day5-negative-standing-rollout", "ネガティブ立ちコロ", "5 × 3"]
        ]
      }
    ]
  },
  {
    id: "day-6",
    label: "Day6",
    title: "上半身補強",
    items: [
      ["day6-hanging-knee-raise", "ハンギングニーレイズ", "15 × 3", "代替：仰向け足上げ"],
      ["day6-narrow-push-up", "ナロープッシュアップ", "15 × 4"],
      ["day6-pike-push-up", "パイクプッシュアップ", "12 × 3"],
      ["day6-side-plank", "サイドプランク", "45秒 × 左右"],
      ["day6-crunch", "クランチ", "20", "1〜2セット"],
      ["day6-leg-raise", "レッグレイズ", "15", "1〜2セット"],
      ["day6-russian-twist", "ロシアンツイスト", "20", "1〜2セット"],
      ["day6-arm-bar", "アームバー", "15 × 3"]
    ]
  },
  {
    id: "day-7",
    label: "Day7",
    title: "脂肪燃焼",
    items: [
      ["day7-walk-60", "ウォーキング", "60分"],
      ["day7-stretch", "ストレッチ", ""],
      ["day7-draw-in", "ドローイン", ""]
    ]
  }
];

const characters = [
  {
    id: "sin",
    name: "SIN",
    mood: "静かに見守る",
    profile: "継続すると少しずつ距離が近づくタイプ。",
    voiceLabel: "SIN voice",
    poster: "./assets/SINEDITOR_1080-1920.png",
    video: "./assets/sineditor-live-wallpaper.mp4",
    audioPrefix: "",
    speech: { pitch: 1.32, rate: 0.92 },
    stages: ["拒絶", "まだ嫌い", "警戒解除中", "仲良し", "信頼", "最高の相棒"],
    notes: [
      "マジで嫌われています。まずは1種目だけでも見返してください。",
      "かなり塩対応です。完了記録で少しずつ信用を取り戻してください。",
      "まだ警戒されています。継続すると少しずつ態度がやわらぎます。",
      "少しずつ距離が近づいています。いい流れです。",
      "信頼度が高めです。今日の一歩もちゃんと見ています。",
      "かなり懐いています。継続がしっかり伝わっています。"
    ],
    expressions: ["x_x", "-_-", "._.", "^_^", "^-^", "☆▽☆"]
  },
  {
    id: "mermaid",
    name: "マーメイド",
    mood: "おっとり",
    profile: "おとなしい性格。しんみりした距離感から、少しずつ嬉しそうになっていく。",
    voiceLabel: "mermaid voice",
    poster: "./assets/mermaid-1080-1920.jpg",
    video: "./assets/mermaid-live-wallpaper.mp4",
    audioPrefix: "mermaid",
    speech: { pitch: 1.22, rate: 0.82 },
    stages: ["しんみり", "まだ遠い", "少し安心", "嬉しい", "信頼", "大胆"],
    notes: [
      "しんみりした表情です。まだ距離があります。",
      "少しだけこちらを見ています。焦らず積み上げてください。",
      "声が少しやわらぎました。継続が伝わり始めています。",
      "嬉しそうに見守っています。今日もちゃんと届いています。",
      "かなり心を開いています。静かに近くで応援しています。",
      "最後は大胆です。あなたの継続を、かなり特別に思っています。"
    ],
    expressions: ["..", "._.", "u_u", "^_^", "^-^", "//▽//"]
  },
  {
    id: "lilian",
    name: "リリアン",
    mood: "ハキハキ",
    profile: "元気で距離感はあるタイプ。最初は別々に、最後は一緒にトレーニングしてくれる。",
    voiceLabel: "lilian voice",
    poster: "./assets/lilian-1080-1920.png",
    video: "./assets/lilian-live-wallpaper.mp4",
    audioPrefix: "lilian",
    speech: { pitch: 1.38, rate: 1.05 },
    stages: ["別メニュー", "距離あり", "横で応援", "一緒に準備", "一緒に練習", "大胆ペア"],
    notes: [
      "元気だけど、まだ別々にトレーニングする距離感です。",
      "ハキハキ応援してくれますが、まだ少し線を引いています。",
      "隣で声をかけるくらいには近づいてきました。",
      "一緒に準備運動してくれる距離です。かなり良い流れです。",
      "もう一緒にトレーニングする関係です。継続が効いています。",
      "最後は大胆です。近い距離で全力応援してくれます。"
    ],
    expressions: ["| |", ">_>", "^o^", "\\o/", "o(^-^)o", "!!▽!!"]
  }
];

const defaultState = {
  reminderTime: "20:00",
  activeDayId: "day-1",
  activeCharacterId: "sin",
  activeDateKey: getDateKey(),
  doneByDate: {},
  affection: 0,
  affectionByCharacter: {},
  affectionVersion: 3,
  affectionAwards: {},
  affectionAwardsByCharacter: {},
  fullCompletionAwards: {},
  lastCompletionDate: "",
  lastVisitDate: "",
  lastVisitByCharacter: {},
  streak: 0
};

let reminderTimer = null;
let state = loadState();

const dayTabs = document.querySelector("#day-tabs");
const workoutList = document.querySelector("#workout-list");
const workoutTemplate = document.querySelector("#workout-template");
const sectionTemplate = document.querySelector("#section-template");
const doneCount = document.querySelector("#done-count");
const pendingCount = document.querySelector("#pending-count");
const streakCount = document.querySelector("#streak-count");
const reminderTime = document.querySelector("#reminder-time");
const statusPill = document.querySelector("#status-pill");
const notifyButton = document.querySelector("#notify-button");
const saveTimeButton = document.querySelector("#save-time");
const resetButton = document.querySelector("#reset-button");
const workoutTitle = document.querySelector("#workout-title");
const workoutBadge = document.querySelector("#workout-badge");
const mascotLine = document.querySelector("#mascot-line");
const voiceButton = document.querySelector("#voice-button");
const voiceKicker = document.querySelector("#voice-kicker");
const characterTabs = document.querySelector("#character-tabs");
const characterName = document.querySelector("#character-name");
const characterMood = document.querySelector("#character-mood");
const characterProfile = document.querySelector("#character-profile");
const calendarDate = document.querySelector("#calendar-date");
const prevDateButton = document.querySelector("#prev-date");
const nextDateButton = document.querySelector("#next-date");
const todayButton = document.querySelector("#today-button");
const bondTitle = document.querySelector("#bond-title");
const bondStage = document.querySelector("#bond-stage");
const bondFill = document.querySelector("#bond-fill");
const bondNote = document.querySelector("#bond-note");
const brandMark = document.querySelector(".brand-mark");
const mascotFace = document.querySelector("#mascot-face");
const resetAffectionButton = document.querySelector("#reset-affection");
const installPanel = document.querySelector("#install-panel");
const installButton = document.querySelector("#install-button");
const installCopy = document.querySelector("#install-copy");
let selectedVoice = null;
let voiceUnlocked = false;
let mascotAudio = null;
let deferredInstallPrompt = null;

state.activeDateKey = state.activeDateKey || getDateKey();
applyAffectionVersion();
ensureCharacterAffectionState();
applyAffectionDrift();
reminderTime.value = state.reminderTime;
calendarDate.value = state.activeDateKey;
renderCharacterTabs();
applyCharacterTheme(false);
renderDayTabs();
render();
initLiveWallpaper();
initMascotVoice();
scheduleReminder();
registerServiceWorker();
initInstallPrompt();

notifyButton.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    updateStatus("このブラウザは通知に未対応です");
    return;
  }

  const permission = await Notification.requestPermission();
  updateStatus(permission === "granted" ? "通知を有効にしました" : "通知が許可されていません");
});

voiceButton.addEventListener("click", () => {
  voiceUnlocked = true;
  speakMascot(getMascotMessage("hello"), "hello");
});

saveTimeButton.addEventListener("click", () => {
  state.reminderTime = reminderTime.value || "20:00";
  saveState();
  scheduleReminder();
  updateStatus(`${state.reminderTime} に通知します`);
});

resetButton.addEventListener("click", () => {
  resetSelectedDateProgress();
  saveState();
  render();
  updateStatus("選択中の日付の完了をリセットしました");
});

calendarDate.addEventListener("change", () => {
  setActiveDate(calendarDate.value || getDateKey());
});

prevDateButton.addEventListener("click", () => {
  shiftActiveDate(-1);
});

nextDateButton.addEventListener("click", () => {
  shiftActiveDate(1);
});

todayButton.addEventListener("click", () => {
  setActiveDate(getDateKey());
});

resetAffectionButton.addEventListener("click", () => {
  const character = getActiveCharacter();
  if (!window.confirm(`${character.name}の好感度を0にリセットしますか？トレーニング記録は残ります。`)) return;
  setActiveAffection(0);
  state.affectionVersion = 3;
  state.affectionAwardsByCharacter[character.id] = {};
  state.lastVisitByCharacter[character.id] = getDateKey();
  saveState();
  renderCharacterTabs();
  renderBond();
  const message = `${character.name}の好感度をゼロに戻したよ。ここからまた少しずつ取り返そ。`;
  setMascotLine(message);
  updateStatus("好感度をリセットしました");
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    updateStatus("共有からホーム画面に追加できます");
    setMascotLine("iPhoneなら共有ボタンから、ホーム画面に追加してね。");
    return;
  }

  deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.disabled = true;
  installButton.textContent = result.outcome === "accepted" ? "追加済み" : "あとで";
  updateStatus(result.outcome === "accepted" ? "アプリを追加しました" : "追加をキャンセルしました");
});

function renderCharacterTabs() {
  characterTabs.replaceChildren();

  characters.forEach((character) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "character-tab";
    button.innerHTML = `<span>${character.name}</span><small>${getCharacterAffection(character.id)}</small>`;
    button.setAttribute("aria-label", character.name);
    button.setAttribute("aria-pressed", String(character.id === state.activeCharacterId));
    button.addEventListener("click", () => {
      state.activeCharacterId = character.id;
      saveState();
      renderCharacterTabs();
      applyCharacterTheme(true);
      renderBond();
    });
    characterTabs.append(button);
  });
}

function applyCharacterTheme(announce = true) {
  const character = getActiveCharacter();
  characterName.textContent = character.name;
  characterMood.textContent = character.mood;
  characterProfile.textContent = character.profile;
  voiceKicker.textContent = character.voiceLabel;

  if (character.poster) {
    document.documentElement.style.setProperty("--fallback-bg", `url("${character.poster}")`);
  }

  setVideoAsset(document.querySelector(".live-wallpaper"), character);
  setVideoAsset(document.querySelector(".brand-mark video"), character);
  playLiveWallpapers();

  if (announce) {
    const message = getMascotMessage("default");
    setMascotLine(message);
    updateStatus(`${character.name}に切り替えました`);
    if (voiceUnlocked) speakMascot(message, "hello");
  }
}

function setVideoAsset(video, character) {
  if (!video) return;
  const source = video.querySelector("source") || document.createElement("source");
  if (!source.parentNode) {
    source.type = "video/mp4";
    video.append(source);
  }

  if (source.getAttribute("src") !== character.video) {
    source.setAttribute("src", character.video);
    video.load();
  }

  if (character.poster) {
    video.setAttribute("poster", character.poster);
  } else {
    video.removeAttribute("poster");
  }
}

function getActiveCharacter() {
  return characters.find((character) => character.id === state.activeCharacterId) || characters[0];
}

function renderDayTabs() {
  dayTabs.replaceChildren();

  trainingDays.forEach((day) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-tab";
    button.textContent = day.label;
    button.setAttribute("aria-pressed", String(day.id === state.activeDayId));
    button.addEventListener("click", () => {
      state.activeDayId = day.id;
      saveState();
      renderDayTabs();
      render();
      const message = getMascotMessage("day");
      setMascotLine(message);
      if (voiceUnlocked) speakMascot(message, day.id);
    });
    dayTabs.append(button);
  });
}

function render() {
  const day = getActiveDay();
  const dateKey = getSelectedDateKey();
  const doneIds = new Set(state.doneByDate[dateKey] || []);
  const items = getCurrentItems(day);

  workoutTitle.textContent = `${day.label}：${day.title}`;
  workoutBadge.textContent = `${formatDisplayDate(dateKey)} / ${day.badge || "最新版メニュー"}`;
  workoutList.replaceChildren();

  appendSection("毎日", dailyItems, doneIds);

  getSections(day).forEach((section) => {
    appendSection(section.title, normalizeItems(section.items), doneIds);
  });

  const doneTotal = items.filter((item) => doneIds.has(item.id)).length;
  const pendingTotal = Math.max(items.length - doneTotal, 0);
  doneCount.textContent = doneTotal;
  pendingCount.textContent = pendingTotal;
  streakCount.textContent = state.streak;
  calendarDate.value = dateKey;
  renderCharacterTabs();
  renderBond();
}

function appendSection(title, items, doneIds) {
  const section = sectionTemplate.content.firstElementChild.cloneNode(true);
  section.querySelector("h3").textContent = title;
  const list = section.querySelector(".section-items");

  items.forEach((item) => {
    const node = workoutTemplate.content.firstElementChild.cloneNode(true);
    const isDone = doneIds.has(item.id);
    node.classList.toggle("is-done", isDone);
    node.querySelector(".check-button").setAttribute("aria-label", `${item.name}を完了にする`);
    node.querySelector(".workout-name").textContent = item.name;
    node.querySelector(".workout-detail").textContent = item.detail || "実施";
    node.querySelector(".workout-note").textContent = item.note || "";
    node.querySelector(".workout-note").hidden = !item.note;

    node.querySelector(".check-button").addEventListener("click", () => {
      toggleDone(item.id);
    });

    list.append(node);
  });

  workoutList.append(section);
}

function toggleDone(id) {
  const dateKey = getSelectedDateKey();
  const doneIds = new Set(state.doneByDate[dateKey] || []);
  const wasDone = doneIds.has(id);
  wasDone ? doneIds.delete(id) : doneIds.add(id);
  state.doneByDate[dateKey] = [...doneIds];

  const currentItems = getCurrentItems(getActiveDay());
  const isFullyDone = currentItems.every((item) => doneIds.has(item.id)) && currentItems.length > 0;

  adjustAffection(dateKey, id, wasDone ? -1 : 1);

  if (isFullyDone) {
    adjustAffection(dateKey, "full", 8);
    updateStreak(dateKey);
    const message = getMascotMessage("complete");
    sendReminder(message);
    if (voiceUnlocked) speakMascot(message, "complete");
  } else {
    adjustAffection(dateKey, "full", -8);
  }

  if (!wasDone && !isFullyDone) {
    const message = getMascotMessage("done");
    setMascotLine(message);
    if (voiceUnlocked) speakMascot(message, "done");
  } else if (wasDone) {
    const message = "チェックを外したよ。好感度も少し戻ったみたい。";
    setMascotLine(message);
    updateStatus("完了を取り消しました");
  }

  saveState();
  render();
}

function getActiveDay() {
  return trainingDays.find((day) => day.id === state.activeDayId) || trainingDays[0];
}

function getCurrentItems(day) {
  return [...dailyItems, ...getSections(day).flatMap((section) => normalizeItems(section.items))];
}

function getSections(day) {
  return day.sections || [{ title: "メイン", items: day.items }];
}

function normalizeItems(items) {
  return items.map(([id, name, detail, note]) => ({ id, name, detail, note }));
}

function setActiveDate(dateKey) {
  state.activeDateKey = dateKey;
  saveState();
  render();
  const message = `${formatDisplayDate(dateKey)}にジャンプしたよ。記録したい日を選んでね。`;
  setMascotLine(message);
  updateStatus(formatDisplayDate(dateKey));
}

function shiftActiveDate(offset) {
  const date = parseDateKey(getSelectedDateKey());
  date.setDate(date.getDate() + offset);
  setActiveDate(getDateKey(date));
}

function getSelectedDateKey() {
  return state.activeDateKey || getDateKey();
}

function resetSelectedDateProgress() {
  const dateKey = getSelectedDateKey();
  const currentItems = getCurrentItems(getActiveDay());

  currentItems.forEach((item) => {
    adjustAffection(dateKey, item.id, -1);
  });
  adjustAffection(dateKey, "full", -8);

  state.doneByDate[dateKey] = [];
}

function renderBond() {
  const affection = clampAffection(getActiveAffection());
  const stage = getBondStage(affection);
  const expression = getMascotExpression(affection);
  setActiveAffection(affection);

  bondTitle.textContent = `好感度 ${affection}`;
  bondStage.textContent = stage;
  bondFill.style.width = `${affection}%`;
  bondNote.textContent = getBondNote(affection);
  mascotFace.textContent = expression.face;
  brandMark.classList.remove("is-shy", "is-happy", "is-love");
  brandMark.classList.add(expression.className);
}

function adjustAffection(dateKey, awardKey, amount) {
  const character = getActiveCharacter();
  const awards = getCharacterAwards(character.id);
  const key = `${dateKey}:${awardKey}`;

  if (amount > 0) {
    if (awards[key]) return;
    awards[key] = true;
    setCharacterAffection(character.id, getCharacterAffection(character.id) + amount);
    return;
  }

  if (amount < 0) {
    if (!awards[key]) return;
    delete awards[key];
    setCharacterAffection(character.id, getCharacterAffection(character.id) + amount);
  }
}

function applyAffectionVersion() {
  if (state.affectionVersion === 3) return;

  state.affection = 0;
  state.affectionVersion = 3;
  state.affectionAwards = {};
  state.lastVisitDate = getDateKey();
  saveState();
}

function ensureCharacterAffectionState() {
  state.activeCharacterId = getActiveCharacter().id;
  state.affectionByCharacter = state.affectionByCharacter || {};
  state.affectionAwardsByCharacter = state.affectionAwardsByCharacter || {};
  state.lastVisitByCharacter = state.lastVisitByCharacter || {};

  characters.forEach((character) => {
    if (state.affectionByCharacter[character.id] === undefined) {
      state.affectionByCharacter[character.id] = character.id === "sin" ? clampAffection(state.affection ?? 0) : 0;
    }

    if (!state.affectionAwardsByCharacter[character.id]) {
      state.affectionAwardsByCharacter[character.id] =
        character.id === "sin" && state.affectionAwards ? { ...state.affectionAwards } : {};
    }

    if (!state.lastVisitByCharacter[character.id]) {
      state.lastVisitByCharacter[character.id] = state.lastVisitDate || getDateKey();
    }
  });

  state.affection = getActiveAffection();
}

function getActiveAffection() {
  return getCharacterAffection(getActiveCharacter().id);
}

function setActiveAffection(value) {
  setCharacterAffection(getActiveCharacter().id, value);
}

function getCharacterAffection(characterId) {
  state.affectionByCharacter = state.affectionByCharacter || {};
  return clampAffection(state.affectionByCharacter[characterId] ?? 0);
}

function setCharacterAffection(characterId, value) {
  state.affectionByCharacter = state.affectionByCharacter || {};
  state.affectionByCharacter[characterId] = clampAffection(value);
  if (characterId === getActiveCharacter().id) {
    state.affection = state.affectionByCharacter[characterId];
  }
}

function getCharacterAwards(characterId) {
  state.affectionAwardsByCharacter = state.affectionAwardsByCharacter || {};
  state.affectionAwardsByCharacter[characterId] = state.affectionAwardsByCharacter[characterId] || {};
  return state.affectionAwardsByCharacter[characterId];
}

function applyAffectionDrift() {
  ensureCharacterAffectionState();
  state.fullCompletionAwards = state.fullCompletionAwards || {};

  const todayKey = getDateKey();
  characters.forEach((character) => {
    const lastVisitDate = state.lastVisitByCharacter[character.id] || todayKey;
    const awayDays = diffDateKeys(lastVisitDate, todayKey);

    if (awayDays > 0) {
      const noLoginPenalty = Math.max(awayDays - 1, 0) * 4;
      const unfinishedPenalty = isDateFullyComplete(lastVisitDate) ? 0 : 3;
      setCharacterAffection(
        character.id,
        getCharacterAffection(character.id) - noLoginPenalty - unfinishedPenalty
      );
    }

    state.lastVisitByCharacter[character.id] = todayKey;
  });
  state.lastVisitDate = todayKey;
  state.affection = getActiveAffection();
  saveState();
}

function isDateFullyComplete(dateKey) {
  const doneIds = new Set(state.doneByDate[dateKey] || []);
  const items = getCurrentItems(getActiveDay());
  return items.length > 0 && items.every((item) => doneIds.has(item.id));
}

function getBondStage(affection) {
  return getStageValue(getActiveCharacter().stages, affection);
}

function getBondNote(affection) {
  return getStageValue(getActiveCharacter().notes, affection);
}

function getMascotExpression(affection) {
  const face = getStageValue(getActiveCharacter().expressions, affection);
  const className = affection >= 75 ? "is-love" : affection >= 55 ? "is-happy" : "is-shy";
  return { face, className };
}

function getStageValue(values, affection) {
  if (affection >= 90) return values[5];
  if (affection >= 75) return values[4];
  if (affection >= 55) return values[3];
  if (affection >= 30) return values[2];
  if (affection >= 15) return values[1];
  return values[0];
}

function clampAffection(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function updateStreak(dateKey) {
  if (state.lastCompletionDate === dateKey) return;

  const yesterday = parseDateKey(dateKey);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);
  state.streak = state.lastCompletionDate === yesterdayKey ? state.streak + 1 : 1;
  state.lastCompletionDate = dateKey;
}

function scheduleReminder() {
  window.clearTimeout(reminderTimer);
  const [hours, minutes] = state.reminderTime.split(":").map(Number);
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target <= new Date()) {
    target.setDate(target.getDate() + 1);
  }

  reminderTimer = window.setTimeout(() => {
    const currentItems = getCurrentItems(getActiveDay());
    const doneIds = new Set(state.doneByDate[getSelectedDateKey()] || []);
    const remaining = currentItems.filter((item) => !doneIds.has(item.id)).length;
    if (remaining > 0) {
      const message = getMascotMessage("reminder");
      sendReminder(message);
      if (voiceUnlocked) speakMascot(message, "reminder");
    }
    scheduleReminder();
  }, target.getTime() - Date.now());
}

function sendReminder(message) {
  setMascotLine(message);

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("RepMinder", {
      body: message,
      icon: "./icons/icon-192.svg"
    });
    return;
  }

  updateStatus(message);
}

function updateStatus(message) {
  statusPill.textContent = message;
  window.setTimeout(() => {
    statusPill.textContent = "今日のメニュー";
  }, 3600);
}

function loadState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(storageKey)) || {};
    const nextState = { ...defaultState, ...savedState };

    if (savedState.affectionVersion !== defaultState.affectionVersion) {
      nextState.affection = 0;
      nextState.affectionVersion = defaultState.affectionVersion;
      nextState.affectionAwards = {};
      nextState.lastVisitDate = getDateKey();
    }

    return nextState;
  } catch {
    return defaultState;
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function initLiveWallpaper() {
  playLiveWallpapers();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) playLiveWallpapers();
  });
  document.addEventListener("pointerdown", playLiveWallpapers, { once: true });
}

function playLiveWallpapers() {
  document.querySelectorAll(".live-wallpaper, .brand-mark video").forEach((video) => {
    video.play().catch(() => {});
  });
}

function initMascotVoice() {
  setMascotLine(getMascotMessage("default"));

  if ("speechSynthesis" in window) {
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      selectedVoice = null;
      getCuteJapaneseVoice();
    });
  }
}

function getMascotMessage(type) {
  const day = getActiveDay();
  const dateKey = getSelectedDateKey();
  const currentItems = getCurrentItems(day);
  const doneIds = new Set(state.doneByDate[dateKey] || []);
  const remaining = currentItems.filter((item) => !doneIds.has(item.id)).length;
  const character = getActiveCharacter();

  if (character.id === "mermaid") {
    if (type === "hello") {
      return `……おかえりなさい。${day.label}、そっと一緒に進も。残り${remaining}個だよ。`;
    }

    if (type === "day") {
      return `${day.label}は${day.title}だね。焦らなくていいから、ゆっくり進も。`;
    }

    if (type === "done") {
      return `うん……できたね。あと${remaining}個。少しずつ、あなたのこと見直してるよ。`;
    }

    if (type === "complete") {
      return "全部できたんだ……すごい。今日は、少しだけ近くにいてもいい？";
    }

    if (type === "reminder") {
      return `まだ${remaining}個残ってるみたい。無理しないで、でも一緒に進も。`;
    }

    return `……おかえりなさい。今日も、そっと一緒にがんばろうね。`;
  }

  if (character.id === "lilian") {
    if (type === "hello") {
      return `おかえり！${day.label}、今日はちょっと距離置きつつだけど応援するよ。残り${remaining}個！`;
    }

    if (type === "day") {
      return `${day.label}は${day.title}！まずは別々にスタート、調子が出たら一緒にいこ！`;
    }

    if (type === "done") {
      return `よし、できた！あと${remaining}個。その一個、ちゃんと見てたからね！`;
    }

    if (type === "complete") {
      return "全部クリア！すごいじゃん！ねえ、次はもっと近くで一緒にやろ！";
    }

    if (type === "reminder") {
      return `まだ${remaining}個残ってるよ！焦らなくていいけど、ここから一緒に動こ！`;
    }

    return "おかえり！今日も元気にいこ。まだ距離はあるけど、応援は全力だから！";
  }

  if (type === "hello") {
    return `おかえり。${day.label}、一緒にやろ。残り${remaining}個、無理なくいこ。`;
  }

  if (type === "day") {
    return `${day.label}は${day.title}だよ。今日もちゃんと見てるからね。`;
  }

  if (type === "done") {
    return `いい感じ。あと${remaining}個。ちょっとずつでも、ちゃんと進んでるよ。`;
  }

  if (type === "complete") {
    return `全部完了。えらすぎ。今日はもう、胸張っていいよ。`;
  }

  if (type === "reminder") {
    return `${day.label}の筋トレが${remaining}件残っています。`;
  }

  return `今日も一緒にやろ。まずは${day.label}から、ゆっくりで大丈夫。`;
}

function setMascotLine(message) {
  mascotLine.textContent = message;
}

function speakMascot(message, voiceKey = "hello") {
  setMascotLine(message);

  const audioSrc = getMascotAudioSrc(voiceKey);
  if (audioSrc) {
    if (mascotAudio) {
      mascotAudio.pause();
      mascotAudio.currentTime = 0;
    }
    mascotAudio = new Audio(audioSrc);
    mascotAudio.volume = 0.92;
    mascotAudio.play().catch(() => {
      speakWithSystemVoice(message);
    });
    return;
  }

  speakWithSystemVoice(message);
}

function speakWithSystemVoice(message) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    updateStatus("このブラウザは音声読み上げに未対応です");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(message);
  const speech = getActiveCharacter().speech || {};
  utterance.lang = "ja-JP";
  utterance.pitch = speech.pitch || 1.32;
  utterance.rate = speech.rate || 0.92;
  utterance.volume = 0.95;
  utterance.voice = getCuteJapaneseVoice();

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function getMascotAudioSrc(voiceKey) {
  const character = getActiveCharacter();
  const baseVoiceKey = voiceKey && voiceKey.startsWith("day-") ? "hello" : voiceKey;
  const sinAudioMap = {
    hello: "./assets/voice-hello.m4a",
    done: "./assets/voice-done.m4a",
    complete: "./assets/voice-complete.m4a",
    reminder: "./assets/voice-reminder.m4a",
    "day-1": "./assets/voice-day-1.m4a",
    "day-2": "./assets/voice-day-2.m4a",
    "day-3": "./assets/voice-day-3.m4a",
    "day-4": "./assets/voice-day-4.m4a",
    "day-5": "./assets/voice-day-5.m4a",
    "day-6": "./assets/voice-day-6.m4a",
    "day-7": "./assets/voice-day-7.m4a"
  };

  if (!character.audioPrefix) {
    return sinAudioMap[voiceKey] || sinAudioMap.hello;
  }

  const characterAudioMap = {
    hello: `./assets/voice-${character.audioPrefix}-hello.m4a`,
    done: `./assets/voice-${character.audioPrefix}-done.m4a`,
    complete: `./assets/voice-${character.audioPrefix}-complete.m4a`,
    reminder: `./assets/voice-${character.audioPrefix}-reminder.m4a`
  };
  return characterAudioMap[baseVoiceKey] || characterAudioMap.hello;
}

function getCuteJapaneseVoice() {
  const voices = window.speechSynthesis.getVoices();
  const japaneseVoices = voices.filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith("ja"));
  selectedVoice =
    selectedVoice ||
    japaneseVoices.find((voice) => /kyoko|otoya|siri|female|haruka|nanami|ichiro/i.test(voice.name)) ||
    japaneseVoices[0] ||
    null;
  return selectedVoice;
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function diffDateKeys(fromKey, toKey) {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function formatDisplayDate(dateKey) {
  const date = parseDateKey(dateKey);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${month}/${day}(${weekday})`;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
  }
}

function initInstallPrompt() {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  if (isStandalone) {
    installPanel.hidden = true;
    return;
  }

  if (isIos) {
    installCopy.textContent = "共有ボタンから「ホーム画面に追加」でアプリ化できます。";
    installButton.textContent = "手順";
    return;
  }

  installCopy.textContent = "対応ブラウザなら、このボタンからスマホに追加できます。";
  installButton.disabled = true;
  installButton.textContent = "準備中";

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.disabled = false;
    installButton.textContent = "追加";
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.disabled = true;
    installButton.textContent = "追加済み";
    installCopy.textContent = "ホーム画面からRepMinderを開けます。";
  });
}
