// ViVi companion: floating cheer partner for RepMinder.
// - Follows the screen corner (fixed), leans toward the pointer/finger.
// - Reacts when workout items are checked off (progress / half / complete).
// Self-contained: does not touch app state or the bond (affection) system.
(function () {
  var companion = document.getElementById("vivi-companion");
  if (!companion) return;
  var inner = document.getElementById("vivi-companion-inner");
  var video = document.getElementById("vivi-companion-video");
  var bubble = document.getElementById("vivi-bubble");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  function hop(big) {
    if (!video || reduced) return;
    var cls = big ? "vivi-big-hop" : "vivi-hop";
    video.classList.remove("vivi-hop", "vivi-big-hop");
    // restart the animation
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
          hop(true);
        } else if (now.done / now.total >= 0.5 && prev.done / now.total < 0.5) {
          say("半分きた！後半もいこう🔥", 2800);
          hop(true);
        } else {
          say(pick(progressLines), 2200);
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
    say("今日も一緒にがんばろ！ボクが見てるよ😊", 3200);
  }, 900);
})();
