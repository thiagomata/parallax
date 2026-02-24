import {
    type AssetLoader,
    DEFAULT_SCENE_SETTINGS,
    type EffectLib,
    type GraphicsBundle,
    type ProjectionEffectLib,
    type SceneSettings
} from "./types.ts";
import {Stage} from "./stage.ts";
import {SceneClock} from "./scene_clock.ts";
import {merge} from "./utils/merge.ts";

const DEFAULT_WORLD_SETTINGS_LIBS = {
    elementEffectLib: {},
    projectionEffectLib: {}
}

export class WorldSettings<
    TBundle extends GraphicsBundle,
    TElementEffectLib extends EffectLib,
    TProjectionEffectLib extends ProjectionEffectLib,
> {
    readonly clock: SceneClock;
    readonly loader: AssetLoader<TBundle>;
    readonly settings: SceneSettings;
    readonly stage: Stage<TBundle, TElementEffectLib, TProjectionEffectLib>;

    static fromLibs<
        TBundle extends GraphicsBundle,
        TElementEffectLib extends EffectLib,
        TProjectionEffectLib extends ProjectionEffectLib,
    >(
        data: {
            clock?: SceneClock,
            loader: AssetLoader<TBundle>,
            elementEffectLib?: TElementEffectLib,
            projectionEffectLib?: TProjectionEffectLib;
            settings?: Partial<SceneSettings>,
        }
    ) {
        const loader = data.loader;
        const elementEffectLib = data.elementEffectLib ?? DEFAULT_WORLD_SETTINGS_LIBS.elementEffectLib as TElementEffectLib;
        const projectionEffectLib = data.projectionEffectLib ?? DEFAULT_WORLD_SETTINGS_LIBS.projectionEffectLib as TProjectionEffectLib;
        const settings = merge(DEFAULT_SCENE_SETTINGS, data.settings ?? {});
        const clock = data.clock ?? new SceneClock(settings);
        const stage = new Stage<TBundle, TElementEffectLib, TProjectionEffectLib>(
            settings,
            loader,
            elementEffectLib,
            projectionEffectLib,
        );
        return new WorldSettings(
            loader,
            settings,
            clock,
            stage
        );
    }

    static fromStage<
        TBundle extends GraphicsBundle,
        TElementEffectLib extends EffectLib,
        TProjectionEffectLib extends ProjectionEffectLib,
    >(
        data: {
            clock?: SceneClock,
            loader: AssetLoader<TBundle>,
            stage: Stage<TBundle, TElementEffectLib, TProjectionEffectLib>,
            settings?: Partial<SceneSettings>,
        }
    ) {
        const loader = data.loader;
        const settings = merge(DEFAULT_SCENE_SETTINGS, data.settings ?? {});
        const clock = data.clock ?? new SceneClock(settings);
        return new WorldSettings(
            loader,
            settings,
            clock,
            data.stage
        );
    }

    constructor(
        loader: AssetLoader<TBundle>,
        settings: SceneSettings,
        clock: SceneClock,
        stage: Stage<TBundle, TElementEffectLib, TProjectionEffectLib>
    ) {
        this.loader = loader;
        this.settings = settings;
        this.clock = clock;
        this.stage = stage;
    }
}
