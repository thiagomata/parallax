/**
 * A strict 3D vector.
 * Used for absolute positions (The Car) where all coordinates are required.
 */
export interface Vector3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

/**
 * A container for operations that can fail.
 * Value and error are mutually exclusive in practice.
 */
export type FailableResult<T> =
    | { success: true, value: T; }
    | { success: false, error: string };

export interface CarResult {
    name: string;
    position: Vector3;
}

export interface StickResult {
    readonly yaw: number;      // Left/Right rotation in radians
    readonly pitch: number;    // Up/Down rotation in radians
    readonly distance: number; // Distance from the camera to the focal point
    readonly priority: number;
}

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
    readonly focusDistance?: number; // Distance from camera to the focal plane
    readonly aperture?: number;      // "Strength" of the blur (e.g., f-stop)
    readonly blurMax?: number;       // Limit for post-processing blur
}

export interface SceneCameraState extends SceneCameraSettings {
    readonly yaw: number;
    readonly pitch: number;
    readonly direction: Vector3;
}

export interface PlaybackSettings {
    readonly duration?: number;    // Total cycle time in ms (e.g., 5000 for 5s)
    readonly isLoop: boolean;     // Should the global clock reset or stop?
    readonly timeSpeed: number;   // Multiplier (1.0 = real time, 2.0 = double speed)
    readonly startTime: number;   // Sync point for the animation
}

export interface ScenePlaybackState {
    readonly now: number;
    readonly delta: number;
    readonly progress: number; // defaults 0 for playback without duration
    readonly frameCount: number;
}

export interface SceneSettings {
    window: SceneWindow;
    camera: SceneCameraSettings;
    playback: PlaybackSettings;
    debug: boolean; // default false
    alpha: number; // default 1
}

export const DEFAULT_CAMERA_FAR = 5000

