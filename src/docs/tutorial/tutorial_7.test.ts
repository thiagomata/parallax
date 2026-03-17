import {describe, expect, it, vi} from 'vitest';
import {tutorial_7} from './tutorial_7';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {SceneClock} from "../../scene/scene_clock.ts";
import {DEFAULT_SCENE_SETTINGS, type ResolvedBox} from "../../scene/types.ts";
import {createFaceWorldData, createMockHeadTrackingProvider} from "../../scene/mock/face.mock.ts";

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

        const face1 = createFaceWorldData();
        const getDataMock = vi.fn();
        getDataMock.mockReturnValue(face1);

        const world = tutorial_7(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        }, createMockHeadTrackingProvider(getDataMock) as any);
        await mockP5.setup();
        mockP5.draw();

        // Verify camera square
        const cameraSquare = world.getElement('camera-square');
        expect(cameraSquare).toBeDefined();

        // Verify camera front cylinder
        const cameraFront = world.getElement('camera-front');
        expect(cameraFront).toBeDefined();

        // Verify faceBox
        const faceBox = world.getCurrenState()?.elements.get('faceBox') as ResolvedBox;
        expect(faceBox).toBeDefined();
        expect(faceBox.width).toBe(150);
        expect(faceBox.position).toStrictEqual({x: 0, y: 0, z: 0});
        expect(faceBox.rotate).toStrictEqual({yaw: 0, pitch: 0, roll: 0});

        // Verify debug boxes (these are the active elements in tutorial 7)
        expect(world.getElement('debug_nose')).toBeDefined();

        // Verify video panel
        const videoPanel = world.getElement('videoPanel');
        expect(videoPanel).toBeDefined();
        mockP5.draw();
        const drawVideo = world.getCurrenState()?.elements.get('videoPanel');
        expect(drawVideo).toBeDefined();
        expect(drawVideo?.fillColor).toBeDefined();

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

    it('should update face tracking elements based on mock head tracking data', async () => {
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

        // Create mock with vi.fn() so we can change return values
        const getDataMock = vi.fn();
        
        // Initial face position
        const faceData1 = createFaceWorldData({
            midpoint: { x: 50, y: -30, z: 100 },
            nose: { x: 60, y: -25, z: 120 },
            eyes: { 
                left: { x: 40, y: -35, z: 110 }, 
                right: { x: 70, y: -35, z: 110 } 
            },
            stick: { yaw: 0.5, pitch: 0.3, roll: 0.1 }
        });
        getDataMock.mockReturnValue(faceData1);

        const world = tutorial_7(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        }, createMockHeadTrackingProvider(getDataMock) as any);
        await mockP5.setup();
        
        // First draw - should use first face data
        mockP5.draw();
        
        const faceBoxState1 = world.getCurrenState()?.elements.get('faceBox') as ResolvedBox;
        expect(faceBoxState1).toBeDefined();
        if (!faceBoxState1) return;

        // faceBox position should match midpoint
        expect(faceBoxState1.position.x).toBe(50);
        expect(faceBoxState1.position.y).toBe(-30);
        expect(faceBoxState1.position.z).toBe(100);
        
        // faceBox rotation should match stick
        expect(faceBoxState1.rotate?.yaw).toBeCloseTo(0.5, 5);
        expect(faceBoxState1.rotate?.pitch).toBeCloseTo(0.3, 5);
        expect(faceBoxState1.rotate?.roll).toBeCloseTo(0.1, 5);

        // Verify getData was called
        expect(getDataMock).toHaveBeenCalled();

        // Now change the mock data to a new position
        const faceData2 = createFaceWorldData({
            midpoint: { x: -25, y: 40, z: 50 },
            nose: { x: -20, y: 45, z: 60 },
            eyes: { 
                left: { x: -30, y: 35, z: 55 }, 
                right: { x: -15, y: 35, z: 55 } 
            },
            stick: { yaw: -0.2, pitch: 0.4, roll: 0.05 }
        });
        getDataMock.mockReturnValue(faceData2);

        // Second draw - should use new face data
        mockP5.draw();
        
        const faceBoxState2 = world.getCurrenState()?.elements.get('faceBox') as ResolvedBox;
        expect(faceBoxState2).toBeDefined();
        if (!faceBoxState2) return;

        // faceBox should have new position
        expect(faceBoxState2.position.x).toBe(-25);
        expect(faceBoxState2.position.y).toBe(40);
        expect(faceBoxState2.position.z).toBe(50);
        
        // faceBox rotation should have new values
        expect(faceBoxState2.rotate?.yaw).toBeCloseTo(-0.2, 5);
        expect(faceBoxState2.rotate?.pitch).toBeCloseTo(0.4, 5);
        expect(faceBoxState2.rotate?.roll).toBeCloseTo(0.05, 5);

        // Verify getData was called again
        expect(getDataMock).toHaveBeenCalledTimes(2);
    });

    it('should handle no face detected gracefully', async () => {
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
        getDataMock.mockReturnValue(null);

        const world = tutorial_7(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        }, createMockHeadTrackingProvider(getDataMock) as any);
        await mockP5.setup();
        mockP5.draw();

        // With no face, elements should default to origin
        const faceBoxState = world.getCurrenState()?.elements.get('faceBox') as ResolvedBox;
        expect(faceBoxState).toBeDefined();
        if (!faceBoxState) return;

        expect(faceBoxState.position.x).toBe(0);
        expect(faceBoxState.position.y).toBe(0);
        expect(faceBoxState.position.z).toBe(0);
        
        expect(faceBoxState.rotate?.yaw).toBe(0);
        expect(faceBoxState.rotate?.pitch).toBe(0);
        expect(faceBoxState.rotate?.roll).toBe(0);
    });

    it('should provide head tracking data to element resolvers', async () => {
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

        const world = tutorial_7(mockP5 as unknown as p5, { 
            width: 500, 
            height: 400,
            clock: clock,
            paused: false
        }, createMockHeadTrackingProvider(getDataMock) as any);
        
        await mockP5.setup();
        
        // First draw - should use first face data
        mockP5.draw();
        
        // Verify screen projection exists
        const state1 = world.getCurrenState();
        const screen1 = state1?.projections.get('screen');
        expect(screen1).toBeDefined();
        
        // Verify getData was called (element resolvers use it)
        expect(getDataMock).toHaveBeenCalled();
    });
});
