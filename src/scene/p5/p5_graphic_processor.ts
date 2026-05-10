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

    /**
     * Renders a panel with 3D displacement based on a depth map image.
     * 
     * The depth map is treated as a height field where brightness values determine Z displacement.
     * Brighter pixels = more extruded (closer to viewer), darker pixels = recessed.
     * 
     * The panel is subdivided into a mesh (controlled by `segments`) where each cell's corners
     * are displaced based on the corresponding depth map sample. Triangle strips are used to
     * render the mesh efficiently.
     * 
     * @param props - The resolved panel properties including depthMap config
     * @param depthMap - The p5.Image containing depth data (grayscale brightness = height)
     * @param drawWidth - Width of the panel in scene units
     * @param drawHeight - Height of the panel in scene units
     */
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
                const textureUmin = col / segments;
                const textureUmax = (col + 1) / segments;
                const textureVmin = row / segments;
                const textureVmax = (row + 1) / segments;

                const topLeftIndex = row * (segments + 1) + col;
                const topRightIndex = row * (segments + 1) + col + 1;
                const bottomLeftIndex = (row + 1) * (segments + 1) + col;
                const bottomRightIndex = (row + 1) * (segments + 1) + col + 1;

                const topLeftValue = grid[topLeftIndex];
                const topRightValue = grid[topRightIndex];
                const bottomLeftValue = grid[bottomLeftIndex];
                const bottomRightValue = grid[bottomRightIndex];

                const topLeftDisplacement = ((invert ? 1 - topLeftValue : topLeftValue) - midpoint) * strength;
                const topRightDisplacement = ((invert ? 1 - topRightValue : topRightValue) - midpoint) * strength;
                const bottomLeftDisplacement = ((invert ? 1 - bottomLeftValue : bottomLeftValue) - midpoint) * strength;
                const bottomRightDisplacement = ((invert ? 1 - bottomRightValue : bottomRightValue) - midpoint) * strength;

                const leftX = (textureUmin - 0.5) * drawWidth;
                const rightX = (textureUmax - 0.5) * drawWidth;
                const topY = (textureVmin - 0.5) * drawHeight;
                const bottomY = (textureVmax - 0.5) * drawHeight;

                const diffRidge = Math.abs(topLeftDisplacement - bottomRightDisplacement);
                const diffCross = Math.abs(bottomLeftDisplacement - topRightDisplacement);
                const useRidgeDiag = diffRidge < diffCross || (diffRidge === diffCross && topLeftDisplacement + bottomRightDisplacement >= bottomLeftDisplacement + topRightDisplacement);

                this.p.beginShape(this.p.TRIANGLE_STRIP);
                if (useRidgeDiag) {
                    this.p.vertex(rightX, topY, topRightDisplacement, textureUmax, textureVmin);
                    this.p.vertex(leftX, topY, topLeftDisplacement, textureUmin, textureVmin);
                    this.p.vertex(rightX, bottomY, bottomRightDisplacement, textureUmax, textureVmax);
                    this.p.vertex(leftX, bottomY, bottomLeftDisplacement, textureUmin, textureVmax);
                } else {
                    this.p.vertex(leftX, topY, topLeftDisplacement, textureUmin, textureVmin);
                    this.p.vertex(leftX, bottomY, bottomLeftDisplacement, textureUmin, textureVmax);
                    this.p.vertex(rightX, topY, topRightDisplacement, textureUmax, textureVmin);
                    this.p.vertex(rightX, bottomY, bottomRightDisplacement, textureUmax, textureVmax);
                }
                this.p.endShape();
            }
        }
    }

    /**
     * Creates or retrieves a cached grid of depth values sampled from the depth map image.
     * 
     * This pre-computes the depth values for each vertex in the displacement mesh. The grid
     * has (segments + 1) × (segments + 1) vertices, where each value represents the normalized
     * height (0-1) at that texture coordinate.
     * 
     * Sampling modes:
     * - "bilinear": Smooth interpolation using bilinear filtering
     * - "average": Average of all pixels in the region (default)
     * - "max": Maximum brightness in region (for raised features)
     * - "min": Minimum brightness in region (for recessed features)
     * 
     * Results are cached per panel ID, dimensions, and mode to avoid recomputation.
     * 
     * @param panelId - Unique identifier for caching
     * @param segments - Number of subdivisions per side (mesh resolution)
     * @param depthMap - The p5.Image containing depth data
     * @param mode - Sampling strategy: "bilinear" | "average" | "max" | "min"
     * @returns Array of normalized depth values (0-1) for each grid vertex
     */
    private getOrCreateDepthMapGrid(
        panelId: string,
        segments: number,
        depthMap: p5.Image,
        mode: string
    ): number[] {
        const depthMapImage = depthMap as any;
        const sourceWidth = Math.max(1, depthMapImage.width);
        const sourceHeight = Math.max(1, depthMapImage.height);
        const cacheKey = `${panelId}|${segments}|${sourceWidth}x${sourceHeight}|${mode}`;

        let depthGrid = this.depthMapGridCache.get(cacheKey);
        if (depthGrid) return depthGrid;

        const pixels = depthMapImage.pixels as number[] | Uint8ClampedArray | undefined;
        if (!pixels || pixels.length === 0) {
            depthGrid = new Array((segments + 1) * (segments + 1)).fill(0);
            this.depthMapGridCache.set(cacheKey, depthGrid);
            return depthGrid;
        }

        const gridVertexCount = segments + 1;
        const maxPixelX = sourceWidth - 1;
        const maxPixelY = sourceHeight - 1;
        depthGrid = new Array(gridVertexCount * gridVertexCount);

        for (let gridRow = 0; gridRow < gridVertexCount; gridRow++) {
            for (let gridCol = 0; gridCol < gridVertexCount; gridCol++) {
                if (mode === "bilinear") {
                    const textureU = gridCol / segments;
                    const textureV = gridRow / segments;
                    depthGrid[gridRow * gridVertexCount + gridCol] = this.sampleDepthMapBilinear(pixels, sourceWidth, sourceHeight, textureU, textureV);
                    continue;
                }

                const uMin = Math.max(0, (gridCol - 0.5) / segments);
                const uMax = Math.min(1, (gridCol + 0.5) / segments);
                const vMin = Math.max(0, (gridRow - 0.5) / segments);
                const vMax = Math.min(1, (gridRow + 0.5) / segments);

                const pixelXMin = Math.max(0, Math.ceil(uMin * maxPixelX - 0.5 + 1e-9));
                const pixelXMax = Math.min(sourceWidth - 1, Math.floor(uMax * maxPixelX + 0.5 - 1e-9));
                const pixelYMin = Math.max(0, Math.ceil(vMin * maxPixelY - 0.5 + 1e-9));
                const pixelYMax = Math.min(sourceHeight - 1, Math.floor(vMax * maxPixelY + 0.5 - 1e-9));

                let aggregatedValue = mode === "max" ? 0 : mode === "min" ? Infinity : 0;
                let sampleCount = 0;
                for (let pixelY = pixelYMin; pixelY <= pixelYMax; pixelY++) {
                    for (let pixelX = pixelXMin; pixelX <= pixelXMax; pixelX++) {
                        const sample = pixels[(pixelY * sourceWidth + pixelX) * 4] / 255;
                        if (mode === "max") {
                            aggregatedValue = Math.max(aggregatedValue, sample);
                        } else if (mode === "min") {
                            aggregatedValue = Math.min(aggregatedValue, sample);
                        } else {
                            aggregatedValue += sample;
                        }
                        sampleCount++;
                    }
                }
                depthGrid[gridRow * gridVertexCount + gridCol] = mode === "average"
                    ? (sampleCount > 0 ? aggregatedValue / sampleCount : 0)
                    : (sampleCount > 0 ? aggregatedValue : 0);
            }
        }

        this.depthMapGridCache.set(cacheKey, depthGrid);
        return depthGrid;
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

    private sampleDepthMapBilinear(
        pixels: number[] | Uint8ClampedArray | undefined,
        imageWidth: number,
        imageHeight: number,
        textureU: number,
        textureV: number
    ): number {
        if (!pixels || pixels.length < imageWidth * imageHeight * 4) {
            return 0;
        }

        const pixelX = Math.min(imageWidth - 1, Math.max(0, textureU * (imageWidth - 1)));
        const pixelY = Math.min(imageHeight - 1, Math.max(0, textureV * (imageHeight - 1)));
        const pixelX0 = Math.floor(pixelX);
        const pixelY0 = Math.floor(pixelY);
        const pixelX1 = Math.min(imageWidth - 1, pixelX0 + 1);
        const pixelY1 = Math.min(imageHeight - 1, pixelY0 + 1);
        const fractionalX = pixelX - pixelX0;
        const fractionalY = pixelY - pixelY0;

        const top = this.lerp(this.sampleDepthMapPixel(pixels, imageWidth, pixelX0, pixelY0), this.sampleDepthMapPixel(pixels, imageWidth, pixelX1, pixelY0), fractionalX);
        const bottom = this.lerp(this.sampleDepthMapPixel(pixels, imageWidth, pixelX0, pixelY1), this.sampleDepthMapPixel(pixels, imageWidth, pixelX1, pixelY1), fractionalX);
        return this.lerp(top, bottom, fractionalY);
    }

    private sampleDepthMapPixel(
        pixels: number[] | Uint8ClampedArray,
        imageWidth: number,
        pixelX: number,
        pixelY: number
    ): number {
        return pixels[(pixelY * imageWidth + pixelX) * 4] / 255;
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
