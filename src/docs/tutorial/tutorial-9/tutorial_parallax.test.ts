import {describe, expect, it, vi} from 'vitest';
import {tutorial_parallax} from './tutorial_parallax.ts';
import {createMockP5} from "../../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {SceneClock} from "../../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedBox} from "../../../scene/types.ts";
import {createFaceWorldData, createMockHeadTrackingProvider} from "../../../scene/mock/face.mock.ts";

describe('Tutorial 10: Parallax Head-Tracked VR View', () => {

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

        const world = await tutorial_parallax(mockP5 as unknown as p5, { 
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
        expect(world.getElement('front-cube')).toBeDefined();

        // Verify resolved properties
        const centerCube = world.getCurrenState()?.elements.get('center-cube') as ResolvedBox;
        expect(centerCube).toBeDefined();
        expect(centerCube.width).toBe(50);
        expect(centerCube.position).toStrictEqual({x: 0, y: 200, z: 0});
        
        // Verify side effects
        expect(mockP5.box).toHaveBeenCalled();
        expect(mockP5.cylinder).toHaveBeenCalled();
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

        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(createFaceWorldData());

        await tutorial_parallax(mockP5 as unknown as p5, { 
            width: 640, 
            height: 480,
            clock: clock,
            paused: false
        }, createMockHeadTrackingProvider(getDataMock) as any);
        
        await mockP5.setup();

        // Verify world was created successfully
        expect(mockP5.createCanvas).toHaveBeenCalled();
    });

    it('should accept mock head tracking provider', async () => {
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

        const faceData = createFaceWorldData({
            midpoint: { x: 50, y: -30, z: 100 },
            stick: { yaw: 0.5, pitch: 0.3, roll: 0.1 }
        });

        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(faceData);

        const world = await tutorial_parallax(mockP5 as unknown as p5, { 
            width: 640, 
            height: 480,
            clock: clock,
            paused: false
        }, createMockHeadTrackingProvider(getDataMock) as any);
        
        // Verify world was created with the mock provider
        expect(world).toBeDefined();
    });
});
