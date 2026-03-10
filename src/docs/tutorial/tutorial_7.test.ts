import {describe, expect, it} from 'vitest';
import {tutorial_7} from './tutorial_7';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {createPauseTests} from './pause_test_utils.ts';
import {SceneClock} from "../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedBox} from "../../scene/types.ts";

describe('Tutorial 7: The Observer', () => {

    it('should register camera elements and face tracking elements', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            }
        });

        const world = tutorial_7(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        });
        mockP5.setup();
        mockP5.draw();

        // Verify camera square
        const cameraSquare = world.getElement('camera-square');
        expect(cameraSquare).toBeDefined();

        // Verify camera front cylinder
        const cameraFront = world.getElement('camera-front');
        expect(cameraFront).toBeDefined();

        // Verify faceBox
        const faceBox = world.getElement('faceBox');
        expect(faceBox).toBeDefined();

        // Verify nose
        const nose = world.getElement('nose');
        expect(nose).toBeDefined();

        // Verify eyes
        const leftEye = world.getElement('left-eye');
        expect(leftEye).toBeDefined();

        const rightEye = world.getElement('right-eye');
        expect(rightEye).toBeDefined();

        // Verify debug boxes
        expect(world.getElement('debug_nose')).toBeDefined();
        expect(world.getElement('debug_leftEye')).toBeDefined();
        expect(world.getElement('debug_rightEye')).toBeDefined();
        expect(world.getElement('debug_boundsLeft')).toBeDefined();
        expect(world.getElement('debug_boundsRight')).toBeDefined();
        expect(world.getElement('debug_boundsTop')).toBeDefined();
        expect(world.getElement('debug_boundsBottom')).toBeDefined();

        // Verify video panel
        const videoPanel = world.getElement('videoPanel');
        expect(videoPanel).toBeDefined();

        mockP5.draw();

        // Check resolved state for camera elements
        const cameraSquareState = world.getCurrenState()?.elements.get('camera-square') as ResolvedBox;
        expect(cameraSquareState).toBeDefined();
        if (!cameraSquareState) return;

        expect(cameraSquareState.width).toBe(50);
        expect(cameraSquareState.position).toStrictEqual({x: 0, y: 0, z: 300});
        expect(cameraSquareState.fillColor?.red).toBe(255);
        expect(cameraSquareState.fillColor?.green).toBe(255);
        expect(cameraSquareState.fillColor?.blue).toBe(255);
        expect(cameraSquareState.strokeColor?.blue).toBe(255);

        // Verify side effects - p5 drawing functions called
        expect(mockP5.box).toHaveBeenCalled();
    });

    createPauseTests('Tutorial 7', tutorial_7 as any);
});