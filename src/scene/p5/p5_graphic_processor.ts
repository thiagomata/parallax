import {
    ASSET_STATUS,
    type AssetLoader, type ColorRGBA,
    type ElementAssets,
    type GraphicProcessor,
    type ProjectionMatrix,
    type ResolvedBaseVisual,
    type ResolvedBox,
    type ResolvedCone,
    type ResolvedCylinder,
    type ResolvedElliptical,
    type ResolvedFloor,
    type ResolvedPanel,
    type ResolvedProjection,
    type ResolvedPyramid,
    type ResolvedSphere,
    type ResolvedText,
    type ResolvedTorus,
    type ResolvedSceneState,
    type Vector3
} from "../types.ts";
import type {P5Bundler} from "./p5_asset_loader.ts";
import p5 from "p5";

export class P5GraphicProcessor implements GraphicProcessor<P5Bundler> {
    public readonly loader: AssetLoader<P5Bundler>;
    private p: p5;

    constructor(p: p5, loader: AssetLoader<P5Bundler>) {
        this.p = p;
        this.loader = loader;
    }

    // --- Act 1: The Perspective Rig ---

    public setCamera(eye: ResolvedProjection): void {
        this.p.camera(
            eye.position.x, eye.position.y, eye.position.z,
            eye.lookAt.x, eye.lookAt.y, eye.lookAt.z,
            0, 1, 0
        );
    }

    public setProjectionMatrix(m: ProjectionMatrix): void {
        const renderer = (this.p as any)._renderer;
        if (renderer?.uPMatrix) {
            renderer.uPMatrix.set([
                m.xScale.x, m.xScale.y, m.xScale.z, m.xScale.w,
                m.yScale.x, m.yScale.y, m.yScale.z, m.yScale.w,
                m.projection.x, m.projection.y, m.projection.z, m.projection.w,
                m.translation.x, m.translation.y, m.translation.z, m.translation.w
            ]);
        }
    }

    // --- Act 2: The Drawing Pipeline ---

    public drawBox(props: ResolvedBox, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        this.p.push();
        this.applyContext(props, assets, state);
        this.p.box(
            props.width,
            props.height ?? props.width,
            props.depth  ?? props.width
        );
        this.p.pop();
    }

    public drawPanel(props: ResolvedPanel, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        this.p.push();
        this.applyContext(props, assets, state);
        this.p.plane(props.width, props.height);
        this.p.pop();
    }

    public drawSphere(props: ResolvedSphere, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        this.p.push();
        this.applyContext(props, assets, state);
        this.p.sphere(props.radius);
        this.p.pop();
    }

    public drawFloor(props: ResolvedFloor, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        this.p.push();
        this.applyContext(props, assets, state);
        this.p.rotateX(this.p.HALF_PI);
        this.p.plane(props.width, props.depth);
        this.p.pop();
    }

    public drawTorus(props: ResolvedTorus, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        this.p.push();
        this.applyContext(props, assets, state);
        this.p.torus(props.radius, props.tubeRadius);
        this.p.pop();
    }

    public drawCylinder(props: ResolvedCylinder, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        this.p.push();
        this.applyContext(props, assets, state);
        this.p.cylinder(props.radius, props.height);
        this.p.pop();
    }

    public drawCone(props: ResolvedCone, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        this.p.push();
        this.applyContext(props, assets, state);
        this.p.rotateX(this.p.PI);
        this.p.cone(props.radius, props.height);
        this.p.pop();
    }

    public drawElliptical(props: ResolvedElliptical, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        this.p.push();
        this.applyContext(props, assets, state);
        this.p.ellipsoid(props.rx, props.ry, props.rz);
        this.p.pop();
    }

    public drawPyramid(props: ResolvedPyramid, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        this.p.push();
        this.applyContext(props, assets, state);
        const s = props.baseSize / 2;
        this.p.beginShape(this.p.TRIANGLES);
        // 4 triangular sides
        this.p.vertex(-s, 0, -s); this.p.vertex( s, 0, -s); this.p.vertex(0, -props.height, 0);
        this.p.vertex( s, 0, -s); this.p.vertex( s, 0,  s); this.p.vertex(0, -props.height, 0);
        this.p.vertex( s, 0,  s); this.p.vertex(-s, 0,  s); this.p.vertex(0, -props.height, 0);
        this.p.vertex(-s, 0,  s); this.p.vertex(-s, 0, -s); this.p.vertex(0, -props.height, 0);
        // base
        this.p.vertex(-s, 0, -s); this.p.vertex( s, 0, -s); this.p.vertex( s, 0,  s);
        this.p.vertex( s, 0,  s); this.p.vertex(-s, 0,  s); this.p.vertex(-s, 0, -s);
        this.p.endShape();
        this.p.pop();
    }

