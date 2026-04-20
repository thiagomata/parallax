import {describe, it, expect, vi, beforeEach} from "vitest";
import {WorldSettings} from "./world_settings";
import {Stage} from "./stage";
import {SceneClock} from "./scene_clock";
import {
    DEFAULT_SCENE_SETTINGS,
    type SceneSettings,
    type AssetLoader,
    type Alpha,
} from "./types";

describe("WorldSettings", () => {
    let mockLoader: AssetLoader<any>;
    let mockStage: Stage<any, any, any, any>;

    beforeEach(() => {
        mockLoader = {
            hydrateTexture: vi.fn(),
            hydrateFont: vi.fn(),
            waitForAllAssets: vi.fn().mockResolvedValue(undefined),
        };
        mockStage = {
            getCurrentState: vi.fn(),
            setEye: vi.fn(),
            setScreen: vi.fn(),
            addElement: vi.fn(),
            getElement: vi.fn(),
            removeElement: vi.fn(),
            render: vi.fn(),
            getSettings: vi.fn(),
            updateWindowConfig: vi.fn(),
        } as any;
    });

    describe("constructor", () => {
        it("should create instance with all parameters", () => {
            const settings: SceneSettings = {...DEFAULT_SCENE_SETTINGS};
            const clock = new SceneClock(settings);

            const worldSettings = new WorldSettings(
                mockLoader,
                settings,
                clock,
                mockStage
            );

            expect(worldSettings.loader).toBe(mockLoader);
            expect(worldSettings.settings).toBe(settings);
            expect(worldSettings.clock).toBe(clock);
            expect(worldSettings.stage).toBe(mockStage);
        });
    });

    describe("fromLibs", () => {
        it("should create instance with required loader only", () => {
            const worldSettings = WorldSettings.fromLibs({
                loader: mockLoader,
            });

            expect(worldSettings.loader).toBe(mockLoader);
            expect(worldSettings.clock).toBeDefined();
            expect(worldSettings.stage).toBeDefined();
            expect(worldSettings.settings).toBeDefined();
        });

        it("should create instance with custom clock", () => {
            const customClock = new SceneClock(DEFAULT_SCENE_SETTINGS);

            const worldSettings = WorldSettings.fromLibs({
                loader: mockLoader,
                clock: customClock,
            });

            expect(worldSettings.clock).toBe(customClock);
        });

        it("should create instance with custom settings", () => {
            const customSettings: Partial<SceneSettings> = {
                debug: true,
                alpha: 0.5 as Alpha,
            };

            const worldSettings = WorldSettings.fromLibs({
                loader: mockLoader,
                settings: customSettings,
            });

            expect(worldSettings.settings.debug).toBe(true);
            expect(worldSettings.settings.alpha).toBe(0.5);
            expect(worldSettings.settings.window).toBeDefined();
        });

        it("should merge custom settings with defaults", () => {
            const customSettings: Partial<SceneSettings> = {
                debug: true,
            };

            const worldSettings = WorldSettings.fromLibs({
                loader: mockLoader,
                settings: customSettings,
            });

            expect(worldSettings.settings.debug).toBe(true);
            expect(worldSettings.settings.startPaused).toBe(DEFAULT_SCENE_SETTINGS.startPaused);
            expect(worldSettings.settings.window).toBeDefined();
        });

        it("should use provided effect libraries", () => {
            const mockElementEffectLib = {mockEffect: {}} as any;
            const mockProjectionEffectLib = {mockProjection: {}} as any;

            const worldSettings = WorldSettings.fromLibs({
                loader: mockLoader,
                elementEffectLib: mockElementEffectLib,
                projectionEffectLib: mockProjectionEffectLib,
            });

            expect(worldSettings.stage).toBeDefined();
        });

        it("should use provided data provider library", () => {
            const mockDataProviderLib = {mockProvider: {}} as any;

            const worldSettings = WorldSettings.fromLibs({
                loader: mockLoader,
                dataProviderLib: mockDataProviderLib,
            });

            expect(worldSettings.stage).toBeDefined();
        });
    });

    describe("fromStage", () => {
        it("should create instance with required loader and stage", () => {
            const worldSettings = WorldSettings.fromStage({
                loader: mockLoader,
                stage: mockStage,
            });

            expect(worldSettings.loader).toBe(mockLoader);
            expect(worldSettings.stage).toBe(mockStage);
            expect(worldSettings.clock).toBeDefined();
            expect(worldSettings.settings).toBeDefined();
        });

        it("should create instance with custom clock", () => {
            const customClock = new SceneClock(DEFAULT_SCENE_SETTINGS);

            const worldSettings = WorldSettings.fromStage({
                loader: mockLoader,
                stage: mockStage,
                clock: customClock,
            });

            expect(worldSettings.clock).toBe(customClock);
        });

        it("should create instance with custom settings", () => {
            const customSettings: Partial<SceneSettings> = {
                startPaused: true,
                alpha: 0.8 as Alpha,
            };

            const worldSettings = WorldSettings.fromStage({
                loader: mockLoader,
                stage: mockStage,
                settings: customSettings,
            });

            expect(worldSettings.settings.startPaused).toBe(true);
            expect(worldSettings.settings.alpha).toBe(0.8);
        });

        it("should merge custom settings with defaults", () => {
            const customSettings: Partial<SceneSettings> = {
                alpha: 0.9 as Alpha,
            };

            const worldSettings = WorldSettings.fromStage({
                loader: mockLoader,
                stage: mockStage,
                settings: customSettings,
            });

            expect(worldSettings.settings.alpha).toBe(0.9);
            expect(worldSettings.settings.debug).toBe(DEFAULT_SCENE_SETTINGS.debug);
            expect(worldSettings.settings.window).toBeDefined();
        });
    });

    describe("settings validation", () => {
        it("should apply custom window config via settings", () => {
            const customSettings: Partial<SceneSettings> = {
                window: {
                    ...DEFAULT_SCENE_SETTINGS.window,
                    width: 1920,
                    height: 1080,
                } as any,
            };

            const worldSettings = WorldSettings.fromLibs({
                loader: mockLoader,
                settings: customSettings,
            });

            expect(worldSettings.settings.window.width).toBe(1920);
            expect(worldSettings.settings.window.height).toBe(1080);
        });

        it("should apply custom playback settings", () => {
            const customSettings: Partial<SceneSettings> = {
                playback: {
                    isLoop: false,
                    timeSpeed: 2.0,
                    startTime: 1000,
                    duration: 10000,
                },
            };

            const worldSettings = WorldSettings.fromLibs({
                loader: mockLoader,
                settings: customSettings,
            });

            expect(worldSettings.settings.playback.isLoop).toBe(false);
            expect(worldSettings.settings.playback.timeSpeed).toBe(2.0);
            expect(worldSettings.settings.playback.startTime).toBe(1000);
            expect(worldSettings.settings.playback.duration).toBe(10000);
        });
    });

    describe("default values", () => {
        it("should use default scene settings when none provided", () => {
            const worldSettings = WorldSettings.fromLibs({
                loader: mockLoader,
            });

            expect(worldSettings.settings.debug).toBe(DEFAULT_SCENE_SETTINGS.debug);
            expect(worldSettings.settings.alpha).toBe(DEFAULT_SCENE_SETTINGS.alpha);
            expect(worldSettings.settings.startPaused).toBe(DEFAULT_SCENE_SETTINGS.startPaused);
        });

        it("should create clock with default settings when not provided", () => {
            const worldSettings = WorldSettings.fromLibs({
                loader: mockLoader,
            });

            expect(worldSettings.clock).toBeInstanceOf(SceneClock);
        });

        it("should use empty effect libs when not provided", () => {
            const worldSettings = WorldSettings.fromLibs({
                loader: mockLoader,
            });

            expect(worldSettings.stage).toBeInstanceOf(Stage);
        });
    });
});
