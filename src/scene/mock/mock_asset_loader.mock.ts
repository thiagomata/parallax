import {ASSET_STATUS, type AssetLoader, type FontAsset, type TextureAsset} from "../types.ts";

export class ChaosLoader implements AssetLoader {
    async hydrateTexture(ref: { path: string }): Promise<TextureAsset> {
        // Default quick delay
        let delay = 10;

        // Targeted late promise for testing race conditions
        if (ref?.path === "late.png") {
            delay = 50;
        }

        await new Promise(resolve => setTimeout(resolve, delay));

        if (ref?.path === "fail.png") {
            return {
                status: ASSET_STATUS.ERROR,
                value: null,
                error: "Could not decode"
            };
        }

        if (ref == null) {
            return {
                status: ASSET_STATUS.READY,
                value: null,
            }
        }

        return {
            status: ASSET_STATUS.READY,
            value: {
                texture: ref as any,
                internalRef: `ptr_${ref ? ref.path : "none"}`
            }
        };
    }

    async hydrateFont(ref: { path: string }): Promise<FontAsset> {
        // Default quick delay
        let delay = 10;

        // Targeted late promise for testing race conditions
        if (ref?.path === "late.ttf") {
            delay = 50;
        }

        await new Promise(resolve => setTimeout(resolve, delay));

        if (ref?.path === "fail.ttf") {
            return {
                status: ASSET_STATUS.ERROR,
                value: null,
                error: "Could not decode"
            };
        }

        return {
            status: ASSET_STATUS.READY,
            value: ref == null ? null : {
                font: ref as any,
                internalRef: `ptr_${ref ? ref.path : "none"}`
            }
        };
    }
}