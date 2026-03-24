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
});
