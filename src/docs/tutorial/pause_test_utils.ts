import {describe, expect, it} from 'vitest';
import type {SketchConfig} from './sketch_config.ts';
import {DEFAULT_SKETCH_CONFIG} from './sketch_config.ts';
import {createMockP5} from '../../scene/mock/mock_p5.mock.ts';
import p5 from 'p5';
import type {World} from "../../scene/world.ts";

/**
 * Type for tutorial functions that follow the standard pattern (async)
 */
export type TutorialFunction = (p: p5, config?: SketchConfig) => Promise<World<any, any, any>>;

/**
 * Creates standardized pause functionality tests for any tutorial function
 */
export function createPauseTests(
    tutorialName: string,
    tutorialFunction: TutorialFunction
) {
    describe(`${tutorialName}: Pause Functionality`, () => {

        it('should pause the animation when config.paused is true', async () => {
            const mockP5 = createMockP5();

            mockP5.millis.mockReturnValue(0);
            mockP5.deltaTime.mockReturnValue(0);

            const world = await tutorialFunction(mockP5 as unknown as p5, {
                ...DEFAULT_SKETCH_CONFIG,
                paused: true
            });

            mockP5.setup();
            mockP5.draw();
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(world.sceneClock.getSettings().startPaused).toBe(true);
        });

        it('should resume animation when config.paused is false', async () => {
            const mockP5 = createMockP5();

            mockP5.millis.mockReturnValue(0);
            mockP5.deltaTime.mockReturnValue(16);

            let config = {
                ...DEFAULT_SKETCH_CONFIG,
                paused: true
            };

            const world = await tutorialFunction(mockP5 as unknown as p5, config);

            mockP5.setup();
            mockP5.draw();
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(world.isPaused()).toBe(true);
            const pausedState = world.getCurrenState();
            if (pausedState) {
                expect(pausedState.playback.progress).toBe(0);
            }

            config.paused = false;
            mockP5.draw();
            mockP5.millis.mockReturnValue(1000);
            mockP5.draw();
            await new Promise(resolve => setTimeout(resolve, 10));

            const resumedState = world.getCurrenState();
            expect(world.isPaused()).toBe(false);
            
            if (resumedState?.playback) {
                expect(resumedState.playback.progress).toBeGreaterThan(0);
            }
        });

        it('should trigger clock.pause() and resume() when config changes', async () => {
            const mockP5 = createMockP5();

            mockP5.millis.mockReturnValue(0);
            mockP5.deltaTime.mockReturnValue(16);

            const config = {
                ...DEFAULT_SKETCH_CONFIG,
                paused: false
            };

            const world = await tutorialFunction(mockP5 as unknown as p5, config);
            mockP5.setup();

            let initialState = world.getCurrenState();
            expect(initialState?.settings?.startPaused ?? false).toBe(false);
            expect(world.isPaused()).toBe(false);
            expect(initialState?.playback?.progress ?? 0).toBe(0);

            mockP5.millis.mockReturnValue(2000);
            mockP5.draw();
            await new Promise(resolve => setTimeout(resolve, 10));
            let runningState = world.getCurrenState();
            expect(runningState?.settings?.startPaused ?? false).toBe(false);
            expect(world.isPaused()).toBe(false);
            expect(runningState?.playback?.progress ?? 0).toBeGreaterThan(0);
            const runningPauseProgress = runningState?.playback?.progress ?? 0;

            config.paused = true;
            mockP5.millis.mockReturnValue(2000);
            mockP5.draw();
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(world.isPaused()).toBe(true);
            const pausedState = world.getCurrenState();
            expect(pausedState?.settings?.startPaused ?? false).toBe(false);
            expect(pausedState?.playback?.progress ?? 0).toBe(runningPauseProgress);

            config.paused = false;
            mockP5.draw();
            mockP5.millis.mockReturnValue(3000);
            mockP5.draw();
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(world.isPaused()).toBe(false);
            const finalState = world.getCurrenState();
            if (finalState?.playback) {
                expect(finalState.playback.progress).toBeGreaterThanOrEqual(runningPauseProgress);
            }
        });
    });
}