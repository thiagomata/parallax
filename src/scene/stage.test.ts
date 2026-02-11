import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Stage} from './stage.ts';
import {ChaosLoader} from './mock/mock_asset_loader.mock.ts';
import {createMockState} from './mock/mock_scene_state.mock.ts';
import {createMockGraphicProcessor} from './mock/mock_graphic_processor.mock.ts';
import {ELEMENT_TYPES, type GraphicProcessor} from './types.ts';

describe('Stage (Spatial Orchestration)', () => {
    let stage: Stage<any, any>;
    let loader: ChaosLoader<any>;
    let mockGP: GraphicProcessor<any>;
    const mockState = createMockState({x: 0, y: 0, z: 0});

    beforeEach(() => {
        vi.clearAllMocks();
        loader = new ChaosLoader();
        stage = new Stage(loader);
        mockGP = createMockGraphicProcessor();
    });

    it('should register and render an element', () => {
        stage.add('box-1', {
            id: 'box-1',
            type: ELEMENT_TYPES.BOX,
            position: {x: 10, y: 0, z: 0},
            width: 5
        });

        stage.render(mockGP, mockState);

        // Verify the GP was reached
        expect(mockGP.drawBox).toHaveBeenCalled();
    });

    it('should sort elements by distance (Painter Algorithm)', () => {
        // Elements are added in "Near then Far" order
        // But should be rendered "Far then Near"
        const nearPos = {x: 0, y: 0, z: 50};
        const farPos = {x: 0, y: 0, z: 500};


        const nearBox = {
            id: "near",
            type: ELEMENT_TYPES.BOX,
            position: nearPos,
            width: 1
        }
        stage.add('near', nearBox);

        const farBox = {
            id: "far",
            type: ELEMENT_TYPES.BOX,
            position: farPos,
            width: 1
        }
        stage.add('far', farBox);

        stage.render(mockGP, mockState);

        const drawCalls = vi.mocked(mockGP.drawBox).mock.calls;

        // Check invocation order:
        // Index 0 should be the FAR element (dist 500)
        // Index 1 should be the NEAR element (dist 50)
        expect(drawCalls[0][0]).toEqual(farBox);
        expect(drawCalls[1][0]).toEqual(nearBox);
    });

    it('should resolve dynamic positions during the sorting phase', () => {
        // Proof that resolveProperty is working inside the sort
        stage.add('some-box', {
            id: "some-box",
            type: ELEMENT_TYPES.BOX,
            position: (s: any) => ({x: s.playback.now, y: 0, z: 0}),
            width: 1
        });

        const customState = {
            ...mockState,
            playback: {...mockState.playback, now: 999}
        };

        const expectedBox = {
            id: "some-box",
            type: ELEMENT_TYPES.BOX,
            position: {x: 999, y: 0, z: 0},
            width: 1,
            texture: undefined,
            font: undefined,
            effects: undefined,
        };

        const assets = {
            font: {
                status: "READY",
                value: null,
            },
            texture: {
                status: "READY",
                value: null,
            }
        };

        const afterState = {
            ...customState,
            elements: new Map([
                ["some-box", {
                    id: "some-box",
                    position: {x: 999, y: 0, z: 0},
                    width: 1,
                    type: "box"
                }]
            ]),
        }


        stage.render(mockGP, customState);

        expect(mockGP.drawBox).toHaveBeenCalledWith(expectedBox, assets, afterState);
    });

    it('should maintain single instances even with multiple add calls (Idempotency)', () => {
        const spy = vi.spyOn(loader, 'hydrateTexture');
        const bluePrint = {
            id: "some-box",
            type: ELEMENT_TYPES.BOX,
            position: {x: 0, y: 0, z: 0},
            width: 1,
            texture: {path: 'shared.png', width: 1, height: 1},
        };

        stage.add('unique-id', bluePrint);
        stage.add('unique-id', bluePrint);

        // Registry should return the existing element rather than creating/hydrating again
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should remove elements from the stage', () => {
        const elementId = 'removable-box';
        
        // Add an element first
        stage.add(elementId, {
            id: "some-box",
            type: ELEMENT_TYPES.BOX,
            position: {x: 10, y: 0, z: 0},
            width: 5
        });

        // Verify element is present
        expect(stage.getElement(elementId)).toBeDefined();

        // Remove the element
        stage.remove(elementId);

        // Verify element is no longer present
        expect(stage.getElement(elementId)).toBeUndefined();
    });

    it('should not render removed elements', () => {
        const elementId = 'not-rendered-box';
        
        // Add an element
        stage.add(elementId, {
            id: "some-box",
            type: ELEMENT_TYPES.BOX,
            position: {x: 10, y: 0, z: 0},
            width: 5
        });

        // Remove the element
        stage.remove(elementId);

        // Render the stage
        stage.render(mockGP, mockState);

        // Verify drawBox was not called for the removed element
        expect(mockGP.drawBox).not.toHaveBeenCalled();
    });
});