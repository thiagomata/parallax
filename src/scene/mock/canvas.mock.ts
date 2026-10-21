/**
 * happy-dom has no canvas: the 2D context is null and images never load. The scenes that draw
 * their pictures (the game's snapshots and collage) need both, so this stands in for them.
 */
export function stubCanvas(): () => void {
    const context = {
        fillStyle: '', font: '', textBaseline: '',
        createLinearGradient: () => ({addColorStop: () => {}}),
        fillRect: () => {}, drawImage: () => {}, fillText: () => {},
        getImageData: () => ({data: new Uint8ClampedArray(4)}),
    };
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const OriginalImage = globalThis.Image;

    HTMLCanvasElement.prototype.getContext = function () { return context; } as never;
    HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,AAAA';
    HTMLCanvasElement.prototype.toBlob = function (cb: (blob: Blob | null) => void) {
        cb(new Blob(['x'], {type: 'image/jpeg'}));
    };

    class StubImage {
        width = 480;
        height = 227;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) { setTimeout(() => this.onload?.(), 0); }
    }
    globalThis.Image = StubImage as never;

    return () => {
        HTMLCanvasElement.prototype.getContext = originalGetContext;
        HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
        HTMLCanvasElement.prototype.toBlob = originalToBlob;
        globalThis.Image = OriginalImage;
    };
}
