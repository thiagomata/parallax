import { describe, expect, it, beforeEach, vi } from "vitest";
import { World } from "./world.ts";
import { Stage } from "./stage.ts";
import { SceneClock } from "./scene_clock.ts";
import { 
    VR_CABIN_PRESET, 
    SIMPLE_PRESET, 
    HEAD_TRACKED_PRESET,
    type WorldPreset 
} from "./presets.ts";
import { PROJECTION_TYPES, LOOK_MODES, DEFAULT_SCENE_SETTINGS, type SceneSettings } from "./types.ts";

describe("World Presets", () => {
    let world: World<any, any, any, any>;
    let mockStage: Stage<any, any, any, any>;
    let mockClock: SceneClock;

    beforeEach(() => {
        const settings: SceneSettings = {
            ...DEFAULT_SCENE_SETTINGS,
            playback: {
                isLoop: true,
                timeSpeed: 1,
                startTime: 0,
                duration: 5000,
            },
        };
        mockClock = new SceneClock(settings);
        
        mockStage = {
            addProjection: vi.fn(),
            addElement: vi.fn(),
            getElement: vi.fn(),
            removeElement: vi.fn(),
            removeProjection: vi.fn(),
            getSettings: vi.fn().mockReturnValue({ window: { width: 800, height: 600 } }),
            render: vi.fn().mockReturnValue({
                sceneId: 1,
                settings: DEFAULT_SCENE_SETTINGS,
                playback: {now: 0, delta: 16, progress: 0, frameCount: 1},
                elements: new Map(),
                projections: new Map(),
            }),
        } as any;

        const mockSettings = {
            clock: mockClock,
            stage: mockStage,
        } as any;

        world = new World(mockSettings);
    });

    describe("loadPreset", () => {
        it("loads VR_CABIN_PRESET projectors", () => {
            world.loadPreset(VR_CABIN_PRESET);

            // Should add all 4 projectors
            expect(mockStage.addProjection).toHaveBeenCalledTimes(4);
            
            // Check projector IDs added
            const calls = (mockStage.addProjection as any).mock.calls;
            const ids = calls.map((call: any[]) => call[0].id);
            expect(ids).toContain('car');
            expect(ids).toContain('screen');
            expect(ids).toContain('head');
            expect(ids).toContain('eye');
        });

        it("loads SIMPLE_PRESET projectors", () => {
            world.loadPreset(SIMPLE_PRESET);

            expect(mockStage.addProjection).toHaveBeenCalledTimes(2);
            
            const calls = (mockStage.addProjection as any).mock.calls;
            const ids = calls.map((call: any[]) => call[0].id);
            expect(ids).toContain('screen');
            expect(ids).toContain('eye');
        });

        it("loads HEAD_TRACKED_PRESET projectors", () => {
            world.loadPreset(HEAD_TRACKED_PRESET);

            expect(mockStage.addProjection).toHaveBeenCalledTimes(3);
            
            const calls = (mockStage.addProjection as any).mock.calls;
            const ids = calls.map((call: any[]) => call[0].id);
            expect(ids).toContain('screen');
            expect(ids).toContain('head');
            expect(ids).toContain('eye');
        });

        it("loads preset elements", () => {
            const presetWithElements: WorldPreset = {
                projectors: [
                    { id: 'screen', type: PROJECTION_TYPES.SCREEN, position: {x:0,y:0,z:0}, direction: {x:0,y:0,z:1}, lookMode: LOOK_MODES.ROTATION, rotation: {yaw:0,pitch:0,roll:0} },
                    { id: 'eye', type: PROJECTION_TYPES.EYE, parentId: 'screen', position: {x:0,y:0,z:0}, direction: {x:0,y:0,z:1}, lookMode: LOOK_MODES.ROTATION, rotation: {yaw:0,pitch:0,roll:0} }
                ],
                elements: [
                    { id: 'box1', type: 'box', width: 1, position: {x:0,y:0,z:0} }
                ]
            };

            world.loadPreset(presetWithElements);

            expect(mockStage.addElement).toHaveBeenCalledTimes(1);
            expect(mockStage.addElement).toHaveBeenCalledWith({ id: 'box1', type: 'box', width: 1, position: {x:0,y:0,z:0} });
        });
    });

    describe("addModifierToProjection", () => {
        it("method exists on world", () => {
            expect(typeof world.addModifierToProjection).toBe('function');
        });
    });
});

describe("VR_CABIN_PRESET structure", () => {
    it("has correct hierarchy (targetId references)", () => {
        const car = VR_CABIN_PRESET.projectors.find(p => p.id === 'car');
        const screen = VR_CABIN_PRESET.projectors.find(p => p.id === 'screen');
        const head = VR_CABIN_PRESET.projectors.find(p => p.id === 'head');
        const eye = VR_CABIN_PRESET.projectors.find(p => p.id === 'eye');

        // car has no targetId (root of tree)
        expect(car?.parentId).toBeUndefined();
        
        // screen targets car
        expect(screen?.parentId).toBe('car');
        
        // head targets screen
        expect(head?.parentId).toBe('screen');
        
        // eye targets head
        expect(eye?.parentId).toBe('head');
    });

    it("has correct types", () => {
        const car = VR_CABIN_PRESET.projectors.find(p => p.id === 'car');
        const screen = VR_CABIN_PRESET.projectors.find(p => p.id === 'screen');

        expect(car?.type).toBe(PROJECTION_TYPES.EYE);
        expect(screen?.type).toBe(PROJECTION_TYPES.EYE);
    });
});

describe("SIMPLE_PRESET structure", () => {
    it("has correct hierarchy", () => {
        const screen = SIMPLE_PRESET.projectors.find(p => p.id === 'screen');
        const eye = SIMPLE_PRESET.projectors.find(p => p.id === 'eye');

        // screen has no targetId (root)
        expect(screen?.parentId).toBeUndefined();
        
        // eye targets screen
        expect(eye?.parentId).toBe('screen');
    });
});

describe("HEAD_TRACKED_PRESET structure", () => {
    it("has correct hierarchy", () => {
        const screen = HEAD_TRACKED_PRESET.projectors.find(p => p.id === 'screen');
        const head = HEAD_TRACKED_PRESET.projectors.find(p => p.id === 'head');
        const eye = HEAD_TRACKED_PRESET.projectors.find(p => p.id === 'eye');

        // head has no targetId (root)
        expect(head?.parentId).toBeUndefined();
        
        // screen targets head
        expect(screen?.parentId).toBe('head');
        
        // eye targets head
        expect(eye?.parentId).toBe('head');
    });
});
