(() => {
  "use strict";

  const config = window.RHB_CONFIG || {};
  const status = document.getElementById("link-status");
  const labels = {
    REGISTER_URL: "Registration",
    LUMA_URL: "Luma",
    DEVPOST_URL: "Devpost",
    GROUPME_URL: "GroupMe",
    SEPI_URL: "Sigma Eta Pi",
    BANKING_URL: "Miami Banking Club",
    AI_URL: "RedHawk Applied AI"
  };
  const validUrl = (value) => {
    try { return new URL(value).protocol === "https:"; }
    catch { return false; }
  };
  const validEmail = (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  document.querySelectorAll("[data-link]").forEach((link) => {
    const key = link.dataset.link;
    if (validUrl(config[key])) link.href = config[key];
    else if (status) {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        status.textContent = `${labels[key] || "That"} link coming soon.`;
      });
    }
  });

  const sponsor = document.querySelector("[data-sponsor]");
  if (sponsor) {
    if (validEmail(config.SPONSOR_EMAIL)) {
      sponsor.href = `mailto:${config.SPONSOR_EMAIL}?subject=${encodeURIComponent("Redhawk Builds sponsorship")}`;
    } else if (status) {
      sponsor.addEventListener("click", (event) => {
        event.preventDefault();
        status.textContent = "Sponsor email coming soon.";
      });
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
  const best = document.querySelector("[data-best-use]");
  if (best && config.bestUseNote) best.textContent = config.bestUseNote;

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

  const pathsHost = document.querySelector(".paths");
  if (pathsHost) pathsHost.append(buildPaths());

  function aestheticPath(index, position, type) {
    const baseAmplitude = type === "primary" ? 150 : type === "secondary" ? 100 : 60;
    const segments = type === "primary" ? 10 : type === "secondary" ? 8 : 6;
    const phase = index * 0.2;
    const startX = 2400;
    const startY = 800;
    const endX = -2400;
    const endY = -800 + index * 25;
    const points = [];
    for (let i = 0; i <= segments; i += 1) {
      const progress = i / segments;
      const eased = 1 - (1 - progress) ** 2;
      const amplitudeFactor = 1 - eased * 0.3;
      const baseX = startX + (endX - startX) * eased;
      const baseY = startY + (endY - startY) * eased;
      const wave = Math.sin(progress * Math.PI * 3 + phase) * baseAmplitude * 0.7 * amplitudeFactor
        + Math.cos(progress * Math.PI * 4 + phase) * baseAmplitude * 0.3 * amplitudeFactor
        + Math.sin(progress * Math.PI * 2 + phase) * baseAmplitude * 0.2 * amplitudeFactor;
      points.push({ x: baseX * position, y: baseY + wave });
    }
    return points.map((point, i) => {
      if (i === 0) return `M ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      const prev = points[i - 1];
      const cp1x = prev.x + (point.x - prev.x) * 0.4;
      const cp2x = prev.x + (point.x - prev.x) * 0.6;
      return `C ${cp1x.toFixed(1)} ${prev.y.toFixed(1)}, ${cp2x.toFixed(1)} ${point.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    }).join(" ");
  }

  function buildPaths() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "-2800 -1500 5600 3000");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("aria-hidden", "true");
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `<linearGradient id="path-grad" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.2"/>
      <stop offset="0.55" stop-color="#ffd0d6" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#C3142D" stop-opacity="0.7"/>
    </linearGradient>`;
    svg.append(defs);
    const groups = [
      ["primary", 12, 1, "drift-a"],
      ["secondary", 15, -1, "drift-b"],
      ["accent", 10, 1, "drift-a"]
    ];
    groups.forEach(([type, count, position, drift]) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", drift);
      for (let i = 0; i < count; i += 1) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", aestheticPath(i, position, type));
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "url(#path-grad)");
        path.setAttribute("stroke-linecap", "round");
        const width = type === "primary" ? 4 + i * 0.3 : type === "secondary" ? 3 + i * 0.25 : 2 + i * 0.2;
        const opacity = type === "primary" ? 0.15 + i * 0.02 : type === "secondary" ? 0.12 + i * 0.015 : 0.08 + i * 0.04;
        path.setAttribute("stroke-width", String(width));
        path.setAttribute("opacity", String(Math.min(opacity, 0.55)));
        group.append(path);
      }
      svg.append(group);
    });
    return svg;
  }
})();
