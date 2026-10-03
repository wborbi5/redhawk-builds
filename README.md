# Redhawk Builds

Dark-first marketing site for Redhawk Builds, a Miami University fintech build weekend, November 6 to 8, 2026.

## Development

Static HTML, CSS, and JavaScript, with locally bundled fonts. No installation or build step required.

Serve this folder with `python -m http.server 8000` and open `http://localhost:8000`.

## Configuration

Edit `config.js`. Registration is the Google Form (`REGISTER_URL`). Luma, Devpost, and GroupMe are secondary. Prize amounts live only in `prizes` inside that file. Leave `SPONSOR_EMAIL` blank until a real inbox exists.

The hero illustration is `assets/hero/05_cartoon_mcvey.webp`, with the jpg kept beside it. The tagline is real HTML. Host marks are white-on-transparent files in `assets/logos/`.

Install the original green favicon with `node scripts/install-logo.mjs path/to/icon.svg`.

Configure static social metadata with `node scripts/set-social-origin.mjs https://your-production-domain`.

## Deployment

Vercel: framework Other, root directory `.`, no build command, output directory `.`. Live site: https://redhawk-builds.vercel.app. Deploy manually with `vercel --prod`. Automatic Git deployments require connecting the GitHub account to Vercel, then linking this repository.

## Brand

Ink backgrounds; brick-red actions; green for prices and prize amounts. Barlow Condensed ExtraBold for headings and major prize figures; DM Sans for labels, body text, and ordinary numbers. Font licenses are included in `assets/fonts/`.

Registration URLs, contact email, final logo artwork, and finals timing still require organizer input.

