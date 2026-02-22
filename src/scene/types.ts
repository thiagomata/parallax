/**
 * A strict 3D vector.
 */
export interface Vector3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

export interface Rotation3 {
    /* rotation around X axis */
    pitch: number;
    /* rotation around Y axis */
    yaw: number;
    /* rotation around Z axis */
    roll: number;
}

/**
 * Modifiers are static refs in the blueprint
 */
export interface BaseProjection {
    readonly type: ProjectionType;
    readonly id: string;
    readonly targetId?: string;
}

export function projectionIsType<T extends ProjectionType>(
    resolvedProjection: ResolvedProjection,
    type: T
): resolvedProjection is ResolvedProjection & { type: T } {
    return resolvedProjection.type === type;
}

export interface ResolvedProjection extends BaseProjection {
    position: Vector3;
    rotation: Rotation3;
    lookAt: Vector3;
    direction: Vector3;
    distance: number;
    readonly effects: readonly ProjectionEffectResolutionGroup[];
}

/**
 * Projection Blueprint - Allows flexible specs for base pose properties.
 */
export interface BlueprintProjection extends BaseProjection {
    readonly position: FlexibleSpec<Vector3>;
    readonly rotation: FlexibleSpec<Rotation3>;
    readonly lookAt: FlexibleSpec<Vector3>;
    readonly direction: FlexibleSpec<Vector3>;
    readonly effects?: ProjectionEffectBlueprint[]
    readonly modifiers?: {
        readonly carModifiers?: readonly CarModifier[];
        readonly nudgeModifiers?: readonly NudgeModifier[];
        readonly stickModifiers?: readonly StickModifier[];
    }
}

/**
 * Projection Dynamic - The compiled version ready for the frame loop.
 */
export interface DynamicProjection extends BaseProjection {
    readonly position: DynamicProperty<Vector3>;
    readonly rotation: DynamicProperty<Rotation3>;
    readonly lookAt: DynamicProperty<Vector3>;
    readonly direction: DynamicProperty<Vector3>;
    readonly effects: ProjectionEffectResolutionGroup[];
    readonly modifiers?: {
        readonly carModifiers?: readonly CarModifier[];
        readonly nudgeModifiers?: readonly NudgeModifier[];
        readonly stickModifiers?: readonly StickModifier[];
    }
}

export const DEFAULT_PROJECTION_ELEMENT = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { pitch: 0, yaw: 0, roll: 0 },
    direction: { x: 0, y: 0, z: 0 },
    lookAt: { x: 0, y: 0, z: 0 },
    modifiers: {
        carModifiers: [],
        nudgeModifiers: [],
        stickModifiers: [],
    },
};

export interface ProjectionEffectBundle<
    TID extends string = string,
    TConfig extends BaseModifierSettings = BaseModifierSettings,
    E extends ResolvedProjection = ResolvedProjection,
> {
    readonly type: TID;
    readonly defaults: TConfig;
    /**
     * Specifically transforms a spatial projection rather than a visual element.
     */
    apply(current: E, state: SceneState, settings: TConfig, resolutionPool: Record<string, E>): E;
}

export type ProjectionEffectLib = Record<string, ProjectionEffectBundle<any, any, any>>;

export interface ProjectionEffectBlueprint<K extends string = string, TConfig = any> {
    readonly type: K;
    readonly settings?: Partial<TConfig>;
}

export interface ProjectionEffectResolutionGroup<
    TID extends string = string,
    TConfig extends BaseModifierSettings = any
> {
    readonly type: TID;
    readonly bundle: ProjectionEffectBundle<TID, TConfig, any>;
    readonly settings?: TConfig; // Hydrated/Merged settings
}

