import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { HeadTrackingDataProvider } from "../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../scene/providers/web_cam_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, LOOK_MODES, type CarModifier, type Vector3, type DampingValue, type SceneUnits, type VideoPixels} from "../../scene/types.ts";
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
 * Exact copy of tutorial-9's scene (boxes/targets/tunnel, same camera and head-tracking
 * modifier), plus keyboard-driven camera rotation (always on, additive on top of head
 * tracking) - tutorial-9 itself has no keyboard controls.
 */
export const heroParallaxExplanation = `
<p>3D parallax depth, head-tracked. If no camera is available, move the pointer over the canvas and scroll to change depth, or use the arrow keys to look around.</p>
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

    world.startLoading();
    world.enableDefaultPerspective(config.width, config.height, Math.PI / 4, true);

    if (config.paused) {
        world.pause();
    }

    // Same preset as tutorial-9, except 'head' switches to ROTATION mode (from the preset's
    // default LOOK_AT) so the keyboard-driven rotation below actually pivots the camera
    // instead of being ignored in favor of a fixed lookAt target.
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

    const pointer = { x: 0, y: 0, z: 0 };
    let canvasElement: HTMLElement | undefined;
    let initialized = false;
    let lastStatus = '';
    const announceStatus = (message: string) => {
        if (message === lastStatus) return;
        lastStatus = message;
        canvasElement?.dispatchEvent(new CustomEvent('observerstatus', { bubbles: true, detail: message }));
    };
    const headModifier = new HeadTrackingModifier({
        disableRotation: false,
        damping: 0.1 as DampingValue,
    });
    // Keyboard rotation - plain closure state, NOT routed through the engine's
    // ExternalStore (previousStore/nextStore). Car/nudge/stick modifiers are resolved
    // in projection_resolver.ts with a hardcoded `{ global: {} }` store on every call
    // (see `resolve()` there), so anything written to the real ExternalStore via
    // getExternalStore() is invisible to a CarModifier's context - it never carries
    // keyboard (or any other externally-synced) state. Tracking it here directly
    // sidesteps that engine bug for this one modifier.
    const pressedKeys: Record<string, boolean> = {};
    const keyRotationSpeed = 0.03;
    const maxKeyPitch = Math.PI / 3;
    let keyYaw = 0;
    let keyPitch = 0;
    const resolveKeyRotation = () => {
        if (pressedKeys.ArrowLeft) keyYaw -= keyRotationSpeed;
        if (pressedKeys.ArrowRight) keyYaw += keyRotationSpeed;
        if (pressedKeys.ArrowUp) keyPitch = Math.max(-maxKeyPitch, keyPitch - keyRotationSpeed);
        if (pressedKeys.ArrowDown) keyPitch = Math.min(maxKeyPitch, keyPitch + keyRotationSpeed);
        return { yaw: keyYaw, pitch: keyPitch, roll: 0 };
    };
    const observerModifier: CarModifier<typeof dataProviderLib> = {
        name: 'Head tracking with pointer fallback',
        active: true,
        priority: 10,
        requiredDataProviders: [],
        tick: sceneId => headModifier.tick(sceneId),
        getCarPosition: (position, context) => {
            // Read every frame regardless of branch, so arrow-key rotation always works
            // (including on top of head tracking) - makes debugging the scene much easier
            // than having to disable the camera first.
            const keyRotation = resolveKeyRotation();
            if (context.dataProviders.headTracker) {
                announceStatus('Head tracking active.');
                const result = headModifier.getCarPosition(position, context);
                if (!result.success) return result;
                return {
                    success: true,
                    value: {
                        ...result.value,
                        rotation: {
                            yaw: (result.value.rotation?.yaw ?? 0) + keyRotation.yaw,
                            pitch: (result.value.rotation?.pitch ?? 0) + keyRotation.pitch,
                            roll: result.value.rotation?.roll ?? 0,
                        },
                    },
                };
            }
            const cameraReady = webCamProvider?.getStatus?.() === 'READY';
            announceStatus(cameraReady
                ? 'No face detected. Move the mouse to look around and scroll to change depth.'
                : initialized
                    ? 'Camera unavailable. Move the mouse to look around and scroll to change depth.'
                    : 'Starting camera. Mouse and scroll controls are active.');
            return { success: true, value: { name: 'Pointer fallback', position: { ...pointer }, rotation: keyRotation } };
        },
    };
    world.addModifierToProjection('head', observerModifier, 'car');

    const floorY = 200;

    // for (let i = 0; i < 25; i++) {
    //     world.addBox({
    //         id: `tunnel-${i}`,
    //         type: ELEMENT_TYPES.BOX,
    //         width: config.width,
    //         height: config.height,
    //         depth: 10,
    //         strokeWidth: 4,
    //         strokeColor: {red: (255 - i * 10), green: (255 - i * 10), blue: (255 - i * 10)},
    //         position: { x: 0, y: 50, z: -60 * i },
    //     });
    // }

    var counter = 0;
    function createTarget(pos: Vector3) {

        const targetSize = 10;

        counter++;
        world.addBox({
            id: `target-${counter}`,
            type: ELEMENT_TYPES.BOX,
            position: pos,
            width: 100
        });
        world.addCylinder({
            id: `target-circle-${counter}`,
            parentId: `target-${counter}`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: targetSize / 10,
            height: 1,
            position: {x: 0, y: 50, z: -50},
            fillColor: COLORS.red,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: `target-circle-1-${counter}`,
            parentId: `target-${counter}`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: 8 * targetSize / 10,
            height: 1,
            position: {x: 0, y: 50, z: -49.9},
            fillColor: COLORS.white,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: `target-circle-2-${counter}`,
            parentId: `target-${counter}`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: 6 * targetSize / 10,
            height: 1,
            position: {x: 0, y: 50, z: -49.8},
            fillColor: COLORS.red,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: `target-circle-3-${counter}`,
            parentId: `target-${counter}`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: 4 * targetSize / 10,
            height: 1,
            position: {x: 0, y: 50, z: -49.7},
            fillColor: COLORS.white,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: `target-circle-4-${counter}`,
            parentId: `target-${counter}`,
            type: ELEMENT_TYPES.CYLINDER,
            radius: 2 * targetSize / 10,
            height: 1,
            position: {x: 0, y: 50, z: -49.6},
            fillColor: COLORS.red,
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
        world.addCylinder({
            id: `target-stick-${counter}`,
            parentId: `target-${counter}`,
            type: ELEMENT_TYPES.CYLINDER,
            height: 100,
            radius: 2 * targetSize / 10,
            position: {x: 0, y: 50, z: -100.1},
            fillColor: {red: 100, green: 0, blue: 0},
            rotate: {pitch: Math.PI / 2, yaw: 0, roll: 0}
        });
    }
    createTarget({x: 0, y: 0, z: 0});
    createTarget({x: -70, y: -10, z: 50});
    createTarget({x: 50, y: 10, z: 80});
    createTarget({x: 10, y: -80, z: 30});
    createTarget({x: 10, y: -200, z: 10});
    createTarget({x: -30, y: 30, z: 90});
    createTarget({x: 50, y: -50, z: 70});
    createTarget({x: -30, y: -20, z: 20});
    createTarget({x: -130, y: -120, z: 200});
    createTarget({x: 130, y: 120, z: 250});
    createTarget({x: 200, y: 200, z: 400});
    createTarget({x: -200, y: -200, z: 500});

    createTarget({x: -150, y: 0, z: 100});
    createTarget({x: 150, y: 0, z: 120});
    createTarget({x: 0, y: 150, z: 150});
    createTarget({x: 0, y: -150, z: 180});
    createTarget({x: -100, y: 100, z: 200});
    createTarget({x: 100, y: -100, z: 220});
    createTarget({x: -180, y: -50, z: 300});
    createTarget({x: 180, y: 50, z: 320});
    createTarget({x: 50, y: 180, z: 350});
    createTarget({x: -50, y: -180, z: 380});
    createTarget({x: -220, y: 100, z: 450});
    createTarget({x: 220, y: -100, z: 480});
    createTarget({x: 100, y: 200, z: 520});
    createTarget({x: -100, y: -200, z: 550});
    createTarget({x: 60, y: 0, z: -50});
    createTarget({x: -80, y: 50, z: -30});
    createTarget({x: 80, y: -50, z: -40});
    createTarget({x: 0, y: -100, z: -20});
    createTarget({x: 0, y: 100, z: -10});

    world.addBox({
        id: 'center-cube',
        type: ELEMENT_TYPES.BOX,
        width: 50,
        strokeWidth: 1,
        strokeColor: COLORS.white,
        position: { x: 0, y: floorY, z: 0 },
        fillColor: COLORS.red,
    });

    const mountainWidth = 1603;
    const mountainHeight = 847;
    const mountainPanelWidth = 150;
    const mountainPanelHeight = mountainPanelWidth * mountainHeight / mountainWidth;

    world.addPanel({
        id: 'left-cube',
        type: ELEMENT_TYPES.PANEL,
        width: mountainPanelWidth,
        height: mountainPanelHeight,
        position: { x: -150, y: floorY, z: -100 },
        texture: { path: appAssetPath('img/hero/layer-02.png'), width: mountainWidth, height: mountainHeight },
    });

    world.addPanel({
        id: 'right-cube',
        type: ELEMENT_TYPES.PANEL,
        width: mountainPanelWidth,
        height: mountainPanelHeight,
        position: { x: 150, y: floorY, z: -100 },
        texture: { path: appAssetPath('img/hero/layer-02.png'), width: mountainWidth, height: mountainHeight },
    });

    // Mountain backdrop - a big distant panel of the same mountain artwork.
    // Plain `follow` (position only, no rotation tracking) keeps it a fixed
    // distance away as the observer moves, like real distant scenery, but it
    // does NOT re-center on wherever the camera is looking: panning/tilting
    // the view slides it toward the edge and out of frame like an actual
    // fixed landmark, instead of staying glued to the center of your gaze.
    const mountainBackdropWidth = 4000;
    const mountainBackdropHeight = mountainBackdropWidth * mountainHeight / mountainWidth;
    const mountainBackdropDistance = -2500;
    world.addPanel({
        id: 'mountain-backdrop-01',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        width: mountainBackdropWidth,
        height: mountainBackdropHeight,
        position: { x: 0, y: 0, z: mountainBackdropDistance },
        texture: { path: appAssetPath('img/hero/layer-01.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA' } },
        ],
    });
    world.addPanel({
        id: 'mountain-backdrop-02',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        width: mountainBackdropWidth * 0.9,
        height: mountainBackdropHeight * 0.9,
        position: { x: 0, y: 0, z: mountainBackdropDistance * 0.9 },
        texture: { path: appAssetPath('img/hero/layer-02.png'), width: mountainWidth , height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA' } },
        ],
    });

    // Side walls - same mountain artwork, folded 90 degrees off the backdrop's left/right
    // edges so they read as the side faces of a box around the observer. Each is mirrored
    // horizontally, so the edge touching the backdrop reflects it like a fold in a mirror,
    // instead of abruptly restarting the image. Same plain `follow` as the backdrop, so the
    // whole box stays rigidly together as the observer moves.
    const mountainSideDepth = 3000;
    const mountainBackdropHalfWidth = mountainBackdropWidth / 2;
    const mountainSideZ = mountainBackdropDistance + mountainSideDepth / 2;

    world.addPanel({
        id: 'mountain-backdrop-01-left',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        width: mountainSideDepth,
        height: mountainBackdropHeight,
        position: { x: -mountainBackdropHalfWidth, y: 0, z: mountainSideZ },
        rotate: { pitch: 0, yaw: -Math.PI / 2, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-01.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA' } },
        ],
    });

    world.addPanel({
        id: 'mountain-backdrop-02-left',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        width: mountainSideDepth * 0.9,
        height: mountainBackdropHeight * 0.9,
        position: { x: -mountainBackdropHalfWidth * 0.9, y: 0, z: mountainSideZ  * 0.9 },
        rotate: { pitch: 0, yaw: -Math.PI / 2, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-02.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA' } },
        ],
    });

    world.addPanel({
        id: 'mountain-backdrop-01-right',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        width: mountainSideDepth,
        height: mountainBackdropHeight,
        position: { x: mountainBackdropHalfWidth, y: 0, z: mountainSideZ },
        rotate: { pitch: 0, yaw: Math.PI / 2, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-01.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA' } },
        ],
    });

    world.addPanel({
        id: 'mountain-backdrop-02-right',
        type: ELEMENT_TYPES.PANEL,
        fitMode: 'fill',
        width: mountainSideDepth * 0.9,
        height: mountainBackdropHeight * 0.9,
        position: { x: mountainBackdropHalfWidth * 0.9, y: 0, z: mountainSideZ * 0.9 },
        rotate: { pitch: 0, yaw: Math.PI / 2, roll: 0 },
        mirrorTextureHorizontal: false,
        texture: { path: appAssetPath('img/hero/layer-02.png'), width: mountainWidth, height: mountainHeight },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA' } },
        ],
    });

    world.addBox({
        id: 'far-cube',
        type: ELEMENT_TYPES.BOX,
        width: 30,
        strokeWidth: 1,
        strokeColor: COLORS.white,
        position: { x: 0, y: floorY, z: -300 },
        fillColor: COLORS.cyan,
    });

    world.addBox({
        id: 'front-cube',
        type: ELEMENT_TYPES.BOX,
        width: 30,
        strokeWidth: 1,
        strokeColor: COLORS.white,
        position: { x: 0, y: floorY, z: -30 },
        fillColor: COLORS.purple,
    });

    // Ground floor - `position` is its local offset from the camera's own
    // view (forward + down), rotated by the camera's current orientation via
    // `followRotation`, so it always reads as "the ground ahead of you":
    // mostly underfoot when looking down, ahead and below when looking
    // forward. Far enough to feel distant, never receding out of view since
    // it's rigidly tied to wherever the observer is looking.
    const floorForward = -600;
    const floorDrop = 400;
    world.addFloor({
        id: 'ground-floor',
        type: ELEMENT_TYPES.FLOOR,
        width: 6000,
        depth: 6000,
        position: { x: 0, y: floorDrop, z: floorForward },
        // fillColor: { red: 55, green: 58, blue: 68 },
        fillColor: COLORS.cyan,
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', followRotation: true } }
        ],
    });

    // Roof - the floor mirrored above the observer (negative y is up in p5), textured with
    // the backdrop's mountain artwork instead of a flat color. Same camera-relative
    // `followRotation` follow, so it always reads as "overhead and ahead".
    world.addFloor({
        id: 'roof',
        type: ELEMENT_TYPES.FLOOR,
        width: 6000,
        depth: 6000,
        position: { x: 0, y: -floorDrop - 850, z: floorForward },
        fillColor: {red: 100 * 1.5, green: 68 * 1.5  , blue: 97 * 1.5 },
        effects: [
            { type: 'follow', settings: { follow: 'CAMERA', followRotation: true } }
        ],
    });

    let gp: P5GraphicProcessor;

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
            pointer.z = Math.max(-50, Math.min(100, pointer.z + (event as WheelEvent).deltaY * 0.25));
        }, { passive: false });
    };

    world.complete();

    // Keyboard controls - see the note above resolveKeyRotation for why these land in
    // a plain closure object (pressedKeys) rather than the engine's ExternalStore.
    window.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key.startsWith('Arrow')) event.preventDefault();
        pressedKeys[event.key] = true;
    });
    window.addEventListener('keyup', (event: KeyboardEvent) => {
        pressedKeys[event.key] = false;
    });

    p.draw = async () => {
        if (config.paused && !world.isPaused()) {
            world.pause();
        } else if (!config.paused && world.isPaused()) {
            world.resume();
        }

        p.background(20);
        if (gp) {
            const result = await world.step(gp);
            if (!result.running) return;
        }
    };

    try {
        await faceDataProvider.init();
    } catch (error) {
        console.warn('Camera unavailable; pointer controls remain active.', error);
    }
    initialized = true;
    gp = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);

    return world;
}
