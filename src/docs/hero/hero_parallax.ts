import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { HeadTrackingDataProvider } from "../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../scene/providers/web_cam_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, LOOK_MODES, STANDARD_PROJECTION_IDS, type CarModifier, type ResolvedProjectionWithGlobals, type ResolutionContext, type ColorRGBA, type Vector3, type DampingValue, type SceneUnits, type VideoPixels} from "../../scene/types.ts";
import { DEFAULT_SKETCH_CONFIG, type SketchConfig } from "../tutorial/sketch_config.ts";
import type { FaceConfig, P5SketchExtraArgs } from "../tutorial/sketch_engine.types.ts";
import { WorldSettings } from "../../scene/world_settings.ts";
import { HEAD_TRACKED_PRESET } from "../../scene/presets.ts";
import { HeadTrackingModifier } from "../../scene/modifiers/head_tracking_modifier.ts";
import { COLORS } from "../../scene/colors.ts";
import { appAssetPath } from "../../utils/app_paths.ts";
import { FollowEffect } from "../../scene/effects/follow_effect.ts";
import { LookAtEffect } from "../../scene/effects/look_at_effect.ts";

/**
 * MAIN DEMO: 3D Parallax Depth
 *
 * A painting split into layers and placed at different depths. As your head moves (webcam
 * head tracking, or the mouse / wheel / keys as a fallback) the camera moves with it, and
 * near layers shift more than far ones - that difference is the parallax.
 *
 * HOW TO READ THIS FILE
 *   1. World and camera rig ......... engine setup, the head-tracked camera
 *   2. Controls and limits .......... keys, start position, zoom and side limits
 *   3. Far scenery (moves with you) . mountain boxes 01-03
 *   4. Artwork layers (fixed) ....... layers 04-11 and the post light
 *   5. Title ........................ fill + outline, tinted by distance
 *   6. Floor and roof
 *   7. Canvas, input and draw loop
 *
 * COORDINATES (p5 WEBGL): +x right, +y DOWN, -z away from you. One unit is roughly one
 * pixel of artwork, so most fixed layers use their image's own size. The eye rests at
 * (0, 60, 150) and can travel in depth from z 250 (max zoom out) to z -1100.
 *
 * THREE WAYS A LAYER MOVES
 *   - Follows the camera fully (layers 01/02, floor, roof): always the same distance
 *     away, like the sky and far mountains. They stop following together past a bound
 *     (mountainFollowBounds), so they never slide into the fixed layers in front.
 *   - Follows the camera sideways only (layer 03): fixed depth, so it shows some
 *     parallax as you lean in and out.
 *   - Fixed in space (layers 04-11, title, post light): the strongest parallax.
 *
 * RULES FOR EVERY LAYER (src/docs/hero/hero_parallax.test.ts checks the first two)
 *   - Panels that overlap on screen must not share a z: equal depths flicker
 *     (z-fighting). Even a 3-10 unit difference is enough.
 *   - The camera-following group must stay rigid and behind layer 03.
 *   - Textured panels use alphaCutoff: 0.5 so their transparent pixels never hide what
 *     is behind them, whatever the draw order.
 *   - Pieces meant to fit together must move the same way (follow vs fixed, tilting vs
 *     upright); mixing them is what opens gaps at the seams.
 *
 * DEBUGGING: on localhost the console has `heroDebug.setHead({ x, y, z })`, `release()`
 * and `projections()` - see section 1.
 */
export const heroParallaxExplanation = `
<p>3D parallax depth, head-tracked. If no camera is available, move the pointer over the canvas and scroll to change depth, use the arrow keys to look around, or W / S to zoom in and out.</p>
`;

