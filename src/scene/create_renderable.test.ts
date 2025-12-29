import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ELEMENT_TYPES, type GraphicProcessor, type SceneState, type Vector3 } from './types';
import {createRenderable} from "./create_renderable.ts";

/**
 * A type-safe mock factory for the GraphicProcessor.
 * Using 'unknown' for generics to ensure we aren't "fighting the type system"
 * with 'any' in our test setup.
 */
const createMockGP = () => {
    return {
        push: vi.fn(),
        pop: vi.fn(),
        translate: vi.fn(),
        dist: vi.fn(),
        drawPanel: vi.fn(),
        drawBox: vi.fn(),
        drawText: vi.fn(),
        setCamera: vi.fn(),
        rotateX: vi.fn(),
        rotateY: vi.fn(),
        rotateZ: vi.fn(),
        fill: vi.fn(),
        noFill: vi.fn(),
        stroke: vi.fn(),
        noStroke: vi.fn(),
    } as unknown as GraphicProcessor<unknown, unknown>;
};

describe('createRenderable', () => {
    let gp: GraphicProcessor<unknown, unknown>;
    const mockOrigin: Vector3 = { x: 0, y: 0, z: 0 };
    const mockState: SceneState = {
        camera: mockOrigin,
        lookAt: mockOrigin,
        alpha: 1,
    };

    beforeEach(() => {
        gp = createMockGP();
        // Default distance to 0 so tests pass unless we explicitly test the cull logic
        vi.mocked(gp.dist).mockReturnValue(0);
    });

    it('should initialize with an empty assets object', () => {
        const renderable = createRenderable('test-1', {
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            size: 10
        });
        expect(renderable.assets).toEqual({});
        expect(renderable.id).toBe('test-1');
    });

    it('should cull rendering (early return) if distance > 5000', () => {
        const props = { type: ELEMENT_TYPES.BOX, position: mockOrigin, size: 10 };
        const renderable = createRenderable('id-1', props);

        // Mock distance to trigger the 'if' branch
        vi.mocked(gp.dist).mockReturnValue(5001);

        renderable.render(gp, mockState);

        expect(gp.push).toHaveBeenCalled();
        expect(gp.translate).toHaveBeenCalledWith(props.position);
        // Ensure it didn't hit the switch/case
        expect(gp.drawBox).not.toHaveBeenCalled();
        // Ensure it still cleaned up the stack
        expect(gp.pop).toHaveBeenCalled();
    });

    it('should render a BOX correctly', () => {
        const props = { type: ELEMENT_TYPES.BOX, position: mockOrigin, size: 10 };
        const renderable = createRenderable('box-1', props);

        renderable.render(gp, mockState);

        expect(gp.drawBox).toHaveBeenCalledWith(props, renderable.assets, mockState);
        expect(gp.pop).toHaveBeenCalled();
    });

    it('should render a PANEL correctly', () => {
        const props = {
            type: ELEMENT_TYPES.PANEL,
            position: mockOrigin,
            width: 100,
            height: 100
        };
        const renderable = createRenderable('panel-1', props);

        renderable.render(gp, mockState);

        expect(gp.drawPanel).toHaveBeenCalledWith(props, renderable.assets, mockState);
    });

    it('should render TEXT correctly', () => {
        const props = {
            type: ELEMENT_TYPES.TEXT,
            position: mockOrigin,
            text: 'Hello World',
            size: 16
        };
        const renderable = createRenderable('text-1', props);

        renderable.render(gp, mockState);

        expect(gp.drawText).toHaveBeenCalledWith(props, renderable.assets, mockState);
    });
});