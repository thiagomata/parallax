import { describe, it, expect } from 'vitest';
import { FaceExpressions, DEFAULT_EXPRESSION_RANGES, type BlendshapeCategory } from "./face_expressions";

// The shape FaceLandmarker returns with outputFaceBlendshapes on (checked with scripts/bench-blendshapes.mjs).
const categories = (scores: Record<string, number>): BlendshapeCategory[] =>
    Object.entries(scores).map(([categoryName, score]) => ({ categoryName, score }));

describe('FaceExpressions - raw', () => {
    it('should keep every score by its MediaPipe name', () => {
        const expressions = FaceExpressions.fromBlendshapes(categories({ jawOpen: 0.2, browInnerUp: 0.4 }));

        expect(expressions.scores).toEqual({ jawOpen: 0.2, browInnerUp: 0.4 });
        expect(expressions.score('browInnerUp')).toBe(0.4);
        expect(expressions.ranges).toBe(DEFAULT_EXPRESSION_RANGES);
    });

    it('should read the getters straight from the raw scores', () => {
        const expressions = FaceExpressions.fromBlendshapes(categories({
            eyeBlinkLeft: 0.2, eyeBlinkRight: 0.4, jawOpen: 0.3, mouthSmileLeft: 0.1, mouthSmileRight: 0.3,
        }));

        expect(expressions.leftEyeOpen).toBeCloseTo(0.8);
        expect(expressions.rightEyeOpen).toBeCloseTo(0.6);
        expect(expressions.mouthOpen).toBeCloseTo(0.3);
        expect(expressions.smile).toBeCloseTo(0.2);
    });

    it('should treat missing scores as 0', () => {
        const expressions = new FaceExpressions({});

        expect(expressions.score('jawOpen')).toBe(0);
        expect(expressions.leftEyeOpen).toBe(1);
        expect(expressions.mouthOpen).toBe(0);
        expect(expressions.smile).toBe(0);
    });
});

describe('FaceExpressions - normalize', () => {
    const ranges = {
        eyeBlinkLeft: { rest: 0.2, full: 0.6 },
        jawOpen: { rest: 0.1, full: 0.5 },
    };

    it('should map rest to 0 and full to 1', () => {
        const rest = new FaceExpressions({ eyeBlinkLeft: 0.2, jawOpen: 0.1 }, ranges).normalize();
        const full = new FaceExpressions({ eyeBlinkLeft: 0.6, jawOpen: 0.5 }, ranges).normalize();
        const half = new FaceExpressions({ eyeBlinkLeft: 0.4, jawOpen: 0.3 }, ranges).normalize();

        expect(rest.leftEyeOpen).toBeCloseTo(1);
        expect(rest.mouthOpen).toBeCloseTo(0);
        expect(full.leftEyeOpen).toBeCloseTo(0);
        expect(full.mouthOpen).toBeCloseTo(1);
        expect(half.leftEyeOpen).toBeCloseTo(0.5);
        expect(half.mouthOpen).toBeCloseTo(0.5);
    });

    it('should clamp scores outside the range', () => {
        const below = new FaceExpressions({ jawOpen: 0.01 }, ranges).normalize();
        const above = new FaceExpressions({ jawOpen: 0.9 }, ranges).normalize();

        expect(below.mouthOpen).toBe(0);
        expect(above.mouthOpen).toBe(1);
    });

    it('should keep scores without a range as they are', () => {
        const normalized = new FaceExpressions({ browInnerUp: 0.4 }, ranges).normalize();

        expect(normalized.score('browInnerUp')).toBe(0.4);
    });

    it('should keep scores raw when a range is empty', () => {
        const normalized = new FaceExpressions({ jawOpen: 0.4 }, { jawOpen: { rest: 0.5, full: 0.5 } }).normalize();

        expect(normalized.mouthOpen).toBe(0.4);
    });

    it('should not modify the raw expressions', () => {
        const raw = new FaceExpressions({ jawOpen: 0.3 }, ranges);
        raw.normalize();

        expect(raw.mouthOpen).toBe(0.3);
    });

    it('should cache the normalized expressions and not normalize twice', () => {
        const raw = new FaceExpressions({ jawOpen: 0.3 }, ranges);
        const normalized = raw.normalize();

        expect(raw.normalize()).toBe(normalized);
        expect(normalized.normalize()).toBe(normalized);
        expect(raw.normalize(false)).not.toBe(normalized);
        expect(raw.normalize(false).mouthOpen).toBeCloseTo(0.5);
    });

    it('should give a neutral face (rest scores from heads.mp4) eyes open and mouth closed', () => {
        const neutral = new FaceExpressions({
            eyeBlinkLeft: 0.14, eyeBlinkRight: 0.11, jawOpen: 0.011, mouthSmileLeft: 0.006, mouthSmileRight: 0.007,
        }).normalize();

        expect(neutral.leftEyeOpen).toBe(1);
        expect(neutral.rightEyeOpen).toBe(1);
        expect(neutral.mouthOpen).toBe(0);
        expect(neutral.smile).toBe(0);
    });
});
