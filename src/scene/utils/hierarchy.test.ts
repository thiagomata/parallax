import { describe, expect, it, vi } from "vitest";
import { HierarchyTools, type HierarchyNodeLike, type HierarchySource } from "./hierarchy.ts";

type TestNode = HierarchyNodeLike & {
    readonly label: string;
};

class MemoryHierarchySource<T extends HierarchyNodeLike> implements HierarchySource<T> {
    private readonly nodes: T[];

    constructor(nodes: T[]) {
        this.nodes = nodes;
    }

    get(id: string): T | undefined {
        return this.nodes.find(node => node.id === id);
    }

    all(): Iterable<T> {
        return this.nodes;
    }
}

describe("HierarchyTools", () => {
    it("validates self references, missing parents, and cycles", () => {
        const root: TestNode = { id: "root", label: "root" };
        const child: TestNode = { id: "child", parentId: "root", label: "child" };
        const source = new MemoryHierarchySource<TestNode>([root, child]);
        const tools = new HierarchyTools(source);

        expect(() => tools.validate({ id: "self", parentId: "self", label: "self" })).toThrow(
            'Self-Reference: Node "self" cannot target itself.'
        );
        expect(() => tools.validate({ id: "missing", parentId: "ghost", label: "missing" })).toThrow(
            'Hierarchy Violation: Parent "ghost" not found.'
        );

        const cyclicSource = new MemoryHierarchySource<TestNode>([
            { id: "a", parentId: "b", label: "a" },
            { id: "b", parentId: "a", label: "b" },
        ]);
        const cyclicTools = new HierarchyTools(cyclicSource);

        expect(() => cyclicTools.validate({ id: "a", parentId: "b", label: "a" })).toThrow(
            'Hierarchy Violation: Parent "b" has recursive reference.'
        );

        expect(() => tools.validate(child)).not.toThrow();
    });

    it("can allow missing parents while still validating cycles", () => {
        const source = new MemoryHierarchySource<TestNode>([
            { id: "root", label: "root" },
            { id: "child", parentId: "root", label: "child" },
        ]);

        const tools = new HierarchyTools(source);

        expect(() => tools.validate({ id: "orphan", parentId: "missing", label: "orphan" }, { requireParentExists: false })).not.toThrow();

        const cyclicSource = new MemoryHierarchySource<TestNode>([
            { id: "a", parentId: "b", label: "a" },
            { id: "b", parentId: "a", label: "b" },
        ]);
        const cyclicTools = new HierarchyTools(cyclicSource);

        expect(() => cyclicTools.validate({ id: "a", parentId: "b", label: "a" }, { requireParentExists: false })).toThrow(
            'Hierarchy Violation: Parent "b" has recursive reference.'
        );
    });

    it("buildForest links roots and descendants", () => {
        const source = new MemoryHierarchySource<TestNode>([
            { id: "root", label: "root" },
            { id: "child", parentId: "root", label: "child" },
            { id: "leaf", parentId: "child", label: "leaf" },
            { id: "orphan", parentId: "missing", label: "orphan" },
        ]);

        const tools = new HierarchyTools(source);
        const forest = tools.buildForest();

        expect(forest).toHaveLength(2);
        expect(forest[0].value.id).toBe("root");
        expect(forest[0].children[0].value.id).toBe("child");
        expect(forest[0].children[0].children[0].value.id).toBe("leaf");
        expect(forest[0].depth).toBe(0);
        expect(forest[0].children[0].depth).toBe(1);
        expect(forest[0].children[0].children[0].depth).toBe(2);
        expect(forest[1].value.id).toBe("orphan");
        expect(forest[1].parent).toBeNull();
    });

    it("walks from roots to leaves in pre-order", () => {
        const source = new MemoryHierarchySource<TestNode>([
            { id: "root", label: "root" },
            { id: "child-a", parentId: "root", label: "child-a" },
            { id: "child-b", parentId: "root", label: "child-b" },
            { id: "leaf", parentId: "child-a", label: "leaf" },
        ]);

        const tools = new HierarchyTools(source);
        const visit = vi.fn();

        tools.walk(visit);

        expect(visit).toHaveBeenCalledTimes(4);
        expect(visit.mock.calls.map(call => call[0].id)).toEqual([
            "root",
            "child-a",
            "leaf",
            "child-b",
        ]);

        const leafContext = visit.mock.calls[2][1] as {
            parent: TestNode | null;
            depth: number;
            path: readonly TestNode[];
            ancestorsById: ReadonlyMap<string, TestNode>;
        };
        expect(leafContext.depth).toBe(2);
        expect(leafContext.parent?.id).toBe("child-a");
        expect(leafContext.path.map(node => node.id)).toEqual(["root", "child-a", "leaf"]);
        expect(leafContext.ancestorsById.get("root")?.id).toBe("root");
        expect(leafContext.ancestorsById.get("child-a")?.id).toBe("child-a");
        expect(leafContext.ancestorsById.has("leaf")).toBe(false);
    });

    it("returns ancestors from nearest parent to root", () => {
        const source = new MemoryHierarchySource<TestNode>([
            { id: "root", label: "root" },
            { id: "child", parentId: "root", label: "child" },
            { id: "leaf", parentId: "child", label: "leaf" },
        ]);

        const tools = new HierarchyTools(source);

        expect(tools.getAncestors("leaf").map(node => node.id)).toEqual(["child", "root"]);
        expect(tools.getAncestors("root")).toEqual([]);
    });

    it("detects recursive ancestor lookup", () => {
        const source = new MemoryHierarchySource<TestNode>([
            { id: "a", parentId: "b", label: "a" },
            { id: "b", parentId: "a", label: "b" },
        ]);
        const tools = new HierarchyTools(source);

        expect(() => tools.getAncestors("a")).toThrow(
            'Hierarchy Violation: Node "a" has recursive reference.'
        );
    });

    it("stops ancestor lookup when the chain ends early", () => {
        const source = new MemoryHierarchySource<TestNode>([
            { id: "orphan", parentId: "ghost", label: "orphan" },
        ]);
        const tools = new HierarchyTools(source);

        expect(tools.getAncestors("orphan").map(node => node.id)).toEqual([]);
    });

    it("can allow missing parents in recursive validation chains", () => {
        const source = new MemoryHierarchySource<TestNode>([
            { id: "root", parentId: "missing", label: "root" },
            { id: "child", parentId: "root", label: "child" },
        ]);
        const tools = new HierarchyTools(source);

        expect(() => tools.validate({ id: "child", parentId: "root", label: "child" }, { requireParentExists: false })).not.toThrow();
    });
});
