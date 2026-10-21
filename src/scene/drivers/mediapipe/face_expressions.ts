/**
 * One MediaPipe face blendshape category, as FaceLandmarker returns it with
 * outputFaceBlendshapes on (result.faceBlendshapes[0].categories).
 */
export interface BlendshapeCategory {
    readonly categoryName: string;
    readonly score: number;
}

/**
 * Distances measured on the face landmarks, relative to the face width, for what the
 * blendshapes miss (fixtures/faces): MediaPipe reads an angry mouth as a smile and barely reports
 * wide eyes, but the brows and eyelids show both clearly.
 */
export interface FaceMeasures {
    /**
     * Inner end of each brow to the inner corner of its eye, over the outer end to the outer
     * corner: below 1 when the inner ends are drawn down (the angry V), above when they are raised.
     * A ratio on the same face, so it does not depend on how high someone's brows sit.
     */
    readonly browInnerToOuter: number;
    /** Gap between the top of the iris and the upper eyelid, in iris diameters: near 0 or above when white shows above the iris. */
    readonly whiteAboveIris: number;
    /** Gap between the inner lips. */
    readonly lipGap: number;
    /** Middle of the lips above the mouth corners: positive when the corners are up (a smile), negative when down. */
    readonly cornerLift: number;
    /** Head pitch in radians (pitchFromPoseMatrix), when the pose is known. */
    readonly headPitch?: number;
}

/** A landmark as MediaPipe gives it: x and y relative to the image width and height. */
export interface LandmarkPoint {
    readonly x: number;
    readonly y: number;
}

// Landmark indices of MediaPipe's face mesh (478 points with the irises).
const LANDMARK = {
    faceLeft: 234, faceRight: 454,
    innerBrow: [55, 285], innerEyeCorner: [133, 362],
    outerBrow: [46, 276], outerEyeCorner: [33, 263],
    upperLid: [159, 386], iris: [468, 473], irisRing: [[469, 470, 471, 472], [474, 475, 476, 477]],
    upperLip: 13, lowerLip: 14, mouthCorners: [61, 291],
} as const;

/**
 * Head pitch (radians) from MediaPipe's facial transformation matrix (result.facialTransformationMatrixes[0].data,
 * a column-major 4x4): the rotation that fits its rigid 3D face model to the landmarks.
 */
export function pitchFromPoseMatrix(matrix: readonly number[]): number {
    const rotation = (row: number, column: number) => matrix[column * 4 + row];
    return Math.atan2(rotation(2, 1), rotation(2, 2));
}

/**
 * Measures the face's landmarks (see FaceMeasures) on the image as it is: the measures assume a
 * face looking at the camera, so the brow emotions fade as the head tilts away (headPitch).
 * Undoing the head's rotation first does not help - every pose estimate from the landmarks moves
 * with the expression too (a frown reads as a head tilted down), so it would undo the expression.
 * @param landmarks - result.faceLandmarks[0]: 478 points (with the irises)
 * @param aspect - image height / width, so x and y distances compare
 * @param poseMatrix - result.facialTransformationMatrixes[0].data, for headPitch
 * @returns null when the landmarks have no irises
 */
export function measureFace(landmarks: readonly LandmarkPoint[], aspect: number, poseMatrix?: readonly number[]): FaceMeasures | null {
    if (landmarks.length < 478) return null;
    const distance = (a: number, b: number) =>
        Math.hypot(landmarks[a].x - landmarks[b].x, (landmarks[a].y - landmarks[b].y) * aspect);
    const faceWidth = distance(LANDMARK.faceLeft, LANDMARK.faceRight);
    if (faceWidth <= 0) return null;

    const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    const whiteAboveIris = [0, 1].map(side => {
        const center = LANDMARK.iris[side];
        const radius = Math.max(...LANDMARK.irisRing[side].map(point => distance(center, point)));
        const irisTop = landmarks[center].y * aspect - radius;
        return (irisTop - landmarks[LANDMARK.upperLid[side]].y * aspect) / (2 * radius);
    });
    const innerBrowToEye = average([0, 1].map(side => distance(LANDMARK.innerBrow[side], LANDMARK.innerEyeCorner[side])));
    const outerBrowToEye = average([0, 1].map(side => distance(LANDMARK.outerBrow[side], LANDMARK.outerEyeCorner[side])));
    return {
        browInnerToOuter: outerBrowToEye > 0 ? innerBrowToEye / outerBrowToEye : 1,
        whiteAboveIris: average(whiteAboveIris),
        lipGap: distance(LANDMARK.upperLip, LANDMARK.lowerLip) / faceWidth,
        cornerLift: ((landmarks[LANDMARK.upperLip].y + landmarks[LANDMARK.lowerLip].y) / 2
            - average(LANDMARK.mouthCorners.map(corner => landmarks[corner].y))) * aspect / faceWidth,
        ...(poseMatrix && { headPitch: pitchFromPoseMatrix(poseMatrix) }),
    };
}

