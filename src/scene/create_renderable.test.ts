import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
    DEFAULT_SETTINGS,
    ELEMENT_TYPES,
    type GraphicProcessor, type ResolvedBoxProps, type SceneCameraState,
    type ScenePlaybackState,
    type SceneState,
    type Vector3
} from './types';
import {createRenderable, resolve, toProps} from "./create_renderable.ts";

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
    const mockOrigin: Vector3 = {x: 0, y: 0, z: 0};
    const mockState: SceneState = {
        settings: DEFAULT_SETTINGS,
        playback: {
            now: Date.now(),
            delta: 0,
            progress: 0,
            frameCount: 60
        } as ScenePlaybackState,
        camera: {
            position: mockOrigin,
            lookAt: mockOrigin,
            yaw: 0,
            pitch: 0,
            direction: mockOrigin,
        } as SceneCameraState
    };

    beforeEach(() => {
        gp = createMockGP();
        /* Default distance to 0 so tests pass unless we explicitly test the cull logic */
        vi.mocked(gp.dist).mockReturnValue(0);
    });

    it('should initialize with an empty assets object', () => {
        const renderable = createRenderable('test-1', toProps({
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            size: 10
        }));
        expect(renderable.assets).toEqual({});
        expect(renderable.id).toBe('test-1');
    });

    it('should cull rendering (early return) if distance > 5000', () => {
        const props = toProps(
            {type: ELEMENT_TYPES.BOX, position: mockOrigin, size: 10}
        );
        const renderable = createRenderable('id-1', props);

        // Mock distance to trigger the 'if' branch
        vi.mocked(gp.dist).mockReturnValue(5001);

        renderable.render(gp, mockState);

        expect(gp.push).toHaveBeenCalled();
        expect(gp.translate).toHaveBeenCalledWith(resolve(props.position, mockState));
        // Ensure it didn't hit the switch/case
        expect(gp.drawBox).not.toHaveBeenCalled();
        // Ensure it still cleaned up the stack
        expect(gp.pop).toHaveBeenCalled();
    });

    it('should render a BOX correctly', () => {
        const props = toProps(
            {type: ELEMENT_TYPES.BOX, position: mockOrigin, size: 10}
        );
        const renderable = createRenderable('box-1', props);

        renderable.render(gp, mockState);

        expect(gp.drawBox).toHaveBeenCalledWith(resolve(props, mockState), renderable.assets, mockState);
        expect(gp.pop).toHaveBeenCalled();
    });

    it('should render a PANEL correctly', () => {
        const props = toProps({
            type: ELEMENT_TYPES.PANEL,
            position: mockOrigin,
            width: 100,
            height: 100
        });
        const renderable = createRenderable('panel-1', props);

        renderable.render(gp, mockState);

        expect(gp.drawPanel).toHaveBeenCalledWith(resolve(props, mockState), renderable.assets, mockState);
    });

    it('should render TEXT correctly', () => {
        const props = toProps({
            type: ELEMENT_TYPES.TEXT,
            position: mockOrigin,
            text: 'Hello World',
            size: 16
        });
        const renderable = createRenderable('text-1', props);

        renderable.render(gp, mockState);

        expect(gp.drawText).toHaveBeenCalledWith(resolve(props, mockState), renderable.assets, mockState);
    });

    it('should recursively resolve nested objects (granular specs)', () => {
        const props = toProps({
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            size: 10,
            fillColor: { red: 255, green: 0, blue: 0 } // This becomes nested specs
        });

        const resolved = resolve(props, mockState) as ResolvedBoxProps;

        // Verify the structure is flattened back to raw data
        expect(resolved.fillColor).toEqual({ red: 255, green: 0, blue: 0 });
        // Ensure it's not still a spec object
        expect(resolved.fillColor).not.toHaveProperty('kind');
    });

    it('should resolve computed properties using SceneState', () => {
        const customState = {
            ...mockState,
            playback: { ...mockState.playback, progress: 0.5 }
        };

        const props = toProps({
            type: ELEMENT_TYPES.BOX,
            position: mockOrigin,
            // Computed property: size is progress * 100
            size: (state: SceneState) => state.playback.progress * 100
        });

        const resolved = resolve(props, customState) as ResolvedBoxProps;

        expect(resolved.size).toBe(50); // 0.5 * 100
    });

    it('should handle both atomic and granular resolution for the same property type', () => {
        // Case A: Atomic Function for position
        const atomicProps = toProps({
            position: (_s: SceneState) => ({ x: 10, y: 10, z: 10 })
        });

        // Case B: Granular coordinates
        const granularProps = toProps({
            position: { x: (_s: SceneState) => 20, y: 0, z: 0 }
        });

        expect(resolve(atomicProps.position, mockState)).toEqual({ x: 10, y: 10, z: 10 });
        expect(resolve(granularProps.position, mockState)).toEqual({ x: 20, y: 0, z: 0 });
    });

    it('should pass through STATIC_KEYS without wrapping them in specs', () => {
        const props = toProps({
            type: ELEMENT_TYPES.BOX,
            texture: { path: 'test.png', width: 100, height: 100 }
        });

        // In the spec tree, 'type' should be a string, not { kind: 'static', value: 'box' }
        expect(typeof props.type).toBe('string');
        expect(props.type).toBe(ELEMENT_TYPES.BOX);

        // texture should also remain a raw object
        expect(props.texture).not.toHaveProperty('kind');
    });

    it('should resolve a complex mix of static, atomic, and granular props simultaneously', () => {
        const customState: SceneState = {
            ...mockState,
            playback: { ...mockState.playback, progress: 0.5 }
        };

        const props = toProps({
            type: ELEMENT_TYPES.BOX,
            /* Atomic Function (The whole object moves) */
            position: (s: SceneState) => ({ x: s.playback.progress * 100, y: 0, z: 0 }),

            /* Granular Object (Only one color channel is dynamic) */
            fillColor: {
                red: 255,
                green: (s: SceneState) => s.playback.progress * 255,
                blue: 0,
                alpha: 1
            },

            /* Static Primitive */
            size: 50
        });

        const result = resolve(props, customState);

        expect(result.position).toEqual({ x: 50, y: 0, z: 0 });
        expect(result.fillColor).toEqual({
            red: 255,
            green: 127.5,
            blue: 0,
            alpha: 1
        });
        expect(result.size).toBe(50);
        expect(result.type).toBe(ELEMENT_TYPES.BOX);
    });

    it('should pass fully resolved multi-prop data to the GraphicProcessor', () => {
        const props = toProps({
            type: ELEMENT_TYPES.BOX,
            position: { x: 100, y: 100, z: 100 },
            size: (_state: SceneState) => 200
        });

        const renderable = createRenderable('multi-test', props);
        renderable.render(gp, mockState);

        /* Verify the GP received the resolved '200' instead of the function */
        expect(gp.drawBox).toHaveBeenCalledWith(
            expect.objectContaining({
                size: 200,
                position: { x: 100, y: 100, z: 100 }
            }),
            expect.anything(),
            expect.anything()
        );
    });
});