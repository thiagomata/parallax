import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import {
    HeadTrackingDataProvider,
    type HeadTrackingDataProviderConfig,
    type ObserverDataProviderLib
} from "../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../scene/providers/web_cam_data_provider.ts";
import type { VideoPixels } from "../../scene/types.ts";
import { VideoDataProvider } from "../../scene/providers/video_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {
    DEFAULT_SCENE_SETTINGS,
    ELEMENT_TYPES, LOOK_MODES, PROJECTION_TYPES,
    type ResolutionContext,
    type SceneUnits,
} from "../../scene/types.ts";
import {
    DEFAULT_SKETCH_CONFIG,
    type SketchConfig
} from "../tutorial/sketch_config.ts";
import type { FaceConfig } from "../tutorial/sketch_engine.types.ts";
import {WorldSettings} from "../../scene/world_settings.ts";
import {COLORS} from "../../scene/colors.ts";
import {appAssetPath} from "../../utils/app_paths.ts";
import {createVideoSelector} from "../tutorial/tutorial-8/tutorial_observer.ts";
import {
    addEmojiFace, ExpressionReader, mouthPose, type FaceShape,
} from "./emoji_face.ts";
import type { Emotion } from "../../scene/drivers/mediapipe/face_expressions.ts";

const FALLBACK_VIDEO_URL = appAssetPath("video/heads.mp4");
const VIDEO_SOURCE_ORDER = ["webCam", "video"] as const;

/**
 * SHOWROOM: Emotion Game
 *
 * Make the face the game asks for: your webcam on the left, your emoji on the right.
 */
export const emotionGameExplanation = `
<div class="concept">
<p>A game built on the face expressions of tutorial 11. Every round shows an emoji - make that face and hold it for half a second to score. A round lasts ten seconds, a missed one costs one of your three lives, and the whole game lasts at most a minute and a half. Your webcam is on the left, and on the right the emoji face copies yours, so you can see what the game sees.</p>
</div>

<h3>How It Works</h3>
<ol>
<li><strong>The face cam</strong> - the webcam panel shows the whole camera frame, kept in the camera's own aspect so nothing is cut off.</li>
<li><strong>The face</strong> - <code>addEmojiFace</code> (<code>emoji_face.ts</code>) draws the emoji, here at a fixed place beside the webcam, still turning with your head.</li>
<li><strong>Reading the expressions</strong> - <code>ExpressionReader</code> (<code>emoji_face.ts</code>) calibrates on <kbd>N</kbd> and smooths sleepy over time, so a blink is not a nap.</li>
<li><strong>Matching</strong> - <code>matchesTarget</code> checks the face against the round's emoji: the strongest emotion for 😢 😠 😮 😴, a smile that is not the open grin for 🙂, the open grin for 😃, one eye closed for 😉.</li>
<li><strong>The rounds</strong> - <code>EmotionGame</code> keeps the score, the lives, the target and the clock: hold the face for <code>HOLD_SECONDS</code> to score; a round that runs out after <code>ROUND_SECONDS</code> costs one of the <code>LIVES</code>. The game is over with none left, or after <code>GAME_SECONDS</code> however well it goes (<kbd>R</kbd> or space plays again).</li>
<li><strong>The pictures</strong> - every round ends with a snapshot of the canvas, you and your emoji side by side, stamped with the target and ✅ / ❌. At the end they show together, and <em>Save picture</em> puts them in one collage (<code>collageLayout</code>). <em>Share</em> opens the system share sheet with the collage attached where the browser has one; otherwise it copies the collage and opens a post on X (<code>postIntentUrl</code>) to paste it into. They stay on your device until you share them.</li>
<li><strong>The parade</strong> - a match sends its emoji flying across behind the scene: plain page emoji under the canvas, which is cleared transparent, so the 3D face and the webcam pass in front of them.</li>
</ol>

<p>Angry is the hard one: press <kbd>N</kbd> with a relaxed face first, so the game counts from your own face.</p>

<div class="related">
<h3>Related Tutorials</h3>
<a href="../../tutorial/tutorial-11/index.html">Tutorial 11: Facial Expressions</a>
</div>
`;

