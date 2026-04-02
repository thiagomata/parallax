import { describe, it, expect } from 'vitest';
import {
    SceneFaceBuilder,
    SceneFace,
    DEFAULT_FACE_SCENE_CONFIG,
    computeDepthScale,
} from './scene_face';

describe('SceneFaceBuilder', () => {
    const defaultConfig = DEFAULT_FACE_SCENE_CONFIG;

    describe('depth positioning', () => {
        it('should place face at baseline when actual size matches expected', () => {
            const sceneScreenWidth = 650;
            const baselineWidth = 180;
            const actualWidthNormalized = baselineWidth / sceneScreenWidth;

            const face = new SceneFaceBuilder()
                .config({ sceneScreenWidth })
                .actualWidth(actualWidthNormalized)
                .baselineWidth(baselineWidth)
                .build();

            expect(face.localPosition.z).toBeCloseTo(0);
            expect(face.widthRatio).toBeCloseTo(1);
        });

        it('should place face in front of baseline (closer) when face appears big in image', () => {
            const sceneScreenWidth = 650;
            const baselineWidth = 180;
            const bigFaceNormalized = 0.5;

            const face = new SceneFaceBuilder()
                .config({ sceneScreenWidth })
                .actualWidth(bigFaceNormalized)
                .baselineWidth(baselineWidth)
                .build();

            expect(face.localPosition.z).toBeGreaterThan(0);
            expect(face.widthRatio).toBeLessThan(1);
        });

        it('should place face behind baseline (farther) when face appears small in image', () => {
            const sceneScreenWidth = 650;
            const baselineWidth = 180;
            const smallFaceNormalized = 0.1;

            const face = new SceneFaceBuilder()
                .config({ sceneScreenWidth })
                .actualWidth(smallFaceNormalized)
                .baselineWidth(baselineWidth)
                .build();

            expect(face.localPosition.z).toBeLessThan(0);
            expect(face.widthRatio).toBeGreaterThan(1);
        });
    });

    describe('head width invariant', () => {
        it('should always have headWidth equal to baselineWidth regardless of distance', () => {
            const baselineWidth = 180;
            const sceneScreenWidth = 650;

            const closeFace = new SceneFaceBuilder()
                .config({ sceneScreenWidth })
                .actualWidth(0.5)
                .baselineWidth(baselineWidth)
                .build();

            const baselineFace = new SceneFaceBuilder()
                .config({ sceneScreenWidth })
                .actualWidth(baselineWidth / sceneScreenWidth)
                .baselineWidth(baselineWidth)
                .build();

            const farFace = new SceneFaceBuilder()
                .config({ sceneScreenWidth })
                .actualWidth(0.05)
                .baselineWidth(baselineWidth)
                .build();

            expect(closeFace.headWidth).toBe(baselineWidth);
            expect(baselineFace.headWidth).toBe(baselineWidth);
            expect(farFace.headWidth).toBe(baselineWidth);
        });
    });

    describe('extreme cases', () => {
        it('should handle very big face (very close to camera)', () => {
            const baselineWidth = 180;
            const sceneScreenWidth = 650;
            const hugeFaceNormalized = 1.0;

            const face = new SceneFaceBuilder()
                .config({ sceneScreenWidth })
                .actualWidth(hugeFaceNormalized)
                .baselineWidth(baselineWidth)
                .build();

            expect(face.localPosition.z).toBeGreaterThan(0);
            expect(face.widthRatio).toBeLessThan(1);
            expect(face.headWidth).toBe(baselineWidth);
        });

        it('should handle very small face (very far from camera)', () => {
            const baselineWidth = 180;
            const sceneScreenWidth = 650;
            const tinyFaceNormalized = 0.01;

            const face = new SceneFaceBuilder()
                .config({ sceneScreenWidth })
                .actualWidth(tinyFaceNormalized)
                .baselineWidth(baselineWidth)
                .build();

            expect(face.localPosition.z).toBeLessThan(0);
            expect(face.widthRatio).toBeGreaterThan(1);
            expect(face.headWidth).toBe(baselineWidth);
        });

        it('should handle tiny face as a very far face, not a tiny scene object', () => {
            const baselineWidth = 180;
            const tinyNormalized = 0.001;

            const face = new SceneFaceBuilder()
                .actualWidth(tinyNormalized)
                .baselineWidth(baselineWidth)
                .build();

            expect(face.headWidth).toBe(baselineWidth);
            expect(face.localPosition.z).toBeLessThan(0);
        });
    });

    describe('world position', () => {
        it('should compute world position by adding baseline to local position', () => {
            const baseline = { x: 100, y: 200, z: 500 };
            const baselineWidth = 180;
            const actualNormalized = 0.5;

            const face = new SceneFaceBuilder()
                .config({ ...defaultConfig, baseline })
                .actualWidth(actualNormalized)
                .baselineWidth(baselineWidth)
                .build();

            expect(face.worldPosition.x).toBeCloseTo(baseline.x + face.localPosition.x);
            expect(face.worldPosition.y).toBeCloseTo(baseline.y + face.localPosition.y);
            expect(face.worldPosition.z).toBeCloseTo(baseline.z + face.localPosition.z);
        });

        it('should return baseline as world position when at baseline position', () => {
            const baseline = { x: 50, y: 75, z: 100 };
            const sceneScreenWidth = 650;
            const baselineWidth = 180;

            const face = new SceneFaceBuilder()
                .config({ ...defaultConfig, baseline })
                .actualWidth(baselineWidth / sceneScreenWidth)
                .baselineWidth(baselineWidth)
                .build();

            expect(face.worldPosition.x).toBeCloseTo(baseline.x);
            expect(face.worldPosition.y).toBeCloseTo(baseline.y);
            expect(face.worldPosition.z).toBeCloseTo(baseline.z);
        });
    });

    describe('horizontal positioning', () => {
        it('should center face horizontally when skull center is at 0.5', () => {
            const face = new SceneFaceBuilder()
                .actualWidth(0.277)
                .baselineWidth(180)
                .skullCenterNormalized({ x: 0.5, y: 0.5, z: 0.5 })
                .build();

            expect(face.localPosition.x).toBeCloseTo(0);
        });

        it('should position face left when skull center is right of center', () => {
            const face = new SceneFaceBuilder()
                .actualWidth(0.277)
                .baselineWidth(180)
                .skullCenterNormalized({ x: 0.7, y: 0.5, z: 0.5 })
                .build();

            expect(face.localPosition.x).toBeLessThan(0);
        });

        it('should position face right when skull center is left of center', () => {
            const face = new SceneFaceBuilder()
                .actualWidth(0.277)
                .baselineWidth(180)
                .skullCenterNormalized({ x: 0.3, y: 0.5, z: 0.5 })
                .build();

            expect(face.localPosition.x).toBeGreaterThan(0);
        });
    });

    describe('rotation', () => {
        it('should flip pitch and roll signs', () => {
            const face = new SceneFaceBuilder()
                .rotation({ yaw: 0.1, pitch: 0.2, roll: 0.3 })
                .build();

            expect(face.localRotation.yaw).toBeCloseTo(0.1);
            expect(face.localRotation.pitch).toBeCloseTo(-0.2);
            expect(face.localRotation.roll).toBeCloseTo(-0.3);
        });

        it('should preserve zero rotation', () => {
            const face = new SceneFaceBuilder()
                .rotation({ yaw: 0, pitch: 0, roll: 0 })
                .build();

            expect(face.localRotation.yaw).toBeCloseTo(0);
            expect(face.localRotation.pitch).toBeCloseTo(0);
            expect(face.localRotation.roll).toBeCloseTo(0);
        });
    });

    describe('depth scale', () => {
        it('should amplify depth effect when depthScale is greater than 1', () => {
            const faceWithoutScale = new SceneFaceBuilder()
                .config({ sceneScreenWidth: 650, depthScale: 1 })
                .actualWidth(0.5)
                .baselineWidth(180)
                .build();

            const faceWithScale = new SceneFaceBuilder()
                .config({ sceneScreenWidth: 650, depthScale: 2 })
                .actualWidth(0.5)
                .baselineWidth(180)
                .build();

            expect(Math.abs(faceWithScale.localPosition.z)).toBeGreaterThan(
                Math.abs(faceWithoutScale.localPosition.z)
            );
            expect(faceWithScale.localPosition.z).toBeCloseTo(
                faceWithoutScale.localPosition.z * 2
            );
        });
    });
});

describe('computeDepthScale', () => {
    it('should return 1 for default physical head width and focal length', () => {
        expect(computeDepthScale(150, 1)).toBe(1);
    });

    it('should scale proportionally with physical head width', () => {
        expect(computeDepthScale(300, 1)).toBe(2);
        expect(computeDepthScale(75, 1)).toBe(0.5);
    });

    it('should scale with focal length', () => {
        expect(computeDepthScale(150, 2)).toBe(2);
        expect(computeDepthScale(150, 0.5)).toBe(0.5);
    });

    it('should return 1 for invalid inputs', () => {
        expect(computeDepthScale(0, 1)).toBe(1);
        expect(computeDepthScale(150, 0)).toBe(1);
        expect(computeDepthScale(-100, 1)).toBe(1);
        expect(computeDepthScale(NaN, 1)).toBe(1);
    });
});

describe('SceneFace', () => {
    it('should expose depth as localPosition.z', () => {
        const face = new SceneFace(
            DEFAULT_FACE_SCENE_CONFIG,
            { x: 10, y: 20, z: 150 },
            { yaw: 0, pitch: 0, roll: 0 },
            180,
            0.5
        );

        expect(face.depth).toBe(150);
    });
});
