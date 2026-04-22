import type { GraphicsBundle } from '../types.ts';
import type { VideoSource } from './types.ts';

function hasVideoProperties(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    const obj = value as Record<string, unknown>;
    return 'readyState' in obj || 'videoWidth' in obj || 'videoHeight' in obj;
}

export abstract class VideoResolver<TBundle extends GraphicsBundle> {
    constructor(_bundle?: TBundle) {}

    resolve(source: unknown): TBundle['video'] | null {
        if (!source) return null;

        if (source instanceof HTMLVideoElement) {
            return this.wrapElement(source);
        }

        if (typeof source !== 'object') return null;

        // Handle p5.MediaElement: { elt: HTMLVideoElement }
        if ('elt' in source) {
            const asMediaElement = source as { elt: unknown };
            if (asMediaElement.elt instanceof HTMLVideoElement) {
                return this.wrapElement(asMediaElement.elt);
            }
            // Handle p5.MediaElement-like: { elt: { readyState, videoWidth, videoHeight } }
            if (asMediaElement.elt && hasVideoProperties(asMediaElement.elt)) {
                return source as TBundle['video'];
            }
        }

        // Handle VideoSource format: { kind, data }
        if ('kind' in source && 'data' in source) {
            return this.extractFromVideoSource(source as VideoSource);
        }

        return null;
    }

    protected abstract extractFromVideoSource(source: VideoSource): TBundle['video'] | null;
    protected abstract wrapElement(el: HTMLVideoElement): TBundle['video'];
}