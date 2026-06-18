(() => {
  const body = document.body;
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-tabs");
  const backdrop = document.querySelector(".menu-backdrop");

  if (!toggle || !nav || !backdrop) return;

  const setOpen = (open) => {
    body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  };

  toggle.addEventListener("click", () => {
    setOpen(!body.classList.contains("menu-open"));
  });

  backdrop.addEventListener("click", () => setOpen(false));

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      window.setTimeout(() => setOpen(false), 120);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
})();
