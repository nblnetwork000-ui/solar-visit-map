// ViVi companion: floating cheer partner for RepMinder.
// - Follows the screen corner (fixed), leans toward the pointer/finger.
// - Reacts when workout items are checked off (progress / half / complete),
//   with changing facial expressions.
// - Changes outfit by the active Day (pull / legs / recovery / standard).
// Self-contained: does not touch app state or the bond (affection) system.
(function () {
  var companion = document.getElementById("vivi-companion");
  if (!companion) return;
  var inner = document.getElementById("vivi-companion-inner");
  var video = document.getElementById("vivi-companion-video");
  var source = video ? video.querySelector("source") : null;
  var face = document.getElementById("vivi-face");
  var bubble = document.getElementById("vivi-bubble");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var OUTFITS = {
    main: { poster: "./assets/vivi-training.webp", video: "./assets/vivi-training-live.mp4" },
    pull: { poster: "./assets/vivi-day-pull.webp", video: "./assets/vivi-day-pull-live.mp4" },
    legs: { poster: "./assets/vivi-day-legs.webp", video: "./assets/vivi-day-legs-live.mp4" },
    rest: { poster: "./assets/vivi-day-rest.webp", video: "./assets/vivi-day-rest-live.mp4" }
  };
  var DAY_OUTFIT = {
    "Day1": "main", "Day2": "pull", "Day3": "legs", "Day4": "rest",
    "Day5": "main", "Day6": "main", "Day7": "rest"
  };
  var FACES = {
    cheer: "./assets/vivi-face-cheer.webp",
    complete: "./assets/vivi-face-complete.webp",
    tap: "./assets/vivi-face-tap.webp"
  };

  var progressLines = [
    "いいね！その調子💪",
    "ナイス、1つクリア✨",
    "見てるよ〜、えらい！",
    "フォーム意識できてたね！",
    "その1回が効くんだよ🔥"
  ];
  var tapLines = [
    "呼んだ？😊",
    "えへへ、くすぐったい笑",
    "一緒にがんばろ！",
    "ボクはずっとここにいるよ",
    "休憩も大事だよ〜"
  ];
  var restLines = [
    "今日は回復の日。ゆっくりしてね🌙",
    "休むのもトレーニングのうちだよ"
  ];

  var bubbleTimer = null;
  function say(text, ms) {
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add("show");
    if (bubbleTimer) window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(function () {
      bubble.classList.remove("show");
    }, ms || 2600);
  }

  var faceTimer = null;
  function showFace(kind, ms) {
    if (!face || !FACES[kind]) return;
    face.src = FACES[kind];
    face.classList.add("show");
    if (faceTimer) window.clearTimeout(faceTimer);
    faceTimer = window.setTimeout(function () {
      face.classList.remove("show");
    }, ms || 1500);
  }

  function hop(big) {
    if (!video || reduced) return;
    var cls = big ? "vivi-big-hop" : "vivi-hop";
    video.classList.remove("vivi-hop", "vivi-big-hop");
    void video.offsetWidth;
    video.classList.add(cls);
    video.addEventListener("animationend", function handler() {
      video.classList.remove(cls);
      video.removeEventListener("animationend", handler);
    });
  }

  function pick(lines) {
    return lines[Math.floor(Math.random() * lines.length)];
  }

  // --- Outfit by active Day ---
  var currentOutfit = "main";
  function activeDayLabel() {
    var tab = document.querySelector('.day-tab[aria-pressed="true"]');
    return tab ? tab.textContent.trim() : null;
  }
  function applyOutfit() {
    var label = activeDayLabel();
    var next = (label && DAY_OUTFIT[label]) || "main";
    if (next === currentOutfit || !video || !source) return;
    currentOutfit = next;
    video.poster = OUTFITS[next].poster;
    source.src = OUTFITS[next].video;
    video.load();
    if (next === "rest") say(pick(restLines), 3000);
  }
  var dayPanel = document.querySelector(".day-panel");
  if (dayPanel && "MutationObserver" in window) {
    var dayObserver = new MutationObserver(function () { applyOutfit(); });
    dayObserver.observe(dayPanel, { attributes: true, attributeFilter: ["aria-pressed"], subtree: true, childList: true });
  }
  applyOutfit();

  // --- Pointer / finger follow: lean toward the pointer ---
  if (!reduced) {
    var rafPending = false;
    var lastEvent = null;
    window.addEventListener("pointermove", function (event) {
      lastEvent = event;
      if (rafPending) return;
      rafPending = true;
      window.requestAnimationFrame(function () {
        rafPending = false;
        if (!lastEvent || !inner) return;
        var rect = companion.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (lastEvent.clientX - cx) / window.innerWidth;
        var dy = (lastEvent.clientY - cy) / window.innerHeight;
        var tx = Math.max(-8, Math.min(8, dx * 14));
        var ty = Math.max(-5, Math.min(5, dy * 10));
        var rot = Math.max(-5, Math.min(5, dx * 8));
        inner.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) rotate(" + rot.toFixed(1) + "deg)";
      });
    }, { passive: true });
  }

  // --- Tap reaction ---
  if (video) {
    video.addEventListener("click", function () {
      say(pick(tapLines), 2200);
      showFace("tap", 1400);
      hop(false);
    });
  }

  // --- Progress reaction: watch .workout-item.is-done inside the workout panel ---
  var panel = document.querySelector(".workout-panel");
  if (panel && "MutationObserver" in window) {
    var prev = { total: -1, done: 0 };
    function counts() {
      var items = panel.querySelectorAll(".workout-item");
      var done = panel.querySelectorAll(".workout-item.is-done");
      return { total: items.length, done: done.length };
    }
    var observer = new MutationObserver(function () {
      var now = counts();
      if (prev.total === -1) { prev = now; return; }
      if (now.total !== prev.total) { prev = now; return; }
      if (now.done > prev.done) {
        if (now.total > 0 && now.done === now.total) {
          say("全部できた！今日も最高だよ🎉 おつかれさま！", 4200);
          showFace("complete", 2400);
          hop(true);
        } else if (now.done / now.total >= 0.5 && prev.done / now.total < 0.5) {
          say("半分きた！後半もいこう🔥", 2800);
          showFace("cheer", 1800);
          hop(true);
        } else {
          say(pick(progressLines), 2200);
          showFace("cheer", 1300);
          hop(false);
        }
      }
      prev = now;
    });
    observer.observe(panel, { attributes: true, attributeFilter: ["class"], subtree: true });
    prev = counts();
  }

  // --- Greeting ---
  window.setTimeout(function () {
    if (currentOutfit === "rest") {
      say(pick(restLines), 3200);
    } else {
      say("今日も一緒にがんばろ！ボクが見てるよ😊", 3200);
      showFace("cheer", 1600);
    }
  }, 900);
})();
