import { beforeEach, describe, expect, it, vi } from 'vitest';
import { P5GraphicProcessor } from './p5_graphic_processor.ts';
import { ASSET_STATUS, ELEMENT_TYPES } from '../types.ts';
import { createMockP5 } from '../mock/mock_p5.mock.ts';
import type { 
    SceneState, 
    Vector3, 
    ColorRGBA, 
    ElementAssets, 
    ResolvedBox, 
    ResolvedSphere, 
    ResolvedPanel, 
    ResolvedText, 
    ResolvedBillboard,
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
                paused: false
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

    describe('Drawing Methods - Billboard', () => {
        let billboardProps: ResolvedBillboard;

        beforeEach(() => {
            billboardProps = {
                type: ELEMENT_TYPES.BILLBOARD,
                position: { x: 0, y: 0, z: 0 },
                width: 100,
                height: 75
            };
        });

        it('should draw billboard with camera compensation', () => {
            processor.drawBillboard(billboardProps, mockAssets, mockState);

            expect(mockP5.push).toHaveBeenCalled();
            expect(mockP5.translate).toHaveBeenCalledWith(0, 0, 0);
            expect(mockP5.rotateY).toHaveBeenCalledWith(-mockState.camera.yaw);
            expect(mockP5.rotateX).toHaveBeenCalledWith(mockState.camera.pitch);
            expect(mockP5.rotateZ).toHaveBeenCalledWith(mockState.camera.roll);
            expect(mockP5.plane).toHaveBeenCalledWith(100, 75);
            expect(mockP5.pop).toHaveBeenCalled();
        });

        it('should apply billboard local rotation when specified', () => {
            const billboardPropsWithRotation = {
                ...billboardProps,
                rotate: { x: 0.5, y: 0.3, z: 0.1 }
            };

            processor.drawBillboard(billboardPropsWithRotation, mockAssets, mockState);

            expect(mockP5.rotateY).toHaveBeenCalledWith(-mockState.camera.yaw);
            expect(mockP5.rotateX).toHaveBeenCalledWith(mockState.camera.pitch);
            expect(mockP5.rotateZ).toHaveBeenCalledWith(mockState.camera.roll);
            expect(mockP5.rotateY).toHaveBeenCalledWith(0.3); // Local rotation
            expect(mockP5.rotateX).toHaveBeenCalledWith(0.5);
            expect(mockP5.rotateZ).toHaveBeenCalledWith(0.1);
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
});