import {describe, expect, it, vi} from 'vitest';
import {
    type AssetLoader,
    type DynamicBox,
    type DynamicCone,
    type DynamicCylinder,
    type DynamicElliptical,
    type DynamicFloor,
    type DynamicPanel,
    type DynamicProperty,
    type DynamicPyramid,
    type DynamicSphere,
    type DynamicText,
    type DynamicTorus,
    ELEMENT_TYPES,
    type GraphicProcessor,
    type GraphicsBundle,
    type ResolvedBox,
    type ResolvedCone,
    type ResolvedCylinder,
    type ResolvedElliptical,
    type ResolvedFloor,
    type ResolvedPanel,
    type ResolvedPyramid,
    type ResolvedSphere,
    type ResolvedText,
    type ResolvedTorus,
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
        sceneId: 0,
        settings: {
            window: {width: 800, height: 600, aspectRatio: 1.33},
            projection: {
                kind: "camera",
                camera: {
                    position: {x: 0, y: 0, z: 500},
                    lookAt: {x: 0, y: 0, z: 0},
                    fov: Math.PI / 3,
                    near: 0.1,
                    far: 1000,
                    rotationLimits: {
                        yaw: {min: -Math.PI / 2, max: Math.PI / 2},
                        pitch: {min: -Math.PI / 3, max: Math.PI / 3},
                        roll: {min: -Math.PI / 6, max: Math.PI / 6}
                    },
                    yaw: 0,
                    pitch: 0,
                    roll: 0,
                    direction: {x: 0, y: 0, z: -1},
                }
            },
            playback: {isLoop: true, timeSpeed: 1, startTime: 0},
            debug: false,
            startPaused: false,
            alpha: 1
        },
        projection: {
            kind: "camera",
            camera: {
                position: {x: 0, y: 0, z: 500},
                lookAt: {x: 0, y: 0, z: 0},
                fov: Math.PI / 3,
                near: 0.1,
                far: 1000,
                rotationLimits: {
                    yaw: {min: -Math.PI / 2, max: Math.PI / 2},
                    pitch: {min: -Math.PI / 3, max: Math.PI / 3},
                    roll: {min: -Math.PI / 6, max: Math.PI / 6}
                },
                yaw: 0,
                pitch: 0,
                roll: 0,
                direction: {x:0, y:0, z: -1},
            }
        },
        playback: {now: 1000, delta: 16, progress: 0.2, frameCount: 60},
    };

    /**
     * The Logic Simulation (What the Resolver will actually do)
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

    it('should resolve deep nested computed values within branches', () => {
        // Set up the Complex Dynamic Plan
        const boxDynamic: DynamicBox = {
            type: ELEMENT_TYPES.BOX,
            width: {
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


        // Execution
        const resolvedBox: ResolvedBox = {
            type: boxDynamic.type,
            width: resolveValue(boxDynamic.width),
            position: resolveValue(boxDynamic.position) // This must resolve to Vector3 {x,y,z}
        };

        //  Verification
        expect(resolvedBox.position.z).toBe(2); // 0.2 progress * 10
        expect(resolvedBox.width).toBe(20);      // 0.2 progress * 100

        // Type Check: Verify that position is indeed a "Solid" Vector3 now
        const checkVector = (v: Vector3) => v.z + 10;
        expect(checkVector(resolvedBox.position)).toBe(12);
    });

    it('should maintain generic integrity through the GraphicProcessor', () => {
        // This test ensures that the GraphicProcessor only accepts the
        // textures defined in its specific bundle.

        const loader: AssetLoader<P5Bundle> = {
            hydrateTexture: vi.fn(),
            hydrateFont: vi.fn(),
            waitForAllAssets: vi.fn(),
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


    describe('Shapes Type Tests', () => {

        it('Box resolves correctly', () => {
            const dynamic: DynamicBox = {
                type: ELEMENT_TYPES.BOX,
                position: { kind: SPEC_KINDS.STATIC, value: { x: 1, y: 2, z: 3 } },
                width: { kind: SPEC_KINDS.COMPUTED, compute: () => 10 },
            };
            const resolved: ResolvedBox = {
                type: dynamic.type,
                position: resolveValue(dynamic.position),
                width: resolveValue(dynamic.width),
            };
            expect(resolved.width).toBe(10);
            expect(resolved.position.z).toBe(3);
        });

        it('Panel resolves correctly', () => {
            const dynamic: DynamicPanel = {
                type: ELEMENT_TYPES.PANEL,
                position: { kind: SPEC_KINDS.STATIC, value: { x: 0, y: 0, z: 0 } },
                width: { kind: SPEC_KINDS.STATIC, value: 100 },
                height: { kind: SPEC_KINDS.COMPUTED, compute: () => 50 },
            };
            const resolved: ResolvedPanel = {
                type: dynamic.type,
                position: resolveValue(dynamic.position),
                width: resolveValue(dynamic.width),
                height: resolveValue(dynamic.height),
            };
            expect(resolved.width).toBe(100);
            expect(resolved.height).toBe(50);
        });

        it('Sphere resolves correctly', () => {
            const dynamic: DynamicSphere = {
                type: ELEMENT_TYPES.SPHERE,
                position: { kind: SPEC_KINDS.STATIC, value: { x: 0, y: 0, z: 0 } },
                radius: { kind: SPEC_KINDS.STATIC, value: 8 },
            };
            const resolved: ResolvedSphere = {
                type: dynamic.type,
                position: resolveValue(dynamic.position),
                radius: resolveValue(dynamic.radius),
            };
            expect(resolved.radius).toBe(8);
        });

        it('Floor resolves correctly', () => {
            const dynamic: DynamicFloor = {
                type: ELEMENT_TYPES.FLOOR,
                position: { kind: SPEC_KINDS.STATIC, value: { x: 0, y: -1, z: 0 } },
                width: { kind: SPEC_KINDS.STATIC, value: 500 },
                depth: { kind: SPEC_KINDS.STATIC, value: 300 },
            };
            const resolved: ResolvedFloor = {
                type: dynamic.type,
                position: resolveValue(dynamic.position),
                width: resolveValue(dynamic.width),
                depth: resolveValue(dynamic.depth),
            };
            expect(resolved.width).toBe(500);
            expect(resolved.depth).toBe(300);
        });

        it('Text resolves correctly', () => {
            const dynamic: DynamicText = {
                type: ELEMENT_TYPES.TEXT,
                position: { kind: SPEC_KINDS.STATIC, value: {x:0,y:0,z:0}},
                text: { kind: SPEC_KINDS.STATIC, value: 'Hello' },
                size: { kind: SPEC_KINDS.STATIC, value: 12 },
            };
            const resolved: ResolvedText = {
                type: dynamic.type,
                position: resolveValue(dynamic.position),
                text: resolveValue(dynamic.text),
                size: resolveValue(dynamic.size),
            };
            expect(resolved.text).toBe('Hello');
            expect(resolved.size).toBe(12);
        });
        it('Pyramid resolves correctly', () => {
            const dynamic: DynamicPyramid = {
                type: ELEMENT_TYPES.PYRAMID,
                position: { kind: SPEC_KINDS.STATIC, value: {x:0,y:0,z:0}},
                baseSize: { kind: SPEC_KINDS.COMPUTED, compute: () => 10 },
                height: { kind: SPEC_KINDS.STATIC, value: 20 },
            };
            const resolved: ResolvedPyramid = {
                type: dynamic.type,
                position: resolveValue(dynamic.position),
                baseSize: resolveValue(dynamic.baseSize),
                height: resolveValue(dynamic.height),
            };
            expect(resolved.baseSize).toBe(10);
            expect(resolved.height).toBe(20);
        });

        it('Cylinder resolves correctly', () => {
            const dynamic: DynamicCylinder = {
                type: ELEMENT_TYPES.CYLINDER,
                position: { kind: SPEC_KINDS.STATIC, value: {x:0,y:0,z:0}},
                radius: { kind: SPEC_KINDS.STATIC, value: 5 },
                height: { kind: SPEC_KINDS.COMPUTED, compute: () => 15 }
            };
            const resolved: ResolvedCylinder = {
                type: dynamic.type,
                position: resolveValue(dynamic.position),
                radius: resolveValue(dynamic.radius),
                height: resolveValue(dynamic.height)
            };
            expect(resolved.radius).toBe(5);
            expect(resolved.height).toBe(15);
        });

        it('Cone resolves correctly', () => {
            const dynamic: DynamicCone = {
                type: ELEMENT_TYPES.CONE,
                position: { kind: SPEC_KINDS.STATIC, value: {x:0,y:0,z:0}},
                radius: { kind: SPEC_KINDS.STATIC, value: 4 },
                height: { kind: SPEC_KINDS.STATIC, value: 12 }
            };
            const resolved: ResolvedCone = {
                type: dynamic.type,
                position: resolveValue(dynamic.position),
                radius: resolveValue(dynamic.radius),
                height: resolveValue(dynamic.height)
            };
            expect(resolved.radius).toBe(4);
            expect(resolved.height).toBe(12);
        });

        it('Torus resolves correctly', () => {
            const dynamic: DynamicTorus = {
                type: ELEMENT_TYPES.TORUS,
                position: { kind: SPEC_KINDS.STATIC, value: {x:0,y:0,z:0}},
                radius: { kind: SPEC_KINDS.STATIC, value: 8 },
                tubeRadius: { kind: SPEC_KINDS.STATIC, value: 2 }
            };
            const resolved: ResolvedTorus = {
                type: dynamic.type,
                position: resolveValue(dynamic.position),
                radius: resolveValue(dynamic.radius),
                tubeRadius: resolveValue(dynamic.tubeRadius)
            };
            expect(resolved.radius).toBe(8);
            expect(resolved.tubeRadius).toBe(2);
        });

        it('Elliptical resolves correctly', () => {
            const dynamic: DynamicElliptical = {
                type: ELEMENT_TYPES.ELLIPTICAL,
                position: { kind: SPEC_KINDS.STATIC, value: {x:0,y:0,z:0}},
                rx: { kind: SPEC_KINDS.STATIC, value: 3 },
                ry: { kind: SPEC_KINDS.STATIC, value: 4 },
                rz: { kind: SPEC_KINDS.STATIC, value: 5 }
            };
            const resolved: ResolvedElliptical = {
                type: dynamic.type,
                position: resolveValue(dynamic.position),
                rx: resolveValue(dynamic.rx),
                ry: resolveValue(dynamic.ry),
                rz: resolveValue(dynamic.rz)
            };
expect(resolved.rx).toBe(3);
            expect(resolved.ry).toBe(4);
            expect(resolved.rz).toBe(5);
        });
    });
});