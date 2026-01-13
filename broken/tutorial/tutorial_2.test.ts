import { describe, it, expect } from 'vitest';
import { tutorial_2 } from './tutorial_2';
import { SceneManager } from "../../scene/scene_manager.ts";
import {DEFAULT_SETTINGS, type ResolvedBoxProps} from "../../scene/types.ts";
import { resolve } from "../../scene/create_renderable.ts";
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";

describe('Tutorial 2: Progression Integration', () => {

    it('should resolve pulsing size and color using the actual tutorial logic', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        // 1. Inject a manager with 4000ms duration to keep your existing math
        const manager = new SceneManager({
            ...DEFAULT_SETTINGS,
            playback: { ...DEFAULT_SETTINGS.playback, duration: 4000 }
        });

        // 2. Execute the actual tutorial function
        const world = tutorial_2(mockP5 as unknown as p5, manager);
        await mockP5.setup();

        // --- TEST POINT A: Progress 0.0 ---
        mockP5.draw(); // Calls world.step internally

        const element0 = world.getElement('pulsing-box');
        const props0 = resolve(element0?.blueprint, world.getSceneState()) as unknown as ResolvedBoxProps;

        expect(props0.size).toBe(100);
        expect(props0.fillColor?.blue).toBe(255);

        // --- TEST POINT B: Progress 0.25 (1000ms / 4000ms) ---
        mockP5.millis.mockReturnValue(1000);
        mockP5.draw();

        const props25 = resolve(element0?.blueprint, world.getSceneState()) as unknown as ResolvedBoxProps;

        expect(props25.size).toBe(150);
        expect(props25.rotate?.y).toBeCloseTo(Math.PI * 0.5, 5);
        expect(props25.fillColor?.blue).toBeCloseTo(0, 5);

        // 3. Verify side-effect: Did p5 actually draw it?
        expect(mockP5.box).toHaveBeenCalled();
    });
});