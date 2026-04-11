import {
    ASSET_STATUS,
    DEFAULT_FIT_MODE,
    type AssetLoader, type ColorRGBA,
    type ElementAssets,
    type GraphicProcessor,
    type Alpha,
    type ProjectionMatrix,
    type ProjectionTreeNode,
    type RenderTreeNode,
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
    type Uint8,
    type Vector3,
    type Rotation3,
    type Scalar,
    ELEMENT_TYPES,
    multiplyByScalar,
} from "../types.ts";
import type {P5Bundler} from "./p5_asset_loader.ts";
import p5 from "p5";

export class P5GraphicProcessor implements GraphicProcessor<P5Bundler> {
    public readonly loader: AssetLoader<P5Bundler>;
    private p: p5;

    // Cache for center offsets to avoid recalculation
    private centerOffsetCache = new Map<string, Vector3>();
    private lastWidth = 0;
    private lastHeight = 0;

    constructor(p: p5, loader: AssetLoader<P5Bundler>) {
        this.p = p;
        this.loader = loader;
    }

    private resolveVideoNode(source: unknown): p5.MediaElement<HTMLVideoElement> | null {


        const isMediaElement = (value: unknown): value is p5.MediaElement<HTMLVideoElement> => {
            return !!value
                && typeof value === "object"
                && "elt" in value;
        };

        if (!source) return null;

        if (typeof HTMLVideoElement !== "undefined" && source instanceof HTMLVideoElement) {
            return new (p5 as any).MediaElement(source, this.p) as p5.MediaElement<HTMLVideoElement>;
        }

        if (typeof source !== "object") return null;

        if (isMediaElement(source)) {
            return source;
        }

        const candidate = source as { node?: unknown; elt?: unknown };

        if (candidate.node) {
            if (isMediaElement(candidate.node)) {
                return candidate.node;
            }
        }

        if (typeof HTMLVideoElement !== "undefined" && candidate.elt instanceof HTMLVideoElement) {
            return new (p5 as any).MediaElement(candidate.elt, this.p) as p5.MediaElement<HTMLVideoElement>;
        }

        return null;
    }


    public setCamera(eye: ResolvedProjection): void {
        this.p.camera(
            eye.position.x, eye.position.y, eye.position.z,
            eye.lookAt.x, eye.lookAt.y, eye.lookAt.z,
            0, 1, 0
        );
    }

    public setCameraTree(root: ProjectionTreeNode | null): void {
        if (!root) return;

        const eyeNode = this.findProjectionInTree(root, 'eye');
        const screenNode = this.findProjectionInTree(root, 'screen');

        if (!eyeNode || !screenNode) {
            throw new Error("No eye or screen projection found in tree");
        }

        const eyePos = eyeNode.props.globalPosition;
        const screenPos = screenNode.props.globalPosition;

        this.p.camera(
            eyePos.x, eyePos.y, eyePos.z,
            screenPos.x, screenPos.y, screenPos.z,
            0, 1, 0
        );
    }

