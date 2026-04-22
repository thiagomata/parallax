import { describe, it, expect, beforeEach } from 'vitest';
import type { GraphicsBundle } from '../types.ts';
import { VideoResolver } from './video_resolver.ts';
import type { VideoSource } from './types.ts';

interface TestBundle extends GraphicsBundle {
    video: unknown;
}

class TestVideoResolver extends VideoResolver<TestBundle> {
    extractFromVideoSource(source: VideoSource): TestBundle['video'] | null {
        return source.data as TestBundle['video'];
    }

    wrapElement(el: HTMLVideoElement): TestBundle['video'] {
        return el;
    }
}

describe('VideoResolver', () => {
    let resolver: TestVideoResolver;

    beforeEach(() => {
        resolver = new TestVideoResolver();
    });

    describe('resolve', () => {
        it('returns null for null source', () => {
            expect(resolver.resolve(null)).toBeNull();
        });

        it('returns null for undefined source', () => {
            expect(resolver.resolve(undefined)).toBeNull();
        });

        it('wraps HTMLVideoElement', () => {
            const videoEl = document.createElement('video');
            const result = resolver.resolve(videoEl);
            expect(result).toBe(videoEl);
        });

        it('extracts from VideoSource', () => {
            const source: VideoSource = { kind: 'webCam', data: 'mock-video-data' };
            const result = resolver.resolve(source);
            expect(result).toBe('mock-video-data');
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
            expect(result).toBe(videoEl);
        });

        it('returns null for object with elt not being HTMLVideoElement', () => {
            const source = { elt: 'not-a-video' };
            const result = resolver.resolve(source);
            expect(result).toBeNull();
        });

        describe('failure scenarios', () => {
            it('returns null for empty object', () => {
                expect(resolver.resolve({})).toBeNull();
            });

            it('returns null for object with only kind property', () => {
                expect(resolver.resolve({ kind: 'video' })).toBeNull();
            });

            it('returns null for object with only data property', () => {
                expect(resolver.resolve({ data: {} })).toBeNull();
            });

            it('returns null for VideoSource with null data', () => {
                const source: VideoSource = { kind: 'video', data: null };
                expect(resolver.resolve(source)).toBeNull();
            });

            it('returns null for VideoSource with undefined data', () => {
                const source: VideoSource = { kind: 'video', data: undefined };
                expect(resolver.resolve(source)).toBeUndefined();
            });

            it('returns null for object with elt set to null', () => {
                expect(resolver.resolve({ elt: null })).toBeNull();
            });

            it('returns null for object with elt set to undefined', () => {
                expect(resolver.resolve({ elt: undefined })).toBeNull();
            });

            it('returns null for function', () => {
                const fn = () => 'video';
                expect(resolver.resolve(fn)).toBeNull();
            });

            it('returns null for array', () => {
                expect(resolver.resolve([1, 2, 3])).toBeNull();
            });

            it('returns null for Symbol', () => {
                expect(resolver.resolve(Symbol('video'))).toBeNull();
            });

            it('returns null for NaN', () => {
                expect(resolver.resolve(NaN)).toBeNull();
            });

            it('returns null for BigInt', () => {
                expect(resolver.resolve(BigInt(123))).toBeNull();
            });

            it('returns null for empty string', () => {
                expect(resolver.resolve('')).toBeNull();
            });

            it('returns null for zero', () => {
                expect(resolver.resolve(0)).toBeNull();
            });

            it('returns null for false', () => {
                expect(resolver.resolve(false)).toBeNull();
            });

            it('returns data for object with number kind', () => {
                const result = resolver.resolve({ kind: 123, data: {} });
                expect(result).toEqual({});
            });

            it('returns data for object with object kind', () => {
                const result = resolver.resolve({ kind: {}, data: {} });
                expect(result).toEqual({});
            });

            it('returns data for VideoSource with object data', () => {
                const source: VideoSource = { kind: 'video', data: { foo: 'bar' } };
                const result = resolver.resolve(source);
                expect(result).toEqual({ foo: 'bar' });
            });

            it('returns null for object with nested empty object as elt', () => {
                expect(resolver.resolve({ elt: {} })).toBeNull();
            });

            it('returns null for object with nested array as elt', () => {
                expect(resolver.resolve({ elt: [] })).toBeNull();
            });

            it('returns null for object with div element as elt', () => {
                const div = document.createElement('div');
                expect(resolver.resolve({ elt: div })).toBeNull();
            });

            it('returns null for object with image element as elt', () => {
                const img = document.createElement('img');
                expect(resolver.resolve({ elt: img })).toBeNull();
            });
        });
    });
});