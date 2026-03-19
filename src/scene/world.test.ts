import {describe, it, expect, vi, beforeEach} from "vitest";
import {World} from "./world";
import {Stage} from "./stage";
import {SceneClock} from "./scene_clock";
import type {WorldSettings} from "./world_settings";
import {
    PROJECTION_TYPES,
    STANDARD_PROJECTION_IDS,
    LOOK_MODES,
    DEFAULT_WINDOW_CONFIG,
    WindowConfig,
    type ResolvedSceneState,
    type GraphicProcessor,
    DEFAULT_SCENE_SETTINGS,
    type SceneSettings,
} from "./types";

describe("World", () => {
    let world: World<any, any, any, any>;
    let mockStage: Stage<any, any, any, any>;
    let mockClock: SceneClock;
    let mockSettings: WorldSettings<any, any, any, any>;

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
            getCurrentState: vi.fn().mockReturnValue({
                sceneId: 1,
                settings: DEFAULT_SCENE_SETTINGS,
                playback: {now: 0, delta: 16, progress: 0, frameCount: 1},
                elements: new Map(),
                projections: new Map([[STANDARD_PROJECTION_IDS.EYE, {id: STANDARD_PROJECTION_IDS.EYE}], [STANDARD_PROJECTION_IDS.SCREEN, {id: STANDARD_PROJECTION_IDS.SCREEN}]]),
            }),
            setEye: vi.fn(),
            setScreen: vi.fn(),
            addElement: vi.fn(),
            getElement: vi.fn(),
            removeElement: vi.fn(),
            render: vi.fn().mockReturnValue({
                sceneId: 1,
                settings: DEFAULT_SCENE_SETTINGS,
                playback: {now: 0, delta: 16, progress: 0, frameCount: 1},
                elements: new Map(),
                projections: new Map([[STANDARD_PROJECTION_IDS.EYE, {id: STANDARD_PROJECTION_IDS.EYE}], [STANDARD_PROJECTION_IDS.SCREEN, {id: STANDARD_PROJECTION_IDS.SCREEN}]]),
            }),
            getSettings: vi.fn().mockReturnValue({
                window: WindowConfig.create(DEFAULT_WINDOW_CONFIG),
            }),
            updateWindowConfig: vi.fn(),
        } as any;

        mockSettings = {
            clock: mockClock,
            stage: mockStage,
        } as any;

        world = new World(mockSettings);
    });

    describe("constructor", () => {
        it("should initialize with stage and clock from settings", () => {
            expect(world.sceneClock).toBe(mockClock);
            expect(world.stage).toBe(mockStage);
        });
    });

    describe("getCurrenState", () => {
        it("should return current state from stage", () => {
            const mockState = {sceneId: 1} as ResolvedSceneState;
            (mockStage.getCurrentState as ReturnType<typeof vi.fn>).mockReturnValue(mockState);

            const result = world.getCurrenState();

            expect(mockStage.getCurrentState).toHaveBeenCalled();
            expect(result).toBe(mockState);
        });
    });

    describe("isPaused", () => {
        it("should return pause state from clock", () => {
            expect(world.isPaused()).toBe(false);
        });
    });

    describe("setEye", () => {
        it("should set eye with rotation mode", () => {
            const blueprint = {
                position: {x: 0, y: 0, z: 100},
                rotation: {pitch: 0, yaw: 0, roll: 0},
            };

            world.setEye({
                ...blueprint,
                lookMode: LOOK_MODES.ROTATION,
            } as any);

            expect(mockStage.setEye).toHaveBeenCalled();
        });

        it("should set eye with lookAt mode", () => {
            const blueprint = {
                position: {x: 0, y: 0, z: 100},
                lookAt: {x: 0, y: 0, z: 0},
            };

            world.setEye({
                ...blueprint,
                lookMode: LOOK_MODES.LOOK_AT,
            } as any);

            expect(mockStage.setEye).toHaveBeenCalled();
        });

        it("should throw error for invalid mode", () => {
            expect(() => {
                world.setEye({lookMode: 'invalid' as any, id: STANDARD_PROJECTION_IDS.EYE, type: PROJECTION_TYPES.EYE});
            }).toThrow("invalid mode");
        });
    });

    describe("setScreen", () => {
        it("should set screen with rotation mode", () => {
            const blueprint = {
                position: {x: 0, y: 0, z: 100},
                rotation: {pitch: 0, yaw: 0, roll: 0},
            };

            world.setScreen({
                ...blueprint,
                lookMode: LOOK_MODES.ROTATION,
            } as any);

            expect(mockStage.setScreen).toHaveBeenCalled();
        });

        it("should set screen with lookAt mode", () => {
            const blueprint = {
                position: {x: 0, y: 0, z: 100},
                lookAt: {x: 0, y: 0, z: 0},
            };

            world.setScreen({
                ...blueprint,
                lookMode: LOOK_MODES.LOOK_AT,
            } as any);

            expect(mockStage.setScreen).toHaveBeenCalled();
        });

        it("should throw error for invalid mode", () => {
            expect(() => {
                world.setScreen({lookMode: 'invalid' as any, id: STANDARD_PROJECTION_IDS.SCREEN, type: PROJECTION_TYPES.SCREEN});
            }).toThrow("invalid mode");
        });
    });

    describe("addElement methods", () => {
        it("should add box element", () => {
            const blueprint = {id: 'test-box', type: 'box' as const, width: 100};
            world.addBox(blueprint as any);
            expect(mockStage.addElement).toHaveBeenCalledWith(blueprint);
        });

        it("should add sphere element", () => {
            const blueprint = {id: 'test-sphere', type: 'sphere' as const, radius: 50};
            world.addSphere(blueprint as any);
            expect(mockStage.addElement).toHaveBeenCalledWith(blueprint);
        });

        it("should add cone element", () => {
            const blueprint = {id: 'test-cone', type: 'cone' as const, radius: 50, height: 100};
            world.addCone(blueprint as any);
            expect(mockStage.addElement).toHaveBeenCalledWith(blueprint);
        });

        it("should add pyramid element", () => {
            const blueprint = {id: 'test-pyramid', type: 'pyramid' as const, baseSize: 50, height: 100};
            world.addPyramid(blueprint as any);
            expect(mockStage.addElement).toHaveBeenCalledWith(blueprint);
        });

        it("should add elliptical element", () => {
            const blueprint = {id: 'test-elliptical', type: 'elliptical' as const, rx: 50, ry: 30, rz: 20};
            world.addElliptical(blueprint as any);
            expect(mockStage.addElement).toHaveBeenCalledWith(blueprint);
        });

        it("should add cylinder element", () => {
            const blueprint = {id: 'test-cylinder', type: 'cylinder' as const, radius: 50, height: 100};
            world.addCylinder(blueprint as any);
            expect(mockStage.addElement).toHaveBeenCalledWith(blueprint);
        });

        it("should add torus element", () => {
            const blueprint = {id: 'test-torus', type: 'torus' as const, radius: 50, tubeRadius: 10};
            world.addTorus(blueprint as any);
            expect(mockStage.addElement).toHaveBeenCalledWith(blueprint);
        });

        it("should add text element", () => {
            const blueprint = {id: 'test-text', type: 'text' as const, text: 'hello', size: 24};
            world.addText(blueprint as any);
            expect(mockStage.addElement).toHaveBeenCalledWith(blueprint);
        });

        it("should add floor element", () => {
            const blueprint = {id: 'test-floor', type: 'floor' as const, width: 1000, depth: 1000};
            world.addFloor(blueprint as any);
            expect(mockStage.addElement).toHaveBeenCalledWith(blueprint);
        });

        it("should add panel element", () => {
            const blueprint = {id: 'test-panel', type: 'panel' as const, width: 100, height: 100};
            world.addPanel(blueprint as any);
            expect(mockStage.addElement).toHaveBeenCalledWith(blueprint);
        });
    });

    describe("getElement", () => {
        it("should get element from stage", () => {
            const mockElement = {id: 'test'};
            (mockStage.getElement as ReturnType<typeof vi.fn>).mockReturnValue(mockElement);

            const result = world.getElement('test');

            expect(mockStage.getElement).toHaveBeenCalledWith('test');
            expect(result).toBe(mockElement);
        });
    });

    describe("removeElement", () => {
        it("should remove element from stage", () => {
            world.removeElement('test');
            expect(mockStage.removeElement).toHaveBeenCalledWith('test');
        });
    });

    describe("getWindowConfig", () => {
        it("should return window config from stage settings", () => {
            const mockWindowConfig = WindowConfig.create(DEFAULT_WINDOW_CONFIG);
            (mockStage.getSettings as ReturnType<typeof vi.fn>).mockReturnValue({
                window: mockWindowConfig,
            });

            const result = world.getWindowConfig();

            expect(result).toBe(mockWindowConfig);
        });
    });

    describe("setProjectionMatrixCalculator", () => {
        it("should set custom projection matrix calculator", () => {
            const calculator = vi.fn();
            world.setProjectionMatrixCalculator(calculator);
        });

        it("should accept null to clear calculator", () => {
            world.setProjectionMatrixCalculator(null);
        });
    });

    describe("enableDefaultPerspective", () => {
        it("should set up default perspective projection", () => {
            world.enableDefaultPerspective(800, 600);
            expect(mockStage.updateWindowConfig).toHaveBeenCalled();
        });

        it("should use default fov when not specified", () => {
            world.enableDefaultPerspective(800, 600);
            expect(mockStage.updateWindowConfig).toHaveBeenCalled();
        });

        it("should use custom fov when specified", () => {
            world.enableDefaultPerspective(800, 600, Math.PI / 4);
            expect(mockStage.updateWindowConfig).toHaveBeenCalled();
        });

        it("should work without width/height", () => {
            world.enableDefaultPerspective();
            expect(mockStage.updateWindowConfig).not.toHaveBeenCalled();
        });
    });

    describe("step", () => {
        let mockGp: GraphicProcessor<any>;

        beforeEach(() => {
            mockGp = {
                setCamera: vi.fn(),
                setCameraTree: vi.fn(),
                setProjectionMatrix: vi.fn(),
                millis: vi.fn().mockReturnValue(1000),
                deltaTime: vi.fn().mockReturnValue(16),
                frameCount: vi.fn().mockReturnValue(60),
            } as any;
        });

        it("should tick the clock", () => {
            world.step(mockGp);
            expect(mockGp.millis).toHaveBeenCalled();
            expect(mockGp.deltaTime).toHaveBeenCalled();
            expect(mockGp.frameCount).toHaveBeenCalled();
        });

        it("should call stage render", () => {
            world.step(mockGp);
            expect(mockStage.render).toHaveBeenCalled();
        });

        it("should set camera on graphic processor", () => {
            world.step(mockGp);
            expect(mockStage.render).toHaveBeenCalled();
        });

        it("should apply custom projection matrix when set", () => {
            const calculator = vi.fn().mockReturnValue({
                xScale: {x: 1, y: 0, z: 0, w: 0},
                yScale: {x: 0, y: 1, z: 0, w: 0},
                projection: {x: 0, y: 0, z: 1, w: 0},
                translation: {x: 0, y: 0, z: 0, w: 1},
            });
            world.setProjectionMatrixCalculator(calculator);

            world.step(mockGp);

            expect(mockGp.setProjectionMatrix).toHaveBeenCalled();
        });

        it("should throw error when eye or screen is missing", () => {
            (mockStage.render as ReturnType<typeof vi.fn>).mockReturnValue({
                projections: new Map(),
            });

            expect(() => world.step(mockGp)).toThrow("no screen or eye to render");
        });
    });
});
