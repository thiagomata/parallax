import p5 from 'p5';
import {
    type GraphicProcessor,
    type AssetLoader,
    type Vector3,
    type ColorRGBA,
    type TextureInstance,
    type BoxProps,
    type SceneState,
    type BaseVisualProps, ASSET_STATUS, type ElementAssets
} from '../types';

export class P5GraphicProcessor implements GraphicProcessor<p5.Image, p5.Font> {

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
    fill(color: ColorRGBA, alpha: number = 1): void {
        const baseAlpha = color.alpha ?? 1;
        const finalAlpha = Math.round(alpha * baseAlpha * 255);
        this.p5.fill(color.red, color.green, color.blue, finalAlpha);
    }
    noFill(): void {
        this.p5.noFill();
    }

    stroke(color: ColorRGBA, weight: number = 1, globalAlpha: number = 1): void {
        const baseAlpha = color.alpha ?? 1;
        const finalAlpha = (baseAlpha * globalAlpha) * 255;
        this.p5.strokeWeight(weight);
        this.p5.stroke(color.red, color.green, color.blue, finalAlpha);
    }
    noStroke(): void {
        this.p5.noStroke();
    }

    box(size: number): void {
        this.p5.box(size);
    }

    drawBox(boxProps: BoxProps, assets: ElementAssets, sceneState: SceneState): void {

        const combinedAlpha = this.getP5Alpha(boxProps, sceneState);

        if (assets.texture?.status == ASSET_STATUS.READY && assets.texture.value) {
            this.p5.texture(assets.texture.value);
            this.p5.textureMode(this.p5.NORMAL);
            this.p5.tint(255, combinedAlpha);
        } else if (boxProps.fillColor) {
            this.p5.fill(
                boxProps.fillColor.red,
                boxProps.fillColor.green,
                boxProps.fillColor.blue,
                combinedAlpha
            );
        }
        if (boxProps.strokeColor) {
            this.p5.stroke(
                boxProps.strokeColor.red,
                boxProps.strokeColor.green,
                boxProps.strokeColor.blue,
                combinedAlpha
            );
        }
        this.p5.box(boxProps.size);
    }

    drawPlane(w: number, h: number): void {
        this.p5.plane(w, h);
    }

    drawTexture(instance: TextureInstance, w: number, h: number, alpha: number): void {
        if (!instance.internalRef) return;
        this.p5.push();
        this.p5.textureMode(this.p5.NORMAL);
        this.p5.tint(255, alpha * 255);
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
        this.p5.text(s, pos.x, pos.y ?? 0, pos.z ?? 0);
    }

    drawText(s: string, pos: { x: number; y?: number; z?: number }): void {
        this.p5.text(s, pos.x, pos.y ?? 0, pos.z ?? 0);
    }

    drawCrosshair(pos: { x: number; y?: number; z?: number }, size: number): void {
        this.p5.push();
        this.p5.translate(pos.x, pos.y ?? 0, pos.z ?? 0);
        this.p5.line(-size, 0, size, 0);
        this.p5.line(0, -size, 0, size);
        this.p5.pop();
    }

    drawHUDText(s: string, x: number, y: number): void {
        this.p5.text(s, x, y);
    }

    private getP5Alpha(props: BaseVisualProps, sceneState: SceneState): number {
        const elementAlpha = props.alpha ?? 1;
        const sceneAlpha = sceneState.alpha ?? 1;
        return Math.round(elementAlpha * sceneAlpha * 255);
    }
}