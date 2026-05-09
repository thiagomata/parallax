import {
    ASSET_STATUS,
    DEFAULT_FIT_MODE,
    type AssetLoader, type ColorRGBA,
    type ElementAssets,
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

import { BaseGraphicProcessor } from "../graphic_processor.ts";
import { P5VideoResolver } from "./p5_video_resolver.ts";

export class P5GraphicProcessor extends BaseGraphicProcessor<P5Bundler> {
    public readonly loader: AssetLoader<P5Bundler>;
    private p: p5;
    private videoResolver: P5VideoResolver;

    private centerOffsetCache = new Map<string, Vector3>();
    private depthMapGridCache = new Map<string, number[]>();
    private lastWidth = 0;
    private lastHeight = 0;

    constructor(p: p5, loader: AssetLoader<P5Bundler>) {
        super();
        this.p = p;
        this.loader = loader;
        this.videoResolver = new P5VideoResolver({ texture: null, font: null, video: null } as unknown as P5Bundler, p);
    }

    protected push(): void {
        this.p.push();
    }

    protected pop(): void {
        this.p.pop();
    }

    private resolveVideoNode(source: unknown): p5.MediaElement<HTMLVideoElement> | null {
        return this.videoResolver.resolve(source) as p5.MediaElement<HTMLVideoElement> | null;
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
        // public API do not provide the direct access to the projection matrix
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

        if (assets.depthMap?.status === ASSET_STATUS.READY && assets.depthMap.value) {
            this.drawDepthMappedPanel(props, assets.depthMap.value.internalRef, drawWidth, drawHeight);
        } else {
            this.p.plane(drawWidth, drawHeight);
        }
        this.p.pop();
    }

    private drawDepthMappedPanel(
        props: ResolvedPanel,
        depthMap: p5.Image,
        drawWidth: number,
        drawHeight: number
    ): void {
        const dm = props.depthMap;
        const segments = this.getDepthMapSegments(dm);
        const strength = dm?.strength ?? 40;
        const midpoint = dm?.midpoint ?? 0.5;
        const invert = dm?.invert ?? false;
        const mode = dm?.sampleMode ?? "average";

        this.prepareDepthMapPixels(depthMap);
        const grid = this.getOrCreateDepthMapGrid(props.id, segments, depthMap, mode);
        this.p.textureMode(this.p.NORMAL);

        for (let row = 0; row < segments; row++) {
            for (let col = 0; col < segments; col++) {
                const u0 = col / segments;
                const u1 = (col + 1) / segments;
                const v0 = row / segments;
                const v1 = (row + 1) / segments;

                const tlIdx = row * (segments + 1) + col;
                const trIdx = row * (segments + 1) + col + 1;
                const blIdx = (row + 1) * (segments + 1) + col;
                const brIdx = (row + 1) * (segments + 1) + col + 1;

                const rawTl = grid[tlIdx];
                const rawTr = grid[trIdx];
                const rawBl = grid[blIdx];
                const rawBr = grid[brIdx];

                const zTl = ((invert ? 1 - rawTl : rawTl) - midpoint) * strength;
                const zTr = ((invert ? 1 - rawTr : rawTr) - midpoint) * strength;
                const zBl = ((invert ? 1 - rawBl : rawBl) - midpoint) * strength;
                const zBr = ((invert ? 1 - rawBr : rawBr) - midpoint) * strength;

                const x0 = (u0 - 0.5) * drawWidth;
                const x1 = (u1 - 0.5) * drawWidth;
                const y0 = (v0 - 0.5) * drawHeight;
                const y1 = (v1 - 0.5) * drawHeight;

                const diffRidge = Math.abs(zTl - zBr);
                const diffCross = Math.abs(zBl - zTr);
                const useRidgeDiag = diffRidge < diffCross || (diffRidge === diffCross && zTl + zBr >= zBl + zTr);

                this.p.beginShape(this.p.TRIANGLE_STRIP);
                if (useRidgeDiag) {
                    this.p.vertex(x1, y0, zTr, u1, v0);
                    this.p.vertex(x0, y0, zTl, u0, v0);
                    this.p.vertex(x1, y1, zBr, u1, v1);
                    this.p.vertex(x0, y1, zBl, u0, v1);
                } else {
                    this.p.vertex(x0, y0, zTl, u0, v0);
                    this.p.vertex(x0, y1, zBl, u0, v1);
                    this.p.vertex(x1, y0, zTr, u1, v0);
                    this.p.vertex(x1, y1, zBr, u1, v1);
                }
                this.p.endShape();
            }
        }
    }

    private getOrCreateDepthMapGrid(
        panelId: string,
        segments: number,
        depthMap: p5.Image,
        mode: string
    ): number[] {
        const img = depthMap as any;
        const srcW = Math.max(1, img.width);
        const srcH = Math.max(1, img.height);
        const key = `${panelId}|${segments}|${srcW}x${srcH}|${mode}`;

        let grid = this.depthMapGridCache.get(key);
        if (grid) return grid;

        const pixels = img.pixels as number[] | Uint8ClampedArray | undefined;
        if (!pixels || pixels.length === 0) {
            grid = new Array((segments + 1) * (segments + 1)).fill(0);
            this.depthMapGridCache.set(key, grid);
            return grid;
        }

        const n = segments + 1;
        const m = srcW - 1;
        const p = srcH - 1;
        grid = new Array(n * n);

        for (let j = 0; j < n; j++) {
            for (let i = 0; i < n; i++) {
                if (mode === "bilinear") {
                    const u = i / segments;
                    const v = j / segments;
                    grid[j * n + i] = this.sampleDepthMapBilinear(pixels, srcW, srcH, u, v);
                    continue;
                }

                const uMin = Math.max(0, (i - 0.5) / segments);
                const uMax = Math.min(1, (i + 0.5) / segments);
                const vMin = Math.max(0, (j - 0.5) / segments);
                const vMax = Math.min(1, (j + 0.5) / segments);

                const pxMin = Math.max(0, Math.ceil(uMin * m - 0.5 + 1e-9));
                const pxMax = Math.min(srcW - 1, Math.floor(uMax * m + 0.5 - 1e-9));
                const pyMin = Math.max(0, Math.ceil(vMin * p - 0.5 + 1e-9));
                const pyMax = Math.min(srcH - 1, Math.floor(vMax * p + 0.5 - 1e-9));

                let agg = mode === "max" ? 0 : mode === "min" ? Infinity : 0;
                let count = 0;
                for (let py = pyMin; py <= pyMax; py++) {
                    for (let px = pxMin; px <= pxMax; px++) {
                        const sample = pixels[(py * srcW + px) * 4] / 255;
                        if (mode === "max") {
                            agg = Math.max(agg, sample);
                        } else if (mode === "min") {
                            agg = Math.min(agg, sample);
                        } else {
                            agg += sample;
                        }
                        count++;
                    }
                }
                grid[j * n + i] = mode === "average"
                    ? (count > 0 ? agg / count : 0)
                    : (count > 0 ? agg : 0);
            }
        }

        this.depthMapGridCache.set(key, grid);
        return grid;
    }

    private getDepthMapSegments(depthMap: ResolvedPanel['depthMap']): number {
        const requested = depthMap?.segments ?? 32;
        return Math.max(1, Math.min(1024, Math.floor(requested)));
    }

    private prepareDepthMapPixels(depthMap: p5.Image): void {
        const image = depthMap as any;
        if (typeof image.loadPixels === "function" && (!image.pixels || image.pixels.length === 0)) {
            image.loadPixels();
        }
    }

    private sampleDepthMap(props: ResolvedPanel, depthMap: p5.Image, u: number, v: number): number {
        const image = depthMap as any;
        const dm = props.depthMap;
        const width = Math.max(1, Math.floor(image.width ?? dm?.width ?? 1));
        const height = Math.max(1, Math.floor(image.height ?? dm?.height ?? 1));
        let brightness = this.sampleDepthMapBilinear(image.pixels as number[] | Uint8ClampedArray | undefined, width, height, u, v);

        if (dm?.invert) {
            brightness = 1 - brightness;
        }

        const strength = dm?.strength ?? 40;
        const midpoint = dm?.midpoint ?? 0.5;
        return (brightness - midpoint) * strength;
    }

    private sampleDepthMapBilinear(
        pixels: number[] | Uint8ClampedArray | undefined,
        width: number,
        height: number,
        u: number,
        v: number
    ): number {
        if (!pixels || pixels.length < width * height * 4) {
            return 0;
        }

        const x = Math.min(width - 1, Math.max(0, u * (width - 1)));
        const y = Math.min(height - 1, Math.max(0, v * (height - 1)));
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = Math.min(width - 1, x0 + 1);
        const y1 = Math.min(height - 1, y0 + 1);
        const tx = x - x0;
        const ty = y - y0;

        const top = this.lerp(this.sampleDepthMapPixel(pixels, width, x0, y0), this.sampleDepthMapPixel(pixels, width, x1, y0), tx);
        const bottom = this.lerp(this.sampleDepthMapPixel(pixels, width, x0, y1), this.sampleDepthMapPixel(pixels, width, x1, y1), tx);
        return this.lerp(top, bottom, ty);
    }

    private sampleDepthMapPixel(
        pixels: number[] | Uint8ClampedArray,
        width: number,
        x: number,
        y: number
    ): number {
        return pixels[(y * width + x) * 4] / 255;
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
            if (props.fillColor) {
                this.tint(props.fillColor, combinedAlpha);
            } else {
                this.p.tint(255, this.to8Bit(combinedAlpha));
            }
            if (videoNode) {
                this.p.texture(videoNode);
            }
        } else if (assets.texture?.status === ASSET_STATUS.READY && assets.texture.value) {
            this.p.blendMode(this.p.BLEND);
            this.p.texture(assets.texture.value.internalRef);
            if (props.fillColor) {
                this.tint(props.fillColor, combinedAlpha);
            } else {
                this.p.tint(255, this.to8Bit(combinedAlpha));
            }
        } else {
            this.p.noTint();
            if (props.fallbackColor) {
                this.fill(props.fallbackColor, combinedAlpha);
            } else if (props.fillColor) {
                this.fill(props.fillColor, combinedAlpha);
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

    protected translate(pos: Partial<Vector3>): void {
        this.p.translate(pos.x ?? 0, pos.y ?? 0, pos.z ?? 0);
    }

    private fill(color: ColorRGBA, alpha: Alpha = 1 as Alpha): void {
        const baseAlpha = color.alpha ?? (1 as Alpha);
        const finalAlphaUnitInterval = (baseAlpha * alpha) as Alpha;
        const finalAlphaUnsigned8Bits = this.to8Bit(finalAlphaUnitInterval);
        this.p.fill(color.red, color.green, color.blue, finalAlphaUnsigned8Bits);
    }

    private tint(color: ColorRGBA, alpha: Alpha = 1 as Alpha): void {
        const baseAlpha = color.alpha ?? (1 as Alpha);
        const finalAlphaUnitInterval = (baseAlpha * alpha) as Alpha;
        const finalAlphaUnsigned8Bits = this.to8Bit(finalAlphaUnitInterval);
        this.p.tint(color.red, color.green, color.blue, finalAlphaUnsigned8Bits);
    }

    private stroke(color: ColorRGBA, weight: number = 1, globalAlpha: Alpha = 1 as Alpha): void {
        const baseAlpha = color.alpha ?? (1 as Alpha);
        const finalAlphaUnitInterval = (globalAlpha * baseAlpha) as Alpha;
        const finalAlphaUnsigned8Bits = this.to8Bit(finalAlphaUnitInterval);
        this.p.strokeWeight(weight);
        this.p.stroke(color.red, color.green, color.blue, finalAlphaUnsigned8Bits);
    }

    private computeCenterOffsetCached(props: ResolvedBaseVisual): Vector3 {
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
        const centerOffset = this.computeCenterOffsetCached(node.props);
        const drawOffset = { x: -centerOffset.x, y: -centerOffset.y, z: -centerOffset.z };

        this.push();
        {
            this.translate(node.props.position);
            this.push();
            {
                this.translate(drawOffset);
                this.push();
                {
                    this.translate(centerOffset);
                    this.rotate3(rotation);
                    this.push();
                    {
                        this.renderElement(node.props, node.assets, state);
                    }
                    this.pop();

                    for (const child of node.children) {
                        this.drawTree(child, state);
                    }

                }
                this.pop();
            }
            this.pop();

        }
        this.pop();
    }

    /** Apply rotation (YXZ order: yaw, pitch, roll) */
    protected rotate3(rotate: Rotation3 | undefined) {
        if (!rotate) return;
        
        // YXZ order: yaw (Y), pitch (X), roll (Z)
        this.p.rotateY(rotate.yaw);
        this.p.rotateX(rotate.pitch);
        this.p.rotateZ(rotate.roll);
    }
}
