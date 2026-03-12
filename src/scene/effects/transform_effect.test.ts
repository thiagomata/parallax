import { describe, expect, it } from "vitest";
import { TransformEffect } from "./transform_effect.ts";

describe("TransformEffect", () => {
    it("defaults.transform is identity", () => {
        const item: any = { id: "x" };
        expect(TransformEffect.defaults.transform(item, {} as any)).toBe(item);
    });
});

