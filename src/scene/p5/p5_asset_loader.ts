import p5 from 'p5';
import {
    ASSET_STATUS,
    type AssetLoader,
    type FontAsset,
    type FontRef,
    type GraphicsBundle,
    type TextureAsset,
    type TextureRef,
} from '../types';

export interface P5Bundler extends GraphicsBundle {
    readonly texture: p5.Image;
    readonly font: p5.Font;
}

export class P5AssetLoader implements AssetLoader<P5Bundler> {
    private p: p5;
    private textureCache = new Map<string, Promise<TextureAsset<P5Bundler['texture']>>>();
    private fontCache = new Map<string, Promise<FontAsset<P5Bundler['font']>>>();

    constructor(p: p5) {
        this.p = p;
    }

    public hydrateTexture(ref: TextureRef): Promise<TextureAsset<P5Bundler['texture']>> {
        const cached = this.textureCache.get(ref.path);
        if (cached) return cached;

        const promise = new Promise<TextureAsset<P5Bundler['texture']>>((resolve) => {
            this.p.loadImage(
                ref.path,
                (img) => resolve(
                    {
                        status: ASSET_STATUS.READY,
                        value: {texture: ref, internalRef: img}
                    }
                ),
                () => resolve(
                    {
                        status: ASSET_STATUS.ERROR,
                        value: null,
                        error: `Load failed: ${ref.path}`
                    }
                )
            );
        });

        this.textureCache.set(ref.path, promise);
        return promise;
    }

    public hydrateFont(ref: FontRef): Promise<FontAsset<P5Bundler['font']>> {
        const cached = this.fontCache.get(ref.path);
        if (cached) return cached;

        const promise = new Promise<FontAsset<P5Bundler['font']>>((resolve) => {
            this.p.loadFont(
                ref.path,
                (fnt) => resolve(
                    {
                        status: ASSET_STATUS.READY,
                        value: {font: ref, internalRef: fnt}
                    }
                ),
                () => resolve(
                    {
                        status: ASSET_STATUS.ERROR,
                        value: null,
                        error: "Load failed"
                    }
                )
            );
        });

        this.fontCache.set(ref.path, promise);
        return promise;
    }

    /**
     * Resolves when every asset currently in the cache has finished loading
     * (either READY or ERROR). This ensures the "Stage" is fully hydrated.
     */
    public async waitForAllAssets(): Promise<void> {
        // Collect all promises from both caches
        const allPending = [
            ...this.textureCache.values(),
            ...this.fontCache.values()
        ];

        // Wait for all to settle
        await Promise.all(allPending);
    }
}