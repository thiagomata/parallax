import p5 from 'p5';
import { P5GraphicProcessor } from './p5_graphic_processor';
import type {AssetLoader} from '../types';

const sketch = (p: p5) => {
    let gp: P5GraphicProcessor;
    let testImg: p5.Image | undefined;
    let testFont: p5.Font | undefined;

    p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);

        const dummyLoader = {} as AssetLoader;
        gp = new P5GraphicProcessor(p, dummyLoader);

        // Load Image
        p.loadImage('/parallax/img/red.png')
            .then((img) => { testImg = img; })
            .catch((err) => console.error("Image load failed:", err));

        // Load Font - WEBGL requires a loaded font to render p.text()
        // Replace with the path to a real .ttf or .otf file
        p.loadFont('/parallax/fonts/Roboto-Regular.ttf')
            .then((f) => { testFont = f; })
            .catch((err) => console.error("Font load failed:", err));
    };

    p.draw = () => {
        p.background(20);
        p.orbitControl();

        gp.setCamera({ x: 200, y: -200, z: 500 }, { x: 0, y: 0, z: 0 });

        // 1. TEXTURE TEST
        if (testImg) {
            const mockAsset = { internalRef: testImg, status: 'READY' };
            gp.drawTexture(mockAsset as any, 100, 100, 255);
        }

        // 2. TEXT TEST
        // We only render if the font has successfully resolved
        if (testFont) {
            p.textFont(testFont);
            p.textSize(32);
            p.fill(255);
            // In 3D, text is a flat plane. Let's move it slightly forward (z: 1)
            // so it doesn't "z-fight" with the background.
            gp.drawLabel("GP TEST", { x: -50, y: -100, z: 1 });
        }

        // 3. BOXES
        gp.push();
        gp.fill({ red: 255, green: 50, blue: 50 });
        gp.drawBox(50);
        gp.pop();

        gp.push();
        gp.translate(100, 0, 0);
        gp.rotateZ(p.frameCount * 0.02);
        gp.fill({ red: 50, green: 50, blue: 255 });
        gp.drawBox(30);
        gp.pop();

        const greenVal = gp.map(p.sin(p.frameCount * 0.05), -1, 1, 100, 255);
        gp.push();
        gp.translate(-100, 0, 0);
        gp.fill({ red: 50, green: greenVal, blue: 50 });
        gp.drawBox(30);
        gp.pop();
    };
};

new p5(sketch);