export const DEFAULT_SETTINGS: SceneSettings = {
    window: {
        width: 800,
        height: 600,
        aspectRatio: 800 / 600
    },
    camera: {
        position: {x:0, y:0, z:500} as Vector3,
        lookAt: {x:0, y:0, z:0} as Vector3,
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

export interface SceneState {
    settings: SceneSettings;
    playback: ScenePlaybackState;
    camera: SceneCameraState;
    debugStateLog?: SceneStateDebugLog;
}

export interface SceneStateDebugLog {
    car: { name: string; priority: number, x?: number; y?: number; z?: number };
    nudges: Array<{ name: string; x?: number; y?: number; z?: number }>;
    stick: { name: string; priority: number, yaw?: number; pitch?: number; distance?: number };
    errors: Array<{ name: string; message: string }>;
}

export interface CarModifier {
    name: string;
    active: boolean;
    readonly priority: number;

    getCarPosition(initialCam: Vector3): FailableResult<CarResult>;
}

export interface NudgeModifier {
    name: string;
    active: boolean;

    getNudge(currentCarPos: Vector3): FailableResult<Partial<Vector3>>;
}

export interface StickModifier {
    name: string;
    active: boolean;
    readonly priority: number;

    getStick(finalPos: Vector3): FailableResult<StickResult>;
}

export const ASSET_STATUS = {
    PENDING: 'PENDING',
    LOADING: 'LOADING',
    READY: 'READY',
    ERROR: 'ERROR',
} as const;

export type AssetStatus = typeof ASSET_STATUS[keyof typeof ASSET_STATUS];

export interface TextureRef {
    readonly width: number;
    readonly height: number;
    readonly path: string;
    readonly alpha?: number;
}

export interface TextureInstance<TTexture = unknown> {
    readonly texture: TextureRef;
    readonly internalRef: TTexture; // p5.Image, for example
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

export interface FontInstance<TFont = any> {
    readonly font: FontRef;
    readonly internalRef: TFont; // p5.Font, for example
}

export type FontAsset<TFont = any> =
    | { readonly status: typeof ASSET_STATUS.PENDING; readonly value: null; }
    | { readonly status: typeof ASSET_STATUS.LOADING; readonly value: null; }
    | { readonly status: typeof ASSET_STATUS.READY; readonly value: FontInstance<TFont> | null; }
    | { readonly status: typeof ASSET_STATUS.ERROR; readonly value: null; readonly error: string };

export interface AssetLoader {
    hydrateTexture(ref: TextureRef): Promise<TextureAsset>;

    hydrateFont(ref: FontRef): Promise<FontAsset>;
}

export type ColorRGBA = {
    red: number;
    green: number;
    blue: number;
    alpha?: number;
}

export interface GraphicProcessor<TTexture = any, TFont = any> {
    readonly loader: AssetLoader;

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

    drawText(
        textProp: FlatTextProps,
        assets: ElementAssets<TTexture, TFont>,
        sceneState: SceneState): void;

    drawBox(
        boxProps: FlatBoxProps,
        assets: ElementAssets<TTexture, TFont>,
        sceneState: SceneState): void;

    plane(width: number, height: number): void;

    //drawPanel(instance: TextureInstance): void;
    drawPanel(
        panelProps: FlatPanelProps,
        assets: ElementAssets<TTexture, TFont>,
        sceneState: SceneState): void;

    dist(v1: Vector3, v2: Vector3): number;

    map(val: number, s1: number, st1: number, s2: number, st2: number, clamp?: boolean): number;

    lerp(start: number, stop: number, amt: number): number;

    drawLabel(s: string, param2: { x: number; y: number | undefined; z: number | undefined }): void;

    text(s: string, param2: { x: number; y: number | undefined; z: number | undefined }): void;


    drawCrosshair(param: { x: number; y: number | undefined; z: number | undefined }, number: number): void;

    drawHUDText(s: string, number: number, number2: number): void;

    millis(): number;

    deltaTime(): number;

    frameCount(): number;
}

export const ELEMENT_TYPES = {
    BOX: 'box',
    PANEL: 'panel',
    SPHERE: 'sphere',
    FLOOR: 'floor',
    TEXT: 'text',
} as const;

export type DynamicValueFromSceneState<T> = T | ((state: SceneState) => T);

export type SpecProperty<T> =
    | { kind: 'static'; value: T }
    | { kind: 'computed'; compute: (state: SceneState) => T };

export type StaticKeys = 'type' | 'texture' | 'font';

export interface BaseVisualProps {
    readonly position: SpecProperty<Vector3>;
    readonly alpha?: SpecProperty<number>;
    readonly fillColor?: SpecProperty<ColorRGBA>;
    readonly strokeColor?: SpecProperty<ColorRGBA>;
    readonly strokeWidth?: SpecProperty<number>;
    readonly texture?: TextureRef;
    readonly font?: FontRef;
}

export interface FlatBaseVisualProps {
    readonly position: Vector3;
    readonly alpha?: number;
    readonly fillColor?: ColorRGBA;
    readonly strokeColor?: ColorRGBA;
    readonly strokeWidth?: number;
    readonly texture?: TextureRef;
    readonly font?: FontRef;
}

export interface BoxProps extends BaseVisualProps {
    readonly type: typeof ELEMENT_TYPES.BOX;
    readonly size: SpecProperty<number>;
}

export interface FlatBoxProps extends FlatBaseVisualProps {
    readonly type: typeof ELEMENT_TYPES.BOX;
    readonly size: number;
}

export interface PanelProps extends BaseVisualProps {
    readonly type: typeof ELEMENT_TYPES.PANEL;
    readonly width: SpecProperty<number>;
    readonly height: SpecProperty<number>;
}

export interface FlatPanelProps extends FlatBaseVisualProps {
    readonly type: typeof ELEMENT_TYPES.PANEL;
    readonly width: number;
    readonly height: number;
}

export interface SphereProps extends BaseVisualProps {
    readonly type: typeof ELEMENT_TYPES.SPHERE;
    readonly radius: SpecProperty<number>;
    readonly detail?: SpecProperty<number>;
}

export interface FlatSphereProps extends FlatBaseVisualProps {
    readonly type: typeof ELEMENT_TYPES.SPHERE;
    readonly radius: number;
    readonly detail?: number;
}

export interface FloorProps extends BaseVisualProps {
    readonly type: typeof ELEMENT_TYPES.FLOOR;
    readonly width: SpecProperty<number>;
    readonly depth: SpecProperty<number>;
}

export interface FlatFloorProps extends FlatBaseVisualProps {
    readonly type: typeof ELEMENT_TYPES.FLOOR;
    readonly width: number;
    readonly depth: number;
}

export interface TextProps extends BaseVisualProps {
    readonly type: typeof ELEMENT_TYPES.TEXT;
    readonly text: SpecProperty<string>;
    readonly size: SpecProperty<number>;
}

export interface FlatTextProps extends FlatBaseVisualProps {
    readonly type: typeof ELEMENT_TYPES.TEXT;
    readonly text: string;
    readonly size: number;
}

export type SceneElementProps = BoxProps | PanelProps | SphereProps | FloorProps | TextProps;
export type FlatSceneElementProps = FlatBoxProps | FlatPanelProps | FlatSphereProps | FlatFloorProps | FlatTextProps;

export interface Renderable {
    readonly id: string;

    render(gp: GraphicProcessor, state: SceneState): void;
}


export interface ElementAssets<TTexture = any, TFont = any> {
    texture?: TextureAsset<TTexture>
    font?: FontAsset<TFont>
}

export interface RenderableElement<TTexture = any, TFont = any> extends Renderable {
    readonly props: SceneElementProps;
    assets: ElementAssets<TTexture, TFont>;
}