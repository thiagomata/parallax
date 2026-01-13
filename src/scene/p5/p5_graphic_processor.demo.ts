import p5 from 'p5';
import {P5GraphicProcessor} from './p5_graphic_processor';
import {P5AssetLoader, type P5Bundler} from './p5_asset_loader';
import {AssetRegistry} from '../asset_registry';
import {type BlueprintBox, ELEMENT_TYPES} from "../types.ts";
import {createMockState} from "../mock/mock_scene_state.mock.ts";

new p5((p: p5) => {
    p.disableFriendlyErrors = true;

    let gp: P5GraphicProcessor;
    let registry: AssetRegistry<P5Bundler>;

    p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);

        const loader = new P5AssetLoader(p);
        gp = new P5GraphicProcessor(p, loader);

        registry = new AssetRegistry<P5Bundler>(loader);

        registry.register('hero', {
            type: ELEMENT_TYPES.BOX,
            position: {x: 0, y: 0, z: 0},
            size: 100,
            fillColor: {red: 200, green: 0, blue: 25},
            strokeColor: {red: 25, green: 0, blue: 25},
            rotate: (s) => ({
                x: s.playback.now * 0.001,
                y: s.playback.now * 0.001,
                z: 0
            }),
            texture: {path: '/parallax/img/stars.jpg', width: 512, height: 512}
        } as BlueprintBox);

        Object.assign(window, {gp, registry, p, p5});
    };

    p.draw = () => {
        p.background(15);

        let state = createMockState(
            {x: 0, y: 0, z: 500},  // origin
            {x: 0, y: 0, z: 0}    // LookAt (The origin)
        );

        gp.setCamera(state.camera.position, state.camera.lookAt);

        const hero = registry.get('hero');
        if (hero) {
            hero.render(gp, state);
        }
    };
});