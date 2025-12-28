import p5 from 'p5';
import { World } from '../world';
import { P5GraphicProcessor } from './p5_graphic_processor';
import { P5AssetLoader } from './p5_asset_loader';

const sketch = (p: p5) => {
    let world: World;
    let gp: P5GraphicProcessor;

    p.setup = async () => {
        p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);

        // Use a dummy manager for now that just returns a fixed camera
        const dummyManager: any = {
            calculateScene: () => ({
                camera: { x: 0, y: 0, z: 800 }, // Backed up 800 units
                lookAt: { x: 0, y: 0, z: 0 },
                debug: null
            })
        };

        world = new World(dummyManager);
        const loader = new P5AssetLoader(p);
        gp = new P5GraphicProcessor(p, loader);

        // 1. Far Background (Large Green Box)
        world.addElement('back', {
            type: 'box',
            size: 200,
            position: { x: -100, y: 0, z: -200 }, // Far away
            fillColor: { red: 0, green: 255, blue: 0, alpha: 1.0 }
        });

        // 2. Middle Ground (Semi-transparent Red Box)
        world.addElement('mid', {
            type: 'box',
            size: 150,
            position: { x: 0, y: 0, z: 0 }, // Center
            fillColor: { red: 255, green: 0, blue: 0, alpha: 0.5 }
        });

        // 3. Foreground (Blue Box)
        world.addElement('front', {
            type: 'box',
            size: 100,
            position: { x: 100, y: 0, z: 200 }, // Close to camera
            fillColor: { red: 0, green: 0, blue: 255, alpha: 1.0 }
        });

        // No await needed since there are no textures/fonts
        await world.hydrate(loader);
    };

    p.draw = () => {
        p.background(220); // Light gray so we can see shapes clearly
        p.orbitControl();

        // This will now handle the sorting and rendering
        world.step(gp);
    };
};

new p5(sketch);