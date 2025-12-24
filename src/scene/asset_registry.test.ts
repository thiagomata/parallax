import { type AssetLoader, type TextureAsset, ASSET_STATUS } from "./types.ts";
import { describe, it, expect } from "vitest";

// export class ChaosLoader implements AssetLoader {
//     async hydrate(ref: { path: string }): Promise<TextureAsset> {
//         // Simulating network latency
//         await new Promise(resolve => setTimeout(resolve, 10));
//
//         // 1. The "Born Ready" Guard
//         if (!ref) {
//             return {
//                 status: ASSET_STATUS.READY,
//                 value: null, // Correct: No wrapper object
//                 error: null
//             };
//         }
//
//         if (ref?.path === "fail.png") {
//             return {
//                 status: ASSET_STATUS.ERROR,
//                 value: null,
//                 error: "Native Error: Could not decode image data."
//             };
//         }
//
//         return {
//             status: ASSET_STATUS.READY,
//             value: {
//                 texture: ref as any,
//                 internalRef: "ptr_0x12345" // Simulating a native pointer
//             },
//             error: null
//         };
//     }
// }
export class ChaosLoader implements AssetLoader {
    async hydrate(ref: { path: string }): Promise<TextureAsset> {
        // Default quick delay
        let delay = 10;

        // Targeted late promise for testing race conditions
        if (ref?.path === "late.png") {
            delay = 50;
        }

        await new Promise(resolve => setTimeout(resolve, delay));

        if (ref?.path === "fail.png") {
            return {
                status: ASSET_STATUS.ERROR,
                value: null,
                error: "Could not decode"
            };
        }

        return {
            status: ASSET_STATUS.READY,
            value: ref == null ? null : {
                texture: ref as any,
                internalRef: `ptr_${ref ? ref.path : "none"}`
            },
            error: null
        };
    }
}

describe('ChaosLoader (Standalone)', () => {
    const loader = new ChaosLoader();

    it('should successfully "load" a valid path', async () => {
        const ref = { path: 'success.png', width: 100, height: 100 };
        const result = await loader.hydrate(ref);

        expect(result.status).toBe(ASSET_STATUS.READY);
        expect(result.value?.internalRef).toBe("ptr_success.png");
        expect(result.error).toBeNull();
    });

    it('should return a structured error for fail.png', async () => {
        const ref = { path: 'fail.png', width: 100, height: 100 };
        const result = await loader.hydrate(ref);

        expect(result.status).toBe(ASSET_STATUS.ERROR);
        expect(result.value).toBeNull();
        expect(result.error).toContain("Could not decode");
    });

    it('should handle missing texture by returning an immediate READY state', async () => {
        // We pass null or an empty ref to the loader
        const result = await loader.hydrate(null as any);

        expect(result.status).toBe(ASSET_STATUS.READY);
        expect(result.value).toBeNull();
        expect(result.error).toBeNull();
    });
});