export type GameTargetId = 'smile' | 'grin' | 'wink' | Exclude<Emotion, 'happy'>;

export interface GameTarget {
    readonly id: GameTargetId;
    readonly emoji: string;
    readonly label: string;
}

export const GAME_TARGETS: readonly GameTarget[] = [
    { id: 'smile', emoji: '🙂', label: 'Smile (lips closed)' },
    { id: 'grin', emoji: '😃', label: 'Big open grin' },
    { id: 'wink', emoji: '😉', label: 'Wink' },
    { id: 'sad', emoji: '😢', label: 'Sad' },
    { id: 'angry', emoji: '😠', label: 'Angry' },
    { id: 'surprised', emoji: '😮', label: 'Surprised' },
    { id: 'sleepy', emoji: '😴', label: 'Sleepy' },
];

/** Whether the face shows the target: the shape the emoji face draws, so what you see is what counts. */
export function matchesTarget(target: GameTargetId, shape: FaceShape): boolean {
    switch (target) {
        // A smile that is not the open grin: 🙂 and 😃 are two different faces to make.
        case 'smile': return shape.happy > 0 && mouthPose(shape).mode !== 'grin';
        case 'grin': return mouthPose(shape).mode === 'grin';
        case 'wink': {
            const [closed, open] = [Math.min(shape.leftEyeOpen, shape.rightEyeOpen), Math.max(shape.leftEyeOpen, shape.rightEyeOpen)];
            return closed < 0.3 && open > 0.6;
        }
        default: return shape[target] > 0;
    }
}

/**
 * The game: a target per round, the score, the lives and the clocks (seconds, from update's now).
 * Hold the target for HOLD_SECONDS to score; a round that runs out (ROUND_SECONDS) costs a life.
 * The game is over with no lives left, or after GAME_SECONDS however well it goes (restart plays again).
 */
export class EmotionGame {
    static readonly ROUND_SECONDS = 10;
    static readonly GAME_SECONDS = 90;
    static readonly LIVES = 3;
    static readonly HOLD_SECONDS = 0.5;
    /** How long the ✓ shows before the next round. */
    static readonly CELEBRATE_SECONDS = 1;

    score = 0;
    lives = EmotionGame.LIVES;
    /** Whether the game ended because its time ran out (rather than the lives). */
    timeUp = false;
    target: GameTarget;
    private gameStart: number;
    private roundStart: number;
    private holdStart: number | null = null;
    private celebrateUntil: number | null = null;

    private readonly random: () => number;

    constructor(now: number, random: () => number = Math.random) {
        this.random = random;
        this.target = this.pickTarget(null);
        this.gameStart = now;
        this.roundStart = now;
    }

    /** Whether the game is over: no lives left, or its time ran out. */
    public get over(): boolean {
        return this.lives <= 0 || this.timeUp;
    }

    /** Seconds left in this game. */
    public gameSecondsLeft(now: number): number {
        return Math.max(0, EmotionGame.GAME_SECONDS - (now - this.gameStart));
    }

    /** A new game: score 0, all the lives, the full time, a new target. */
    public restart(now: number): void {
        this.score = 0;
        this.lives = EmotionGame.LIVES;
        this.timeUp = false;
        this.gameStart = now;
        this.celebrateUntil = null;
        this.nextRound(now);
    }

    /** Seconds left in this round. */
    public secondsLeft(now: number): number {
        return Math.max(0, EmotionGame.ROUND_SECONDS - (now - this.roundStart));
    }

    /** Whether the ✓ for a scored round is showing. */
    public celebrating(now: number): boolean {
        return this.celebrateUntil !== null && now < this.celebrateUntil;
    }

    /** How far the current hold is, 0..1 (1 scores). */
    public holdProgress(now: number): number {
        return this.holdStart === null ? 0 : Math.min(1, (now - this.holdStart) / EmotionGame.HOLD_SECONDS);
    }