    private findProjectionInTree(node: ProjectionTreeNode, id: string): ProjectionTreeNode | null {
        if (node.props.id === id) return node;
        for (const child of node.children) {
            const found = this.findProjectionInTree(child, id);
            if (found) return found;
        }
        return null;
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


    public drawBox(props: ResolvedBox, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        this.p.push();
        this.applyContext(props, assets, state);

        const width = props.width;
        const height = props.height ?? props.width;
        const depth = props.depth  ?? props.width;

        this.p.box(
            width,
            height,
            depth
        );
        this.p.pop();
    }

    public drawPanel(props: ResolvedPanel, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        this.p.push();
        this.applyContext(props, assets, state);

        const { width: drawWidth, height: drawHeight } = this.computeFitDimensions(props, assets);

        this.p.plane(drawWidth, drawHeight);
        this.p.pop();
    }

    private computeFitDimensions(props: ResolvedPanel, assets: ElementAssets<P5Bundler>): { width: number; height: number } {
        const fitMode = props.fitMode ?? DEFAULT_FIT_MODE;
        if (fitMode === "fill") {
            return { width: props.width, height: props.height };
        }

        const sourceDims = this.getSourceDimensions(props.video, assets);
        if (!sourceDims) {
            return { width: props.width, height: props.height };
        }

        const panelAspect = props.width / props.height;
        const sourceAspect = sourceDims.width / sourceDims.height;

        const shouldScaleByWidth = fitMode === "contain"
            ? panelAspect < sourceAspect
            : panelAspect <= sourceAspect;

        if (shouldScaleByWidth) {
            const scale = props.width / sourceDims.width;
            return { width: props.width, height: sourceDims.height * scale };
        } else {
            const scale = props.height / sourceDims.height;
            return { width: sourceDims.width * scale, height: props.height };
        }
    }

    private getSourceDimensions(video: unknown, assets: ElementAssets<P5Bundler>): { width: number; height: number } | null {
        if (assets.texture?.status === ASSET_STATUS.READY && assets.texture.value) {
            return {
                width: assets.texture.value.internalRef.width,
                height: assets.texture.value.internalRef.height,
            };
        }

        const videoNode = this.resolveVideoNode(video);
        const videoElt = videoNode?.elt ?? null;
        if (videoElt && videoElt.readyState >= 2 && videoElt.videoWidth > 0 && videoElt.videoHeight > 0) {
            return { width: videoElt.videoWidth, height: videoElt.videoHeight };
        }

        return null;
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



    public millis = () => this.p.millis();
    public deltaTime = () => this.p.deltaTime;
    public frameCount = () => this.p.frameCount;
    public dist = (v1: Vector3, v2: Vector3) => this.p.dist(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    public map = (v: number, s1: number, st1: number, s2: number, st2: number, c?: boolean) => this.p.map(v, s1, st1, s2, st2, c);
    public lerp = (s: number, e: number, a: number) => this.p.lerp(s, e, a);


    private applyContext(props: ResolvedBaseVisual, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
            // this.translate(props.position);
            // this.rotate(props.rotate);
        this.applyVisuals(props, assets, state);
    }

    private applyVisuals(props: ResolvedBaseVisual, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        const combinedAlpha = multiplyByScalar(
            (props.alpha ?? (1 as Alpha)) as Alpha,
            (state.settings.alpha as Scalar)
        );

        let videoSource = props.video;
        // If video is a function, resolve it now
        if (typeof videoSource === 'function') {
            videoSource = videoSource(state as any);
        }

        const videoNode = this.resolveVideoNode(videoSource);
        const videoElt = videoNode?.elt ?? null;
        const videoReady = !!videoElt && videoElt.readyState >= 1 && videoElt.videoWidth > 0 && videoElt.videoHeight > 0;

        if (props.mirrorTextureHorizontal ?? false) {
            // Mirror video texture horizontally
            this.p.scale(-1, 1);
        }
        if (props.mirrorTextureVertical ?? false) {
            // Mirror video texture horizontally
            this.p.scale(1, -1);
        }


        if (videoReady) {
            this.p.blendMode(this.p.BLEND);
            this.p.tint(255, this.to8Bit(combinedAlpha));
            if (videoNode) {
                this.p.texture(videoNode);
            }
        } else if (assets.texture?.status === ASSET_STATUS.READY && assets.texture.value) {
            this.p.blendMode(this.p.BLEND);
            this.p.texture(assets.texture.value.internalRef);
            this.p.tint(255, this.to8Bit(combinedAlpha));
        } else {
            this.p.noTint();
            if (props.fillColor) {
                const f = props.fillColor;
                this.fill(f, combinedAlpha);
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

    private to8Bit = (val: Alpha): Uint8 => Math.round(val * 255) as Uint8;


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

    private fill(color: ColorRGBA, alpha: Alpha = 1 as Alpha): void {
        const baseAlpha = color.alpha ?? (1 as Alpha);
        const finalAlphaUnitInterval = (baseAlpha * alpha) as Alpha;
        const finalAlphaUnsigned8Bits = this.to8Bit(finalAlphaUnitInterval);
        this.p.fill(color.red, color.green, color.blue, finalAlphaUnsigned8Bits);
    }

    private stroke(color: ColorRGBA, weight: number = 1, globalAlpha: Alpha = 1 as Alpha): void {
        const baseAlpha = color.alpha ?? (1 as Alpha);
        const finalAlphaUnitInterval = (globalAlpha * baseAlpha) as Alpha;
        const finalAlphaUnsigned8Bits = this.to8Bit(finalAlphaUnitInterval);
        this.p.strokeWeight(weight);
        this.p.stroke(color.red, color.green, color.blue, finalAlphaUnsigned8Bits);
    }

    private getCenterOffset(props: ResolvedBaseVisual): Vector3 {
        // Cache key based on dimensions
        const p = props as any;
        const cacheKey = `${props.type}-${p.width ?? 0}-${p.height ?? 0}-${p.depth ?? 0}`;
        
        const cached = this.centerOffsetCache.get(cacheKey);
        if (cached) return cached;
        
        let result: Vector3;
        switch (props.type) {
            case ELEMENT_TYPES.BOX:
                const width = p.width ?? 0;
                const height = p.height ?? width;
                const depth = p.depth ?? width;
                result = { x: width / 2, y: height / 2, z: depth / 2 };
                break;
            case ELEMENT_TYPES.PANEL:
                result = { x: (p.width || 0) / 2, y: (p.height || 0) / 2, z: 0 };
                break;
            default:
                result = { x: 0, y: 0, z: 0 };
        }
        
        this.centerOffsetCache.set(cacheKey, result);
        return result;
    }

    public resize(w: number, h: number): void {
        if (w !== this.lastWidth || h !== this.lastHeight) {
            this.centerOffsetCache.clear();
            this.lastWidth = w;
            this.lastHeight = h;
        }
    }


    public drawTree(node: RenderTreeNode | null, state: ResolvedSceneState): void {
        if (!node) return;
        let rotation = node.props.rotate;
        const centerOffset = this.getCenterOffset(node.props);
        const drawOffset = { x: -centerOffset.x, y: -centerOffset.y, z: -centerOffset.z };

        this.p.push();
        {
            this.translate(node.props.position);
            this.p.push();
            {
                this.translate(drawOffset);
                this.p.push();
                {
                    this.translate(centerOffset);
                    this.rotate(rotation);
                    this.p.push();
                    {
                        this.renderElement(node.props, node.assets, state);
                    }
                    this.p.pop();

                    for (const child of node.children) {
                        this.drawTree(child, state);
                    }

                }
                this.p.pop();
            }
            this.p.pop();

        }
        this.p.pop();
    }

    private renderElement(props: ResolvedBaseVisual, assets: ElementAssets<P5Bundler>, state: ResolvedSceneState): void {
        switch (props.type) {
            case ELEMENT_TYPES.BOX:
                this.drawBox(props as ResolvedBox, assets, state);
                break;
            case ELEMENT_TYPES.PANEL:
                this.drawPanel(props as ResolvedPanel, assets, state);
                break;
            case ELEMENT_TYPES.SPHERE:
                this.drawSphere(props as ResolvedSphere, assets, state);
                break;
            case ELEMENT_TYPES.CONE:
                this.drawCone(props as ResolvedCone, assets, state);
                break;
            case ELEMENT_TYPES.PYRAMID:
                this.drawPyramid(props as ResolvedPyramid, assets, state);
                break;
            case ELEMENT_TYPES.CYLINDER:
                this.drawCylinder(props as ResolvedCylinder, assets, state);
                break;
            case ELEMENT_TYPES.TORUS:
                this.drawTorus(props as ResolvedTorus, assets, state);
                break;
            case ELEMENT_TYPES.ELLIPTICAL:
                this.drawElliptical(props as ResolvedElliptical, assets, state);
                break;
            case ELEMENT_TYPES.FLOOR:
                this.drawFloor(props as ResolvedFloor, assets, state);
                break;
            case ELEMENT_TYPES.TEXT:
                this.drawText(props as ResolvedText, assets, state);
                break;
        }
    }

    /**
     * Apply rotation (YXZ order: yaw, pitch, roll)
     */
    private rotate(rotate: Rotation3 | undefined) {
        if (!rotate) return;
        
        // YXZ order: yaw (Y), pitch (X), roll (Z)
        this.p.rotateY(rotate.yaw);
        this.p.rotateX(rotate.pitch);
        this.p.rotateZ(rotate.roll);
    }
}
