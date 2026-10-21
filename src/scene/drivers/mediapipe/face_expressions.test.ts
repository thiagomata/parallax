import { describe, it, expect } from 'vitest';
import {
    FaceExpressions, DEFAULT_EXPRESSION_RANGES, EMOTION_THRESHOLD, measureFace, calibratedRanges, pitchFromPoseMatrix,
    type BlendshapeCategory, type FaceMeasures, type LandmarkPoint,
} from "./face_expressions";

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

// Landmark measures of a relaxed face (fixtures/faces: neutral faces read about these).
const RELAXED: FaceMeasures = { browInnerToOuter: 1, whiteAboveIris: -0.15, lipGap: 0.001, cornerLift: 0 };
const expressions = (scores: Record<string, number>, measures: Partial<FaceMeasures> | null = {}) =>
    new FaceExpressions(scores, DEFAULT_EXPRESSION_RANGES, measures ? { ...RELAXED, ...measures } : null).normalize();

describe('FaceExpressions - measures', () => {
    it('should remap the measures, even on the raw stage', () => {
        const raw = new FaceExpressions({}, DEFAULT_EXPRESSION_RANGES, { browInnerToOuter: 0.75, whiteAboveIris: -0.055, lipGap: 0.0275, cornerLift: 0.045 });
        const raised = new FaceExpressions({}, DEFAULT_EXPRESSION_RANGES, { browInnerToOuter: 1.175, whiteAboveIris: 0, lipGap: 0.2, cornerLift: -0.0225 });

        expect(raw.browsLow).toBeCloseTo(0.5);
        expect(raw.eyesWide).toBeCloseTo(0.5);
        expect(raw.lipsApart).toBeCloseTo(0.5);
        expect(raw.cornersUp).toBeCloseTo(0.5);
        expect(raised.browsRaised).toBeCloseTo(0.5);
        expect(raised.mouthWideOpen).toBeCloseTo(0.5);
        expect(raised.cornersDown).toBeCloseTo(0.5);
        expect(raw.normalize().measures).toBe(raw.measures);
    });

    it('should read 0 without measures', () => {
        const face = new FaceExpressions({});

        expect(face.measures).toBeNull();
        expect(face.browsLow).toBe(0);
        expect(face.browsRaised).toBe(0);
        expect(face.eyesWide).toBe(0);
        expect(face.lipsApart).toBe(0);
        expect(face.cornersUp).toBe(0);
    });

    it('should read a relaxed face as brows relaxed, eyes not wide and lips closed', () => {
        const face = expressions({});

        expect(face.browsLow).toBe(0);
        expect(face.eyesWide).toBe(0);
        expect(face.lipsApart).toBe(0);
    });
});

