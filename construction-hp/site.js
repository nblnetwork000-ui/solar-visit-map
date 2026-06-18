const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.querySelectorAll(".site-header").forEach((header) => {
  const toggle = header.querySelector(".menu-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-menu-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "メニューを閉じる" : "メニューを開く");
  });
});

document.querySelectorAll("details.accordion-item").forEach((details) => {
  const summary = details.querySelector("summary");
  const panel = details.querySelector(".accordion-panel");
  if (!summary || !panel || prefersReducedMotion) return;

  if (details.open) {
    panel.style.height = `${panel.scrollHeight}px`;
  }

  summary.addEventListener("click", (event) => {
    event.preventDefault();
    const isOpen = details.open;

    if (isOpen) {
      panel.style.height = `${panel.scrollHeight}px`;
      requestAnimationFrame(() => {
        panel.style.height = "0px";
        panel.style.opacity = "0";
      });
      panel.addEventListener(
        "transitionend",
        () => {
          details.open = false;
        },
        { once: true }
      );
      return;
    }

    details.open = true;
    panel.style.height = "0px";
    panel.style.opacity = "0";
    requestAnimationFrame(() => {
      panel.style.height = `${panel.scrollHeight}px`;
      panel.style.opacity = "1";
    });
  });
});

if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll(".media-frame, .work-card, .page-hero, .intro-card, .plain-card, .business-list article, .accordion-item").forEach((element) => {
    element.classList.add("reveal-up");
    revealObserver.observe(element);
  });
}
