import p5 from 'p5';
import { P5GraphicProcessor } from './p5_graphic_processor';
import { P5AssetLoader, type P5Bundler } from './p5_asset_loader';
import { AssetRegistry } from '../asset_registry';
import {ELEMENT_TYPES, type BlueprintBox} from "../types.ts";
import {createMockState} from "../mock/mock_scene_state.mock.ts";

new p5((p: p5) => {
    p.disableFriendlyErrors = true;

    let gp: P5GraphicProcessor;
    let registry: AssetRegistry<P5Bundler>;

    p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);

        const loader = new P5AssetLoader(p);
        gp = new P5GraphicProcessor(p, loader);

        // The Registry is our "Real Asset Manager"
        registry = new AssetRegistry<P5Bundler>(loader);

        // PHASE 1: REGISTRATION (Real thing, starts loading the jpg)
        registry.register('hero', {
            type: ELEMENT_TYPES.BOX,
            position: { x: 0, y: 0, z: 0 },
            size: 100,
            fillColor: {red: 200, green:0, blue: 25},
            // texture: { path: 'textures/container.jpg', width: 512, height: 512 }
        } as BlueprintBox);

        // Expose to window for manual inspection
        Object.assign(window, { gp, registry, p });
    };

    p.draw = () => {
        p.background(15);

        let state = createMockState();

        gp.setCamera(state.camera.position, state.camera.lookAt);

        // PHASE 3: RENDERING
        // We get the REAL element (with its REAL assets) from the registry
        const hero = registry.get('hero');
        if (hero) {
            // This call now uses real assets (either LOADING or READY)
            // No mocks. No as any.
            hero.render(gp, state);
        }
    };
});