describe('FaceExpressions - emotions', () => {
    it('should read a smile as happy', () => {
        const face = expressions({ mouthSmileLeft: 0.95, mouthSmileRight: 0.95 });

        expect(face.happy).toBeCloseTo(1);
        expect(face.emotion).toBe('happy');
    });

    it('should not read a smile with the brows drawn down as happy (an angry mouth reads as a smile)', () => {
        const face = expressions({ mouthSmileLeft: 0.75, mouthSmileRight: 0.75 }, { browInnerToOuter: 0.6, lipGap: 0.06 });

        expect(face.happy).toBe(0);
        expect(face.emotion).toBe('angry');
    });

    it('should not read a mouth open wide as happy unless the corners are up ("ah" fires the smile score)', () => {
        const smileScore = { mouthSmileLeft: 0.5, mouthSmileRight: 0.5 };
        const ah = expressions(smileScore, { lipGap: 0.3, cornerLift: 0.033 });
        const laugh = expressions(smileScore, { lipGap: 0.3, cornerLift: 0.06 });
        const smallSmile = expressions(smileScore, { lipGap: 0.03, cornerLift: 0.03 });

        expect(ah.happy).toBe(0);
        expect(ah.emotion).toBe('neutral');
        expect(laugh.happy).toBeCloseTo(0.5);
        expect(smallSmile.happy).toBeCloseTo(0.5);
    });

    it('should read brows drawn down as angry, stronger with the lips apart', () => {
        const closed = expressions({}, { browInnerToOuter: 0.65 });
        const open = expressions({}, { browInnerToOuter: 0.65, lipGap: 0.06 });

        expect(closed.angry).toBeCloseTo(0.6);
        expect(open.angry).toBeCloseTo(1);
        expect(closed.emotion).toBe('angry');
    });

    it('should read white above the iris as surprised, stronger with the lips apart', () => {
        const closed = expressions({}, { whiteAboveIris: -0.01 });
        const open = expressions({}, { whiteAboveIris: -0.01, lipGap: 0.06 });

        expect(closed.surprised).toBeCloseTo(0.6);
        expect(open.surprised).toBeCloseTo(1);
        expect(open.emotion).toBe('surprised');
    });

    it('should read the brows\' own raised shape as sad when MediaPipe misses it, stronger with the corners down', () => {
        const level = expressions({ browInnerUp: 0.07 }, { browInnerToOuter: 1.25 });
        const cornersDown = expressions({ browInnerUp: 0.07 }, { browInnerToOuter: 1.25, cornerLift: -0.04 });

        expect(level.sad).toBeCloseTo(0.6);
        expect(cornersDown.sad).toBeCloseTo(1);
        expect(cornersDown.emotion).toBe('sad');
    });

    it('should read raised inner brows as sad, but not when the eyes are wide (surprise)', () => {
        const sad = expressions({ browInnerUp: 0.6 });
        const surprised = expressions({ browInnerUp: 0.6 }, { whiteAboveIris: -0.01 });

        expect(sad.sad).toBeCloseTo(0.6);
        expect(sad.emotion).toBe('sad');
        expect(surprised.sad).toBe(0);
        expect(surprised.emotion).toBe('surprised');
    });

    it('should not read an open mouth alone as an emotion', () => {
        const talking = expressions({ jawOpen: 0.5 }, { lipGap: 0.06 });

        expect(talking.lipsApart).toBe(1);
        expect(talking.emotion).toBe('neutral');
        for (const emotion of ['happy', 'sad', 'angry', 'surprised'] as const) {
            expect(talking[emotion]).toBe(0);
        }
    });

    it('should be neutral when no emotion reaches the threshold', () => {
        const slightSmile = 0.05 + 0.9 * (EMOTION_THRESHOLD - 0.05);

        expect(expressions({}).emotion).toBe('neutral');
        expect(expressions({ mouthSmileLeft: slightSmile, mouthSmileRight: slightSmile }).emotion).toBe('neutral');
    });

    it('should read no angry or surprise without measures', () => {
        const face = expressions({ mouthSmileLeft: 0.95, mouthSmileRight: 0.95 }, null);

        expect(face.angry).toBe(0);
        expect(face.surprised).toBe(0);
        expect(face.happy).toBeCloseTo(1);
    });
});

describe('FaceExpressions - gates', () => {
    it('should not read brows pulled down by closed eyes as angry', () => {
        const eyesClosed = expressions({ eyeBlinkLeft: 0.7, eyeBlinkRight: 0.7 }, { browInnerToOuter: 0.6 });
        const squint = expressions({ eyeBlinkLeft: 0.35, eyeBlinkRight: 0.35 }, { browInnerToOuter: 0.6 });

        expect(eyesClosed.angry).toBe(0);
        expect(squint.angry).toBeCloseTo(0.6);
    });

    it('should read neither angry nor sad with the mouth corners up, and keep the smile', () => {
        const smile = { mouthSmileLeft: 0.95, mouthSmileRight: 0.95 };
        const browsDown = expressions(smile, { browInnerToOuter: 0.7, cornerLift: 0.06 });
        const browsUp = expressions({ ...smile, browInnerUp: 0.6 }, { cornerLift: 0.06 });

        expect(browsDown.angry).toBe(0);
        expect(browsDown.happy).toBeCloseTo(1);
        expect(browsUp.sad).toBe(0);
        expect(browsUp.emotion).toBe('happy');
    });
});

describe('FaceExpressions - average and withRanges', () => {
    it('should average scores and measures', () => {
        const a = new FaceExpressions({ jawOpen: 0.2 }, DEFAULT_EXPRESSION_RANGES, { ...RELAXED, browInnerToOuter: 1.2 });
        const b = new FaceExpressions({ jawOpen: 0.4 }, DEFAULT_EXPRESSION_RANGES, { ...RELAXED, browInnerToOuter: 1.3 });
        const mean = FaceExpressions.average([a, b]);

        expect(mean.score('jawOpen')).toBeCloseTo(0.3);
        expect(mean.measures?.browInnerToOuter).toBeCloseTo(1.25);
    });

    it('should average without measures, and need a face', () => {
        expect(FaceExpressions.average([new FaceExpressions({ jawOpen: 0.2 })]).measures).toBeNull();
        expect(() => FaceExpressions.average([])).toThrow();
    });

    it('should read the same raw expressions with other ranges', () => {
        const raw = new FaceExpressions({ jawOpen: 0.3 }, DEFAULT_EXPRESSION_RANGES, RELAXED);
        const other = raw.withRanges({ jawOpen: { rest: 0.1, full: 0.5 } });

        expect(other.scores).toBe(raw.scores);
        expect(other.measures).toBe(raw.measures);
        expect(other.normalize().mouthOpen).toBeCloseTo(0.5);
    });
});

