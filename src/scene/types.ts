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
  | { value: T; error: null } 
  | { value: null; error: string };

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

/**
 * SECTION 2: ASSET STATE MACHINE
 */
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
}

export interface TextureInstance {
  readonly texture?: TextureRef;
  readonly internalRef: any;
}

export type TextureAsset =
  | { readonly status: typeof ASSET_STATUS.PENDING; readonly value: null; readonly error: null }
  | { readonly status: typeof ASSET_STATUS.LOADING; readonly value: null; readonly error: null }
  | { readonly status: typeof ASSET_STATUS.READY;   readonly value: TextureInstance | null; readonly error: null }
  | { readonly status: typeof ASSET_STATUS.ERROR;   readonly value: null; readonly error: string };

/**
 * SECTION 3: DRAWING & HYDRATION
 */
export interface AssetLoader {
  hydrate(ref: TextureRef): Promise<TextureAsset>;
}

export type ColorRGB = [number, number, number];

export interface GraphicProcessor {
  readonly loader: AssetLoader;
  setCamera(pos: Vector3, lookAt: Vector3): void;
  push(): void;
  pop(): void;
  translate(x: number, y: number, z: number): void;
  rotateX(angle: number): void;
  rotateY(angle: number): void;
  rotateZ(angle: number): void;
  fill(color: ColorRGB, alpha?: number): void;
  drawBox(size: number): void;
  drawPlane(width: number, height: number): void;
  drawTexture(instance: TextureInstance, w: number, h: number, alpha: number): void;
  dist(v1: Vector3, v2: Vector3): number;
  map(val: number, s1: number, st1: number, s2: number, st2: number, clamp?: boolean): number;
  lerp(start: number, stop: number, amt: number): number;

  drawLabel(s: string, param2: { x: number; y: number | undefined; z: number | undefined }): void;

  drawText(s: string, param2: { x: number; y: number | undefined; z: number | undefined }): void;

  drawCrosshair(param: { x: number; y: number | undefined; z: number | undefined }, number: number): void;

  drawHUDText(s: string, number: number, number2: number): void;
}

  /**
 * SECTION 4: ELEMENTS & PROPS
 */
export const ELEMENT_TYPES = {
  BOX: 'box',
  PANEL: 'panel',
  SPHERE: 'sphere',
  FLOOR: 'floor'
} as const;

export interface BaseVisualProps {
  readonly position: Vector3;
  readonly alpha?: number;
  readonly color?: ColorRGB;
  readonly texture?: TextureRef;
}

export interface BoxProps extends BaseVisualProps {
  readonly type: typeof ELEMENT_TYPES.BOX;
  readonly size: number;
}
export interface PanelProps extends BaseVisualProps { readonly type: typeof ELEMENT_TYPES.PANEL; readonly width: number; readonly height: number; }
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

export type SceneElementProps = BoxProps | PanelProps | SphereProps | FloorProps;

export interface Renderable {
  readonly id: string;
  render(gp: GraphicProcessor, state: SceneState): void;
}

export interface RenderableElement extends Renderable {
  readonly props: SceneElementProps;
  assets: {
    main?: TextureAsset
  };
}