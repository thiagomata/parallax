/**
 * A strict 3D vector.
 */
export interface Vector3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

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

/**
 * SCENE DATA STRUCTURES
 */
export interface SceneWindow {
    readonly width: number;
    readonly height: number;
    readonly aspectRatio: number;
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

export interface SceneCameraSettings {
    readonly position: Vector3;
    readonly lookAt: Vector3;
    readonly fov: number; // in radians
    readonly near: number;
    readonly far: number;
    readonly rotationLimits?: StickRotationLimits;
}

export interface SceneCameraState extends SceneCameraSettings {
    readonly yaw: number;
    readonly pitch: number;
    readonly roll: number;
    readonly direction: Vector3;
}

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
    window: SceneWindow;
    camera: SceneCameraSettings;
    playback: PlaybackSettings;
    debug: boolean;
    alpha: number;
    startPaused: boolean;
}

export interface SceneState {
    sceneId: number;
    settings: SceneSettings;
    playback: ScenePlaybackState;
    camera: SceneCameraState;
    debugStateLog?: SceneStateDebugLog;
    elements?: Map<string, ResolvedElement>;
    projectionMatrix?: ProjectionMatrix;
}

export const DEFAULT_CAMERA_FAR = 5000;

export const DEFAULT_SETTINGS: SceneSettings = {
    window: {
        width: 800,
        height: 600,
        aspectRatio: 800 / 600
    },
    camera: {
        position: {x: 0, y: 0, z: 500} as Vector3,
        lookAt: {x: 0, y: 0, z: 0} as Vector3,
        fov: Math.PI / 3, // 60 degrees
        near: 0.1,
        far: DEFAULT_CAMERA_FAR,
        rotationLimits: DEFAULT_ROTATION_LIMITS
    },
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
    readonly confidence?: number; // Optional confidence for future weighting
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
    readonly category?: 'world' | 'head'; // undefined defaults to 'head' for backward compatibility
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

    setCamera(pos: Vector3, lookAt: Vector3): void;

    setProjectionMatrix?(projectionMatrix: ProjectionMatrix): void;

    // push(): void;

    // pop(): void;

    translate(pos: Vector3): void;

    // rotateX(angle: number): void;
    //
    // rotateY(angle: number): void;
    //
    // rotateZ(angle: number): void;

    fill(color: ColorRGBA, alpha?: number): void;

    noFill(): void;

    stroke(color: ColorRGBA, weight: number, globalAlpha?: number): void;

    noStroke(): void;

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

    drawLabel(s: string, pos: Partial<Vector3>): void;

    drawCrosshair(pos: Partial<Vector3>, size: number): void;

    drawHUDText(s: string, x: number, y: number): void;

    // plane(width: number, height: number): void;

    dist(v1: Vector3, v2: Vector3): number;

    map(val: number, s1: number, st1: number, s2: number, st2: number, clamp?: boolean): number;

    lerp(start: number, stop: number, amt: number): number;

    text(s: string, pos: Partial<Vector3>): void;

    millis(): number;

    deltaTime(): number;

    frameCount(): number;

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

export type DynamicProperty<T> =
    | { kind: typeof SPEC_KINDS.STATIC; value: T }
    | { kind: typeof SPEC_KINDS.COMPUTED; compute: (state: SceneState) => T | DynamicProperty<T> | DynamicTree<T> }
    | { kind: typeof SPEC_KINDS.BRANCH; value: DynamicTree<T> };

export type DynamicTree<T> = { [K in keyof T]?: DynamicProperty<T[K]>; };
export type FlexibleSpec<T> =
    T
    | ((state: SceneState) => T | DynamicProperty<T> | DynamicTree<T>)
    | (T extends object ? BlueprintTree<T> : never);
export type BlueprintTree<T> = { [K in keyof T]?: FlexibleSpec<T[K]>; };

export const IDENTITY_KEYS = ['type', 'texture', 'font', 'modifiers'] as const;
type StaticKeys = typeof IDENTITY_KEYS[number];
export type MapToBlueprint<T> = { -readonly [K in keyof T]: K extends StaticKeys ? T[K] : FlexibleSpec<T[K]>; } & {
    effects?: EffectBlueprint[];
};
export type MapToDynamic<T> = { [K in keyof T]: K extends StaticKeys ? T[K] : DynamicProperty<T[K]>; } & {
    effects?: EffectResolutionGroup[];
};
export type Unwrapped<T> = T extends DynamicProperty<infer U> ? Unwrapped<U> : T extends object ? { [K in keyof T]: Unwrapped<T[K]> } : T;

/**
 * ELEMENT DEFINITIONS
 */
export interface ResolvedBaseVisual {
    readonly id?: string;
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
    apply(current: E, state: SceneState, settings: TConfig): E;
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