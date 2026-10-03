(() => {
  "use strict";

  const config = window.RHB_CONFIG || {};
  const validUrl = (value) => {
    try { return new URL(value).protocol === "https:"; }
    catch { return false; }
  };
  const validEmail = (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  document.querySelectorAll("[data-link]").forEach((link) => {
    const key = link.dataset.link;
    if (validUrl(config[key])) link.href = config[key];
  });

  const sponsor = document.querySelector("[data-sponsor]");
  if (sponsor) {
    if (validEmail(config.SPONSOR_EMAIL)) {
      sponsor.href = `mailto:${config.SPONSOR_EMAIL}?subject=${encodeURIComponent("Redhawk Builds sponsorship")}`;
    } else {
      sponsor.removeAttribute("href");
    }
  }

  const money = (amount) => `$${Number(amount).toLocaleString("en-US")}`;
  (config.prizes || []).forEach((item, index) => {
    const card = document.querySelector(`[data-prize="${index}"]`);
    if (!card) return;
    const label = card.querySelector("[data-prize-label]");
    const amount = card.querySelector("[data-prize-amount]");
    if (label) label.textContent = item.place;
    if (amount) amount.textContent = money(item.amount);
  });

  const perk = document.querySelector("[data-perk-prizes]");
  if (perk && config.prizes && config.prizes.length) {
    perk.textContent = `${config.prizes.map((item) => `${item.place} ${money(item.amount)}`).join(". ")}.`;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const main = document.getElementById("main");
  if (main && !reduced) {
    let pending = null;
    let frame = 0;
    main.addEventListener("pointermove", (event) => {
      const card = event.target.closest?.(".spot");
      if (!card || !main.contains(card)) return;
      pending = { card, x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!pending) return;
        const rect = pending.card.getBoundingClientRect();
        pending.card.style.setProperty("--mx", `${pending.x - rect.left}px`);
        pending.card.style.setProperty("--my", `${pending.y - rect.top}px`);
        pending = null;
      });
    }, { passive: true });
  }

  const dock = document.querySelector(".dock");
  const closing = document.getElementById("register");
  if (dock && closing && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      dock.classList.toggle("is-hidden", entry.isIntersecting);
    }, { threshold: 0.45 }).observe(closing);
  }

  const navLinks = [...document.querySelectorAll(".mast nav a")];
  if (navLinks.length && "IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        navLinks.forEach((link) => {
          link.toggleAttribute("aria-current", link.getAttribute("href") === `#${target.id}`);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main > section[id]").forEach((section) => navObserver.observe(section));
  }
})();
