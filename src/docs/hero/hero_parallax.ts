import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { HeadTrackingDataProvider } from "../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../scene/providers/web_cam_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type CarModifier, type ColorRGBA, type DampingValue, type SceneUnits, type VideoPixels} from "../../scene/types.ts";
import { DEFAULT_SKETCH_CONFIG, type SketchConfig } from "../tutorial/sketch_config.ts";
import type { FaceConfig, P5SketchExtraArgs } from "../tutorial/sketch_engine.types.ts";
import { WorldSettings } from "../../scene/world_settings.ts";
import { HEAD_TRACKED_PRESET } from "../../scene/presets.ts";
import { HeadTrackingModifier } from "../../scene/modifiers/head_tracking_modifier.ts";
import {appAssetPath} from "../../utils/app_paths.ts";

/**
 * MAIN DEMO: 3D Parallax Depth
 * 
 * Experience depth through head movement.
 */
export const figcraftExplanation = `
<p>The original FigCraft layers form this scene, preserving their page positions at the reference viewpoint. Move your head to see the layers shift with perspective. If no face is tracked, move the pointer over the canvas and scroll to change depth.</p>
`;

export async function figcraftParallax(
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

    const observerDistance = 1600;
    const minimumZoom = 1.18;
    const farthestObserverDepth = observerDistance / minimumZoom - observerDistance;
    const nearestObserverDepth = -3500;
    const clampDepth = (depth: number) => Math.max(nearestObserverDepth, Math.min(farthestObserverDepth, depth));
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
            cameraPosition: {x: 0 as SceneUnits, y: 0 as SceneUnits, z: observerDistance as SceneUnits},
        }
    );

    const loader = new P5AssetLoader(p);
    const dataProviderLib: { webCam: WebCamDataProvider; headTracker: HeadTrackingDataProvider } = {
        webCam: webCamProvider,
        headTracker: faceDataProvider,
    };
    const world = new World<P5Bundler, any, any, { webCam: WebCamDataProvider; headTracker: HeadTrackingDataProvider }>(
        WorldSettings.fromLibs({ clock, loader, dataProviderLib })
    );
    
    world.startLoading();
    world.enableDefaultPerspective(config.width, config.height, Math.PI / 4, true);

    if (config.paused) {
        world.pause();
    }

    world.loadPreset({
        ...HEAD_TRACKED_PRESET,
        projectors: HEAD_TRACKED_PRESET.projectors.map(projector =>
            projector.id === 'eye'
                ? { ...projector, position: { x: 0, y: 0, z: observerDistance } }
                : projector
        ),
    });

    const pointer = { x: 0, y: 0, z: farthestObserverDepth };
    let observerDepth = farthestObserverDepth;
    let sceneBox: HTMLElement | null = null;
    const horizontalLimit = () => document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ? 60 : 150;
    const clampHorizontal = (x: number) => Math.max(-horizontalLimit(), Math.min(horizontalLimit(), x));
    const closeness = () => Math.max(0, Math.min(1,
        (farthestObserverDepth - observerDepth) / (farthestObserverDepth - nearestObserverDepth)
    ));
    const updateObserver = (depth: number) => {
        observerDepth = depth;
        sceneBox?.dispatchEvent(new CustomEvent('observerchange', {
            detail: { zoom: observerDistance / (observerDistance + depth), closeness: closeness() },
        }));
    };
    const headModifier = new HeadTrackingModifier({
        disableRotation: true,
        offsetMode: true,
        damping: 0.1 as DampingValue,
    });
    const trackHead = headModifier.getCarPosition.bind(headModifier);
    const observerModifier: CarModifier<{ webCam: WebCamDataProvider; headTracker: HeadTrackingDataProvider }> = {
        name: 'Demo observer',
        active: true,
        priority: 10,
        requiredDataProviders: [],
        tick: sceneId => headModifier.tick(sceneId),
        getCarPosition: (initialPosition: Parameters<typeof trackHead>[0], context: Parameters<typeof trackHead>[1]): ReturnType<typeof trackHead> => {
        if (context.dataProviders.headTracker) {
            const result = trackHead(initialPosition, context);
            if (result.success) {
                const position = result.value.position;
                updateObserver(clampDepth(farthestObserverDepth + position.z * 2));
                return {
                    ...result,
                    value: {
                        ...result.value,
                        position: {
                            x: clampHorizontal(position.x * 3),
                            y: Math.max(-250, Math.min(250, position.y * 3)),
                            z: clampDepth(farthestObserverDepth + position.z * 2),
                        },
                    },
                };
            }
        }
        updateObserver(pointer.z);
        return {
            success: true,
            value: { name: "Pointer fallback", position: { ...pointer, x: clampHorizontal(pointer.x) }, rotation: { yaw: 0, pitch: 0, roll: 0 } },
        };
        },
    };
    world.addModifierToProjection('head', observerModifier, 'car');

    // Separate image panels create depth with the head-tracked camera.
    const centerY = 217;
    const sceneScale = 1920 / 1641;
    // Full export bounds, including artwork outside component boxes.
    // panelWidth/panelHeight/panelX/panelY are the real world-space size and position each
    // layer needs at its z so it reads at its original composed size once perspective is
    // applied - baked ahead of time instead of recomputed from scratch on every load.
    // width/height (raw export pixels) stay separate: they describe the source texture, not
    // the panel geometry.
    const layers = [
        {"id": 304, "name": "layer6", "width": 1653.238, "height": 983.0, "z": -3000, "panelWidth": 5561.166215722121, "panelHeight": 3306.617915904936, "panelX": 22.26500914076792, "panelY": -502.8884826325411},
        {"id": 309, "name": "layer 5", "width": 1700.5, "height": 1098.904, "z": -2300, "panelWidth": 4849.6892138939675, "panelHeight": 3133.9858135283366, "panelX": -144.7349177330896, "panelY": 300.7406215722121},
        {"id": 357, "name": "layer4", "width": 1268.0, "height": 750.378, "z": -1600, "panelWidth": 2967.166361974406, "panelHeight": 1755.9119561243147, "panelX": -465.6672760511883, "panelY": 346.7676782449726},
        {"id": 403, "name": "layer3-left-land", "width": 719.197, "height": 506.5, "z": -900, "panelWidth": 1314.8025594149908, "panelHeight": 925.9597806215721, "panelX": -856.3098720292504, "panelY": 503.199268738574},
        {"id": 434, "name": "layer3-right-house", "width": 907.76, "height": 564.037, "z": -900, "panelWidth": 1659.5246800731259, "panelHeight": 1031.1462522851918, "panelX": 636.416819012797, "panelY": 511.9168190127971},
        {"id": 466, "name": "layer2-Left House", "width": 1482.0, "height": 711.433, "z": -350, "panelWidth": 2113.27239488117, "panelHeight": 1014.474844606947, "panelX": -96.96526508226691, "panelY": 398.864478976234},
        {"id": 497, "name": "layer2-right land", "width": 871.486, "height": 301.008, "z": -350, "panelWidth": 1242.7039853747715, "panelHeight": 429.2253016453382, "panelX": 532.9567458866545, "panelY": 725.106252285192},
        {"id": 508, "name": "layer2-Tree", "width": 221.0, "height": 813.0, "z": -750, "panelWidth": 379.7806215722121, "panelHeight": 1397.111517367459, "panelX": 703.7111517367459, "panelY": 124.58866544789764},
        {"id": 517, "name": "layer2-Right House", "width": 298.0, "height": 494.088, "z": -350, "panelWidth": 424.93601462522855, "panelHeight": 704.5496160877515, "panelX": 815.6489945155394, "panelY": 315.19985374771477},
        {"id": 559, "name": "layer2-post", "width": 69.5, "height": 309.0, "z": -350, "panelWidth": 99.10420475319927, "panelHeight": 440.6215722120658, "panelX": 591.4168190127971, "panelY": 390},
        {"id": 565, "name": "Layer1", "width": 1699.0, "height": 1212.0, "z": 0, "panelWidth": 1987.8610603290676, "panelHeight": 1418.0621572212067, "panelX": 40.36563071297989, "panelY": 301.86471663619744},
    ];
    layers.forEach((layer, index) => {
        world.addPanel({
            id: `figcraft-layer-${layer.id}`,
            renderOrder: layer.id === 508 ? 14.5 : 10 + index,
            depthTest: false,
            type: ELEMENT_TYPES.PANEL,
            width: layer.panelWidth,
            height: layer.panelHeight,
            position: {
                x: layer.panelX,
                y: layer.panelY,
                z: layer.z,
            },
            texture: {
                path: appAssetPath(`img/figcraft/layer-${layer.id}.png`),
                width: layer.width,
                height: layer.height,
            },
        });
    });

    world.addFloor({
        id: 'scene-floor',
        renderOrder: 0,
        type: ELEMENT_TYPES.FLOOR,
        width: 10000,
        depth: 7000,
        position: { x: 0, y: (900 - centerY) * sceneScale, z: -1000 },
        fillColor: { red: 158, green: 195, blue: 209 },
        strokeWidth: 0,
    });

    const titleZ = -1500;
    const titleScale = sceneScale * (observerDistance - titleZ) / observerDistance;
    world.addPanel({
        id: 'parallax-title',
        renderOrder: 13.5,
        depthTest: false,
        fillColor: () => ({ red: 255, green: Math.round(255 - closeness() * 25), blue: Math.round(255 - closeness() * 225) } as ColorRGBA),
        type: ELEMENT_TYPES.PANEL,
        width: 700 * titleScale,
        height: 130 * titleScale,
        position: { x: 0, y: (210 - centerY) * titleScale, z: titleZ },
        texture: { path: appAssetPath('img/figcraft/parallax-title.png'), width: 700, height: 130 },
    });

    world.addPanel({
        id: 'parallax-title-outline',
        type: ELEMENT_TYPES.PANEL,
        renderOrder: 13.6,
        depthTest: false,
        width: 700 * titleScale,
        height: 130 * titleScale,
        position: { x: 0, y: (210 - centerY) * titleScale, z: titleZ },
        texture: { path: appAssetPath('img/figcraft/parallax-outline.png'), width: 700, height: 130 },
        fillColor: () => ({ red: Math.round(closeness() * 139), green: Math.round(closeness() * 69), blue: Math.round(closeness() * 19) } as ColorRGBA),
    });
    const gp = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);

    p.setup = () => {
        const canvas = p.createCanvas(config.width, config.height, p.WEBGL);
        sceneBox = canvas.elt.parentElement;
        canvas.elt.addEventListener('pointermove', (event: PointerEvent) => {
            const bounds = canvas.elt.getBoundingClientRect();
            pointer.x = clampHorizontal(((event.clientX - bounds.left) / bounds.width - 0.5) * horizontalLimit() * 2);
            pointer.y = Math.max(-250, Math.min(250, ((event.clientY - bounds.top) / bounds.height - 0.5) * 500));
        });
        canvas.elt.addEventListener('wheel', (event: WheelEvent) => {
            event.preventDefault();
            pointer.z = clampDepth(pointer.z + event.deltaY * 0.25);
        }, { passive: false });
    };

    world.complete();
    
    let rendering = false;
    p.draw = async () => {
        if (rendering || config.paused) return;
        rendering = true;
        try {
            if (world.isPaused()) world.resume();
            p.background(20);
            await world.step(gp);
        } finally {
            rendering = false;
        }
    };

    // Camera or model failure must leave the pointer-controlled scene usable.
    try {
        await faceDataProvider.init();
    } catch (error) {
        console.warn('Head tracking unavailable; using pointer controls.', error);
    }
    return world;
}