    /**
     * Advances the game to now with whether the face matches the target.
     * @returns 'scored', 'timeout' (a life lost; a new round, or the game over), 'time-up' (the
     *     game's time ran out: it is over) or null
     */
    public update(now: number, matching: boolean): 'scored' | 'timeout' | 'time-up' | null {
        if (this.over) return null;
        if (this.gameSecondsLeft(now) <= 0) {
            this.timeUp = true;
            this.celebrateUntil = null;
            return 'time-up';
        }
        if (this.celebrateUntil !== null) {
            if (now < this.celebrateUntil) return null;
            this.celebrateUntil = null;
            this.nextRound(now);
            return null;
        }
        if (matching) {
            this.holdStart ??= now;
            if (now - this.holdStart >= EmotionGame.HOLD_SECONDS) {
                this.score++;
                this.holdStart = null;
                this.celebrateUntil = now + EmotionGame.CELEBRATE_SECONDS;
                return 'scored';
            }
        } else {
            this.holdStart = null;
        }
        if (this.secondsLeft(now) <= 0) {
            this.lives--;
            if (!this.over) this.nextRound(now);
            return 'timeout';
        }
        return null;
    }

    private nextRound(now: number): void {
        this.target = this.pickTarget(this.target);
        this.roundStart = now;
        this.holdStart = null;
    }

    /** A random target, never the same twice in a row. */
    private pickTarget(previous: GameTarget | null): GameTarget {
        const choices = GAME_TARGETS.filter(target => target !== previous);
        return choices[Math.min(choices.length - 1, Math.floor(this.random() * choices.length))];
    }
}

/** The game's background, top to bottom: a sunset the yellow emoji stands out on. */
export const BACKGROUND_STOPS: readonly { offset: number; color: string }[] = [
    { offset: 0, color: '#2e1a5c' },
    { offset: 0.55, color: '#9b3d8f' },
    { offset: 1, color: '#f28c6b' },
];

/** The background as CSS, for the page behind the (transparent) canvas. */
export function backgroundCss(): string {
    return `linear-gradient(180deg, ${BACKGROUND_STOPS.map(stop => `${stop.color} ${stop.offset * 100}%`).join(', ')})`;
}

/** One round's picture: the canvas (webcam and emoji) when the round ended. */
export interface Snapshot {
    readonly image: string;
    readonly target: GameTarget;
    readonly scored: boolean;
}

/** Where each snapshot goes in the collage: a grid of columns, under a title row. */
export function collageLayout(count: number, cell: { width: number; height: number }, columns = 3, titleHeight = 70): {
    width: number; height: number; cells: { x: number; y: number }[];
} {
    const used = Math.max(1, Math.min(columns, count));
    const rows = Math.max(1, Math.ceil(count / used));
    const gap = 8;
    return {
        width: used * cell.width + (used + 1) * gap,
        height: titleHeight + rows * cell.height + (rows + 1) * gap,
        cells: Array.from({ length: count }, (_, i) => ({
            x: gap + (i % used) * (cell.width + gap),
            y: titleHeight + gap + Math.floor(i / used) * (cell.height + gap),
        })),
    };
}

/** The post that goes with the collage: the score and a link to play. */
export function shareText(score: number, link: string): string {
    return `I scored ${score} in the Emotion Game 😃 Make the faces, your emoji copies you: ${link}`;
}

