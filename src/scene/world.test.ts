import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest';
import {World} from './world.ts';
import {Stage} from './stage.ts';
import {createMockState} from './mock/mock_scene_state.mock.ts';
import {ChaosLoader} from './mock/mock_asset_loader.mock.ts';
import type {SceneManager} from './scene_manager.ts';
import type {GraphicProcessor} from './types.ts';
import {createMockGraphicProcessor} from "./mock/mock_graphic_processor.mock.ts";

describe('World Orchestration (Dependency Injection)', () => {
    let world: World<any, any>;
    let stage: Stage<any, any>;
    let mockManager: SceneManager;
    let mockGP: GraphicProcessor<any>;
    let loader: ChaosLoader<any>;
    const initialState = createMockState({x: 0, y: 0, z: 0});

    beforeEach(() => {
        vi.clearAllMocks();
        loader = new ChaosLoader();

        // We use a real Stage, but we can spy on its render method
        stage = new Stage(loader, {});

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
                car: {name: 'None', x: 10, y: 11, z: 12},
                nudges: [
                    {name: 'A', x: 100, y: 101, z: 102},
                    {name: 'B', x: 200, y: 201, z: 202},
                ],
                errors: [
                    {message: 'First'},
                    {message: 'Second'}
                ]
            }
        };
        (mockManager.calculateScene as Mock).mockReturnValue(debugState);

        world.step(mockGP);

        expect(mockGP.drawLabel).toHaveBeenCalledWith('CAR: None', {x: 10, y: 11, z: 12});

        expect(mockGP.drawCrosshair).toHaveBeenCalledWith({x: 100, y: 101, z: 102}, 5);
        expect(mockGP.drawCrosshair).toHaveBeenCalledWith({x: 200, y: 201, z: 202}, 5);
        expect(mockGP.text).toHaveBeenCalledWith('Nudge: A',{x: 100, y: 101, z: 102});
        expect(mockGP.text).toHaveBeenCalledWith('Nudge: B',{x: 200, y: 201, z: 202});

        // Checking the y-offset logic: 20 + (i * 20)
        expect(mockGP.drawHUDText).toHaveBeenCalledWith('Error: First', 20, 20);
        expect(mockGP.drawHUDText).toHaveBeenCalledWith('Error: Second', 20, 40);
    });

    describe('Element Management (add/get/remove)', () => {
        const createMockBlueprint = (type: string) => ({
            type,
            position: {x: 0, y: 0, z: 0},
            size: 10
        });

        it('should add and retrieve elements correctly', () => {
            const boxBlueprint = createMockBlueprint('box');
            const sphereBlueprint = createMockBlueprint('sphere');
            
            // Add elements
            world.addBox('test-box', boxBlueprint as any);
            world.addSphere('test-sphere', sphereBlueprint as any);
            
            // Retrieve elements
            const box = world.getElement('test-box');
            const sphere = world.getElement('test-sphere');
            
            expect(box).toBeDefined();
            expect(box?.id).toBe('test-box');
            expect(sphere).toBeDefined();
            expect(sphere?.id).toBe('test-sphere');
        });

        it('should return undefined for non-existent elements', () => {
            const nonExistent = world.getElement('does-not-exist');
            expect(nonExistent).toBeUndefined();
        });

        it('should remove elements correctly', () => {
            const blueprint = createMockBlueprint('box');
            
            // Add element
            world.addBox('removable-box', blueprint as any);
            expect(world.getElement('removable-box')).toBeDefined();
            
            // Remove element
            world.removeElement('removable-box');
            expect(world.getElement('removable-box')).toBeUndefined();
        });

        it('should handle removing non-existent elements gracefully', () => {
            expect(() => {
                world.removeElement('does-not-exist');
            }).not.toThrow();
            
            // Should still be undefined
            expect(world.getElement('does-not-exist')).toBeUndefined();
        });

        it('should support all element types', () => {
            const blueprints = {
                'box': createMockBlueprint('box'),
                'sphere': createMockBlueprint('sphere'),
                'cone': createMockBlueprint('cone'),
                'pyramid': createMockBlueprint('pyramid'),
                'cylinder': createMockBlueprint('cylinder'),
                'torus': createMockBlueprint('torus'),
                'elliptical': createMockBlueprint('elliptical'),
                'text': {type: 'text', position: {x: 0, y: 0, z: 0}, text: 'Hello', size: 12} as any,
                'floor': createMockBlueprint('floor'),
                'panel': createMockBlueprint('panel'),
                'billboard': createMockBlueprint('billboard')
            };

            // Add all element types
            world.addBox('test-box', blueprints.box as any);
            world.addSphere('test-sphere', blueprints.sphere as any);
            world.addCone('test-cone', blueprints.cone as any);
            world.addPyramid('test-pyramid', blueprints.pyramid as any);
            world.addCylinder('test-cylinder', blueprints.cylinder as any);
            world.addTorus('test-torus', blueprints.torus as any);
            world.addElliptical('test-elliptical', blueprints.elliptical as any);
            world.addText('test-text', blueprints.text as any);
            world.addFloor('test-floor', blueprints.floor as any);
            world.addPanel('test-panel', blueprints.panel as any);
            world.addBillboard('test-billboard', blueprints.billboard as any);

            // Verify all elements exist
            Object.keys(blueprints).forEach(id => {
                const element = world.getElement(`test-${id}`);
                expect(element).toBeDefined();
                expect(element?.id).toBe(`test-${id}`);
            });
        });

        it('should handle duplicate element IDs correctly', () => {
            const blueprint1 = createMockBlueprint('box');
            const blueprint2 = createMockBlueprint('sphere');
            
            // Add first element
            world.addBox('duplicate-id', blueprint1 as any);
            const element1 = world.getElement('duplicate-id');
            expect(element1?.id).toBe('duplicate-id');
            
            // Add second element with same ID (should replace/return existing)
            world.addSphere('duplicate-id', blueprint2 as any);
            const element2 = world.getElement('duplicate-id');
            
            // Should still have the same reference (first element takes precedence)
            expect(element2).toBe(element1);
        });

        it('should maintain element state after add/remove cycles', () => {
            const blueprint = createMockBlueprint('box');
            
            // Add element
            world.addBox('cycle-test', blueprint as any);
            const element1 = world.getElement('cycle-test');
            expect(element1).toBeDefined();
            
            // Remove element
            world.removeElement('cycle-test');
            expect(world.getElement('cycle-test')).toBeUndefined();
            
            // Add element again with same ID
            world.addSphere('cycle-test', createMockBlueprint('sphere') as any);
            const element2 = world.getElement('cycle-test');
            
            expect(element2).toBeDefined();
            expect(element2?.id).toBe('cycle-test');
            // Should be a new element (different type)
            expect(element2).not.toBe(element1);
        });

        it('should work with Stage methods integration', () => {
            const stageSpy = vi.spyOn(stage, 'add');
            const getSpy = vi.spyOn(stage, 'getElement');
            const removeSpy = vi.spyOn(stage, 'remove');
            
            const blueprint = createMockBlueprint('box');
            
            // Test add
            world.addBox('integration-test', blueprint as any);
            expect(stageSpy).toHaveBeenCalledWith('integration-test', blueprint);
            
            // Test get
            world.getElement('integration-test');
            expect(getSpy).toHaveBeenCalledWith('integration-test');
            
            // Test remove
            world.removeElement('integration-test');
            expect(removeSpy).toHaveBeenCalledWith('integration-test');
        });

        it('should maintain elements during scene rendering', () => {
            const renderSpy = vi.spyOn(stage, 'render');
            
            // Add multiple elements
            world.addBox('render-box-1', createMockBlueprint('box') as any);
            world.addSphere('render-sphere', createMockBlueprint('sphere') as any);
            world.addCone('render-cone', createMockBlueprint('cone') as any);
            
            // Step through the scene (which triggers rendering)
            world.step(mockGP);
            
            // Verify that render was called with current state
            expect(renderSpy).toHaveBeenCalledWith(mockGP, expect.any(Object));
            
            // Elements should still be accessible after rendering
            expect(world.getElement('render-box-1')).toBeDefined();
            expect(world.getElement('render-sphere')).toBeDefined();
            expect(world.getElement('render-cone')).toBeDefined();
        });

        it('should handle element removal during active rendering', () => {
            const blueprint = createMockBlueprint('box');
            
            // Add element
            world.addBox('temp-element', blueprint as any);
            expect(world.getElement('temp-element')).toBeDefined();
            
            // Step through scene (render with element)
            world.step(mockGP);
            
            // Remove element
            world.removeElement('temp-element');
            expect(world.getElement('temp-element')).toBeUndefined();
            
            // Step through scene again (render without element)
            world.step(mockGP);
            
            // Element should still be undefined
            expect(world.getElement('temp-element')).toBeUndefined();
        });

        it('should work with complex element properties', () => {
            const complexBlueprint = {
                type: 'box',
                position: {kind: 'computed', value: () => ({x: 10, y: 20, z: 30})},
                size: {kind: 'static', value: 15},
                texture: {path: 'test.png', width: 64, height: 64}
            } as any;
            
            // Add element with complex properties
            world.addBox('complex-box', complexBlueprint);
            
            // Retrieve and verify element exists
            const element = world.getElement('complex-box');
            expect(element).toBeDefined();
            expect(element?.id).toBe('complex-box');
            
            // Element should be renderable (step should not throw)
            expect(() => {
                world.step(mockGP);
            }).not.toThrow();
        });

        it('should handle rapid add/remove cycles without memory leaks', () => {
            const blueprint = createMockBlueprint('box');
            
            // Rapid add/remove cycles
            for (let i = 0; i < 10; i++) {
                const id = `cycle-${i}`;
                
                // Add element
                world.addBox(id, blueprint as any);
                expect(world.getElement(id)).toBeDefined();
                
                // Remove element
                world.removeElement(id);
                expect(world.getElement(id)).toBeUndefined();
            }
            
            // Final state should be clean
            expect(world.getElement('cycle-0')).toBeUndefined();
            expect(world.getElement('cycle-9')).toBeUndefined();
            
            // Rendering should still work
            expect(() => {
                world.step(mockGP);
            }).not.toThrow();
        });
    });

    describe('getCurrentSceneState with resolved elements', () => {
        const createMockBlueprint = (type: string, id: string) => ({
            type,
            id,
            position: {x: Math.random() * 100, y: Math.random() * 100, z: Math.random() * 100},
            size: Math.random() * 20 + 5
        });

        it('should return initial scene state before any rendering', () => {
            const initialState = world.getCurrentSceneState();
            
            expect(initialState).toBeDefined();
            expect(initialState).toBe(initialState); // Should be the initial mock state
            expect(initialState.elements).toBeUndefined(); // the first state don't have previous elements
        });

        it('should update scene state with resolved elements after render', () => {
            // Add some elements to the stage
            world.addBox('test-box-1', createMockBlueprint('box', 'test-box-1') as any);
            world.addSphere('test-sphere-1', createMockBlueprint('sphere', 'test-sphere-1') as any);
            world.addCone('test-cone-1', createMockBlueprint('cone', 'test-cone-1') as any);
            
            // Step through rendering
            world.step(mockGP);
            
            // Get the updated scene state
            const currentState = world.getCurrentSceneState();
            
            // Verify that elements are populated after render
            expect(currentState.elements).toBeDefined();
            expect(currentState.elements).toBeInstanceOf(Map);
            
            // The elements should contain the added elements (mock stage should return them)
            expect(currentState.elements?.has('test-box-1')).toBe(true);
            expect(currentState.elements?.has('test-sphere-1')).toBe(true);
            expect(currentState.elements?.has('test-cone-1')).toBe(true);
        });

        it('should reflect element removal in resolved elements map', () => {
            // Add elements
            world.addBox('removable-box', createMockBlueprint('box', 'removable-box') as any);
            world.addSphere('persistent-sphere', createMockBlueprint('sphere', 'persistent-sphere') as any);
            
            // First render - both elements should be present
            world.step(mockGP);
            let currentState = world.getCurrentSceneState();
            expect(currentState.elements?.has('removable-box')).toBe(true);
            expect(currentState.elements?.has('persistent-sphere')).toBe(true);
            
            // Remove one element
            world.removeElement('removable-box');
            
            // Second render - removed element should not be present
            world.step(mockGP);
            currentState = world.getCurrentSceneState();
            expect(currentState.elements?.has('removable-box')).toBe(false);
            expect(currentState.elements?.has('persistent-sphere')).toBe(true);
        });

        it('should update resolved elements on each render cycle', () => {
            // Start with one element
            world.addBox('initial-box', createMockBlueprint('box', 'initial-box') as any);
            
            // First render
            world.step(mockGP);
            let currentState = world.getCurrentSceneState();
            expect(currentState.elements?.has('initial-box')).toBe(true);
            expect(currentState.elements?.size).toBe(1);
            
            // Add more elements
            world.addSphere('added-sphere', createMockBlueprint('sphere', 'added-sphere') as any);
            world.addCone('added-cone', createMockBlueprint('cone', 'added-cone') as any);
            
            // Second render - should have all three elements
            world.step(mockGP);
            currentState = world.getCurrentSceneState();
            expect(currentState.elements?.has('initial-box')).toBe(true);
            expect(currentState.elements?.has('added-sphere')).toBe(true);
            expect(currentState.elements?.has('added-cone')).toBe(true);
            expect(currentState.elements?.size).toBe(3);
        });

        it('should maintain resolved elements consistency with stage elements', () => {
            // Add multiple elements
            const elements = [
                {id: 'consistency-box', blueprint: createMockBlueprint('box', 'consistency-box')},
                {id: 'consistency-sphere', blueprint: createMockBlueprint('sphere', 'consistency-sphere')},
                {id: 'consistency-cone', blueprint: createMockBlueprint('cone', 'consistency-cone')}
            ];
            
            elements.forEach(({id, blueprint}) => {
                world.addBox(id, blueprint as any);
            });
            
            // Render to populate resolved elements
            world.step(mockGP);
            const currentState = world.getCurrentSceneState();
            
            // Verify all elements from stage are in resolved elements
            elements.forEach(({id}) => {
                expect(currentState.elements?.has(id)).toBe(true);
                
                // Verify the element can still be retrieved directly from stage
                const stageElement = world.getElement(id);
                expect(stageElement).toBeDefined();
                expect(stageElement?.id).toBe(id);
            });
        });

        it('should handle empty scene state after clearing all elements', () => {
            // Add elements
            world.addBox('clear-box', createMockBlueprint('box', 'clear-box') as any);
            world.addSphere('clear-sphere', createMockBlueprint('sphere', 'clear-sphere') as any);
            
            // Render with elements
            world.step(mockGP);
            let currentState = world.getCurrentSceneState();
            expect(currentState.elements?.size).toBeGreaterThan(0);
            
            // Remove all elements
            world.removeElement('clear-box');
            world.removeElement('clear-sphere');
            
            // Render without elements
            world.step(mockGP);
            currentState = world.getCurrentSceneState();
            
            // Should have empty resolved elements (or at least not contain the removed elements)
            expect(currentState.elements?.has('clear-box')).toBe(false);
            expect(currentState.elements?.has('clear-sphere')).toBe(false);
        });

        it('should populate resolved elements map with actual resolved element values', () => {
            // Create a mock element with specific properties
            const mockBlueprint = {
                type: 'box',
                id: 'value-test-box',
                position: {x: 50, y: 100, z: 150},
                size: 25,
                color: 'red'
            } as any;

            world.addBox('value-test-box', mockBlueprint);

            // Spy on what gets sent to the graphic processor
            let capturedResolvedBox: any = null;
            mockGP.drawBox = vi.fn((resolved, _assets, _state) => {
                capturedResolvedBox = resolved;
            });

            // Step through rendering
            world.step(mockGP);

            // Get the updated scene state
            const currentState = world.getCurrentSceneState();

            // Verify the element exists in the resolved map
            expect(currentState.elements?.has('value-test-box')).toBe(true);
            
            // Get the actual resolved element from the map
            const resolvedElement = currentState.elements?.get('value-test-box');
            expect(resolvedElement).toBeDefined();

            // Verify the resolved element contains the expected properties
            expect(resolvedElement).toHaveProperty('type', 'box');
            expect(resolvedElement).toHaveProperty('position');
            expect(resolvedElement).toHaveProperty('size');
            expect(resolvedElement?.position).toEqual(expect.objectContaining({
                x: expect.any(Number),
                y: expect.any(Number),
                z: expect.any(Number)
            }));

            // Verify this resolved element matches what was sent to the graphic processor
            expect(mockGP.drawBox).toHaveBeenCalled();
            expect(capturedResolvedBox).toBeDefined();
            
            // The resolved element from the map should be the same object that was sent to the graphic processor
            expect(resolvedElement).toBe(capturedResolvedBox);
            
            // Verify the properties match our blueprint
            expect(resolvedElement).toEqual(
                expect.objectContaining({
                    type: 'box',
                    size: 25,
                    position: expect.objectContaining({
                        x: expect.any(Number),
                        y: expect.any(Number),
                        z: expect.any(Number)
                    })
                })
            );

            // Test with multiple elements to verify each has proper resolved values
            let capturedResolvedSphere: any = null;
            mockGP.drawSphere = vi.fn((resolved, _assets, _state) => {
                capturedResolvedSphere = resolved;
            });

            world.addSphere('value-test-sphere', {
                type: 'sphere',
                id: 'value-test-sphere', 
                position: {x: 200, y: 300, z: 400},
                radius: 15,
                color: 'blue'
            } as any);

            world.step(mockGP);

            const updatedState = world.getCurrentSceneState();
            
            // Check both elements have proper resolved values
            const boxElement = updatedState.elements?.get('value-test-box');
            const sphereElement = updatedState.elements?.get('value-test-sphere');
            
            expect(boxElement).toBeDefined();
            expect(sphereElement).toBeDefined();
            expect(boxElement?.type).toBe('box');
            expect(sphereElement?.type).toBe('sphere');
            
            // Both elements should have position data
            expect(boxElement?.position).toBeDefined();
            expect(sphereElement?.position).toBeDefined();
            
            // The sphere should have been sent to the graphic processor and should match the map value
            expect(mockGP.drawSphere).toHaveBeenCalled();
            expect(capturedResolvedSphere).toBe(sphereElement);
            expect(sphereElement).toEqual(
                expect.objectContaining({
                    type: 'sphere',
                    radius: 15
                })
            );
        });
    });
});