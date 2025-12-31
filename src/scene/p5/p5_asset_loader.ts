import p5 from 'p5';
import {
    ASSET_STATUS,
    type AssetLoader,
    type TextureAsset,
    type FontAsset,
    type TextureRef,
    type FontRef
} from '../types';

export class P5AssetLoader implements AssetLoader {
    private p: p5;

    constructor(p: p5) {
        this.p = p;
    }

    public async hydrateTexture(ref: TextureRef): Promise<TextureAsset> {
        return new Promise((resolve) => {
            this.p.loadImage(
                ref.path,
                (img) => {
                    resolve({
                        status: ASSET_STATUS.READY,
                        value: {
                            internalRef: img,
                            texture: ref
                        },
                    });
                },
                (err) => {
                    console.error(`Failed to load texture: ${ref.path}`, err);
                    resolve({
                        status: ASSET_STATUS.ERROR,
                        value: null,
                        error: `Could not load image at ${ref.path}`
                    });
                }
            );
        });
    }

    public async hydrateFont(ref: FontRef): Promise<FontAsset> {
        return new Promise((resolve) => {
            this.p.loadFont(
                ref.path,
                (font) => {
                    resolve({
                        status: ASSET_STATUS.READY,
                        value: {
                            internalRef: font,
                            font: ref
                        },
                    });
                },
                (err: any) => {
                    console.error(`Failed to load font: ${ref.path}`, err);
                    resolve({
                        status: ASSET_STATUS.ERROR,
                        value: null,
                        error: `Could not load font at ${ref.path}`
                    });
                }
            );
        });
    }
}