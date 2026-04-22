import { describe, it, expect, beforeEach } from 'vitest';
import p5 from 'p5';
import { P5VideoResolver } from './p5_video_resolver.ts';
import type { P5Bundler } from './p5_asset_loader.ts';
import type { VideoSource } from '../video/types.ts';

const createMockMediaElement = (elt: HTMLVideoElement): p5.MediaElement<HTMLVideoElement> => {
    return { elt } as p5.MediaElement<HTMLVideoElement>;
};

describe('P5VideoResolver', () => {
    let mockP5: p5;
    let resolver: P5VideoResolver;
    let mockBundle: P5Bundler;

    beforeEach(() => {
        mockP5 = {} as p5;

        mockBundle = {
            texture: null,
            font: null,
            video: null,
        } as unknown as P5Bundler;

        resolver = new P5VideoResolver(mockBundle, mockP5);
    });

    describe('resolve', () => {
        it('returns null for null source', () => {
            expect(resolver.resolve(null)).toBeNull();
        });

        it('returns null for undefined source', () => {
            expect(resolver.resolve(undefined)).toBeNull();
        });

        it('wraps HTMLVideoElement into p5.MediaElement', () => {
            const videoEl = document.createElement('video');
            const result = resolver.resolve(videoEl);
            
            expect(result).toBeDefined();
            expect((result as any).elt).toBe(videoEl);
        });

        it('extracts from VideoSource with valid p5.MediaElement node', () => {
            const videoEl = document.createElement('video');
            const mediaElement = createMockMediaElement(videoEl);
            const source: VideoSource = { kind: 'webCam', data: { node: mediaElement } };
            
            const result = resolver.resolve(source);
            expect(result).toBe(mediaElement);
        });

        it('returns null from VideoSource with invalid node', () => {
            const source: VideoSource = { kind: 'webCam', data: { node: 'not-media-element' } };
            
            const result = resolver.resolve(source);
            expect(result).toBeNull();
        });

        it('returns null from VideoSource without node property', () => {
            const source: VideoSource = { kind: 'video', data: {} };
            
            const result = resolver.resolve(source);
            expect(result).toBeNull();
        });

        it('returns null for primitive values', () => {
            expect(resolver.resolve('string')).toBeNull();
            expect(resolver.resolve(123)).toBeNull();
            expect(resolver.resolve(true)).toBeNull();
        });

        it('handles object with elt property containing HTMLVideoElement', () => {
            const videoEl = document.createElement('video');
            const source = { elt: videoEl };
            
            const result = resolver.resolve(source);
            expect(result).toBeDefined();
            expect((result as any).elt).toBe(videoEl);
        });

        it('returns null for object with elt not being HTMLVideoElement', () => {
            const source = { elt: 'not-a-video' };
            const result = resolver.resolve(source);
            expect(result).toBeNull();
        });

        it('handles p5.MediaElement-like object with plain object elt', () => {
            const source = { elt: { readyState: 2, videoWidth: 640, videoHeight: 480 } };
            const result = resolver.resolve(source);
            expect(result).toBeDefined();
            expect((result as any).elt).toEqual({ readyState: 2, videoWidth: 640, videoHeight: 480 });
        });

        describe('failure scenarios', () => {
            it('returns null from VideoSource with null node', () => {
                const source: VideoSource = { kind: 'webCam', data: { node: null } };
                const result = resolver.resolve(source);
                expect(result).toBeNull();
            });

            it('returns null from VideoSource with undefined node', () => {
                const source: VideoSource = { kind: 'webCam', data: { node: undefined } };
                const result = resolver.resolve(source);
                expect(result).toBeNull();
            });

            it('returns null from VideoSource with null data', () => {
                const source: VideoSource = { kind: 'webCam', data: null };
                const result = resolver.resolve(source);
                expect(result).toBeNull();
            });

            it('returns null from VideoSource with empty data object', () => {
                const source: VideoSource = { kind: 'video', data: { node: {} } };
                const result = resolver.resolve(source);
                expect(result).toBeNull();
            });

            it('returns null from VideoSource with node having null elt', () => {
                const source: VideoSource = { kind: 'webCam', data: { node: { elt: null } } };
                const result = resolver.resolve(source);
                expect(result).toBeNull();
            });

            it('returns null from VideoSource with node having undefined elt', () => {
                const source: VideoSource = { kind: 'webCam', data: { node: { elt: undefined } } };
                const result = resolver.resolve(source);
                expect(result).toBeNull();
            });

            it('returns null from VideoSource with node having non-HTMLVideoElement elt', () => {
                const source: VideoSource = { kind: 'webCam', data: { node: { elt: document.createElement('div') } } };
                const result = resolver.resolve(source);
                expect(result).toBeNull();
            });

            it('returns null for empty object', () => {
                const result = resolver.resolve({});
                expect(result).toBeNull();
            });

            it('returns null for object with only kind property', () => {
                const result = resolver.resolve({ kind: 'video' });
                expect(result).toBeNull();
            });

            it('returns null for object with only data property', () => {
                const result = resolver.resolve({ data: {} });
                expect(result).toBeNull();
            });

            it('returns null for function', () => {
                const fn = () => 'video';
                const result = resolver.resolve(fn);
                expect(result).toBeNull();
            });

            it('returns null for array', () => {
                const result = resolver.resolve([{ node: {} }]);
                expect(result).toBeNull();
            });

            it('returns null for object with elt set to null', () => {
                const result = resolver.resolve({ elt: null });
                expect(result).toBeNull();
            });

            it('returns null for object with elt set to undefined', () => {
                const result = resolver.resolve({ elt: undefined });
                expect(result).toBeNull();
            });

            it('returns null for object with nested node but invalid elt', () => {
                const result = resolver.resolve({ node: { elt: 'string-not-element' } });
                expect(result).toBeNull();
            });

            it('returns null for Symbol', () => {
                const result = resolver.resolve(Symbol('video'));
                expect(result).toBeNull();
            });

            it('returns null for NaN', () => {
                const result = resolver.resolve(NaN);
                expect(result).toBeNull();
            });

            it('returns null for BigInt', () => {
                const result = resolver.resolve(BigInt(123));
                expect(result).toBeNull();
            });
        });
    });
});