// export interface ProjectionElementDebug {
//     // cars
//     logFailedCar(element: ProjectionElement,  carModifier: CarModifier, res: { success: false; error: string }): void;
//     logSuccessCar(element: ProjectionElement,  carModifier: CarModifier, res: { success: true; value: CarResult }): void;
//     // nudge
//     logFailedNudge(element: ProjectionElement,  nudgeModifier: NudgeModifier, res: { success: false; error: string }): void;
//     logSuccessNudge(element: ProjectionElement,  nudgeModifier: NudgeModifier, res: { success: true; value: Partial<Vector3> }): void;
//     logFinalNudge(element: ProjectionElement,  finalNudge: { x: number; y: number; z: number }): void;
//     // stick
//     logFailedStick(element: ProjectionElement,  stickModifier: StickModifier, res: { success: false; error: string }): void;
//     logSuccessStick(element: ProjectionElement,  stickModifier: StickModifier, res: { success: true; value: StickResult }): void;
// }

/**
 * A component of the projection matrix containing 4 values.
 */
export type ProjectionMatrixComponent = {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
};

/**
 * A structured projection matrix with 4 components, each containing x, y, z, w values.
 * Maps to a 4x4 column-major matrix for P5/WebGL compatibility.
 */
export type ProjectionMatrix = {
    readonly xScale: ProjectionMatrixComponent;
    readonly yScale: ProjectionMatrixComponent;
    readonly projection: ProjectionMatrixComponent;
    readonly translation: ProjectionMatrixComponent;
};

export const PROJECTION_TYPES = {
    WORLD: 'WORLD',
    PLAYER: 'PLAYER',
    SCREEN: 'SCREEN',
    HEAD: 'HEAD',
    EYE: 'EYE'
} as const;
export type ProjectionType = typeof PROJECTION_TYPES[keyof typeof PROJECTION_TYPES];

/**
 * A container for operations that can fail.
 */
export type FailableResult<T> =
    | { success: true, value: T; }
    | { success: false, error: string };

/** * CORE GENERIC: THE GRAPHICS BUNDLE
 * Defines the platform-specific instances for a specific renderer.
 */
export interface GraphicsBundle {
    readonly texture: unknown;
    readonly font: unknown;
}

interface WindowConfigInput {
    width: number;
    height: number;
    z: number;
    near: number;
    far: number;
    epsilon: number;
}

/**
 * Baseline portal dimensions (approx. 27-inch monitor in mm).
 */
export const DEFAULT_WINDOW_CONFIG = {
    width: 600,
    height: 337,
    z: 0,
    near: 10,
    far: 10000,
    epsilon: 0.001,
};

export class WindowConfig {
    public readonly width: number;
    public readonly height: number;
    public readonly halfWidth: number;
    public readonly halfHeight: number;
    public readonly aspectRatio: number;
    public readonly z: number;
    public readonly near: number;
    public readonly far: number;
    public readonly epsilon: number;

    private constructor(input: WindowConfigInput) {
        this.width = input.width;
        this.height = input.height;
        this.z = input.z;
        this.near = input.near;
        this.far = input.far;
        this.epsilon = input.epsilon;

        this.halfWidth = input.width * 0.5;
        this.halfHeight = input.height * 0.5;
        this.aspectRatio = input.width / input.height;
    }

    /**
     * Merges user overrides with the static default object.
     */
    static create(params: Partial<WindowConfigInput> = {}): WindowConfig {
        const input = { ...DEFAULT_WINDOW_CONFIG, ...params };

        // Validation logic migrated from the nuked ScreenConfig
        if (input.width <= 0 || input.height <= 0) throw new Error("Portal width/height must be positive.");
        if (input.near <= 0 || input.far <= input.near) throw new Error("Invalid clipping planes.");
        if (input.epsilon <= 0) throw new Error("Invalid epsilon value.");

        return new WindowConfig(input);
    }
}

export interface StickRotationLimits {
    yaw: { min: number; max: number };
    pitch: { min: number; max: number };
    roll: { min: number; max: number };
}

