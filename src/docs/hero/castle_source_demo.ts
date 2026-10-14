import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { HeadTrackingDataProvider } from "../../scene/providers/head_tracking_data_provider.ts";
import { WebCamDataProvider } from "../../scene/providers/web_cam_data_provider.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, type DampingValue, type SceneUnits, type VideoPixels} from "../../scene/types.ts";
import { DEFAULT_SKETCH_CONFIG, type SketchConfig } from "../tutorial/sketch_config.ts";
import type { FaceConfig, P5SketchExtraArgs } from "../tutorial/sketch_engine.types.ts";
import { WorldSettings } from "../../scene/world_settings.ts";
import { HEAD_TRACKED_PRESET } from "../../scene/presets.ts";
import { HeadTrackingModifier } from "../../scene/modifiers/head_tracking_modifier.ts";
import {appAssetPath} from "../../utils/app_paths.ts";

/**
 * EXPERIMENT: New castle source layers
 * 
 * Experience depth through head movement.
 */
export const castleSourceDemoExplanation = `
<p>Five image layers at different depths form the scene. Move your head to see the layers shift with perspective. If no face is tracked, move the pointer over the canvas and scroll to change depth.</p>
`;

export async function castleSourceDemo(
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

    const pointer = { x: 0, y: 0, z: 0 };
    const headModifier = new HeadTrackingModifier({
        disableRotation: false,
        damping: 0.1 as DampingValue,
    });
    const trackHead = headModifier.getCarPosition.bind(headModifier);
    headModifier.getCarPosition = (initialPosition, context) => {
        if (context.dataProviders.headTracker) return trackHead(initialPosition, context);
        return {
            success: true,
            value: { name: "Pointer fallback", position: { ...pointer }, rotation: { yaw: 0, pitch: 0, roll: 0 } },
        };
    };
    world.addModifierToProjection('head', headModifier, 'car');

    // Separate image panels create depth with the head-tracked camera.
    const referenceWidth = 2438;
    const referenceHeight = 1624;
    const sceneScale = 1920 / referenceWidth;
    const layers = [
        { file: 'castle-source-01.png', width: 2438, height: 1624, x: 0, y: 0 },
        { file: 'castle-source-03.png', width: 2109, height: 616, x: 237, y: 467 },
        { file: 'castle-source-05.png', width: 1550, height: 874, x: 488, y: 118 },
        { file: 'castle-source-07.png', width: 2086, height: 1035, x: 14, y: 521 },
        { file: 'castle-source-08.png', width: 1434, height: 767, x: 809, y: 813 },
    ];
    layers.forEach((layer, index) => {
        const z = -1000 + index * 250;
        const scale = sceneScale * (observerDistance - z) / observerDistance;
        world.addPanel({
            id: `castle-layer-${index}`,
            type: ELEMENT_TYPES.PANEL,
            width: layer.width * scale,
            height: layer.height * scale,
            position: {
                x: (layer.x + layer.width / 2 - referenceWidth / 2) * scale,
                y: (layer.y + layer.height / 2 - referenceHeight / 2) * scale,
                z,
            },
            texture: {
                path: appAssetPath(`img/castle/${layer.file}`),
                width: layer.width,
                height: layer.height,
            },
        });
    });

    let gp: P5GraphicProcessor;

    p.setup = () => {
        const canvas = p.createCanvas(config.width, config.height, p.WEBGL);
        canvas.elt.addEventListener('pointermove', (event: PointerEvent) => {
            const bounds = canvas.elt.getBoundingClientRect();
            pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 300;
            pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 200;
        });
        canvas.elt.addEventListener('wheel', (event: WheelEvent) => {
            event.preventDefault();
            pointer.z = Math.max(-80, Math.min(200, pointer.z + event.deltaY * 0.25));
        }, { passive: false });
    };

    world.complete();
    
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

    // Camera or model failure must leave the pointer-controlled scene usable.
    try {
        await faceDataProvider.init();
    } catch (error) {
        console.warn('Head tracking unavailable; using pointer controls.', error);
    }
    gp = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);

    return world;
}
