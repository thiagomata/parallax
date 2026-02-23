import {describe, expect, it} from 'vitest';
import type {SketchConfig} from './tutorial_main_page.demo.ts';
import {DEFAULT_SKETCH_CONFIG} from './tutorial_main_page.demo.ts';
import {createMockP5} from '../../scene/mock/mock_p5.mock.ts';
import p5 from 'p5';

/**
 * Type for tutorial functions that follow the standard pattern
 */
export type TutorialFunction = (p: p5, config?: SketchConfig) => any;

/**
 * Creates standardized pause functionality tests for any tutorial function
 */
export function createPauseTests(
    tutorialName: string,
    tutorialFunction: TutorialFunction
) {
    describe(`${tutorialName}: Pause Functionality`, () => {

        it('should pause the animation when config.paused is true', () => {
            const mockP5 = createMockP5();

            // Mock timing to control progress calculation
            mockP5.millis.mockReturnValue(0);
            mockP5.deltaTime.mockReturnValue(16); // 60fps

            // Execute tutorial with paused config
            const world = tutorialFunction(mockP5 as unknown as p5, {
                ...DEFAULT_SKETCH_CONFIG,
                paused: true
            });

            mockP5.setup(); // Triggers registration

            // Execute draw call (should be paused)
            mockP5.draw();

            // Advance time and execute another draw call
            mockP5.millis.mockReturnValue(1000);
            mockP5.draw();

            // Verify that playback progress is still 0 (remains paused)
            const pausedState = world.getCurrentSceneState();
            expect(pausedState.playback.progress).toBe(0);
            expect(pausedState.settings.startPaused).toBe(true);
        });

        it('should resume animation when config.paused is false', () => {
            const mockP5 = createMockP5();

            // Mock timing to control progress calculation
            mockP5.millis.mockReturnValue(0);
            mockP5.deltaTime.mockReturnValue(16); // 60fps

            let config = {
                ...DEFAULT_SKETCH_CONFIG,
                paused: true
            };

            // Execute tutorial with resumed config
            const world = tutorialFunction(mockP5 as unknown as p5, config);

            mockP5.setup(); // Triggers registration

            // Execute first draw call
            mockP5.draw();

            expect(world.isPaused()).toBe(true);
            const pausedState = world.getCurrentSceneState();
            expect(pausedState.playback.progress).toBe(0);


            // change from paused to resume
            config.paused = false;

            // update the manager to resume
            mockP5.draw();
            mockP5.millis.mockReturnValue(1000);
            // calculate the new state
            mockP5.draw();

            // Verify that playback progress has changed (animation is running)
            const resumedState = world.getCurrentSceneState();
            expect(resumedState.playback.progress).toBeGreaterThan(0);
            expect(resumedState.settings.startPaused).toBe(true);
            expect(world.isPaused()).toBe(false);
            world
        });

        it('should trigger activeManager.pause() and resume() when config changes', () => {
            const mockP5 = createMockP5();

            // Mock timing to control progress calculation
            mockP5.millis.mockReturnValue(0);
            mockP5.deltaTime.mockReturnValue(16);

            // Start with unpaused config
            const config = {
                ...DEFAULT_SKETCH_CONFIG,
                paused: false
            };

            // Execute tutorial with initially unpaused config
            const world = tutorialFunction(mockP5 as unknown as p5, config);
            mockP5.setup();

            // Initial state should be unpaused
            let initialState = world.getCurrentSceneState();
            expect(initialState?.settings?.startPaused ?? false).toBe(false);
            expect(world.isPaused()).toBe(false);
            expect(initialState?.playback?.progress ?? 0).toBe(0);

            // running
            mockP5.millis.mockReturnValue(2000);
            mockP5.draw();
            let runningState = world.getCurrentSceneState();
            expect(runningState?.settings?.startPaused ?? false).toBe(false);
            expect(world.isPaused()).toBe(false);
            expect(runningState?.playback?.progress ?? 0).toBeGreaterThan(0);
            const runningPauseProgress = runningState?.playback?.progress ?? 0;

            // Now change config.paused to true (simulating external state change)
            config.paused = true;

            // This draw call should trigger the pause sync
            mockP5.millis.mockReturnValue(2000);
            mockP5.draw();

            // Verify pause was called to sync the state
            expect(world.isPaused()).toBe(true);
            const pausedState = world.getCurrentSceneState();
            expect(pausedState?.settings?.startPaused ?? false).toBe(false);
            expect(pausedState?.playback?.progress ?? 0).toBe(runningPauseProgress);

            // Now change config.paused to false (simulating external state change)
            config.paused = false;

            // This draw call should trigger the pause sync
            mockP5.draw();
            mockP5.millis.mockReturnValue(3000);
            // calculate new state
            mockP5.draw();

            // Verify pause was called to sync the state
            expect(world.isPaused()).toBe(false);
            expect(world.getCurrentSceneState().settings.startPaused).toBe(false);
            expect(world.getCurrentSceneState().playback.progress).toBeGreaterThan(runningPauseProgress);

        });
    });
}