export const DEFAULT_ROTATION_LIMITS: StickRotationLimits = {
    yaw: { min: -Math.PI/2, max: Math.PI/2 },      // ±90 degrees
    pitch: { min: -Math.PI/3, max: Math.PI/3 },     // ±60 degrees
    roll: { min: -Math.PI/6, max: Math.PI/6 },      // ±30 degrees
};

export type ScreenConfigInput = {
    width: number;
    height: number;
    z: number;
    near: number;
    far: number;
    epsilon: number;
};

export interface PlaybackSettings {
    readonly duration?: number;
    readonly isLoop: boolean;
    readonly timeSpeed: number;
    readonly startTime: number;
}

export interface ScenePlaybackState {
    readonly now: number;
    readonly delta: number;
    readonly progress: number;
    readonly frameCount: number;
}

export interface SceneSettings {
    window: WindowConfig;
    playback: PlaybackSettings;
    debug: boolean;
    alpha: number;
    startPaused: boolean;
}

type ScreeProjection = ResolvedProjection & {type: typeof PROJECTION_TYPES.SCREEN};
type EyeProjection   = ResolvedProjection & {type: typeof PROJECTION_TYPES.EYE};

export interface SceneState {
    sceneId: number;
    settings: SceneSettings;
    playback: ScenePlaybackState;
    debugStateLog?: SceneStateDebugLog;
    elements?: Map<string, ResolvedElement>;
    projections?: Map<string, ResolvedProjection>;
}

export const DEFAULT_CAMERA_FAR = 5000;

export const DEFAULT_SETTINGS: SceneSettings = {
    window: WindowConfig.create(DEFAULT_WINDOW_CONFIG),
    playback: {
        duration: 5000,
        isLoop: true,
        timeSpeed: 1.0,
        startTime: 0
    },
    debug: false,
    startPaused: false,
    alpha: 1
};

export interface SceneStateDebugLog {
    car: { name: string; priority: number } & Partial<Vector3>;
    nudges: Array<{ name: string } & Partial<Vector3>>;
    stick: { name: string; priority: number, yaw?: number; pitch?: number; distance?: number };
    errors: Array<{ name: string; message: string }>;
}

/**
 * MODIFIERS
 */
export interface CarResult {
    name: string;
    position: Vector3;
}

export interface StickResult {
    readonly yaw: number;
    readonly pitch: number;
    readonly distance: number;
    readonly roll: number;
    readonly priority: number;
}

export interface Modifier {
    /** unique modifier name */
    name: string;
    active: boolean;
    /** Called exactly once per frame **/
    tick(sceneId: number): void;

}

export interface CarModifier extends Modifier {
    readonly priority: number;
    getCarPosition(initialCam: Vector3, currentState: SceneState): FailableResult<CarResult>;
}

export interface NudgeModifier extends Modifier {
    getNudge(currentCarPos: Vector3, currentState: SceneState): FailableResult<Partial<Vector3>>;
}

export interface StickModifier extends Modifier {
    readonly priority: number;
    getStick(finalPos: Vector3, currentState: SceneState): FailableResult<StickResult>;
}

/**
 * ASSET SYSTEM
 */
export const ASSET_STATUS = {PENDING: 'PENDING', LOADING: 'LOADING', READY: 'READY', ERROR: 'ERROR'} as const;
export type AssetStatus = typeof ASSET_STATUS[keyof typeof ASSET_STATUS];

export interface TextureRef {
    readonly width: number;
    readonly height: number;
    readonly path: string;
    readonly alpha?: number;
}

export interface TextureInstance<TTexture = unknown> {
    readonly texture: TextureRef;
    readonly internalRef: TTexture;
}

export type TextureAsset<TTexture = unknown> =
    | { readonly status: typeof ASSET_STATUS.PENDING; readonly value: null; }
    | { readonly status: typeof ASSET_STATUS.LOADING; readonly value: null; }
    | { readonly status: typeof ASSET_STATUS.READY; readonly value: TextureInstance<TTexture> | null; }
    | { readonly status: typeof ASSET_STATUS.ERROR; readonly value: null; readonly error: string };