/**
 * Where a score sits on a neutral face (rest) and on a fully made expression (full).
 * normalize() maps rest to 0 and full to 1. full can be below rest for a measure that falls as
 * the expression grows (browsLow).
 */
export interface ExpressionRange {
    readonly rest: number;
    readonly full: number;
}

export type ExpressionRanges = Readonly<Record<string, ExpressionRange>>;

/**
 * Blendshape rest values measured on public/video/heads.mp4 (around the median over the clip);
 * full values and the signals' ranges (browsLow, eyesWide... over a FaceMeasures value, see
 * SIGNAL_MEASURES) from fixtures/faces. Scores without a range keep their raw value when normalized.
 */
export const DEFAULT_EXPRESSION_RANGES: ExpressionRanges = {
    eyeBlinkLeft: { rest: 0.15, full: 0.6 },
    eyeBlinkRight: { rest: 0.15, full: 0.6 },
    jawOpen: { rest: 0.03, full: 0.5 },
    // Broad smiles with teeth read 0.91-0.96, a small closed smile ~0.47.
    mouthSmileLeft: { rest: 0.05, full: 0.95 },
    mouthSmileRight: { rest: 0.05, full: 0.95 },
    // Sad faces read 0.43-0.67, neutral ones up to ~0.16.
    browInnerUp: { rest: 0.05, full: 0.6 },
    // Signals over the measures. browInnerToOuter: neutral and smiling faces read 0.84-1.11,
    // angry 0.50-0.69, sad 1.10-1.25 (and surprise / fear up to 1.54, told apart by the eyes).
    browsLow: { rest: 0.85, full: 0.65 },
    browsRaised: { rest: 1.1, full: 1.25 },
    // whiteAboveIris: surprised and frightened faces read -0.02 or above, all others -0.11 or lower;
    // the upper lid covers the iris more as a face gets sleepy: awake -0.09, sleepy -0.34, eyes closed -0.57.
    eyesWide: { rest: -0.09, full: -0.02 },
    lidsDrooping: { rest: -0.2, full: -0.4 },
    // lipGap: closed lips read up to ~0.003, smiles up to 0.134, a mouth open wide ("ah") ~0.3.
    lipsApart: { rest: 0.005, full: 0.05 },
    mouthWideOpen: { rest: 0.15, full: 0.25 },
    // cornerLift: broad smiles read 0.057-0.089, an open "ah" 0.032-0.036, sad faces down to -0.042.
    cornersUp: { rest: 0.035, full: 0.055 },
    cornersDown: { rest: -0.01, full: -0.035 },
    // MediaPipe's (normalized) blink minus squint scores: the upper lid leads in sleepiness
    // (sleepy faces +0.12 and above), the lower lid and cheeks in a squint or smile (-0.13 and below).
    upperLidLeading: { rest: -0.05, full: 0.15 },
    // Head pitch: tilting the head up or down moves the brows like an expression (looking down
    // reads as a frown), so the brow emotions fade from 12 degrees to 24 degrees away from the
    // pitch of a neutral face. neutralHeadPitch.rest is that pitch (0, facing the camera; the
    // person's own after calibratedRanges). Angry grid faces lower the chin by up to ~14 degrees.
    headTiltedAway: { rest: 12 * Math.PI / 180, full: 24 * Math.PI / 180 },
    neutralHeadPitch: { rest: 0, full: 0 },
};

