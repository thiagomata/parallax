import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Stage} from './stage.ts';
import {ChaosLoader} from './mock/mock_asset_loader.mock.ts';
import {createMockState} from './mock/mock_scene_state.mock.ts';
import {ELEMENT_TYPES, type GraphicProcessor, type Vector3} from './types.ts';

describe('Stage (Spatial Orchestration)', () => {
    let stage: Stage<any>;
    let loader: ChaosLoader<any>;
    let mockGP: GraphicProcessor<any>;
    const mockState = createMockState({x: 0, y: 0, z: 0});

    beforeEach(() => {
        vi.clearAllMocks();
        loader = new ChaosLoader();
        stage = new Stage(loader);

        mockGP = {
            // Real distance formula for sorting accuracy
            dist: (v1: Vector3, v2: Vector3) => Math.sqrt(
                Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2) + Math.pow(v2.z - v1.z, 2)
            ),
            setCamera: vi.fn(),
            translate: vi.fn(),
            push: vi.fn(),
            pop: vi.fn(),
            drawBox: vi.fn(),
            // Mock other required GP methods
            millis: vi.fn(),
            deltaTime: vi.fn(),
            frameCount: vi.fn(),
        } as unknown as GraphicProcessor<any>;
    });

    it('should register and render an element', () => {
        stage.add('box-1', {
            type: ELEMENT_TYPES.BOX,
            position: {x: 10, y: 0, z: 0},
            size: 5
        });

        stage.render(mockGP, mockState);

        // Verify the GP was reached
        expect(mockGP.drawBox).toHaveBeenCalled();
        expect(mockGP.translate).toHaveBeenCalledWith({x: 10, y: 0, z: 0});
    });

    it('should sort elements by distance (Painter Algorithm)', () => {
        // Elements are added in "Near then Far" order
        // But should be rendered "Far then Near"
        const nearPos = {x: 0, y: 0, z: 50};
        const farPos = {x: 0, y: 0, z: 500};

        stage.add('near', {
            type: ELEMENT_TYPES.BOX,
            position: nearPos,
            size: 1
        });

        stage.add('far', {
            type: ELEMENT_TYPES.BOX,
            position: farPos,
            size: 1
        });

        stage.render(mockGP, mockState);

        const translateCalls = vi.mocked(mockGP.translate).mock.calls;

        // Check invocation order:
        // Index 0 should be the FAR element (dist 500)
        // Index 1 should be the NEAR element (dist 50)
        expect(translateCalls[0][0]).toEqual(farPos);
        expect(translateCalls[1][0]).toEqual(nearPos);
    });

    it('should resolve dynamic positions during the sorting phase', () => {
        // Proof that resolveProperty is working inside the sort
        stage.add('dynamic-box', {
            type: ELEMENT_TYPES.BOX,
            position: (s: any) => ({x: s.playback.now, y: 0, z: 0}),
            size: 1
        });

        const customState = {
            ...mockState,
            playback: {...mockState.playback, now: 999}
        };

        stage.render(mockGP, customState);

        expect(mockGP.translate).toHaveBeenCalledWith({x: 999, y: 0, z: 0});
    });

    it('should maintain single instances even with multiple add calls (Idempotency)', () => {
        const spy = vi.spyOn(loader, 'hydrateTexture');
        const bluePrint = {
            type: ELEMENT_TYPES.BOX,
            position: {x: 0, y: 0, z: 0},
            size: 1,
            texture: {path: 'shared.png', width: 1, height: 1}
        };

        stage.add('unique-id', bluePrint);
        stage.add('unique-id', bluePrint);

        // Registry should return the existing element rather than creating/hydrating again
        expect(spy).toHaveBeenCalledTimes(1);
    });
});