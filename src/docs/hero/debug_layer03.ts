import p5 from 'p5';
import { appAssetPath } from '../../utils/app_paths.ts';

// Minimal isolated test: raw p5, no custom engine (no World/Stage/resolver), just
// loadImage + texture + plane for layer-03.png at its natural pixel size. If this renders
// correctly, the bug is somewhere in our engine's fit/scale/resolver logic, not the asset
// or p5 itself.
const instance = new p5(() => {}, document.querySelector('main')!);

let img: p5.Image;
const label = document.createElement('div');
label.style.cssText = 'position:fixed;top:0;left:0;color:#0f0;font:14px monospace;background:#000;padding:4px;z-index:10;';
document.body.appendChild(label);

instance.setup = () => {
    instance.createCanvas(900, 700, instance.WEBGL);
    instance.loadImage(appAssetPath('img/hero/layer-03.png'), loaded => {
        img = loaded;
        label.textContent = `img.width=${img.width} img.height=${img.height}`;
    });
};

instance.draw = () => {
    instance.background(0, 0, 255);
    if (!img) return;
    instance.push();
    instance.texture(img);
    instance.plane(img.width, img.height);
    instance.pop();
};
