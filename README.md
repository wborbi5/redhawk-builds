# Redhawk Builds

Dark-first marketing site for Redhawk Builds, a Miami University fintech build weekend, November 6–8, 2026.

## Development

Static HTML, CSS, and JavaScript, with locally bundled fonts. No installation or build step required.

Serve this folder with `python -m http.server 8000` and open `http://localhost:8000`.

## Configuration

Edit `config.js` with the real Typeform, Luma, Devpost, and GroupMe URLs, contact email, and original logo paths. Unconfigured links display a coming-soon message. Typeform is the registration source of truth.

The supplied campus photo is displayed at its original modest resolution. Brand and host logos remain reserved until the official SVGs are supplied. No university marks have been recreated.

Install the original green favicon with `node scripts/install-logo.mjs path/to/icon.svg`.

Configure static social metadata with `node scripts/set-social-origin.mjs https://your-production-domain`.

## Deployment

Vercel: framework Other, root directory `.`, no build command, output directory `.`. The GitHub repository is connected for deployment updates when available.

## Brand

Ink backgrounds; brick-red actions; green for prices and prize amounts. JetBrains Mono for headings, labels, and numbers; Inter for body text. Font licenses are included in `assets/fonts/`.

Registration URLs, contact email, final logo artwork, and finals timing still require organizer input.
