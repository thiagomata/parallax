import p5 from 'p5';
import { World } from "../../scene/world.ts";
import { P5GraphicProcessor } from "../../scene/p5/p5_graphic_processor.ts";
import { SceneClock } from "../../scene/scene_clock.ts";
import { P5AssetLoader, type P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import {DEFAULT_SCENE_SETTINGS, ELEMENT_TYPES, LOOK_MODES, type Alpha, type CarModifier, type ColorRGBA, type Vector3} from "../../scene/types.ts";
import { DEFAULT_SKETCH_CONFIG, type SketchConfig } from "../tutorial/sketch_config.ts";
import type { P5SketchExtraArgs } from "../tutorial/sketch_engine.types.ts";
import { WorldSettings } from "../../scene/world_settings.ts";
import { HEAD_TRACKED_PRESET } from "../../scene/presets.ts";

/**
 * SHOWROOM: Airplane Flight
 *
 * A small airplane flying through the clouds over the ocean. Steer with the mouse (or the arrow
 * keys): left / right turns, up / down dives and climbs. No head tracking for now.
 *
 * Everything lives in plain world coordinates (p5 WEBGL: +x right, +y DOWN, -z ahead at the
 * start). The clouds and the ocean never move. The airplane flies through the world along
 * its nose, and the camera sits behind and above its tail.
 *
 * HOW TO READ THIS FILE
 *   1. World and camera rig
 *   2. Flight ........ steering, the airplane's motion, the chase camera (once per frame)
 *   3. Airplane ...... an invisible parent box with its parts as children
 *   4. Clouds ........ fixed in the world, repeating every 6000 so the sky never runs out
 *   5. Islands ....... procedural: each ocean cell's island comes from its own position
 *   6. Ocean
 *   7. Canvas, input and draw loop
 */
export const airplaneFlightExplanation = `
<p>A small airplane flying through the clouds over the ocean. Move the pointer over the canvas to steer: left / right to turn, down to dive and up to climb. The arrow keys steer too.</p>
`;

export async function airplaneFlight(
    p: p5,
    config: SketchConfig = DEFAULT_SKETCH_CONFIG,
    extraArgs?: P5SketchExtraArgs,
): Promise<World<P5Bundler, any, any, {}>> {
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

    const loader = new P5AssetLoader(p);
    const world = new World<P5Bundler, any, any, {}>(
        WorldSettings.fromLibs({ clock, loader })
    );

    // ── 1. World and camera rig ────────────────────────────────────────────────────

    world.startLoading();
    // Plain perspective, not off-axis: the off-axis frustum is built from the eye-to-screen
    // offset in world axes, so once the camera turns with the airplane it reads that as a
    // sideways lean and skews the whole view. Near plane 5, not p5's 0.1: depth precision
    // falls off with distance / near, and at 0.1 the islands flicker against the sea at a
    // distance (nothing comes within 5 of the camera but a cloud you fly through, which
    // the whiteout covers).
    world.enableDefaultPerspective(config.width, config.height, Math.PI / 4, false, 5);

    if (config.paused) {
        world.pause();
    }

    // The hero's camera rig: a 'head', an 'eye' 100 behind it and a 'screen' 100 in front,
    // both turned with the head. ROTATION mode, so the head's yaw turns the view.
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

    // ── 2. Flight ───────────────────────────────────────────────────────────────────
    // Steering: the pointer's offset from the canvas center (-1..1 each way), plus the
    // arrow keys (full steering while held).
    //   - left / right: turn rate, up to 0.7 rad/s at the edge (a full turn in ~9 s),
    //     banking up to 1 rad (~57deg);
    //   - up / down: pitch rate, up to 0.8 rad/s at the edge - pointer high pulls the nose
    //     up and keeps pulling, so holding it flies a full loop (~8 s); pointer low pushes
    //     it down. Nothing levels it for you: bring the pointer back to the middle (a small
    //     dead zone there) to hold the nose where it is.
    // Steering eases in over ~0.3 s, so the airplane answers like something with weight.
    // The airplane flies 500 units per second along its nose.
    //
    // Angles: `heading` uses the camera rig's convention (positive turns RIGHT). p5's rotateY
    // turns the other way, so the airplane is drawn with yaw = -heading. Pitch is p5's: a
    // positive pitch points the nose down (+y), so it dives; it isn't wrapped, so past
    // +-PI/2 the airplane is upside down, and a loop adds 2 PI. Upside down (cos pitch < 0)
    // the heading turns the other way for the same steer, so "right" stays the pilot's right.
    //
    // The camera has weight. It eases (~0.5 s) toward a spot 400 behind the airplane along
    // its nose and 70 above it (the camera's own up), and looks along its own view - heading
    // trailing the airplane's by ~0.4 s, pitch by ~0.6 s. So when the nose comes up, that
    // spot swings down behind the airplane and the camera takes a moment to sink into it:
    // the airplane rises on screen, then the view tilts up after it - close to what the
    // pilot sees. The camera pitches all the way round with the airplane (its up vector is
    // set each frame, so a loop turns the view over), but never banks with it in a turn, so
    // the horizon stays level there.
    //
    // Sea level is y 0 (+y is down, so the sky is negative y). The airplane starts 1000
    // above it; below 10 it's in the water, and starts again 1000 up.
    const pressedKeys: Record<string, boolean> = {};
    const pointer = { x: 0, y: 0 };
    const startHeight = -1000;
    const flight = {
        lastNow: -1,
        position: { x: 0, y: startHeight, z: 0 } as Vector3,
        heading: 0,
        pitch: 0,
        bank: 0,
        steer: { x: 0, y: 0 },
        camera: { heading: 0, pitch: 0, position: null as Vector3 | null },
        splashUntil: -1,
        crash: 'water' as 'water' | 'island',
    };
    const clamp = (value: number, max: number) => Math.max(-max, Math.min(max, value));
    // The unit direction for a heading (camera convention, positive = right) and a p5 pitch
    // (positive = down) - the airplane's nose, or the camera's view.
    const viewDirection = (heading: number, pitch: number): Vector3 => ({
        x: Math.sin(heading) * Math.cos(pitch),
        y: Math.sin(pitch),
        z: -Math.cos(heading) * Math.cos(pitch),
    });
    // The camera's up, in world space: the airplane's local up (0, -1, 0) through p5's
    // rotateY(-heading), rotateX(pitch) at the camera's heading and pitch - (0, -1, 0) when
    // level, pointing back when it looks straight up, world down when upside down.
    const cameraUp = (): Vector3 => {
        const { heading, pitch } = flight.camera;
        return {
            x: Math.sin(pitch) * Math.sin(heading),
            y: -Math.cos(pitch),
            z: -Math.sin(pitch) * Math.cos(heading),
        };
    };
    // The rig's rotation that looks along a direction. The rig turns its view by yaw, then
    // pitches it about the WORLD x axis (src/scene/utils/projection_utils.ts rotateVector) -
    // so plain (heading, pitch) would twist once the view has turned. Solving rotateVector's
    // forward vector (sin yaw, cos yaw sin pitch, -cos yaw cos pitch) = direction gives:
    const rigRotation = (direction: Vector3) => ({
        yaw: Math.asin(clamp(direction.x, 1)),
        pitch: Math.atan2(direction.y, -direction.z),
        roll: 0,
    });

    const updateFlight = (now: number) => {
        if (now === flight.lastNow) return;
        const dt = flight.lastNow < 0 ? 0 : Math.min(100, Math.max(0, now - flight.lastNow));
        flight.lastNow = now;

        // Steering in -1..1, eased over ~0.3 s.
        const keyX = (pressedKeys.ArrowRight ? 1 : 0) - (pressedKeys.ArrowLeft ? 1 : 0);
        const keyY = (pressedKeys.ArrowDown ? 1 : 0) - (pressedKeys.ArrowUp ? 1 : 0);
        const ease = 1 - Math.exp(-dt / 300);
        const deadZone = (value: number) => Math.abs(value) < 0.1 ? 0 : value;
        flight.steer.x += (clamp(pointer.x + keyX, 1) - flight.steer.x) * ease;
        flight.steer.y += (clamp(deadZone(pointer.y) + keyY, 1) - flight.steer.y) * ease;

        const upright = Math.cos(flight.pitch) >= 0 ? 1 : -1;
        flight.heading += flight.steer.x * 0.0007 * dt * upright;
        flight.pitch += flight.steer.y * 0.0008 * dt;
        flight.bank = flight.steer.x * 1.0;

        // Forward along the nose, 500 units per second.
        const nose = viewDirection(flight.heading, flight.pitch);
        const speed = 0.5 * dt;
        flight.position = {
            x: flight.position.x + nose.x * speed,
            y: flight.position.y + nose.y * speed,
            z: flight.position.z + nose.z * speed,
        };
        // Into the water, or into an island's peak (section 5).
        const crash = flight.position.y > -10 ? 'water' : hitsIsland(flight.position) ? 'island' : null;
        if (crash) {
            flight.crash = crash;
            flight.position = { ...flight.position, y: startHeight };
            flight.pitch = 0;
            flight.camera.pitch = 0;
            flight.splashUntil = now + 2500;
        }

        const camera = flight.camera;
        camera.heading += (flight.heading - camera.heading) * (1 - Math.exp(-dt / 400));
        camera.pitch += (flight.pitch - camera.pitch) * (1 - Math.exp(-dt / 600));
        const up = cameraUp();
        const target = {
            x: flight.position.x - nose.x * 400 + up.x * 70,
            y: flight.position.y - nose.y * 400 + up.y * 70,
            z: flight.position.z - nose.z * 400 + up.z * 70,
        };
        const follow = 1 - Math.exp(-dt / 500);
        camera.position = camera.position === null ? target : {
            x: camera.position.x + (target.x - camera.position.x) * follow,
            y: camera.position.y + (target.y - camera.position.y) * follow,
            z: camera.position.z + (target.z - camera.position.z) * follow,
        };
    };

    let canvasElement: HTMLElement | undefined;
    let lastStatus = '';
    const announceStatus = (message: string) => {
        if (message === lastStatus) return;
        lastStatus = message;
        canvasElement?.dispatchEvent(new CustomEvent('observerstatus', { bubbles: true, detail: message }));
    };
    // Runs once per frame, before anything is drawn: moves the airplane and the camera, then
    // places the rig's head at the camera (the eye is another 100 behind it).
    const chaseCamera: CarModifier = {
        name: 'Airplane chase camera',
        active: true,
        priority: 10,
        requiredDataProviders: [],
        tick: () => {},
        getCarPosition: (_position, context) => {
            const now = context.playback.now;
            updateFlight(now);
            announceStatus(now < flight.splashUntil
                ? flight.crash === 'island'
                    ? 'Crash! You hit an island - flying again from the top.'
                    : 'Splash! You hit the water - flying again from the top.'
                : 'Move the mouse to steer the airplane.');
            return {
                success: true,
                value: {
                    name: 'Airplane chase camera',
                    position: flight.camera.position ?? flight.position,
                    rotation: rigRotation(viewDirection(flight.camera.heading, flight.camera.pitch)),
                },
            };
        },
    };
    world.addModifierToProjection('head', chaseCamera, 'car');

    // ── 3. Airplane ─────────────────────────────────────────────────────────────────
    // The parent is an invisible box (no fill, no stroke) carrying the airplane's position
    // and attitude; every part is its child, in the airplane's own coordinates: nose toward
    // -z, wings along x, up is -y.
    world.addBox({
        id: 'airplane',
        type: ELEMENT_TYPES.BOX,
        width: 1,
        position: () => flight.position,
        rotate: () => ({ yaw: -flight.heading, pitch: flight.pitch, roll: flight.bank }),
    });

    const red = { red: 214, green: 48, blue: 49 } as ColorRGBA;
    const cream = { red: 245, green: 238, blue: 220 } as ColorRGBA;
    const dark = { red: 45, green: 52, blue: 54 } as ColorRGBA;

    world.addElliptical({
        id: 'airplane-fuselage',
        type: ELEMENT_TYPES.ELLIPTICAL,
        parentId: 'airplane',
        rx: 11,
        ry: 11,
        rz: 46,
        position: { x: 0, y: 0, z: 0 },
        fillColor: red,
    });
    world.addSphere({
        id: 'airplane-cockpit',
        type: ELEMENT_TYPES.SPHERE,
        parentId: 'airplane',
        radius: 8,
        position: { x: 0, y: -8, z: -10 },
        fillColor: { red: 129, green: 236, blue: 236 } as ColorRGBA,
    });
    world.addBox({
        id: 'airplane-wings',
        type: ELEMENT_TYPES.BOX,
        parentId: 'airplane',
        width: 130,
        height: 3,
        depth: 24,
        position: { x: 0, y: 3, z: -6 },
        fillColor: cream,
    });
    world.addBox({
        id: 'airplane-tailplane',
        type: ELEMENT_TYPES.BOX,
        parentId: 'airplane',
        width: 48,
        height: 3,
        depth: 12,
        position: { x: 0, y: -2, z: 38 },
        fillColor: cream,
    });
    world.addBox({
        id: 'airplane-fin',
        type: ELEMENT_TYPES.BOX,
        parentId: 'airplane',
        width: 3,
        height: 22,
        depth: 16,
        position: { x: 0, y: -13, z: 38 },
        fillColor: red,
    });
    world.addSphere({
        id: 'airplane-spinner',
        type: ELEMENT_TYPES.SPHERE,
        parentId: 'airplane',
        radius: 5,
        position: { x: 0, y: 0, z: -46 },
        fillColor: dark,
    });
    // The propeller spins on the scene clock (~4 turns per second).
    world.addBox({
        id: 'airplane-propeller',
        type: ELEMENT_TYPES.BOX,
        parentId: 'airplane',
        width: 44,
        height: 4,
        depth: 2,
        position: { x: 0, y: 0, z: -50 },
        rotate: context => ({ yaw: 0, pitch: 0, roll: context.playback.now * 0.025 }),
        fillColor: dark,
    });
    // Wing-tip lights: red on the left, green on the right.
    world.addSphere({
        id: 'airplane-light-left',
        type: ELEMENT_TYPES.SPHERE,
        parentId: 'airplane',
        radius: 3,
        position: { x: -66, y: 3, z: -6 },
        fillColor: { red: 255, green: 40, blue: 40 } as ColorRGBA,
    });
    world.addSphere({
        id: 'airplane-light-right',
        type: ELEMENT_TYPES.SPHERE,
        parentId: 'airplane',
        radius: 3,
        position: { x: 66, y: 3, z: -6 },
        fillColor: { red: 40, green: 255, blue: 80 } as ColorRGBA,
    });

    // ── 4. Clouds ───────────────────────────────────────────────────────────────────
    // Fixed in the world. The world repeats every 6000 in x and z, and each cloud is drawn at
    // its copy nearest the camera - so wherever you fly there are clouds around you. A cloud
    // switches copies only once it's 3000 away, where it has already faded out, so you never
    // see one jump.
    //
    // Fading, by distance from the camera (what you see from, not the airplane): invisible
    // at 3000 (where they appear), solid from 2000 in to 600, then transparent again by 150
    // - so they emerge out of the distance, and the near ones thin out as you fly into
    // them while the screen whites out (cloudCover below). They also tint toward the sky
    // colour with distance (haze).
    //
    // Each cloud is an invisible parent box (position, plus a fixed turn so they don't all
    // look alike) with puffs as children: a flattened base and spheres all around it and on
    // top, so it has volume from any side; the lights shade their tops bright and their
    // undersides grey. Debug switch: cloudsAsCubes draws one plain cube per cloud instead.
    const cloudsAsCubes = false;
    const skyColor = { red: 150, green: 200, blue: 240 } as ColorRGBA;
    const cloudColor = { red: 250, green: 250, blue: 250 } as ColorRGBA; // the cubes
    // Pastel tints, one per cloud in turn, for a magical sunset sky; within a cloud the top
    // dome leans warm (catching the sun) and the base leans cool (its shadow).
    const cloudTints = [
        { red: 255, green: 196, blue: 160 }, // peach
        { red: 255, green: 180, blue: 215 }, // pink
        { red: 165, green: 232, blue: 255 }, // cyan
        { red: 218, green: 195, blue: 255 }, // lilac
        { red: 255, green: 238, blue: 205 }, // cream
    ] as ColorRGBA[];
    const warmTop = { red: 255, green: 205, blue: 150 } as ColorRGBA;
    const coolBase = { red: 175, green: 215, blue: 255 } as ColorRGBA;
    const mix = (from: ColorRGBA, to: ColorRGBA, amount: number) => ({
        red: Math.round(from.red + (to.red - from.red) * amount),
        green: Math.round(from.green + (to.green - from.green) * amount),
        blue: Math.round(from.blue + (to.blue - from.blue) * amount),
    }) as ColorRGBA;
    const cloudTint = (index: number) => cloudsAsCubes ? cloudColor : cloudTints[index % cloudTints.length];
    const tile = 6000;
    const nearestCopy = (value: number, center: number) =>
        center + ((((value - center + tile / 2) % tile) + tile) % tile) - tile / 2;
    // x / z within one 6000 tile, height above the sea, size (the cube's width; a cloud's
    // core is about that wide, its puffs reaching ~0.8 size out from its center).
    const clouds = [
        { x: -400, z: -900, height: 1050, size: 160 },
        { x: 500, z: -1500, height: 900, size: 220 },
        { x: -1200, z: -2100, height: 1250, size: 180 },
        { x: 1300, z: -600, height: 1150, size: 140 },
        { x: 200, z: -2700, height: 700, size: 260 },
        { x: -2200, z: -1300, height: 950, size: 200 },
        { x: 2300, z: -2000, height: 1400, size: 240 },
        { x: -700, z: 1200, height: 800, size: 150 },
        { x: 900, z: 2100, height: 1300, size: 210 },
        { x: -1900, z: 2500, height: 600, size: 190 },
        { x: 2600, z: 900, height: 1000, size: 170 },
        { x: -2800, z: 300, height: 1500, size: 230 },
        { x: 100, z: 600, height: 1600, size: 180 },
        { x: 1700, z: 2800, height: 750, size: 250 },
        { x: -1500, z: -2900, height: 1100, size: 160 },
        { x: 2900, z: -2800, height: 850, size: 200 },
        { x: -2500, z: -2400, height: 1300, size: 140 },
        { x: 1100, z: -2400, height: 500, size: 220 },
        { x: -300, z: 2800, height: 1200, size: 180 },
        { x: 2000, z: 200, height: 650, size: 160 },
        { x: -900, z: -300, height: 1450, size: 200 },
        { x: 700, z: 1300, height: 950, size: 140 },
        { x: -2300, z: 1600, height: 1150, size: 240 },
        { x: 2400, z: 1900, height: 1700, size: 190 },
    ];
    // One puff layout for every cloud, in units of its size (up is -y): the base, flattened
    // like a cloud's bottom, then spheres around it and a dome on top.
    const basePuff = { x: 0, y: 0.1, z: 0, rx: 0.9, ry: 0.35, rz: 0.6 };
    const puffs = [
        { x: 0, y: -0.35, z: 0, radius: 0.5 },
        { x: -0.5, y: -0.1, z: 0.1, radius: 0.4 },
        { x: 0.45, y: -0.05, z: -0.15, radius: 0.42 },
        { x: -0.15, y: -0.2, z: -0.4, radius: 0.35 },
        { x: 0.2, y: -0.15, z: 0.4, radius: 0.35 },
        { x: 0.75, y: 0.05, z: 0.25, radius: 0.28 },
        { x: -0.8, y: 0.05, z: -0.2, radius: 0.28 },
    ];
    // The camera's world position (the airplane's before the first frame places it).
    const cameraPosition = () => flight.camera.position ?? flight.position;
    clouds.forEach((cloud, index) => {
        const position = (): Vector3 => ({
            x: nearestCopy(cloud.x, cameraPosition().x),
            y: -cloud.height,
            z: nearestCopy(cloud.z, cameraPosition().z),
        });
        const distanceToCamera = () => {
            const { x, y, z } = position();
            const camera = cameraPosition();
            return Math.hypot(x - camera.x, y - camera.y, z - camera.z);
        };
        const alpha = () => {
            const distance = distanceToCamera();
            const fadeIn = Math.max(0, Math.min(1, (3000 - distance) / 1000));
            const fadeOut = Math.max(0, Math.min(1, (distance - 150) / 450));
            return (fadeIn * fadeOut) as Alpha;
        };
        // A colour, hazed toward the sky with distance - squared, so the haze stays light
        // through the middle distance (the tints show) and builds up toward 3000.
        const hazed = (color: ColorRGBA) => () => mix(color, skyColor, Math.min(1, distanceToCamera() / 3000) ** 2);
        const tint = cloudTint(index);

        if (cloudsAsCubes) {
            world.addBox({ id: `cloud-${index}`, type: ELEMENT_TYPES.BOX, width: cloud.size, position, alpha, fillColor: hazed(tint) });
            return;
        }
        const size = cloud.size;
        world.addBox({
            id: `cloud-${index}`,
            type: ELEMENT_TYPES.BOX,
            width: 1,
            position,
            // 1.7 rad apart: an irregular spread of turns from one number.
            rotate: { yaw: index * 1.7, pitch: 0, roll: 0 },
        });
        world.addElliptical({
            id: `cloud-${index}-base`,
            type: ELEMENT_TYPES.ELLIPTICAL,
            parentId: `cloud-${index}`,
            rx: basePuff.rx * size,
            ry: basePuff.ry * size,
            rz: basePuff.rz * size,
            position: { x: basePuff.x * size, y: basePuff.y * size, z: basePuff.z * size },
            alpha,
            fillColor: hazed(mix(tint, coolBase, 0.4)),
        });
        puffs.forEach((puff, puffIndex) => {
            world.addSphere({
                id: `cloud-${index}-puff-${puffIndex}`,
                type: ELEMENT_TYPES.SPHERE,
                parentId: `cloud-${index}`,
                radius: puff.radius * size,
                position: { x: puff.x * size, y: puff.y * size, z: puff.z * size },
                alpha,
                // The top dome (the first puff) catches the sun.
                fillColor: hazed(puffIndex === 0 ? mix(tint, warmTop, 0.5) : tint),
            });
        });
    });

    // Inside a cloud: how deep the camera is in the nearest cloud's whiteout, 0..1 - from 150
    // outside its surface (0) to touching or inside it (1), and that cloud's tint. The draw
    // loop covers the screen with the tint at up to 70% opacity - a thick cloud you can
    // still see through.
    // Its surface: the cube's faces, or for puffs a sphere 0.8 size around its center.
    const cloudCover = () => {
        const camera = cameraPosition();
        let cover = 0;
        let color = cloudTint(0);
        clouds.forEach((cloud, index) => {
            const offset = {
                x: nearestCopy(cloud.x, camera.x) - camera.x,
                y: -cloud.height - camera.y,
                z: nearestCopy(cloud.z, camera.z) - camera.z,
            };
            const gap = cloudsAsCubes
                ? Math.max(Math.abs(offset.x), Math.abs(offset.y), Math.abs(offset.z)) - cloud.size / 2
                : Math.hypot(offset.x, offset.y, offset.z) - cloud.size * 0.8;
            const depth = Math.min(1, 1 - gap / 150);
            if (depth > cover) {
                cover = depth;
                color = cloudTint(index);
            }
        });
        return { cover, color };
    };

    // ── 5. Islands ──────────────────────────────────────────────────────────────────
    // Procedural, seeded by position: the ocean is split into 1500 x 1500 cells, and each
    // cell's island (or none - about 2 in 3 are open water) comes from a random sequence
    // seeded by the cell's own coordinates. Nothing is stored: come back to a place and
    // the same island is there.
    //
    // An island: a sandy beach (a flat ellipsoid at sea level) with 1-3 cone peaks in a
    // pastel green, the tallest snow-capped if it's over 450 high. The engine needs a fixed
    // set of elements, so 16 island slots cover the 4 x 4 cells around the camera (6000
    // across, ~3000 each way): each slot shows the one cell in that window that falls to it,
    // and hands over to a new cell only at the window's edge, where islands have faded out.
    // They fade in from 3000 like the clouds, and stay solid up close - they're ground.
    const islandCell = 1500;
    const islandSlots = 4;
    // mulberry32, seeded by a cell's coordinates: the same cell always gives the same numbers.
    const cellRandom = (cellX: number, cellZ: number) => {
        let seed = (Math.imul(cellX, 73856093) ^ Math.imul(cellZ, 19349663) ^ 0x9e3779b9) >>> 0;
        return () => {
            seed = (seed + 0x6d2b79f5) >>> 0;
            let t = seed;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    };
    const sandColor = { red: 244, green: 218, blue: 176 } as ColorRGBA;
    const snowColor = { red: 255, green: 240, blue: 245 } as ColorRGBA;
    const grassTints = [
        { red: 120, green: 196, blue: 150 }, // mint
        { red: 150, green: 200, blue: 120 }, // leaf
        { red: 110, green: 180, blue: 170 }, // teal
        { red: 170, green: 190, blue: 140 }, // sage
    ] as ColorRGBA[];
    type Peak = { x: number; z: number; radius: number; height: number };
    type Island = { x: number; z: number; beachX: number; beachZ: number; peaks: Peak[]; grass: ColorRGBA; snowPeak: Peak | null };
    // Islands already worked out this session - only a speed-up: islandAt gives the same
    // answer either way.
    const islandCache = new Map<string, Island | null>();
    const islandAt = (cellX: number, cellZ: number): Island | null => {
        const key = `${cellX},${cellZ}`;
        if (islandCache.has(key)) return islandCache.get(key)!;
        const random = cellRandom(cellX, cellZ);
        let island: Island | null = null;
        if (random() < 0.35) {
            const size = 250 + random() * 350;
            const x = (cellX + 0.25 + random() * 0.5) * islandCell;
            const z = (cellZ + 0.25 + random() * 0.5) * islandCell;
            const peaks = Array.from({ length: 1 + Math.floor(random() * 3) }, () => ({
                x: x + (random() - 0.5) * size * 0.8,
                z: z + (random() - 0.5) * size * 0.8,
                radius: size * (0.3 + random() * 0.3),
                height: size * (0.5 + random() * 1.1),
            }));
            const tallest = peaks.reduce((a, b) => b.height > a.height ? b : a);
            island = {
                x,
                z,
                beachX: size,
                beachZ: size * (0.6 + random() * 0.4),
                peaks,
                grass: grassTints[Math.floor(random() * grassTints.length)],
                snowPeak: tallest.height > 450 ? tallest : null,
            };
        }
        if (islandCache.size > 500) islandCache.clear();
        islandCache.set(key, island);
        return island;
    };
    // The cell a slot shows along one axis: the one cell, among those 4 apart that fall to
    // this slot, whose center is within 2 cells of the camera.
    const slotCell = (slot: number, cameraCoordinate: number) =>
        slot + islandSlots * Math.round((cameraCoordinate / islandCell - 0.5 - slot) / islandSlots);
    // Inside a peak (section 2's crash check): below its height, and closer to its axis than
    // the cone's radius at that height. Checks the airplane's cell and its 8 neighbours.
    const hitsIsland = (position: Vector3) => {
        const above = -position.y;
        const cellX = Math.floor(position.x / islandCell);
        const cellZ = Math.floor(position.z / islandCell);
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                for (const peak of islandAt(cellX + dx, cellZ + dz)?.peaks ?? []) {
                    if (above >= peak.height) continue;
                    const reach = peak.radius * (1 - above / peak.height);
                    if (Math.hypot(position.x - peak.x, position.z - peak.z) < reach) return true;
                }
            }
        }
        return false;
    };
    // Far below the far plane: where a slot's unused parts (or a cell with no island) go.
    const hidden = 100000;
    const hazedByDistance = (color: ColorRGBA, distance: number) =>
        mix(color, skyColor, Math.min(1, distance / 3000) ** 2);

    for (let slotX = 0; slotX < islandSlots; slotX++) {
        for (let slotZ = 0; slotZ < islandSlots; slotZ++) {
            const id = `island-${slotX}-${slotZ}`;
            const island = () => {
                const camera = cameraPosition();
                return islandAt(slotCell(slotX, camera.x), slotCell(slotZ, camera.z));
            };
            const distanceToCamera = () => {
                const shown = island();
                if (!shown) return Infinity;
                const camera = cameraPosition();
                return Math.hypot(shown.x - camera.x, camera.y, shown.z - camera.z);
            };
            const alpha = () => Math.max(0, Math.min(1, (3000 - distanceToCamera()) / 1000)) as Alpha;
            world.addBox({
                id,
                type: ELEMENT_TYPES.BOX,
                width: 1,
                position: () => {
                    const shown = island();
                    return shown ? { x: shown.x, y: 0, z: shown.z } : { x: 0, y: hidden, z: 0 };
                },
            });
            world.addElliptical({
                id: `${id}-beach`,
                type: ELEMENT_TYPES.ELLIPTICAL,
                parentId: id,
                rx: () => island()?.beachX ?? 1,
                ry: 30,
                rz: () => island()?.beachZ ?? 1,
                // Its bottom 5 above the sea (y -35 + 30), like the peaks' bases (lift below).
                position: { x: 0, y: -35, z: 0 },
                alpha,
                fillColor: () => hazedByDistance(sandColor, distanceToCamera()),
            });
            // Up to 3 peaks; a slot whose island has fewer hides the rest. Positions are
            // relative to the island's center (the parent). The whole island floats `lift` above
            // the sea - beach bottom and cone bases included - so nothing touches the ocean's
            // plane, where they'd flicker against it.
            const lift = 5;
            for (let peakIndex = 0; peakIndex < 3; peakIndex++) {
                const peak = () => island()?.peaks[peakIndex];
                world.addCone({
                    id: `${id}-peak-${peakIndex}`,
                    type: ELEMENT_TYPES.CONE,
                    parentId: id,
                    radius: () => peak()?.radius ?? 1,
                    height: () => peak()?.height ?? 1,
                    position: () => {
                        const shown = island();
                        const at = peak();
                        return shown && at
                            ? { x: at.x - shown.x, y: -lift - at.height / 2, z: at.z - shown.z }
                            : { x: 0, y: hidden, z: 0 };
                    },
                    alpha,
                    fillColor: () => hazedByDistance(island()?.grass ?? grassTints[0], distanceToCamera()),
                });
            }
            // Snow on the tallest peak: the top 37% as a cone a touch wider, so it covers
            // the peak's tip instead of sharing its surface.
            world.addCone({
                id: `${id}-snow`,
                type: ELEMENT_TYPES.CONE,
                parentId: id,
                radius: () => (island()?.snowPeak?.radius ?? 1) * 0.39,
                height: () => (island()?.snowPeak?.height ?? 1) * 0.37,
                position: () => {
                    const shown = island();
                    const at = shown?.snowPeak;
                    return shown && at
                        ? { x: at.x - shown.x, y: -5 - at.height * 1.005 + at.height * 0.185, z: at.z - shown.z }
                        : { x: 0, y: hidden, z: 0 };
                },
                alpha,
                fillColor: () => hazedByDistance(snowColor, distanceToCamera()),
            });
        }
    }

    // ── 6. Ocean ────────────────────────────────────────────────────────────────────
    // At sea level (y 0), kept centered under the airplane so it never ends - flat and one
    // colour, so sliding it along is invisible. 40000 across, so its far edge sits just
    // under the horizon.
    world.addFloor({
        id: 'ocean',
        type: ELEMENT_TYPES.FLOOR,
        width: 40000,
        depth: 40000,
        position: () => ({ x: flight.position.x, y: 0, z: flight.position.z }),
        // Drawn first, before everything else (renderOrder 0 by default): a half-faded island
        // or cloud drawn before it would hide it, showing the bare sky colour through itself.
        renderOrder: -1,
        fillColor: { red: 70, green: 130, blue: 190 } as ColorRGBA,
    });

    // ── 7. Canvas, input and draw loop ──────────────────────────────────────────────

    let gp: P5GraphicProcessor;

    // The pointer's offset from the canvas center, -1..1 each way. The cloud cover is a plain
    // element laid over the canvas (inside its box, so it goes fullscreen with it): drawn in
    // 3D it would be shaded by the lights and read grey instead of the cloud's white.
    let cloudOverlay: HTMLElement | undefined;
    p.setup = () => {
        const canvas = p.createCanvas(config.width, config.height, p.WEBGL);
        canvasElement = canvas?.elt;
        const box = canvasElement?.parentElement;
        if (box) {
            box.querySelector('.cloud-cover')?.remove(); // from a previous run of this sketch
            cloudOverlay = document.createElement('div');
            cloudOverlay.className = 'cloud-cover';
            cloudOverlay.style.cssText = 'position:absolute;inset:0;z-index:1;pointer-events:none;opacity:0';
            box.appendChild(cloudOverlay);
        }
        canvasElement?.addEventListener('pointermove', event => {
            const bounds = canvasElement!.getBoundingClientRect();
            const pointerEvent = event as PointerEvent;
            pointer.x = clamp(((pointerEvent.clientX - bounds.left) / bounds.width - 0.5) * 2, 1);
            pointer.y = clamp(((pointerEvent.clientY - bounds.top) / bounds.height - 0.5) * 2, 1);
        });
    };

    world.complete();

    // Keyboard: arrow keys held right now (read each frame in section 2). Keys typed into text
    // fields - like the Code tab editor - are ignored.
    const isTyping = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        return !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    };
    window.addEventListener('keydown', (event: KeyboardEvent) => {
        if (isTyping(event)) return;
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

        p.background(skyColor.red, skyColor.green, skyColor.blue);
        // Daylight: a cool, slightly blue ambient plus a warm low sun from above, so every
        // face is shaded by how it's turned - what shows the clouds' and the airplane's
        // shapes - with sunlit tops leaning orange and shadows leaning blue.
        p.ambientLight(185, 185, 198);
        p.directionalLight(130, 95, 60, 0.3, 1, -0.6);
        if (gp) {
            // p5's camera takes "up" as the screen-down direction - the opposite of ours.
            const up = cameraUp();
            gp.cameraUp = { x: -up.x, y: -up.y, z: -up.z };
            const result = await world.step(gp);
            if (!result.running) return;
            if (cloudOverlay) {
                const { cover, color } = cloudCover();
                cloudOverlay.style.opacity = (cover * 0.7).toFixed(3);
                cloudOverlay.style.background = `rgb(${color.red},${color.green},${color.blue})`;
            }
        }
    };

    gp = extraArgs?.graphicProcessor ?? new P5GraphicProcessor(p, loader);

    return world;
}
