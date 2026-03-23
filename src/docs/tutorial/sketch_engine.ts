import p5 from 'p5';
import { World } from "../../scene/world.ts";
import type { 
    EffectLib,
    ProjectionEffectLib,
    DataProviderLib,
} from "../../scene/types.ts";
import type { P5Bundler } from "../../scene/p5/p5_asset_loader.ts";
import type { SketchConfig, P5Sketch, P5SketchExtraArgs, SketchInstance } from "./sketch_engine.types.ts";

export { DEFAULT_SKETCH_CONFIG } from "./sketch_engine.types.ts";
export type { SketchConfig, P5Sketch, P5SketchExtraArgs, FaceConfig } from "./sketch_engine.types.ts";

export class SketchEngine {
    private p5Instances = new Map<string, p5>();
    private containerElements = new Map<string, HTMLElement>();
    private worldInstances = new Map<string, World<P5Bundler, EffectLib, ProjectionEffectLib, DataProviderLib>>();

    constructor() {
        this.setupFullscreenHandler();
    }

    private isMobileDevice(): boolean {
        return /Android|iPhone|iPad/i.test(navigator.userAgent) ||
            navigator.maxTouchPoints > 0;
    }

    private setupFullscreenHandler(): void {
        const handleFullscreenChange = () => {
            const isFullscreen = !!(
                document.fullscreenElement || 
                (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
            );
            
            this.p5Instances.forEach((instance, containerId) => {
                if (!instance) return;
                
                const world = this.worldInstances.get(containerId);
                const canvasBox = this.containerElements.get(containerId);
                
                let w: number, h: number;
                
                if (this.isMobileDevice()) {
                    w = visualViewport?.width || window.innerWidth;
                    h = visualViewport?.height || window.innerHeight;
                } else if (isFullscreen) {
                    w = window.innerWidth;
                    h = window.innerHeight;
                } else {
                    w = canvasBox?.clientWidth || window.innerWidth;
                    h = canvasBox?.clientHeight || window.innerHeight;
                }
                
                if (w > 0 && h > 0) {
                    instance.resizeCanvas(w, h, true);
                    if (world) {
                        world.enableDefaultPerspective(w, h);
                    }
                    instance.redraw();
                }
            });
        };

        if (this.isMobileDevice()) {
            visualViewport?.addEventListener('resize', handleFullscreenChange);
        } else {
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
            window.addEventListener('resize', handleFullscreenChange);
        }
    }

    getP5Instance(containerId: string): p5 | undefined {
        return this.p5Instances.get(containerId);
    }

    setP5Instance(containerId: string, instance: p5 | undefined): void {
        if (instance) {
            this.p5Instances.set(containerId, instance);
        } else {
            this.p5Instances.delete(containerId);
        }
    }

    private cleanup(containerId: string): void {
        const instance = this.p5Instances.get(containerId);
        if (!instance) return;
        
        try {
            instance.noLoop();
            const canvas = (instance as p5 & { canvas?: HTMLCanvasElement }).canvas;
            if (canvas) {
                const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                if (gl) {
                    const loseExt = gl.getExtension('WEBGL_lose_context');
                    if (loseExt) loseExt.loseContext();
                }
                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
            }
            instance.remove();
        } catch (e) {
            console.warn(`[${containerId}] Cleanup error:`, e);
        }
        
        this.p5Instances.delete(containerId);
        this.containerElements.delete(containerId);
        this.worldInstances.delete(containerId);
    }

    async createSketchInstance(
        sketchFn: P5Sketch,
        sketchConfig: SketchConfig,
        canvasBox: HTMLElement,
        containerId: string,
        extraArgs?: P5SketchExtraArgs
    ): Promise<SketchInstance> {
        this.cleanup(containerId);

        let currentP5: p5 | null = null;
        let world: World<P5Bundler, EffectLib, ProjectionEffectLib, DataProviderLib> | null = null;

        // Create p5 instance - tutorial will set p.setup and p.draw
        currentP5 = new p5((p: p5) => {
            // Basic setup override - tutorials will set their own p.setup
            p.setup = () => {
                if (this.isMobileDevice()) {
                    p.pixelDensity(1);
                    p.frameRate(30);
                }
            };
        }, canvasBox);

        // Call sketch function (always async) - it sets p.setup, p.draw, and returns world
        world = await sketchFn(currentP5, sketchConfig, extraArgs);
        
        this.worldInstances.set(containerId, world);
        this.p5Instances.set(containerId, currentP5);
        this.containerElements.set(containerId, canvasBox);

        const doResize = () => {
            if (currentP5 && !(currentP5 as p5 & { _setupDone?: boolean })._setupDone) {
                requestAnimationFrame(doResize);
                return;
            }
            if (currentP5) {
                const w = canvasBox.clientWidth;
                const h = canvasBox.clientHeight;
                if (w > 0 && h > 0) {
                    currentP5.resizeCanvas(w, h, true);
                    sketchConfig.width = w;
                    sketchConfig.height = h;
                }
            }
        };
        requestAnimationFrame(doResize);

        return { currentP5, currentWorld: world };
    }
}

export const sketchEngine = new SketchEngine();