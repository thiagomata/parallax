import p5 from 'p5';
import type { GraphicProcessor, AssetLoader, Vector3, ColorRGBA, TextureInstance } from '../types';

export class P5GraphicProcessor implements GraphicProcessor {

    public readonly loader: AssetLoader
    private p5: p5

    constructor(
        p5: p5,
        loader: AssetLoader
    ) {
        this.p5 = p5;
        this.loader = loader;
    }

    // --- Camera & Matrix ---
    setCamera(pos: Vector3, lookAt: Vector3): void {
        this.p5.camera(pos.x, pos.y, pos.z, lookAt.x, lookAt.y, lookAt.z, 0, 1, 0);
    }

    push(): void { this.p5.push(); }
    pop(): void { this.p5.pop(); }

    translate(x: number, y: number, z: number): void {
        this.p5.translate(x, y, z);
    }

    rotateX(a: number): void { this.p5.rotateX(a); }
    rotateY(a: number): void { this.p5.rotateY(a); }
    rotateZ(a: number): void { this.p5.rotateZ(a); }

    // --- Styling & Drawing ---
    fill(color: ColorRGBA, alpha: number = 255): void {
        this.p5.fill(color.red, color.green, color.blue, color.alpha ? color.alpha * alpha : alpha);
    }

    drawBox(size: number): void {
        this.p5.box(size);
    }

    drawPlane(w: number, h: number): void {
        this.p5.plane(w, h);
    }

    drawTexture(instance: TextureInstance, w: number, h: number, alpha: number): void {
        if (!instance.internalRef) return;
        this.p5.push();
        this.p5.tint(255, alpha);
        this.p5.texture(instance.internalRef);
        this.p5.plane(w, h);
        this.p5.pop();
    }

    // --- Math Utilities ---
    dist(v1: Vector3, v2: Vector3): number {
        return this.p5.dist(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    }

    map(val: number, s1: number, st1: number, s2: number, st2: number, clamp?: boolean): number {
        return this.p5.map(val, s1, st1, s2, st2, clamp);
    }

    lerp(start: number, stop: number, amt: number): number {
        return this.p5.lerp(start, stop, amt);
    }

    // --- UI & Text ---
    drawLabel(s: string, pos: { x: number; y?: number; z?: number }): void {
        this.p5.text(s, pos.x, pos.y || 0, pos.z || 0);
    }

    drawText(s: string, pos: { x: number; y?: number; z?: number }): void {
        // Standard 3D text in p5
        this.p5.text(s, pos.x, pos.y || 0, pos.z || 0);
    }

    drawCrosshair(pos: { x: number; y?: number; z?: number }, size: number): void {
        this.p5.push();
        this.p5.translate(pos.x, pos.y || 0, pos.z || 0);
        this.p5.line(-size, 0, size, 0);
        this.p5.line(0, -size, 0, size);
        this.p5.pop();
    }

    drawHUDText(s: string, x: number, y: number): void {
        // To draw HUD, we'd normally need to reset the matrix to 2D
        // For now, we'll keep it simple
        this.p5.text(s, x, y);
    }
}