/** X's page to write a post, with the text filled in (it cannot attach a picture: that is pasted). */
export function postIntentUrl(text: string): string {
    return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export async function emotionGame(
    p: p5,
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    extraArgs?: {
        faceConfig?: FaceConfig;
        faceDataProvider?: HeadTrackingDataProvider;
        webCamProvider?: WebCamDataProvider;
        graphicProcessor?: P5GraphicProcessor;
    },
): Promise<World<P5Bundler, any, any, ObserverDataProviderLib>> {
    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        debug: false,
        playback: {
            ...DEFAULT_SCENE_SETTINGS.playback,
            duration: 100000,
            isLoop: true
        },
    });

    const videoWidthPixels = 1920 as VideoPixels;
    const videoHeightPixels = 1080 as VideoPixels;
    const headWidthPercent = 1 / 4;
    const headWidthPixels = (headWidthPercent * videoWidthPixels) as VideoPixels;
    const panelPosition = { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits };
    const screenPosition = { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 1500 as SceneUnits };
    const baselineHeadSceneUnits = 300 as SceneUnits;

    const headTrackingConfig: Partial<HeadTrackingDataProviderConfig> = {
        ...( extraArgs?.faceConfig ?? {} ),
        videoWidthPixels: videoWidthPixels,
        videoHeightPixels: videoHeightPixels,
        mirror: false,
        baseline: panelPosition,
        cameraPosition: screenPosition,
        baselineHeadPixels: headWidthPixels,
        baselineHeadSceneUnits: baselineHeadSceneUnits,
        sceneScreenWidth: baselineHeadSceneUnits / headWidthPercent as SceneUnits,
        depthScale: 1,
    }

    const webCamProvider = extraArgs?.webCamProvider ?? new WebCamDataProvider(p, videoWidthPixels, videoHeightPixels);

    const fallbackVideoProvider = new VideoDataProvider(p, FALLBACK_VIDEO_URL, {
        loop: true,
        autoplay: true,
        muted: true,
        playsInline: true,
    });
    const fallbackVideo = (fallbackVideoProvider as any).video;

    const faceDataProvider = extraArgs?.faceDataProvider ?? new HeadTrackingDataProvider(
        p,
        headTrackingConfig,
        VIDEO_SOURCE_ORDER,
    );

    const loader = new P5AssetLoader(p);
    let gp: P5GraphicProcessor = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);

    const dataProviderLib: ObserverDataProviderLib = {
        webCam: webCamProvider, // needed as parent dependency for headTracker
        video: fallbackVideoProvider,
        headTracker: faceDataProvider,
    };
    const world = new World<P5Bundler, any, any, ObserverDataProviderLib>(
        WorldSettings.fromLibs({clock, loader, dataProviderLib})
    );
    world.setScreen({
        id: 'screen',
        type: PROJECTION_TYPES.SCREEN,
        position: screenPosition,
        direction: {x: 0, y: 0, z: 1},
        lookMode: LOOK_MODES.ROTATION,
        rotation: {yaw: 0, pitch: 0, roll: 0},
    });
    world.setEye({
        id: 'eye',
        type: PROJECTION_TYPES.EYE,
        parentId: 'screen',
        position: { x: 0, y: 0, z: 10 },
        direction: { x: 0, y: 0, z: -1 },
        lookMode: LOOK_MODES.ROTATION,
        rotation: { yaw: 0, pitch: 0, roll: 0 },
    })

    // A fixed field of view, so the scene keeps its proportions at any canvas size (otherwise
    // a small window draws it bigger and the emoji runs off the side).
    world.enableDefaultPerspective(config.width, config.height, 50 * Math.PI / 180);

    world.startLoading();

    if (config.paused) {
        world.pause();
    }

    // Side by side: the webcam on the left, the emoji on the right (in the 50 degree view, the
    // canvas spans about -880..880 across and -700..700 down at the webcam's depth).
    // The panel's box is 600 wide and up to 750 tall; the video keeps its own aspect inside it
    // (the default "contain" fit), so the whole frame shows, whatever the camera's shape.
    const VIDEO = { width: 600, height: 750 };
    const SIDE = 440;

    world.addBox({
        type: ELEMENT_TYPES.BOX,
        id: 'bigBox',
        width: 1,
        position: { x: 0, y: 0, z: 0 },
    });

    const reader = new ExpressionReader();
    let currentShape: FaceShape | null = null;

    addEmojiFace(world, {
        parentId: 'bigBox',
        // Forward of the video, so the emoji shows about as tall as the webcam beside it.
        position: () => ({ x: SIDE * 0.95, y: 0, z: 300 }),
        rotate: (ctx: ResolutionContext<ObserverDataProviderLib>) => {
            const face = ctx.dataProviders['headTracker'];
            reader.update(face);
            currentShape = face ? reader.shapeOf(face) : null;
            if (!face) return { pitch: 0, yaw: 0, roll: 0 };
            return { yaw: face.stick.yaw, pitch: face.stick.pitch, roll: face.stick.roll };
        },
        shapeOf: (ctx) => reader.shapeOf(ctx.dataProviders['headTracker']),
    });

    // Starts once the scene is ready, so the first round does not run down while it loads.
    let game: EmotionGame | null = null;

    // The game's panel over the canvas: score, the target emoji, the time left and the hold.
    let hud: { root: HTMLElement; score: HTMLElement; target: HTMLElement; label: HTMLElement; time: HTMLElement; status: HTMLElement } | undefined;
    const updateHud = (now: number) => {
        if (!hud || !game) return;
        const celebrating = game.celebrating(now);
        const set = (element: HTMLElement, text: string) => { if (element.textContent !== text) element.textContent = text; };
        const hearts = '❤️'.repeat(Math.max(0, game.lives)) + '🤍'.repeat(EmotionGame.LIVES - Math.max(0, game.lives));
        set(hud.score, `Score ${game.score}   ${hearts}   ⏱ ${Math.ceil(game.gameSecondsLeft(now))}s`);
        if (game.over) {
            set(hud.target, game.timeUp ? '⏱' : '🏁');
            set(hud.label, `${game.timeUp ? "Time's up" : 'Game over'} - score ${game.score}`);
            set(hud.time, 'R or space: play again');
            set(hud.status, reader.status);
            hud.target.style.transform = '';
            return;
        }
        set(hud.target, celebrating ? '✓' : game.target.emoji);
        set(hud.label, celebrating ? 'Nice!' : game.target.label);
        set(hud.time, celebrating ? '' : `${Math.ceil(game.secondsLeft(now))}s${game.holdProgress(now) > 0 ? '  hold...' : ''}`);
        set(hud.status, reader.status);
        hud.target.style.transform = `scale(${1 + 0.3 * game.holdProgress(now)})`;
    };

    // A match sends a parade of its emoji flying across behind the scene: plain emoji in the page
    // under the canvas, which is cleared transparent, so the 3D face and the webcam hide them.
    let parade: HTMLElement | undefined;
    const PARADE_SIZE = 16;
    const startParade = (emoji: string) => {
        if (!parade) return;
        for (let i = 0; i < PARADE_SIZE; i++) {
            const flyer = document.createElement('span');
            flyer.textContent = emoji;
            const seconds = 1.6 + Math.random() * 1.2;
            flyer.style.cssText = `position:absolute;left:0;top:${8 + Math.random() * 80}%;font-size:${32 + Math.random() * 48}px;`
                + `animation:emotion-game-parade ${seconds}s linear ${Math.random() * 0.9}s both`;
            flyer.addEventListener('animationend', () => flyer.remove());
            parade.appendChild(flyer);
        }
    };

    // Every round's picture - you and your emoji when it ended - shown together at the end. They
    // stay in the page: nothing is uploaded.
    const SNAPSHOT_WIDTH = 480;
    // The webcam and the emoji sit in this band of the canvas's height.
    const SNAPSHOT_BAND = { top: 0.21, bottom: 0.8 };
    let snapshots: Snapshot[] = [];
    let canvasElement: HTMLCanvasElement | undefined;
    let gallery: HTMLElement | undefined;

    /** A small copy of the canvas, stamped with the target emoji and ✓ / ✗. */
    const drawSnapshot = (target: GameTarget, scored: boolean): HTMLCanvasElement | null => {
        if (!canvasElement || !canvasElement.width) return null;
        // Only the band with the webcam and the emoji, not the empty canvas above and below.
        const bandTop = canvasElement.height * SNAPSHOT_BAND.top;
        const bandHeight = canvasElement.height * (SNAPSHOT_BAND.bottom - SNAPSHOT_BAND.top);
        const picture = document.createElement('canvas');
        picture.width = SNAPSHOT_WIDTH;
        picture.height = Math.round(SNAPSHOT_WIDTH * bandHeight / canvasElement.width);
        const g = picture.getContext('2d');
        if (!g) return null;
        // The background is the page's, behind the canvas, so the picture paints it again - the
        // same gradient over the whole canvas height, of which the picture shows the band.
        const scale = picture.width / canvasElement.width;
        const background = g.createLinearGradient(0, -bandTop * scale, 0, (canvasElement.height - bandTop) * scale);
        BACKGROUND_STOPS.forEach(stop => background.addColorStop(stop.offset, stop.color));
        g.fillStyle = background;
        g.fillRect(0, 0, picture.width, picture.height);
        g.drawImage(canvasElement, 0, bandTop, canvasElement.width, bandHeight, 0, 0, picture.width, picture.height);
        g.font = '44px system-ui, sans-serif';
        g.textBaseline = 'top';
        g.fillText(target.emoji, 10, 8);
        g.fillText(scored ? '✅' : '❌', picture.width - 52, 8);
        return picture;
    };

    const takeSnapshot = (target: GameTarget, scored: boolean) => {
        const picture = drawSnapshot(target, scored);
        if (picture) snapshots.push({ image: picture.toDataURL('image/jpeg', 0.85), target, scored });
    };

    /** All the snapshots in one picture, to save and share. */
    const buildCollage = async (): Promise<HTMLCanvasElement | null> => {
        if (!snapshots.length || !game) return null;
        // A picture that never loads must not hold the collage back: the wait ends either way.
        const images = await Promise.all(snapshots.map(snapshot => new Promise<HTMLImageElement | null>(resolve => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => resolve(null);
            image.src = snapshot.image;
        })));
        const loaded = images.filter((image): image is HTMLImageElement => image !== null);
        if (!loaded.length) return null;
        const layout = collageLayout(loaded.length, { width: loaded[0].width, height: loaded[0].height });
        const collage = document.createElement('canvas');
        collage.width = layout.width;
        collage.height = layout.height;
        const g = collage.getContext('2d');
        if (!g) return null;
        g.fillStyle = '#0a0a0a';
        g.fillRect(0, 0, collage.width, collage.height);
        g.fillStyle = '#fff';
        g.font = '700 30px system-ui, sans-serif';
        g.textBaseline = 'middle';
        g.fillText(`😃 Emotion Game - score ${game.score}`, 16, 36);
        loaded.forEach((image, i) => g.drawImage(image, layout.cells[i].x, layout.cells[i].y));
        return collage;
    };

    const saveCollage = async () => {
        const collage = await buildCollage();
        if (!collage || !game) return;
        const link = document.createElement('a');
        link.download = `emotion-game-${game.score}.jpg`;
        link.href = collage.toDataURL('image/jpeg', 0.9);
        link.click();
    };

    const toBlob = (canvas: HTMLCanvasElement, type: string) =>
        new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.9));

    // The collage, ready before the player clicks Share: browsers only allow the share sheet, a
    // new tab and the clipboard during the click itself, so the click must not wait for it.
    let prepared: { text: string; file: File; png: Blob; jpegUrl: string } | null = null;
    const prepareShare = async () => {
        prepared = null;
        const collage = await buildCollage();
        if (!collage || !game) return;
        const [jpeg, png] = await Promise.all([toBlob(collage, 'image/jpeg'), toBlob(collage, 'image/png')]);
        if (!jpeg || !png) return;
        prepared = {
            text: shareText(game.score, location.href),
            file: new File([jpeg], `emotion-game-${game.score}.jpg`, { type: 'image/jpeg' }),
            png,
            jpegUrl: collage.toDataURL('image/jpeg', 0.9),
        };
    };

    const downloadPrepared = () => {
        if (!prepared || !game) return;
        const link = document.createElement('a');
        link.download = prepared.file.name;
        link.href = prepared.jpegUrl;
        link.click();
    };

    /**
     * Shares the collage, on the player's click and without waiting for anything before: the
     * system share sheet with the picture attached where the browser has one (phones, Safari...);
     * otherwise X's post page opens with the text and the picture goes to the clipboard, to paste.
     * Nothing in here may throw: the button has to end with a message, whatever the browser does.
     */
    const shareCollage = (say: (message: string) => void) => {
        if (!prepared) {
            say('The picture is still being made - try again in a moment.');
            return;
        }
        const { text, file, png } = prepared;
        // canShare and share can throw (a browser may refuse a combination): the player must
        // always get an answer, so every step is guarded.
        let canShareFiles = false;
        try {
            canShareFiles = !!navigator.canShare?.({ files: [file] });
        } catch {
            canShareFiles = false;
        }
        if (canShareFiles) {
            const failed = () => {
                downloadPrepared();
                say('Sharing did not open - the picture is saved, attach it to your post.');
            };
            try {
                navigator.share({ files: [file], text }).catch((error: Error) => {
                    if (error.name === 'AbortError') { say('Share cancelled.'); return; }
                    failed();
                });
            } catch {
                failed();
            }
            return;
        }
        const post = window.open(postIntentUrl(text), '_blank');
        const notCopied = () => {
            downloadPrepared();
            say(post ? 'Picture saved - attach it to the post.' : 'Picture saved - allow pop-ups to open the post.');
        };
        try {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
                .then(() => say(post
                    ? 'Picture copied - paste it into the post (Ctrl / Cmd + V).'
                    : 'Picture copied - allow pop-ups to open the post, or paste it into a new post on X.'))
                .catch(notCopied);
        } catch {
            notCopied();
        }
    };

    const showGallery = async () => {
        if (!gallery || !game) return;
        // The collage is made before the gallery appears, so the Share button works on the
        // first click: the browser only allows the share sheet, a new tab and the clipboard
        // during the click itself.
        await prepareShare();
        if (!gallery || !game) return;
        gallery.innerHTML = '';
        const title = document.createElement('div');
        title.textContent = `${game.timeUp ? "⏱ Time's up" : '🏁 Game over'} - score ${game.score}`;
        title.style.cssText = 'font-size:24px;margin-bottom:10px';
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;width:100%';
        for (const snapshot of snapshots) {
            const image = document.createElement('img');
            image.src = snapshot.image;
            image.alt = `${snapshot.target.label}: ${snapshot.scored ? 'made it' : 'missed'}`;
            image.style.cssText = 'width:100%;border-radius:6px';
            grid.appendChild(image);
        }
        const buttons = document.createElement('div');
        buttons.style.cssText = 'display:flex;gap:10px;margin-top:12px';
        const button = (label: string, onClick: () => void) => {
            const element = document.createElement('button');
            element.textContent = label;
            element.style.cssText = 'font:700 15px system-ui,sans-serif;padding:8px 16px;border:0;border-radius:6px;cursor:pointer;background:#38bdf8;color:#0f172a';
            element.addEventListener('click', onClick);
            buttons.appendChild(element);
        };
        const message = document.createElement('div');
        message.style.cssText = 'font-size:14px;margin-top:8px;min-height:1.3em';
        const say = (text: string) => { message.textContent = text; };
        if (snapshots.length) {
            button('📤 Share', () => shareCollage(say));
            button('📸 Save picture', () => { if (prepared) downloadPrepared(); else void saveCollage(); });
        }
        button('▶ Play again (R)', () => restart());
        const note = document.createElement('div');
        note.textContent = 'The pictures stay on this device until you share them - nothing is uploaded.';
        note.style.cssText = 'font-size:12px;opacity:0.7;margin-top:4px';
        gallery.append(title, grid, buttons, message, note);
        gallery.style.display = 'flex';
    };

    const restart = () => {
        if (!game) return;
        snapshots = [];
        if (gallery) gallery.style.display = 'none';
        game.restart(performance.now() / 1000);
    };

    p.setup = () => {
        const canvas = p.createCanvas(config.width, config.height, p.WEBGL);
        // Keep the last frame readable, for the snapshots (WebGL clears it once shown otherwise).
        p.setAttributes?.('preserveDrawingBuffer', true);
        gp = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);
        canvasElement = (canvas as { elt?: HTMLCanvasElement } | undefined)?.elt;
        const box = canvasElement?.parentElement;
        if (box && canvasElement) {
            box.querySelector('.emotion-game-parade')?.remove(); // from a previous run of this sketch
            box.querySelector('.emotion-game-gallery')?.remove();
            gallery = document.createElement('div');
            gallery.className = 'emotion-game-gallery';
            gallery.style.cssText = 'position:absolute;inset:0;z-index:3;display:none;flex-direction:column;align-items:center;overflow:auto;padding:16px;'
                + 'background:rgba(10,10,10,0.92);color:#fff;font:700 16px/1.3 system-ui,sans-serif;box-sizing:border-box';
            box.appendChild(gallery);
            if (!document.getElementById('emotion-game-parade-style')) {
                const style = document.createElement('style');
                style.id = 'emotion-game-parade-style';
                style.textContent = '@keyframes emotion-game-parade { from { transform: translateX(-120px) } to { transform: translateX(var(--parade-width, 1200px)) } }';
                document.head.appendChild(style);
            }
            parade = document.createElement('div');
            parade.className = 'emotion-game-parade';
            parade.style.cssText = `position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:${backgroundCss()}`;
            parade.style.setProperty('--parade-width', `${box.clientWidth + 120}px`);
            box.insertBefore(parade, canvasElement);
            canvasElement.style.position = 'relative';
            canvasElement.style.zIndex = '1';
            box.querySelector('.emotion-game-hud')?.remove(); // from a previous run of this sketch
            const root = document.createElement('div');
            root.className = 'emotion-game-hud';
            root.style.cssText = 'position:absolute;top:8px;left:0;right:0;z-index:2;display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;color:#fff;font:700 18px/1.2 system-ui,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,0.8)';
            const element = (css: string) => { const el = document.createElement('div'); el.style.cssText = css; root.appendChild(el); return el; };
            hud = {
                root,
                score: element('font-size:22px'),
                target: element('font-size:72px;line-height:1.1;transition:transform 0.1s'),
                label: element('font-size:16px'),
                time: element('font-size:14px;opacity:0.85'),
                status: element('font-size:12px;opacity:0.7'),
            };
            box.appendChild(root);
        }
    };

    p.keyPressed = () => {
        if (p.key === 'n' || p.key === 'N') {
            reader.startCalibration();
        }
        if (game?.over && (p.key === 'r' || p.key === 'R' || p.key === ' ')) {
            restart();
        }
    };

    let initialized = false;
    let rendering = false;
    p.draw = async () => {
        if (rendering) return;
        rendering = true;
        try {
        if (!gp) {
            return;
        }

        if (!initialized) {
            // Set fallback video capture for face tracking when webcam is not available
            if (typeof (faceDataProvider as any).setFallbackCapture === 'function') {
                (faceDataProvider as any).setFallbackCapture(fallbackVideo);
            }

            await faceDataProvider.init();
            world.complete();

            world.addPanel({
                type: ELEMENT_TYPES.PANEL,
                parentId: 'bigBox',
                id: 'videoPanel',
                width: VIDEO.width,
                height: VIDEO.height,
                mirrorTextureHorizontal: true,
                position: { x: -SIDE, y: 0, z: 0 },
                // The whole camera frame, straight from the camera: the panel keeps the video's
                // own aspect (the default "contain" fit), so nothing is cut off.
                video: createVideoSelector(fallbackVideo),
                fillColor: COLORS.white,
            });

            initialized = true;
            game = new EmotionGame(performance.now() / 1000);
            return;
        }

        if (config.paused && !world.isPaused()) {
            world.pause();
            fallbackVideo.pause();
            // Don't clear background - keep last frame visible
            return;
        } else if (!config.paused && world.isPaused()) {
            world.resume();
            fallbackVideo.loop();
        }

        // Transparent, so the parade behind the canvas shows where nothing is drawn.
        p.clear();
        const result = await world.step(gp);
        const now = performance.now() / 1000;
        const target = game?.target;
        const event = game?.update(now, currentShape !== null && matchesTarget(game.target.id, currentShape));
        if ((event === 'scored' || event === 'timeout') && target) takeSnapshot(target, event === 'scored');
        if (event === 'scored' && target) startParade(target.emoji);
        if (event && game?.over) void showGallery();
        updateHud(now);
        if (!result.running) return;
        } finally {
            rendering = false;
        }
    };

    return world;
}
