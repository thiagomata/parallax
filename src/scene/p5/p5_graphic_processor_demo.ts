import p5 from 'p5';
import { P5GraphicProcessor } from './p5_graphic_processor';
import { type AssetLoader } from '../types';

const sketch = (p: p5) => {
    let gp: P5GraphicProcessor;
    let testImg: p5.Image | undefined;
    let testFont: p5.Font | undefined;

    p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);

        // Still using a dummy loader until we integrate the full Registry hydration
        const dummyLoader = {} as AssetLoader;
        gp = new P5GraphicProcessor(p, dummyLoader);

        p.loadImage('/parallax/img/red.png', (img) => { testImg = img; });
        p.loadFont('/parallax/fonts/Roboto-Regular.ttf', (f) => { testFont = f; });
    };

    p.draw = () => {
        p.background(20);
        p.orbitControl();

        gp.setCamera({ x: 300, y: -300, z: 600 }, { x: 0, y: 0, z: 0 });

        gp.push();
        gp.rotateX(p.HALF_PI); // Lay it flat
        gp.stroke({ red: 100, green: 100, blue: 100, alpha: 0.5 }, 1);
        for (let i = -500; i <= 500; i += 50) {
            p.line(i, -500, i, 500);
            p.line(-500, i, 500, i);
        }
        gp.pop();

        if (testImg) {
            const textureInstance = {
                internalRef: testImg,
                texture: { width: 200, height: 200, path: '/red.png' }
            };
            gp.push();
            gp.translate({x:0, y:0, z:-50}); // Place it behind the boxes
            // 0.5 alpha should let the grid lines show through clearly
            gp.drawPanel(textureInstance);
            gp.pop();
        }

        if (testFont) {
            p.textFont(testFont);
            p.textSize(64);
            gp.noStroke();
            // White text at 50% opacity
            gp.fill({ red: 255, green: 255, blue: 255, alpha: 0.5 });
            gp.drawText("ALPHA CHECK", { x: -200, y: -30, z: 50 });
        }

        const greenVal = gp.map(p.sin(p.frameCount * 0.05), -1, 1, 100, 255);
        gp.push();
        gp.translate({x:20, y:20, z:150});
        gp.fill({ red: 50, green: greenVal, blue: 255, alpha: 0.4 });
        gp.box(80);
        gp.pop();

        gp.push();
        gp.translate({x:60, y:-50, z:320});
        gp.rotateZ(p.frameCount * 0.02);
        gp.stroke({ red: 0, green: 0, blue: 255, alpha: 1 }, 3);
        gp.fill({ red: 255, green: 50, blue: 250, alpha: 1.0 }, 0.1);
        gp.box(50);
        gp.pop();
    };
};

new p5(sketch);