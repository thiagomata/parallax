import type {Rotation3, Vector3} from "../types.ts";

export interface FaceSceneConfig {
    sceneScreenWidth?: number;
    baseline: Vector3;
    cameraPosition: Vector3;
    depthScale: number;
}

export const DEFAULT_FACE_SCENE_CONFIG: FaceSceneConfig = {
    sceneScreenWidth: 650,
    baseline: { x: 0, y: 0, z: 0 },
    cameraPosition: { x: 0, y: 0, z: 300 },
    depthScale: 1,
};

export class SceneFace {
    readonly config: FaceSceneConfig;
    readonly baseline: Vector3;
    readonly localPosition: Vector3;
    readonly localRotation: Rotation3;
    readonly headWidth: number;
    readonly widthRatio: number;

    constructor(
        config: FaceSceneConfig,
        localPosition: Vector3,
        localRotation: Rotation3,
        headWidth: number,
        widthRatio: number,
    ) {
        this.config = config;
        this.baseline = config.baseline;
        this.localPosition = localPosition;
        this.localRotation = localRotation;
        this.headWidth = headWidth;
        this.widthRatio = widthRatio;
    }

    get worldPosition(): Vector3 {
        return {
            x: this.baseline.x + this.localPosition.x,
            y: this.baseline.y + this.localPosition.y,
            z: this.baseline.z + this.localPosition.z,
        };
    }

    get depth(): number {
        return this.localPosition.z;
    }
}

export class SceneFaceBuilder {
    private _config: FaceSceneConfig;
    private _normalizedWidth: number = 1;
    private _baselineWidth: number = 180;
    private _skullCenterNormalized: Vector3 = { x: 0.5, y: 0.5, z: 0.5 };
    private _rotation: Rotation3 = { yaw: 0, pitch: 0, roll: 0 };

    constructor(config: Partial<FaceSceneConfig> = {}) {
        this._config = { ...DEFAULT_FACE_SCENE_CONFIG, ...config };
    }

    config(config: Partial<FaceSceneConfig>): this {
        this._config = { ...this._config, ...config };
        return this;
    }

    actualWidth(normalizedWidth: number): this {
        this._normalizedWidth = normalizedWidth;
        return this;
    }

    baselineWidth(width: number): this {
        this._baselineWidth = width;
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

        const ratio = this._normalizedWidth / this._baselineWidth;
        
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

        const screenWidth = config.sceneScreenWidth ?? this._baselineWidth;
        const skullOffsetX = -(this._skullCenterNormalized.x - 0.5) * screenWidth;
        const skullOffsetY = (this._skullCenterNormalized.y - 0.5) * screenWidth;
        
        const localPosition: Vector3 = {
            x: localX + skullOffsetX,
            y: localY + skullOffsetY,
            z: localZ,
        };

        const localRotation: Rotation3 = {
            yaw:   this._rotation.yaw,
            pitch: -this._rotation.pitch,
            roll:  -this._rotation.roll,
        };

        const widthRatio = 1 / ratio;

        return new SceneFace(
            config,
            localPosition,
            localRotation,
            this._baselineWidth,
            widthRatio,
        );
    }
}

export function computeDepthScale(physicalHeadWidth: number, focalLength: number): number {
    const scale = (physicalHeadWidth / 150) * focalLength;
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
}