export async function heroParallax(
    p: p5,
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    extraArgs?: { faceConfig?: FaceConfig; faceDataProvider?: HeadTrackingDataProvider; webCamProvider?: WebCamDataProvider } & P5SketchExtraArgs,
): Promise<World<P5Bundler, any, any, { webCam: WebCamDataProvider; headTracker: HeadTrackingDataProvider }>> {
    const clock = config.clock ?? new SceneClock({
        ...DEFAULT_SCENE_SETTINGS,
        startPaused: config.paused,
        debug: false,
        playback: {
            ...DEFAULT_SCENE_SETTINGS.playback,
            duration: 10000,
            isLoop: true
        },
    });

    const faceConfig = extraArgs?.faceConfig;
    let webCamProvider = extraArgs?.webCamProvider;
    webCamProvider = webCamProvider ?? new WebCamDataProvider(p, 640, 480);

    let faceDataProvider = extraArgs?.faceDataProvider;
    faceDataProvider = faceDataProvider ?? new HeadTrackingDataProvider(p,
        {
            ...faceConfig,
            baselineHeadPixels: 120 as VideoPixels,
            baselineHeadSceneUnits: 180 as SceneUnits,
            baseline: {x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits},
            cameraPosition: {x: 0 as SceneUnits, y: 0 as SceneUnits, z: 300 as SceneUnits},
        }
    );

    const loader = new P5AssetLoader(p);
    const dataProviderLib: { webCam: WebCamDataProvider; headTracker: HeadTrackingDataProvider } = {
        webCam: webCamProvider,
        headTracker: faceDataProvider,
    };
    const world = new World<P5Bundler, any, any, { webCam: WebCamDataProvider; headTracker: HeadTrackingDataProvider }>(
        WorldSettings.fromLibs({
            clock,
            loader,
            dataProviderLib,
            elementEffectLib: { follow: FollowEffect, look_at: LookAtEffect },
        })
    );

    // ── 1. World and camera rig ────────────────────────────────────────────────────

    world.startLoading();
    world.enableDefaultPerspective(config.width, config.height, Math.PI / 4, true);

    if (config.paused) {
        world.pause();
    }

    // The camera rig from tutorial-9: a 'head' that moves with your tracked head, an 'eye'
    // 100 in front of it, and a 'screen' it looks at. 'head' uses ROTATION mode (instead of
    // the preset's LOOK_AT) so turning - head rotation and arrow keys - pivots the view.
    world.loadPreset({
        ...HEAD_TRACKED_PRESET,
        projectors: HEAD_TRACKED_PRESET.projectors.map(projector =>
            projector.id === 'head'
                ? {
                    id: projector.id,
                    type: projector.type,
                    position: projector.position,
                    direction: projector.direction,
                    lookMode: LOOK_MODES.ROTATION,
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                }
                : projector
        ),
    });

    // Head position from the mouse / wheel, used when no face is tracked.
    const pointer = { x: 0, y: 0, z: 0 };
    // Debug hook (localhost only), from the browser console:
    //   heroDebug.setHead({ x: 0, y: 10, z: 515 })  place the head exactly; overrides tracking
    //   heroDebug.release()                         hand control back to head tracking
    //   heroDebug.projections()                     head / eye / screen world positions
    // Use it to reproduce a reported view. Keep the mouse off the canvas while it's set.
    let debugHeadOverride = false;
    // A hostname check, not import.meta.env.DEV: this source also runs as the Code tab's
    // editable sketch (compiled via new Function), where import.meta is a syntax error.
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        (window as Window & { heroDebug?: unknown }).heroDebug = {
            setHead: (position: Partial<Vector3>) => {
                debugHeadOverride = true;
                Object.assign(pointer, position);
            },
            release: () => { debugHeadOverride = false; },
            // Resolved global positions of the camera rig, e.g. to see where the render
            // camera (eye -> looking at screen) actually is.
            projections: () => Object.fromEntries(
                [...(world.getCurrenState()?.projections ?? new Map()).entries()].map(([id, projection]) => {
                    const { x, y, z } = projection.globalPosition ?? projection.position;
                    return [id, { x: Math.round(x), y: Math.round(y), z: Math.round(z) }];
                }),
            ),
        };
    }
    let canvasElement: HTMLElement | undefined;
    let initialized = false;
    let lastStatus = '';
    const announceStatus = (message: string) => {
        if (message === lastStatus) return;
        lastStatus = message;
        canvasElement?.dispatchEvent(new CustomEvent('observerstatus', { bubbles: true, detail: message }));
    };
    // Head tracking turns the camera by the face's angle x damping (0.1), so even a large
    // head turn only turns the view ~0.1 rad - the arrow keys are limited to match.
    const headModifier = new HeadTrackingModifier({
        disableRotation: false,
        damping: 0.1 as DampingValue,
    });
    // ── 2. Controls and limits ──────────────────────────────────────────────────────
    // Arrow keys turn, W / S zoom. Keys held right now (filled by the listeners in section
    // 7) are read once per frame by the observer modifier below.
    const pressedKeys: Record<string, boolean> = {};
    // Arrow keys turn at most 0.1 rad - the same range head tracking reaches.
    const keyRotationSpeed = 0.005;
    const maxKeyRotation = 0.1;
    // Total left/right turn cap (15deg, head + keys): layer-11, the foreground frame, only
    // covers the view up to this turn - see the side limit below.
    const maxYaw = 0.26;
    let keyYaw = 0;
    let keyPitch = 0;
    // W / S zoom: a depth offset added to the head in placeHead (before the zoom limits), so
    // it adds to head tracking or the wheel and can never pass the limits.
    const keyZoomSpeed = 8;
    let keyZoom = 0;
    const resolveKeyZoom = () => {
        // Kept within the reachable range (from head z 50: -1200 .. 150), so holding a key
        // past a limit doesn't build up an offset you'd have to hold the other key to undo.
        if (pressedKeys.KeyW) keyZoom = Math.max(-1250, keyZoom - keyZoomSpeed);
        if (pressedKeys.KeyS) keyZoom = Math.min(100, keyZoom + keyZoomSpeed);
    };
    const resolveKeyRotation = () => {
        if (pressedKeys.ArrowLeft) keyYaw = Math.max(-maxKeyRotation, keyYaw - keyRotationSpeed);
        if (pressedKeys.ArrowRight) keyYaw = Math.min(maxKeyRotation, keyYaw + keyRotationSpeed);
        if (pressedKeys.ArrowUp) keyPitch = Math.max(-maxKeyRotation, keyPitch - keyRotationSpeed);
        if (pressedKeys.ArrowDown) keyPitch = Math.min(maxKeyRotation, keyPitch + keyRotationSpeed);
        return { yaw: keyYaw, pitch: keyPitch, roll: 0 };
    };
    // Where the camera starts: added to every head position (tracked, mouse or debug). The
    // eye sits 100 in front of the head, so the resting eye is at (0, 60, 150) - a bit
    // lower than the tracker origin and 100 in front of the max zoom out.
    const startHeadOffset = { x: 0, y: 60, z: 50 };
    // Depth (zoom) limits on the head, applied in placeHead to every input:
    //   - Zoom out stops at head z 150 (eye z 250): layer-11 is sized to frame the view from
    //     there, and any further back would show its edges.
    //   - Zoom in stops at head z -1200 (eye z -1100): you fly through the layers - each
    //     grows as you approach and vanishes as you pass - ending just past the title
    //     (z -1000) and before layer-05 (z -1200).
    // headDepthGain doubles head movement in depth, so the fly-through is reachable by
    // actually leaning in.
    const headDepthGain = 2;
    const maxZoomOutHeadZ = 150;
    const maxZoomInHeadZ = -1200;
    // Turns a raw head position into the camera's head position: adds the start offset and
    // key zoom, then applies the zoom limits and the side limit.
    // Side limit: layer-11's edges are 825 either side of center (at z -300). A view
    // (35.8deg half-width) turned the full 15deg reaches distance x 1.23 sideways
    // (tan 50.8deg), so the head may move 825 - distance x 1.23 sideways - tight when far
    // back (~270 at the start), loose when close, unlimited once past layer-11.
    const placeHead = (position: Vector3): Vector3 => {
        const z = Math.min(maxZoomOutHeadZ, Math.max(maxZoomInHeadZ, startHeadOffset.z + position.z * headDepthGain + keyZoom));
        const distanceToLayer11 = z + 100 + 300;
        const maxSide = 825 - distanceToLayer11 * 1.23;
        return {
            x: Math.max(-maxSide, Math.min(maxSide, position.x + startHeadOffset.x)),
            y: position.y + startHeadOffset.y,
            z,
        };
    };
    const clampYaw = (yaw: number) => Math.max(-maxYaw, Math.min(maxYaw, yaw));
    // The camera's position each frame: head tracking when a face is tracked, otherwise the
    // mouse / wheel; either way passed through placeHead and combined with the arrow keys.
    const observerModifier: CarModifier<typeof dataProviderLib> = {
        name: 'Head tracking with pointer fallback',
        active: true,
        priority: 10,
        requiredDataProviders: [],
        tick: sceneId => headModifier.tick(sceneId),
        getCarPosition: (position, context) => {
            // Keys are read every frame, so they also work on top of head tracking.
            const keyRotation = resolveKeyRotation();
            resolveKeyZoom();
            if (context.dataProviders.headTracker && !debugHeadOverride) {
                announceStatus('Head tracking on - move your head to look around.');
                const result = headModifier.getCarPosition(position, context);
                if (!result.success) return result;
                return {
                    success: true,
                    value: {
                        ...result.value,
                        position: placeHead(result.value.position),
                        rotation: {
                            yaw: clampYaw((result.value.rotation?.yaw ?? 0) + keyRotation.yaw),
                            pitch: (result.value.rotation?.pitch ?? 0) + keyRotation.pitch,
                            roll: result.value.rotation?.roll ?? 0,
                        },
                    },
                };
            }
            const cameraReady = webCamProvider?.getStatus?.() === 'READY';
            announceStatus(!initialized
                ? 'Head tracking is loading - meanwhile, move the mouse to look around; scroll or W / S to zoom.'
                : cameraReady
                    ? 'No face found - move the mouse to look around; scroll or W / S to zoom.'
                    : 'Camera unavailable - move the mouse to look around; scroll or W / S to zoom.');
            return { success: true, value: { name: 'Pointer fallback', position: placeHead(pointer), rotation: keyRotation } };
        },
    };
    world.addModifierToProjection('head', observerModifier, 'car');

    // ── 3. Far scenery (moves with you) ─────────────────────────────────────────────
    // Three nested "boxes" - a backdrop with two side walls each:
    //   01 the sunset sky, 02 the mountains, 03 the far village.
    // 01 and 02 follow the camera's position (not its rotation), so they stay the same
    // distance away like real distant scenery; 02 and 03 are 0.9x and 0.8x copies of 01's
    // box geometry, so all three line up. All backdrops share layer-02's proportions.
    const mountainWidth = 1603;
    const mountainHeight = 847;

    const mountainBackdropWidth = 4000;
    const mountainBackdropHeight = mountainBackdropWidth * mountainHeight / mountainWidth;
    const mountainBackdropDistance = -2500;
    // Layers 01/02 follow the camera in depth but layer 03 doesn't, so leaning back would
    // slide 02 onto 03 and they'd flicker. This bound stops everything that follows the
    // camera (boxes 01/02, floor, roof) together, at least mountainMinGap behind layer 03.
    // Sharing one bound keeps the group rigid - if one piece kept following, its seams
    // would open.
    const mountainMinGap = 100;
    const mountainFollowBounds = {
        max: { z: mountainBackdropDistance * 0.8 - mountainBackdropDistance * 0.9 - mountainMinGap },
    };
    world.addPanel({
        id: 'mountain-backdrop-01',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainBackdropWidth,
        height: mountainBackdropHeight,
        // Raised 450 so the sky's top edge stays above the view, even at max zoom out.
        position: { x: 0, y: -450, z: mountainBackdropDistance },
        texture: { path: appAssetPath('img/hero/layer-01.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } },
        ],
    });
    world.addPanel({
        id: 'mountain-backdrop-02',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainBackdropWidth * 0.9,
        height: mountainBackdropHeight * 0.9,
        position: { x: 400, y: -400, z: mountainBackdropDistance * 0.9 },
        texture: { path: appAssetPath('img/hero/layer-02.png'), width: mountainWidth , height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } },
        ],
    });

    // Side walls: the same artwork, hinged on each backdrop edge and splayed 45deg toward
    // you like an open stage set, so turning or moving sideways doesn't reveal empty space.
    // They follow the camera exactly like their backdrop, so each box moves as one piece.
    const mountainSideDepth = 3000;
    const mountainBackdropHalfWidth = mountainBackdropWidth / 2;
    // Fold angle off the backdrop's edge: 0 = flat continuation, PI/2 = square box. The
    // wall's center sits half a wall along the folded direction from its hinge (yaw is
    // p5's rotateY: local +x -> (cos, -sin) in x/z).
    const mountainSideFold = Math.PI / 4;
    // Each wall reaches 20 past its hinge, tucked behind the backdrop: two panels that only
    // share an edge leave a hairline crack (each transform rounds differently).
    const mountainSeamOverlap = 20;
    const mountainSideLength = mountainSideDepth + mountainSeamOverlap;
    const mountainSideCenterOffset = (mountainSideDepth - mountainSeamOverlap) / 2;
    const mountainSideX = mountainBackdropHalfWidth + mountainSideCenterOffset * Math.cos(mountainSideFold);
    const mountainSideZ = mountainBackdropDistance + mountainSideCenterOffset * Math.sin(mountainSideFold);
    const mountainSideLeftYaw = mountainSideFold - Math.PI;
    const mountainSideRightYaw = Math.PI - mountainSideFold;

    world.addPanel({
        id: 'mountain-backdrop-01-left',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainSideLength,
        height: mountainBackdropHeight,
        position: { x: -mountainSideX, y: -450, z: mountainSideZ },
        rotate: { pitch: 0, yaw: mountainSideLeftYaw, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-01.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } },
        ],
    });

    world.addPanel({
        id: 'mountain-backdrop-02-left',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainSideLength * 0.9,
        height: mountainBackdropHeight * 0.9,
        position: { x: -mountainSideX * 0.9, y: 0, z: mountainSideZ * 0.9 },
        rotate: { pitch: 0, yaw: mountainSideLeftYaw, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-02.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } },
        ],
    });

    world.addPanel({
        id: 'mountain-backdrop-01-right',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainSideLength,
        height: mountainBackdropHeight,
        position: { x: mountainSideX, y: -450, z: mountainSideZ },
        rotate: { pitch: 0, yaw: mountainSideRightYaw, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-01.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } },
        ],
    });

    world.addPanel({
        id: 'mountain-backdrop-02-right',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainSideLength * 0.9,
        height: mountainBackdropHeight * 0.9,
        position: { x: mountainSideX * 0.9, y: 0, z: mountainSideZ * 0.9 },
        rotate: { pitch: 0, yaw: mountainSideRightYaw, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-02.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } },
        ],
    });

    // Layer 03 - the far village, at 0.8x. Unlike 01/02 it follows the camera sideways
    // only (axis z: false): its depth is fixed, so leaning in and out brings it closer and
    // further - nearer scenery with some parallax.
    const layer03Width = 1234;
    const layer03Height = 669;

    world.addPanel({
        id: 'mountain-backdrop-03',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainBackdropWidth * 0.8,
        height: mountainBackdropHeight * 0.8,
        position: { x: -100, y: -400, z: mountainBackdropDistance * 0.8 },
        texture: { path: appAssetPath('img/hero/layer-03.png'), width: layer03Width, height: layer03Height },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', axis: { x: true, y: true, z: false } } },
        ],
    });

    world.addPanel({
        id: 'mountain-backdrop-03-left',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainSideLength * 0.8,
        height: mountainBackdropHeight * 0.8,
        position: { x: -100 + -mountainSideX * 0.8, y: -200, z: mountainSideZ * 0.8 },
        rotate: { pitch: 0, yaw: mountainSideLeftYaw, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-03.png'), width: layer03Width, height: layer03Height },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', axis: { x: true, y: true, z: false } } },
        ],
    });

    world.addPanel({
        id: 'mountain-backdrop-03-right',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: mountainSideLength * 0.8,
        height: mountainBackdropHeight * 0.8,
        position: { x: mountainSideX * 0.8, y: 0, z: mountainSideZ * 0.8 },
        rotate: { pitch: 0, yaw: mountainSideRightYaw, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-03.png'), width: layer03Width, height: layer03Height },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', axis: { x: true, y: true, z: false } } },
        ],
    });

    // ── 4. Artwork layers (fixed in space) ──────────────────────────────────────────
    // Plain panels with no follow effect, mostly at their image's own size. Nearer layers
    // move more as you move - that's where the strongest parallax comes from. Every
    // overlapping pair needs its own z (see the rules at the top).

    // Layer 04 - land and houses, left of center. The mirrored copy (10 behind, so the seam
    // can't flicker) extends it further left.
    world.addPanel({
        id: 'layer-04',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 696,
        height: 507,
        position: { x:  -350, y: 50, z: -800 },
        texture: { path: appAssetPath('img/hero/layer-04.png'), width: 696, height: 507 },
    });
    world.addPanel({
        id: 'layer-04-mirror',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 696,
        height: 507,
        mirrorTextureHorizontal: true,
        position: { x:  -350 - 696, y: 50, z: -810 },
        texture: { path: appAssetPath('img/hero/layer-04.png'), width: 696, height: 507 },
    });

    // Layer 05 - the right-hand house and land, with a mirrored copy extending it right.
    world.addPanel({
        id: 'layer-05',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 908,
        height: 565,
        position: { x: 550, y: 50, z: -1200 },
        texture: { path: appAssetPath('img/hero/layer-05.png'), width: 908, height: 565 },
    });
    world.addPanel({
        id: 'layer-05-mirror',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 908,
        height: 565,
        mirrorTextureHorizontal: true,
        position: { x: 550 + 908, y: 50, z: -1210 },
        texture: { path: appAssetPath('img/hero/layer-05.png'), width: 908, height: 565 },
    });

    // Layer 06 - the tall tree, right of center, in front of the 04/05 land.
    world.addPanel({
        id: 'layer-06',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 221,
        height: 813,
        position: { x: 250, y: 180, z: -650 },
        texture: { path: appAssetPath('img/hero/layer-06.png'), width: 221, height: 813 },
    });

    // Layers 07/08 - the nearest group: 07 the dark cliff house (left), 08 the waterfall land
    // (right). They overlap on screen, so 07 sits 20 behind 08 - as in the original, where
    // the land is drawn over the house.
    world.addPanel({
        id: 'layer-07',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 674,
        height: 594,
        position: { x: -250, y: 50, z: -420 },
        texture: { path: appAssetPath('img/hero/layer-07.png'), width: 674, height: 594 },
    });

    world.addPanel({
        id: 'layer-08',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 872,
        height: 302,
        position: { x: 470, y: 200, z: -400 },
        texture: { path: appAssetPath('img/hero/layer-08.png'), width: 872, height: 302 },
    });

    // Layers 09/10 - the crooked house and the lamp post, in the same nearest group.
    world.addPanel({
        id: 'layer-09',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 299,
        height: 495,
        position: { x: 460, y: 100, z: -680 },
        texture: { path: appAssetPath('img/hero/layer-09.png'), width: 299, height: 495 },
    });

    world.addPanel({
        id: 'layer-10',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 70,
        height: 309,
        mirrorTextureHorizontal: true,
        position: { x: -140, y: 0, z: -380 },
        texture: { path: appAssetPath('img/hero/layer-10.png'), width: 70, height: 309 },
    });

    // Post light - the lamp's lit lantern, laid over layer-10's lantern (~0.19x the image,
    // mirrored like the post, 3 in front of it).
    // It flickers by brightness (its tint), not alpha: with alphaCutoff, an alpha below 0.5
    // would make it vanish. Sines at unrelated speeds on the scene clock give a shimmer
    // (75-100%) that never visibly repeats, plus an occasional dip (~50%). Tune: 0.125 =
    // shimmer strength, 0.35 = dip depth, 0.92 = dip rarity. It pauses with the scene.
    const postLightBrightness = (seconds: number) => {
        const shimmer = 0.5 * Math.sin(seconds * 11) + 0.3 * Math.sin(seconds * 23.7) + 0.2 * Math.sin(seconds * 4.3);
        const dip = Math.sin(seconds * 1.7) * Math.sin(seconds * 2.9) > 0.92 ? 0.35 : 0;
        return 0.875 + 0.125 * shimmer - dip;
    };
    world.addPanel({
        id: 'post-light',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        fillColor: context => {
            const brightness = postLightBrightness(context.playback.now / 1000);
            return { red: Math.round(255 * brightness), green: Math.round(240 * brightness), blue: Math.round(210 * brightness) } as ColorRGBA;
        },
        width: 48,
        height: 41,
        mirrorTextureHorizontal: true,
        position: { x: -130, y: -135, z: -377 },
        texture: { path: appAssetPath('img/hero/post-light.png'), width: 255, height: 219 },
    });

    // Layer 11 - the foreground frame (ground across the bottom, tower on the right), the
    // nearest layer. Kept at the image's proportions but not its size: it's sized so its
    // edges (+-825) never come into view within the zoom, side and turn limits of section 2.
    // Resize it together with those limits.
    world.addPanel({
        id: 'layer-11',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 1650,
        height: 1177,
        position: { x: 0, y: -100, z: -300 },
        texture: { path: appAssetPath('img/hero/layer-11.png'), width: 1699, height: 1212 },
    });

    // ── 5. Title ────────────────────────────────────────────────────────────────────
    // Between layer-05 (z -1200) and the far village (layer-03, z -2000). Two panels: the
    // fill, and the outline 3 in front of it (white strokes, tinted) - enough to never
    // share a depth, too little to see.
    //
    // Both change colour as you approach: tintByCloseness returns a fillColor that blends
    // from `far` (the starting view, ~1150 away) to `near` (at the element), from the real
    // eye position - so head tracking, the wheel and W / S all drive it.
    const tintByCloseness = (far: ColorRGBA, near: ColorRGBA, elementZ: number) =>
        (context: ResolutionContext) => {
            const eye = context.projectionPool[STANDARD_PROJECTION_IDS.EYE] as ResolvedProjectionWithGlobals | undefined;
            const eyeZ = eye ? (eye.globalPosition ?? eye.position).z : 150;
            const closeness = Math.max(0, Math.min(1, 1 - (eyeZ - elementZ) / 1150));
            const blend = (from: number, to: number) => Math.round(from + (to - from) * closeness);
            return { red: blend(far.red, near.red), green: blend(far.green, near.green), blue: blend(far.blue, near.blue) } as ColorRGBA;
        };

    world.addPanel({
        id: 'parallax-title',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 820,
        height: 152,
        position: { x: 0, y: -270, z: -1000 },
        // White (the artwork as-is) to cyan; tinting the cream artwork reads as mint part-way.
        fillColor: tintByCloseness(
            { red: 255, green: 255, blue: 255 } as ColorRGBA,
            { red: 0, green: 255, blue: 255 } as ColorRGBA,
            -1000,
        ),
        texture: { path: appAssetPath('img/hero/parallax-title.png'), width: 700, height: 130 },
    });

    world.addPanel({
        id: 'parallax-title-outline',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        alphaCutoff: 0.5,
        width: 820,
        height: 152,
        position: { x: 0, y: -270, z: -997 },
        // Black to brown.
        fillColor: tintByCloseness(
            { red: 0, green: 0, blue: 0 } as ColorRGBA,
            { red: 139, green: 69, blue: 19 } as ColorRGBA,
            -997,
        ),
        texture: { path: appAssetPath('img/hero/parallax-outline.png'), width: 700, height: 130 },
    });

    // ── 6. Floor and roof ───────────────────────────────────────────────────────────
    // Floor (the water under the waterfall): its position is an offset from the camera's
    // view - ahead and below - and with followRotation it tilts with the view, so it always
    // reads as "the surface ahead of you". Note the roof below does NOT tilt.
    const floorForward = -600;
    const floorDrop = 400;
    world.addFloor({
        id: 'ground-floor',
        type: ELEMENT_TYPES.FLOOR,
        width: 6000,
        depth: 6000,
        position: { x: 0, y: floorDrop, z: floorForward },
        fillColor: COLORS.cyan,
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', followRotation: true, targetBounds: mountainFollowBounds } }
        ],
    });

    // Roof - a level ceiling in the sky colour, 2500 above the eye (high enough not to crop
    // the mountain tops). It follows position only, never rotation: the backdrops never
    // tilt, so a tilting roof would pull away from them and open a gap in the sky. Wide
    // enough to cover above the splayed walls.
    world.addFloor({
        id: 'roof',
        type: ELEMENT_TYPES.FLOOR,
        width: 12000,
        depth: 12000,
        position: { x: 0, y: -2500, z: floorForward },
        fillColor: {red: 100 * 1.5, green: 68 * 1.5  , blue: 97 * 1.5 },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', targetBounds: mountainFollowBounds } }
        ],
    });

    // ── 7. Canvas, input and draw loop ──────────────────────────────────────────────

    let gp: P5GraphicProcessor;

    // Mouse fallback: pointer position moves the head sideways / up-down, the wheel in depth.
    p.setup = () => {
        const canvas = p.createCanvas(config.width, config.height, p.WEBGL);
        canvasElement = canvas?.elt;
        canvasElement?.addEventListener('pointermove', event => {
            const bounds = canvasElement!.getBoundingClientRect();
            const pointerEvent = event as PointerEvent;
            pointer.x = Math.max(-150, Math.min(150, ((pointerEvent.clientX - bounds.left) / bounds.width - 0.5) * 300));
            pointer.y = Math.max(-100, Math.min(100, ((pointerEvent.clientY - bounds.top) / bounds.height - 0.5) * 200));
        });
        canvasElement?.addEventListener('wheel', event => {
            event.preventDefault();
            // -700..100 covers the full zoom range once doubled by headDepthGain.
            pointer.z = Math.max(-700, Math.min(100, pointer.z + (event as WheelEvent).deltaY * 0.25));
        }, { passive: false });
    };

    world.complete();

    // Every texture was requested as its panel was added above. Once they have all loaded,
    // the draw loop tells the page ('sceneready'), so it can drop its loading screen.
    let texturesLoaded = false;
    let readyAnnounced = false;
    const texturesReady = loader.waitForAllAssets().then(() => { texturesLoaded = true; });

    // Keyboard: record which keys are held (read each frame in section 2). Keys typed into
    // text fields - like the Code tab editor - are ignored, so typing never moves the camera.
    const isTyping = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        return !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    };
    window.addEventListener('keydown', (event: KeyboardEvent) => {
        if (isTyping(event)) return;
        if (event.key.startsWith('Arrow')) event.preventDefault();
        // Physical codes too (KeyW / KeyS) ignore Shift and keyboard layout, so a key can't
        // stay stuck when its key-up arrives as a different event.key.
        pressedKeys[event.key] = true;
        pressedKeys[event.code] = true;
    });
    window.addEventListener('keyup', (event: KeyboardEvent) => {
        pressedKeys[event.key] = false;
        pressedKeys[event.code] = false;
    });

    p.draw = async () => {
        if (config.paused && !world.isPaused()) {
            world.pause();
        } else if (!config.paused && world.isPaused()) {
            world.resume();
        }

        // Clear to the sky colour, not black: any view past the scene's edges reads as sky.
        p.background(145, 101, 148);
        if (gp) {
            const result = await world.step(gp);
            if (texturesLoaded && !readyAnnounced) {
                readyAnnounced = true;
                canvasElement?.dispatchEvent(new CustomEvent('sceneready', { bubbles: true }));
            }
            if (!result.running) return;
            // announceObserver(); // observer debug readout - see below
        }
    };

    // Optional debug readout of the eye position over the canvas, switched off. To enable:
    // uncomment this block, its call in p.draw, and the listener in hero.demo.ts.
    // // Debug readout: report the observer's (eye's) global position to the page, which
    // // shows it in the title. Only fires when the rounded position actually changes.
    // let lastObserverKey = '';
    // const announceObserver = () => {
    //     const eye = world.getCurrenState()?.projections.get(STANDARD_PROJECTION_IDS.EYE);
    //     if (!eye) return;
    //     const position = eye.globalPosition ?? eye.position;
    //     const observer = { x: Math.round(position.x), y: Math.round(position.y), z: Math.round(position.z) };
    //     const key = `${observer.x},${observer.y},${observer.z}`;
    //     if (key === lastObserverKey) return;
    //     lastObserverKey = key;
    //     canvasElement?.dispatchEvent(new CustomEvent('observerchange', { detail: observer, bubbles: true }));
    // };

    // Render right away - the scene shows as soon as its textures are in.
    gp = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);

    // Head tracking downloads ~13 MB (face model + WebAssembly), so it starts only once the
    // textures have loaded - on slow connections it would otherwise hold back the scene.
    // Nothing waits for it: the mouse, wheel and keys drive the camera until it's ready, and
    // keep doing so if the camera is unavailable.
    void texturesReady.then(async () => {
        try {
            await faceDataProvider.init();
        } catch (error) {
            console.warn('Camera unavailable; pointer controls remain active.', error);
        }
        initialized = true;
    });

    return world;
}
