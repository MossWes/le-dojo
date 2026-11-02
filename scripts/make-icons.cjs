// Generates the app icons (PNG) from the Fawohodie symbol. Dev tool, run once:
//   node scripts/make-icons.cjs   (needs Playwright with Chromium)
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');

const symbol = readFileSync('assets/icons/fawohodie.svg', 'utf8')
	.replace(/^<svg[^>]*>/, '')
	.replace(/<\/svg>\s*$/, '');

// padding: share of the side left around the gold disc (bigger for "maskable").
function svg(size, padding) {
	const r = (size * (1 - padding * 2)) / 2;
	const c = size / 2;
	const s = (r * 1.15) / 24;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#dcb86c"/><stop offset="0.55" stop-color="#a9843f"/><stop offset="1" stop-color="#7a5d29"/></linearGradient></defs>
<rect width="${size}" height="${size}" fill="#15110d"/>
<circle cx="${c}" cy="${c}" r="${r}" fill="url(#g)"/>
<g transform="translate(${c - 12 * s} ${c - 12 * s}) scale(${s})" color="#1b150f">${symbol}</g></svg>`;
}

const targets = [
	['static/icons/apple-touch-icon.png', 180, 0.08],
	['static/icons/icon-192.png', 192, 0.06],
	['static/icons/icon-512.png', 512, 0.06],
	['static/icons/icon-maskable-512.png', 512, 0.18]
];

(async () => {
	const browser = await chromium.launch();
	const page = await browser.newPage();
	for (const [file, size, padding] of targets) {
		await page.setViewportSize({ width: size, height: size });
		await page.setContent(`<html><body style="margin:0">${svg(size, padding)}</body></html>`);
		await page.locator('svg').screenshot({ path: file, omitBackground: false });
		console.log(file);
	}
	await browser.close();
})();
