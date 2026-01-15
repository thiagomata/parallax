import p5 from 'p5';
import {
    ASSET_STATUS,
    type AssetLoader,
    type ColorRGBA,
    type ElementAssets,
    type GraphicProcessor,
    type ResolvedBaseVisual,
    type ResolvedBox, type ResolvedCone, type ResolvedCylinder, type ResolvedElliptical,
    type ResolvedFloor,
    type ResolvedPanel, type ResolvedPyramid,
    type ResolvedSphere,
    type ResolvedText, type ResolvedTorus,
    type SceneState,
    type Vector3
} from '../types';
import type {P5Bundler} from './p5_asset_loader';

export class P5GraphicProcessor implements GraphicProcessor<P5Bundler> {
    public readonly loader: AssetLoader<P5Bundler>;
    private p: p5;

    constructor(p: p5, loader: AssetLoader<P5Bundler>) {
        this.p = p;
        this.loader = loader;
    }

    // --- Timing ---
    millis(): number {
        return this.p.millis();
    }

    deltaTime(): number {
        return this.p.deltaTime;
    }

    frameCount(): number {
        return this.p.frameCount;
    }

    // --- Transformations ---
    setCamera(pos: Vector3, lookAt: Vector3): void {
        this.p.camera(pos.x, pos.y, pos.z, lookAt.x, lookAt.y, lookAt.z, 0, 1, 0);
    }

    push(): void {
        this.p.push();
    }

    pop(): void {
        this.p.pop();
    }

    translate(pos: Partial<Vector3>): void {
        this.p.translate(pos.x ?? 0, pos.y ?? 0, pos.z ?? 0);
    }

    rotateX(a: number): void {
        this.p.rotateX(a);
    }

    rotateY(a: number): void {
        this.p.rotateY(a);
    }

    rotateZ(a: number): void {
        this.p.rotateZ(a);
    }

    // --- Styling ---
    fill(color: ColorRGBA, alpha: number = 1): void {
        const baseAlpha = color.alpha ?? 1;
        const finalAlpha = Math.round(alpha * baseAlpha * 255);
        this.p.fill(color.red, color.green, color.blue, finalAlpha);
    }

    noFill(): void {
        this.p.noFill();
    }

    stroke(color: ColorRGBA, weight: number = 1, globalAlpha: number = 1): void {
        const baseAlpha = color.alpha ?? 1;
        const finalAlpha = (baseAlpha * globalAlpha) * 255;
        this.p.strokeWeight(weight);
        this.p.stroke(color.red, color.green, color.blue, finalAlpha);
    }

    noStroke(): void {
        this.p.noStroke();
    }

    // --- Drawing Implementation ---
    drawText(props: ResolvedText, assets: ElementAssets<P5Bundler>, state: SceneState): void {
        if (assets.font?.status !== ASSET_STATUS.READY || !assets.font.value) return;

        this.push();
        this.translate(props.position);
        this.rotate(props.rotate);

        this.p.textFont(assets.font.value.internalRef);
        this.p.textSize(props.size);
        this.drawFill(props, state);
        this.drawStroke(props, state);

        // Render text at local origin
        this.p.text(props.text, 0, 0);
        this.pop();
    }

    box(size: number): void {
        this.p.box(size);
    }

    drawBox(props: ResolvedBox, assets: ElementAssets<P5Bundler>, state: SceneState): void {
        this.push();
        this.translate(props.position);
        this.rotate(props.rotate);

        this.drawTexture(assets, props, state);
        this.drawStroke(props, state);

        this.p.box(props.size);
        this.pop();
    }

    drawSphere(props: ResolvedSphere, assets: ElementAssets<P5Bundler>, state: SceneState): void {
        this.push();
        this.translate(props.position);
        this.rotate(props.rotate);

        this.drawTexture(assets, props, state);
        this.drawStroke(props, state);

        this.p.sphere(props.radius);
        this.pop();
    }

    drawPanel(props: ResolvedPanel, assets: ElementAssets<P5Bundler>, state: SceneState): void {
        this.push();
        this.translate(props.position);
        this.rotate(props.rotate);

        this.drawTexture(assets, props, state);
        this.drawStroke(props, state);

        this.p.plane(props.width, props.height);
        this.pop();
    }

    drawFloor(props: ResolvedFloor, assets: ElementAssets<P5Bundler>, state: SceneState): void {
        this.push();

        // 1. Position the center of the floor
        this.translate(props.position);

        // 2. Base Rotation: Orient to the XZ plane (Standard Floor Behavior)
        this.p.rotateX(this.p.HALF_PI);

        // 3. User Rotation: Apply any additional offsets from the blueprint
        this.rotate(props.rotate);

        // 4. Visual Styles
        this.drawTexture(assets, props, state);
        this.drawStroke(props, state);

        // 5. Execution: A floor is a plane with specific width and depth
        // Note: p5.plane takes (width, height). In floor context, height = depth.
        this.p.plane(props.width, props.depth);

        this.pop();
    }

