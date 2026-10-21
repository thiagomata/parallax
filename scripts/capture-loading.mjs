#!/usr/bin/env node
/**
 * Regenerates the loading-screen images: a black-and-white still of each scene's first
 * frame, saved to public/img/loading/<page>.jpg.
 *
 *   npm run capture-loading            all pages
 *   npm run capture-loading -- hero    only the pages named
 *
 * Dev-time only (Node + headless Chromium via Playwright, already used by the browser
 * tests) - it adds nothing to the site's JavaScript. Run it after changing a scene and commit
 * the new images. Headless Chromium has no camera, so each scene is captured at its resting
 * view (the mouse fallback, centered).
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const PAGES = [
    { name: 'hero', path: '' },
    ...Array.from({ length: 12 }, (_, i) => ({ name: `tutorial-${i + 1}`, path: `docs/tutorial/tutorial-${i + 1}/` })),
    { name: 'airplane', path: 'docs/showroom/airplane/' },
];
const OUT_DIR = 'public/img/loading';
const READY_TIMEOUT_MS = 60_000;

const only = process.argv.slice(2);
const pages = only.length ? PAGES.filter(page => only.includes(page.name)) : PAGES;
if (!pages.length) {
    console.error(`No pages match: ${only.join(', ')}. Known: ${PAGES.map(page => page.name).join(', ')}`);
    process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });
const server = await createServer({ server: { port: 0, open: false }, logLevel: 'error' });
await server.listen();
const baseUrl = server.resolvedUrls.local[0]; // includes the /parallax/ base
const browser = await chromium.launch();

try {
    // ~820 px wide canvases, matching the loading screen's maximum width.
    const context = await browser.newContext({ viewport: { width: 900, height: 820 }, deviceScaleFactor: 1 });
    // Record 'sceneready' from the start, so it can't fire before we listen.
    await context.addInitScript(() => {
        addEventListener('sceneready', () => { window.__sceneReady = true; }, true);
    });

    for (const page of pages) {
        const tab = await context.newPage();
        await tab.goto(baseUrl + page.path);
        await tab.waitForFunction(() => window.__sceneReady === true, null, { timeout: READY_TIMEOUT_MS });

        // The scene's visible canvas (p5 can leave an empty hidden one next to it).
        const canvas = tab.locator('.canvas-box canvas').filter({ visible: true }).first();
        await canvas.evaluate(element => {
            // Hide anything drawn over the canvas (loading screen, status line, page labels) -
            // every element overlapping it that isn't the canvas or one of its containers.
            const box = element.getBoundingClientRect();
            for (const other of document.body.querySelectorAll('*')) {
                if (other === element || other.contains(element) || element.contains(other)) continue;
                const rect = other.getBoundingClientRect();
                const overlaps = rect.width > 0 && rect.height > 0 && rect.left < box.right && rect.right > box.left
                    && rect.top < box.bottom && rect.bottom > box.top;
                if (overlaps) other.style.visibility = 'hidden';
            }
            // Black and white, slightly darkened so the "Loading" label reads on top of it.
            element.style.filter = 'grayscale(1) brightness(0.7)';
            return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });

        const file = `${OUT_DIR}/${page.name}.jpg`;
        await canvas.screenshot({ path: file, type: 'jpeg', quality: 60 });
        console.log(`captured ${file}`);
        await tab.close();
    }
} finally {
    await browser.close();
    await server.close();
}
