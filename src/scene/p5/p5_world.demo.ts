import p5 from 'p5';
import {World} from '../world';
import {P5GraphicProcessor} from './p5_graphic_processor';
import {P5AssetLoader} from './p5_asset_loader';
import {type BoxProps, DEFAULT_SETTINGS, ELEMENT_TYPES, type SceneState, type Vector3} from "../types.ts";
import demoSourceCode from './p5_world.demo.ts?raw';
import Prism from 'prismjs';

import 'prismjs/themes/prism-tomorrow.css';

import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import {SceneManager} from "../scene_manager.ts";
import {OrbitModifier} from "../modifiers/orbit_modifier.ts";
import {CenterFocusModifier} from "../modifiers/center_focus_modifier.ts";
import {toProps} from "../create_renderable.ts";

const p5WorldDemo = (p5: p5) => {
    let world: World;
    let graphicProcessor: P5GraphicProcessor;
    let manager: SceneManager;

    p5.setup = async () => {
        p5.createCanvas(window.innerWidth, window.innerHeight, p5.WEBGL);

        manager = new SceneManager({
            ...DEFAULT_SETTINGS,
            playback: { /* change the progress, during the loop */
                timeSpeed: 1.0,
                startTime: 0,
                duration: 10000, /* define the loop duration in seconds */
                isLoop: true
            },
        });
        manager.setDebug(true);
        manager.setStickDistance(1000);

        /* add the modifier that moves the camera in the orbit effect */
        manager.addCarModifier(new OrbitModifier(p5, 1000));
        /* add the modifier that ensure the look at stay in the center position */
        manager.addStickModifier(new CenterFocusModifier());

        /* create the world */
        world = new World(manager);

        /* prepare to load the required assets */
        const loader = new P5AssetLoader(p5);
        /* create the graphic processor using p5.js */
        graphicProcessor = new P5GraphicProcessor(p5, loader);


        /* add the back box in the world */
        world.addElement('back', toProps({
            type: ELEMENT_TYPES.BOX,
            size: 200,
            position: {x: -100, y: 0, z: -200}, // Far away
            fillColor: {red: 0, green: 255, blue: 0, alpha: 1.0}
        }));

        /* add the middle box with some animation based in the progress */
        world.addElement('mid', toProps({
            type: ELEMENT_TYPES.BOX,
            size: (state: SceneState)=> {
                return (Math.cos(  2 * Math.PI * state.playback.progress ) * 50) + 100;
            },
            rotate: {
                x: 0,
                y: 0,
                z: (state: SceneState) => {
                    return state.playback.progress * 2 * Math.PI;
                }
            },
            position: (
                (state: SceneState): Vector3 => {
                    let y = (Math.cos(  2 * Math.PI * state.playback.progress ) * 100) - 100;
                    return {
                        x: 0,
                        y: y,
                        z: 0,
                    }
                }
            ),
            fillColor: {red: 255, green: 0, blue: 0, alpha: 0.5}
        }) as BoxProps);

        /* add another box closer to the camera */
        world.addElement('front', toProps({
            type: ELEMENT_TYPES.BOX,
            size: 100,
            position: {x: 100, y: 0, z: 200},
            fillColor: {red: 0, green: 0, blue: 255, alpha: 1.0}
        }));

        /* add a text with hello world */
        world.addElement('title-label', toProps({
            type: ELEMENT_TYPES.TEXT,
            text: "HELLO WORLD",
            size: 40,
            position: {x: 50, y: 0, z: 0},
            font: {name: 'Roboto', path: '/parallax/fonts/Roboto-Regular.ttf'},
            fillColor: {red: 255, green: 0, blue: 255, alpha: 1}
        }));

        /* wait for all assets to be available */
        await world.hydrate(loader);
    };

    p5.draw = () => {
        p5.background(220);

        /* world will render using the defined graphic processor */
        world.step(graphicProcessor);
    };
};

new p5(p5WorldDemo);

/// code required to show the code in the page

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

document.getElementById('view-source-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('source-modal');
    const output = document.getElementById('code-output');

    if (modal && output) {
        modal.style.display = 'block';

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