    public drawText(props: ResolvedText, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        if (assets.font?.status !== ASSET_STATUS.READY || !assets.font.value) return;
        this.p.push();
        this.applyContext(props, assets, state);
        this.p.textFont(assets.font!.value!.internalRef);
        this.p.textSize(props.size);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.text(props.text, 0, 0);
        this.p.pop();
    }

    drawLabel(s: string, pos: Partial<Vector3>): void {
        this.text(s, pos);
    }

    text(s: string, pos: Partial<Vector3>): void {
        this.p.push();
        this.p.text(s, pos.x ?? 0, pos.y ?? 0);
        this.p.pop();
    }


    // --- Act 3: Spatial & Temporal Context ---

    public millis = () => this.p.millis();
    public deltaTime = () => this.p.deltaTime;
    public frameCount = () => this.p.frameCount;
    public dist = (v1: Vector3, v2: Vector3) => this.p.dist(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    public map = (v: number, s1: number, st1: number, s2: number, st2: number, c?: boolean) => this.p.map(v, s1, st1, s2, st2, c);
    public lerp = (s: number, e: number, a: number) => this.p.lerp(s, e, a);

    // --- Act 4: Orchestration Helpers ---

    private applyContext(props: ResolvedBaseVisual, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        this.translate(props.position);
        this.rotate(props.rotate);
        this.applyVisuals(props, assets, state);
    }

    private applyVisuals(props: ResolvedBaseVisual, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        const combinedAlpha = (props.alpha ?? 1) * state.settings.alpha;

        if (assets.texture?.status === ASSET_STATUS.READY && assets.texture.value) {
            this.p.texture(assets.texture.value.internalRef);
            this.p.tint(255, this.to8Bit(combinedAlpha));
        } else {
            this.p.noTint();
            if (props.fillColor) {
                const f = props.fillColor;
                this.fill(f,combinedAlpha);
            } else {
                this.p.noFill();
            }
        }

        if (props.strokeColor && (props.strokeWidth ?? 0) > 0) {
            const s = props.strokeColor;
            this.stroke(s, props.strokeWidth, combinedAlpha);
        } else {
            this.p.noStroke();
        }
    }

    private to8Bit = (val: number) => Math.round(val * 255);

    // --- Debug ---

    public drawHUDText(s: string, x: number, y: number): void {
        this.p.text(s, x, y);
    }

    public drawCrosshair(pos: Partial<Vector3>, size: number): void {
        this.p.push();
        this.p.translate(pos.x ?? 0, pos.y ?? 0, pos.z ?? 0);
        this.p.line(-size, 0, size, 0);
        this.p.line(0, -size, 0, size);
        this.p.pop();
    }

    private translate(pos: Partial<Vector3>): void {
        this.p.translate(pos.x ?? 0, pos.y ?? 0, pos.z ?? 0);
    }

    private fill(color: ColorRGBA, alpha: number = 1): void {
        const baseAlpha = color.alpha ?? 1;
        const finalAlphaUnitInterval = alpha * baseAlpha;
        const finalAlphaUnsigned8Bits = this.to8Bit(finalAlphaUnitInterval);
        this.p.fill(color.red, color.green, color.blue, finalAlphaUnsigned8Bits);
    }

    private stroke(color: ColorRGBA, weight: number = 1, globalAlpha: number = 1): void {
        const baseAlpha = color.alpha ?? 1;
        const finalAlphaUnitInterval = globalAlpha * baseAlpha;
        const finalAlphaUnsigned8Bits = this.to8Bit(finalAlphaUnitInterval);
        this.p.strokeWeight(weight);
        this.p.stroke(color.red, color.green, color.blue, finalAlphaUnsigned8Bits);
    }

    /**
     * Ensure rotate YXZ from the Rotation Vector
     * @param rotate
     * @private
     */
    private rotate(rotate: Vector3 | undefined) {
        if (!rotate) return;
        this.p.rotateY(rotate.y);
        this.p.rotateX(rotate.x);
        this.p.rotateZ(rotate.z);
    }
}