import type { EffectLib, ProjectionEffectLib, DataProviderLib } from "../../scene/types.ts";
import type { P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import type { World } from "../../scene/world.ts";
import type p5 from 'p5';
import type { SketchConfig } from "./sketch_config.ts";
import type { HeadProportions } from "../../scene/drivers/mediapipe/face.ts";

export { DEFAULT_SKETCH_CONFIG } from "./sketch_config.ts";
export type { SketchConfig };

export interface FaceConfig {
    throttleThreshold?: number;
    videoWidth?: number;
    videoHeight?: number;
    focalLength?: number;
    mirror?: boolean;
    headProportions?: HeadProportions;
}

export interface P5SketchExtraArgs {
    faceConfig?: FaceConfig;
}

export type P5Sketch = (
    p: p5, 
    config: SketchConfig,
    extraArgs?: P5SketchExtraArgs
) => World<P5Bundler, EffectLib, ProjectionEffectLib, DataProviderLib> 
  | Promise<World<P5Bundler, EffectLib, ProjectionEffectLib, DataProviderLib>>;

export type SketchInstance = {
    currentP5: p5 | null;
    currentWorld: World<P5Bundler, EffectLib, ProjectionEffectLib, DataProviderLib> | null;
};
