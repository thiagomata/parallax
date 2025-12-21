/**
 * A strict 3D vector. 
 * Used for absolute positions (The Car) where all coordinates are required.
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * A container for operations that can fail.
 * value and error are mutually exclusive in practice.
 */
export type FailableResult<T> = 
  | { value: T; error: null } 
  | { value: null; error: string };

export interface CarResult {
  position: Vector3;
}

export interface CarModifier {
  active: boolean;
  priority: number;
  /**
   * Defines the global anchor point. 
   * Manager uses "First Success Wins" based on priority.
   */
  getCarPosition(initialCam: Vector3): FailableResult<CarResult>;
}

export interface NudgeModifier {
  active: boolean;
  /**
   * Provides a partial offset. 
   * Manager averages these independently per axis.
   */
  getNudge(currentCarPos: Vector3): FailableResult<Partial<Vector3>>;
}

export interface StickResult {
  yaw: number;      // Left/Right rotation in radians
  pitch: number;    // Up/Down rotation in radians
  distance: number; // Distance from the camera to the focal point
  priority: number;
}

export interface StickModifier {
  active: boolean;
  priority: number;
  /**
   * Defines orientation relative to the final position.
   * Manager uses "First Success Wins" based on priority.
   */
  getStick(finalPos: Vector3): FailableResult<StickResult>;
}

export interface SceneState {
  camera: Vector3;
  lookAt: Vector3;
  debug: Record<string, any>;
}

export interface GraphicProcessor {
  // To be defined based on the rendering engine (Three.js, Pixi, etc.)
}