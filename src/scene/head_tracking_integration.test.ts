import { describe, it, expect, beforeEach, vi } from 'vitest';
import { World } from './world.ts';
import { HEAD_TRACKED_PRESET } from './presets.ts';
import { HeadTrackingModifier } from './modifiers/head_tracking_modifier.ts';
import type { HeadTrackingDataProvider } from './providers/head_tracking_data_provider.ts';
import type { FaceWorldData } from './providers/head_tracking_data_provider.ts';
import { SceneClock } from './scene_clock.ts';
import { P5AssetLoader } from './p5/p5_asset_loader.ts';
import { DEFAULT_SCENE_SETTINGS } from './types.ts';
import { WorldSettings } from './world_settings.ts';
import type { P5Bundler } from './p5/p5_asset_loader.ts';

const createMockFaceData = (): FaceWorldData => {
    return {
        face: {} as any,
        sceneHeadWidth: 120,
        midpoint: { x: 50, y: -30, z: 100 },
        nose: { x: 0, y: 0, z: 0 },
        eyes: { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
        brows: { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
        bounds: { 
            left: { x: 0, y: 0, z: 0 }, 
            right: { x: 0, y: 0, z: 0 }, 
            top: { x: 0, y: 0, z: 0 }, 
            bottom: { x: 0, y: 0, z: 0 } 
        },
        stick: { yaw: 0.3, pitch: 0.2, roll: 0.1 },
    } as unknown as FaceWorldData;
};

const createMockHeadTracker = (): HeadTrackingDataProvider => {
    const mockProvider = {
        tick: vi.fn(),
        getData: vi.fn().mockReturnValue(createMockFaceData()),
        getDataResult: vi.fn().mockReturnValue({ success: true, value: createMockFaceData() }),
        getVideo: vi.fn().mockReturnValue(null),
        init: vi.fn().mockResolvedValue(undefined),
        requiredElementIds: [],
    } as unknown as HeadTrackingDataProvider;
    return mockProvider;
};

describe('Head Tracking Integration', () => {
    let world: World<P5Bundler, any, any, { headTracker: HeadTrackingDataProvider }>;
    let mockTracker: HeadTrackingDataProvider;
    let mockGraphicProcessor: any;
    let cameraCallArgs: { eye: any; lookAt: any } | null;

    beforeEach(() => {
        vi.clearAllMocks();
        cameraCallArgs = null;

        mockTracker = createMockHeadTracker();

        const clock = new SceneClock({
            ...DEFAULT_SCENE_SETTINGS,
            startPaused: false,
            debug: false,
            playback: {
                ...DEFAULT_SCENE_SETTINGS.playback,
                duration: 10000,
                isLoop: true
            },
        });

        const loader = {} as P5AssetLoader;
        
        world = new World<P5Bundler, any, any, { headTracker: HeadTrackingDataProvider }>(
            WorldSettings.fromLibs({ clock, loader, dataProviderLib: { headTracker: mockTracker } })
        );

        world.enableDefaultPerspective(640, 480, Math.PI / 2);

        world.loadPreset(HEAD_TRACKED_PRESET);

        world.addModifierToProjection('head', new HeadTrackingModifier(), 'car');
        
        world.complete();
        
        mockGraphicProcessor = {
            millis: vi.fn().mockReturnValue(16),
            deltaTime: vi.fn().mockReturnValue(16),
            frameCount: vi.fn().mockReturnValue(1),
            setProjectionMatrix: vi.fn(),
            setCamera: vi.fn(),
            setCameraTree: vi.fn().mockImplementation((root: any) => {
                if (!root) return;
                const findNode = (node: any, id: string): any => {
                    if (node.props.id === id) return node;
                    for (const child of node.children || []) {
                        const found = findNode(child, id);
                        if (found) return found;
                    }
                    return null;
                };
                const eyeNode = findNode(root, 'eye');
                const screenNode = findNode(root, 'screen');
                if (eyeNode && screenNode) {
                    cameraCallArgs = {
                        eye: eyeNode.props.globalPosition,
                        lookAt: screenNode.props.globalPosition,
                    };
                }
            }),
            drawTree: vi.fn(),
            dist: vi.fn().mockReturnValue(100),
        };
    });

    it('should propagate head position through hierarchy to eye', async () => {
        mockGraphicProcessor.setCameraTree = vi.fn().mockImplementation((root: any) => {
            if (!root) return;
            const findNode = (node: any, id: string): any => {
                if (node.props.id === id) return node;
                for (const child of node.children || []) {
                    const found = findNode(child, id);
                    if (found) return found;
                }
                return null;
            };
            const eyeNode = findNode(root, 'eye');
            const screenNode = findNode(root, 'screen');
            
            // console.log('screen global:', screenNode?.props?.globalPosition);
            // console.log('eye global:', eyeNode?.props?.globalPosition);
            
            if (eyeNode && screenNode) {
                cameraCallArgs = {
                    eye: eyeNode.props.globalPosition,
                    lookAt: screenNode.props.globalPosition,
                };
            }
        });
        
        // First step - calibration (first face detected returns zero)
        await world.step(mockGraphicProcessor);
        // console.log('After first step (calibration):', cameraCallArgs?.eye);

        expect(cameraCallArgs).not.toBeNull();
        
        const { eye: firstEye } = cameraCallArgs!;
        
        // With calibration, first call returns zero (reference point)
        // Head is at (0, 0, 0)
        // Eye is at (0, 0, 100) relative to head (from preset)
        expect(firstEye.x).toBeCloseTo(0, 0);
        expect(firstEye.y).toBeCloseTo(0, 0);
        // Eye z = 100 from preset (eye is 100 units behind head)
        expect(firstEye.z).toBeCloseTo(100, 0);
    });
});
