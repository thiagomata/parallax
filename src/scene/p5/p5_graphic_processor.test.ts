import {beforeEach, describe, expect, it, vi} from 'vitest';
import p5 from 'p5';
import {P5GraphicProcessor} from './p5_graphic_processor';
import {
    ASSET_STATUS,
    type AssetLoader,
    ELEMENT_TYPES,
    type ElementAssets,
    type ResolvedBox,
    type ResolvedBillboard,
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
            waitForAllAssets: vi.fn(),
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

    describe('Texture Drawing', () => {
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

    describe('P5 Wrapper Methods', () => {
        it('should call p5.map with correct parameters', () => {
            mockP5.map.mockReturnValue(50);
            const result = gp.map(10, 0, 20, 0, 100);
            expect(mockP5.map).toHaveBeenCalledWith(10, 0, 20, 0, 100, undefined);
            expect(result).toBe(50);
        });

        it('should call p5.map with clamping parameter', () => {
            mockP5.map.mockReturnValue(75);
            const result = gp.map(10, 0, 20, 0, 100, true);
            expect(mockP5.map).toHaveBeenCalledWith(10, 0, 20, 0, 100, true);
            expect(result).toBe(75);
        });

        it('should call p5.lerp with correct parameters', () => {
            mockP5.lerp.mockReturnValue(15);
            const result = gp.lerp(10, 20, 0.5);
            expect(mockP5.lerp).toHaveBeenCalledWith(10, 20, 0.5);
            expect(result).toBe(15);
        });

        it('should call p5.text with full position', () => {
            gp.text('Hello', {x: 10, y: 20, z: 30});
            expect(mockP5.text).toHaveBeenCalledWith('Hello', 10, 20, 30);
        });

        it('should call p5.text with partial position (defaults)', () => {
            gp.text('Hello', {x: 10});
            expect(mockP5.text).toHaveBeenCalledWith('Hello', 10, 0, 0);
        });

        it('should drawLabel using text method', () => {
            gp.drawLabel('Label', {x: 5, y: 10, z: 15});
            expect(mockP5.text).toHaveBeenCalledWith('Label', 5, 10, 15);
        });

        it('should drawHUDText using p5.text directly', () => {
            gp.drawHUDText('HUD', 100, 200);
            expect(mockP5.text).toHaveBeenCalledWith('HUD', 100, 200);
        });

        it('should call p5.plane wrapper method', () => {
            gp.plane(50, 75);
            expect(mockP5.plane).toHaveBeenCalledWith(50, 75);
        });
    });

    describe('Transform Stack Management', () => {
        it('should call push and pop in drawBox', () => {
            const boxProps: ResolvedBox = {
                type: ELEMENT_TYPES.BOX,
                position: {x: 0, y: 0, z: 0},
                size: 10
            };

            const assets: ElementAssets<P5Bundler> = {};

            gp.drawBox(boxProps, assets, mockState);

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.pop).toHaveBeenCalled();
        });

        it('should call noStroke wrapper method', () => {
            gp.noStroke();
            expect(mockP5.noStroke).toHaveBeenCalled();
        });

        it('should call rotateX wrapper method', () => {
            gp.rotateX(45);
            expect(mockP5.rotateX).toHaveBeenCalledWith(45);
        });

        it('should call rotateY wrapper method', () => {
            gp.rotateY(30);
            expect(mockP5.rotateY).toHaveBeenCalledWith(30);
        });

        it('should call rotateZ wrapper method', () => {
            gp.rotateZ(60);
            expect(mockP5.rotateZ).toHaveBeenCalledWith(60);
        });

        it('should call noFill wrapper method', () => {
            gp.noFill();
            expect(mockP5.noFill).toHaveBeenCalled();
        });

        it('should call box wrapper method', () => {
            gp.box(25);
            expect(mockP5.box).toHaveBeenCalledWith(25);
        });

        it('should call drawPanel with push/pop and all drawing methods', () => {
            const panelProps = {
                type: 'panel' as any,
                position: {x: 10, y: 20, z: 30},
                rotate: {x: 15, y: 30, z: 45},
                width: 100,
                height: 50
            };

            const assets: ElementAssets<P5Bundler> = {};

            gp.drawPanel(panelProps, assets, mockState);

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.translate).toHaveBeenCalledWith(10, 20, 30);
            expect(mockP5.rotateX).toHaveBeenCalledWith(15);
            expect(mockP5.rotateY).toHaveBeenCalledWith(30);
            expect(mockP5.rotateZ).toHaveBeenCalledWith(45);
expect(mockP5.plane).toHaveBeenCalledWith(100, 50);
            expect(mockP5.pop).toHaveBeenCalled();
        });
    });

    describe('Billboard Drawing', () => {
        it('should align with camera orientation when no locks are present', () => {
            const billboardProps: ResolvedBillboard = {
                type: ELEMENT_TYPES.BILLBOARD,
                position: {x: 10, y: 10, z: 10},
                width: 100,
                height: 50,
            };

            const assets: ElementAssets<P5Bundler> = {};
            // Mock state with specific camera rotation
            const cameraState = createMockState({x: 100, y: 100, z: 100}, {x:0,y:0,z:0});
            // Force specific SSoT values for the test
            (cameraState.camera as any).yaw = 0.5;
            (cameraState.camera as any).pitch = -0.2;
            (cameraState.camera as any).roll = 0.1;

            gp.drawBillboard(billboardProps, assets, cameraState);

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.translate).toHaveBeenCalledWith(10, 10, 10);

            // Should match the Camera SSoT exactly
            expect(mockP5.rotateY).toHaveBeenCalledWith(0.5);
            expect(mockP5.rotateX).toHaveBeenCalledWith(-0.2);
            expect(mockP5.rotateZ).toHaveBeenCalledWith(0.1);

            expect(mockP5.plane).toHaveBeenCalledWith(100, 50);
            expect(mockP5.pop).toHaveBeenCalled();
        });

        it('should respect axis locks by skipping specific rotations', () => {
            const billboardProps: ResolvedBillboard = {
                type: ELEMENT_TYPES.BILLBOARD,
                position: {x: 0, y: 0, z: 0},
                width: 100,
                height: 100,
                lockRotation: { y: true, z: true } // Only allow Pitch (X)
            };

            const assets: ElementAssets<P5Bundler> = {};
            const cameraState = createMockState({x: 0, y: 0, z: 0}, {x:0,y:0,z:0});
            (cameraState.camera as any).yaw = 1.1;
            (cameraState.camera as any).pitch = 2.2;
            (cameraState.camera as any).roll = 3.3;

            gp.drawBillboard(billboardProps, assets, cameraState);

            // Y and Z are locked, so rotateY and rotateZ should NOT be called
            expect(mockP5.rotateY).not.toHaveBeenCalled();
            expect(mockP5.rotateZ).not.toHaveBeenCalled();

            // X is not locked, so it should be called with camera pitch
            expect(mockP5.rotateX).toHaveBeenCalledWith(2.2);
        });

        it('should apply local user rotation after the billboard alignment', () => {
            const billboardProps: ResolvedBillboard = {
                type: ELEMENT_TYPES.BILLBOARD,
                position: {x: 0, y: 0, z: 0},
                width: 100,
                height: 50,
                rotate: { x: 0, y: 0, z: 1.57 } // User wants a 90-deg tilt
            };

            const assets: ElementAssets<P5Bundler> = {};
            const cameraState = createMockState({x: 0, y: 0, z: 0}, {x:0,y:0,z:0});

            // Set SSoT Camera Roll
            (cameraState.camera as any).roll = 0.5;

            gp.drawBillboard(billboardProps, assets, cameraState);

            // Get all calls to rotateZ
            const rotateZCalls = mockP5.rotateZ.mock.calls;

            // We expect at least 2 calls: one for billboard, one for user offset
            expect(rotateZCalls.length).toBeGreaterThanOrEqual(2);

            // 1st call: The Billboard alignment (matching camera roll)
            expect(rotateZCalls[0][0]).toBe(0.5);

            // 2nd call: The User's local rotation offset
            expect(rotateZCalls[1][0]).toBe(1.57);
        });
    });
});