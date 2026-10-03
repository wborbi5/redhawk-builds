(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const walk = document.getElementById("walk");
  const portal = document.getElementById("portal");
  const mast = document.querySelector(".mast");
  if (!walk || !portal) return;

  const cue = document.querySelector(".scroll-cue span");
  if (reduced && cue) cue.textContent = "Enter";
  if (reduced) return;

  const frames = [...walk.querySelectorAll(".frame")];
  const bloom = walk.querySelector(".bloom");
  const veil = walk.querySelector(".veil");
  const ui = walk.querySelector(".walk-ui");
  const cover = portal.querySelector(".portal-cover");
  const stage = portal.querySelector(".portal-stage");
  const atrium = portal.querySelector(".portal-atrium");

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const smooth = (t) => t * t * (3 - 2 * t);
  const seen = frames.map(() => false);

  const setFrame = (el, opacity, scale, on) => {
    el.style.opacity = String(opacity);
    el.style.transform = `translate3d(0,0,0) scale(${scale})`;
    if (el._on !== on) {
      el._on = on;
      el.style.visibility = on ? "visible" : "hidden";
    }
  };

  let ticking = false;
  const apply = () => {
    ticking = false;
    const view = window.innerHeight;
    const walkRect = walk.getBoundingClientRect();
    const walkTotal = walk.offsetHeight - view;
    const walkP = walkTotal > 0 ? clamp(-walkRect.top, 0, walkTotal) / walkTotal : 0;

    const o0 = 1 - smooth(ramp(walkP, 0.3, 0.44));
    const o1 = smooth(ramp(walkP, 0.3, 0.44)) * (1 - smooth(ramp(walkP, 0.52, 0.64)));
    const o2 = smooth(ramp(walkP, 0.52, 0.64)) * (1 - smooth(ramp(walkP, 0.78, 0.9)));
    const o3 = smooth(ramp(walkP, 0.78, 0.9));
    const scales = [
      lerp(1, 1.62, smooth(ramp(walkP, 0, 0.42))),
      lerp(1.04, 1.26, smooth(ramp(walkP, 0.28, 0.64))),
      lerp(1.02, 1.12, smooth(ramp(walkP, 0.5, 0.86))),
      lerp(1.05, 1, smooth(ramp(walkP, 0.76, 1)))
    ];
    [o0, o1, o2, o3].forEach((opacity, i) => {
      const on = opacity > 0.004;
      if (on || seen[i]) setFrame(frames[i], opacity, scales[i], on);
      seen[i] = on;
    });

    if (bloom) {
      const glow = smooth(ramp(walkP, 0.62, 0.76)) * (1 - smooth(ramp(walkP, 0.78, 0.92)));
      bloom.style.opacity = String(glow);
    }
    if (veil) veil.style.opacity = String(smooth(ramp(walkP, 0.88, 1)) * 0.28);
    if (ui) {
      const fade = 1 - smooth(ramp(walkP, 0.05, 0.22));
      ui.style.opacity = String(fade);
      ui.style.transform = `translate3d(0, ${(-16 * (1 - fade)).toFixed(2)}px, 0)`;
    }

    const portalRect = portal.getBoundingClientRect();
    const portalTotal = portal.offsetHeight - view;
    const portalP = portalTotal > 0 ? clamp(-portalRect.top, 0, portalTotal) / portalTotal : 0;
    const open = smooth(ramp(portalP, 0.08, 0.92));
    const scale = 1 + open * 3.35;
    const coverOpacity = smooth(ramp(portalP, 0, 0.16)) * (1 - smooth(ramp(portalP, 0.84, 1)));
    if (cover) {
      cover.style.opacity = String(coverOpacity);
      cover.style.transform = `translate3d(0,0,0) scale(${scale})`;
    }
    if (stage) stage.style.opacity = String(smooth(ramp(portalP, 0.12, 0.62)));
    if (atrium) atrium.style.opacity = String(1 - smooth(ramp(portalP, 0.08, 0.5)));

    if (mast) mast.classList.toggle("on-hero", walkRect.bottom > view * 0.72);
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(apply);
    }
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  apply();
})();
