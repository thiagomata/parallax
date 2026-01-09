import {describe, expect, it, vi} from 'vitest';
import {tutorial_5} from './tutorial_5';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {ASSET_STATUS, type ResolvedBoxProps} from "../../scene/types.ts";
import {resolve} from "../../scene/create_renderable.ts";

describe('Tutorial 5 Execution Test', () => {

    it('should correctly initialize the world and hydrate assets when executed', async () => {
        // 1. Create a "Fake p5" object
        // This is what tutorial_5 expects as an argument
        const mockP5 = createMockP5();
        mockP5.loadImage = vi.fn((_path, success) => success({ width: 100, height: 100 }));
        mockP5.loadFont = vi.fn((_path, success) => success({ name: 'MockFont' }));

        // 2. Execute the tutorial and get the world back
        const world = tutorial_5(mockP5 as unknown as p5);

        // 3. TRIGGER setup manually
        // Since setup is async in your tutorial, we must await it
        await mockP5.setup();

        // 4. Verify assets are READY
        const box = world.getElement('textured-box');
        expect(box?.assets.texture?.status).toBe(ASSET_STATUS.READY);

        // --- TEST POINT: Progress 0.25 (1250ms / 5000ms) ---
        mockP5.millis.mockReturnValue(1250);
        mockP5.draw(); // This triggers world.step(gp) inside the tutorial

        // Resolve the props to check the computed rotation
        // We cast to BoxProps to respect the signature and access .rotate
        const props25 = resolve(box?.props, world.getSceneState()) as ResolvedBoxProps;

        // Math: progress(0.25) * PI * 2 = PI / 2 (approx 1.57)
        expect(props25.rotate?.y).toBeCloseTo(Math.PI * 0.5, 5);
        expect(props25.rotate?.z).toBeCloseTo(Math.PI * 0.5, 5);

        // 5. Verify p5 side effects
        expect(mockP5.texture).toHaveBeenCalled();
        expect(mockP5.rotateY).toHaveBeenCalledWith(expect.closeTo(Math.PI * 0.5, 5));
        expect(mockP5.box).toHaveBeenCalledWith(150);
    });
});