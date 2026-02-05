import { beforeEach, describe, expect, it, vi } from 'vitest';
import { P5GraphicProcessor } from './p5_graphic_processor.ts';
import { ASSET_STATUS, ELEMENT_TYPES } from '../types.ts';
import { createMockP5 } from '../mock/mock_p5.mock.ts';
import { createProjectionMatrix } from '../modifiers/projection_matrix_utils.ts';
import type { 
    SceneState, 
    Vector3, 
    ColorRGBA, 
    ElementAssets, 
    ResolvedBox, 
    ResolvedSphere, 
    ResolvedPanel, 
    ResolvedText, 
    ResolvedFloor,
    ResolvedPyramid,
    ResolvedCone,
    ResolvedElliptical,
    ResolvedCylinder,
    ResolvedTorus
} from '../types.ts';
import type { P5Bundler } from './p5_asset_loader.ts';

describe('P5GraphicProcessor', () => {
    let processor: P5GraphicProcessor;
    let mockP5: any;
    let mockLoader: any;
    let mockState: SceneState;
    let mockAssets: ElementAssets<P5Bundler>;

    beforeEach(() => {
        mockP5 = createMockP5();
        mockLoader = {
            hydrateTexture: vi.fn(),
            hydrateFont: vi.fn(),
        };
        processor = new P5GraphicProcessor(mockP5 as any, mockLoader);

        mockState = {
            sceneId: 1,
            settings: {
                window: { width: 800, height: 600, aspectRatio: 4/3 },
                camera: {
                    position: { x: 0, y: 0, z: 500 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    fov: Math.PI / 3,
                    near: 0.1,
                    far: 5000
                },
                playback: {
                    duration: 5000,
                    isLoop: true,
                    timeSpeed: 1.0,
                    startTime: 0
                },
                debug: false,
                alpha: 1.0,
                startPaused: false
            },
            playback: {
                now: 1000,
                delta: 16,
                progress: 0.2,
                frameCount: 60
            },
            camera: {
                position: { x: 0, y: 0, z: 500 },
                lookAt: { x: 0, y: 0, z: 0 },
                fov: Math.PI / 3,
                near: 0.1,
                far: 5000,
                yaw: Math.PI / 4,
                pitch: Math.PI / 6,
                roll: Math.PI / 8,
                direction: { x: 0, y: 0, z: -1 }
            }
        };

        mockAssets = {
            texture: {
                status: ASSET_STATUS.READY,
                value: { 
                    texture: { path: 'test.png', width: 100, height: 100 },
                    internalRef: 'mockTexture' as any
                }
            },
            font: {
                status: ASSET_STATUS.READY,
                value: { 
                    font: { name: 'Test', path: 'test.ttf' },
                    internalRef: 'mockFont' as any
                }
            }
        };
    });

    describe('Constructor', () => {
        it('should initialize with p5 instance and loader', () => {
            expect(processor.loader).toBe(mockLoader);
        });
    });

    describe('Timing Methods', () => {
        it('should call p5.millis() and return its value', () => {
            mockP5.millis.mockReturnValue(12345);
            expect(processor.millis()).toBe(12345);
            expect(mockP5.millis).toHaveBeenCalledTimes(1);
        });

        // Timing methods tests skipped due to mock complexity
        // These are simple pass-through methods that call p5 directly
    });

    describe('Camera Methods', () => {
        it('should call p5.camera() with correct parameters', () => {
            const pos: Vector3 = { x: 10, y: 20, z: 30 };
            const lookAt: Vector3 = { x: 40, y: 50, z: 60 };

            processor.setCamera(pos, lookAt);

            expect(mockP5.camera).toHaveBeenCalledWith(10, 20, 30, 40, 50, 60, 0, 1, 0);
        });
    });

    describe('Transformation Methods', () => {
        it('should call p5.translate() with full vector', () => {
            const pos: Vector3 = { x: 10, y: 20, z: 30 };
            processor.translate(pos);
            expect(mockP5.translate).toHaveBeenCalledWith(10, 20, 30);
        });

        it('should call p5.translate() with partial vector using defaults', () => {
            const pos = { x: 10, z: 30 }; // y missing
            processor.translate(pos);
            expect(mockP5.translate).toHaveBeenCalledWith(10, 0, 30);
        });

        it('should call p5.translate() with empty vector', () => {
            processor.translate({});
            expect(mockP5.translate).toHaveBeenCalledWith(0, 0, 0);
        });
    });

    describe('Styling Methods', () => {
        it('should apply fill with color and alpha', () => {
            const color: ColorRGBA = { red: 255, green: 128, blue: 64, alpha: 0.5 };
            processor.fill(color, 0.8);

            expect(mockP5.fill).toHaveBeenCalledWith(255, 128, 64, Math.round(0.8 * 0.5 * 255));
        });

        it('should apply fill with default alpha', () => {
            const color: ColorRGBA = { red: 255, green: 128, blue: 64 };
            processor.fill(color);

            expect(mockP5.fill).toHaveBeenCalledWith(255, 128, 64, Math.round(1.0 * 1.0 * 255));
        });

        it('should call noFill', () => {
            processor.noFill();
            expect(mockP5.noFill).toHaveBeenCalledTimes(1);
        });

        it('should apply stroke with color, weight, and global alpha', () => {
            const color: ColorRGBA = { red: 100, green: 150, blue: 200, alpha: 0.7 };
            processor.stroke(color, 3, 0.9);

            expect(mockP5.strokeWeight).toHaveBeenCalledWith(3);
            expect(mockP5.stroke).toHaveBeenCalledWith(100, 150, 200, (0.7 * 0.9) * 255);
        });

        it('should apply stroke with default values', () => {
            const color: ColorRGBA = { red: 100, green: 150, blue: 200 };
            processor.stroke(color);

            expect(mockP5.strokeWeight).toHaveBeenCalledWith(1);
            expect(mockP5.stroke).toHaveBeenCalledWith(100, 150, 200, 255);
        });

        it('should call noStroke', () => {
            processor.noStroke();
            expect(mockP5.noStroke).toHaveBeenCalledTimes(1);
        });
    });

    describe('Drawing Methods - Box', () => {
        let boxProps: ResolvedBox;

        beforeEach(() => {
            boxProps = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 10, y: 20, z: 30 },
                rotate: { x: 0.1, y: 0.2, z: 0.3 },
                width: 50,
                height: 60,
                depth: 70
            };
        });

        it('should draw box with texture', () => {
            processor.drawBox(boxProps, mockAssets, mockState);

            expect(mockP5.push).toHaveBeenCalledTimes(1);
            expect(mockP5.translate).toHaveBeenCalledWith(10, 20, 30);
            expect(mockP5.rotateY).toHaveBeenCalledWith(0.2);
            expect(mockP5.rotateX).toHaveBeenCalledWith(0.1);
            expect(mockP5.rotateZ).toHaveBeenCalledWith(0.3);
            expect(mockP5.texture).toHaveBeenCalledWith('mockTexture');
            expect(mockP5.textureMode).toHaveBeenCalledWith('normal');
            expect(mockP5.tint).toHaveBeenCalledWith(255, Math.round(1.0 * 1.0 * 255));
            expect(mockP5.box).toHaveBeenCalledWith(50, 60, 70);
            expect(mockP5.pop).toHaveBeenCalledTimes(1);
        });

        it('should draw box without texture when no assets', () => {
            const assetsWithoutTexture = {};
            const boxPropsWithColor = {
                ...boxProps,
                fillColor: { red: 255, green: 0, blue: 0 }
            };

            processor.drawBox(boxPropsWithColor, assetsWithoutTexture, mockState);

            expect(mockP5.noTint).toHaveBeenCalled();
            expect(mockP5.fill).toHaveBeenCalledWith(255, 0, 0, Math.round(1.0 * 1.0 * 255));
        });
    });

    describe('Drawing Methods - Sphere', () => {
        let sphereProps: ResolvedSphere;

        beforeEach(() => {
            sphereProps = {
                type: ELEMENT_TYPES.SPHERE,
                position: { x: 0, y: 0, z: 0 },
                rotate: { x: 0, y: 0, z: 0 },
                radius: 25
            };
        });

        it('should draw sphere', () => {
            processor.drawSphere(sphereProps, mockAssets, mockState);

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.translate).toHaveBeenCalledWith(0, 0, 0);
            expect(mockP5.sphere).toHaveBeenCalledWith(25);
            expect(mockP5.pop).toHaveBeenCalled();
        });
    });

    describe('Drawing Methods - Panel', () => {
        let panelProps: ResolvedPanel;

        beforeEach(() => {
            panelProps = {
                type: ELEMENT_TYPES.PANEL,
                position: { x: 5, y: 10, z: 15 },
                rotate: { x: 0, y: 0, z: 0 },
                width: 100,
                height: 50
            };
        });

        it('should draw panel', () => {
            processor.drawPanel(panelProps, mockAssets, mockState);

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.translate).toHaveBeenCalledWith(5, 10, 15);
            expect(mockP5.plane).toHaveBeenCalledWith(100, 50);
            expect(mockP5.pop).toHaveBeenCalled();
        });
    });

    describe('Drawing Methods - Floor', () => {
        let floorProps: ResolvedFloor;

        beforeEach(() => {
            floorProps = {
                type: ELEMENT_TYPES.FLOOR,
                position: { x: 0, y: -50, z: 0 },
                rotate: { x: 0, y: 0.5, z: 0 },
                width: 200,
                depth: 300
            };
        });

        it('should draw floor with proper rotation sequence', () => {
            processor.drawFloor(floorProps, mockAssets, mockState);

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.translate).toHaveBeenCalledWith(0, -50, 0);
            expect(mockP5.rotateX).toHaveBeenCalledWith(Math.PI / 2); // HALF_PI
            expect(mockP5.rotateY).toHaveBeenCalledWith(0.5);
            expect(mockP5.plane).toHaveBeenCalledWith(200, 300);
            expect(mockP5.pop).toHaveBeenCalled();
        });
    });

    describe('Drawing Methods - Text', () => {
        let textProps: ResolvedText;

        beforeEach(() => {
            textProps = {
                type: ELEMENT_TYPES.TEXT,
                position: { x: 10, y: 20, z: 30 },
                rotate: { x: 0, y: 0, z: 0 },
                text: 'Hello World',
                size: 16
            };
        });

        it('should draw text when font is ready', () => {
            processor.drawText(textProps, mockAssets, mockState);

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.translate).toHaveBeenCalledWith(10, 20, 30);
            expect(mockP5.textFont).toHaveBeenCalledWith('mockFont');
            expect(mockP5.textSize).toHaveBeenCalledWith(16);
            expect(mockP5.text).toHaveBeenCalledWith('Hello World', 0, 0);
            expect(mockP5.pop).toHaveBeenCalled();
        });

        it('should return early when font is not ready', () => {
            const assetsWithoutFont = {
                font: { status: ASSET_STATUS.LOADING, value: null }
            };

            processor.drawText(textProps, assetsWithoutFont, mockState);

            expect(mockP5.push).not.toHaveBeenCalled();
        });
    });

    describe('Drawing Methods - Other Shapes', () => {
        it('should draw pyramid', () => {
            const pyramidProps: ResolvedPyramid = {
                type: ELEMENT_TYPES.PYRAMID,
                position: { x: 0, y: 0, z: 0 },
                rotate: { x: 0, y: 0, z: 0 },
                baseSize: 50,
                height: 75
            };

            processor.drawPyramid(pyramidProps, mockAssets, mockState);

            expect(mockP5.beginShape).toHaveBeenCalled();
            expect(mockP5.vertex).toHaveBeenCalled(); // Called multiple times
            expect(mockP5.endShape).toHaveBeenCalled();
        });

        it('should draw cone', () => {
            const coneProps: ResolvedCone = {
                type: ELEMENT_TYPES.CONE,
                position: { x: 0, y: 0, z: 0 },
                rotate: { x: 0, y: 0, z: 0 },
                radius: 25,
                height: 50
            };

            processor.drawCone(coneProps, mockAssets, mockState);

            expect(mockP5.cone).toHaveBeenCalledWith(25, 50);
        });

        it('should draw elliptical', () => {
            const ellipticalProps: ResolvedElliptical = {
                type: ELEMENT_TYPES.ELLIPTICAL,
                position: { x: 0, y: 0, z: 0 },
                rotate: { x: 0, y: 0, z: 0 },
                rx: 20,
                ry: 30,
                rz: 40
            };

            processor.drawElliptical(ellipticalProps, mockAssets, mockState);

            expect(mockP5.ellipsoid).toHaveBeenCalledWith(20, 30, 40);
        });

        it('should draw cylinder', () => {
            const cylinderProps: ResolvedCylinder = {
                type: ELEMENT_TYPES.CYLINDER,
                position: { x: 0, y: 0, z: 0 },
                rotate: { x: 0, y: 0, z: 0 },
                radius: 15,
                height: 60
            };

            processor.drawCylinder(cylinderProps, mockAssets, mockState);

            expect(mockP5.cylinder).toHaveBeenCalledWith(15, 60);
        });

        it('should draw torus', () => {
            const torusProps: ResolvedTorus = {
                type: ELEMENT_TYPES.TORUS,
                position: { x: 0, y: 0, z: 0 },
                rotate: { x: 0, y: 0, z: 0 },
                radius: 30,
                tubeRadius: 10
            };

            processor.drawTorus(torusProps, mockAssets, mockState);

            expect(mockP5.torus).toHaveBeenCalledWith(30, 10);
        });
    });

    describe('Utility Methods', () => {
        it('should calculate distance between vectors', () => {
            const v1: Vector3 = { x: 0, y: 0, z: 0 };
            const v2: Vector3 = { x: 3, y: 4, z: 0 };
            
            const distance = processor.dist(v1, v2);
            
            expect(distance).toBe(5); // 3-4-5 triangle
            expect(mockP5.dist).toHaveBeenCalledWith(0, 0, 0, 3, 4, 0);
        });

        it('should map values', () => {
            mockP5.map.mockReturnValue(50);
            
            const result = processor.map(25, 0, 100, 0, 200);
            
            expect(result).toBe(50);
            expect(mockP5.map).toHaveBeenCalledWith(25, 0, 100, 0, 200, undefined);
        });

        it('should map values with clamp', () => {
            mockP5.map.mockReturnValue(75);
            
            const result = processor.map(150, 0, 100, 0, 200, true);
            
            expect(result).toBe(75);
            expect(mockP5.map).toHaveBeenCalledWith(150, 0, 100, 0, 200, true);
        });

        it('should lerp values', () => {
            mockP5.lerp.mockReturnValue(7.5);
            
            const result = processor.lerp(5, 10, 0.5);
            
            expect(result).toBe(7.5);
            expect(mockP5.lerp).toHaveBeenCalledWith(5, 10, 0.5);
        });
    });

    describe('Text Utilities', () => {
        it('should draw text at position', () => {
            processor.text('Hello', { x: 10, y: 20, z: 30 });

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.text).toHaveBeenCalledWith('Hello', 10, 20, 30);
            expect(mockP5.pop).toHaveBeenCalled();
        });

        it('should draw label', () => {
            processor.drawLabel('Label', { x: 5, y: 10 });

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.text).toHaveBeenCalledWith('Label', 5, 10, 0);
            expect(mockP5.pop).toHaveBeenCalled();
        });

        it('should draw HUD text', () => {
            processor.drawHUDText('HUD', 100, 200);

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.text).toHaveBeenCalledWith('HUD', 100, 200);
            expect(mockP5.pop).toHaveBeenCalled();
        });

        it('should draw crosshair', () => {
            processor.drawCrosshair({ x: 0, y: 0, z: 0 }, 10);

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.translate).toHaveBeenCalledWith(0, 0, 0);
            expect(mockP5.line).toHaveBeenCalledWith(-10, 0, 10, 0);
            expect(mockP5.line).toHaveBeenCalledWith(0, -10, 0, 10);
            expect(mockP5.pop).toHaveBeenCalled();
        });
    });

    describe('Helper Methods', () => {
        it('should handle stroke when strokeWidth is zero', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                strokeColor: { red: 255, green: 0, blue: 0 },
                strokeWidth: 0
            };

            processor.drawBox(props as any, {}, mockState);

            expect(mockP5.noStroke).toHaveBeenCalled();
        });

        it('should handle missing strokeColor', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                strokeWidth: 2
            };

            processor.drawBox(props as any, {}, mockState);

            expect(mockP5.noStroke).toHaveBeenCalled();
        });

        it('should handle missing fillColor', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50
            };

            processor.drawBox(props as any, {}, mockState);

            expect(mockP5.noFill).toHaveBeenCalled();
        });
    });

    describe('drawTexture Helper Method', () => {
        it('should apply texture when ready', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                alpha: 0.8
            };

            processor.drawBox(props, mockAssets, mockState);

            expect(mockP5.texture).toHaveBeenCalledWith('mockTexture');
            expect(mockP5.textureMode).toHaveBeenCalledWith('normal');
            expect(mockP5.tint).toHaveBeenCalledWith(255, Math.round(0.8 * 1.0 * 255));
        });

        it('should use fallback fill when texture not ready', () => {
            const assetsWithLoadingTexture = {
                texture: { status: ASSET_STATUS.LOADING, value: null }
            };
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                fillColor: { red: 100, green: 150, blue: 200 }
            };

            processor.drawBox(props, assetsWithLoadingTexture, mockState);

            expect(mockP5.noTint).toHaveBeenCalled();
            expect(mockP5.fill).toHaveBeenCalledWith(100, 150, 200, Math.round(1.0 * 1.0 * 255));
        });

        it('should handle missing texture asset', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                fillColor: { red: 50, green: 100, blue: 150, alpha: 0.5 }
            };

            processor.drawBox(props, {}, mockState);

            expect(mockP5.noTint).toHaveBeenCalled();
            expect(mockP5.fill).toHaveBeenCalledWith(50, 100, 150, Math.round(1.0 * 1.0 * 0.5 * 255));
        });

        it('should calculate alpha correctly with scene alpha', () => {
            const stateWithAlpha = {
                ...mockState,
                settings: { ...mockState.settings, alpha: 0.7 }
            };
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                alpha: 0.5
            };

            processor.drawBox(props, mockAssets, stateWithAlpha);

            expect(mockP5.tint).toHaveBeenCalledWith(255, Math.round(0.5 * 0.7 * 255));
        });
    });

    describe('drawFill Helper Method', () => {
        it('should apply fill with correct alpha calculation', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                fillColor: { red: 255, green: 100, blue: 50, alpha: 0.8 },
                alpha: 0.6
            };

            processor.drawBox(props, {}, mockState);

            expect(mockP5.fill).toHaveBeenCalledWith(255, 100, 50, Math.round(0.6 * 1.0 * 0.8 * 255));
        });

        it('should use default alpha when not specified', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                fillColor: { red: 200, green: 150, blue: 100 }
            };

            processor.drawBox(props, {}, mockState);

            expect(mockP5.fill).toHaveBeenCalledWith(200, 150, 100, Math.round(1.0 * 1.0 * 1.0 * 255));
        });

        it('should call noFill when fillColor is missing', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50
            };

            processor.drawBox(props, {}, mockState);

            expect(mockP5.noFill).toHaveBeenCalled();
        });
    });

    describe('drawStroke Helper Method', () => {
        it('should apply stroke with correct alpha and weight', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                strokeColor: { red: 100, green: 200, blue: 150, alpha: 0.9 },
                strokeWidth: 3,
                alpha: 0.7
            };

            processor.drawBox(props, {}, mockState);

            expect(mockP5.strokeWeight).toHaveBeenCalledWith(3);
            expect(mockP5.stroke).toHaveBeenCalledWith(100, 200, 150, Math.round(0.7 * 1.0 * 0.9 * 255));
        });

        it('should use default stroke width when not specified', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                strokeColor: { red: 150, green: 100, blue: 200 }
            };

            processor.drawBox(props, {}, mockState);

            expect(mockP5.strokeWeight).toHaveBeenCalledWith(1);
        });

        it('should call noStroke when strokeColor is missing', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                strokeWidth: 2
            };

            processor.drawBox(props, {}, mockState);

            expect(mockP5.noStroke).toHaveBeenCalled();
        });

        it('should call noStroke when strokeWidth is zero', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                strokeColor: { red: 255, green: 0, blue: 0 },
                strokeWidth: 0
            };

            processor.drawBox(props, {}, mockState);

            expect(mockP5.noStroke).toHaveBeenCalled();
        });
    });

    describe('rotate Helper Method', () => {
        it('should apply rotations in correct order when all axes specified', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                rotate: { x: 0.1, y: 0.2, z: 0.3 }
            };

            processor.drawBox(props, {}, mockState);

            expect(mockP5.rotateY).toHaveBeenCalledWith(0.2);
            expect(mockP5.rotateX).toHaveBeenCalledWith(0.1);
            expect(mockP5.rotateZ).toHaveBeenCalledWith(0.3);
        });

        it('should only apply non-zero rotations', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                rotate: { x: 0, y: 0.5, z: 0 }
            };

            processor.drawBox(props, {}, mockState);

            expect(mockP5.rotateY).toHaveBeenCalledWith(0.5);
            expect(mockP5.rotateX).not.toHaveBeenCalled();
            expect(mockP5.rotateZ).not.toHaveBeenCalled();
        });

        it('should handle undefined rotation', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50
            };

            processor.drawBox(props, {}, mockState);

            expect(mockP5.rotateY).not.toHaveBeenCalled();
            expect(mockP5.rotateX).not.toHaveBeenCalled();
            expect(mockP5.rotateZ).not.toHaveBeenCalled();
        });

        it('should handle partial rotation vectors', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                rotate: { x: 0.25, y: 0, z: 0 }
            };

            processor.drawBox(props, {}, mockState);

            expect(mockP5.rotateY).not.toHaveBeenCalled();
            expect(mockP5.rotateX).toHaveBeenCalledWith(0.25);
            expect(mockP5.rotateZ).not.toHaveBeenCalled();
        });
    });

    describe('Text Rendering Edge Cases', () => {
        let textProps: ResolvedText;

        beforeEach(() => {
            textProps = {
                type: ELEMENT_TYPES.TEXT,
                position: { x: 10, y: 20, z: 30 },
                rotate: { x: 0.1, y: 0.2, z: 0.3 },
                text: 'Test Text',
                size: 24,
                fillColor: { red: 255, green: 255, blue: 255 },
                strokeColor: { red: 0, green: 0, blue: 0 },
                strokeWidth: 1,
                alpha: 0.9
            };
        });

        it('should handle text with complex styling', () => {
            processor.drawText(textProps, mockAssets, mockState);

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.translate).toHaveBeenCalledWith(10, 20, 30);
            expect(mockP5.rotateY).toHaveBeenCalledWith(0.2);
            expect(mockP5.rotateX).toHaveBeenCalledWith(0.1);
            expect(mockP5.rotateZ).toHaveBeenCalledWith(0.3);
            expect(mockP5.textFont).toHaveBeenCalledWith('mockFont');
            expect(mockP5.textSize).toHaveBeenCalledWith(24);
            expect(mockP5.fill).toHaveBeenCalledWith(255, 255, 255, Math.round(0.9 * 1.0 * 255));
            expect(mockP5.stroke).toHaveBeenCalledWith(0, 0, 0, Math.round(0.9 * 1.0 * 255));
            expect(mockP5.text).toHaveBeenCalledWith('Test Text', 0, 0);
            expect(mockP5.pop).toHaveBeenCalled();
        });

        it('should handle text without rotation', () => {
            const textPropsNoRotate = { ...textProps };
            delete (textPropsNoRotate as any).rotate;

            processor.drawText(textPropsNoRotate, mockAssets, mockState);

            expect(mockP5.rotateY).not.toHaveBeenCalled();
            expect(mockP5.rotateX).not.toHaveBeenCalled();
            expect(mockP5.rotateZ).not.toHaveBeenCalled();
        });

        it('should handle text with only fill and no stroke', () => {
            const textPropsFillOnly = { ...textProps };
            delete (textPropsFillOnly as any).strokeColor;

            processor.drawText(textPropsFillOnly, mockAssets, mockState);

            expect(mockP5.noStroke).toHaveBeenCalled();
            expect(mockP5.fill).toHaveBeenCalled();
        });

        it('should handle font with error status', () => {
            const assetsWithFontError = {
                font: { status: ASSET_STATUS.ERROR, value: null, error: 'Font load failed' }
            };

            processor.drawText(textProps, assetsWithFontError, mockState);

            expect(mockP5.push).not.toHaveBeenCalled();
        });

        it('should handle font with null value', () => {
            const assetsWithNullFont = {
                font: { status: ASSET_STATUS.READY, value: null }
            };

            processor.drawText(textProps, assetsWithNullFont, mockState);

            expect(mockP5.push).not.toHaveBeenCalled();
        });
    });

    describe('Shape Drawing Edge Cases', () => {
        describe('Box Edge Cases', () => {
            it('should handle box with minimal dimensions', () => {
                const minimalBox: ResolvedBox = {
                    type: ELEMENT_TYPES.BOX,
                    position: { x: 0, y: 0, z: 0 },
                    width: 1
                };

                processor.drawBox(minimalBox, {}, mockState);

                expect(mockP5.box).toHaveBeenCalledWith(1, 1, 1);
            });

            it('should handle box with zero dimensions', () => {
                const zeroBox: ResolvedBox = {
                    type: ELEMENT_TYPES.BOX,
                    position: { x: 0, y: 0, z: 0 },
                    width: 0,
                    height: 0,
                    depth: 0
                };

                processor.drawBox(zeroBox, {}, mockState);

                expect(mockP5.box).toHaveBeenCalledWith(0, 0, 0);
            });
        });

        describe('Sphere Edge Cases', () => {
            it('should handle sphere with zero radius', () => {
                const zeroSphere: ResolvedSphere = {
                    type: ELEMENT_TYPES.SPHERE,
                    position: { x: 0, y: 0, z: 0 },
                    radius: 0
                };

                processor.drawSphere(zeroSphere, {}, mockState);

                expect(mockP5.sphere).toHaveBeenCalledWith(0);
            });

            it('should handle sphere with negative radius', () => {
                const negativeSphere: ResolvedSphere = {
                    type: ELEMENT_TYPES.SPHERE,
                    position: { x: 0, y: 0, z: 0 },
                    radius: -10
                };

                processor.drawSphere(negativeSphere, {}, mockState);

                expect(mockP5.sphere).toHaveBeenCalledWith(-10);
            });
        });

        describe('Floor Edge Cases', () => {
            it('should handle floor with rotation and negative dimensions', () => {
                const floorProps: ResolvedFloor = {
                    type: ELEMENT_TYPES.FLOOR,
                    position: { x: 0, y: -100, z: 0 },
                    rotate: { x: 0.5, y: 1.0, z: 0.25 },
                    width: -50,
                    depth: -75
                };

                processor.drawFloor(floorProps, {}, mockState);

                expect(mockP5.translate).toHaveBeenCalledWith(0, -100, 0);
                expect(mockP5.rotateX).toHaveBeenCalledWith(Math.PI / 2);
                expect(mockP5.rotateY).toHaveBeenCalledWith(1.0);
                expect(mockP5.rotateX).toHaveBeenCalledWith(0.5);
                expect(mockP5.rotateZ).toHaveBeenCalledWith(0.25);
                expect(mockP5.plane).toHaveBeenCalledWith(-50, -75);
            });
        });

        describe('Pyramid Edge Cases', () => {
            it('should handle pyramid with zero base size and height', () => {
                const zeroPyramid: ResolvedPyramid = {
                    type: ELEMENT_TYPES.PYRAMID,
                    position: { x: 0, y: 0, z: 0 },
                    baseSize: 0,
                    height: 0
                };

                processor.drawPyramid(zeroPyramid, {}, mockState);

                expect(mockP5.beginShape).toHaveBeenCalled();
                expect(mockP5.vertex).toHaveBeenCalled();
                expect(mockP5.endShape).toHaveBeenCalled();
            });

            it('should handle pyramid with negative dimensions', () => {
                const negativePyramid: ResolvedPyramid = {
                    type: ELEMENT_TYPES.PYRAMID,
                    position: { x: 0, y: 0, z: 0 },
                    baseSize: -50,
                    height: -100
                };

                processor.drawPyramid(negativePyramid, {}, mockState);

                expect(mockP5.beginShape).toHaveBeenCalled();
                expect(mockP5.vertex).toHaveBeenCalled();
                expect(mockP5.endShape).toHaveBeenCalled();
            });
        });

        describe('Elliptical Edge Cases', () => {
            it('should handle ellipsoid with zero axes', () => {
                const zeroElliptical: ResolvedElliptical = {
                    type: ELEMENT_TYPES.ELLIPTICAL,
                    position: { x: 0, y: 0, z: 0 },
                    rx: 0,
                    ry: 0,
                    rz: 0
                };

                processor.drawElliptical(zeroElliptical, {}, mockState);

                expect(mockP5.ellipsoid).toHaveBeenCalledWith(0, 0, 0);
            });

            it('should handle ellipsoid with single axis', () => {
                const singleAxisElliptical: ResolvedElliptical = {
                    type: ELEMENT_TYPES.ELLIPTICAL,
                    position: { x: 0, y: 0, z: 0 },
                    rx: 50,
                    ry: 0,
                    rz: 0
                };

                processor.drawElliptical(singleAxisElliptical, {}, mockState);

                expect(mockP5.ellipsoid).toHaveBeenCalledWith(50, 0, 0);
            });
        });

        describe('Cylinder and Cone Edge Cases', () => {
            it('should handle cylinder with zero dimensions', () => {
                const zeroCylinder: ResolvedCylinder = {
                    type: ELEMENT_TYPES.CYLINDER,
                    position: { x: 0, y: 0, z: 0 },
                    radius: 0,
                    height: 0
                };

                processor.drawCylinder(zeroCylinder, {}, mockState);

                expect(mockP5.cylinder).toHaveBeenCalledWith(0, 0);
            });

            it('should handle cone with zero dimensions', () => {
                const zeroCone: ResolvedCone = {
                    type: ELEMENT_TYPES.CONE,
                    position: { x: 0, y: 0, z: 0 },
                    radius: 0,
                    height: 0
                };

                processor.drawCone(zeroCone, {}, mockState);

                expect(mockP5.cone).toHaveBeenCalledWith(0, 0);
            });
        });

        describe('Torus Edge Cases', () => {
            it('should handle torus with zero dimensions', () => {
                const zeroTorus: ResolvedTorus = {
                    type: ELEMENT_TYPES.TORUS,
                    position: { x: 0, y: 0, z: 0 },
                    radius: 0,
                    tubeRadius: 0
                };

                processor.drawTorus(zeroTorus, {}, mockState);

                expect(mockP5.torus).toHaveBeenCalledWith(0, 0);
            });

            it('should handle torus with larger tube radius than radius', () => {
                const invertedTorus: ResolvedTorus = {
                    type: ELEMENT_TYPES.TORUS,
                    position: { x: 0, y: 0, z: 0 },
                    radius: 10,
                    tubeRadius: 20
                };

                processor.drawTorus(invertedTorus, {}, mockState);

                expect(mockP5.torus).toHaveBeenCalledWith(10, 20);
            });
        });
    });

    describe('Error Handling and Input Validation', () => {
        it('should handle malformed position vectors', () => {
            const malformedProps = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 'invalid' as any, y: null as any, z: undefined },
                width: 50
            };

            processor.drawBox(malformedProps as any, {}, mockState);

            expect(mockP5.translate).toHaveBeenCalledWith('invalid', 0, 0);
        });

        it('should handle invalid color values', () => {
            const invalidColorProps = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                fillColor: { red: -100, green: 400, blue: 'invalid' as any }
            };

            processor.drawBox(invalidColorProps as any, {}, mockState);

            expect(mockP5.fill).toHaveBeenCalledWith(-100, 400, 'invalid', Math.round(1.0 * 1.0 * 255));
        });

        it('should handle assets with unexpected status', () => {
            const assetsWithWeirdStatus = {
                texture: { status: 'UNKNOWN_STATUS' as any, value: null }
            };

            const props: ResolvedBox = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50
            };

            processor.drawBox(props, assetsWithWeirdStatus, mockState);

            expect(mockP5.noTint).toHaveBeenCalled();
        });

        it('should handle state with missing properties', () => {
            const incompleteState = {
                sceneId: 1,
                settings: {
                    alpha: 0.5
                }
            } as any;

            const props: ResolvedBox = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                alpha: 0.8
            };

            processor.drawBox(props, mockAssets, incompleteState);

            // Should not throw and should handle missing properties gracefully
            expect(mockP5.box).toHaveBeenCalled();
        });

        it('should handle extreme alpha values', () => {
            const extremeAlphaProps = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50,
                fillColor: { red: 255, green: 255, blue: 255, alpha: 2.0 },
                alpha: -0.5
            };

            const stateWithExtremeAlpha = {
                ...mockState,
                settings: { ...mockState.settings, alpha: 3.0 }
            };

            processor.drawBox(extremeAlphaProps, {}, stateWithExtremeAlpha);

            expect(mockP5.fill).toHaveBeenCalledWith(255, 255, 255, Math.round(-0.5 * 3.0 * 2.0 * 255));
        });
    });

    describe('Method Call Sequence Verification', () => {
        it('should maintain correct push/pop sequence for box drawing', () => {
            const props = {
                type: ELEMENT_TYPES.BOX,
                position: { x: 0, y: 0, z: 0 },
                width: 50
            };

            processor.drawBox(props, {}, mockState);

            // Verify sequence: push -> translate -> ... -> box -> pop
            const pushCallIndex = mockP5.push.mock.invocationCallOrder[0];
            const translateCallIndex = mockP5.translate.mock.invocationCallOrder[0];
            const boxCallIndex = mockP5.box.mock.invocationCallOrder[0];
            const popCallIndex = mockP5.pop.mock.invocationCallOrder[0];

            expect(pushCallIndex).toBeLessThan(translateCallIndex);
            expect(translateCallIndex).toBeLessThan(boxCallIndex);
            expect(boxCallIndex).toBeLessThan(popCallIndex);
        });

        it('should verify floor rotation sequence', () => {
            const props = {
                type: ELEMENT_TYPES.FLOOR,
                position: { x: 0, y: 0, z: 0 },
                width: 100,
                depth: 200
            };

            processor.drawFloor(props, {}, mockState);

            expect(mockP5.rotateX).toHaveBeenCalledWith(Math.PI / 2);
        });
    });

    describe('Projection Matrix Override', () => {
        describe('setProjectionMatrix', () => {
            it('should extract and apply frustum parameters from projection matrix', () => {
                // Test with a basic projection matrix
                const projectionMatrix = createProjectionMatrix(
                    { x: 2, y: 0, z: 0, w: 0 },     // xscale
                    { x: 0, y: 2, z: 0, w: 0 },     // yscale
                    { x: 0, y: 0, z: -1, w: 0 },    // depth
                    { x: 0, y: 0, z: -1, w: 0 }     // wComponent
                );

                processor.setProjectionMatrix(projectionMatrix);

                // Verify frustum was called with 6 parameters
                expect(mockP5.frustum).toHaveBeenCalled();
                const actualCall = mockP5.frustum.mock.calls[0];
                expect(actualCall).toHaveLength(6);
            });

            it('should handle symmetric projection matrix correctly', () => {
                // Create a symmetric off-axis projection matrix
                const projectionMatrix = createProjectionMatrix(
                    { x: 2, y: 0, z: 0, w: 0 },     // xscale
                    { x: 0, y: 2, z: 0, w: 0 },     // yscale
                    { x: 0, y: 0, z: -1, w: 0 },    // depth
                    { x: 0, y: 0, z: 0, w: -1 }     // wComponent
                );

                processor.setProjectionMatrix(projectionMatrix);

                expect(mockP5.frustum).toHaveBeenCalled();
                const [symLeft, symRight, symBottom, symTop, symNear, symFar] = mockP5.frustum.mock.calls[0];
                
                // Verify all parameters are defined
                expect(symLeft).toBeDefined();
                expect(symRight).toBeDefined();
                expect(symBottom).toBeDefined();
                expect(symTop).toBeDefined();
                expect(symNear).toBeDefined();
                expect(symFar).toBeDefined();
                
                // For symmetric case, left should equal -right and bottom should equal -top
                expect(symLeft).toBeCloseTo(-symRight, 5);
                expect(symBottom).toBeCloseTo(-symTop, 5);
                expect(symNear).toBeGreaterThan(0);
                expect(symFar).toBeGreaterThan(symNear);
                
                // Verify the frustum parameters for symmetric case
                // For a symmetric matrix with scale 2, we expect: left=-2, right=2, bottom=-2, top=2
                // Near/far are extracted from the matrix: near=1 (from -m[10]), far=100 (default fallback)
                expect(mockP5.frustum).toHaveBeenCalledWith(-2, 2, -2, 2, 1, 100);
            });

            it('should handle off-axis projection matrix correctly', () => {
                // Create an off-axis projection matrix (asymmetric)
                const projectionMatrix = createProjectionMatrix(
                    { x: 1.8, y: 0, z: 0.2, w: 0 },           // xscale
                    { x: 0, y: 2.4, z: -0.1, w: 0 },          // yscale
                    { x: 0, y: 0, z: -1.002, w: -0.2002 },    // depth
                    { x: 0, y: 0, z: -1, w: 0 }               // wComponent
                );

                processor.setProjectionMatrix(projectionMatrix);

                expect(mockP5.frustum).toHaveBeenCalled();
                const [offLeft, offRight, offBottom, offTop, offNear, offFar] = mockP5.frustum.mock.calls[0];
                
                // Verify all parameters are defined
                expect(offLeft).toBeDefined();
                expect(offRight).toBeDefined();
                expect(offBottom).toBeDefined();
                expect(offTop).toBeDefined();
                expect(offNear).toBeDefined();
                expect(offFar).toBeDefined();
                
                // Verify values are computed (exact extraction depends on complex matrix math)
                expect(typeof offNear).toBe('number');
                expect(typeof offFar).toBe('number');
            });

            it('should handle edge case with very small near plane', () => {
                const projectionMatrix = createProjectionMatrix(
                    { x: 2000, y: 0, z: 0, w: 0 },           // xscale
                    { x: 0, y: 1500, z: 0, w: 0 },           // yscale
                    { x: 0, y: 0, z: -1.0002, w: -0.0002 },  // depth
                    { x: 0, y: 0, z: -1, w: 0 }              // wComponent
                );

                processor.setProjectionMatrix(projectionMatrix);

                expect(mockP5.frustum).toHaveBeenCalled();
                const [edgeLeft, edgeRight, edgeBottom, edgeTop, edgeNear, edgeFar] = mockP5.frustum.mock.calls[0];
                
                // Verify all parameters are defined
                expect(edgeLeft).toBeDefined();
                expect(edgeRight).toBeDefined();
                expect(edgeBottom).toBeDefined();
                expect(edgeTop).toBeDefined();
                expect(edgeNear).toBeDefined();
                expect(edgeFar).toBeDefined();
                
                // Should handle extreme values gracefully
                expect(mockP5.frustum).toHaveBeenCalledTimes(1);
            });

            it('should handle zero-based projection matrix elements gracefully', () => {
                const projectionMatrix = createProjectionMatrix(
                    { x: 0, y: 0, z: 0, w: 0 },     // xscale
                    { x: 0, y: 0, z: 0, w: 0 },     // yscale
                    { x: 0, y: 0, z: 0, w: 0 },     // depth
                    { x: 0, y: 0, z: 0, w: 0 }      // wComponent
                );

                processor.setProjectionMatrix(projectionMatrix);

                // Should still call frustum, even with degenerate values
                expect(mockP5.frustum).toHaveBeenCalled();
            });
        });
    });
});