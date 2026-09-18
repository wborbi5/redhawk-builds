(() => {
  'use strict';
  const config = window.RHB_CONFIG || {};
  const status = document.getElementById('link-status');
  const labels = {TYPEFORM_URL:'Registration', LUMA_URL:'Luma', DEVPOST_URL:'Devpost', GROUPME_URL:'GroupMe'};
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
    img.onload = () => slot.replaceChildren(img); img.src = src;
  });
})();