/** The measure each signal reads. */
const SIGNAL_MEASURES = {
    browsLow: 'browInnerToOuter',
    browsRaised: 'browInnerToOuter',
    eyesWide: 'whiteAboveIris',
    lidsDrooping: 'whiteAboveIris',
    lipsApart: 'lipGap',
    mouthWideOpen: 'lipGap',
    cornersUp: 'cornerLift',
    cornersDown: 'cornerLift',
} as const satisfies Record<string, keyof FaceMeasures>;

type Signal = keyof typeof SIGNAL_MEASURES;

/**
 * Where the signals' ranges sit around one person's own neutral face (calibratedRanges): offsets
 * from the neutral value of each signal's measure. Narrower than the default ranges, which have to
 * fit everyone's resting face - a real frown moved the brow ratio of one person from 1.25 to 1.17,
 * a different person's relaxed face reads 0.98.
 */
const CALIBRATED_OFFSETS: Readonly<Partial<Record<Signal, ExpressionRange>>> = {
    browsLow: { rest: -0.02, full: -0.10 },
    // Opening the mouth alone lifts the brows and lids by up to ~0.09 / ~0.05.
    browsRaised: { rest: 0.06, full: 0.18 },
    eyesWide: { rest: 0.06, full: 0.15 },
    lidsDrooping: { rest: -0.1, full: -0.3 },
    cornersUp: { rest: 0.02, full: 0.05 },
    cornersDown: { rest: -0.01, full: -0.035 },
};

/** A score on the neutral face counts as resting this far above its neutral value. */
const CALIBRATED_SCORE_MARGIN = 0.02;

/**
 * Ranges fitted to one person: each signal counts from that person's neutral face, and each
 * blendshape whose neutral score is above its resting value rests there instead. The lips' signals
 * keep the default ranges - closed lips read about 0 on everyone.
 * @param neutral - the person's relaxed face (FaceExpressions.average over a few frames)
 */
export function calibratedRanges(neutral: FaceExpressions, base: ExpressionRanges = DEFAULT_EXPRESSION_RANGES): ExpressionRanges {
    const ranges: Record<string, ExpressionRange> = { ...base };
    for (const [name, range] of Object.entries(base)) {
        const offset = CALIBRATED_OFFSETS[name as Signal];
        if (offset) {
            if (neutral.measures) {
                const value = neutral.measures[SIGNAL_MEASURES[name as Signal]];
                ranges[name] = { rest: value + offset.rest, full: value + offset.full };
            }
            continue;
        }
        if (name in SIGNAL_MEASURES || !(name in neutral.scores)) continue;
        const rest = neutral.score(name) + CALIBRATED_SCORE_MARGIN;
        if (rest > range.rest) {
            ranges[name] = { rest, full: Math.max(range.full, rest + 0.1) };
        }
    }
    const neutralPitch = neutral.measures?.headPitch;
    if (neutralPitch !== undefined) {
        ranges.neutralHeadPitch = { rest: neutralPitch, full: neutralPitch };
    }
    return ranges;
}

export type Emotion = 'happy' | 'sad' | 'angry' | 'surprised' | 'sleepy';
export const EMOTIONS: readonly Emotion[] = ['happy', 'sad', 'angry', 'surprised', 'sleepy'];

/** Below this, no emotion is strong enough and emotion reads 'neutral'. */
export const EMOTION_THRESHOLD = 0.35;

/** How strong an emotion is with the mouth closed; an open mouth takes it up to 1. */
const CLOSED_MOUTH_STRENGTH = 0.6;

