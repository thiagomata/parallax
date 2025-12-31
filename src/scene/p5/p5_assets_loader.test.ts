import {beforeEach, describe, expect, it, vi} from 'vitest';
import p5 from 'p5';
import {P5AssetLoader} from './p5_asset_loader';
import {ASSET_STATUS} from '../types';

describe('P5AssetLoader', () => {
    let loader: P5AssetLoader;
    let mockP5: any;

    beforeEach(() => {
        // Create a mock p5 instance
        mockP5 = {
            loadImage: vi.fn(),
            loadFont: vi.fn(),
        };
        loader = new P5AssetLoader(mockP5 as unknown as p5);

        // Silence console.error for failure tests
        vi.spyOn(console, 'error').mockImplementation(() => {
        });
    });

    describe('hydrateTexture', () => {
        it('should resolve with READY status when loadImage succeeds', async () => {
            const ref = {path: 'assets/hero.png', width: 64, height: 64};
            const mockImg = {width: 64, height: 64};

            // Setup: Capture the success callback (2nd arg) and trigger it
            mockP5.loadImage.mockImplementation((_path: any, successCb: (arg0: {
                width: number;
                height: number;
            }) => void, _errorCb: any) => {
                successCb(mockImg);
            });

            const result = await loader.hydrateTexture(ref);

            expect(mockP5.loadImage).toHaveBeenCalledWith(ref.path, expect.any(Function), expect.any(Function));
            expect(result.status).toBe(ASSET_STATUS.READY);
            if (result.status === ASSET_STATUS.READY) {
                expect(result.value?.internalRef).toBe(mockImg);
                expect(result.value?.texture).toBe(ref);
            }
        });

        it('should resolve with ERROR status when loadImage fails', async () => {
            const ref = {path: 'assets/broken.png', width: 0, height: 0};
            const mockErr = new Error('404 Not Found');

            // Setup: Trigger the error callback (3rd arg)
            mockP5.loadImage.mockImplementation((_path: any, _successCb: any, errorCb: (arg0: Error) => void) => {
                errorCb(mockErr);
            });

            const result = await loader.hydrateTexture(ref);

            expect(result.status).toBe(ASSET_STATUS.ERROR);
            if (result.status === ASSET_STATUS.ERROR) {
                expect(result.error).toContain('Could not load image');
                expect(result.value).toBeNull();
            }
        });
    });

    describe('hydrateFont', () => {
        it('should resolve with READY status when loadFont succeeds', async () => {
            const ref = {name: 'Roboto', path: 'fonts/roboto.ttf'};
            const mockFont = {name: 'Roboto'};

            mockP5.loadFont.mockImplementation((_path: any, successCb: (arg0: {
                name: string;
            }) => void, _errorCb: any) => {
                successCb(mockFont);
            });

            const result = await loader.hydrateFont(ref);

            expect(result.status).toBe(ASSET_STATUS.READY);
            if (result.status === ASSET_STATUS.READY) {
                expect(result.value?.internalRef).toBe(mockFont);
            }
        });

        it('should resolve with ERROR status when loadFont fails', async () => {
            const ref = {name: 'Ghost', path: 'fonts/missing.ttf'};

            mockP5.loadFont.mockImplementation((_path: any, _successCb: any, errorCb: (arg0: string) => void) => {
                errorCb('File not found');
            });

            const result = await loader.hydrateFont(ref);

            expect(result.status).toBe(ASSET_STATUS.ERROR);
            if (result.status === ASSET_STATUS.ERROR) {
                expect(result.error).toContain('Could not load font');
            }
        });
    });
});