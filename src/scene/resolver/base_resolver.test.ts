import { describe, expect, it } from "vitest";
import { BaseResolver } from "./base_resolver.ts";
import { SPEC_KINDS, WindowConfig, type ResolutionContext } from "../types.ts";

type EffectGroup = {
    type: string;
    bundle: {
        defaults: any;
        apply(current: any, context: ResolutionContext, settings: any, resolutionPool: Record<string, any>): any;
    };
    settings?: any;
};

class TestResolver extends BaseResolver<Record<string, any>, EffectGroup, any> {
    protected readonly staticKeys = ["id"];

    constructor(effectLib: Record<string, any> = {}) {
        super(effectLib);
    }

    protected bundleBehaviors(): EffectGroup[] {
        return [];
    }

    public applyEffectsPublic(current: any, effects: ReadonlyArray<EffectGroup> | undefined, context: ResolutionContext) {
        return this.applyEffects(current, effects, context);
    }
}

const createContext = (): ResolutionContext => ({
    previousResolved: null,
    playback: { now: 0, delta: 0, frameCount: 0, progress: 0 },
    settings: {
        window: WindowConfig.create({ width: 1, height: 1 }),
        playback: { startTime: 0, timeSpeed: 1, isLoop: true },
        debug: false,
        startPaused: false,
        alpha: 1,
    },
    projectionPool: {},
    elementPool: {},
    dataProviders: {} as any,
});

describe("BaseResolver", () => {
    it("toDynamic compiles non-static objects into BRANCH properties", () => {
        const resolver = new TestResolver({});

        const dynamic = resolver.toDynamic<{ id: string; meta: any }, any>({
            id: "x",
            meta: {
                x: 1,
                // function forces isStaticData(meta) to be false, so compileProperty should recurse
                y: () => 2,
            },
        });

        expect(dynamic.id).toBe("x");
        expect(dynamic.meta.kind).toBe(SPEC_KINDS.BRANCH);
        expect(dynamic.meta.value.x.kind).toBe(SPEC_KINDS.STATIC);
        expect(dynamic.meta.value.y.kind).toBe(SPEC_KINDS.COMPUTED);

        const resolved = resolver.loopResolve(dynamic, createContext());
        expect(resolved.meta).toEqual({ x: 1, y: 2 });
    });

    it("applyEffects runs only enabled effects (and uses default settings when missing)", () => {
        const resolver = new TestResolver({});
        const context = createContext();

        const effects: EffectGroup[] = [
            {
                type: "skip",
                settings: { enabled: false },
                bundle: {
                    defaults: {},
                    apply: (current) => ({ ...current, skipped: true }),
                },
            },
            {
                type: "default-enabled",
                // no settings: should use {enabled: true}
                bundle: {
                    defaults: {},
                    apply: (current, _ctx, _settings, pool) => {
                        pool["hit"] = true;
                        return { ...current, applied: true };
                    },
                },
            },
        ];

        const result = resolver.applyEffectsPublic({ base: true }, effects, context);
        expect(result).toEqual({ base: true, applied: true });
        expect((result as any).skipped).toBeUndefined();
    });

    it("keeps failable results and media objects opaque during resolution", () => {
        const resolver = new TestResolver({});
        const context = createContext();

        const rawMedia = {
            kind: "video",
            node: { readyState: 4 },
        };

        const wrappedResult = {
            success: true,
            value: { nested: { answer: 42 } },
        };

        expect(resolver.loopResolve(rawMedia, context)).toBe(rawMedia);
        expect(resolver.loopResolve(wrappedResult, context)).toBe(wrappedResult);
    });
});
