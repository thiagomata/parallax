import {beforeEach, describe, expect, it, vi} from 'vitest';
import p5 from 'p5';
import {P5AssetLoader} from './p5_asset_loader';
import {ASSET_STATUS} from '../types';

describe('P5AssetLoader', () => {
    let loader: P5AssetLoader;
    let mockP5: any;

    beforeEach(() => {
        mockP5 = {
            loadImage: vi.fn(),
            loadFont: vi.fn(),
        };
        loader = new P5AssetLoader(mockP5 as unknown as p5);
        vi.spyOn(console, 'error').mockImplementation(() => {
        });
    });

    describe('Caching & Deduplication', () => {
        it('should return the same promise and only call p5 once for duplicate paths', async () => {
            const ref = {path: 'shared/sprite.png', width: 32, height: 32};

            // Mock a delayed response
            mockP5.loadImage.mockImplementation((_path: any, success: (arg0: {}) => any) => {
                setTimeout(() => success({}), 10);
            });

            // Trigger two loads simultaneously
            const promise1 = loader.hydrateTexture(ref);
            const promise2 = loader.hydrateTexture(ref);

            expect(promise1).toBe(promise2); // Reference equality on the Promise
            expect(mockP5.loadImage).toHaveBeenCalledTimes(1);

            await Promise.all([promise1, promise2]);
        });
    });

    describe('hydrateTexture', () => {
        it('should resolve with READY status when loadImage succeeds', async () => {
            const ref = {path: 'assets/hero.png', width: 64, height: 64};
            const mockImg = {width: 64, height: 64};

            mockP5.loadImage.mockImplementation((_path: any, successCb: (arg0: {
                width: number;
                height: number;
            }) => any) => successCb(mockImg));

            const result = await loader.hydrateTexture(ref);

            expect(result.status).toBe(ASSET_STATUS.READY);
            if (result.status === ASSET_STATUS.READY) {
                expect(result.value?.internalRef).toBe(mockImg);
                expect(result.value?.texture).toBe(ref);
            }
        });

        it('should resolve with ERROR status when loadImage fails', async () => {
            const ref = {path: 'assets/broken.png', width: 0, height: 0};

            // Trigger the error callback
            mockP5.loadImage.mockImplementation((_path: any, _success: any, errorCb: (arg0: Error) => any) => errorCb(new Error('404')));

            const result = await loader.hydrateTexture(ref);

            expect(result.status).toBe(ASSET_STATUS.ERROR);
            expect(result.value).toBeNull();
        });
    });

    describe('hydrateFont', () => {
        it('should deduplicate font loading', () => {
            const ref = {name: 'Roboto', path: 'fonts/roboto.ttf'};

            loader.hydrateFont(ref);
            loader.hydrateFont(ref);

            expect(mockP5.loadFont).toHaveBeenCalledTimes(1);
        });

        it('should resolve with READY status when loadFont succeeds', async () => {
            const ref = {name: 'Roboto', path: 'fonts/roboto.ttf'};
            const mockFont = {name: 'Roboto'};

            mockP5.loadFont.mockImplementation((_path: any, successCb: (arg0: {
                name: string;
            }) => any) => successCb(mockFont));

            const result = await loader.hydrateFont(ref);

            expect(result.status).toBe(ASSET_STATUS.READY);
            if (result.status === ASSET_STATUS.READY) {
                expect(result.value?.internalRef).toBe(mockFont);
            }
        });

        it('should resolve with ERROR status when loadFont fails', async () => {
            const ref = {name: 'Broken', path: 'fonts/broken.ttf'};

            mockP5.loadFont.mockImplementation((_path: any, _success: any, errorCb: () => void) => errorCb());

            const result = await loader.hydrateFont(ref);

            expect(result.status).toBe(ASSET_STATUS.ERROR);
            expect(result.value).toBeNull();
        });
    });
});