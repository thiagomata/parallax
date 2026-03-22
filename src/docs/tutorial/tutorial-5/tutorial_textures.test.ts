import {describe, expect, it} from 'vitest';
import {tutorial_textures} from './tutorial_textures.ts';
import {createMockP5} from "../../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {createPauseTests} from '../pause_test_utils.ts';
import {SceneClock} from "../../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedBox} from "../../../scene/types.ts";

describe('Tutorial 5: Textures Textures', () => {

    it('should register textured box and 3D text', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 5000,
                isLoop: true
            }
        });

        const world = tutorial_textures(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        });
        mockP5.setup();
        mockP5.draw();

        // Verify elements are registered
        const texturedBox = world.getElement('textured-box');
        expect(texturedBox).toBeDefined();

        const title = world.getElement('title');
        expect(title).toBeDefined();

        mockP5.draw();

        // Test resolved state
        const boxState = world.getCurrenState()?.elements.get('textured-box') as ResolvedBox;
        expect(boxState).toBeDefined();
        if (!boxState) return;
        
        expect(boxState.width).toBe(150);
        expect(boxState.position).toStrictEqual({x: 0, y: 0, z: -100});
        expect(boxState.strokeWidth).toBe(0);
        
        // At progress 0: yaw = 0, roll = 0
        expect(boxState.rotate?.pitch).toBeCloseTo(0, 5);
        expect(boxState.rotate?.yaw).toBeCloseTo(0, 5);
        expect(boxState.rotate?.roll).toBeCloseTo(0, 5);

        // Verify text resolved state
        const textState = world.getCurrenState()?.elements.get('title');
        expect(textState).toBeDefined();

        // Verify side effects - p5 drawing functions called
        expect(mockP5.box).toHaveBeenCalled();
    });

    it('should rotate textured box over time', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 5000,
                isLoop: true
            }
        });

        const world = tutorial_textures(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        });
        mockP5.setup();

        // Progress 0.25 (T = 1250ms)
        mockP5.millis.mockReturnValue(1250);
        mockP5.draw();

        const box25 = world.getCurrenState()?.elements.get('textured-box') as ResolvedBox;
        expect(box25).toBeDefined();
        if (!box25) return;
        
        // yaw = 2 * PI * 0.25 = 0.5PI
        expect(box25.rotate?.yaw).toBeCloseTo(Math.PI * 0.5, 5);
        // roll = 2 * PI * 0.25 = 0.5PI
        expect(box25.rotate?.roll).toBeCloseTo(Math.PI * 0.5, 5);

        // Progress 0.5 (T = 2500ms)
        mockP5.millis.mockReturnValue(2500);
        mockP5.draw();

        const box50 = world.getCurrenState()?.elements.get('textured-box') as ResolvedBox;
        expect(box50).toBeDefined();
        if (!box50) return;
        
        // yaw = 2 * PI * 0.5 = PI
        expect(box50.rotate?.yaw).toBeCloseTo(Math.PI, 5);
    });

    createPauseTests('Tutorial 5: Textures', tutorial_textures);
});