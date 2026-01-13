/**
 * A strict 3D vector.
 */
export interface Vector3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

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

export interface SceneCameraSettings {
    readonly position: Vector3;
    readonly lookAt: Vector3;
    readonly fov?: number;
    readonly near?: number;
    readonly far?: number;
}

export interface SceneCameraState extends SceneCameraSettings {
    readonly yaw: number;
    readonly pitch: number;
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
}

export interface SceneState {
    settings: SceneSettings;
    playback: ScenePlaybackState;
    camera: SceneCameraState;
    debugStateLog?: SceneStateDebugLog;
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
        far: DEFAULT_CAMERA_FAR
    },
    playback: {
        duration: 5000,
        isLoop: true,
        timeSpeed: 1.0,
        startTime: 0
    },
    debug: false,
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
    readonly priority: number;
}

export interface CarModifier {
    name: string;
    active: boolean;
    readonly priority: number;

    getCarPosition(initialCam: Vector3, currentState: SceneState): FailableResult<CarResult>;
}

export interface NudgeModifier {
    name: string;
    active: boolean;

    getNudge(currentCarPos: Vector3, currentState: SceneState): FailableResult<Partial<Vector3>>;
}

export interface StickModifier {
    name: string;
    active: boolean;
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
}

/**
 * GRAPHIC PROCESSOR
 */
export type ColorRGBA = { red: number; green: number; blue: number; alpha?: number; }

export interface GraphicProcessor<TBundle extends GraphicsBundle> {
    readonly loader: AssetLoader<TBundle>;

    setCamera(pos: Vector3, lookAt: Vector3): void;

    push(): void;

    pop(): void;

    translate(pos: Vector3): void;

    rotateX(angle: number): void;

    rotateY(angle: number): void;

    rotateZ(angle: number): void;

    fill(color: ColorRGBA, alpha?: number): void;

    noFill(): void;

    stroke(color: ColorRGBA, weight: number, globalAlpha?: number): void;

    noStroke(): void;

    drawText(props: ResolvedText, assets: ElementAssets<TBundle>, state: SceneState): void;

    drawBox(props: ResolvedBox, assets: ElementAssets<TBundle>, state: SceneState): void;

    drawSphere(resolved: ResolvedSphere, assets: ElementAssets<TBundle>, state: SceneState): void;

    drawFloor(resolved: ResolvedFloor, assets: ElementAssets<TBundle>, state: SceneState): void;

    drawPanel(props: ResolvedPanel, assets: ElementAssets<TBundle>, state: SceneState): void;

    plane(width: number, height: number): void;

    dist(v1: Vector3, v2: Vector3): number;

    map(val: number, s1: number, st1: number, s2: number, st2: number, clamp?: boolean): number;

    lerp(start: number, stop: number, amt: number): number;

    drawLabel(s: string, pos: Partial<Vector3>): void;

    text(s: string, pos: Partial<Vector3>): void;

    drawCrosshair(pos: Partial<Vector3>, size: number): void;

    drawHUDText(s: string, x: number, y: number): void;

    millis(): number;

    deltaTime(): number;

    frameCount(): number;

}

/**
 * DYNAMIC ENGINE CORE
 */
export const ELEMENT_TYPES = {BOX: 'box', PANEL: 'panel', SPHERE: 'sphere', FLOOR: 'floor', TEXT: 'text'} as const;
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

type StaticKeys = 'type' | 'texture' | 'font';
export type MapToBlueprint<T> = { -readonly [K in keyof T]: K extends StaticKeys ? T[K] : FlexibleSpec<T[K]>; };
export type MapToDynamic<T> = { [K in keyof T]: K extends StaticKeys ? T[K] : DynamicProperty<T[K]>; };
export type Unwrapped<T> = T extends DynamicProperty<infer U> ? Unwrapped<U> : T extends object ? { [K in keyof T]: Unwrapped<T[K]> } : T;

/**
 * ELEMENT DEFINITIONS
 */
export interface ResolvedBaseVisual {
    readonly position: Vector3;
    readonly alpha?: number;
    readonly fillColor?: ColorRGBA;
    readonly strokeColor?: ColorRGBA;
    readonly strokeWidth?: number;
    readonly rotate?: Vector3;
    readonly texture?: TextureRef;
    readonly font?: FontRef;
}

export type DynamicElement<T extends ResolvedElement> = MapToDynamic<T>;


export interface ResolvedBox extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.BOX;
    readonly size: number;
}

export type BlueprintBox = MapToBlueprint<ResolvedBox>;
export type DynamicBox = DynamicElement<ResolvedBox>;

export interface ResolvedPanel extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.PANEL;
    readonly width: number;
    readonly height: number;
}

export type BlueprintPanel = MapToBlueprint<ResolvedPanel>;
export type DynamicPanel = DynamicElement<ResolvedPanel>;

export interface ResolvedSphere extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.SPHERE;
    readonly radius: number;
    readonly detail?: number;
}

export type BlueprintSphere = MapToBlueprint<ResolvedSphere>;
export type DynamicSphere = DynamicElement<ResolvedSphere>;

export interface ResolvedFloor extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.FLOOR;
    readonly width: number;
    readonly depth: number;
}

export type BlueprintFloor = MapToBlueprint<ResolvedFloor>;
export type DynamicFloor = DynamicElement<ResolvedFloor>;

export interface ResolvedText extends ResolvedBaseVisual {
    readonly type: typeof ELEMENT_TYPES.TEXT;
    readonly text: string;
    readonly size: number;
}

export type BlueprintText = MapToBlueprint<ResolvedText>;
export type DynamicText = DynamicElement<ResolvedText>;

export type BlueprintElement = BlueprintBox | BlueprintPanel | BlueprintSphere | BlueprintFloor | BlueprintText;
export type ResolvedElement = ResolvedBox | ResolvedPanel | ResolvedSphere | ResolvedFloor | ResolvedText;

/**
 * WORLD INTERFACES
 */

export interface Renderable<TBundle extends GraphicsBundle = GraphicsBundle> {
    readonly id: string;

    render(gp: GraphicProcessor<TBundle>, state: SceneState): void;
}

export interface RenderableElement<
    T extends ResolvedElement = ResolvedElement,
    TBundle extends GraphicsBundle = GraphicsBundle
> extends Renderable<TBundle> {
    readonly dynamic: DynamicElement<T>;
    assets: ElementAssets<TBundle>;
}

export function createBlueprint<T>(blueprint: MapToBlueprint<T>): MapToBlueprint<T> {
    return blueprint;
}