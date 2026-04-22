import type { P5Bundler } from './p5_asset_loader.ts';
import type { VideoSource } from '../video/types.ts';
import { VideoResolver } from '../video/video_resolver.ts';

function hasVideoProperties(value: unknown): value is { readyState?: number; videoWidth?: number; videoHeight?: number } {
    if (!value || typeof value !== 'object') return false;
    return 'readyState' in value || 'videoWidth' in value || 'videoHeight' in value;
}

function isP5MediaElement(value: unknown): value is { elt: unknown } {
    if (!value || typeof value !== 'object' || !('elt' in value)) return false;
    const elt = (value as { elt: unknown }).elt;
    return elt instanceof HTMLVideoElement || (typeof elt === 'object' && elt !== null && hasVideoProperties(elt));
}

export class P5VideoResolver extends VideoResolver<P5Bundler> {
    constructor(bundle: P5Bundler, _p: unknown) {
        super(bundle);
    }

    protected extractFromVideoSource(source: VideoSource): P5Bundler['video'] | null {
        const data = source.data as { node?: unknown };
        if (data?.node && isP5MediaElement(data.node)) {
            return data.node as P5Bundler['video'];
        }
        return null;
    }

    protected wrapElement(_el: HTMLVideoElement): P5Bundler['video'] {
        const mockMediaElement = {
            elt: _el,
            play: () => {},
            pause: () => {},
            loop: () => {},
            noLoop: () => {},
        };
        return mockMediaElement as P5Bundler['video'];
    }
}