    drawPyramid(props: ResolvedPyramid, assets: ElementAssets<P5Bundler>, state: SceneState): void {
        this.push();
        this.translate(props.position);
        this.rotate(props.rotate);

        this.drawTexture(assets, props, state);
        this.drawStroke(props, state);

        // Approximate pyramid: base centered at origin, use p.beginShape
        const s = props.baseSize / 2;
        this.p.beginShape(this.p.TRIANGLES);
        // 4 triangular sides
        this.p.vertex(-s, 0, -s); this.p.vertex(s, 0, -s); this.p.vertex(0, props.height, 0);
        this.p.vertex(s, 0, -s); this.p.vertex(s, 0, s); this.p.vertex(0, props.height, 0);
        this.p.vertex(s, 0, s); this.p.vertex(-s, 0, s); this.p.vertex(0, props.height, 0);
        this.p.vertex(-s, 0, s); this.p.vertex(-s, 0, -s); this.p.vertex(0, props.height, 0);
        // base
        this.p.vertex(-s, 0, -s); this.p.vertex(s, 0, -s); this.p.vertex(s, 0, s);
        this.p.vertex(s, 0, s); this.p.vertex(-s, 0, s); this.p.vertex(-s, 0, -s);
        this.p.endShape();
        this.pop();
    }

    drawCone(props: ResolvedCone, assets: ElementAssets<P5Bundler>, state: SceneState): void {
        this.push();
        this.translate(props.position);
        this.rotate(props.rotate);

        this.drawTexture(assets, props, state);
        this.drawStroke(props, state);

        this.p.cone(props.radius, props.height);
        this.pop();
    }

    drawElliptical(props: ResolvedElliptical, assets: ElementAssets<P5Bundler>, state: SceneState): void {
        this.push();
        this.translate(props.position);
        this.rotate(props.rotate);

        this.drawTexture(assets, props, state);
        this.drawStroke(props, state);

        // p5 does not have ellipsoid axes control directly, but p.ellipsoid(rx, ry, rz) exists
        this.p.ellipsoid(props.rx, props.ry, props.rz);
        this.pop();
    }

    drawCylinder(props: ResolvedCylinder, assets: ElementAssets<P5Bundler>, state: SceneState): void {
        this.push();
        this.translate(props.position);
        this.rotate(props.rotate);

        this.drawTexture(assets, props, state);
        this.drawStroke(props, state);

        this.p.cylinder(props.radius, props.height);
        this.pop();
    }

    drawTorus(props: ResolvedTorus, assets: ElementAssets<P5Bundler>, state: SceneState): void {
        this.push();
        this.translate(props.position);
        this.rotate(props.rotate);

        this.drawTexture(assets, props, state);
        this.drawStroke(props, state);

        this.p.torus(props.radius, props.tubeRadius);
        this.pop();
    }

    plane(w: number, h: number): void {
        this.p.plane(w, h);
    }

    // --- Internal Helpers ---
    private drawTexture(assets: ElementAssets<P5Bundler>, props: ResolvedBaseVisual, state: SceneState) {
        if (assets.texture?.status === ASSET_STATUS.READY && assets.texture.value) {
            this.p.texture(assets.texture.value.internalRef);
            this.p.textureMode(this.p.NORMAL);
            // Tint handles both the element alpha and the scene-wide transition alpha
            const alpha = this.getP5Alpha(props, state);
            this.p.tint(255, alpha);
        } else {
            this.p.noTint();
            this.drawFill(props, state);
        }
    }

    private drawFill(props: ResolvedBaseVisual, state: SceneState) {
        if (!props.fillColor) {
            this.p.noFill();
            return;
        }
        this.p.fill(
            props.fillColor.red,
            props.fillColor.green,
            props.fillColor.blue,
            this.getP5FillAlpha(props, state)
        );
    }

    private drawStroke(props: ResolvedBaseVisual, state: SceneState) {
        if (!props.strokeColor || props.strokeWidth === 0) {
            this.p.noStroke();
            return;
        }
        this.p.strokeWeight(props.strokeWidth ?? 1);
        this.p.stroke(
            props.strokeColor.red,
            props.strokeColor.green,
            props.strokeColor.blue,
            this.getP5StrokeAlpha(props, state)
        );
    }

    private rotate(rot: Vector3 | undefined) {
        if (!rot) return;
        if (rot.x !== 0) this.p.rotateX(rot.x);
        if (rot.y !== 0) this.p.rotateY(rot.y);
        if (rot.z !== 0) this.p.rotateZ(rot.z);
    }

    // --- Alpha Calculation Logic ---
    private getP5Alpha(props: ResolvedBaseVisual, state: SceneState): number {
        return Math.round((props.alpha ?? 1) * state.settings.alpha * 255);
    }

    private getP5FillAlpha(props: ResolvedBaseVisual, state: SceneState): number {
        const fillA = props.fillColor?.alpha ?? 1;
        return Math.round((props.alpha ?? 1) * state.settings.alpha * fillA * 255);
    }

    private getP5StrokeAlpha(props: ResolvedBaseVisual, state: SceneState): number {
        const strokeA = props.strokeColor?.alpha ?? 1;
        return Math.round((props.alpha ?? 1) * state.settings.alpha * strokeA * 255);
    }

    // --- Utilities ---
    dist(v1: Vector3, v2: Vector3): number {
        return this.p.dist(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    }

    map(v: number, s1: number, st1: number, s2: number, st2: number, c?: boolean): number {
        return this.p.map(v, s1, st1, s2, st2, c);
    }

    lerp(s: number, e: number, a: number): number {
        return this.p.lerp(s, e, a);
    }

    text(s: string, pos: Partial<Vector3>): void {
        this.p.text(s, pos.x ?? 0, pos.y ?? 0, pos.z ?? 0);
    }

    drawLabel(s: string, pos: Partial<Vector3>): void {
        this.text(s, pos);
    }

    drawHUDText(s: string, x: number, y: number): void {
        this.p.text(s, x, y);
    }

    drawCrosshair(pos: Partial<Vector3>, size: number): void {
        this.push();
        this.translate(pos);
        this.p.line(-size, 0, size, 0);
        this.p.line(0, -size, 0, size);
        this.pop();
    }
}