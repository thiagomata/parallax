import {describe, expect, it, vi} from 'vitest';
import {
    type AssetLoader,
    type DynamicBox,
    type DynamicProperty,
    ELEMENT_TYPES,
    type GraphicProcessor,
    type GraphicsBundle,
    type ResolvedBox,
    type SceneState,
    SPEC_KINDS,
    type Vector3
} from './types';

/**
 * 1. Define a Concrete Bundle
 * This simulates our p5.js implementation.
 */
interface p5Image {
    width: number;
    height: number;
    _p5Data: any;
}

interface p5Font {
    family: string;
}

interface P5Bundle extends GraphicsBundle {
    readonly texture: p5Image;
    readonly font: p5Font;
}

/**
 * 2. Mocking the System Moment-by-Moment
 */
describe('Parallax Engine Type Coherence Test', () => {

    const mockState: SceneState = {
        settings: {
            window: {width: 800, height: 600, aspectRatio: 1.33},
            camera: {position: {x: 0, y: 0, z: 500}, lookAt: {x: 0, y: 0, z: 0}},
            playback: {isLoop: true, timeSpeed: 1, startTime: 0},
            debug: false,
            alpha: 1
        },
        playback: {now: 1000, delta: 16, progress: 0.2, frameCount: 60},
        camera: {
            position: {x: 0, y: 0, z: 500},
            lookAt: {x: 0, y: 0, z: 0},
            yaw: 0, pitch: 0, direction: {x: 0, y: 0, z: -1}
        }
    };

    it('should resolve deep nested computed values within branches', () => {
        // 1. Setup the Complex Dynamic Plan
        const boxDynamic: DynamicBox = {
            type: ELEMENT_TYPES.BOX,
            size: {
                kind: SPEC_KINDS.COMPUTED,
                compute: (state) => state.playback.progress * 100
            },
            position: {
                kind: SPEC_KINDS.BRANCH,
                value: {
                    x: {kind: SPEC_KINDS.STATIC, value: 0},
                    y: {kind: SPEC_KINDS.STATIC, value: 0},
                    z: {
                        kind: SPEC_KINDS.COMPUTED,
                        compute: (state) => state.playback.progress * 10
                    },
                }
            }
        };

        /**
         * 2. The Logic Simulation (What the Resolver will actually do)
         * We simulate the recursion to ensure the types 'snap' together.
         */
        const resolveValue = <T>(prop: DynamicProperty<T>): T => {
            if (prop.kind === SPEC_KINDS.STATIC) return prop.value;
            if (prop.kind === SPEC_KINDS.COMPUTED) {
                // In reality, this could return another DynamicProperty (recursion)
                // But for the test, we assume a single level.
                const result = prop.compute(mockState);
                return result as T;
            }
            if (prop.kind === SPEC_KINDS.BRANCH) {
                const branchResult: any = {};
                for (const key in prop.value) {
                    branchResult[key] = resolveValue((prop.value as any)[key]);
                }
                return branchResult as T;
            }
            throw new Error("Unknown kind");
        };

        // 3. Execution Phase
        const resolvedBox: ResolvedBox = {
            type: boxDynamic.type,
            size: resolveValue(boxDynamic.size),
            position: resolveValue(boxDynamic.position) // This must resolve to Vector3 {x,y,z}
        };

        // 4. Verification
        expect(resolvedBox.position.z).toBe(2); // 0.2 progress * 10
        expect(resolvedBox.size).toBe(20);      // 0.2 progress * 100

        // Type Check: Verify that position is indeed a "Solid" Vector3 now
        const checkVector = (v: Vector3) => v.z + 10;
        expect(checkVector(resolvedBox.position)).toBe(12);
    });

    it('should maintain generic integrity through the GraphicProcessor', () => {
        // This test ensures that the GraphicProcessor only accepts the
        // textures defined in its specific bundle.

        const loader: AssetLoader<P5Bundle> = {
            hydrateTexture: vi.fn(),
            hydrateFont: vi.fn()
        };

        const processor: Partial<GraphicProcessor<P5Bundle>> = {
            loader: loader,
            drawBox: (_props, assets, _state) => {
                // TYPE CHECK: assets.texture.value.internalRef should be p5Image
                if (assets.texture?.status === 'READY' && assets.texture.value) {
                    const img: p5Image = assets.texture.value.internalRef;
                    expect(img.width).toBeDefined();
                }
            }
        };

        expect(processor.loader).toBeDefined();
    });
});