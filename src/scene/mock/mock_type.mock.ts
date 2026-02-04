import type {GraphicsBundle} from "../types.ts";

/**
 * 1. Define a Mock Bundle
 */
export interface MockGraphicBundle extends GraphicsBundle {
    texture: { id: string };
    font: { name: string };
}