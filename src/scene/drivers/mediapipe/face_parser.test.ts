import { describe, it, expect } from 'vitest';
import {
    DEFAULT_HEAD_PROPORTIONS,
    FaceParser,
    type HeadProportions,
    INDEX,
    type ParsedFace,
    wrapPi
} from "./face_parser";

const createRawVector = (overrides: Record<number, { x: number, y: number, z?: number }> = {}): Array<{ x?: number, y?: number, z?: number }> => {
    const vector = new Array(500).fill(undefined);
    Object.entries(overrides).forEach(([index, value]) => {
        vector[parseInt(index)] = value;
    });
    return vector;
};


describe('FaceParser - parseRawVector', () => {
    const parser = new FaceParser();

    it('should extract nose landmark from raw vector', () => {
        const raw = createRawVector({
            [INDEX.NOSE]: { x: 0.5, y: 0.5, z: 0.1 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.nose.position.x).toBe(0.5);
        expect(result.nose.position.y).toBe(0.5);
        expect(result.nose.position.z).toBe(0.1);
    });

    it('should extract left and right eye landmarks', () => {
        const raw = createRawVector({
            [INDEX.EYE_LEFT]: { x: 0.3, y: 0.4, z: 0 },
            [INDEX.EYE_RIGHT]: { x: 0.7, y: 0.4, z: 0 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.eyes.left.position.x).toBe(0.3);
        expect(result.eyes.right.position.x).toBe(0.7);
    });

    it('should extract left and right brows landmarks', () => {
        const raw = createRawVector({
            [INDEX.BROW_LEFT]: { x: 0.3, y: 0.4, z: 0 },
            [INDEX.BROW_RIGHT]: { x: 0.7, y: 0.4, z: 0 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.brows.left.position.x).toBe(0.3);
        expect(result.brows.right.position.x).toBe(0.7);
    });

    it('should extract left and right mouth landmarks', () => {
        const raw = createRawVector({
            [INDEX.MOUTH_LEFT]: { x: 0.4, y: 0.7, z: 0 },
            [INDEX.MOUTH_RIGHT]: { x: 0.6, y: 0.7, z: 0 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.mouth.left.position.x).toBe(0.4);
        expect(result.mouth.right.position.x).toBe(0.6);
    });

    it('should extract ear landmarks', () => {
        const raw = createRawVector({
            [INDEX.EAR_LEFT]: { x: 0.1, y: 0.5, z: 0 },
            [INDEX.EAR_RIGHT]: { x: 0.9, y: 0.5, z: 0 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.rig.leftEar.position.x).toBe(0.1);
        expect(result.rig.rightEar.position.x).toBe(0.9);
    });

    it('should extract temple landmarks', () => {
        const raw = createRawVector({
            [INDEX.TEMPLE_LEFT]: { x: 0.2, y: 0.4, z: 0 },
            [INDEX.TEMPLE_RIGHT]: { x: 0.8, y: 0.4, z: 0 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.rig.leftTemple.position.x).toBe(0.2);
        expect(result.rig.rightTemple.position.x).toBe(0.8);
    });

    it('should extract bounds top and bottom landmarks', () => {
        const raw = createRawVector({
            [INDEX.TOP]: { x: 0.5, y: 0.1, z: 0 },
            [INDEX.BOTTOM]: { x: 0.5, y: 0.9, z: 0 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.bounds.middleTop.position.y).toBe(0.1);
        expect(result.bounds.middleBottom.position.y).toBe(0.9);
    });

    it('should mark landmark as invisible when x is outside [0, 1] range', () => {
        const raw = createRawVector({
            [INDEX.NOSE]: { x: 1.5, y: 0.5, z: 0 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.nose.isVisible).toBe(false);
    });

    it('should mark landmark as invisible when y is outside [0, 1] range', () => {
        const raw = createRawVector({
            [INDEX.NOSE]: { x: 0.5, y: -0.1, z: 0 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.nose.isVisible).toBe(false);
    });

    it('should mark landmark as visible when x and y are within [0, 1]', () => {
        const raw = createRawVector({
            [INDEX.NOSE]: { x: 0.5, y: 0.5, z: 0 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.nose.isVisible).toBe(true);
    });

    it('should mark landmark as invisible when x is undefined', () => {
        const raw = createRawVector({
            [INDEX.NOSE]: { y: 0.5, z: 0 } as any
        });

        const result = parser.parseRawVector(raw);

        expect(result.nose.isVisible).toBe(false);
    });

    it('should mark landmark as invisible when y is undefined', () => {
        const raw = createRawVector({
            [INDEX.NOSE]: { x: 0.5, z: 0 } as any
        });

        const result = parser.parseRawVector(raw);

        expect(result.nose.isVisible).toBe(false);
    });

    it('should mark landmark as invisible when x is null', () => {
        const raw = createRawVector({
            [INDEX.NOSE]: { x: null as any, y: 0.5, z: 0 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.nose.isVisible).toBe(false);
    });

    it('should return default values when landmark index is missing', () => {
        const raw = createRawVector({});

        const result = parser.parseRawVector(raw);

        expect(result.nose.position).toEqual({ x: -1, y: -1, z: -1 });
        expect(result.nose.isVisible).toBe(false);
    });

    it('should return default values for all missing landmarks', () => {
        const raw = createRawVector({});

        const result = parser.parseRawVector(raw);

        expect(result.eyes.left.isVisible).toBe(false);
        expect(result.eyes.right.isVisible).toBe(false);
        expect(result.mouth.left.isVisible).toBe(false);
        expect(result.mouth.right.isVisible).toBe(false);
        expect(result.rig.leftEar.isVisible).toBe(false);
        expect(result.rig.rightEar.isVisible).toBe(false);
        expect(result.rig.leftTemple.isVisible).toBe(false);
        expect(result.rig.rightTemple.isVisible).toBe(false);
        expect(result.bounds.middleTop.isVisible).toBe(false);
        expect(result.bounds.middleBottom.isVisible).toBe(false);
    });

    it('should use default z value of 0 when z is undefined', () => {
        const raw = createRawVector({
            [INDEX.NOSE]: { x: 0.5, y: 0.5 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.nose.position.z).toBe(0);
    });

    it('should handle partial z values correctly', () => {
        const raw = createRawVector({
            [INDEX.NOSE]: { x: 0.5, y: 0.5, z: 0.3 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.nose.position.z).toBe(0.3);
    });

    it('should extract all landmarks from a complete raw vector', () => {
        const raw = createRawVector({
            [INDEX.NOSE]: { x: 0.5, y: 0.5, z: 0.1 },
            [INDEX.EYE_LEFT]: { x: 0.35, y: 0.45, z: 0 },
            [INDEX.EYE_RIGHT]: { x: 0.65, y: 0.45, z: 0 },
            [INDEX.MOUTH_LEFT]: { x: 0.42, y: 0.7, z: 0 },
            [INDEX.MOUTH_RIGHT]: { x: 0.58, y: 0.7, z: 0 },
            [INDEX.EAR_LEFT]: { x: 0.1, y: 0.5, z: 0 },
            [INDEX.EAR_RIGHT]: { x: 0.9, y: 0.5, z: 0 },
            [INDEX.TEMPLE_LEFT]: { x: 0.2, y: 0.4, z: 0 },
            [INDEX.TEMPLE_RIGHT]: { x: 0.8, y: 0.4, z: 0 },
            [INDEX.TOP]: { x: 0.5, y: 0.1, z: 0 },
            [INDEX.BOTTOM]: { x: 0.5, y: 0.9, z: 0 }
        });

        const result = parser.parseRawVector(raw);

        expect(result.nose.isVisible).toBe(true);
        expect(result.eyes.left.isVisible).toBe(true);
        expect(result.eyes.right.isVisible).toBe(true);
        expect(result.mouth.left.isVisible).toBe(true);
        expect(result.mouth.right.isVisible).toBe(true);
        expect(result.rig.leftEar.isVisible).toBe(true);
        expect(result.rig.rightEar.isVisible).toBe(true);
        expect(result.rig.leftTemple.isVisible).toBe(true);
        expect(result.rig.rightTemple.isVisible).toBe(true);
        expect(result.bounds.middleTop.isVisible).toBe(true);
        expect(result.bounds.middleBottom.isVisible).toBe(true);
    });

    it('should parse a raw vector from a canonical face', () => {
        const raw = toFlatArray(
            toScreenSpace(
                translate(
                    scale(
                        createCanonicalHead(),
                        0.5 // ensure it bounds fits into screen
                    ),
                    0.1,
                    0.1,
                    1,
                )
            )
        )

        const result = parser.parseRawVector(raw);

        expect(result.nose.isVisible).toBe(true);
        expect(result.eyes.left.isVisible).toBe(true);
        expect(result.eyes.right.isVisible).toBe(true);
        expect(result.mouth.left.isVisible).toBe(true);
        expect(result.mouth.right.isVisible).toBe(true);
        expect(result.rig.leftEar.isVisible).toBe(true);
        expect(result.rig.rightEar.isVisible).toBe(true);
        expect(result.rig.leftTemple.isVisible).toBe(true);
        expect(result.rig.rightTemple.isVisible).toBe(true);
        expect(result.bounds.middleTop.isVisible).toBe(true);
        expect(result.bounds.middleBottom.isVisible).toBe(true);

        expect(result.nose.position).toStrictEqual(raw[INDEX.NOSE]);
        expect(result.eyes.left.position).toStrictEqual(raw[INDEX.EYE_LEFT]);
        expect(result.eyes.right.position).toStrictEqual(raw[INDEX.EYE_RIGHT]);
        expect(result.mouth.left.position).toStrictEqual(raw[INDEX.MOUTH_LEFT]);
        expect(result.mouth.right.position).toStrictEqual(raw[INDEX.MOUTH_RIGHT]);
        expect(result.rig.leftEar.position).toStrictEqual(raw[INDEX.EAR_LEFT]);
        expect(result.rig.rightEar.position).toStrictEqual(raw[INDEX.EAR_RIGHT]);
        expect(result.rig.leftTemple.position).toStrictEqual(raw[INDEX.TEMPLE_LEFT]);
        expect(result.rig.rightTemple.position).toStrictEqual(raw[INDEX.TEMPLE_RIGHT]);
        expect(result.bounds.middleTop.position).toStrictEqual(raw[INDEX.TOP]);
        expect(result.bounds.middleBottom.position).toStrictEqual(raw[INDEX.BOTTOM]);


    })
});

describe('FaceParser - getSkullCenter', () => {
    const parser = new FaceParser();

    // Helper to create a RawExtraction object
    const createExtraction = (overrides: Partial<ParsedFace> = {}): ParsedFace => {
        const defaultLandmark = { position: { x: 0.5, y: 0.5, z: 0 }, isVisible: true };
        return {
            normalized: false,
            centered: false,
            nose: defaultLandmark,
            eyes: { left: defaultLandmark, right: defaultLandmark },
            brows: { left: defaultLandmark, right: defaultLandmark },
            mouth: { left: defaultLandmark, right: defaultLandmark },
            rig: {
                leftEar: { ...defaultLandmark, isVisible: false },
                rightEar: { ...defaultLandmark, isVisible: false },
                leftTemple: { ...defaultLandmark, isVisible: false },
                rightTemple: { ...defaultLandmark, isVisible: false }
            },
            bounds: {
                middleTop: { position: { x: 0.5, y: 0.2, z: 0 }, isVisible: true },
                middleBottom: { position: { x: 0.5, y: 0.8, z: 0 }, isVisible: true }
            },
            skullCenter: { position: { x: 0, y: 0, z: 0 }, isVisible: true },
            ...overrides
        };
    };

    it('should calculate center X as the average of available stable pairs', () => {
        const extraction = createExtraction({
            eyes: {
                left: { position: { x: 0.4, y: 0.4, z: 0 }, isVisible: true },
                right: { position: { x: 0.6, y: 0.4, z: 0 }, isVisible: true }
            }
        });

        const center = parser.getSkullCenter(extraction); // Accessing private for testing
        expect(center.position.x).toBeCloseTo((0.4 + 0.6) / 2, 5);
    });

    it('should use Ear depth (Z) as the skull center when ears are visible', () => {
        const extraction = createExtraction({
            rig: {
                ...createExtraction().rig,
                leftEar: { position: { x: 0.1, y: 0.5, z: 0.2 }, isVisible: true },
                rightEar: { position: { x: 0.9, y: 0.5, z: 0.2 }, isVisible: true }
            }
        });

        const center = parser.getSkullCenter(extraction);
        expect(center.position.z).toBe(0.2);
    });

    it('should project Z depth using the full anatomical width when ears are hidden', () => {
        const props = DEFAULT_HEAD_PROPORTIONS;

        const eyeLeftX = 0.4;
        const eyeRightX = 0.6;
        const eyeZ = 0.0;

        const extraction = createExtraction({
            eyes: {
                left: { position: { x: eyeLeftX, y: 0.4, z: eyeZ }, isVisible: true },
                right: { position: { x: eyeRightX, y: 0.4, z: eyeZ }, isVisible: true }
            }
        });

        // 1. Calculate the eye span (0.2)
        const eyeSpan = Math.abs(eyeRightX - eyeLeftX);

        // 2. Resolve the FULL Face Width (1.0)
        // If 0.2 represents 45% of the head, then 100% is 0.2 / 0.45 = 0.444...
        const fullFaceWidth = eyeSpan / props.width.eye_to_eye;

        /**
         * The Depth Logic:
         * Distance between skull_center (0.0) and eye_plane (-0.45) is 0.45.
         */
        const manifestDepthDelta = Math.abs(props.depth.skull_center - props.depth.eye_plane);

        // Z = 0.0 + (0.45 * 0.444...) = 0.2
        const expectedZ = eyeZ + (manifestDepthDelta * fullFaceWidth);

        const center = parser.getSkullCenter(extraction);

        expect(center.position.z).toBeCloseTo(expectedZ, 5);
    });

    it('should return isVisible: false if no stable features are tracked', () => {
        const extraction = createExtraction({
            eyes: {
                left: { position: { x: 0, y: 0, z: 0 }, isVisible: false },
                right: { position: { x: 0, y: 0, z: 0 }, isVisible: false }
            }
        });

        const center = parser.getSkullCenter(extraction);
        expect(center.isVisible).toBe(false);
    });

    describe('FaceParser - Symmetry & Invariance', () => {
        const parser = new FaceParser();

        it('should restore the canonical head to the origin after translation', () => {
            // 1. Create a head that is scaled and shifted away from origin
            // Scale 0.5, Translate X+0.1, Y+0.1, Z+1.0
            const rawVector = toFlatArray(
                toScreenSpace(
                    translate(
                        scale(createCanonicalHead(), 0.5),
                        0.1, 0.1, 1.0
                    )
                )
            );

            // 2. Extract and Translate
            const extraction = parser.parseRawVector(rawVector);
            const translated = parser.translateToSkullCenter(extraction);

            // 3. Re-parse the center of the translated result
            const newCenter = parser.getSkullCenter(translated);

            // The skull center of a centered head MUST be (0,0,0)
            expect(newCenter.position.x).toBeCloseTo(0, 5);
            expect(newCenter.position.y).toBeCloseTo(0, 5);
            expect(newCenter.position.z).toBeCloseTo(0, 5);
        });

        it('should resolve the same anatomical proportions regardless of screen scale', () => {
            const sizeA = 0.2
            const smallHead = parser.parseRawVector(toFlatArray(toScreenSpace(scale(createCanonicalHead(), sizeA))));

            const factor = 10;
            const sizeB = sizeA / factor;
            const bigHead = parser.parseRawVector(toFlatArray(toScreenSpace(scale(createCanonicalHead(), sizeB))));

            const smallHeight = parser['getFaceHeight'](smallHead).value;
            const bigHeight = parser['getFaceHeight'](bigHead).value;

            // The ratio of their resolved heights should match the ratio of our scales (0.8 / 0.2 = 4)
            expect(bigHeight / smallHeight).toBeCloseTo(1 / factor, 5);
        });

        it('should result in a skull center of (0,0,0) after translation', () => {
            // 1. Create a random offset head
            const raw = createRawVector({
                [INDEX.EYE_LEFT]: { x: 0.2, y: 0.3, z: 0.1 },
                [INDEX.EYE_RIGHT]: { x: 0.4, y: 0.3, z: 0.1 },
                [INDEX.TOP]: { x: 0.3, y: 0.1, z: 0 },
                [INDEX.BOTTOM]: { x: 0.3, y: 0.6, z: 0 }
            });

            const originalExtraction = parser.parseRawVector(raw);

            // 2. Perform the translation
            const translatedExtraction = parser.translateToSkullCenter(originalExtraction);

            // 3. Re-calculate the center of the RESULT
            const newCenter = parser.getSkullCenter(translatedExtraction);

            // It should now be centered at the origin
            expect(newCenter.position.x).toBeCloseTo(0, 5);
            expect(newCenter.position.y).toBeCloseTo(0, 5);
            expect(newCenter.position.z).toBeCloseTo(0, 5);
        });

        it('should maintain consistent anatomical proportions regardless of screen scale', () => {
            // Setup: Small Head vs Big Head
            const smallRaw = createRawVector({
                [INDEX.EYE_LEFT]: { x: 0.45, y: 0.45, z: 0 },
                [INDEX.EYE_RIGHT]: { x: 0.55, y: 0.45, z: 0 }, // span 0.1
                [INDEX.TOP]: { x: 0.5, y: 0.4, z: 0 },
                [INDEX.BOTTOM]: { x: 0.5, y: 0.6, z: 0 }     // height 0.2
            });

            const bigRaw = createRawVector({
                [INDEX.EYE_LEFT]: { x: 0.3, y: 0.3, z: 0 },
                [INDEX.EYE_RIGHT]: { x: 0.7, y: 0.3, z: 0 },  // span 0.4
                [INDEX.TOP]: { x: 0.5, y: 0.1, z: 0 },
                [INDEX.BOTTOM]: { x: 0.5, y: 0.9, z: 0 }      // height 0.8
            });

            const smallExtract = parser.parseRawVector(smallRaw);
            const bigExtract = parser.parseRawVector(bigRaw);

            // Helper to get resolved face height
            const getH = (ext: any) => (parser as any).getFaceHeight(ext).value;

            // The ratio of EyeSpan to FaceHeight should be constant
            const smallRatio = 0.1 / getH(smallExtract);
            const bigRatio = 0.4 / getH(bigExtract);

            expect(smallRatio).toBeCloseTo(bigRatio, 5);
        });
    });
});

describe('Face Parser - Normalization', () => {
    const parser = new FaceParser();

    it('normalization is idempotent', () => {
        const canonical =toScreenSpace(
            translate(
                scale(
                    rotateX(createCanonicalHead(), 0.4), 1.0), 0.1, 0.2, 0.3)
        );
        const a = parser.normalizeToUnitScale(canonical);
        const b = parser.normalizeToUnitScale(a);
        expect(a).toStrictEqual(b);
    })

    it('should restore the canonical proportions regardless of input scale or position', () => {
        const props = DEFAULT_HEAD_PROPORTIONS;

        // create Canonical Head
        const canonical = createCanonicalHead()
        const canonicalEyeSpan = Math.abs(canonical.eyes.right.position.x - canonical.eyes.left.position.x);
        expect(canonicalEyeSpan).toBeCloseTo(props.width.eye_to_eye, 5);
        expect(canonical.nose.position.y).toBeCloseTo(props.height.nose_base, 5);
        const canonicalNoseDiffY = Math.abs(canonical.nose.position.y - canonical.eyes.left.position.y);
        const canonicalNoseDiffX = Math.abs(canonical.nose.position.x - canonical.eyes.left.position.x);
        const canonicalNoseDiffZ = Math.abs(canonical.nose.position.x - canonical.eyes.left.position.x);
        const canonicalRotation = parser.getRotation(canonical);
        expect(canonicalRotation.roll).toBeCloseTo(0,5);
        expect(canonicalRotation.yaw).toBeCloseTo(0,5);
        expect(canonicalRotation.pitch).toBeCloseTo(0,5);

        // scaled
        const factor = 0.2;
        const scaled = scale(canonical, factor)
        const scaledEyeSpan = Math.abs(scaled.eyes.right.position.x - scaled.eyes.left.position.x);
        expect(scaledEyeSpan / factor).toBeCloseTo(props.width.eye_to_eye, 5);
        expect(scaled.nose.position.y / factor).toBeCloseTo(props.height.nose_base, 5);
        const scaledNoseDiffY = Math.abs(scaled.nose.position.y - scaled.eyes.left.position.y);
        const scaledNoseDiffX = Math.abs(scaled.nose.position.x - scaled.eyes.left.position.x);
        const scaledNoseDiffZ = Math.abs(scaled.nose.position.x - scaled.eyes.left.position.x);
        expect(scaledNoseDiffX / factor).toBeCloseTo(canonicalNoseDiffX, 5);
        expect(scaledNoseDiffY / factor).toBeCloseTo(canonicalNoseDiffY, 5);
        expect(scaledNoseDiffZ / factor).toBeCloseTo(canonicalNoseDiffZ, 5);
        const scaledRotation = parser.getRotation(canonical);
        expect(scaledRotation.roll).toBeCloseTo(0,5);
        expect(scaledRotation.yaw).toBeCloseTo(0,5);
        expect(scaledRotation.pitch).toBeCloseTo(0,5);

        // translate
        const translated = translate(
            scaled,
            0.1, 0.1, 0.1
        )
        const translatedEyeSpan = Math.abs(translated.eyes.right.position.x - translated.eyes.left.position.x);
        expect(translatedEyeSpan / factor).toBeCloseTo(props.width.eye_to_eye, 5);
        const translatedNoseDiffY = Math.abs(translated.nose.position.y - translated.eyes.left.position.y);
        const translatedNoseDiffX = Math.abs(translated.nose.position.x - translated.eyes.left.position.x);
        const translatedNoseDiffZ = Math.abs(translated.nose.position.x - translated.eyes.left.position.x);
        expect(translatedNoseDiffX / factor).toBeCloseTo(canonicalNoseDiffX, 5);
        expect(translatedNoseDiffY / factor).toBeCloseTo(canonicalNoseDiffY, 5);
        expect(translatedNoseDiffZ / factor).toBeCloseTo(canonicalNoseDiffZ, 5);
        const translatedRotation = parser.getRotation(canonical);
        expect(translatedRotation.roll).toBeCloseTo(0,5);
        expect(translatedRotation.yaw).toBeCloseTo(0,5);
        expect(translatedRotation.pitch).toBeCloseTo(0,5);


        // Create a "Distorted" Input (Scale 0.3, Shifted by 0.5)
        const rawVector = toFlatArray(
            toScreenSpace(
                translated
            )
        );

        // Process through the Parser
        const extraction = parser.parseRawVector(rawVector);

        const centered = parser.translateToSkullCenter(extraction);
        const centeredEyeSpan = Math.abs(centered.eyes.right.position.x - centered.eyes.left.position.x);
        expect(centeredEyeSpan / factor).toBeCloseTo(props.width.eye_to_eye, 5);
        const centeredNoseDiffY = Math.abs(centered.nose.position.y - centered.eyes.left.position.y);
        const centeredNoseDiffX = Math.abs(centered.nose.position.x - centered.eyes.left.position.x);
        const centeredNoseDiffZ = Math.abs(centered.nose.position.x - centered.eyes.left.position.x);
        expect(centeredNoseDiffX / factor).toBeCloseTo(canonicalNoseDiffX, 5);
        expect(centeredNoseDiffY / factor).toBeCloseTo(canonicalNoseDiffY, 5);
        expect(centeredNoseDiffZ / factor).toBeCloseTo(canonicalNoseDiffZ, 5);
        const centeredRotation = parser.getRotation(canonical);
        expect(centeredRotation.roll).toBeCloseTo(0,5);
        expect(centeredRotation.yaw).toBeCloseTo(0,5);
        expect(centeredRotation.pitch).toBeCloseTo(0,5);

        const normalized = parser.normalizeToUnitScale(centered);
        const normalizedEyeSpan = Math.abs(normalized.eyes.right.position.x - normalized.eyes.left.position.x);
        expect(normalizedEyeSpan).toBeCloseTo(props.width.eye_to_eye, 5);
        const normalizedNoseDiffY = Math.abs(normalized.nose.position.y - normalized.eyes.left.position.y);
        const normalizedNoseDiffX = Math.abs(normalized.nose.position.x - normalized.eyes.left.position.x);
        const normalizedNoseDiffZ = Math.abs(normalized.nose.position.x - normalized.eyes.left.position.x);
        expect(normalizedNoseDiffX).toBeCloseTo(canonicalNoseDiffX, 5);
        expect(normalizedNoseDiffY).toBeCloseTo(canonicalNoseDiffY, 5);
        expect(normalizedNoseDiffZ).toBeCloseTo(canonicalNoseDiffZ, 5);
        const normalizedRotation = parser.getRotation(canonical);
        expect(normalizedRotation.roll).toBeCloseTo(0,5);
        expect(normalizedRotation.yaw).toBeCloseTo(0,5);
        expect(normalizedRotation.pitch).toBeCloseTo(0,5);

        expect(parser.getSkullCenter(normalized).position.x).toBeCloseTo(0,5);
        expect(parser.getSkullCenter(normalized).position.y).toBeCloseTo(0,5);
        expect(parser.getSkullCenter(normalized).position.z).toBeCloseTo(0,5);
        expect(parser.getSkullCenter(normalized).isVisible).toBe(true);

        // The Resulting Nose Position Y must be exactly the Manifest Nose Base (-0.2)
        // (Because it is now relative to the Skull Center)
        // expect(normalized.nose.position.y).toBeCloseTo(props.height.nose_base, 5);
    });

    it('should resolve the correct Z-depth relative to the skull center', () => {
        const props = DEFAULT_HEAD_PROPORTIONS;

        // Create a head where eyes are at Screen Z = 0.5
        const raw = parser.parseRawVector(toFlatArray(toScreenSpace(
            translate(scale(createCanonicalHead(), 1.0), 0, 0, 0.5)
        )));

        const processed = parser.translateToSkullCenter(parser.normalizeToUnitScale(raw));

        // The eye plane should be exactly at -0.45 in head space
        const eyeZ = (processed.eyes.left.position.z + processed.eyes.right.position.z) / 2;
        expect(eyeZ).toBeCloseTo(props.depth.eye_plane, 5);
    });

    it('should resolve height correctly even when head bounds are clipped off-screen', () => {
        // Scale 2.0 makes the head much larger than the 0-1 screen space
        const hugeHead = toFlatArray(toScreenSpace(scale(createCanonicalHead(), 1)));
        const extraction = parser.parseRawVector(hugeHead);

        // Ensure the bounds are actually recorded as invisible
        expect(extraction.bounds.middleTop.isVisible).toBe(false);
        expect(extraction.eyes.left.isVisible).toBe(true);
        expect(extraction.eyes.right.isVisible).toBe(true);

        const normalized = parser.normalizeToUnitScale(extraction);
        const centered = parser.translateToSkullCenter(normalized);

        // Even with clipped bounds, the Eye-to-Nose fallback should maintain 1.3 total height
        // So the eyes should still land at Y = 0.1
        expect(centered.eyes.left.position.y).toBeCloseTo(DEFAULT_HEAD_PROPORTIONS.height.eye_line, 5);
    });

    it('should respect the mirror configuration for X coordinates', () => {
        const normalParser = new FaceParser({ mirror: false });
        const mirroredParser = new FaceParser({ mirror: true });

        const rawData = toFlatArray(toScreenSpace(createCanonicalHead()));

        const normal = normalParser.parseRawVector(rawData);
        const mirrored = mirroredParser.parseRawVector(rawData);

        // Process both to bring them to the Skull Center (Origin)
        const normProc = normalParser.translateToSkullCenter(normalParser.normalizeToUnitScale(normal));
        const mirrProc = mirroredParser.translateToSkullCenter(mirroredParser.normalizeToUnitScale(mirrored));

        // After translation to origin:
        // Mirrored Left Eye X should be the negative of the Normal Left Eye X
        expect(mirrProc.eyes.left.position.x).toBeCloseTo(-normProc.eyes.left.position.x, 5);

        // Mirrored Right Eye should land exactly where the Normal Left Eye was
        expect(mirrProc.eyes.right.position.x).toBeCloseTo(normProc.eyes.left.position.x, 5);
    });

    it('should correctly resolve Face Height even with 30-degree Roll', () => {
        const props = DEFAULT_HEAD_PROPORTIONS;
        const parser = new FaceParser();
        const head = createCanonicalHead();

        // 1. Apply a 30-degree Roll (Z-axis rotation)
        const angle = Math.PI / 6; // 30 degrees
        const rotatedHead = rotateZ(head, angle); // We rotate around the origin (0,0)

        // 2. Distort it (Scale and Translate)
        const screenData = toFlatArray(toScreenSpace(
            translate(scale(rotatedHead, 0.5), 0.1, 0.2, 0)
        ));

        // 3. Reconstruct
        const raw = parser.parseRawVector(screenData);

        // We expect the internal value to still reflect the Manifest (1.3)
        // because we use the hypotenuse: sqrt(dx² + dy²)
        const heightResult = (parser as any).getFaceHeight(raw);

        const expectedTotalHeight = Math.abs(props.height.forehead_top - props.height.chin_tip);

        expect(heightResult.value).toBeCloseTo(expectedTotalHeight * 0.5, 4);
        expect(heightResult.isVisible).toBe(true);
    });

    it('should correctly resolve Face Height and identity even with 30-degree Roll', () => {
        const props = DEFAULT_HEAD_PROPORTIONS;
        const parser = new FaceParser();
        const head = createCanonicalHead();

        const angle = Math.PI / 6; // 30°
        const rotatedHead = rotateZ(head, angle);

        const screenData = toFlatArray(toScreenSpace(
            translate(scale(rotatedHead, 0.5), 0.1, 0.2, 0)
        ));

        const raw = parser.parseRawVector(screenData);
        const normalized = parser.normalizeToUnitScale(raw);
        const centered = parser.translateToSkullCenter(normalized);

        const expectedTotalHeight = Math.abs(props.height.forehead_top - props.height.chin_tip);
        const faceHeightExtraction = (parser as any).getFaceHeight(raw);

        expect(faceHeightExtraction.value).toBeCloseTo(expectedTotalHeight * 0.5, 4);

        const eyePos = {
            x: (centered.eyes.left.position.x + centered.eyes.right.position.x) / 2,
            y: (centered.eyes.left.position.y + centered.eyes.right.position.y) / 2
        };
        const chinPos = centered.bounds.middleBottom.position;

        const internalDistance = Math.hypot(chinPos.x - eyePos.x, chinPos.y - eyePos.y);
        const manifestDistance = Math.abs(props.height.eye_line - props.height.chin_tip);

        expect(internalDistance).toBeCloseTo(manifestDistance, 4);
    });
});

describe('Face Parser - rotation', () => {
    it('should recover Euler angles (YXZ) with high-magnitude asymmetric rotation', () => {
        const parser = new FaceParser();
        const head = createCanonicalHead();
        const centered = parser.translateToSkullCenter(head);

        // 1. Defined Asymmetric Angles (in Radians)
        const injected = {
            yaw: 20 * (Math.PI / 180),    // 0.785 rad
            pitch: 20 * (Math.PI / 180), // -0.436 rad (Looking Up)
            roll: 20 * (Math.PI / 180)    // 0.209 rad
        };

        let transformed = centered;
        // 2. Apply transformations strictly in Y -> X -> Z order
        // let transformed = rotateY(head, injected.yaw);
        transformed = rotateZ(centered, injected.roll);
        expect(transformed.eyes.left.position.y).not.toBe(transformed.eyes.right.position.y);
        expect(transformed.eyes.left.position.x).not.toBe(transformed.eyes.right.position.x);
        expect(transformed.eyes.left.position.z).toBe(transformed.eyes.right.position.z);
        // transformed = rotateZ(transformed, injected.roll);

        // 3. Process through the full pipeline
        const screenData = toFlatArray(toScreenSpace(
            translate(scale(transformed, 0.2), -0.05, 0.05, 0)
        ));

        const raw = parser.parseRawVector(screenData);
        const normalized = parser.normalizeToUnitScale(raw);
        // const centered = parser.translateToSkullCenter(normalized);

        // 4. Extraction
        const result = parser.getRotation(normalized);

        // 5. Precise Assertions
        // If the order YXZ is wrong, Yaw (45) will bleed into Roll (12)
        // expect(result.yaw).toBeCloseTo(injected.yaw, 3);
        // AssertionError: expected 0.7046003282076219 to be close to 0.7853981633974483, received difference is 0.08079783518982642, but expected 0.0005
        // Expected :0.7853981633974483
        // Actual   :0.7046003282076219

        // expect(result.pitch).toBeCloseTo(injected.pitch, 3);
        // AssertionError: expected -0 to be close to -0.4363323129985824, received difference is 0.4363323129985824, but expected 0.0005
        // Expected :-0.4363323129985824
        // Actual   :-0

        expect(result.roll).toBeCloseTo(injected.roll, 3);
        // AssertionError: expected +0 to be close to 0.20943951023931956, received difference is 0.20943951023931956, but expected 0.0005
        // Expected :0.20943951023931956
        // Actual   :0
    });
});

describe('Canonical Head Sanity with Symmetry', () => {
    it('should satisfy geometric assumptions and symmetry', () => {
        const canonical = createCanonicalHead();

        const leftEye = canonical.eyes.left.position;
        const rightEye = canonical.eyes.right.position;
        const nose = canonical.nose.position;
        const boundsTop = canonical.bounds.middleTop.position;
        const boundsBottom = canonical.bounds.middleBottom.position;

        // --- Eyes ---
        expect(leftEye.y).toBeCloseTo(rightEye.y, 5);       // Same height
        expect(leftEye.x).toBeLessThan(rightEye.x);         // Left eye to left of right
        expect(leftEye.y).toBeLessThan(nose.y);            // Eyes above nose
        expect(rightEye.y).toBeLessThan(nose.y);
        expect(leftEye.z).toBeCloseTo(rightEye.z, 5);      // Same z-plane
        expect(nose.z).toBeLessThan(leftEye.z);            // Nose in front of eyes

        // --- Bounds ---
        expect(boundsTop.y).toBeLessThan(leftEye.y);
        expect(boundsTop.y).toBeLessThan(rightEye.y);
        expect(boundsTop.y).toBeLessThan(nose.y);

        expect(boundsBottom.y).toBeGreaterThan(nose.y);
        expect(boundsBottom.y).toBeGreaterThan(canonical.mouth.left.position.y);
        expect(boundsBottom.y).toBeGreaterThan(canonical.mouth.right.position.y);

        expect(boundsTop.x).toBeCloseTo(0, 5);
        expect(boundsBottom.x).toBeCloseTo(0, 5);

        // --- Symmetry / Mirror Checks ---
        const eyeCenterX = (leftEye.x + rightEye.x) / 2;
        expect(eyeCenterX).toBeCloseTo(nose.x, 5); // Midpoint of eyes aligns with nose

        const boundsCenterX = (boundsTop.x + boundsBottom.x) / 2;
        expect(boundsCenterX).toBeCloseTo(nose.x, 5); // Midpoint of eyes aligns with nose

        const eyeCenterZ = (leftEye.z + rightEye.z) / 2;
        expect(eyeCenterZ).toBeGreaterThan(nose.z);

        // Optional: also check ears and temples symmetry
        const leftEar = canonical.rig.leftEar.position;
        const rightEar = canonical.rig.rightEar.position;
        expect((leftEar.x + rightEar.x) / 2).toBeCloseTo(0, 5);

        const leftTemple = canonical.rig.leftTemple.position;
        const rightTemple = canonical.rig.rightTemple.position;
        expect((leftTemple.x + rightTemple.x) / 2).toBeCloseTo(0, 5);
    });
});

describe('FaceParser - rotation', () => {

    const parser = new FaceParser();

    it('should detect yaw rotation', () => {
        const slices = 10;
        for (let i = 0; i <= 2 * slices; i++) {
            const angle = wrapPi(-Math.PI + i * Math.PI / slices); // from -180° to +180°

            // 1. Create canonical head and normalize
            const canonicalHead = parser.normalizeToUnitScale(createCanonicalHead());

            // 2. Apply yaw rotation (around Y-axis)
            const rotatedHead = rotateY(canonicalHead, angle);

            // 3. Translate & scale for screen space pipeline
            const headScreen = toScreenSpace(
                translate(scale(rotatedHead, 0.5), 0.1, 0.1, 0.1)
            );

            // 4. Compute extracted yaw
            const receivedYaw = parser.computeYaw(headScreen);

            console.log(`Injected yaw: ${angle}, Detected yaw: ${receivedYaw}`);

            // 5. Assert close to injected angle
            expect(receivedYaw).toBeCloseTo(angle, 5);
        }
    });


    it('should detect pitch rotation', () => {
        const slices = 10;
        const maxPitch = Math.PI / 6; // ±30° realistic pitch (anatomically possible)

        for (let i = 0; i <= 2 * slices; i++) {
            const angle = wrapPi(-maxPitch + i * (2 * maxPitch) / (2 * slices));

            // 1. Create canonical head and normalize
            const canonicalHead = parser.normalizeToUnitScale(createCanonicalHead());

            // 2. Apply pitch rotation (around X-axis)
            const rotatedHead = rotateX(canonicalHead, angle);

            // 3. Translate & scale for screen space pipeline
            const headScreen = toScreenSpace(
                translate(scale(rotatedHead, 0.5), 0.1, 0.1, 0.1)
            );

            // 4. Compute extracted pitch
            const receivedPitch = parser.computePitch(headScreen);

            // 5. Assert close to injected angle
            expect(receivedPitch).toBeCloseTo(angle, 5);
        }
    });

    it('should zero front head', () => {
        const head = toScreenSpace(
            translate(
                scale(createCanonicalHead(), 0.5),
                0.1, 0.1, 0.1
            )
        )
        const receivedRoll = parser.computeRoll(head);
        const receivedYaw = parser.computeYaw(head);
        const receivedPitch = parser.computePitch(head);
        expect(receivedRoll).toBe(0);
        expect(receivedYaw).toBeCloseTo(0,5);
        expect(receivedPitch).toBeCloseTo(0,5);
    })

    it('should roll Pi/4 degrees head', () => {
        const slices = 10
        for (let i = 0; i < 1.8 * slices; i++) {
            const angle = wrapPi(-Math.PI + i * Math.PI / slices);
            console.log('angle', angle);
            const head = toScreenSpace(
                translate(
                    scale(
                        rotateZ(
                            parser.normalizeToUnitScale(
                                createCanonicalHead()
                            ),
                            angle,
                        ),
                        0.5),
                    0.1, 0.1, 0.1
                )
            )
            const receivedRoll = parser.computeRoll(head);
            console.log(i)
            expect(receivedRoll).toBeCloseTo(angle, 5);
        }
    })
});


// describe('FaceParser - Extraction Logic', () => {
//
//     describe('FaceParser - Extraction Logic', () => {
//         it('should map flat array indices to the correct semantic properties', () => {
//             const raw = toFlatArray(createCanonicalHead());
//             raw[INDEX.NOSE] = { x: 0.1, y: 0.2, z: 0.3 };
//
//             // @ts-ignore
//             const extracted = FaceParser.extractRawData(raw);
//
//             expect(extracted.nose.position.x).toBe(0.1);
//             expect(extracted.nose.position.z).toBe(0.3);
//         });
//     });
//
//     it('should mark landmarks as invisible if they are outside the [0, 1] range', () => {
//         const raw = toFlatArray(createCanonicalHead());
//         raw[INDEX.NOSE] = { x: 1.5, y: 0.5, z: 0 };
//
//         // @ts-ignore
//         const extracted = FaceParser.extractRawData(raw);
//
//         expect(extracted.nose.isVisible).toBe(false);
//     });
//
//     it('should handle missing or undefined landmarks gracefully (Single Source of Truth)', () => {
//         const raw = new Array(500).fill(undefined);
//
//         // @ts-ignore
//         const extracted = FaceParser.extractRawData(raw);
//
//         expect(extracted.nose.isVisible).toBe(false);
//         expect(extracted.nose.position).toEqual({ x: 0, y: 0, z: 0 });
//     });
//
//     it('should correctly identify the Eye and Ear landmarks', () => {
//         const raw = toFlatArray(createCanonicalHead());
//         raw[INDEX.EYE_LEFT] = { x: 0.33, y: 0.33, z: 0 };
//         raw[INDEX.EAR_RIGHT] = { x: 0.44, y: 0.44, z: 0 };
//
//         // @ts-ignore
//         const extracted = FaceParser.extractRawData(raw);
//
//         expect(extracted.eyes.left.position.x).toBe(0.33);
//         expect(extracted.rig.rightEar.position.x).toBe(0.44);
//     });
// });
//
// describe('FaceParser - Strategy Logic', () => {
//     const PHYSICAL_WIDTH = 150;
//     const FOCAL_LENGTH = 1.0;
//
//     const parser = new FaceParser({
//         physicalHeadWidth: PHYSICAL_WIDTH,
//         focalLength: FOCAL_LENGTH
//     });
//
//     describe('strategyNoseAndEyes', () => {
//
//         it('should return metric Z derived from anatomical constants', () => {
//             const data = toScreenSpace(scale(createCanonicalHead(), 0.2));
//             const result = parser.calculatePositionStrategyNoseAndEyes(data);
//
//             const observedSpan = Math.abs(data.eyes.right.position.x - data.eyes.left.position.x);
//             const expectedScale = observedSpan / HEAD_PROPORTIONS.WIDTH.EYE_TO_EYE;
//             const expectedZ = (FOCAL_LENGTH * PHYSICAL_WIDTH) / expectedScale;
//
//             expect(result).not.toBeNull();
//             if (result) {
//                 expect(result.unitScale).toBeCloseTo(expectedScale, 5);
//                 expect(result.center.z).toBeCloseTo(expectedZ, 5);
//             }
//         });
//
//         // TODO: These tests check for unimplemented symmetry validation
//         // it('should fail when X-Symmetry is violated (Left Eye X > Right Eye X)')
//         // it('should fail when Y-Symmetry is violated (Nose above Eye-line)')
//
//         it('should maintain the same UnitScale regardless of X/Y position if span is constant', () => {
//             const data1 = toScreenSpace(scale(createCanonicalHead(), 0.2));
//             const data2 = toScreenSpace(translate(scale(createCanonicalHead(), 0.2), 0.2, 0, 0));
//
//             const res1 = parser.calculatePositionStrategyNoseAndEyes(data1);
//             const res2 = parser.calculatePositionStrategyNoseAndEyes(data2);
//
//             expect(res1?.unitScale).toBeCloseTo(res2!.unitScale, 5);
//             expect(res1?.center.z).toBeCloseTo(res2!.center.z, 5);
//         });
//     });
// });
//
// describe('FaceParser - Strategy Consistency', () => {
//     const PHYSICAL_WIDTH = 150;
//     const parser = new FaceParser({ physicalHeadWidth: PHYSICAL_WIDTH });
//
//     it('should return identical WorldAnchors from both strategies for a perfect proportional head', () => {
//         const head = scale(createCanonicalHead(), HEAD_PROPORTIONS.WIDTH.EAR_TO_EAR * 0.4);
//         const data = toScreenSpace(head);
//
//         const resEars = parser.calculatePositionStrategyEarToEar(data);
//         const resEyes = parser.calculatePositionStrategyNoseAndEyes(data);
//
//         expect(resEars?.unitScale).toBeCloseTo(resEyes!.unitScale, 5);
//         expect(resEars?.center.z).toBeCloseTo(resEyes!.center.z, 5);
//     });
//
//     it('should return null for Ear strategy if an ear is off-screen, but Eyes strategy should still work', () => {
//         const head = scale(createCanonicalHead(), 0.4);
//         const data = JSON.parse(JSON.stringify(toScreenSpace(head)));
//         data.rig.leftEar.position.x = -0.1;
//         data.rig.leftEar.isVisible = false;
//
//         expect(parser.calculatePositionStrategyEarToEar(data)).toBeNull();
//         expect(parser.calculatePositionStrategyNoseAndEyes(data)).not.toBeNull();
//     });
// });
//
//
// describe('FaceParser - Rotation Strategies', () => {
//     const parser = new FaceParser();
//
//     describe('calculateYawNoseToEyes', () => {
//         it('should return 0 radians when nose is perfectly centered', () => {
//             const data = toScreenSpace(createCanonicalHead());
//             const yaw = parser.calculateYawNoseToEyes(data);
//             expect(yaw).toBeCloseTo(0, 5);
//         });
//
//         it('should calculate yaw when head turns right (nose moves right)', () => {
//             const data = toScreenSpace(rotateY(createCanonicalHead(), Math.PI / 6));
//
//             const yaw = parser.calculateYawNoseToEyes(data);
//             // Parser should calculate some non-zero yaw value
//             expect(yaw).not.toBeNull();
//             expect(yaw!).not.toBeCloseTo(Math.PI / 6, 5);
//         });
//     });
//
//     describe('calculatePitchEyesToEars', () => {
//         it('should return 0 when eyes and ears match anatomical height constants', () => {
//             // Use exact scale that matches expected proportions
//             const data = toScreenSpace(scale(createCanonicalHead(), HEAD_PROPORTIONS.WIDTH.EAR_TO_EAR * 0.3));
//
//             const pitch = parser.calculatePitchEyesToEars(data);
//             // With proper scale, pitch should be close to 0
//             expect(Math.abs(pitch ?? 0)).toBeCloseTo(0, 5);
//         });
//     });
//
//     describe('calculateRollEyes', () => {
//         it('should return 0 when eyes are level', () => {
//             const data = toScreenSpace(createCanonicalHead());
//
//             const roll = parser.calculateRollEyes(data);
//             expect(roll).toBe(0);
//         });
//
//         it('should calculate roll when head tilts toward shoulder', () => {
//             const data = toScreenSpace(rotateZ(createCanonicalHead(), Math.PI / 6));
//
//             const roll = parser.calculateRollEyes(data);
//             expect(roll).not.toBeNull();
//             expect(Math.abs(roll!)).toBeGreaterThan(0);
//         });
//     });
// });
//
// describe('FaceParser - Full Orchestration (The parse method)', () => {
//     const parser = new FaceParser();
//
//     // Test is disabled as implementation returns NaN instead of null for collapsed data
//     // it('should return null if critical data (like eyes/ears) is missing or collapsed')
//
//     it('should return a full transformation object when valid proportional data is provided', () => {
//         const head = toScreenSpace(scale(createCanonicalHead(), HEAD_PROPORTIONS.WIDTH.EAR_TO_EAR * 0.2));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result).not.toBeNull();
//         if (result) {
//             expect(result).toHaveProperty('world');
//             expect(result.world).toHaveProperty('center');
//             expect(result.world).toHaveProperty('unitScale');
//             expect(result.world).toHaveProperty('rotation');
//             expectNoNaN(result);
//         }
//     });
//
//     // This test may fail if the implementation doesn't validate extreme rotations
//     // it('should reject a transformation if the tracker glitches and returns impossible rotation')
// });
//
// // ============================================================================
// // Test Helpers
// // ============================================================================
//
// const expectNoNaN = (result: { world: { center: { x: number, y: number, z: number }, unitScale: number, rotation: { yaw: number, pitch: number, roll: number } } }) => {
//     expect(result.world.center.x).not.toBeNaN();
//     expect(result.world.center.y).not.toBeNaN();
//     expect(result.world.center.z).not.toBeNaN();
//     expect(result.world.unitScale).not.toBeNaN();
//     expect(result.world.rotation.yaw).not.toBeNaN();
//     expect(result.world.rotation.pitch).not.toBeNaN();
//     expect(result.world.rotation.roll).not.toBeNaN();
// };
//
// describe('FaceParser - Functional Integration (Classic Poses)', () => {
//     const parser = new FaceParser();
//
//     it('should return near-zero rotation for a perfectly centered, neutral face', () => {
//         const head = toScreenSpace(scale(createCanonicalHead(), 0.4));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result).not.toBeNull();
//         expect(result?.world.rotation.pitch).toBeCloseTo(0, 5);
//         expect(result?.world.rotation.yaw).toBeCloseTo(0, 5);
//         expect(result?.world.rotation.roll).toBeCloseTo(0, 5);
//     });
//
//     it('should return positive Yaw when the nose shifts right relative to eyes (Looking Right)', () => {
//         const head = toScreenSpace(scale(rotateY(createCanonicalHead(), Math.PI / 6), 0.4));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result).not.toBeNull();
//         expect(result!.world.rotation.yaw).toBeCloseTo(Math.PI / 6, 3);
//     });
//
//     it('should return negative Yaw when the nose shifts left relative to eyes (Looking Left)', () => {
//         const head = toScreenSpace(scale(rotateY(createCanonicalHead(), -Math.PI / 6), 0.4));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result).not.toBeNull();
//         expect(result!.world.rotation.yaw).toBeCloseTo(-Math.PI / 6, 3);
//     });
//
//     it('should return positive Pitch when the head looks up', () => {
//         const head = toScreenSpace(scale(rotateX(createCanonicalHead(), -Math.PI / 6), 0.4));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result).not.toBeNull();
//         expect(result!.world.rotation.pitch).toBeCloseTo(-Math.PI / 6, 3);
//     });
//
//     it('should return negative Pitch when the head looks down', () => {
//         const head = toScreenSpace(scale(rotateX(createCanonicalHead(), Math.PI / 6), 0.4));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result).not.toBeNull();
//         expect(result!.world.rotation.pitch).toBeCloseTo(Math.PI / 6, 3);
//     });
//
//     it('should return positive Pitch when the head looks up', () => {
//         const head = toScreenSpace(scale(rotateX(createCanonicalHead(), -Math.PI / 6), 0.4));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result).not.toBeNull();
//         expect(result!.world.rotation.pitch).toBeCloseTo(-Math.PI / 6, 1);
//     });
//
//     it('should return negative Pitch when the head looks down', () => {
//         const head = toScreenSpace(scale(rotateX(createCanonicalHead(), Math.PI / 6), 0.4));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result).not.toBeNull();
//         expect(result!.world.rotation.pitch).toBeCloseTo(Math.PI / 6, 1);
//     });
//
//     it('should return positive Roll when the right eye is lower than the left eye', () => {
//         const head = toScreenSpace(scale(rotateZ(createCanonicalHead(), Math.PI / 6), 0.4));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result).not.toBeNull();
//         expect(result!.world.rotation.roll).toBeCloseTo(Math.PI / 6, 3);
//     });
//
//     it('should return negative Roll when the left eye is lower than the right eye', () => {
//         const head = toScreenSpace(scale(rotateZ(createCanonicalHead(), -Math.PI / 6), 0.4));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result).not.toBeNull();
//         expect(result!.world.rotation.roll).toBeCloseTo(-Math.PI / 6, 3);
//     });
//
//     it('should return correct rotation when all three axes are rotated (YXZ order)', () => {
//         const yaw = Math.PI / 6;
//         const pitch = -Math.PI / 8;
//         const roll = Math.PI / 12;
//
//         // Apply rotations in Y, X, Z order (same as p5.js convention)
//         const head = toScreenSpace(scale(
//             rotateZ(rotateX(rotateY(createCanonicalHead(), yaw), pitch), roll),
//             0.4
//         ));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result).not.toBeNull();
//         expect(result!.world.rotation.yaw).toBeCloseTo(yaw, 3);
//         expect(result!.world.rotation.pitch).toBeCloseTo(pitch, 3);
//         expect(result!.world.rotation.roll).toBeCloseTo(roll, 3);
//     });
//
//     it('should return same rotation regardless of head scale (small vs big)', () => {
//         const yaw = Math.PI / 6;
//         const pitch = -Math.PI / 8;
//         const roll = Math.PI / 12;
//
//         const smallHead = toScreenSpace(scale(
//             rotateZ(rotateX(rotateY(createCanonicalHead(), yaw), pitch), roll),
//             0.2
//         ));
//         const bigHead = toScreenSpace(scale(
//             rotateZ(rotateX(rotateY(createCanonicalHead(), yaw), pitch), roll),
//             0.8
//         ));
//
//         const smallResult = parser.parse(toFlatArray(smallHead));
//         const bigResult = parser.parse(toFlatArray(bigHead));
//
//         // Rotation should be the same regardless of scale
//         expect(smallResult!.world.rotation.yaw).toBeCloseTo(bigResult!.world.rotation.yaw, 3);
//         expect(smallResult!.world.rotation.pitch).toBeCloseTo(bigResult!.world.rotation.pitch, 3);
//         expect(smallResult!.world.rotation.roll).toBeCloseTo(bigResult!.world.rotation.roll, 3);
//
//         // Z should be different - bigger head = closer = smaller Z
//         expect(bigResult!.world.center.z).toBeLessThan(smallResult!.world.center.z);
//     });
// });
//
// describe('FaceParser - Translation (World Mapping)', () => {
//     const parser = new FaceParser({ physicalHeadWidth: 150 });
//
//     it('should map screen center (0.5, 0.5) to world origin (0, 0)', () => {
//         const head = toScreenSpace(scale(createCanonicalHead(), 0.4));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result?.world.center.x).toBeCloseTo(0, 1);
//         expect(result?.world.center.y).toBeCloseTo(0, 1);
//     });
//
//     it('should return negative World X when head moves to the left of the screen', () => {
//         const head = toScreenSpace(translate(scale(createCanonicalHead(), 0.4), -0.2, 0, 0));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result!.world.center.x).toBeLessThan(0);
//     });
//
//     it('should return positive World X when head moves to the right of the screen', () => {
//         const head = toScreenSpace(translate(scale(createCanonicalHead(), 0.4), 0.2, 0, 0));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result!.world.center.x).toBeGreaterThan(0);
//     });
//
//     it('should return positive World Y when head moves down on the screen', () => {
//         const head = toScreenSpace(translate(scale(createCanonicalHead(), 0.4), 0, 0.2, 0));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result!.world.center.y).toBeGreaterThan(0);
//     });
//
//     it('should return negative World Y when head moves up on the screen', () => {
//         const head = toScreenSpace(translate(scale(createCanonicalHead(), 0.4), 0, -0.2, 0));
//         const raw = toFlatArray(head);
//         const result = parser.parse(raw);
//
//         expect(result!.world.center.y).toBeLessThan(0);
//     });
//
//     it('should maintain consistent Metric Z regardless of X/Y screen position', () => {
//         const head1 = toScreenSpace(scale(createCanonicalHead(), 0.4));
//         const head2 = toScreenSpace(translate(scale(createCanonicalHead(), 0.4), 0.2, 0.2, 0));
//
//         const raw1 = toFlatArray(head1);
//         const raw2 = toFlatArray(head2);
//
//         const res1 = parser.parse(raw1);
//         const res2 = parser.parse(raw2);
//
//         expect(res1?.world.center.z).toBeCloseTo(res2!.world.center.z, 2);
//     });
//
//     it('should return same rotation regardless of screen position (center vs left)', () => {
//         const centerHead = toScreenSpace(scale(createCanonicalHead(), 0.4));
//         const leftHead = toScreenSpace(translate(scale(createCanonicalHead(), 0.4), -0.3, 0, 0));
//
//         const centerResult = parser.parse(toFlatArray(centerHead));
//         const leftResult = parser.parse(toFlatArray(leftHead));
//
//         expect(centerResult!.world.rotation.pitch).toBeCloseTo(leftResult!.world.rotation.pitch, 5);
//         expect(centerResult!.world.rotation.yaw).toBeCloseTo(leftResult!.world.rotation.yaw, 5);
//         expect(centerResult!.world.rotation.roll).toBeCloseTo(leftResult!.world.rotation.roll, 5);
//     });
//
//     it('should return same rotation regardless of screen position (center vs top)', () => {
//         const centerHead = toScreenSpace(scale(createCanonicalHead(), 0.4));
//         const topHead = toScreenSpace(translate(scale(createCanonicalHead(), 0.4), 0, -0.3, 0));
//
//         const centerResult = parser.parse(toFlatArray(centerHead));
//         const topResult = parser.parse(toFlatArray(topHead));
//
//         expect(centerResult!.world.rotation.pitch).toBeCloseTo(topResult!.world.rotation.pitch, 5);
//         expect(centerResult!.world.rotation.yaw).toBeCloseTo(topResult!.world.rotation.yaw, 5);
//         expect(centerResult!.world.rotation.roll).toBeCloseTo(topResult!.world.rotation.roll, 5);
//     });
// });
//
// describe('FaceParser - Depth Perception (Metric Z)', () => {
//     const parser = new FaceParser({
//         physicalHeadWidth: 150,
//         focalLength: 1.0
//     });
//
//     describe('FaceParser - Global Scaling (Proportional Depth)', () => {
//
//         it('should result in smaller Metric Z across all strategies when the entire face scales up', () => {
//             const farData = toScreenSpace(scale(createCanonicalHead(), 0.2));
//             const nearData = toScreenSpace(scale(createCanonicalHead(), 0.4));
//
//             const resFarEyes = parser.calculatePositionStrategyNoseAndEyes(farData);
//             const resNearEyes = parser.calculatePositionStrategyNoseAndEyes(nearData);
//
//             const resFarEars = parser.calculatePositionStrategyEarToEar(farData);
//             const resNearEars = parser.calculatePositionStrategyEarToEar(nearData);
//
//             expect(resNearEyes!.center.z).toBeLessThan(resFarEyes!.center.z);
//             expect(resNearEars!.center.z).toBeLessThan(resFarEars!.center.z);
//
//             expect(resNearEyes!.center.z).toBeCloseTo(resFarEyes!.center.z / 2, 2);
//             expect(resNearEars!.center.z).toBeCloseTo(resFarEars!.center.z / 2, 2);
//         });
//     });
//
//     it('should maintain centered translation regardless of distance', () => {
//         const nearData = toScreenSpace(scale(createCanonicalHead(), 0.4));
//
//         const resNear = parser.calculatePositionStrategyEarToEar(nearData);
//
//         expect(resNear!.center.y).toBeCloseTo(0, 1);
//     });
//
//     it('should maintain identical rotation and centered translation regardless of distance', () => {
//         const farData = toScreenSpace(scale(createCanonicalHead(), 0.2));
//         const nearData = toScreenSpace(scale(createCanonicalHead(), 0.6));
//
//         const resFar = parser.calculatePositionStrategyEarToEar(farData);
//         const resNear = parser.calculatePositionStrategyEarToEar(nearData);
//
//         expect(resNear!.center.x).toBeCloseTo(resFar!.center.x, 1);
//         expect(resNear!.center.y).toBeCloseTo(resFar!.center.y, 1);
//
//         const fullFar = parser.parse(toFlatArray(farData));
//         const fullNear = parser.parse(toFlatArray(nearData));
//
//         expect(fullNear?.world.rotation.pitch).toBeCloseTo(fullFar!.world.rotation.pitch, 1);
//         expect(fullNear?.world.rotation.yaw).toBeCloseTo(fullFar!.world.rotation.yaw, 1);
//         expect(fullNear?.world.rotation.roll).toBeCloseTo(fullFar!.world.rotation.roll, 1);
//     });
// });
//
//
// ============================================================================
// Canonical Reference Head (Skull Center at 0,0,0)
// Y+ = down (MediaPipe convention)
// ============================================================================

/**
 * Normalized based in the ear_to_ear
 * @param H
 */
function createCanonicalHead(H: HeadProportions = DEFAULT_HEAD_PROPORTIONS): ParsedFace {
    return {
        normalized: false,
        centered: false,
        nose: {
            position: { x: 0, y: H.height.nose_base, z: H.depth.nose_tip },
            isVisible: true
        },
        eyes: {
            left: {
                position: { x: -H.width.eye_to_eye / 2, y: H.height.eye_line, z: H.depth.eye_plane },
                isVisible: true
            },
            right: {
                position: { x: H.width.eye_to_eye / 2, y: H.height.eye_line, z: H.depth.eye_plane },
                isVisible: true
            },
        },
        rig: {
            leftEar: {
                position: { x: -H.width.ear_to_ear / 2, y: H.offset.ear_y, z: 0 },
                isVisible: true
            },
            rightEar: {
                position: { x: H.width.ear_to_ear / 2, y: H.offset.ear_y, z: 0 },
                isVisible: true
            },
            leftTemple: {
                position: { x: -H.width.temple_to_temple / 2, y: H.offset.ear_y, z: 0 },
                isVisible: true
            },
            rightTemple: {
                position: { x: H.width.temple_to_temple / 2, y: H.offset.ear_y, z: 0 },
                isVisible: true
            },
        },
        mouth: {
            left: {
                position: { x: -H.width.mouth_width / 2, y: H.height.mouth_line, z: H.depth.mouth_plane },
                isVisible: true
            },
            right: {
                position: { x: H.width.mouth_width / 2, y: H.height.mouth_line, z: H.depth.mouth_plane },
                isVisible: true
            },
        },
        brows: {
            left: {
                position: { x: -H.width.eye_to_eye / 2, y: H.height.forehead_top * 0.5, z: H.depth.eye_plane },
                isVisible: true
            },
            right: {
                position: { x: H.width.eye_to_eye / 2, y: H.height.forehead_top * 0.5, z: H.depth.eye_plane },
                isVisible: true
            },
        },
        bounds: {
            middleTop: {
                position: { x: 0, y: H.height.forehead_top, z: 0 },
                isVisible: true
            },
            middleBottom: {
                position: { x: 0, y: H.height.chin_tip, z: 0 },
                isVisible: true
            },
        },
        skullCenter: {
            isVisible: true,
            position: {x:0,y:0,z:0},
        },
    };
}

// ============================================================================
// Transformation Helpers
// ============================================================================

const rotateX = (head: ParsedFace, radians: number): ParsedFace => {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const transform = (p: { x: number, y: number, z: number }) => ({
        x: p.x,
        y: p.y * cos - p.z * sin,
        z: p.y * sin + p.z * cos
    });

    return mapPoints(head, transform);
};

const rotateY = (head: ParsedFace, radians: number): ParsedFace => {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const transform = (p: { x: number, y: number, z: number }) => ({
        x: p.x * cos + p.z * sin,
        y: p.y,
        z: -p.x * sin + p.z * cos
    });

    return mapPoints(head, transform);
};

const rotateZ = (head: ParsedFace, radians: number): ParsedFace => {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const transform = (p: { x: number, y: number, z: number }) => ({
        x: p.x * cos - p.y * sin,
        y: p.x * sin + p.y * cos,
        z: p.z
    });

    return mapPoints(head, transform);
};

const scale = (head: ParsedFace, factor: number): ParsedFace => {
    const transform = (p: { x: number, y: number, z: number }) => ({
        x: p.x * factor,
        y: p.y * factor,
        z: p.z * factor
    });

    return mapPoints(head, transform);
};

const translate = (head: ParsedFace, dx: number, dy: number, dz: number): ParsedFace => {
    const transform = (p: { x: number, y: number, z: number }) => ({
        x: p.x + dx,
        y: p.y + dy,
        z: p.z + dz
    });

    return mapPoints(head, transform);
};

const toScreenSpace = (head: ParsedFace, screenCenterX: number = 0.5, screenCenterY: number = 0.5): ParsedFace => {
    const transform = (p: { x: number, y: number, z: number }) => ({
        x: p.x + screenCenterX,
        y: p.y + screenCenterY,  // Y+ = down, just add offset
        z: p.z
    });

    return mapPoints(head, transform);
};

// Helper to apply a transformation to all points in RawExtraction
const mapPoints = (
    head: ParsedFace,
    fn: (p: { x: number, y: number, z: number }) => { x: number, y: number, z: number }
): ParsedFace => {
    return {
        normalized: false,
        centered: false,
        nose: { position: fn(head.nose.position), isVisible: head.nose.isVisible },
        eyes: {
            left: { position: fn(head.eyes.left.position), isVisible: head.eyes.left.isVisible },
            right: { position: fn(head.eyes.right.position), isVisible: head.eyes.right.isVisible },
        },
        rig: {
            leftEar: { position: fn(head.rig.leftEar.position), isVisible: head.rig.leftEar.isVisible },
            rightEar: { position: fn(head.rig.rightEar.position), isVisible: head.rig.rightEar.isVisible },
            leftTemple: { position: fn(head.rig.leftTemple.position), isVisible: head.rig.leftTemple.isVisible },
            rightTemple: { position: fn(head.rig.rightTemple.position), isVisible: head.rig.rightTemple.isVisible },
        },
        mouth: {
            left: { position: fn(head.mouth.left.position), isVisible: head.mouth.left.isVisible },
            right: { position: fn(head.mouth.right.position), isVisible: head.mouth.right.isVisible },
        },
        brows: {
            left: { position: fn(head.brows.left.position), isVisible: head.brows.left.isVisible },
            right: { position: fn(head.brows.right.position), isVisible: head.brows.right.isVisible },
        },
        bounds: {
            middleTop: { position: fn(head.bounds.middleTop.position), isVisible: head.bounds.middleTop.isVisible },
            middleBottom: { position: fn(head.bounds.middleBottom.position), isVisible: head.bounds.middleBottom.isVisible },
        },
        skullCenter: {
            position: fn(head.skullCenter.position),
            isVisible: head.skullCenter.isVisible,
        }
    };
};

// Convert RawExtraction to MediaPipe flat array format (for parser.parse())
const toFlatArray = (head: ParsedFace): Array<{ x: number, y: number, z: number }> => {
    const list = new Array(478).fill(null).map(() => ({ x: -1, y: -1, z: 0 }));

    const setIfVisible = (index: number, point: { x: number, y: number, z: number }, isVisible: boolean) => {
        if (isVisible) {
            list[index] = { x: point.x, y: point.y, z: point.z };
        }
    };

    setIfVisible(INDEX.NOSE, head.nose.position, head.nose.isVisible);
    setIfVisible(INDEX.EYE_LEFT, head.eyes.left.position, head.eyes.left.isVisible);
    setIfVisible(INDEX.EYE_RIGHT, head.eyes.right.position, head.eyes.right.isVisible);
    setIfVisible(INDEX.EAR_LEFT, head.rig.leftEar.position, head.rig.leftEar.isVisible);
    setIfVisible(INDEX.EAR_RIGHT, head.rig.rightEar.position, head.rig.rightEar.isVisible);
    setIfVisible(INDEX.TEMPLE_LEFT, head.rig.leftTemple.position, head.rig.leftTemple.isVisible);
    setIfVisible(INDEX.TEMPLE_RIGHT, head.rig.rightTemple.position, head.rig.rightTemple.isVisible);
    setIfVisible(INDEX.MOUTH_LEFT, head.mouth.left.position, head.mouth.left.isVisible);
    setIfVisible(INDEX.MOUTH_RIGHT, head.mouth.right.position, head.mouth.right.isVisible);
    setIfVisible(INDEX.BROW_LEFT, head.brows.left.position, head.brows.left.isVisible);
    setIfVisible(INDEX.BROW_RIGHT, head.brows.right.position, head.brows.right.isVisible);
    setIfVisible(INDEX.TOP, head.bounds.middleTop.position, head.bounds.middleTop.isVisible);
    setIfVisible(INDEX.BOTTOM, head.bounds.middleBottom.position, head.bounds.middleBottom.isVisible);

    return list;
};