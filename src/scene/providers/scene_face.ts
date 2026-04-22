import {
    type Rotation3,
    type Vector3,
    type FaceWidthRatio,
    type VideoPixels,
    type SceneUnits,
    type Scalar,
    divide
} from "../types.ts";

export interface FaceSceneConfig {
    sceneScreenWidth: SceneUnits;
    baseline: Vector3<SceneUnits>;
    cameraPosition: Vector3<SceneUnits>;
    depthScale: number;
    baselineHeadSceneUnits: SceneUnits,
}

export const DEFAULT_FACE_SIZE_SCENE_UNITS = 100 as SceneUnits;
export const DEFAULT_HEAD_SIZE_IN_SCREEN = 1 / 3 as Scalar;

export const DEFAULT_FACE_SCENE_CONFIG: FaceSceneConfig = {
    baselineHeadSceneUnits: DEFAULT_HEAD_SIZE_IN_SCREEN,
    sceneScreenWidth: divide(DEFAULT_FACE_SIZE_SCENE_UNITS, DEFAULT_HEAD_SIZE_IN_SCREEN),
    baseline: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 0 as SceneUnits },
    cameraPosition: { x: 0 as SceneUnits, y: 0 as SceneUnits, z: 300 as SceneUnits },
    depthScale: 1,
};

export class SceneFace {
    readonly config: FaceSceneConfig;
    readonly baseline: Vector3;
    readonly localPosition: Vector3<SceneUnits>;
    readonly localRotation: Rotation3;
    readonly headWidthScene: SceneUnits;
    readonly widthRatio: FaceWidthRatio;

    constructor(
        config: FaceSceneConfig,
        localPosition: Vector3<SceneUnits>,
        localRotation: Rotation3,
        headWidthScene: SceneUnits,
        widthRatio: FaceWidthRatio,
    ) {
        this.config = config;
        this.baseline = config.baseline;
        this.localPosition = localPosition;
        this.localRotation = localRotation;
        this.headWidthScene = headWidthScene;
        this.widthRatio = widthRatio;
    }

    get worldPosition(): Vector3<SceneUnits> {
        return {
            x: (this.baseline.x + this.localPosition.x) as SceneUnits,
            y: (this.baseline.y + this.localPosition.y) as SceneUnits,
            z: (this.baseline.z + this.localPosition.z) as SceneUnits,
        };
    }

    get depth(): number {
        return this.localPosition.z;
    }
}

export class SceneFaceBuilder {
    private _config: FaceSceneConfig;
    private _actualFaceWidthPixel: VideoPixels = -1 as VideoPixels;
    private _baselineWidthPixel: VideoPixels = -1 as VideoPixels;
    private _skullCenterNormalized: Vector3 = { x: 0.5, y: 0.5, z: 0.5 };
    private _rotation: Rotation3 = { yaw: 0, pitch: 0, roll: 0 };

    constructor(config: Partial<FaceSceneConfig> = {}) {
        this._config = { ...DEFAULT_FACE_SCENE_CONFIG, ...config };
    }

    config(config: Partial<FaceSceneConfig>): this {
        this._config = { ...this._config, ...config };
        return this;
    }

    actualFacePixelWidth(facePixelWidth: VideoPixels): this {
        this._actualFaceWidthPixel = facePixelWidth;
        return this;
    }

    baselineFacePixelWidth(width: VideoPixels): this {
        this._baselineWidthPixel = width;
        return this;
    }

    skullCenterNormalized(center: Vector3): this {
        this._skullCenterNormalized = center;
        return this;
    }

    rotation(rotation: Rotation3): this {
        this._rotation = rotation;
        return this;
    }

    build(): SceneFace {
        const config = this._config;

        const baselineDistance = Math.hypot(
            config.baseline.x - config.cameraPosition.x,
            config.baseline.y - config.cameraPosition.y,
            config.baseline.z - config.cameraPosition.z,
        );

        const ratio = this._actualFaceWidthPixel / this._baselineWidthPixel;
        
        const dx = config.baseline.x - config.cameraPosition.x;
        const dy = config.baseline.y - config.cameraPosition.y;
        const dz = config.baseline.z - config.cameraPosition.z;
        
        const dirX = dx / baselineDistance;
        const dirY = dy / baselineDistance;
        const dirZ = dz / baselineDistance;
        
        const distanceFromCamera = baselineDistance / ratio;
        
        const faceX = config.cameraPosition.x + dirX * distanceFromCamera;
        const faceY = config.cameraPosition.y + dirY * distanceFromCamera;
        const faceZ = config.cameraPosition.z + dirZ * distanceFromCamera;
        
        const localX = (faceX - config.baseline.x) * config.depthScale;
        const localY = (faceY - config.baseline.y) * config.depthScale;
        const localZ = (faceZ - config.baseline.z) * config.depthScale;

        const skullOffsetX = -(this._skullCenterNormalized.x - 0.5) * config.sceneScreenWidth;
        const skullOffsetY = (this._skullCenterNormalized.y - 0.5) * config.sceneScreenWidth;

        const localPosition: Vector3<SceneUnits> = {
            x: (localX + skullOffsetX) as SceneUnits,
            y: (localY + skullOffsetY) as SceneUnits,
            z: localZ as SceneUnits,
        };

        const localRotation: Rotation3 = {
            yaw:   this._rotation.yaw,
            pitch: -this._rotation.pitch,
            roll:  -this._rotation.roll,
        };

        const widthRatio = (1 / ratio) as FaceWidthRatio;

        return new SceneFace(
            config,
            localPosition,
            localRotation,
            config.baselineHeadSceneUnits,
            widthRatio,
        );
    }
}