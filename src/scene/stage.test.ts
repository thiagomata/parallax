import { beforeEach, describe, expect, it, vi } from "vitest";
import { Stage } from "./stage.ts";
import {
    ASSET_STATUS,
    DEFAULT_EYE_ROTATION,
    DEFAULT_SCENE_SETTINGS,
    DEFAULT_WINDOW_CONFIG,
    ELEMENT_TYPES,
    LOOK_MODES,
    STANDARD_PROJECTION_IDS,
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
        expect(() => stage.addElement({ id: STANDARD_PROJECTION_IDS.SCREEN })).toThrow(
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

    it("addProjection throws when parentId does not exist", () => {
        const projection: BlueprintProjection = {
            id: "p2",
            type: PROJECTION_TYPES.WORLD,
            lookMode: LOOK_MODES.LOOK_AT,
            parentId: "missing",
            position: { x: 0, y: 0, z: 0 },
            direction: { x: 0, y: 0, z: 1 },
            lookAt: { x: 0, y: 0, z: 0 },
        };

        expect(() => stage.addProjection(projection)).toThrow(
            "Parent missing not found for projection p2"
        );
    });

    it("addProjection throws when a projection targets its own descendant", () => {
        const projection: BlueprintProjection = {
            id: STANDARD_PROJECTION_IDS.SCREEN,
            type: PROJECTION_TYPES.SCREEN,
            lookMode: LOOK_MODES.ROTATION,
            parentId: STANDARD_PROJECTION_IDS.EYE,
            position: { x: 0, y: 0, z: 0 },
            direction: { x: 0, y: 0, z: 1 },
            rotation: { pitch: 0, yaw: 0, roll: 0 },
            effects: [],
        };

        expect(() => stage.addProjection(projection)).toThrow(
            "Circular dependency: screen targets its own descendant."
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

    describe("buildProjectionTree", () => {
        it("returns null when there are no projections", () => {
            const buildProjectionTree = (stage as any).buildProjectionTree.bind(stage) as (pool: Record<string, ResolvedProjection>) => any;
            const result = buildProjectionTree({});
            expect(result.tree).toBeNull();
            expect(result.flatMap.size).toBe(0);
        });

        it("builds tree with single root projection", () => {
            const buildProjectionTree = (stage as any).buildProjectionTree.bind(stage) as (pool: Record<string, ResolvedProjection>) => any;
            const pool: Record<string, ResolvedProjection> = {
                eye: {
                    id: "eye",
                    type: PROJECTION_TYPES.EYE,
                    position: { x: 0, y: 5, z: 10 },
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 10,
                    effects: [],
                }
            };

            const result = buildProjectionTree(pool);

            expect(result.tree).not.toBeNull();
            expect(result.tree!.props.id).toBe("eye");
            expect(result.tree!.children).toHaveLength(0);
            expect(result.flatMap.size).toBe(1);
        });

        it("computes global position for root projection", () => {
            const pool: Record<string, ResolvedProjection> = {
                eye: {
                    id: "eye",
                    type: PROJECTION_TYPES.EYE,
                    position: { x: 10, y: 20, z: 30 },
                    rotation: { yaw: 0.1, pitch: 0.2, roll: 0.3 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 10,
                    effects: [],
                }
            };

            const buildProjectionTree = (stage as any).buildProjectionTree.bind(stage) as (pool: Record<string, ResolvedProjection>) => any;
            const result = buildProjectionTree(pool);

            expect(result.tree!.props.globalPosition).toEqual({ x: 10, y: 20, z: 30 });
            expect(result.tree!.props.globalRotation).toEqual({ yaw: 0.1, pitch: 0.2, roll: 0.3 });
        });

        it("links child projection to parent via parentId", () => {
            const buildProjectionTree = (stage as any).buildProjectionTree.bind(stage) as (pool: Record<string, ResolvedProjection>) => any;
            const pool: Record<string, ResolvedProjection> = {
                screen: {
                    id: "screen",
                    type: PROJECTION_TYPES.SCREEN,
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 10 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 10,
                    effects: [],
                },
                eye: {
                    id: "eye",
                    type: PROJECTION_TYPES.EYE,
                    parentId: "screen",
                    position: { x: 0, y: 5, z: -10 },
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 10,
                    effects: [],
                }
            };

            const result = buildProjectionTree(pool);

            expect(result.tree).not.toBeNull();
            expect(result.tree!.props.id).toBe("screen");
            expect(result.tree!.children).toHaveLength(1);
            expect(result.tree!.children[0].props.id).toBe("eye");
        });

        it("computes global position for child projection", () => {
            const pool: Record<string, ResolvedProjection> = {
                screen: {
                    id: "screen",
                    type: PROJECTION_TYPES.SCREEN,
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 10 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 10,
                    effects: [],
                },
                eye: {
                    id: "eye",
                    type: PROJECTION_TYPES.EYE,
                    parentId: "screen",
                    position: { x: 0, y: 5, z: -10 },
                    rotation: { yaw: 0.5, pitch: 0.2, roll: 0.1 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 10,
                    effects: [],
                }
            };

            const buildProjectionTree = (stage as any).buildProjectionTree.bind(stage) as (pool: Record<string, ResolvedProjection>) => any;
            const result = buildProjectionTree(pool);

            // screen (root): global = local
            expect(result.flatMap.get("screen")!.globalPosition).toEqual({ x: 0, y: 0, z: 0 });
            expect(result.flatMap.get("screen")!.globalRotation).toEqual({ yaw: 0, pitch: 0, roll: 0 });

            // eye (child): global = parentGlobal + rotate(local)
            // position: (0, 5, -10) + (0, 0, 0) = (0, 5, -10)
            expect(result.flatMap.get("eye")!.globalPosition).toEqual({ x: 0, y: 5, z: -10 });
            // rotation: (0.5, 0.2, 0.1) + (0, 0, 0) = (0.5, 0.2, 0.1)
            expect(result.flatMap.get("eye")!.globalRotation).toEqual({ yaw: 0.5, pitch: 0.2, roll: 0.1 });
        });

        it("computes global position with parent rotation", () => {
            const buildProjectionTree = (stage as any).buildProjectionTree.bind(stage) as (pool: Record<string, ResolvedProjection>) => any;
            const pool: Record<string, ResolvedProjection> = {
                screen: {
                    id: "screen",
                    type: PROJECTION_TYPES.SCREEN,
                    position: { x: 10, y: 0, z: 0 },
                    rotation: { yaw: Math.PI / 2, pitch: 0, roll: 0 }, // 90 degrees yaw
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 10,
                    effects: [],
                },
                eye: {
                    id: "eye",
                    type: PROJECTION_TYPES.EYE,
                    parentId: "screen",
                    position: { x: 0, y: 0, z: -5 }, // 5 units "forward" in local space
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 5,
                    effects: [],
                }
            };

            const result = buildProjectionTree(pool);

            // screen (root): global = local
            expect(result.flatMap.get("screen")!.globalPosition).toEqual({ x: 10, y: 0, z: 0 });

            // eye: position rotated by parent's rotation (90 yaw)
            // local (0, 0, -5) rotated by (PI/2, 0, 0) = (5, 0, 0)
            // global = (10, 0, 0) + (5, 0, 0) = (15, 0, 0)
            expect(result.flatMap.get("eye")!.globalPosition.x).toBeCloseTo(15, 5);
            expect(result.flatMap.get("eye")!.globalPosition.y).toBeCloseTo(0, 5);
            expect(result.flatMap.get("eye")!.globalPosition.z).toBeCloseTo(0, 5);
        });

        it("returns virtual root when there are multiple roots", () => {
            const pool: Record<string, ResolvedProjection> = {
                eye: {
                    id: "eye",
                    type: PROJECTION_TYPES.EYE,
                    position: { x: 0, y: 5, z: 10 },
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 10,
                    effects: [],
                },
                screen: {
                    id: "screen",
                    type: PROJECTION_TYPES.SCREEN,
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 10 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 10,
                    effects: [],
                }
            };

            const buildProjectionTree = (stage as any).buildProjectionTree.bind(stage) as (pool: Record<string, ResolvedProjection>) => any;
            const result = buildProjectionTree(pool);

            expect(result.tree).not.toBeNull();
            expect(result.tree!.props.id).toBe("__root__");
            expect(result.tree!.children).toHaveLength(2);
        });

        it("handles deep hierarchy", () => {
            const buildProjectionTree = (stage as any).buildProjectionTree.bind(stage) as (pool: Record<string, ResolvedProjection>) => any;
            const pool: Record<string, ResolvedProjection> = {
                root: {
                    id: "root",
                    type: PROJECTION_TYPES.SCREEN,
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 1 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 1,
                    effects: [],
                },
                child1: {
                    id: "child1",
                    type: PROJECTION_TYPES.EYE,
                    parentId: "root",
                    position: { x: 0, y: 0, z: -10 },
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 10,
                    effects: [],
                },
                child2: {
                    id: "child2",
                    type: PROJECTION_TYPES.EYE,
                    parentId: "child1",
                    position: { x: 5, y: 0, z: 0 },
                    rotation: { yaw: 0.1, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 5,
                    effects: [],
                }
            };

            const result = buildProjectionTree(pool);

            expect(result.tree!.props.id).toBe("root");
            expect(result.tree!.children[0].props.id).toBe("child1");
            expect(result.tree!.children[0].children[0].props.id).toBe("child2");

            // child2 global = root + child1 + child2 transforms
            // child1: (0, 0, -10) + (0, 0, 0) = (0, 0, -10)
            expect(result.flatMap.get("child1")!.globalPosition).toEqual({ x: 0, y: 0, z: -10 });
            // child2: (5, 0, 0) rotated by child1 rot (0) + child1 pos (0, 0, -10)
            // = (5, 0, 0) + (0, 0, -10) = (5, 0, -10)
            expect(result.flatMap.get("child2")!.globalPosition).toEqual({ x: 5, y: 0, z: -10 });
        });

        it("computes global rotation by accumulating all parent rotations", () => {
            const buildProjectionTree = (stage as any).buildProjectionTree.bind(stage) as (pool: Record<string, ResolvedProjection>) => any;
            const pool: Record<string, ResolvedProjection> = {
                root: {
                    id: "root",
                    type: PROJECTION_TYPES.SCREEN,
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { yaw: 0.1, pitch: 0.2, roll: 0.3 },
                    lookAt: { x: 0, y: 0, z: 1 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 1,
                    effects: [],
                },
                child: {
                    id: "child",
                    type: PROJECTION_TYPES.EYE,
                    parentId: "root",
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { yaw: 0.5, pitch: 0.6, roll: 0.7 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 1,
                    effects: [],
                }
            };

            const result = buildProjectionTree(pool);

            // Child global rotation = local + parent
            expect(result.flatMap.get("child")!.globalRotation).toEqual({
                yaw: 0.1 + 0.5,
                pitch: 0.2 + 0.6,
                roll: 0.3 + 0.7
            });
        });

        it("preserves original projection properties (effects, type, id)", () => {
            const buildProjectionTree = (stage as any).buildProjectionTree.bind(stage) as (pool: Record<string, ResolvedProjection>) => any;
            const pool: Record<string, ResolvedProjection> = {
                eye: {
                    id: "eye",
                    type: PROJECTION_TYPES.EYE,
                    position: { x: 0, y: 5, z: 10 },
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 10,
                    effects: [{ type: 'testEffect', config: { foo: 'bar' } }] as any,
                }
            };

            const result = buildProjectionTree(pool);

            expect(result.tree!.props.id).toBe("eye");
            expect(result.tree!.props.type).toBe(PROJECTION_TYPES.EYE);
            expect(result.tree!.props.effects).toHaveLength(1);
            expect((result.tree!.props.effects as any)[0].type).toBe("testEffect");
            expect(result.tree!.props.lookAt).toEqual({ x: 0, y: 0, z: 0 });
            expect(result.tree!.props.direction).toEqual({ x: 0, y: 0, z: 1 });
        });

        it("flatMap contains all projections with globals", () => {
            const buildProjectionTree = (stage as any).buildProjectionTree.bind(stage) as (pool: Record<string, ResolvedProjection>) => any;
            const pool: Record<string, ResolvedProjection> = {
                screen: {
                    id: "screen",
                    type: PROJECTION_TYPES.SCREEN,
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 10 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 10,
                    effects: [],
                },
                eye: {
                    id: "eye",
                    type: PROJECTION_TYPES.EYE,
                    parentId: "screen",
                    position: { x: 0, y: 5, z: -10 },
                    rotation: { yaw: 0.5, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 10,
                    effects: [],
                },
                child: {
                    id: "child",
                    type: PROJECTION_TYPES.EYE,
                    parentId: "eye",
                    position: { x: 3, y: 0, z: 0 },
                    rotation: { yaw: 0, pitch: 0, roll: 0 },
                    lookAt: { x: 0, y: 0, z: 0 },
                    direction: { x: 0, y: 0, z: 1 },
                    distance: 3,
                    effects: [],
                }
            };

            const result = buildProjectionTree(pool);

            expect(result.flatMap.size).toBe(3);
            expect(result.flatMap.has("screen")).toBe(true);
            expect(result.flatMap.has("eye")).toBe(true);
            expect(result.flatMap.has("child")).toBe(true);

            // All entries should have globalPosition and globalRotation
            for (const [id, proj] of result.flatMap) {
                expect(proj.globalPosition).toBeDefined();
                expect(proj.globalRotation).toBeDefined();
                expect(proj.id).toBe(id);
            }
        });
    });

    it("removeElement does not remove children; children become roots when parent is removed", () => {
        stage.addElement({
            id: "parent",
            type: ELEMENT_TYPES.BOX,
            width: 1,
            position: { x: 0, y: 0, z: 0 },
        });

        stage.addElement({
            id: "child",
            type: ELEMENT_TYPES.BOX,
            width: 1,
            parentId: "parent",
            position: { x: 1, y: 0, z: 0 },
        });

        const gp = {
            dist: () => 0,
            drawTree: vi.fn(),
            setCameraTree: vi.fn(),
        } as any;

        stage.render(gp, {
            playback: { now: 0, delta: 0, frameCount: 0, progress: 0 },
            previousResolved: null,
            sceneId: 1,
        });

        const treeBefore = vi.mocked(gp.drawTree).mock.calls[0]?.[0];
        expect(treeBefore.props.id).toBe("parent");
        expect(treeBefore.children).toHaveLength(1);
        expect(treeBefore.children[0].props.id).toBe("child");

        stage.removeElement("parent");
        expect(stage.getElement("parent")).toBeUndefined();
        expect(stage.getElement("child")).toBeDefined();

        stage.render(gp, {
            playback: { now: 16, delta: 16, frameCount: 1, progress: 0 },
            previousResolved: null,
            sceneId: 2,
        });

        const treeAfter = vi.mocked(gp.drawTree).mock.calls[1]?.[0];
        expect(treeAfter.props.id).toBe("child");
        expect(treeAfter.children).toHaveLength(0);
    });

    it("render ticks all projection modifiers (car/nudge/stick)", () => {
        const carTick = vi.fn();
        const nudgeTick = vi.fn();
        const stickTick = vi.fn();

        stage.setScreen({
            type: PROJECTION_TYPES.SCREEN,
            modifiers: {
                carModifiers: [
                    {
                        name: "car",
                        priority: 1,
                        active: true,
                        tick: carTick,
                        getCarPosition: () => ({ success: false, error: "nope" }),
                    } as any,
                ],
                nudgeModifiers: [
                    {
                        name: "nudge",
                        active: true,
                        tick: nudgeTick,
                        getNudge: () => ({ success: false, error: "nope" }),
                    } as any,
                ],
                stickModifiers: [
                    {
                        name: "stick",
                        priority: 1,
                        active: true,
                        tick: stickTick,
                        getStick: () => ({ success: false, error: "nope" }),
                    } as any,
                ],
            },
        } as any);

        const gp = {
            dist: () => 0,
            drawTree: vi.fn(),
            setCameraTree: vi.fn(),
        } as any;

        stage.render(gp, {
            playback: { now: 0, delta: 0, frameCount: 0, progress: 0 },
            previousResolved: null,
            sceneId: 123,
        });

        expect(carTick).toHaveBeenCalledWith(123);
        expect(nudgeTick).toHaveBeenCalledWith(123);
        expect(stickTick).toHaveBeenCalledWith(123);
    });

    it("render ticks data providers and exposes getData results to computed element specs", () => {
        const provider = {
            type: "foo",
            tick: vi.fn(),
            getData: vi.fn().mockReturnValue({ offsetX: 42 }),
        };

        const settings = structuredClone(DEFAULT_SCENE_SETTINGS);
        settings.window = WindowConfig.create(DEFAULT_WINDOW_CONFIG);
        const stageWithProviders = new Stage<MockGraphicBundle, {}, {}, { foo: typeof provider }>(settings, loader, {}, {}, { foo: provider });

        stageWithProviders.addElement({
            id: "box",
            type: ELEMENT_TYPES.BOX,
            width: 1,
            position: (ctx: any) => ({ x: ctx.dataProviders.foo.offsetX, y: 0, z: 0 }),
        } as any);

        const dist = vi.fn((_a: any, _b: any) => 0);
        const gp = {
            dist,
            drawTree: vi.fn(),
            setCameraTree: vi.fn(),
        } as any;

        stageWithProviders.render(gp, {
            playback: { now: 0, delta: 0, frameCount: 0, progress: 0 },
            previousResolved: null,
            sceneId: 7,
        });

        expect(provider.tick).toHaveBeenCalledWith(7);
        expect(provider.getData).toHaveBeenCalled();
        expect(dist).toHaveBeenCalled();
        expect(dist.mock.calls[0][1]).toEqual({ x: 42, y: 0, z: 0 });
    });

	    it("setEye replaces the eye projection", () => {
	        const before = (stage as any).projectionRegistry.get(STANDARD_PROJECTION_IDS.EYE);
	        stage.setEye({
	            ...DEFAULT_EYE_ROTATION,
	            position: { x: 1, y: 2, z: 3 },
	        } as any);
	        const after = (stage as any).projectionRegistry.get(STANDARD_PROJECTION_IDS.EYE);

	        expect(after).toBeDefined();
	        expect(after).not.toBe(before);
	    });

    describe("addModifierToProjection", () => {
        it("throws if projection doesn't exist", () => {
            expect(() => {
                (stage as any).addModifierToProjection('nonexistent', {} as any, 'car');
            }).toThrow("Projection 'nonexistent' not found");
        });

        it("adds car modifier to projection", () => {
            const mockModifier = {
                name: 'test',
                active: true,
                tick: () => {},
                priority: 1,
                getCarPosition: () => ({ success: true, value: { name: 'test', position: { x: 10, y: 20, z: 30 } } })
            };

            (stage as any).addModifierToProjection('eye', mockModifier, 'car');

            const projection = (stage as any).projectionRegistry.get('eye');
            expect(projection.modifiers?.carModifiers).toHaveLength(1);
            expect(projection.modifiers?.carModifiers?.[0]).toBe(mockModifier);
        });

        it("adds stick modifier to projection with ROTATION lookMode", () => {
            const mockStickModifier = {
                name: 'stickTest',
                active: true,
                tick: () => {},
                priority: 1,
                getStick: () => ({ success: true, value: { yaw: 0.5, pitch: 0.2, roll: 0.1 } })
            };

            (stage as any).addModifierToProjection('eye', mockStickModifier as any, 'stick');

            const projection = (stage as any).projectionRegistry.get('eye');
            expect(projection.modifiers?.stickModifiers).toHaveLength(1);
        });

        it("throws when adding stick modifier to LOOK_AT projection", () => {
            // Add a LOOK_AT projection directly to registry
            const lookAtProjection = {
                id: 'testLookAt',
                type: PROJECTION_TYPES.EYE,
                position: { x: 0, y: 0, z: 0 },
                lookAt: { x: 0, y: 0, z: 1 },
                lookMode: LOOK_MODES.LOOK_AT,
                modifiers: {},
            };
            
            (stage as any).projectionRegistry.update(lookAtProjection);

            const mockStickModifier = {
                name: 'stickTest',
                active: true,
                tick: () => {},
                priority: 1,
                getStick: () => ({ success: true, value: { yaw: 0.5, pitch: 0.2, roll: 0.1 } })
            };

            expect(() => {
                (stage as any).addModifierToProjection('testLookAt', mockStickModifier as any, 'stick');
            }).toThrow("Cannot add stickModifier to projection 'testLookAt' with lookMode LOOK_AT");
        });

        it("adds nudge modifier", () => {
            const mockNudgeModifier = {
                name: 'nudgeTest',
                active: true,
                tick: () => {},
                getNudge: () => ({ success: true, value: { x: 5, y: 10, z: 15 } })
            };

            (stage as any).addModifierToProjection('eye', mockNudgeModifier as any, 'nudge');

            const projection = (stage as any).projectionRegistry.get('eye');
            expect(projection.modifiers?.nudgeModifiers).toHaveLength(1);
        });
    });
});