/**
 * The face's expression: MediaPipe's 52 blendshapes (jawOpen, eyeBlinkLeft, mouthSmileLeft...)
 * plus a few landmark measures (FaceMeasures), next to the face geometry in Face.
 *
 * Like Face, it comes in two stages:
 *  - raw, as MediaPipe gives it: every score is 0..1, but a neutral face is not 0
 *    (eyes read ~0.15 blink) and a full expression rarely reaches 1;
 *  - normalize(): the same getters, with the scores remapped so a neutral face is 0 and a full
 *    expression is 1 (eyes open = 1, closed = 0; mouth closed = 0, open = 1).
 * The measures stay raw in both stages; the signals (browsLow, eyesWide, lipsApart...) remap them.
 *
 * Looking down also raises the blink scores (the eyelids drop), so the eyes can read half
 * closed while the person looks at the bottom of the screen.
 */
export class FaceExpressions {

    /** All scores by MediaPipe's names, 0..1. */
    readonly scores: Readonly<Record<string, number>>;
    readonly ranges: ExpressionRanges;
    /** Landmark measures; null when unknown (no irises), and then the signals (browsLow...) read 0. */
    readonly measures: FaceMeasures | null;
    private normalized: boolean;
    private normalExpressions?: FaceExpressions;

    public constructor(
        scores: Readonly<Record<string, number>>,
        ranges: ExpressionRanges = DEFAULT_EXPRESSION_RANGES,
        measures: FaceMeasures | null = null,
    ) {
        this.scores = scores;
        this.ranges = ranges;
        this.measures = measures;
        this.normalized = false;
    }

    /** The mean of several frames' expressions - a steadier face than any single frame. */
    public static average(expressions: readonly FaceExpressions[]): FaceExpressions {
        if (expressions.length === 0) {
            throw new Error('FaceExpressions.average needs at least one face');
        }
        const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
        const scores: Record<string, number> = {};
        for (const name of Object.keys(expressions[0].scores)) {
            scores[name] = mean(expressions.map(face => face.score(name)));
        }
        const measured = expressions.map(face => face.measures).filter((measures): measures is FaceMeasures => measures !== null);
        const measures = measured.length === 0 ? null : {
            browInnerToOuter: mean(measured.map(measures => measures.browInnerToOuter)),
            whiteAboveIris: mean(measured.map(measures => measures.whiteAboveIris)),
            lipGap: mean(measured.map(measures => measures.lipGap)),
            cornerLift: mean(measured.map(measures => measures.cornerLift)),
            ...(measured.every(measures => measures.headPitch !== undefined) && {
                headPitch: mean(measured.map(measures => measures.headPitch!)),
            }),
        };
        return new FaceExpressions(scores, expressions[0].ranges, measures);
    }

    /** The same raw expressions read with other ranges (calibratedRanges, for one person). */
    public withRanges(ranges: ExpressionRanges): FaceExpressions {
        return new FaceExpressions(this.scores, ranges, this.measures);
    }

    /**
     * Builds the raw expressions from MediaPipe's blendshape categories.
     * @param categories - result.faceBlendshapes[0].categories
     * @param measures - measureFace(result.faceLandmarks[0], ...), when known
     */
    public static fromBlendshapes(
        categories: readonly BlendshapeCategory[],
        measures: FaceMeasures | null = null,
        ranges: ExpressionRanges = DEFAULT_EXPRESSION_RANGES,
    ): FaceExpressions {
        const scores: Record<string, number> = {};
        for (const category of categories) {
            scores[category.categoryName] = category.score;
        }
        return new FaceExpressions(scores, ranges, measures);
    }

    /**
     * Remaps every score with a range from rest..full to 0..1 (clamped).
     * @param useCache - whether to use the cached normalized expressions
     * @returns new FaceExpressions where a neutral face is 0 and a full expression is 1
     */
    public normalize(useCache: boolean = true): FaceExpressions {
        if (this.normalized && useCache) {
            return this;
        }
        if (this.normalExpressions && useCache) {
            return this.normalExpressions;
        }
        const scores: Record<string, number> = {};
        for (const [name, score] of Object.entries(this.scores)) {
            const range = this.ranges[name];
            scores[name] = range ? remap(score, range) : score;
        }
        const normalExpressions = new FaceExpressions(scores, this.ranges, this.measures);
        normalExpressions.normalized = true;
        this.normalExpressions = normalExpressions;
        return normalExpressions;
    }

