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
        // Initial rotation (base rotation + look_at adjustment)
        expect(billboardCubeState.rotate?.pitch).toBeDefined();
        expect(billboardCubeState.rotate?.roll).toBeDefined();

        const billboardPanelState = world.getCurrenState()?.elements.get('billboard-panel') as ResolvedPanel;
        expect(billboardPanelState).toBeDefined();
        if (!billboardPanelState) return;

        expect(billboardPanelState.width).toBe(50);
        expect(billboardPanelState.height).toBe(50);
        expect(billboardPanelState.position).toStrictEqual({x: -50, y: 0, z: 0});

        // Verify side effects - p5 drawing functions called
        expect(mockP5.box).toHaveBeenCalled();
    });

    it('should update billboard rotation to face camera as it orbits', async () => {
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

        // Progress 0 (T = 0) - camera at starting position
        mockP5.millis.mockReturnValue(0);
        mockP5.draw();

        const billboard0 = world.getCurrenState()?.elements.get('billboard-cube') as ResolvedBox;
        expect(billboard0).toBeDefined();
        if (!billboard0) return;

        const yawAt0 = billboard0.rotate?.yaw ?? 0;
        const pitchAt0 = billboard0.rotate?.pitch ?? 0;

        // Progress 0.25 (T = 2500ms) - camera moved 90 degrees
        mockP5.millis.mockReturnValue(2500);
        mockP5.draw();

        const billboard25 = world.getCurrenState()?.elements.get('billboard-cube') as ResolvedBox;
        expect(billboard25).toBeDefined();
        if (!billboard25) return;

        const yawAt25 = billboard25.rotate?.yaw ?? 0;
        const pitchAt25 = billboard25.rotate?.pitch ?? 0;

        // Progress 0.5 (T = 5000ms) - camera moved 180 degrees
        mockP5.millis.mockReturnValue(5000);
        mockP5.draw();

        const billboard50 = world.getCurrenState()?.elements.get('billboard-cube') as ResolvedBox;
        expect(billboard50).toBeDefined();
        if (!billboard50) return;

        const yawAt50 = billboard50.rotate?.yaw ?? 0;
        const pitchAt50 = billboard50.rotate?.pitch ?? 0;

        // Progress 0.75 (T = 7500ms) - camera moved 270 degrees
        mockP5.millis.mockReturnValue(7500);
        mockP5.draw();

        const billboard75 = world.getCurrenState()?.elements.get('billboard-cube') as ResolvedBox;
        expect(billboard75).toBeDefined();
        if (!billboard75) return;

        const yawAt75 = billboard75.rotate?.yaw ?? 0;
        const pitchAt75 = billboard75.rotate?.pitch ?? 0;

        // Progress 1.0 (T = 10000ms) - back to start
        mockP5.millis.mockReturnValue(10000);
        mockP5.draw();

        const billboard100 = world.getCurrenState()?.elements.get('billboard-cube') as ResolvedBox;
        expect(billboard100).toBeDefined();
        if (!billboard100) return;

        // The billboard rotation should change as the camera orbits
        // At minimum, verify the values are different at different time points
        
        // Check that at least some rotations changed significantly
        const yawChanged = (
            Math.abs(yawAt25 - yawAt0) > 0.1 ||
            Math.abs(yawAt50 - yawAt25) > 0.1 ||
            Math.abs(yawAt75 - yawAt50) > 0.1 ||
            Math.abs((billboard100.rotate?.yaw ?? 0) - yawAt75) > 0.1
        );
        const pitchChanged = (
            Math.abs(pitchAt25 - pitchAt0) > 0.1 ||
            Math.abs(pitchAt50 - pitchAt25) > 0.1 ||
            Math.abs(pitchAt75 - pitchAt50) > 0.1 ||
            Math.abs((billboard100.rotate?.pitch ?? 0) - pitchAt75) > 0.1
        );

        expect(yawChanged || pitchChanged).toBe(true);
    });

    createPauseTests('Tutorial 8', tutorial_8);
});