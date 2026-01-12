import p5 from 'p5';
import { P5GraphicProcessor } from './p5_graphic_processor';
import { P5AssetLoader, type P5Bundler } from './p5_asset_loader';
import {
    ASSET_STATUS,
    DEFAULT_SETTINGS,
    ELEMENT_TYPES,
    type ElementAssets,
    type SceneState,
    type TextureRef,
    type FontRef,
    type BlueprintPanel,
    type BlueprintText,
    type BlueprintBox,
    type ResolvedPanel,
    type ResolvedText,
    type ResolvedBox
} from '../types';
import {resolve} from "../resolver.ts";

const sketch = (p: p5) => {
    let gp: P5GraphicProcessor;
    let loader: P5AssetLoader;

    // 1. Define Asset References
    const redTextureRef: TextureRef = {
        path: '/parallax/img/red.png',
        width: 200,
        height: 200
    };

    const robotoFontRef: FontRef = {
        name: "Roboto",
        path: '/parallax/fonts/Roboto-Regular.ttf'
    };

    // 2. Local State for Assets (Simulating the Registry's storage)
    let redTextureAsset: ElementAssets<P5Bundler>['texture'];
    let robotoFontAsset: ElementAssets<P5Bundler>['font'];

    p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);

        // Initialize our core Graphics Bundle components
        loader = new P5AssetLoader(p);
        gp = new P5GraphicProcessor(p, loader);

        // Hydrate assets using our deduplicating loader
        loader.hydrateTexture(redTextureRef).then(asset => {
            redTextureAsset = asset;
        });

        loader.hydrateFont(robotoFontRef).then(asset => {
            robotoFontAsset = asset;
        });
    };

    p.draw = () => {
        p.background(20);
        p.orbitControl();

        // 3. Construct Scene State for this frame
        const sceneState: SceneState = {
            settings: DEFAULT_SETTINGS,
            playback: {
                now: p.millis(),
                delta: p.deltaTime,
                progress: 0,
                frameCount: p.frameCount
            },
            camera: {
                position: { x: 300, y: -300, z: 600 },
                lookAt: { x: 0, y: 0, z: 0 },
                yaw: 0,
                pitch: 0,
                direction: { x: 0, y: 0, z: 1 }
            }
        };

        gp.setCamera(sceneState.camera.position, sceneState.camera.lookAt);

        // --- Grid Floor Debug ---
        gp.push();
        gp.rotateX(p.HALF_PI);
        gp.stroke({ red: 100, green: 100, blue: 100, alpha: 0.5 }, 1);
        for (let i = -500; i <= 500; i += 50) {
            p.line(i, -500, i, 500);
            p.line(-500, i, 500, i);
        }
        gp.pop();

        // --- PANEL: With Texture Hydration ---
        if (redTextureAsset?.status === ASSET_STATUS.READY) {
            const panelBlueprint: BlueprintPanel = {
                type: ELEMENT_TYPES.PANEL,
                width: 200,
                height: 200,
                position: { x: 0, y: 0, z: -50 },
                alpha: 0.5,
                texture: redTextureRef,
            };

            // Resolve and cast to specific type for the Processor
            const resolved = resolve(panelBlueprint, sceneState) as ResolvedPanel;

            gp.drawPanel(
                resolved,
                { texture: redTextureAsset },
                sceneState
            );
        }

        // --- TEXT: With Font Hydration ---
        if (robotoFontAsset?.status === ASSET_STATUS.READY) {
            const textBlueprint: BlueprintText = {
                type: ELEMENT_TYPES.TEXT,
                text: "PARALLAX ENGINE",
                size: 64,
                position: { x: -200, y: -100, z: 50 },
                fillColor: { red: 100, green: 255, blue: 255, alpha: 0.8 },
                rotate: { x: 0, y: 0, z: 0 }
            };

            const resolved = resolve(textBlueprint, sceneState) as ResolvedText;

            gp.drawText(
                resolved,
                { font: robotoFontAsset },
                sceneState
            );
        }

        // --- BOX: With Dynamic Computed Logic ---
        const boxBlueprint: BlueprintBox = {
            type: ELEMENT_TYPES.BOX,
            size: 80,
            position: { x: 20, y: 20, z: 150 },
            // Rotation based on frame count
            rotate: (s: SceneState) => ({
                x: 0,
                y: s.playback.frameCount * 0.02,
                z: 0
            }),
            // Color pulsing via sin wave
            fillColor: (s: SceneState) => ({
                red: 50,
                green: gp.map(p.sin(s.playback.frameCount * 0.05), -1, 1, 100, 255),
                blue: 255,
                alpha: 0.5
            }),
            strokeColor: { red: 255, green: 255, blue: 255, alpha: 1 },
            strokeWidth: 1
        };

        const resolvedBox = resolve(boxBlueprint, sceneState) as ResolvedBox;

        gp.drawBox(
            resolvedBox,
            {}, // No external assets needed for this box
            sceneState
        );

        // --- Manual HUD/Direct Mode Check ---
        gp.push();
        gp.translate({ x: 100, y: -100, z: 300 });
        gp.rotateZ(p.frameCount * 0.01);
        gp.stroke({ red: 255, green: 255, blue: 0, alpha: 1 }, 2);
        gp.noFill();
        gp.box(40);
        gp.pop();
    };
};

new p5(sketch);