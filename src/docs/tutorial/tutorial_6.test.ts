import {describe, expect, it} from 'vitest';
import {tutorial_6} from './tutorial_6';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {createPauseTests} from './pause_test_utils.ts';
import {SceneClock} from "../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedBox, type ResolvedSphere} from "../../scene/types.ts";

describe('Tutorial 6: Hybrid Props', () => {

    it('should register floor and hero sphere with hybrid props', async () => {
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

        const world = tutorial_6(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        });
        mockP5.setup();
        mockP5.draw();

        // Verify floor is registered
        const floor = world.getElement('floor');
        expect(floor).toBeDefined();

        mockP5.draw();

        // Verify floor resolved state
        const floorState = world.getCurrenState()?.elements.get('floor') as ResolvedBox;
        expect(floorState).toBeDefined();
        if (!floorState) return;

        expect(floorState.width).toBe(500);
        expect(floorState.depth).toBe(500);
        expect(floorState.position).toStrictEqual({x: 0, y: 100, z: 0});
        expect(floorState.fillColor?.red).toBe(100);
        expect(floorState.fillColor?.green).toBe(100);
        expect(floorState.fillColor?.blue).toBe(100);

        // Verify hero sphere is registered
        const heroSphere = world.getElement('hero-sphere');
        expect(heroSphere).toBeDefined();

        // Verify hero sphere resolved state
        const heroState = world.getCurrenState()?.elements.get('hero-sphere') as ResolvedSphere;
        expect(heroState).toBeDefined();
        if (!heroState) return;

        expect(heroState.radius).toBe(40);
        expect(heroState.fillColor?.red).toBe(255);
        expect(heroState.fillColor?.green).toBe(150);
    });

    it('should animate hero sphere position and color over time', async () => {
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

        const world = tutorial_6(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        });
        mockP5.setup();

        // Progress 0 (T = 0)
        mockP5.millis.mockReturnValue(0);
        mockP5.draw();

        const sphere0 = world.getCurrenState()?.elements.get('hero-sphere') as ResolvedSphere;
        expect(sphere0).toBeDefined();
        if (!sphere0) return;
        
        // x = sin(0) * 100 = 0
        expect(sphere0.position?.x).toBeCloseTo(0, 1);
        expect(sphere0.position?.z).toBe(-200);
        // blue = 127 + 127 * sin(0) = 127
        expect(sphere0.fillColor?.blue).toBeCloseTo(127, 0);

        // Progress 0.25 (T = 1250ms)
        mockP5.millis.mockReturnValue(1250);
        mockP5.draw();

        const sphere25 = world.getCurrenState()?.elements.get('hero-sphere') as ResolvedSphere;
        expect(sphere25).toBeDefined();
        if (!sphere25) return;
        
        // x = sin(0.25 * 2PI) * 100 = sin(0.5PI) * 100 = 1 * 100 = 100
        expect(sphere25.position?.x).toBeCloseTo(100, 1);
        // blue = 127 + 127 * sin(0.5PI) = 127 + 127 = 254
        expect(sphere25.fillColor?.blue).toBeCloseTo(254, 0);

        // Progress 0.5 (T = 2500ms)
        mockP5.millis.mockReturnValue(2500);
        mockP5.draw();

        const sphere50 = world.getCurrenState()?.elements.get('hero-sphere') as ResolvedSphere;
        expect(sphere50).toBeDefined();
        if (!sphere50) return;
        
        // x = sin(PI) * 100 = 0
        expect(sphere50.position?.x).toBeCloseTo(0, 1);
        // blue = 127 + 127 * sin(PI) = 127 + 127 * 0 = 127
        expect(sphere50.fillColor?.blue).toBeCloseTo(127, 0);

        // Verify side effects - p5 drawing functions called
        expect(mockP5.box).toHaveBeenCalled();
    });

    createPauseTests('Tutorial 6', tutorial_6);
});