export interface FontRef {
    readonly name: string;
    readonly path: string;
}

export interface FontInstance<TFont = unknown> {
    readonly font: FontRef;
    readonly internalRef: TFont;
}

export type FontAsset<TFont = unknown> =
    | { readonly status: typeof ASSET_STATUS.PENDING; readonly value: null; }
    | { readonly status: typeof ASSET_STATUS.LOADING; readonly value: null; }
    | { readonly status: typeof ASSET_STATUS.READY; readonly value: FontInstance<TFont> | null; }
    | { readonly status: typeof ASSET_STATUS.ERROR; readonly value: null; readonly error: string };

export interface ElementAssets<TBundle extends GraphicsBundle> {
    texture?: TextureAsset<TBundle['texture']>;
    font?: FontAsset<TBundle['font']>;
}

export interface AssetLoader<TBundle extends GraphicsBundle> {
    hydrateTexture(ref: TextureRef): Promise<TextureAsset<TBundle['texture']>>;
    hydrateFont(ref: FontRef): Promise<FontAsset<TBundle['font']>>;
    waitForAllAssets(): Promise<void>;
}

/**
 * GRAPHIC PROCESSOR
 */
export type ColorRGBA = { red: number; green: number; blue: number; alpha?: number; }

export interface GraphicProcessor<TBundle extends GraphicsBundle> {
    readonly loader: AssetLoader<TBundle>;

    /* --- Act 1: The Perspective Rig --- */

    /**
     * Positions the hardware camera using the resolved Eye projection.
     * The processor uses eye.position and eye.lookAt to mount the view.
     */
    setCamera(eye: ResolvedProjection): void;

    /**
     * Applies the off-axis frustum matrix.
     */
    setProjectionMatrix(projectionMatrix: ProjectionMatrix): void;

    /* --- Act 2: The Drawing Pipeline --- */
    drawBox(props: ResolvedBox, assets: ElementAssets<TBundle>, state: SceneState): void;
    drawPanel(props: ResolvedPanel, assets: ElementAssets<TBundle>, state: SceneState): void;
    drawSphere(resolved: ResolvedSphere, assets: ElementAssets<TBundle>, state: SceneState): void;
    drawCone(resolved: ResolvedCone, assets: ElementAssets<TBundle>, state: SceneState): void;
    drawPyramid(resolved: ResolvedPyramid, assets: ElementAssets<TBundle>, state: SceneState): void;
    drawElliptical(resolved: ResolvedElliptical, assets: ElementAssets<TBundle>, state: SceneState): void;
    drawCylinder(resolved: ResolvedCylinder, assets: ElementAssets<TBundle>, state: SceneState): void;
    drawTorus(resolved: ResolvedTorus, assets: ElementAssets<TBundle>, state: SceneState): void;
    drawFloor(resolved: ResolvedFloor, assets: ElementAssets<TBundle>, state: SceneState): void;
    drawText(props: ResolvedText, assets: ElementAssets<TBundle>, state: SceneState): void;

    /* --- Act 3: Spatial & Temporal Context --- */
    dist(v1: Vector3, v2: Vector3): number;
    map(val: number, s1: number, st1: number, s2: number, st2: number, clamp?: boolean): number;
    lerp(start: number, stop: number, amt: number): number;
    millis(): number;
    deltaTime(): number;
    frameCount(): number;

    /* --- Act 4: UI & Debugging --- */
    drawLabel(s: string, pos: Partial<Vector3>): void;
    drawCrosshair(pos: Partial<Vector3>, size: number): void;
    drawHUDText(s: string, x: number, y: number): void;
    text(s: string, pos: Partial<Vector3>): void;
}

/**
 * DYNAMIC ENGINE CORE
 */