    /** Score by MediaPipe's name, 0 when missing. */
    public score(name: string): number {
        return this.scores[name] ?? 0;
    }

    /** 1 open, 0 closed. */
    public get leftEyeOpen(): number {
        return 1 - this.score('eyeBlinkLeft');
    }

    /** 1 open, 0 closed. */
    public get rightEyeOpen(): number {
        return 1 - this.score('eyeBlinkRight');
    }

    /** 0 closed, 1 open. */
    public get mouthOpen(): number {
        return this.score('jawOpen');
    }

    /** 0 none, 1 full smile (average of both mouth corners). */
    public get smile(): number {
        return this.both('mouthSmile');
    }

    /** 0 relaxed, 1 inner ends of the brows drawn down (the angry V; from the landmarks). */
    public get browsLow(): number {
        return this.signal('browsLow');
    }

    /** 0 relaxed, 1 inner ends of the brows raised (sad, also surprise and fear; from the landmarks). */
    public get browsRaised(): number {
        return this.signal('browsRaised');
    }

    /** 0 relaxed, 1 eyes wide with white showing above the iris (from the landmarks). */
    public get eyesWide(): number {
        return this.signal('eyesWide');
    }

    /** 0 awake, 1 the upper lids well down over the irises, as when sleepy or closed (from the landmarks). */
    public get lidsDrooping(): number {
        return this.signal('lidsDrooping');
    }

    /**
     * 0 when the lower lids and cheeks narrow the eyes (a squint, a smile), 1 when the upper lids
     * do (sleepiness, closed eyes) - from MediaPipe's blink minus squint scores.
     */
    public get upperLidLeading(): number {
        const range = this.ranges.upperLidLeading;
        return range ? remap(this.both('eyeBlink') - this.both('eyeSquint'), range) : 0;
    }

    /** 0 lips closed, 1 open (from the landmarks; also counts bared teeth, unlike mouthOpen). */
    public get lipsApart(): number {
        return this.signal('lipsApart');
    }

    /** 0 up to a broad smile's opening, 1 open wide as in "ah" or a shout (from the landmarks). */
    public get mouthWideOpen(): number {
        return this.signal('mouthWideOpen');
    }

    /** 0 level, 1 mouth corners up as in a broad smile (from the landmarks). */
    public get cornersUp(): number {
        return this.signal('cornersUp');
    }

    /** 0 level, 1 mouth corners pulled down (from the landmarks). */
    public get cornersDown(): number {
        return this.signal('cornersDown');
    }

    /** 0 within 12 degrees of the neutral face's head pitch, 1 from 24 degrees up or down (see headTiltedAway's range). */
    public get headTiltedAway(): number {
        const pitch = this.measures?.headPitch;
        const range = this.ranges.headTiltedAway;
        if (pitch === undefined || !range) return 0;
        return remap(Math.abs(pitch - (this.ranges.neutralHeadPitch?.rest ?? 0)), range);
    }

    /*
     * Emotions, 0..1. The eyes and brows say which emotion; an open mouth only makes it stronger
     * (CLOSED_MOUTH_STRENGTH with the lips closed, 1 with them apart), so an open mouth alone -
     * talking, a smile - is no emotion. Happy is the exception: there the mouth is the signal.
     * Meant for the normalized expressions. These read deliberate, posed faces; they do not tell
     * what someone feels.
     */

    /**
     * Smile, unless - with the corners not up - the brows are drawn down (MediaPipe reads a
     * clenched or bared angry mouth as a smile) or the mouth is open wide (it reads "ah" or a
     * shout as one). With the corners up it is a real smile, whatever the brows do.
     */
    public get happy(): number {
        return this.smile * Math.max(0, 1 - (this.browsLow + this.mouthWideOpen) * this.notSmiling);
    }

