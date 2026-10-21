import { beforeAll, describe, expect, it } from "vitest";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { FaceExpressions, calibratedRanges, measureFace, type Emotion } from "./face_expressions.ts";
import { FaceParser } from "./face_parser.ts";
import type { Vector3, VideoWidthRatio } from "../../types.ts";
import manifest from "./fixtures/faces/manifest.json";

/**
 * Runs the real face landmarker (headless Chromium, not happy-dom) on AI-generated faces with
 * known conditions - fixtures/faces/manifest.json - and checks what the engine reads from them:
 * expressions (normalized), face size and position, and head rotation.
 *
 * The images are a "source of truth" by construction, but a lying one: the generator does not
 * always draw what it was asked for. Each fixture's expectations follow what the image really
 * shows (checked by eye), not the prompt; the manifest records where they differ.
 */

type Band = [number, number];

interface FaceFixture {
    file: string;
    expect: {
        emotion?: Emotion | 'neutral';
        happy?: Band;
        sad?: Band;
        angry?: Band;
        surprised?: Band;
        sleepy?: Band;
        faceWidth?: Band;
        centerX?: Band;
        yaw?: Band;
        absYaw?: Band;
        pitch?: Band;
        roll?: Band;
    };
    knownIssues?: Record<string, string>;
}

interface Reading {
    raw: FaceExpressions;
    expressions: FaceExpressions;
    faceWidth: number;
    centerX: number;
    yaw: number;
    pitch: number;
    roll: number;
}

const fixtures = manifest.fixtures as unknown as FaceFixture[];
const degrees = (radians: number) => radians * 180 / Math.PI;

let landmarker: FaceLandmarker;

beforeAll(async () => {
    const base = import.meta.env.BASE_URL;
    const vision = await FilesetResolver.forVisionTasks(`${base}wasm`);
    landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: `${base}models/face_landmarker.task` },
        runningMode: 'IMAGE',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
    });
}, 60_000);

async function read(file: string): Promise<Reading | null> {
    const image = new Image();
    image.src = new URL(`./fixtures/faces/${file}`, import.meta.url).href;
    await image.decode();

    const result = landmarker.detect(image);
    const landmarks = result.faceLandmarks?.[0];
    const categories = result.faceBlendshapes?.[0]?.categories;
    if (!landmarks || !categories) return null;

    const face = new FaceParser({
        videoWidthPixels: image.naturalWidth,
        videoHeightPixels: image.naturalHeight,
    } as any).parse(landmarks as unknown as Array<Partial<Vector3<VideoWidthRatio>>>);
    const xs = landmarks.map(landmark => landmark.x);
    const poseMatrix = result.facialTransformationMatrixes?.[0]?.data;
    const raw = FaceExpressions.fromBlendshapes(categories, measureFace(landmarks, image.naturalHeight / image.naturalWidth, poseMatrix));
    return {
        raw,
        expressions: raw.normalize(),
        faceWidth: face.width,
        centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
        yaw: degrees(face.yaw),
        pitch: degrees(face.pitch),
        roll: degrees(face.roll),
    };
}

const BAND_READERS: Record<string, (reading: Reading) => number> = {
    happy: reading => reading.expressions.happy,
    sad: reading => reading.expressions.sad,
    angry: reading => reading.expressions.angry,
    surprised: reading => reading.expressions.surprised,
    sleepy: reading => reading.expressions.sleepy,
    faceWidth: reading => reading.faceWidth,
    centerX: reading => reading.centerX,
    yaw: reading => reading.yaw,
    absYaw: reading => Math.abs(reading.yaw),
    pitch: reading => reading.pitch,
    roll: reading => reading.roll,
};

describe.each(fixtures)('face fixture $file', (fixture) => {
    let reading: Reading | null;

    beforeAll(async () => {
        reading = await read(fixture.file);
    });

    it('finds the face', () => {
        expect(reading).not.toBeNull();
    });

    if (fixture.expect.emotion) {
        const knownIssue = fixture.knownIssues?.emotion;
        const test = knownIssue ? it.fails : it;
        test(`reads the emotion as ${fixture.expect.emotion}${knownIssue ? ` (known issue: ${knownIssue})` : ''}`, () => {
            expect(reading?.expressions.emotion).toBe(fixture.expect.emotion);
        });
    }

    for (const [name, band] of Object.entries(fixture.expect)) {
        if (name === 'emotion') continue;
        const [min, max] = band as Band;
        const knownIssue = fixture.knownIssues?.[name];
        // A known issue is expected to fail; once it is fixed, this fails and the manifest
        // entry should go.
        const test = knownIssue ? it.fails : it;
        test(`reads ${name} in [${min}, ${max}]${knownIssue ? ` (known issue: ${knownIssue})` : ''}`, () => {
            const value = BAND_READERS[name](reading!);
            expect(value).toBeGreaterThanOrEqual(min);
            expect(value).toBeLessThanOrEqual(max);
        });
    }
});

// Each grid shows nine expressions of one person: calibrated on that person's own neutral cell,
// the expressions should read the same as with the default ranges (which fit everyone).
describe.each(['grid-man', 'grid-woman', 'grid-young-woman', 'grid-grey-hair-man'])('%s calibrated on its own neutral face', (person) => {
    const cells = fixtures.filter(fixture => fixture.file.startsWith(`${person}-`) && fixture.expect.emotion);
    let ranges: ReturnType<typeof calibratedRanges>;

    beforeAll(async () => {
        const neutral = await read(`${person}-neutral.jpg`);
        ranges = calibratedRanges(neutral!.raw);
    });

    it.each(cells)('reads $file as $expect.emotion', async (fixture) => {
        const reading = await read(fixture.file);
        expect(reading!.raw.withRanges(ranges).normalize().emotion).toBe(fixture.expect.emotion);
    });
});
