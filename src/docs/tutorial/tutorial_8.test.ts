import {describe, expect, it} from 'vitest';
import {tutorial_8} from './tutorial_8';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {createPauseTests} from './pause_test_utils.ts';
import {SceneClock} from "../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedBox, type ResolvedPanel} from "../../scene/types.ts";

describe('Tutorial 8: Billboard', () => {

    it('should register reference and billboard elements', async () => {
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

        const world = tutorial_8(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        });
        mockP5.setup();
        mockP5.draw();

        // Verify reference cube
        const refCube = world.getElement('reference-cube');
        expect(refCube).toBeDefined();

        // Verify reference panel
        const refPanel = world.getElement('ref-panel');
        expect(refPanel).toBeDefined();

        // Verify billboard cube
        const billboardCube = world.getElement('billboard-cube');
        expect(billboardCube).toBeDefined();

        // Verify billboard panel
        const billboardPanel = world.getElement('billboard-panel');
        expect(billboardPanel).toBeDefined();

        mockP5.draw();

        // Check resolved states
        const refCubeState = world.getCurrenState()?.elements.get('reference-cube') as ResolvedBox;
        expect(refCubeState).toBeDefined();
        if (!refCubeState) return;

        expect(refCubeState.width).toBe(50);
        expect(refCubeState.position).toStrictEqual({x: 150, y: 0, z: 0});
        expect(refCubeState.fillColor?.red).toBe(100);
        expect(refCubeState.fillColor?.green).toBe(100);
        expect(refCubeState.fillColor?.blue).toBe(255);

        const billboardCubeState = world.getCurrenState()?.elements.get('billboard-cube') as ResolvedBox;
        expect(billboardCubeState).toBeDefined();
        if (!billboardCubeState) return;

        expect(billboardCubeState.width).toBe(50);
        expect(billboardCubeState.position).toStrictEqual({x: -150, y: 0, z: 0});
        expect(billboardCubeState.fillColor?.red).toBe(255);
        expect(billboardCubeState.fillColor?.green).toBe(165);
        expect(billboardCubeState.fillColor?.blue).toBe(0);
        expect(billboardCubeState.rotate?.pitch).toBeCloseTo(Math.PI * 0.25, 5);
        expect(billboardCubeState.rotate?.roll).toBeCloseTo(Math.PI * 0.25, 5);

        const billboardPanelState = world.getCurrenState()?.elements.get('billboard-panel') as ResolvedPanel;
        expect(billboardPanelState).toBeDefined();
        if (!billboardPanelState) return;

        expect(billboardPanelState.width).toBe(50);
        expect(billboardPanelState.height).toBe(50);
        expect(billboardPanelState.position).toStrictEqual({x: -50, y: 0, z: 0});

        // Verify side effects - p5 drawing functions called
        expect(mockP5.box).toHaveBeenCalled();
    });

    createPauseTests('Tutorial 8', tutorial_8);
});