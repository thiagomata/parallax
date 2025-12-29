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
  | { success: true, value: T;}
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

export interface SceneState {
  camera: Vector3;
  lookAt: Vector3;
  alpha: number;
  debug?: SceneStateDebugLog;
}

export interface SceneStateDebugLog {
    car: { name: string; priority: number,  x?: number; y?: number; z?: number };
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
    | { readonly status: typeof ASSET_STATUS.PENDING; readonly value: null;}
    | { readonly status: typeof ASSET_STATUS.LOADING; readonly value: null;}
    | { readonly status: typeof ASSET_STATUS.READY;   readonly value: TextureInstance<TTexture> | null;}
    | { readonly status: typeof ASSET_STATUS.ERROR;   readonly value: null; readonly error: string };


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
    | { readonly status: typeof ASSET_STATUS.READY;   readonly value: FontInstance<TFont> | null; }
    | { readonly status: typeof ASSET_STATUS.ERROR;   readonly value: null; readonly error: string };

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
      textProp: TextProps,
      assets: ElementAssets<TTexture, TFont>,
      sceneState: SceneState): void;
  drawBox(
      boxProps: BoxProps,
      assets: ElementAssets<TTexture, TFont>,
      sceneState: SceneState): void;
  plane(width: number, height: number): void;
  //drawPanel(instance: TextureInstance): void;
  drawPanel(
      panelProps: PanelProps,
      assets: ElementAssets<TTexture, TFont>,
      sceneState: SceneState): void;
  dist(v1: Vector3, v2: Vector3): number;
  map(val: number, s1: number, st1: number, s2: number, st2: number, clamp?: boolean): number;
  lerp(start: number, stop: number, amt: number): number;

  drawLabel(s: string, param2: { x: number; y: number | undefined; z: number | undefined }): void;

  text(s: string, param2: { x: number; y: number | undefined; z: number | undefined }): void;


  drawCrosshair(param: { x: number; y: number | undefined; z: number | undefined }, number: number): void;

  drawHUDText(s: string, number: number, number2: number): void;
}

export const ELEMENT_TYPES = {
  BOX: 'box',
  PANEL: 'panel',
  SPHERE: 'sphere',
  FLOOR: 'floor',
  TEXT: 'text',
} as const;

export interface BaseVisualProps {
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
  readonly size: number;
}
export interface PanelProps extends BaseVisualProps {
  readonly type: typeof ELEMENT_TYPES.PANEL;
  readonly width: number;
  readonly height: number;
}
export interface SphereProps extends BaseVisualProps {
  readonly type: typeof ELEMENT_TYPES.SPHERE;
  readonly radius: number;
  readonly detail?: number;
}

export interface FloorProps extends BaseVisualProps {
  readonly type: typeof ELEMENT_TYPES.FLOOR;
  readonly width: number;
  readonly depth: number;
}

export interface TextProps extends BaseVisualProps {
  readonly type: typeof ELEMENT_TYPES.TEXT;
  readonly text: string;
  readonly size: number;
  // readonly width: number;
  // readonly height: number;
}

export type SceneElementProps = BoxProps | PanelProps | SphereProps | FloorProps | TextProps;

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