    /**
     * Inner brows raised - by MediaPipe's browInnerUp or the brows' own shape, whichever is
     * stronger, since each misses some sad faces - without the white above the iris that surprise
     * and fear show. Mouth corners pulled down make it stronger; an open mouth does not (opening
     * it lifts the brows a little too, and goes with surprise, fear or "ah" rather than sadness).
     * Like angry, it fades with the head tilted up or down (looking up lifts the inner brows).
     */
    public get sad(): number {
        const browsUp = Math.max(this.score('browInnerUp'), this.browsRaised);
        // Not smiling by either measure: a natural smile can lift the corners less than
        // cornersUp needs while MediaPipe's smile score is already high. (Angry cannot use the
        // smile score: MediaPipe reads a snarl as a smile.)
        const notSmiling = Math.min(this.notSmiling, 1 - this.smile);
        // Brows raised against heavy lids are sleepiness, not sadness.
        return browsUp * (1 - this.eyesWide) * (1 - this.heavyLids) * notSmiling * this.facingAsNeutral * this.strength(this.cornersDown);
    }

    /**
     * Inner brows drawn down toward the eyes - with the eyes open (closing them pulls the brows
     * down too), the mouth corners not up (a smile moves the brows a little) and the head pitched
     * as on the neutral face (looking down brings the brows toward the eyes).
     */
    public get angry(): number {
        return this.browsLow * this.eyesNotClosed * this.notSmiling * this.facingAsNeutral * this.mouthBoost;
    }

    /** Eyes wide, white showing above the iris. */
    public get surprised(): number {
        return this.eyesWide * this.mouthBoost;
    }

    /**
     * Heavy upper lids - drooping over the irises, the upper lid leading rather than a squint's
     * lower lid - without a smile; a yawn (the mouth open wide) makes it stronger. Closed eyes read
     * as sleepy too, so a single frame of a blink does: smooth it over time before trusting it.
     */
    public get sleepy(): number {
        return this.heavyLids * Math.min(this.notSmiling, 1 - this.smile) * (0.8 + 0.2 * this.mouthWideOpen);
    }

    /** The strongest emotion, or 'neutral' when none reaches EMOTION_THRESHOLD. */
    public get emotion(): Emotion | 'neutral' {
        let strongest: Emotion | 'neutral' = 'neutral';
        let strongestScore = EMOTION_THRESHOLD;
        for (const emotion of EMOTIONS) {
            if (this[emotion] >= strongestScore) {
                strongest = emotion;
                strongestScore = this[emotion];
            }
        }
        return strongest;
    }

    private get heavyLids(): number {
        return this.lidsDrooping * this.upperLidLeading;
    }

    /** 1 down to half-open eyes (a squint still counts), 0 with the eyes closed. */
    private get eyesNotClosed(): number {
        return Math.min(1, this.leftEyeOpen + this.rightEyeOpen);
    }

    /** 1 with the head pitched as on the neutral face, 0 tilted well up or down (the brows move with the tilt). */
    private get facingAsNeutral(): number {
        return 1 - this.headTiltedAway;
    }

    /** 1 with the mouth corners level or down, 0 with them up in a broad smile. */
    private get notSmiling(): number {
        return 1 - this.cornersUp;
    }

    private get mouthBoost(): number {
        return this.strength(this.lipsApart);
    }

    /** CLOSED_MOUTH_STRENGTH with nothing to boost it, up to 1 with a full boost. */
    private strength(boost: number): number {
        return CLOSED_MOUTH_STRENGTH + (1 - CLOSED_MOUTH_STRENGTH) * boost;
    }

    /** A signal: its measure remapped by its range to 0..1; 0 when the measures are unknown. */
    private signal(name: Signal): number {
        if (!this.measures) return 0;
        const value = this.measures[SIGNAL_MEASURES[name]];
        const range = this.ranges[name];
        return range ? remap(value, range) : value;
    }

    /** Average of a score's Left and Right versions. */
    private both(name: string): number {
        return (this.score(`${name}Left`) + this.score(`${name}Right`)) / 2;
    }
}

function remap(score: number, range: ExpressionRange): number {
    const span = range.full - range.rest;
    if (span === 0) return score;
    return Math.max(0, Math.min(1, (score - range.rest) / span));
}
