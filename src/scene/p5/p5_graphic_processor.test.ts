import {beforeEach, describe, expect, it, vi} from 'vitest';
import p5 from 'p5';
import {P5GraphicProcessor} from './p5_graphic_processor';
import {
    ASSET_STATUS,
    type AssetLoader,
    ELEMENT_TYPES,
    type ElementAssets,
    type ResolvedBox,
    type ResolvedText,
} from '../types';
import {createMockState} from "../mock/mock_scene_state.mock.ts";
import type {P5Bundler} from "./p5_asset_loader.ts";
import {createMockP5} from "../mock/mock_p5.mock.ts";

describe('P5GraphicProcessor', () => {
    let gp: P5GraphicProcessor;
    let mockP5: any;
    let mockLoader: AssetLoader<P5Bundler>;

    const mockState = createMockState(
        {x: 0, y: 0, z: 0},
        {x: 0, y: 0, z: 100},
    );

    beforeEach(() => {
        // Full mock of p5 context
        mockP5 = createMockP5()

        mockLoader = {
            hydrateTexture: vi.fn(),
            hydrateFont: vi.fn(),
        };

        gp = new P5GraphicProcessor(mockP5 as unknown as p5, mockLoader);
    });

    describe('Alpha & Styling Logic', () => {
        it('should correctly scale alpha to 0-255 for p5', () => {
            const color = {red: 255, green: 0, blue: 0, alpha: 0.5};
            gp.fill(color, 1);
            // 0.5 (color) * 1 (input) * 255 = 127.5 -> 128
            expect(mockP5.fill).toHaveBeenCalledWith(255, 0, 0, 128);
        });

        it('should handle stroke with global alpha correctly', () => {
            const color = {red: 0, green: 255, blue: 0, alpha: 0.8};
            gp.stroke(color, 2, 0.5);
            // (0.8 * 0.5) * 255 = 102
            expect(mockP5.strokeWeight).toHaveBeenCalledWith(2);
            expect(mockP5.stroke).toHaveBeenCalledWith(0, 255, 0, 102);
        });
    });

    describe('Texture Drawing (Phase 3)', () => {
        it('should apply texture, mode, and tint when READY', () => {
            const boxProps: ResolvedBox = {
                type: ELEMENT_TYPES.BOX,
                position: {x: 10, y: 10, z: 10},
                size: 50,
                alpha: 1
            };

            const mockImage = {width: 100} as p5.Image;
            const assets: ElementAssets<P5Bundler> = {
                texture: {
                    status: ASSET_STATUS.READY,
                    value: {internalRef: mockImage, texture: {path: 'a.png', width: 100, height: 100}}
                }
            };

            gp.drawBox(boxProps, assets, mockState);

            expect(mockP5.texture).toHaveBeenCalledWith(mockImage);
            expect(mockP5.textureMode).toHaveBeenCalledWith('normal');
            expect(mockP5.tint).toHaveBeenCalled();
            expect(mockP5.box).toHaveBeenCalledWith(50);
        });

        it('should fallback to fill color if texture is loading', () => {
            const boxProps: ResolvedBox = {
                type: ELEMENT_TYPES.BOX,
                position: {x: 0, y: 0, z: 0},
                size: 10,
                fillColor: {red: 255, green: 0, blue: 0}
            };

            const assets: ElementAssets<P5Bundler> = {
                texture: {status: ASSET_STATUS.LOADING, value: null}
            };

            gp.drawBox(boxProps, assets, mockState);

            expect(mockP5.texture).not.toHaveBeenCalled();
            expect(mockP5.fill).toHaveBeenCalled();
        });
    });

    describe('Text Rendering', () => {
        it('should set font and size only if READY', () => {
            const textProps: ResolvedText = {
                type: ELEMENT_TYPES.TEXT,
                text: 'Hello',
                size: 32,
                position: {x: 0, y: 0, z: 0}
            };

            const mockFont = {name: 'Arial'} as unknown as p5.Font;
            const assets: ElementAssets<P5Bundler> = {
                font: {
                    status: ASSET_STATUS.READY,
                    value: {internalRef: mockFont, font: {name: 'Arial', path: 'a.ttf'}}
                }
            };

            gp.drawText(textProps, assets, mockState);

            expect(mockP5.textFont).toHaveBeenCalledWith(mockFont);
            expect(mockP5.textSize).toHaveBeenCalledWith(32);
            expect(mockP5.text).toHaveBeenCalledWith('Hello', 0, 0);
        });
    });

    describe('Coordinate Utilities', () => {
        it('should correctly draw crosshairs with translations', () => {
            gp.drawCrosshair({x: 100, y: 100}, 5);
            expect(mockP5.translate).toHaveBeenCalledWith(100, 100, 0);
            expect(mockP5.line).toHaveBeenCalledTimes(2);
        });
    });
});