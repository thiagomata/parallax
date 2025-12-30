import p5 from 'p5';
import { World } from '../world';
import { P5GraphicProcessor } from './p5_graphic_processor';
import { P5AssetLoader } from './p5_asset_loader';
import {ELEMENT_TYPES} from "../types.ts";

import Prism from 'prismjs';

// Import a theme (you can choose others like 'tomorrow' or 'okaidia')
import 'prismjs/themes/prism-tomorrow.css';

// Import the languages you need
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';

const p5WorldDemo = (p: p5) => {
    let world: World;
    let gp: P5GraphicProcessor;

    p.setup = async () => {
        p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);

        // Use a dummy manager for now that just returns a fixed camera
// Inside your sketch function
        const dummyManager: any = {
            calculateScene: () => {
                // 1. Calculate a time factor (seconds)
                const time = p.millis() * 0.0005; // Adjust speed by changing this multiplier
                const radius = 900; // Distance from the center

                // 2. Use Trigonometry to orbit the Y-axis
                // x = sin(angle) * radius
                // z = cos(angle) * radius
                const camX = Math.sin(time) * radius;
                const camZ = Math.cos(time) * radius;

                // 3. Add a slight vertical "wave" for a more dynamic feel
                const camY = -400 + Math.sin(time * 0.5) * 100;

                return {
                    camera: {
                        x: camX,
                        y: camY,
                        z: camZ
                    },
                    lookAt: { x: 0, y: 0, z: 0 },
                    alpha: 1.0,
                    debug: false
                };
            }
        };

        world = new World(dummyManager);
        const loader = new P5AssetLoader(p);
        gp = new P5GraphicProcessor(p, loader);

        // 1. Far Background (Large Green Box)
        world.addElement('back', {
            type: ELEMENT_TYPES.BOX,
            size: 200,
            position: { x: -100, y: 0, z: -200 }, // Far away
            fillColor: { red: 0, green: 255, blue: 0, alpha: 1.0 }
        });

        // 2. Middle Ground (Semi-transparent Red Box)
        world.addElement('mid', {
            type: ELEMENT_TYPES.BOX,
            size: 150,
            position: { x: 0, y: 0, z: 0 }, // Center
            fillColor: { red: 255, green: 0, blue: 0, alpha: 0.5 }
        });

        // 3. Foreground (Blue Box)
        world.addElement('front', {
            type: ELEMENT_TYPES.BOX,
            size: 100,
            position: { x: 100, y: 0, z: 200 }, // Close to camera
            fillColor: { red: 0, green: 0, blue: 255, alpha: 1.0 }
        });

        world.addElement('title-label', {
            type: ELEMENT_TYPES.TEXT,
            text: "HELLO WORLD",
            size: 40,
            position: { x: 50, y: 0, z: 0 }, // Positioned above the scene
            font: { name: 'Roboto', path: '/parallax/fonts/Roboto-Regular.ttf' },
            fillColor: { red: 255, green: 0, blue: 255, alpha: 1 }
        });

        // No await needed since there are no textures/fonts
        await world.hydrate(loader);
    };

    p.draw = () => {
        p.background(220); // Light gray so we can see shapes clearly

        // This will now handle the sorting and rendering
        world.step(gp);
    };
};

new p5(p5WorldDemo);

/// showing the code in the page

/**
 * Fetches the source code of a file and renders it into an overlay.
 * @param filePath The path to the source file (e.g., '/src/sketch.ts')
 * @param targetElementId The ID of the <pre> or <code> element
 */
export async function highlightSource(filePath: string, targetElementId: string): Promise<void> {
    try {
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error(`Could not fetch source: ${response.statusText}`);
        }

        const code = await response.text();
        const target = document.getElementById(targetElementId);

        if (target) {
            // Using Prism safely with TypeScript
            const highlighted = Prism.highlight(
                code,
                Prism.languages.typescript,
                'typescript'
            );
            target.innerHTML = highlighted;
        }
    } catch (error) {
        console.error("Failed to render source code:", error);
    }
}

// THE CALLERS: Wiring up the UI
document.getElementById('view-source-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('source-modal');
    if (modal) {
        modal.style.display = 'block';
        // Call it here! Assuming you copied your sketch to the public folder
        highlightSource('./p5_world.demo.ts', 'code-output');
    }
});

document.getElementById('close-source-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('source-modal');
    if (modal) modal.style.display = 'none';
});