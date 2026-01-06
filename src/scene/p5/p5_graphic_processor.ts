import p5 from 'p5';
import {
    ASSET_STATUS,
    type AssetLoader,
    type ColorRGBA,
    type ElementAssets,
    type FlatBaseVisualProps,
    type FlatBoxProps,
    type FlatPanelProps,
    type FlatTextProps,
    type GraphicProcessor,
    type SceneState,
    type Vector3
} from '../types';

export class P5GraphicProcessor implements GraphicProcessor<p5.Image, p5.Font> {

    public readonly loader: AssetLoader
    p5: p5

    constructor(
        p5: p5,
        loader: AssetLoader
    ) {
        this.p5 = p5;
        this.loader = loader;
    }

    millis(): number {
        return this.p5.millis()
    }
    deltaTime(): number {
        return this.p5.deltaTime
    }
    frameCount(): number {
        return this.p5.frameCount
    }

    setCamera(pos: Vector3, lookAt: Vector3): void {
        this.p5.camera(pos.x, pos.y, pos.z, lookAt.x, lookAt.y, lookAt.z, 0, 1, 0);
    }

    push(): void {
        this.p5.push();
    }

    pop(): void {
        this.p5.pop();
    }

    translate(pos: Partial<Vector3>): void {
        this.p5.translate(pos.x ?? 0, pos.y ?? 0, pos.z ?? 0);
    }

    rotateX(a: number): void {
        this.p5.rotateX(a);
    }

    rotateY(a: number): void {
        this.p5.rotateY(a);
    }

    rotateZ(a: number): void {
        this.p5.rotateZ(a);
    }

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

    drawText(textProp: FlatTextProps, assets: ElementAssets<p5.Image, p5.Font>, sceneState: SceneState): void {
        if (assets.font?.status !== ASSET_STATUS.READY) {
            // text is not ready
            return;
        }
        if (!assets.font?.value) {
            // in the future, load a default font.
            // ignoring texts without font for now
            return;
        }

        this.push();
        this.translate(textProp.position);
        this.drawFill(textProp, sceneState);
        this.p5.textFont(assets.font.value.internalRef);
        this.p5.textSize(textProp.size);
        this.p5.noStroke();
        this.text(textProp.text, {x: 0, y: 0, z: 0});
        this.pop();
    }

    drawBox(boxProps: FlatBoxProps, assets: ElementAssets, sceneState: SceneState): void {
        this.push();

        this.translate(boxProps.position);
        this.rotate(boxProps.rotate);
        this.drawTexture(assets, boxProps, sceneState);

        this.drawStroke(boxProps, sceneState);

        this.box(boxProps.size);
        this.pop();
    }

    plane(w: number, h: number): void {
        this.p5.plane(w, h);
    }

    drawPanel(panelProps: FlatPanelProps, assets: ElementAssets<p5.Image, p5.Font>, sceneState: SceneState) {
        this.push();

        this.translate(panelProps.position);
        this.drawTexture(assets, panelProps, sceneState);
        this.drawStroke(panelProps, sceneState);

        this.plane(panelProps.width, panelProps.height);
        this.pop();
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

    drawLabel(s: string, pos: { x: number; y?: number; z?: number }): void {
        this.p5.text(s, pos.x, pos.y ?? 0, pos.z ?? 0);
    }

    text(s: string, pos: { x: number; y?: number; z?: number }): void {
        this.p5.text(s, pos.x, pos.y ?? 0, pos.z ?? 0);
    }

    drawCrosshair(pos: Partial<Vector3>, size: number): void {
        this.push();

        this.translate(pos)
        this.p5.line(-size, 0, size, 0);
        this.p5.line(0, -size, 0, size);
        this.pop();
    }

    drawHUDText(s: string, x: number, y: number): void {
        this.p5.text(s, x, y);
    }

    private getP5Alpha(props: FlatBaseVisualProps, sceneState: SceneState): number {
        const elementAlpha = props.alpha ?? 1;
        const sceneAlpha = sceneState.settings.alpha;
        return Math.round(elementAlpha * sceneAlpha * 255);
    }

    private getP5FillAlpha(props: FlatBaseVisualProps, sceneState: SceneState): number {
        const elementAlpha = props.alpha ?? 1;
        const sceneAlpha = sceneState.settings.alpha;
        const fillAlpha = props.fillColor?.alpha ?? 1;
        return Math.round(elementAlpha * sceneAlpha * fillAlpha * 255);
    }

    private getPSStrokeAlpha(props: FlatBaseVisualProps, sceneState: SceneState): number {
        const elementAlpha = props.alpha ?? 1;
        const sceneAlpha = sceneState.settings.alpha;
        const strokeAlpha = props.strokeColor?.alpha ?? 1;
        return Math.round(elementAlpha * sceneAlpha * strokeAlpha * 255);
    }

    private drawTexture(
        assets: ElementAssets<p5.Image, p5.Font>,
        elementProp: FlatBaseVisualProps,
        sceneState: SceneState
    ) {
        if (assets.texture?.status == ASSET_STATUS.READY && assets.texture.value) {
            this.p5.texture(assets.texture.value.internalRef);
            this.p5.textureMode(this.p5.NORMAL);
            this.p5.tint(255, this.getP5Alpha(elementProp, sceneState))
        } else {
            this.drawFill(elementProp, sceneState);
        }
    }

    private drawFill(elementProp: FlatBaseVisualProps, sceneState: SceneState) {

        if (!elementProp.fillColor) {
            this.noFill();
            return;
        }

        this.p5.fill(
            elementProp.fillColor.red,
            elementProp.fillColor.green,
            elementProp.fillColor.blue,
            this.getP5FillAlpha(elementProp, sceneState)
        );
    }

    private drawStroke(elementProp: FlatBaseVisualProps, sceneState: SceneState) {
        if (!elementProp.strokeColor) {
            return;
        }
        this.p5.strokeWeight(elementProp.strokeWidth ?? 1)
        this.p5.stroke(
            elementProp.strokeColor.red,
            elementProp.strokeColor.green,
            elementProp.strokeColor.blue,
            this.getPSStrokeAlpha(elementProp, sceneState)
        );
    }

    private rotate(rotate: Vector3 | undefined) {
        if (!rotate) return;
        if (rotate.x != 0) {
            this.rotateX(rotate.x);
        }
        if (rotate.y != 0) {
            this.rotateY(rotate.y);
        }
        if (rotate.z != 0) {
            this.rotateZ(rotate.z);
        }
    }
}