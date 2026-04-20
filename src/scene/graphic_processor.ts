import {
    ELEMENT_TYPES,
    type AssetLoader,
    type GraphicsBundle,
    type RenderTreeNode,
    type ResolvedBaseVisual,
    type ResolvedBox,
    type ResolvedCone,
    type ResolvedCylinder,
    type ResolvedElliptical,
    type ResolvedFloor,
    type ResolvedPanel,
    type ResolvedPyramid,
    type ResolvedSceneState,
    type ResolvedSphere,
    type ResolvedText,
    type ResolvedTorus,
    type Vector3,
    type Rotation3,
    type GraphicProcessor,
    type ElementAssets,
} from "./types.ts";

export abstract class BaseGraphicProcessor<TBundle extends GraphicsBundle>
    implements GraphicProcessor<TBundle>
{
    abstract readonly loader: AssetLoader<TBundle>;

    abstract setCameraTree(root: unknown): void;
    abstract setCamera(eye: unknown): void;
    abstract setProjectionMatrix(m: unknown): void;

    abstract drawBox(props: ResolvedBox, assets: ElementAssets<TBundle>, state: ResolvedSceneState): void;
    abstract drawPanel(props: ResolvedPanel, assets: ElementAssets<TBundle>, state: ResolvedSceneState): void;
    abstract drawSphere(resolved: ResolvedSphere, assets: ElementAssets<TBundle>, state: ResolvedSceneState): void;
    abstract drawCone(resolved: ResolvedCone, assets: ElementAssets<TBundle>, state: ResolvedSceneState): void;
    abstract drawPyramid(resolved: ResolvedPyramid, assets: ElementAssets<TBundle>, state: ResolvedSceneState): void;
    abstract drawElliptical(resolved: ResolvedElliptical, assets: ElementAssets<TBundle>, state: ResolvedSceneState): void;
    abstract drawCylinder(resolved: ResolvedCylinder, assets: ElementAssets<TBundle>, state: ResolvedSceneState): void;
    abstract drawTorus(resolved: ResolvedTorus, assets: ElementAssets<TBundle>, state: ResolvedSceneState): void;
    abstract drawFloor(resolved: ResolvedFloor, assets: ElementAssets<TBundle>, state: ResolvedSceneState): void;
    abstract drawText(props: ResolvedText, assets: ElementAssets<TBundle>, state: ResolvedSceneState): void;

    abstract dist(v1: Vector3, v2: Vector3): number;
    abstract map(val: number, s1: number, st1: number, s2: number, st2: number, clamp?: boolean): number;
    abstract lerp(start: number, stop: number, amt: number): number;
    abstract millis(): number;
    abstract deltaTime(): number;
    abstract frameCount(): number;

    abstract drawLabel(s: string, pos: Partial<Vector3>): void;
    abstract drawCrosshair(pos: Partial<Vector3>, size: number): void;
    abstract drawHUDText(s: string, x: number, y: number): void;
    abstract text(s: string, pos: Partial<Vector3>): void;

    protected abstract push(): void;
    protected abstract pop(): void;
    protected abstract translate(pos: Partial<Vector3>): void;
    protected abstract rotate3(rotation: Rotation3 | undefined): void;

    drawTree(node: RenderTreeNode | null, state: ResolvedSceneState): void {
        if (!node) return;

        this.push();
        this.translate(node.props.position);

        const centerOffset = this.getCenterOffset(node.props);
        const drawOffset = { x: -centerOffset.x, y: -centerOffset.y, z: -centerOffset.z };

        this.push();
        this.translate(drawOffset);
        this.push();
        this.translate(centerOffset);
        this.rotate3(node.props.rotate);
        this.push();
        {
            this.renderElement(node.props, node.assets, state);
        }
        this.pop();

        for (const child of node.children) {
            this.drawTree(child, state);
        }

        this.pop();
        this.pop();
        this.pop();
    }

    private getCenterOffset(props: ResolvedBaseVisual): Vector3 {
        const p = props as any;
        switch (props.type) {
            case ELEMENT_TYPES.BOX: {
                const width = p.width ?? 0;
                const height = p.height ?? width;
                const depth = p.depth ?? width;
                return { x: width / 2, y: height / 2, z: depth / 2 };
            }
            case ELEMENT_TYPES.PANEL:
                return { x: (p.width || 0) / 2, y: (p.height || 0) / 2, z: 0 };
            default:
                return { x: 0, y: 0, z: 0 };
        }
    }

    protected renderElement(props: ResolvedBaseVisual, assets: ElementAssets<TBundle>, state: ResolvedSceneState): void {
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
}