export const ELEMENT_TYPES = {
    BOX: 'box',
    PANEL: 'panel',
    SPHERE: 'sphere',
    CONE: 'cone',
    PYRAMID: 'pyramid',
    CYLINDER: 'cylinder',
    TORUS: 'torus',
    ELLIPTICAL: 'elliptical',
    FLOOR: 'floor',
    TEXT: 'text',
} as const;
export const ALL_ELEMENT_TYPES = Object.values(ELEMENT_TYPES);

export const SPEC_KINDS = {STATIC: 'static', COMPUTED: 'computed', BRANCH: 'branch'} as const;

export type DynamicProperty<T, TResolved = unknown> =
    | { kind: typeof SPEC_KINDS.STATIC; value: T }
    | {
    kind: typeof SPEC_KINDS.COMPUTED;
    compute: (
        state: SceneState,
        resolutionPool: Record<string, TResolved>
    ) => T | DynamicProperty<T, TResolved> | DynamicTree<T, TResolved>
}
    | { kind: typeof SPEC_KINDS.BRANCH; value: DynamicTree<T, TResolved> };

export type DynamicTree<T, TResolved = unknown> = {
    [K in keyof T]: T[K] | DynamicProperty<T[K], TResolved> | DynamicTree<T[K], TResolved>;
};

export type FlexibleSpec<T> =
    T
    | ((state: SceneState) => T | DynamicProperty<T> | DynamicTree<T>)
    | (T extends object ? BlueprintTree<T> : never);
export type BlueprintTree<T> = { [K in keyof T]?: FlexibleSpec<T[K]>; };

export const STATIC_ELEMENT_KEYS = ['type', 'texture', 'font', 'id'] as const;
type StaticKeys = typeof STATIC_ELEMENT_KEYS[number];
export type MapToBlueprint<T> = { -readonly [K in keyof T]: K extends StaticKeys ? T[K] : FlexibleSpec<T[K]>; } & {
    effects?: EffectBlueprint[];
};
// export type MapToDynamic<T> = { [K in keyof T]: K extends StaticKeys ? T[K] : DynamicProperty<T[K]>; } & {
//     effects?: EffectResolutionGroup[];
// };
/**
 * MapToDynamic strictly transforms a blueprint into a dynamic tree
 */
export type MapToDynamic<T> = {
    [K in keyof T]:                     // Iterate over every key K in the provided type T
    K extends StaticKeys                // Check if the current key is one of our protected StaticKeys
        ? T[K] extends { kind: any }    // If it is a StaticKey, check if its value T[K] contains a "kind" property
            ? never                     // If a StaticKey has a "kind" property, resolve to never to trigger a type error
            : T[K]                      // If it is a StaticKey and is a "clean" value, return the raw type T[K]
        : T[K] extends { kind: any }    // If the key is NOT a StaticKey, check if its value already has a "kind"
            ? never                     // If a dynamic key already has a "kind", resolve to never to prevent double-wrapping
            : DynamicProperty<T[K]>;    // If the dynamic key is a "clean" value, wrap it in a DynamicProperty container
} & {
    effects?: EffectResolutionGroup[];  // Attach an optional group for visual effect resolution post-hydration
};
export type Unwrapped<T> = T extends DynamicProperty<infer U> ? Unwrapped<U> : T extends object ? { [K in keyof T]: Unwrapped<T[K]> } : T;

/**
 * These Ids should not be used to define new elements, as boxes since they are reference
 * to world elements.
 */
export type ReservedElementId =
    | 'camera'
    | 'eye'
    | 'screen'
    | 'player'
    | 'world'
    | 'origin';

export type ElementId<T extends string> = T extends ReservedElementId ? never : T;

/**
 * ELEMENT DEFINITIONS
 */
