import {ASSET_STATUS} from "../types.ts";
import {describe, expect, it} from "vitest";
import {ChaosLoader} from "./mock_asset_loader.mock.ts";

describe('ChaosLoader (Standalone)', () => {
    const loader = new ChaosLoader();

    it('should successfully "load" a valid texture path', async () => {
        const ref = {path: 'success.ttf', width: 100, height: 100};
        const result = await loader.hydrateFont(ref);

        expect(result.status).toBe(ASSET_STATUS.READY);
        if (result.status === ASSET_STATUS.READY) {
            expect(result.value?.internalRef).toBe("ptr_success.ttf");
        }
    });

    it('should successfully "load" a valid path', async () => {
        const ref = {path: 'success.png', width: 100, height: 100};
        const result = await loader.hydrateTexture(ref);

        expect(result.status).toBe(ASSET_STATUS.READY);
        expect(result.value?.internalRef).toBe("ptr_success.png");
    });

    it('should return a structured error for fail.png', async () => {
        const ref = {path: 'fail.png', width: 100, height: 100};
        const result = await loader.hydrateTexture(ref);

        expect(result.status).toBe(ASSET_STATUS.ERROR);
        expect(result.value).toBeNull();
        if (result.status === ASSET_STATUS.ERROR) {
            expect(result.error).toContain("Could not decode");
        }
    });

    it('should return a structured error for fail.ttf', async () => {
        const ref = {path: 'fail.ttf', width: 100, height: 100};
        const result = await loader.hydrateFont(ref);

        expect(result.status).toBe(ASSET_STATUS.ERROR);
        expect(result.value).toBeNull();
        if (result.status === ASSET_STATUS.ERROR) {
            expect(result.error).toContain("Could not decode");
        }
    });

    it('should handle missing texture by returning an immediate READY state', async () => {
        // We pass null or an empty ref to the loader
        const result = await loader.hydrateTexture(null as any);

        expect(result.status).toBe(ASSET_STATUS.READY);
        expect(result.value).toBeNull();
    });

    it('should handle missing font by returning an immediate READY state', async () => {
        // We pass null or an empty ref to the loader
        const result = await loader.hydrateFont(null as any);

        expect(result.status).toBe(ASSET_STATUS.READY);
        expect(result.value).toBeNull();
    });
});

