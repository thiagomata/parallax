import {
    ASSET_STATUS,
    type AssetLoader,
    type FontAsset,
    type FontRef,
    type GraphicsBundle,
    type TextureAsset,
    type TextureRef
} from "../types.ts";

export class ChaosLoader<TBundle extends GraphicsBundle> implements AssetLoader<TBundle> {

    /**
     * returns the Promise immediately.
     * The async/await logic is moved inside the constructor of the Promise.
     */
    hydrateTexture(ref: TextureRef): Promise<TextureAsset<TBundle['texture']>> {
        return new Promise((resolve) => {
            const delay = ref?.path === "late.png" ? 50 : 10;

            setTimeout(() => {
                if (ref?.path === "fail.png") {
                    return resolve({
                        status: ASSET_STATUS.ERROR, value: null, error: "Could not decode"
                    });
                }

                return resolve({
                    status: ASSET_STATUS.READY, value: ref ? {
                        texture: ref, internalRef: `ptr_${ref.path}` as TBundle['texture']
                    } : null
                });
            }, delay);
        });
    }

    hydrateFont(ref: FontRef): Promise<FontAsset<TBundle['font']>> {
        return new Promise((resolve) => {
            const delay = ref?.path === "late.ttf" ? 50 : 10;

            setTimeout(() => {
                if (ref?.path === "fail.ttf") {
                    resolve({
                        status: ASSET_STATUS.ERROR, value: null, error: "Could not decode"
                    });
                    return;
                }

                resolve({
                    status: ASSET_STATUS.READY, value: ref ? {
                        font: ref, internalRef: `ptr_${ref.path}` as TBundle['font']
                    } : null
                });
            }, delay);
        });
    }

    public async waitForAllAssets(): Promise<void> {
        return Promise.resolve();
    }
}