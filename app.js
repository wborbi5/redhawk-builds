(() => {
  'use strict';
  const config = window.RHB_CONFIG || {};
  const status = document.getElementById('link-status');
  const labels = {TYPEFORM_URL:'Registration', LUMA_URL:'Luma', DEVPOST_URL:'Devpost', GROUPME_URL:'GroupMe', SEPI_URL:'Sigma Eta Pi', BANKING_URL:'Miami Banking Club', AI_URL:'RedHawk Applied AI'};
  const validUrl = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
  document.querySelectorAll('[data-link]').forEach(link => {
    const key = link.dataset.link;
    if (validUrl(config[key])) { link.href = config[key]; }
    else link.addEventListener('click', () => { status.textContent = `${labels[key]} link coming soon. Check back here for updates.`; });
  });
  if (validUrl(config.TYPEFORM_URL)) status.textContent = 'Complete Typeform to register. Luma RSVP alone does not register you.';
  const email = config.CONTACT_EMAIL;
  if (typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const a = document.createElement('a'); a.href = `mailto:${email}`; a.textContent = email;
    document.getElementById('contact').replaceWith(a);
  }
  Object.entries(config.logos || {}).forEach(([key, src]) => {
    if (!src) return;
    const slot = document.querySelector(`[data-logo="${key}"]`); if (!slot) return;
    const img = new Image(); img.alt = {primaryDark:'Redhawk Builds', sepi:'Sigma Eta Pi', banking:'Miami Banking Club', ai:'RedHawk Applied AI'}[key];
    img.onload = () => (slot.querySelector('a') || slot).replaceChildren(img); img.src = src;
  });

  // ---- Motion layer (all optional: content is fully visible without it) ----
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const masthead = document.querySelector('.masthead');

  // Masthead condenses and a progress bar fills as the page scrolls.
  const bar = document.createElement('div'); bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true'); document.body.prepend(bar);
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    masthead.classList.toggle('compact', scrollY > 40);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, {passive: true});
  onScroll();

  if (!('IntersectionObserver' in window)) { document.querySelector('.ticker-bar')?.classList.add('in'); return; }

  // Highlight the nav link for the section in view; clear it in sections without one.
  const navLinks = [...document.querySelectorAll('.masthead nav a')];
  const navObserver = new IntersectionObserver(entries => entries.forEach(({target, isIntersecting}) => {
    if (!isIntersecting) return;
    navLinks.forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === `#${target.id}`));
  }), {rootMargin: '-45% 0px -50% 0px'});
  document.querySelectorAll('main > section').forEach(section => navObserver.observe(section));

  // Count numbers up from zero, keeping the final value for assistive tech.
  const countUp = el => {
    const end = parseFloat(el.dataset.count), decimals = +el.dataset.decimals || 0;
    const final = el.textContent, prefix = final.match(/^\D*/)[0];
    const shown = document.createElement('span'), hidden = document.createElement('span');
    shown.setAttribute('aria-hidden', 'true'); hidden.className = 'sr-only'; hidden.textContent = final;
    el.replaceChildren(shown, hidden);
    const fmt = v => prefix + v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
    const start = performance.now(), dur = 1400;
    const tick = now => {
      const t = Math.min((now - start) / dur, 1);
      shown.textContent = fmt(end * (1 - Math.pow(1 - t, 4)));
      if (t < 1) requestAnimationFrame(tick); else el.textContent = final;
    };
    requestAnimationFrame(tick);
  };
  if (reduced) { document.querySelector('.ticker-bar')?.classList.add('in'); return; }
  document.querySelectorAll('.prizes .money').forEach(el => { el.dataset.count = el.textContent.replace(/[^\d.]/g, ''); });

  // Fade sections in as they scroll into view, staggering siblings.
  const targets = new Set();
  const add = (el, i) => { if (!el.classList.contains('reveal')) { el.classList.add('reveal'); el.style.setProperty('--d', `${Math.min(i, 5) * 0.09}s`); targets.add(el); } };
  document.querySelectorAll('.section-heading, .audience, .judging, .closing').forEach(g => [...g.children].forEach(add));
  document.querySelectorAll('.beats, .schedule, .prizes, .hosts, .faq-list').forEach(g => [...g.children].forEach(add));
  document.querySelectorAll('.partners > :not(.hosts), .faq > :first-child').forEach(add);
  document.querySelectorAll('.problem-note, .venue, .sponsors').forEach(add);

  const reveal = new IntersectionObserver(entries => entries.forEach(({target, isIntersecting}) => {
    if (!isIntersecting) return;
    reveal.unobserve(target);
    target.classList.add('in');
    if (target.matches('.prizes article')) countUp(target.querySelector('.money'));
    target.addEventListener('transitionend', e => {
      if (e.propertyName !== 'opacity') return;
      target.classList.remove('reveal', 'in'); target.style.removeProperty('--d');
    }, {once: true});
  }), {threshold: 0.12, rootMargin: '0px 0px -6% 0px'});
  targets.forEach(el => reveal.observe(el));

  // Footer ticker: count the price up and draw the line when it arrives.
  const ticker = document.querySelector('.ticker-bar');
  if (ticker) new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return;
    o.disconnect(); ticker.classList.add('in'); countUp(ticker.querySelector('.money'));
  }, {threshold: 0.6}).observe(ticker);
})();
