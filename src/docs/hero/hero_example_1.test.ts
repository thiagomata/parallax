import { describe, expect, it } from "vitest";
import p5 from "p5";
import { createMockP5 } from "../../scene/mock/mock_p5.mock.ts";
import { P5AssetLoader } from "../../scene/p5/p5_asset_loader.ts";
import { heroExample1 } from "./hero_example_1.ts";
import { DEFAULT_SKETCH_CONFIG } from "../tutorial/sketch_config.ts";
import type { ResolvedCylinder } from "../../scene/types.ts";

describe("Hero Example 1", () => {
    it("animates mid-cylinder rotation based on playback progress", async () => {
        const mockP5 = createMockP5();
        const loader = new P5AssetLoader(mockP5 as unknown as p5);

        const world = heroExample1(mockP5 as unknown as p5, {
            ...DEFAULT_SKETCH_CONFIG,
            loader,
        });

        mockP5.setup();
        await loader.waitForAllAssets();

        const duration = world.sceneClock.getSettings().playback.duration;
        if (duration === undefined) {
            throw new Error("Expected SceneClock playback.duration to be defined");
        }

        mockP5.millis.mockReturnValue(0);
        mockP5.draw();
        const at0 = world.getCurrenState()?.elements.get("mid-cylinder") as ResolvedCylinder | undefined;
        expect(at0?.rotate?.yaw ?? 0).toBeCloseTo(0);
        expect(at0?.rotate?.roll ?? 0).toBeCloseTo(0);

        mockP5.millis.mockReturnValue(duration / 4);
        mockP5.draw();
        const at25 = world.getCurrenState()?.elements.get("mid-cylinder") as ResolvedCylinder | undefined;
        expect(at25?.rotate?.yaw).toBeCloseTo(Math.PI / 2, 5);
        expect(at25?.rotate?.roll).toBeCloseTo(Math.PI / 2, 5);

        mockP5.millis.mockReturnValue(duration / 2);
        mockP5.draw();
        const at50 = world.getCurrenState()?.elements.get("mid-cylinder") as ResolvedCylinder | undefined;
        expect(at50?.rotate?.yaw).toBeCloseTo(Math.PI, 5);
        expect(at50?.rotate?.roll).toBeCloseTo(Math.PI, 5);
    });

    it("bridges world rendering to p5 drawing calls", async () => {
        const mockP5 = createMockP5();
        const loader = new P5AssetLoader(mockP5 as unknown as p5);

        heroExample1(mockP5 as unknown as p5, {
            ...DEFAULT_SKETCH_CONFIG,
            loader,
        });

        mockP5.setup();
        await loader.waitForAllAssets();

        mockP5.draw();

        expect(mockP5.push).toHaveBeenCalled();
        expect(mockP5.pop).toHaveBeenCalled();
        expect(mockP5.translate).toHaveBeenCalled();

        expect(mockP5.cylinder).toHaveBeenCalled();
        expect(mockP5.cone).toHaveBeenCalled();
        expect(mockP5.torus).toHaveBeenCalled();
        expect(mockP5.ellipsoid).toHaveBeenCalled();

        expect(mockP5.beginShape).toHaveBeenCalled();
        expect(mockP5.vertex).toHaveBeenCalled();
        expect(mockP5.endShape).toHaveBeenCalled();
    });
});
