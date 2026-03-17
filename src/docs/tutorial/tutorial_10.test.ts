import {describe, expect, it, vi} from 'vitest';
import {tutorial_10} from './tutorial_10';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {SceneClock} from "../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedBox, type ResolvedFloor} from "../../scene/types.ts";
import {createFaceWorldData, createMockHeadTrackingProvider} from "../../scene/mock/face.mock.ts";

describe('Tutorial 10: Head-Tracked VR View', () => {

    it('should register all scene elements at canonical head position', async () => {
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

        // Canonical head - centered, looking straight
        const canonicalFace = createFaceWorldData({
            midpoint: { x: 0, y: 0, z: 0 },
            stick: { yaw: 0, pitch: 0, roll: 0 }
        });

        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(canonicalFace);

        const world = tutorial_10(mockP5 as unknown as p5, { 
            width: 640, 
            height: 480,
            clock: clock,
            paused: false
        }, createMockHeadTrackingProvider(getDataMock) as any);
        
        await mockP5.setup();
        mockP5.draw();

        // Verify all elements are registered
        expect(world.getElement('center-cube')).toBeDefined();
        expect(world.getElement('left-cube')).toBeDefined();
        expect(world.getElement('right-cube')).toBeDefined();
        expect(world.getElement('far-cube')).toBeDefined();
        expect(world.getElement('floor')).toBeDefined();
        expect(world.getElement('front-cube')).toBeDefined();
        expect(world.getElement('back-sphere')).toBeDefined();
        expect(world.getElement('center-sphere')).toBeDefined();
        expect(world.getElement('out-of-screen')).toBeDefined();

        // Verify resolved properties
        const centerCube = world.getCurrenState()?.elements.get('center-cube') as ResolvedBox;
        expect(centerCube).toBeDefined();
        expect(centerCube.width).toBe(50);
        expect(centerCube.position).toStrictEqual({x: 0, y: 200, z: 0});
        
        const floor = world.getCurrenState()?.elements.get('floor') as ResolvedFloor;
        expect(floor).toBeDefined();
        expect(floor.width).toBe(800);
        expect(floor.depth).toBe(800);

        // Verify side effects
        expect(mockP5.box).toHaveBeenCalled();
        expect(mockP5.sphere).toHaveBeenCalled();
    });

    it('should use off-axis projection with head tracking hierarchy', async () => {
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

        const canonicalFace = createFaceWorldData({
            midpoint: { x: 0, y: 0, z: 0 },
            stick: { yaw: 0, pitch: 0, roll: 0 }
        });

        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(canonicalFace);

        // Tutorial 10 uses off-axis projection (4th param = true)
        const world = tutorial_10(mockP5 as unknown as p5, { 
            width: 640, 
            height: 480,
            clock: clock,
            paused: false
        }, createMockHeadTrackingProvider(getDataMock) as any);
        
        await mockP5.setup();
        mockP5.draw();

        // Verify the projection hierarchy is set up correctly
        const state = world.getCurrenState();
        expect(state).toBeDefined();
        
        const eye = state?.projections.get('eye');
        const screen = state?.projections.get('screen');
        const head = state?.projections.get('head');
        
        expect(eye).toBeDefined();
        expect(screen).toBeDefined();
        expect(head).toBeDefined();
        
        // Eye should be child of head (targetId: 'head')
        expect((eye as any).targetId).toBe('head');
        // Screen should be child of head
        expect((screen as any).targetId).toBe('head');
        
        // Verify head tracking modifier was added - getData should be called
        expect(getDataMock).toHaveBeenCalled();
    });

    it('should update head projection based on mock face data', async () => {
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

        // Initial face position
        const faceData1 = createFaceWorldData({
            midpoint: { x: 50, y: -30, z: 100 },
            stick: { yaw: 0.5, pitch: 0.3, roll: 0.1 }
        });

        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(faceData1);

        const world = tutorial_10(mockP5 as unknown as p5, { 
            width: 640, 
            height: 480,
            clock: clock,
            paused: false
        }, createMockHeadTrackingProvider(getDataMock) as any);
        
        await mockP5.setup();
        
        // First draw - should use first face data
        mockP5.draw();
        
        const state1 = world.getCurrenState();
        const head1 = state1?.projections.get('head');
        
        // Head position should match the face midpoint
        expect(head1?.position.x).toBeCloseTo(50, 0);
        expect(head1?.position.y).toBeCloseTo(-30, 0);
        
        // Head rotation should match the face stick rotation
        expect(head1?.rotation.yaw).toBeCloseTo(0.5, 1);
        expect(head1?.rotation.pitch).toBeCloseTo(-0.3, 1); // pitch is negated in modifier
        
        // Verify getData was called
        expect(getDataMock).toHaveBeenCalled();
    });
});
