import p5 from 'p5';
import { World } from '../world';
import { P5GraphicProcessor } from './p5_graphic_processor';
import { P5AssetLoader } from './p5_asset_loader';
import {ELEMENT_TYPES} from "../types.ts";
import demoSourceCode from './p5_world.demo.ts?raw';
import Prism from 'prismjs';

// Import a theme (you can choose others like 'tomorrow' or 'okaidia')
import 'prismjs/themes/prism-tomorrow.css';

// Import the languages you need
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import {SceneManager} from "../scene_manager.ts";
import {OrbitModifier} from "../modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../modifiers/center_focus_modifier.ts";

const p5WorldDemo = (p5: p5) => {
    let world: World;
    let gp: P5GraphicProcessor;
    let manager: SceneManager;

    p5.setup = async () => {
        p5.createCanvas(window.innerWidth, window.innerHeight, p5.WEBGL);

        manager = new SceneManager({ x: 0, y: 0, z: 900 });
        manager.setDebug(true);
        manager.setStickDistance(1000);

        manager.addCarModifier(new OrbitModifier(p5, 1000));
        manager.addStickModifier(new CenterFocusModifier());

        world = new World(manager);

        const loader = new P5AssetLoader(p5);
        gp = new P5GraphicProcessor(p5, loader);


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
            position: { x: 50, y: 0, z: 0 },
            font: { name: 'Roboto', path: '/parallax/fonts/Roboto-Regular.ttf' },
            fillColor: { red: 255, green: 0, blue: 255, alpha: 1 }
        });

        await world.hydrate(loader);
    };

    p5.draw = () => {
        p5.background(220); // Light gray so we can see shapes clearly

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
            target.innerHTML = Prism.highlight(
                code,
                Prism.languages.typescript,
                'typescript'
            );
        }
    } catch (error) {
        console.error("Failed to render source code:", error);
    }
}

// THE CALLERS: Wiring up the UI
// Updated Caller: No fetch, no 404s!
document.getElementById('view-source-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('source-modal');
    const output = document.getElementById('code-output');

    if (modal && output) {
        modal.style.display = 'block';

        // Directly highlight the string Vite embedded for us
        output.innerHTML = Prism.highlight(
            demoSourceCode,
            Prism.languages.typescript,
            'typescript'
        );
    }
});

document.getElementById('close-source-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('source-modal');
    if (modal) modal.style.display = 'none';
});