describe('calibratedRanges', () => {
    // One person whose relaxed brows sit high (ratio 1.25) and frown to 1.17 - too little for the
    // default ranges, which have to fit everyone.
    const neutral = new FaceExpressions({ mouthSmileLeft: 0.2, mouthSmileRight: 0.2, jawOpen: 0 }, DEFAULT_EXPRESSION_RANGES, { ...RELAXED, browInnerToOuter: 1.25 });
    const ranges = calibratedRanges(neutral);
    const frown = new FaceExpressions({}, DEFAULT_EXPRESSION_RANGES, { ...RELAXED, browInnerToOuter: 1.17 });

    it('should count the brows from the person\'s own neutral face', () => {
        expect(frown.normalize().angry).toBe(0);
        expect(frown.withRanges(ranges).normalize().browsLow).toBeCloseTo(0.75);
        expect(frown.withRanges(ranges).normalize().emotion).toBe('angry');
        expect(neutral.withRanges(ranges).normalize().emotion).toBe('neutral');
    });

    it('should rest the scores the neutral face already shows', () => {
        expect(ranges.mouthSmileLeft.rest).toBeCloseTo(0.22);
        expect(ranges.mouthSmileLeft.full).toBe(DEFAULT_EXPRESSION_RANGES.mouthSmileLeft.full);
        expect(ranges.jawOpen).toBe(DEFAULT_EXPRESSION_RANGES.jawOpen);
    });

    it('should keep the default lips ranges, and the signal ranges without measures', () => {
        expect(ranges.lipsApart).toBe(DEFAULT_EXPRESSION_RANGES.lipsApart);
        expect(calibratedRanges(new FaceExpressions({})).browsLow).toBe(DEFAULT_EXPRESSION_RANGES.browsLow);
    });
});

