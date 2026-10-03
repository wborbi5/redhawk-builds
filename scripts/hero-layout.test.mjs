/**
 * Hero and host layout must hold with JavaScript disabled.
 * Run: NODE_PATH=/tmp/shot/node_modules node scripts/hero-layout.test.mjs
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, "").replace(/^(\.\.[/\\])+/, "");
  const path = join(root, rel || "index.html");
  if (!path.startsWith(root)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    const body = await readFile(path);
    res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const puppeteerSpec = process.env.PUPPETEER_CORE || "puppeteer-core";
let puppeteer;
try {
  puppeteer = await import(puppeteerSpec);
} catch {
  puppeteer = await import("/tmp/shot/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js");
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});

const viewports = [
  { width: 1024, height: 600 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 819, height: 480 },
  { width: 1024, height: 576 },
  { width: 1093, height: 614 },
  { width: 390, height: 844 },
];

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function measure(page) {
  return page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const heroImg = document.querySelector(".hero-photo img");
    const h1 = document.querySelector(".hero-copy h1");
    const logos = [...document.querySelectorAll(".logo-chip img")].map((img) => {
      const chip = img.closest(".logo-chip").getBoundingClientRect();
      const r = img.getBoundingClientRect();
      return {
        alt: img.getAttribute("alt"),
        host: Boolean(img.closest(".host")),
        w: r.width,
        h: r.height,
        attrW: img.width,
        attrH: img.height,
        chipW: chip.width,
        chipH: chip.height,
        inside: r.left >= chip.left - 1 && r.right <= chip.right + 1 && r.top >= chip.top - 1 && r.bottom <= chip.bottom + 1,
      };
    });
    const cards = [...document.querySelectorAll(".host")].map((card) => ({
      h: card.getBoundingClientRect().height,
      name: card.querySelector("h3").textContent,
      sub: card.querySelector("p").textContent,
      nameY: card.querySelector("h3").getBoundingClientRect().y,
    }));
    return {
      vw: innerWidth,
      vh: innerHeight,
      js: document.documentElement.classList.contains("no-js") ? "off" : "on",
      hero: box(heroImg),
      h1: { ...box(h1), text: h1.innerText.replace(/\s+/g, " ") },
      logos,
      cards,
      scrollW: document.documentElement.scrollWidth,
    };
  });
}

const failures = [];
try {
  for (const js of [false, true]) {
    for (const viewport of viewports) {
      const page = await browser.newPage();
      await page.setJavaScriptEnabled(js);
      await page.setViewport(viewport);
      await page.goto(origin + "/", { waitUntil: "networkidle0" });
      const m = await measure(page);
      const label = `${js ? "js" : "no-js"} ${viewport.width}x${viewport.height}`;
      const coverW = m.hero.w >= m.vw - 2 && m.hero.h >= m.vh - 2 && m.hero.x <= 1 && m.hero.y <= 1;
      const center = Math.abs(m.h1.x + m.h1.w / 2 - m.vw / 2);
      const clipped = m.h1.x < 4;
      const natural = m.logos.filter((logo) => logo.w > 140 || logo.h > 120 || !logo.inside || logo.attrW > 160 || logo.attrH > 120);
      const chipHeights = [...new Set(m.logos.filter((l) => l.host).map((l) => Math.round(l.chipH)))];
      const cardHeights = m.cards.map((c) => Math.round(c.h));
      const rows = [];
      for (const card of m.cards) {
        const row = rows.find((group) => Math.abs(group[0].nameY - card.nameY) < 40);
        if (row) row.push(card);
        else rows.push([card]);
      }
      const nameSpread = Math.max(...rows.map((row) => Math.max(...row.map((c) => c.nameY)) - Math.min(...row.map((c) => c.nameY))));
      const subs = Object.fromEntries(m.cards.map((c) => [c.name, c.sub]));
      const expected = {
        "Sigma Eta Pi": "Entrepreneurship fraternity",
        "Miami Banking Club": "Finance and banking",
        MUBC: "Miami University Blockchain Club",
        "RedHawk Applied AI": "Applied AI at Miami",
      };
      const problems = [];
      if (!coverW) problems.push(`hero image ${Math.round(m.hero.w)}x${Math.round(m.hero.h)} at ${Math.round(m.hero.x)},${Math.round(m.hero.y)} does not cover ${m.vw}x${m.vh}`);
      if (center > m.vw * 0.08) problems.push(`headline off center by ${Math.round(center)}px`);
      if (clipped) problems.push(`headline clipped at x=${Math.round(m.h1.x)}`);
      if (natural.length) problems.push(`logos escaped chips ${JSON.stringify(natural)}`);
      if (m.scrollW > m.vw + 1) problems.push(`horizontal overflow ${m.scrollW}>${m.vw}`);
      if (chipHeights.length !== 1) problems.push(`host chips differ ${chipHeights}`);
      const hostChip = m.logos.find((l) => l.host);
      const want = viewport.width <= 720 ? 72 : 96;
      if (hostChip && Math.abs(hostChip.chipH - want) > 1) problems.push(`host chip ${hostChip.chipH}px, expected ${want}`);
      const heightSpread = Math.max(...rows.map((row) => Math.max(...row.map((c) => c.h)) - Math.min(...row.map((c) => c.h))));
      if (heightSpread > 2) problems.push(`card heights ${cardHeights}`);
      if (nameSpread > 2) problems.push(`name baselines differ by ${nameSpread}`);
      for (const [name, sub] of Object.entries(expected)) {
        if (subs[name] !== sub) problems.push(`${name} subtitle ${subs[name]}`);
      }
      if (problems.length) {
        failures.push(`${label}: ${problems.join("; ")}`);
        console.error("FAIL", label, problems.join("; "));
      } else {
        console.log("ok", label);
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("hero layout holds with and without JavaScript");
