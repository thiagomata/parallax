import {beforeEach, describe, expect, it, vi} from 'vitest';
import p5 from 'p5';
import {P5GraphicProcessor} from './p5_graphic_processor';
import {
    ASSET_STATUS,
    type AssetLoader,
    DEFAULT_SETTINGS,
    ELEMENT_TYPES,
    type FlatBoxProps,
    type FlatPanelProps,
    type FlatTextProps,
    type SceneCameraState,
    type ScenePlaybackState,
    type SceneState,
} from '../types';
import {flatBox, flatPanel, flatText, toProps} from "../create_renderable.ts";

describe('P5GraphicProcessor', () => {
    let gp: P5GraphicProcessor;
    let mockP5: any;
    let mockLoader: AssetLoader;

    let mockState = {
        settings: DEFAULT_SETTINGS,
        playback: {
            now: Date.now(),
            delta: 0,
            progress: 0,
            frameCount: 60
        } as ScenePlaybackState,
        camera: {
            position: {x: 0, y: 0, z: 0},
            lookAt: {x: 0, y: 0, z: 100},
            yaw: 0,
            pitch: 0,
            direction: {x: 0, y: 0, z: 1},
        } as SceneCameraState
    } as SceneState;

    beforeEach(() => {
        mockP5 = {
            box: vi.fn(),
            camera: vi.fn(),
            dist: vi.fn(),
            fill: vi.fn(),
            line: vi.fn(),
            lerp: vi.fn(),
            map: vi.fn(),
            noStroke: vi.fn(),
            noFill: vi.fn(),
            panel: vi.fn(),
            plane: vi.fn(),
            pop: vi.fn(),
            push: vi.fn(),
            rotateX: vi.fn(),
            rotateY: vi.fn(),
            rotateZ: vi.fn(),
            stroke: vi.fn(),
            strokeWeight: vi.fn(),
            text: vi.fn(),
            textFont: vi.fn(),
            textSize: vi.fn(),
            texture: vi.fn(),
            textureMode: vi.fn(),
            tint: vi.fn(),
            translate: vi.fn(),
            NORMAL: 'normal'
        };
        mockLoader = {} as AssetLoader;
        gp = new P5GraphicProcessor(mockP5 as unknown as p5, mockLoader);
    });

    describe('Styling and Alpha Math', () => {
        it('should correctly calculate fill alpha (0-255 scale)', () => {
            const color = {red: 255, green: 0, blue: 0, alpha: 0.5};
            // Global alpha 1 * Color alpha 0.5 * input alpha 1 * 255 = 127.5 -> 128
            gp.fill(color, 1);
            expect(mockP5.fill).toHaveBeenCalledWith(255, 0, 0, 128);
        });

        it('should handle missing color alpha as 1', () => {
            const color = {red: 0, green: 255, blue: 0}; // No alpha property
            gp.fill(color, 0.5); // Input alpha 0.5
            expect(mockP5.fill).toHaveBeenCalledWith(0, 255, 0, 128);
        });
    });

    describe('High-level Drawing Logic', () => {
        it('should apply texture and tint if asset is READY', () => {
            const boxProps = flatBox(
                toProps(
                    {
                        type: ELEMENT_TYPES.BOX,
                        position: {x: 10, y: 20, z: 30},
                        size: 50,
                        alpha: 0.8
                    }
                ),
                mockState
            );

            const mockImage = {width: 100};
            const assets = {
                texture: {
                    status: ASSET_STATUS.READY,
                    value: {internalRef: mockImage as unknown as p5.Image, texture: {} as any}
                }
            };

            gp.drawBox(boxProps, assets, mockState);

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.translate).toHaveBeenCalledWith(10, 20, 30);
            expect(mockP5.texture).toHaveBeenCalledWith(mockImage);
            // Alpha check: 0.8 (props) * 1 (scene) * 255 = 204
            expect(mockP5.tint).toHaveBeenCalledWith(255, 204);
            expect(mockP5.box).toHaveBeenCalledWith(50);
            expect(mockP5.pop).toHaveBeenCalled();
        });

        it('should fallback to fillColor if texture is not READY', () => {
            const boxProps = flatBox(
                toProps({
                    type: ELEMENT_TYPES.BOX,
                    position: {x: 0, y: 0, z: 0},
                    size: 10,
                    fillColor: {red: 100, green: 100, blue: 100}
                }),
                mockState
            );

            const assets = {texture: {status: ASSET_STATUS.LOADING, value: null}};

            gp.drawBox(boxProps, assets, mockState);

            expect(mockP5.texture).not.toHaveBeenCalled();
            expect(mockP5.fill).toHaveBeenCalled();
        });
    });

    describe('Math Passthroughs', () => {
        it('should delegate dist calculation to p5', () => {
            const v1 = {x: 0, y: 0, z: 0};
            const v2 = {x: 10, y: 10, z: 10};
            gp.dist(v1, v2);
            expect(mockP5.dist).toHaveBeenCalledWith(0, 0, 0, 10, 10, 10);
        });
    });

    describe('P5GraphicProcessor - drawText', () => {
        const textProps: FlatTextProps = flatText(
            toProps({
                type: ELEMENT_TYPES.TEXT,
                text: 'Gemini',
                size: 24,
                position: {x: 10, y: 10, z: 10},
                fillColor: {red: 255, green: 255, blue: 255}
            }),
            mockState
        );

        it('should return early if font status is not READY', () => {
            const assets = {
                font: {status: ASSET_STATUS.LOADING, value: null}
            };
            gp.drawText(textProps, assets as any, mockState);
            expect(mockP5.push).not.toHaveBeenCalled();
        });

        it('should return early if font value is null', () => {
            const assets = {
                font: {status: ASSET_STATUS.READY, value: null}
            };
            gp.drawText(textProps, assets as any, mockState);
            expect(mockP5.push).not.toHaveBeenCalled();
        });

        it('should set textFont and textSize when font is READY', () => {
            const mockFont = {name: 'Arial'} as p5.Font;
            const assets = {
                font: {
                    status: ASSET_STATUS.READY,
                    value: {internalRef: mockFont, font: {} as any}
                }
            };

            gp.drawText(textProps, assets as any, mockState);

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.textFont).toHaveBeenCalledWith(mockFont);
            expect(mockP5.textSize).toHaveBeenCalledWith(24);
            expect(mockP5.text).toHaveBeenCalled();
            expect(mockP5.pop).toHaveBeenCalled();
        });
    });

    it('should apply stroke weight and calculated alpha', () => {
        const color = {red: 0, green: 255, blue: 0, alpha: 0.8};
        const weight = 2;
        const globalAlpha = 0.5;

        // Formula: (baseAlpha * globalAlpha) * 255
        // (0.8 * 0.5) * 255 = 102
        gp.stroke(color, weight, globalAlpha);

        expect(mockP5.strokeWeight).toHaveBeenCalledWith(2);
        expect(mockP5.stroke).toHaveBeenCalledWith(0, 255, 0, 102);
    });

    it('should turn off strokes when noStroke is called', () => {
        gp.noStroke();
        expect(mockP5.noStroke).toHaveBeenCalled();
    });

    it('should apply stroke from props when drawing a box', () => {
        const boxProps: FlatBoxProps = flatBox(
            toProps({
                type: ELEMENT_TYPES.BOX,
                position: {x: 0, y: 0, z: 0},
                size: 50,
                strokeColor: {red: 255, green: 0, blue: 0, alpha: 1},
                strokeWidth: 5
            }),
            mockState,
        );

        gp.drawBox(boxProps, {}, mockState);

        expect(mockP5.strokeWeight).toHaveBeenCalledWith(5);
        expect(mockP5.stroke).toHaveBeenCalledWith(255, 0, 0, 255);
    });

    it('should skip stroke application if strokeColor is missing in props', () => {
        const boxProps: FlatBoxProps = flatBox(
            toProps({
                type: ELEMENT_TYPES.BOX,
                position: {x: 0, y: 0, z: 0},
                size: 50
                // No strokeColor provided
            }),
            mockState
        );

        gp.drawBox(boxProps, {}, {alpha: 1} as any);

        expect(mockP5.stroke).not.toHaveBeenCalled();
        expect(mockP5.strokeWeight).not.toHaveBeenCalled();
    });

    it('should translate to the correct position and draw a plane', () => {
        const panelProps: FlatPanelProps = flatPanel(
            toProps({
                type: ELEMENT_TYPES.PANEL,
                position: {x: 100, y: -50, z: 200},
                width: 300,
                height: 150
            }),
            mockState,
        );

        gp.drawPanel(panelProps, {}, {alpha: 1} as any);

        expect(mockP5.push).toHaveBeenCalled();
        expect(mockP5.translate).toHaveBeenCalledWith(100, -50, 200);
        expect(mockP5.plane).toHaveBeenCalledWith(300, 150);
        expect(mockP5.pop).toHaveBeenCalled();
    });

    it('should apply both texture and stroke if both are provided', () => {
        const panelProps: FlatPanelProps = flatPanel(
            toProps({
                type: ELEMENT_TYPES.PANEL,
                position: {x: 0, y: 0, z: 0},
                width: 100,
                height: 100,
                strokeColor: {red: 255, green: 255, blue: 255, alpha: 1},
                strokeWidth: 2,
                alpha: 1
            }),
            mockState,
        );

        const mockImage = {width: 50};
        const assets = {
            texture: {
                status: ASSET_STATUS.READY,
                value: {internalRef: mockImage, texture: {} as any}
            }
        };

        gp.drawPanel(panelProps, assets as any, mockState);

        // Verify Texture logic
        expect(mockP5.texture).toHaveBeenCalledWith(mockImage);

        // Verify Stroke logic (internal drawStroke call)
        expect(mockP5.strokeWeight).toHaveBeenCalledWith(2);
        expect(mockP5.stroke).toHaveBeenCalledWith(255, 255, 255, 255);

        expect(mockP5.plane).toHaveBeenCalled();
    });

    it('should fallback to fillColor in drawPanel when texture is not ready', () => {
        const panelProps: FlatPanelProps = flatPanel(
            toProps({
                type: ELEMENT_TYPES.PANEL,
                position: {x: 0, y: 0, z: 0},
                width: 10,
                height: 10,
                fillColor: {red: 255, green: 0, blue: 0, alpha: 1}
            }),
            mockState,
        );

        // Asset is still loading
        const assets = {texture: {status: ASSET_STATUS.LOADING, value: null}};

        gp.drawPanel(panelProps, assets as any, mockState);

        expect(mockP5.texture).not.toHaveBeenCalled();
        expect(mockP5.fill).toHaveBeenCalledWith(255, 0, 0, 255);
    });

    it('should translate to the position and draw two intersecting lines', () => {
        const pos = {x: 50, y: 100, z: -20};
        const size = 10;

        gp.drawCrosshair(pos, size);

        // 1. Verify transformation
        expect(mockP5.push).toHaveBeenCalled();
        expect(mockP5.translate).toHaveBeenCalledWith(50, 100, -20);

        // 2. Verify the horizontal line: from -size to +size on X
        expect(mockP5.line).toHaveBeenCalledWith(-10, 0, 10, 0);

        // 3. Verify the vertical line: from -size to +size on Y
        expect(mockP5.line).toHaveBeenCalledWith(0, -10, 0, 10);

        // 4. Verify cleanup
        expect(mockP5.pop).toHaveBeenCalled();
    });

    it('should handle optional coordinate values (y/z) defaulting to 0', () => {
        // Testing the "pos.y ?? 0" and "pos.z ?? 0" logic in your implementation
        const partialPos = {x: 25} as any;

        gp.drawCrosshair(partialPos, 5);

        expect(mockP5.translate).toHaveBeenCalledWith(25, 0, 0);
    });

    it('should map setCamera to p5.camera with correct up-vector', () => {
        const pos = {x: 1, y: 2, z: 3};
        const lookAt = {x: 4, y: 5, z: 6};
        gp.setCamera(pos, lookAt);
        // Note the hardcoded 0, 1, 0 up-vector in your implementation
        expect(mockP5.camera).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6, 0, 1, 0);
    });

    it('should proxy rotation methods', () => {
        gp.rotateX(0.5);
        gp.rotateY(1.5);
        gp.rotateZ(2.5);
        expect(mockP5.rotateX).toHaveBeenCalledWith(0.5);
        expect(mockP5.rotateY).toHaveBeenCalledWith(1.5);
        expect(mockP5.rotateZ).toHaveBeenCalledWith(2.5);
    });

    it('should proxy plane dimensions', () => {
        gp.plane(200, 400);
        expect(mockP5.plane).toHaveBeenCalledWith(200, 400);
    });

    it('should proxy math utilities and return their values', () => {
        mockP5.map.mockReturnValue(50);
        mockP5.lerp.mockReturnValue(0.75);

        const mapResult = gp.map(10, 0, 100, 0, 1000);
        const lerpResult = gp.lerp(0, 10, 0.5);

        expect(mapResult).toBe(50);
        expect(lerpResult).toBe(0.75);
        expect(mockP5.map).toHaveBeenCalledWith(10, 0, 100, 0, 1000, undefined);
    });

    it('should apply coordinate defaults in drawLabel', () => {
        // Testing: pos.y ?? 0, pos.z ?? 0
        gp.drawLabel("Test", {x: 100} as any);
        expect(mockP5.text).toHaveBeenCalledWith("Test", 100, 0, 0);

        gp.drawLabel("Full", {x: 1, y: 2, z: 3});
        expect(mockP5.text).toHaveBeenCalledWith("Full", 1, 2, 3);
    });
});