export interface ResolvedBaseVisual<TID extends string = string> {
    readonly id: ElementId<TID>;
    readonly type: typeof ELEMENT_TYPES[keyof typeof ELEMENT_TYPES];
    readonly position: Vector3;
    readonly alpha?: number;
    readonly fillColor?: ColorRGBA;
    readonly strokeColor?: ColorRGBA;
    readonly strokeWidth?: number;
    readonly rotate?: Vector3;
    readonly texture?: TextureRef;
    readonly font?: FontRef;
    readonly effects?: EffectBlueprint[];
}

export type DynamicElement<T extends ResolvedElement> = MapToDynamic<T>;

// BOX

export interface ResolvedBox extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.BOX;
    readonly width: number;
    readonly height?: number;
    readonly depth?: number;
}

export type BlueprintBox = MapToBlueprint<ResolvedBox>;
export type DynamicBox = DynamicElement<ResolvedBox>;

// PANEL

export interface ResolvedPanel extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.PANEL;
    readonly width: number;
    readonly height: number;
}

export type BlueprintPanel = MapToBlueprint<ResolvedPanel>;
export type DynamicPanel = DynamicElement<ResolvedPanel>;

//  SPHERE

export interface ResolvedSphere extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.SPHERE;
    readonly radius: number;
    readonly detail?: number;
}

export type BlueprintSphere = MapToBlueprint<ResolvedSphere>;
export type DynamicSphere = DynamicElement<ResolvedSphere>;

// CONE

export interface ResolvedCone extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.CONE;
    /** radius of the base circle */
    readonly radius: number;
    /** height along the Y axis */
    readonly height: number;
}

export type BlueprintCone = MapToBlueprint<ResolvedCone>;
export type DynamicCone = DynamicElement<ResolvedCone>;

// PYRAMID

export interface ResolvedPyramid extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.PYRAMID;
    readonly baseSize: number;
    readonly height: number;
}

export type BlueprintPyramid = MapToBlueprint<ResolvedPyramid>;
export type DynamicPyramid = DynamicElement<ResolvedPyramid>;

// CYLINDER

export interface ResolvedCylinder extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.CYLINDER;
    /** radius of the circular base */
    readonly radius: number;
    /** height along the Y axis */
    readonly height: number;
}

export type BlueprintCylinder = MapToBlueprint<ResolvedCylinder>;
export type DynamicCylinder = DynamicElement<ResolvedCylinder>;

// TORUS

export interface ResolvedTorus extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.TORUS;
    /** distance from center to middle of the tube */
    readonly radius: number;
    /** radius of the tube */
    readonly tubeRadius: number;
}

export type BlueprintTorus = MapToBlueprint<ResolvedTorus>;
export type DynamicTorus = DynamicElement<ResolvedTorus>;

// ELLIPTICAL

export interface ResolvedElliptical extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.ELLIPTICAL;
    /** radius along the X axis */
    readonly rx: number;
    /** radius along the Y axis */
    readonly ry: number;
    /** radius along the Z axis */
    readonly rz: number;
}

export type BlueprintElliptical = MapToBlueprint<ResolvedElliptical>;
export type DynamicElliptical = DynamicElement<ResolvedElliptical>;

// FLOOR

export interface ResolvedFloor extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.FLOOR;
    readonly width: number;
    readonly depth: number;
}

export type BlueprintFloor = MapToBlueprint<ResolvedFloor>;
export type DynamicFloor = DynamicElement<ResolvedFloor>;

// TEXT

export interface ResolvedText extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.TEXT;
    readonly text: string;
    readonly size: number;
}

export type BlueprintText = MapToBlueprint<ResolvedText>;
export type DynamicText = DynamicElement<ResolvedText>;

export type BlueprintElement =
    BlueprintBox        |
    BlueprintPanel      |
    BlueprintSphere     |
    BlueprintCone       |
    BlueprintPyramid    |
    BlueprintElliptical |
    BlueprintCylinder   |
    BlueprintTorus      |
    BlueprintFloor      |
    BlueprintText       ;


