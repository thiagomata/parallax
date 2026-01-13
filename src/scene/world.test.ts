import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest';
import {World} from './world.ts';
import {Stage} from './stage.ts';
import {createMockState} from './mock/mock_scene_state.mock.ts';
import {ChaosLoader} from './mock/mock_asset_loader.mock.ts';
import type {SceneManager} from './scene_manager.ts';
import type {GraphicProcessor} from './types.ts';
import {createMockGraphicProcessor} from "./mock/mock_graphic_processor.mock.ts";

describe('World Orchestration (Dependency Injection)', () => {
    let world: World<any>;
    let stage: Stage<any>;
    let mockManager: SceneManager;
    let mockGP: GraphicProcessor<any>;
    let loader: ChaosLoader<any>;
    const initialState = createMockState({x: 0, y: 0, z: 0});

    beforeEach(() => {
        vi.clearAllMocks();
        loader = new ChaosLoader();

        // We use a real Stage, but we can spy on its render method
        stage = new Stage(loader);

        mockManager = {
            initialState: vi.fn().mockReturnValue(initialState),
            calculateScene: vi.fn().mockReturnValue(initialState),
        } as unknown as SceneManager;

        mockGP = createMockGraphicProcessor<any>();

        // Injecting the stage via constructor
        world = new World(mockManager, loader, stage);
    });

    it('should drive the Stage.render with calculated SceneState', () => {
        const renderSpy = vi.spyOn(stage, 'render');
        const nextState = {...initialState, playback: {...initialState.playback, now: 5000}};
        (mockManager.calculateScene as Mock).mockReturnValue(nextState);

        world.step(mockGP);

        // This proves the "Temporal -> Spatial" handoff is working correctly
        expect(renderSpy).toHaveBeenCalledWith(mockGP, nextState);
    });

    it('should correctly position debug car labels', () => {
        const debugState = {
            ...initialState,
            settings: {...initialState.settings, debug: true},
            debugStateLog: {
                car: {name: 'Viper', x: 100, y: 0, z: -50},
                nudges: [],
                errors: []
            }
        };
        (mockManager.calculateScene as Mock).mockReturnValue(debugState);

        world.step(mockGP);

        expect(mockGP.drawLabel).toHaveBeenCalledWith('CAR: Viper', {x: 100, y: 0, z: -50});
    });

    it('should verify the HUD error offset logic', () => {
        const debugState = {
            ...initialState,
            settings: {...initialState.settings, debug: true},
            debugStateLog: {
                car: {name: 'None'},
                nudges: [],
                errors: [
                    {message: 'First'},
                    {message: 'Second'}
                ]
            }
        };
        (mockManager.calculateScene as Mock).mockReturnValue(debugState);

        world.step(mockGP);

        // Checking the y-offset logic: 20 + (i * 20)
        expect(mockGP.drawHUDText).toHaveBeenCalledWith('Error: First', 20, 20);
        expect(mockGP.drawHUDText).toHaveBeenCalledWith('Error: Second', 20, 40);
    });
});