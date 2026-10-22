#!/usr/bin/env node
/**
 * Measures the per-frame cost of MediaPipe's face blendshapes (eyes / mouth open, smile...):
 * runs scripts/bench-blendshapes.html in headless Chromium and prints the face landmarker's
 * detectForVideo time per frame with outputFaceBlendshapes off and on.
 *
 *   node scripts/bench-blendshapes.mjs            150 frames
 *   node scripts/bench-blendshapes.mjs 300        more frames, steadier numbers
 *
 * Dev-time only, like scripts/capture-loading.mjs. Headless Chromium runs MediaPipe on the
 * CPU (as the app does), so the absolute times differ from a real browser - compare the two
 * columns, not the numbers against a target.
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';

const frames = Number(process.argv[2] ?? 150);
const server = await createServer({ server: { port: 0, open: false }, logLevel: 'error' });
await server.listen();
const baseUrl = server.resolvedUrls.local[0]; // includes the /parallax/ base
const browser = await chromium.launch();

try {
    const page = await browser.newPage();
    page.on('pageerror', error => console.error('page error:', error.message));
    await page.goto(`${baseUrl}scripts/bench-blendshapes.html?frames=${frames}`);
    await page.waitForFunction(() => window.__benchResult, null, { timeout: 300_000 });
    const result = await page.evaluate(() => window.__benchResult);

    const ms = value => `${value.toFixed(2)} ms`;
    console.log(`frames timed: ${result.frames} (faces with blendshapes: ${result.facesWithBlendshapes})`);
    console.log('                    mean       median     p95');
    for (const name of ['off', 'on']) {
        const { mean, median, p95 } = result[name];
        console.log(`blendshapes ${name.padEnd(3)}  ${ms(mean).padEnd(10)} ${ms(median).padEnd(10)} ${ms(p95)}`);
    }
    const extra = result.on.median - result.off.median;
    console.log(`extra per frame (median): ${ms(extra)} (${((extra / result.off.median) * 100).toFixed(0)}%)`);
    console.log('sample scores:', JSON.stringify(result.sample));
} finally {
    await browser.close();
    await server.close();
}