export type ResolvedElement =
    ResolvedBox         |
    ResolvedPanel       |
    ResolvedSphere      |
    ResolvedCone        |
    ResolvedPyramid     |
    ResolvedElliptical  |
    ResolvedCylinder    |
    ResolvedTorus       |
    ResolvedFloor       |
    ResolvedText        ;

/**
 * WORLD INTERFACES
 */

/**
 * Bundle Dynamic Element contains the dynamic version of the element T
 * and the assets related to it.
 */
export interface BundleDynamicElement<
    T extends ResolvedElement = ResolvedElement,
    TBundle extends GraphicsBundle = GraphicsBundle
> {
    readonly id: string;
    readonly dynamic: DynamicElement<T>;
    readonly effects: ReadonlyArray<EffectResolutionGroup>;
    assets: ElementAssets<TBundle>;
}

/**
 * Bundle Resolved Element contains the resolved element T
 * and the assets related to it.
 *
 * Should provide all the required data to render element T
 */
export interface BundleResolvedElement<
    T extends ResolvedElement = ResolvedElement,
    TGraphicBundle extends GraphicsBundle = GraphicsBundle
> {
    readonly id: string;
    readonly resolved: T;
    readonly effects: ReadonlyArray<EffectResolutionGroup>;
    assets: ElementAssets<TGraphicBundle>;
}

export function toBlueprint<T>(blueprint: MapToBlueprint<T>): MapToBlueprint<T> {
    return blueprint;
}

export type TrackingStatus =
    | 'IDLE'           // Created but not yet initialized
    | 'INITIALIZING'   // Hardware/WASM is booting
    | 'READY'          // Active tracking in progress
    | 'DRIFTING'       // Tracking lost, but modifier is returning back to neutral
    | 'DISCONNECTED'   // Tracking source disconnected and threshold exceeded (calibration cleared)
    | 'ERROR';         // Fatal hardware/permission issue

export interface FaceGeometry {
    nose: Vector3;
    leftEye: Vector3;
    rightEye: Vector3;
    bounds: {
        left: Vector3;
        right: Vector3;
        top: Vector3;
        bottom: Vector3;
    };
}

export interface FaceProvider {
    getFace(): FaceGeometry | null
    getStatus(): TrackingStatus;
    init(): Promise<void>;
}

export interface ObserverConfig {
    travelRange: number;   // X, Y limits
    zTravelRange: number;  // Z depth limits
    zoomRange: number;    // Sensitivity of head-size change
    smoothing: number;    // 0.08 - the "latency" or "creaminess"
    damping: number;      // Reduction of rotation intensity
    lookDistance: number; // How far the focal point is
}

export const DEFAULT_OBSERVER_CONFIG: ObserverConfig = {
    travelRange: 100,
    zTravelRange: 500,
    zoomRange: 0.1,
    smoothing: 0.08,
    damping: 0.5,
    lookDistance: 1000
};

export interface BaseModifierSettings {
    enabled?: boolean;
}

export interface EffectBundle<
    TID extends string = string,
    TConfig extends BaseModifierSettings = BaseModifierSettings,
    E extends ResolvedBaseVisual = ResolvedBaseVisual,
> {
    readonly type: TID;
    readonly targets: ReadonlyArray<E['type']>;
    readonly defaults: TConfig;
    apply(current: E, state: SceneState, settings: TConfig, resolutionPool: Record<string, E>): E;
}

export type EffectLib = Record<string, EffectBundle<any, any, any>>;

export interface EffectBlueprint<K extends string = string, TConfig = any> {
    readonly type: K;
    readonly settings?: Partial<TConfig>;
}

export interface EffectResolutionGroup<
    TID extends string = string,
    TConfig extends BaseModifierSettings = any
> {
    readonly type: TID;
    readonly bundle: EffectBundle<TID, TConfig, any>;
    readonly settings?: TConfig; // Hydrated/Merged settings
}