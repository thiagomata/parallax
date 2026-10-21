/**
 * One MediaPipe face blendshape category, as FaceLandmarker returns it with
 * outputFaceBlendshapes on (result.faceBlendshapes[0].categories).
 */
export interface BlendshapeCategory {
    readonly categoryName: string;
    readonly score: number;
}

/**
 * Where a score sits on a neutral face (rest) and on a fully made expression (full).
 * normalize() maps rest to 0 and full to 1.
 */
export interface ExpressionRange {
    readonly rest: number;
    readonly full: number;
}

export type ExpressionRanges = Readonly<Record<string, ExpressionRange>>;

/**
 * Rest values measured on public/video/heads.mp4 (median over the clip). The full values are
 * provisional: the clip has no closed eyes or open mouth, so they still need a live face.
 * Scores without a range keep their raw value when normalized.
 */
export const DEFAULT_EXPRESSION_RANGES: ExpressionRanges = {
    eyeBlinkLeft: { rest: 0.15, full: 0.6 },
    eyeBlinkRight: { rest: 0.15, full: 0.6 },
    jawOpen: { rest: 0.03, full: 0.5 },
    mouthSmileLeft: { rest: 0.05, full: 0.6 },
    mouthSmileRight: { rest: 0.05, full: 0.6 },
};

/**
 * The face's expression from MediaPipe's 52 blendshapes (jawOpen, eyeBlinkLeft, mouthSmileLeft...),
 * next to the face geometry in Face.
 *
 * Like Face, it comes in two stages:
 *  - raw, as MediaPipe gives it: every score is 0..1, but a neutral face is not 0
 *    (eyes read ~0.15 blink) and a full expression rarely reaches 1;
 *  - normalize(): the same getters, with the scores remapped so a neutral face is 0 and a full
 *    expression is 1 (eyes open = 1, closed = 0; mouth closed = 0, open = 1).
 *
 * Looking down also raises the blink scores (the eyelids drop), so the eyes can read half
 * closed while the person looks at the bottom of the screen.
 */
export class FaceExpressions {

    /** All scores by MediaPipe's names, 0..1. */
    readonly scores: Readonly<Record<string, number>>;
    readonly ranges: ExpressionRanges;
    private normalized: boolean;
    private normalExpressions?: FaceExpressions;

    public constructor(scores: Readonly<Record<string, number>>, ranges: ExpressionRanges = DEFAULT_EXPRESSION_RANGES) {
        this.scores = scores;
        this.ranges = ranges;
        this.normalized = false;
    }

    /**
     * Builds the raw expressions from MediaPipe's blendshape categories.
     * @param categories - result.faceBlendshapes[0].categories
     */
    public static fromBlendshapes(
        categories: readonly BlendshapeCategory[],
        ranges: ExpressionRanges = DEFAULT_EXPRESSION_RANGES,
    ): FaceExpressions {
        const scores: Record<string, number> = {};
        for (const category of categories) {
            scores[category.categoryName] = category.score;
        }
        return new FaceExpressions(scores, ranges);
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
        const normalExpressions = new FaceExpressions(scores, this.ranges);
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
        return (this.score('mouthSmileLeft') + this.score('mouthSmileRight')) / 2;
    }
}

function remap(score: number, range: ExpressionRange): number {
    const span = range.full - range.rest;
    if (span <= 0) return score;
    return Math.max(0, Math.min(1, (score - range.rest) / span));
}
