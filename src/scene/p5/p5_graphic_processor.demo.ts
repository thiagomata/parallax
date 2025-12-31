import p5 from 'p5';
import { P5GraphicProcessor } from './p5_graphic_processor';
import {
    ASSET_STATUS,
    type AssetLoader, type BoxProps,
    ELEMENT_TYPES, type ElementAssets, type FontInstance, type FontRef, type PanelProps, type SceneState, type TextProps
} from '../types';

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

            gp.drawPanel(
                {
                    type: ELEMENT_TYPES.PANEL,
                    width: 200,
                    height: 200,
                    position: {x: 0, y: 0, z: -50},
                    alpha: 0.5,
                    texture: textureInstance.texture,
                } as PanelProps,
                {
                    texture: {
                        status: ASSET_STATUS.READY,
                        value: textureInstance
                    }
                } as ElementAssets<p5.Image, p5.Font>,
                {
                    camera: {x:0,y:0,z:0},
                    lookAt: {x:0,y:0,z:100},
                    alpha: 1
                }  as SceneState
            )
        }

        if (testFont) {
            gp.drawText(
                {
                    type: ELEMENT_TYPES.TEXT,
                    font: {
                        name: "Roboto",
                        path: '/parallax/fonts/Roboto-Regular.ttf',
                    },
                    size: 64,
                    fillColor: {
                        red: 100,
                        green: 255,
                        blue: 255,
                        alpha: 0.8,
                    },
                    text: "ALPHA CHECK",
                    position: {x: -50, y: -30, z: 50},
                } as TextProps,
                {
                    font: {
                        status: ASSET_STATUS.READY,
                        value: {
                            font: {
                                name: 'Roboto',
                                path: '/parallax/fonts/Roboto-Regular.ttf',
                            } as FontRef,
                            internalRef: testFont,
                        } as FontInstance<p5.Font>
                    }
                } as ElementAssets<p5.Image, p5.Font>,
                {
                    camera: {x:0,y:0,z:0},
                    lookAt: {x:0,y:0,z:100},
                    alpha: 1
                }  as SceneState
            )
        }

        const greenVal = gp.map(p.sin(p.frameCount * 0.05), -1, 1, 100, 255);

        //     drawBox(boxProps: BoxProps, assets: ElementAssets, sceneState: SceneState): void {
        gp.drawBox(
            {
                type:  ELEMENT_TYPES.BOX,
                size: 80,
                position: {x: 20, y: 20, z: 150},
                fillColor: {red: 50, green: greenVal, blue: 255, alpha: 0.5},
            } as BoxProps,
            {},
            {
                camera: {x:0,y:0,z:0},
                lookAt: {x:0,y:0,z:100},
                alpha: 1
            }  as SceneState
        )

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