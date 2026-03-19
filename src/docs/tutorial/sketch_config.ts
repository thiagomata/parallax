export interface SketchConfig {
    width: number;
    height: number;
    backgroundColor?: string;
    clock?: any,
    loader?: any,
    paused: boolean,
}

export const DEFAULT_SKETCH_CONFIG: SketchConfig = {
    width: 500,
    height: 400,
    paused: false,
};
