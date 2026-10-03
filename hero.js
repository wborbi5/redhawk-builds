(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = document.getElementById("hero");
  const canvas = document.getElementById("field");
  const mast = document.querySelector(".mast");
  const photo = document.querySelector(".hero-photo");
  const photoImg = photo ? photo.querySelector("img") : null;
  const copy = document.querySelector(".hero-copy");

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (t) => t * t * (3 - 2 * t);
  const ramp = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

  const syncMast = () => {
    if (!mast || !hero) return;
    mast.classList.toggle("on-hero", hero.getBoundingClientRect().bottom > 80);
  };

  if (reduced || !hero || !canvas || !photoImg) {
    document.documentElement.classList.add("is-static");
    addEventListener("scroll", syncMast, { passive: true });
    syncMast();
    return;
  }

  document.documentElement.classList.add("has-field");
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    document.documentElement.classList.add("is-static");
    return;
  }

  const STRIDE = 8;
  const BINS = 8;
  let points = null;
  let bins = null;
  let xy = null;
  let order = null;
  let count = 0;
  let cssW = 1;
  let cssH = 1;
  let dot = 1.8;
  let targetP = 0;
  let displayP = 0;
  let time = 0;
  let last = 0;
  let cached = null;
  let photoShown = "";
  let copyShown = "";
  const binCount = new Uint16Array(BINS);
  const binStart = new Uint16Array(BINS);
  const cursor = new Uint16Array(BINS);

  const measure = () => {
    const total = hero.offsetHeight - window.innerHeight;
    targetP = total > 1 ? clamp(-hero.getBoundingClientRect().top / total, 0, 1) : 0;
    syncMast();
  };

  const sampleImage = () => {
    const iw = photoImg.naturalWidth;
    const ih = photoImg.naturalHeight;
    if (!iw || !ih) return null;
    try {
      const off = document.createElement("canvas");
      off.width = iw;
      off.height = ih;
      const octx = off.getContext("2d", { willReadFrequently: true });
      octx.drawImage(photoImg, 0, 0, iw, ih);
      return { data: octx.getImageData(0, 0, iw, ih).data, iw, ih };
    } catch (error) {
      return null;
    }
  };

  const pixelWeight = (data, iw, ih, px, py) => {
    let best = 0;
    for (let dy = -6; dy <= 6; dy += 2) {
      const y = py + dy;
      if (y < 0 || y >= ih) continue;
      for (let dx = -6; dx <= 6; dx += 2) {
        const x = px + dx;
        if (x < 0 || x >= iw) continue;
        const idx = (y * iw + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const red = Math.max(0, (r - Math.max(g, b)) / 255);
        const weight = Math.min(1, Math.max(0, (lum - 0.04) / 0.055) + red * 1.7);
        if (weight > best) best = weight;
      }
    }
    return best;
  };

  const build = () => {
    cssW = Math.max(1, window.innerWidth);
    cssH = Math.max(1, window.innerHeight);
    const mobile = cssW < 720;
    const dpr = mobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dot = mobile ? 1.2 : 1.35;

    let sep = mobile ? 16 : 14;
    let cols = Math.max(8, Math.round(cssW / sep));
    let rows = Math.max(8, Math.round(cssH / sep));
    const cap = mobile ? 1800 : 7200;
    while (cols * rows > cap) {
      sep += 2;
      cols = Math.max(8, Math.round(cssW / sep));
      rows = Math.max(8, Math.round(cssH / sep));
    }
    const gapX = cssW / cols;
    const gapY = cssH / rows;
    count = cols * rows;
    points = new Float32Array(count * STRIDE);
    bins = new Uint8Array(count);
    xy = new Float32Array(count * 2);
    order = new Uint16Array(count);

    if (!cached) cached = sampleImage() || { failed: true };
    const samp = cached && cached.data ? cached : null;
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let iw = 1;
    let ih = 1;
    let data = null;
    if (samp) {
      iw = samp.iw;
      ih = samp.ih;
      data = samp.data;
      scale = Math.max(cssW / iw, cssH / ih);
      ox = (cssW - iw * scale) / 2;
      oy = (cssH - ih * scale) / 2;
    }

    let n = 0;
    for (let j = 0; j < rows; j += 1) {
      for (let i = 0; i < cols; i += 1) {
        const tx = (i + 0.5) * gapX;
        const ty = (j + 0.5) * gapY;
        let lum = 0.16 + 0.14 * (0.5 + 0.5 * Math.sin(i * 0.48) * Math.sin(j * 0.31));
        if (data) {
          const px = clamp(Math.round((tx - ox) / scale), 0, iw - 1);
          const py = clamp(Math.round((ty - oy) / scale), 0, ih - 1);
          lum = pixelWeight(data, iw, ih, px, py) * 0.48;
        }
        const h1 = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
        const h2 = Math.sin(j * 269.5 + i * 183.3) * 43758.5453;
        const u = h1 - Math.floor(h1);
        const v = h2 - Math.floor(h2);
        const ang = u * Math.PI * 2;
        const mag = (0.3 + v) * sep * 0.42;
        const o = n * STRIDE;
        points[o] = tx;
        points[o + 1] = ty;
        points[o + 2] = Math.cos(ang) * mag;
        points[o + 3] = Math.sin(ang) * mag;
        points[o + 4] = lum;
        points[o + 5] = i;
        points[o + 6] = j;
        n += 1;
      }
    }
  };

  const draw = (now) => {
    requestAnimationFrame(draw);
    if (!last) last = now;
    const dt = Math.min(34, now - last);
    last = now;
    time += dt * 0.00038;
    displayP += (targetP - displayP) * 0.11;

    const p = displayP;
    const mix = smooth(ramp(p, 0.52, 0.96));
    const scatter = Math.sin(smooth(ramp(p, 0.5, 1)) * Math.PI);
    const wave = smooth(ramp(p, 0.62, 1));
    const fadeIn = smooth(ramp(p, 0.05, 0.26));
    const photoOp = 1 - smooth(ramp(p, 0.2, 0.62));
    const copyOp = 1 - smooth(ramp(p, 0.06, 0.3));
    const photoKey = photoOp.toFixed(3);
    const copyKey = copyOp.toFixed(3);
    if (photo && photoKey !== photoShown) {
      photoShown = photoKey;
      photo.style.opacity = photoKey;
    }
    if (copy && copyKey !== copyShown) {
      copyShown = copyKey;
      copy.style.opacity = copyKey;
      copy.style.transform = `translate3d(0, ${(-18 * (1 - copyOp)).toFixed(2)}px, 0)`;
    }
    if (!points || !count) return;

    const amp = Math.min(cssW, cssH) * 0.006 * wave;
    const t = time;
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "rgba(255,255,255,.62)";

    const place = (n, x, y) => {
      xy[n * 2] = x;
      xy[n * 2 + 1] = y;
    };
    const rectAt = (n) => {
      ctx.rect(xy[n * 2], xy[n * 2 + 1], dot, dot);
    };

    binCount.fill(0);
    for (let n = 0; n < count; n += 1) {
      const o = n * STRIDE;
      const col = points[o + 5];
      const row = points[o + 6];
      const lum = points[o + 4];
      const x = points[o] + points[o + 2] * scatter + Math.sin(row * 0.52 + t * 0.85) * amp * 0.28;
      const y = points[o + 1] + points[o + 3] * scatter + (Math.sin(col * 0.42 + t * 1.2) + Math.sin(row * 0.34 + t * 0.92)) * amp;
      place(n, x, y);
      const srcA = lum;
      const a = (srcA * (1 - mix) + 0.28 * mix) * fadeIn * 0.55;
      const bin = a <= 0.045 ? 0 : Math.min(BINS - 1, Math.ceil(a * (BINS - 1)));
      bins[n] = bin;
      binCount[bin] += 1;
    }

    let acc = 0;
    for (let b = 0; b < BINS; b += 1) {
      binStart[b] = acc;
      acc += binCount[b];
    }
    cursor.set(binStart);
    for (let n = 0; n < count; n += 1) {
      const bin = bins[n];
      if (!bin) continue;
      order[cursor[bin]] = n;
      cursor[bin] += 1;
    }

    for (let b = 1; b < BINS; b += 1) {
      const start = binStart[b];
      const end = start + binCount[b];
      if (start === end) continue;
      ctx.globalAlpha = b / (BINS - 1);
      ctx.beginPath();
      for (let k = start; k < end; k += 1) rectAt(order[k]);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  let booted = false;
  const boot = () => {
    if (booted) return;
    booted = true;
    build();
    measure();
    requestAnimationFrame(draw);
  };

  if (photoImg.complete) boot();
  else {
    photoImg.addEventListener("load", boot, { once: true });
    photoImg.addEventListener("error", boot, { once: true });
  }

  addEventListener("resize", () => {
    if (!points) return;
    build();
    measure();
  }, { passive: true });
  addEventListener("scroll", measure, { passive: true });
})();
