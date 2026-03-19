import { describe, it, expect } from 'vitest';
import { FaceParser, INDEX } from "./face_parser";
import type { Vector3 } from "../../types.ts";

const createRawLandmarks = (overrides: Record<number, { x?: number; y?: number; z?: number; visibility?: number }> = {}): Array<Partial<Vector3> & { visibility?: number }> => {
    const landmarks: Array<Partial<Vector3> & { visibility?: number }> = new Array(468);
    for (let i = 0; i < 468; i++) {
        landmarks[i] = overrides[i];
    }
    return landmarks;
};

describe('FaceParser - constructor', () => {
    it('should create parser with default config', () => {
        const parser = new FaceParser();
        
        expect(parser).toBeDefined();
    });

    it('should accept custom config', () => {
        const parser = new FaceParser({
            physicalHeadWidth: 200,
            focalLength: 1.5,
            mirror: true,
        });
        
        expect(parser).toBeDefined();
    });
});

describe('FaceParser - parse', () => {
    it('should extract nose landmark', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: 0.5, y: 0.5, z: 0.1 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.nose.position.x).toBe(0.5);
        expect(result.data.nose.position.y).toBe(0.5);
        expect(result.data.nose.position.z).toBe(0.1);
    });

    it('should extract left and right eye landmarks', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.EYE_LEFT]: { x: 0.4, y: 0.45, z: 0.05 },
            [INDEX.EYE_RIGHT]: { x: 0.6, y: 0.45, z: 0.05 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.eyes.left.position.x).toBe(0.4);
        expect(result.data.eyes.right.position.x).toBe(0.6);
    });

    it('should extract brow landmarks', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.BROW_LEFT]: { x: 0.4, y: 0.35, z: 0.02 },
            [INDEX.BROW_RIGHT]: { x: 0.6, y: 0.35, z: 0.02 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.brows.left.position.x).toBe(0.4);
        expect(result.data.brows.right.position.x).toBe(0.6);
    });

    it('should extract mouth landmarks', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.MOUTH_LEFT]: { x: 0.45, y: 0.6, z: 0.03 },
            [INDEX.MOUTH_RIGHT]: { x: 0.55, y: 0.6, z: 0.03 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.mouth.left.position.x).toBe(0.45);
        expect(result.data.mouth.right.position.x).toBe(0.55);
    });

    it('should extract ear landmarks', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.EAR_LEFT]: { x: 0.1, y: 0.5, z: -0.02 },
            [INDEX.EAR_RIGHT]: { x: 0.9, y: 0.5, z: -0.02 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.rig.leftEar.position.x).toBe(0.1);
        expect(result.data.rig.rightEar.position.x).toBe(0.9);
    });

    it('should extract temple landmarks', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.TEMPLE_LEFT]: { x: 0.15, y: 0.5, z: 0 },
            [INDEX.TEMPLE_RIGHT]: { x: 0.85, y: 0.5, z: 0 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.rig.leftTemple.position.x).toBe(0.15);
        expect(result.data.rig.rightTemple.position.x).toBe(0.85);
    });

    it('should extract top and bottom bounds', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.TOP]: { x: 0.5, y: 0.2, z: 0.02 },
            [INDEX.BOTTOM]: { x: 0.5, y: 0.8, z: 0.02 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.bounds.middleTop.position.y).toBe(0.2);
        expect(result.data.bounds.middleBottom.position.y).toBe(0.8);
    });

    it('should return unusable landmark for missing index', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({});
        
        const result = parser.parse(rawData);
        
        expect(result.data.nose.isUsable).toBe(false);
        expect(result.data.nose.position.x).toBe(-1);
    });

    it('should handle partial landmark data', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: 0.5 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.nose.position.x).toBe(0.5);
        expect(result.data.nose.position.y).toBe(0);
        expect(result.data.nose.position.z).toBe(0);
    });

    it('should treat NaN coordinates as missing/unusable', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: Number.NaN, y: 0.5, z: 0.1 },
        });

        const result = parser.parse(rawData);

        expect(result.data.nose.isUsable).toBe(false);
        expect(result.data.nose.position).toEqual({ x: -1, y: -1, z: -1 });
    });

    it('should treat Infinity coordinates as missing/unusable', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: 0.5, y: Number.POSITIVE_INFINITY, z: 0.1 },
        });

        const result = parser.parse(rawData);

        expect(result.data.nose.isUsable).toBe(false);
        expect(result.data.nose.position).toEqual({ x: -1, y: -1, z: -1 });
    });
});

describe('FaceParser - mirror', () => {
    it('should flip x coordinate when mirror is true', () => {
        const parser = new FaceParser({ mirror: true });
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: 0.3, y: 0.5, z: 0.1 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.nose.position.x).toBe(0.7); // 1.0 - 0.3
    });

    it('should not flip x coordinate when mirror is false', () => {
        const parser = new FaceParser({ mirror: false });
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: 0.3, y: 0.5, z: 0.1 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.nose.position.x).toBe(0.3);
    });

    it('should use default mirror as false', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: 0.3, y: 0.5, z: 0.1 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.nose.position.x).toBe(0.3);
    });
});

describe('FaceParser - landmark quality', () => {
    it('marks landmark usable when x/y are present and finite', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: 0.5, y: 0.5, z: 0.1 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.nose.isUsable).toBe(true);
    });

    it('does not reject negative/out-of-frame coordinates as long as they are finite', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: -0.1, y: 1.1, z: 0.1 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.nose.isUsable).toBe(true);
    });

    it('marks landmark unusable when x is undefined', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { y: 0.5, z: 0.1 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.nose.isUsable).toBe(false);
    });

    it('marks landmark unusable when y is undefined', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: 0.5, z: 0.1 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.nose.isUsable).toBe(false);
    });

    it('exposes MediaPipe visibility score when provided', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: 0.5, y: 0.5, z: 0.1, visibility: 0.25 },
        });

        const result = parser.parse(rawData);

        expect(result.data.nose.visibility).toBe(0.25);
    });
});

describe('FaceParser - buildFace', () => {
    it('should create a Face instance from raw landmarks', () => {
        const parser = new FaceParser();
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: 0.5, y: 0.5, z: 0.1 },
            [INDEX.EYE_LEFT]: { x: 0.4, y: 0.45, z: 0.05 },
            [INDEX.EYE_RIGHT]: { x: 0.6, y: 0.45, z: 0.05 },
        });
        
        const face = parser.parse(rawData);
        
        expect(face.data.nose.position.x).toBe(0.5);
    });
});

describe('FaceParser - static parse', () => {
    const parser = new FaceParser();
    it('should parse raw vector without instantiating class', () => {
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: 0.5, y: 0.5, z: 0.1 },
        });
        
        const result = parser.parse(rawData);
        
        expect(result.data.nose.position.x).toBe(0.5);
    });

    it('should accept mirror parameter', () => {
        const rawData = createRawLandmarks({
            [INDEX.NOSE]: { x: 0.3, y: 0.5, z: 0.1 },
        });

        const mirrorParser = new FaceParser({mirror: true})

        const result = mirrorParser.parse(rawData);
        
        expect(result.data.nose.position.x).toBe(0.7); // 1.0 - 0.3
    });
});
