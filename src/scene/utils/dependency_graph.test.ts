import { describe, expect, it } from "vitest";
import { DependencyGraphTools, type DependencyGraphNodeLike } from "./dependency_graph.ts";

type TestNode = DependencyGraphNodeLike & {
    readonly label: string;
};

describe("DependencyGraphTools", () => {
    const buildGraph = (nodes: TestNode[]) => {
        const nodeMap = new Map(nodes.map((node) => [node.id, node]));
        return new DependencyGraphTools<TestNode>({
            get: (id: string) => nodeMap.get(id),
            all: function* () {
                yield* nodes;
            },
        });
    };

    it("topologically sorts dependencies before dependents", () => {
        const graph = buildGraph([
            { id: "face", label: "face", dependencies: ["webCam", "video"] },
            { id: "webCam", label: "webCam" },
            { id: "video", label: "video" },
        ]);

        const order = graph.topologicalSort().map((node) => node.id);
        expect(order.indexOf("webCam")).toBeLessThan(order.indexOf("face"));
        expect(order.indexOf("video")).toBeLessThan(order.indexOf("face"));
    });

    it("returns direct dependencies in declared order", () => {
        const graph = buildGraph([
            { id: "face", label: "face", dependencies: ["webCam", "video"] },
            { id: "webCam", label: "webCam" },
            { id: "video", label: "video" },
        ]);

        expect(graph.getDependencies("face").map((node) => node.id)).toEqual(["webCam", "video"]);
    });

    it("throws on cycles", () => {
        const graph = buildGraph([
            { id: "a", label: "a", dependencies: ["b"] },
            { id: "b", label: "b", dependencies: ["a"] },
        ]);

        expect(() => graph.validateAll()).toThrow(/recursive reference|cycle/i);
        expect(() => graph.topologicalSort()).toThrow(/cycle/i);
    });

    it("throws when node depends on itself", () => {
        const graph = buildGraph([
            { id: "self", label: "self", dependencies: ["self"] },
        ]);

        expect(() => graph.validateAll()).toThrow(/cannot depend on itself/i);
    });

    it("validates missing dependency when requireDependenciesExist is true", () => {
        const graph = buildGraph([
            { id: "face", label: "face", dependencies: ["missing"] },
        ]);

        expect(() => graph.validateAll({ requireDependenciesExist: true })).toThrow(/not found/i);
    });

    it("skips missing dependency when requireDependenciesExist is false", () => {
        const graph = buildGraph([
            { id: "face", label: "face", dependencies: ["missing"] },
        ]);

        expect(() => graph.validateAll({ requireDependenciesExist: false })).not.toThrow();
    });

    it("returns empty array for unknown node id", () => {
        const graph = buildGraph([
            { id: "face", label: "face" },
        ]);

        expect(graph.getDependencies("unknown")).toEqual([]);
        expect(graph.getDependents("unknown")).toEqual([]);
    });

    it("returns dependents in topological order", () => {
        const graph = buildGraph([
            { id: "root", label: "root" },
            { id: "child", label: "child", dependencies: ["root"] },
            { id: "grandchild", label: "grandchild", dependencies: ["child"] },
        ]);

        const dependents = graph.getDependents("root");
        expect(dependents.map(d => d.id)).toContain("child");
    });

    it("handles empty graph", () => {
        const graph = buildGraph([]);

        expect(graph.topologicalSort()).toEqual([]);
    });

    it("handles nodes with no dependencies", () => {
        const graph = buildGraph([
            { id: "a", label: "a" },
            { id: "b", label: "b" },
        ]);

        const sorted = graph.topologicalSort();
        expect(sorted).toHaveLength(2);
    });
});
