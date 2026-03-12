import { beforeEach, describe, expect, it, vi } from "vitest";
import { Stage } from "./stage.ts";
import {
    ASSET_STATUS,
    DEFAULT_SCENE_SETTINGS,
    DEFAULT_WINDOW_CONFIG,
    ELEMENT_TYPES,
    LOOK_MODES,
    PROJECTION_TYPES,
    WindowConfig,
    type AssetLoader,
    type BlueprintProjection,
    type ResolvedProjection,
} from "./types.ts";
import type { MockGraphicBundle } from "./mock/mock_type.mock.ts";

const createMockLoader = (): AssetLoader<MockGraphicBundle> => ({
    hydrateTexture: vi.fn().mockResolvedValue({
        status: ASSET_STATUS.READY,
        value: { internalRef: { id: "tex-1" } },
    }),
    hydrateFont: vi.fn().mockResolvedValue({
        status: ASSET_STATUS.READY,
        value: { internalRef: { name: "Arial" } },
    }),
    waitForAllAssets: vi.fn().mockResolvedValue(undefined),
});

describe("Stage", () => {
    let loader: AssetLoader<MockGraphicBundle>;
    let stage: Stage<MockGraphicBundle, {}, {}, {}>;

    beforeEach(() => {
        loader = createMockLoader();
        const settings = structuredClone(DEFAULT_SCENE_SETTINGS);
        settings.window = WindowConfig.create(DEFAULT_WINDOW_CONFIG);
        stage = new Stage<MockGraphicBundle, {}, {}, {}>(settings, loader);
    });

    it("addElement is idempotent (duplicate add is ignored)", () => {
        const blueprint = {
            id: "box-1",
            type: ELEMENT_TYPES.BOX,
            width: 10,
            position: { x: 0, y: 0, z: 0 },
            texture: { path: "grass.png", width: 64, height: 64 },
        };

        stage.addElement(blueprint);
        stage.addElement(blueprint);

        expect(loader.hydrateTexture).toHaveBeenCalledTimes(1);
        expect(stage.getElement("box-1")).toBeDefined();
    });

    it("addElement throws when ID collides with an existing projection", () => {
        expect(() => stage.addElement({ id: "screen" })).toThrow(
            "ID collision: Cannot add element 'screen' - a projection with the same ID already exists."
        );
    });

    it("addProjection throws when ID collides with an existing element", () => {
        stage.addElement({
            id: "p1",
            type: ELEMENT_TYPES.BOX,
            width: 1,
            position: { x: 0, y: 0, z: 0 },
        });

        const projection: BlueprintProjection = {
            id: "p1",
            type: PROJECTION_TYPES.SCREEN,
            lookMode: LOOK_MODES.LOOK_AT,
            position: { x: 0, y: 0, z: 0 },
            direction: { x: 0, y: 0, z: 1 },
            lookAt: { x: 0, y: 0, z: 0 },
        };

        expect(() => stage.addProjection(projection)).toThrow(
            "ID collision: Cannot add projection 'p1' - an element with the same ID already exists."
        );
    });

    it("buildRenderTree returns a virtual root when there are multiple roots", () => {
        const buildRenderTree = (stage as any).buildRenderTree.bind(stage) as (elements: any[]) => any;

        const elements = [
            {
                id: "a",
                bundle: { id: "a", assets: {}, effects: [], resolved: { id: "a", type: ELEMENT_TYPES.BOX, width: 1, position: { x: 0, y: 0, z: 0 } } },
            },
            {
                id: "b",
                bundle: { id: "b", assets: {}, effects: [], resolved: { id: "b", type: ELEMENT_TYPES.BOX, width: 1, position: { x: 0, y: 0, z: 0 } } },
            },
        ];

        const tree = buildRenderTree(elements);

        expect(tree.props.id).toBe("__root__");
        expect(tree.children).toHaveLength(2);
    });

    it("buildRenderTree returns null when there are no elements", () => {
        const buildRenderTree = (stage as any).buildRenderTree.bind(stage) as (elements: any[]) => any;
        expect(buildRenderTree([])).toBeNull();
    });

    it("getScreenProjection throws helpful errors for invalid pools", () => {
        const getScreenProjection = (stage as any).getScreenProjection.bind(stage) as (pool: Record<string, ResolvedProjection>) => ResolvedProjection;

        expect(() => getScreenProjection({})).toThrow("Resolution 'screen' not found.");
        expect(() => getScreenProjection({ screen: undefined as any })).toThrow("Projection 'screen' for screen not found");

        const nonScreen: ResolvedProjection = {
            id: "screen",
            type: PROJECTION_TYPES.EYE,
            position: { x: 0, y: 0, z: 0 },
            rotation: { pitch: 0, yaw: 0, roll: 0 },
            direction: { x: 0, y: 0, z: 1 },
            lookAt: { x: 0, y: 0, z: 0 },
            distance: 1,
            effects: [],
        };
        expect(() => getScreenProjection({ screen: nonScreen })).toThrow("ScreenProjection 'screen' is not type screen");
    });
});