describe('measureFace', () => {
    // A face 0.4 wide with its landmarks placed to give known measures (aspect 1).
    const landmarksWith = (overrides: Record<number, LandmarkPoint>): LandmarkPoint[] => {
        const points: LandmarkPoint[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
        const place: Record<number, LandmarkPoint> = {
            234: { x: 0.3, y: 0.5 }, 454: { x: 0.7, y: 0.5 },          // face edges: width 0.4
            55: { x: 0.45, y: 0.40 }, 285: { x: 0.55, y: 0.40 },        // inner brows
            133: { x: 0.45, y: 0.44 }, 362: { x: 0.55, y: 0.44 },       // inner eye corners: 0.04 below
            46: { x: 0.35, y: 0.39 }, 276: { x: 0.65, y: 0.39 },        // outer brows
            33: { x: 0.35, y: 0.44 }, 263: { x: 0.65, y: 0.44 },        // outer eye corners: 0.05 below
            61: { x: 0.42, y: 0.60 }, 291: { x: 0.58, y: 0.60 },        // mouth corners 0.01 above the lips' middle
            159: { x: 0.40, y: 0.440 }, 386: { x: 0.60, y: 0.440 },     // upper lids
            468: { x: 0.40, y: 0.46 }, 473: { x: 0.60, y: 0.46 },       // iris centers, radius 0.01:
            469: { x: 0.41, y: 0.46 }, 474: { x: 0.61, y: 0.46 },       // iris top 0.45, the lid 0.01 above it
            470: { x: 0.40, y: 0.46 }, 471: { x: 0.40, y: 0.46 }, 472: { x: 0.40, y: 0.46 },
            475: { x: 0.60, y: 0.46 }, 476: { x: 0.60, y: 0.46 }, 477: { x: 0.60, y: 0.46 },
            13: { x: 0.5, y: 0.60 }, 14: { x: 0.5, y: 0.62 },           // lips 0.02 apart
            ...overrides,
        };
        for (const [index, point] of Object.entries(place)) points[Number(index)] = point;
        return points;
    };

    it('should measure relative to the face width', () => {
        const measures = measureFace(landmarksWith({}), 1);

        expect(measures?.browInnerToOuter).toBeCloseTo(0.04 / 0.05);
        expect(measures?.whiteAboveIris).toBeCloseTo(0.01 / 0.02); // white shows: the lid is above the iris top
        expect(measures?.lipGap).toBeCloseTo(0.02 / 0.4);
        expect(measures?.cornerLift).toBeCloseTo(0.01 / 0.4);
        expect(measures?.headPitch).toBeUndefined();
    });

    it('should scale y by the image aspect', () => {
        const measures = measureFace(landmarksWith({}), 2);

        expect(measures?.browInnerToOuter).toBeCloseTo(0.08 / 0.10);
        expect(measures?.lipGap).toBeCloseTo(0.04 / 0.4);
    });

    it('should read the head pitch from the pose matrix', () => {
        const angle = 0.3;
        // Column-major 4x4: a rotation about x by angle.
        const matrix = [1, 0, 0, 0, 0, Math.cos(angle), Math.sin(angle), 0, 0, -Math.sin(angle), Math.cos(angle), 0, 0, 0, 0, 1];

        expect(pitchFromPoseMatrix(matrix)).toBeCloseTo(angle);
        expect(measureFace(landmarksWith({}), 1, matrix)?.headPitch).toBeCloseTo(angle);
    });

    it('should need the iris landmarks and a face width', () => {
        expect(measureFace(landmarksWith({}).slice(0, 468), 1)).toBeNull();
        expect(measureFace(landmarksWith({ 454: { x: 0.3, y: 0.5 } }), 1)).toBeNull();
    });
});

describe('FaceExpressions - head tilt', () => {
    const degrees = (value: number) => value * Math.PI / 180;
    const frown = (headPitch: number) => expressions({}, { browInnerToOuter: 0.65, headPitch: degrees(headPitch) });

    it('should keep the brow emotions within 12 degrees of the neutral pitch and drop them from 24', () => {
        expect(frown(0).angry).toBeCloseTo(0.6);
        expect(frown(-10).angry).toBeCloseTo(0.6);
        expect(frown(18).angry).toBeCloseTo(0.3);
        expect(frown(-25).angry).toBe(0);
        expect(frown(25).emotion).toBe('neutral');
    });

    it('should drop sad the same way, and leave happy and surprised alone', () => {
        const lookingUp = expressions({ browInnerUp: 0.6, mouthSmileLeft: 0.95, mouthSmileRight: 0.95 }, { headPitch: degrees(30) });
        const surprisedUp = expressions({}, { whiteAboveIris: -0.01, headPitch: degrees(30) });

        expect(expressions({ browInnerUp: 0.6 }, { headPitch: degrees(30) }).sad).toBe(0);
        expect(lookingUp.happy).toBeCloseTo(1);
        expect(surprisedUp.surprised).toBeCloseTo(0.6);
    });

    it('should not fade without a known pitch', () => {
        expect(expressions({}, { browInnerToOuter: 0.65 }).headTiltedAway).toBe(0);
    });

    it('should count the tilt from the neutral face\'s own pitch once calibrated', () => {
        const neutral = new FaceExpressions({}, DEFAULT_EXPRESSION_RANGES, { ...RELAXED, headPitch: degrees(30) });
        const ranges = calibratedRanges(neutral);
        const frownAtUsualPitch = new FaceExpressions({}, DEFAULT_EXPRESSION_RANGES, { ...RELAXED, browInnerToOuter: 0.9, headPitch: degrees(30) });

        expect(frownAtUsualPitch.normalize().headTiltedAway).toBeCloseTo(1);
        expect(frownAtUsualPitch.withRanges(ranges).normalize().headTiltedAway).toBe(0);
        expect(frownAtUsualPitch.withRanges(ranges).normalize().emotion).toBe('angry');
    });

    it('should average the pitch only when every frame has one', () => {
        const a = new FaceExpressions({}, DEFAULT_EXPRESSION_RANGES, { ...RELAXED, headPitch: 0.1 });
        const b = new FaceExpressions({}, DEFAULT_EXPRESSION_RANGES, { ...RELAXED, headPitch: 0.3 });

        expect(FaceExpressions.average([a, b]).measures?.headPitch).toBeCloseTo(0.2);
        expect(FaceExpressions.average([a, new FaceExpressions({}, DEFAULT_EXPRESSION_RANGES, RELAXED)]).measures?.headPitch).toBeUndefined();
    });
});
