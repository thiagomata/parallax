export type DependencyGraphNodeLike = {
    readonly id: string;
    readonly dependencies?: readonly string[];
};

export interface DependencyGraphSource<T extends DependencyGraphNodeLike> {
    get(id: string): T | undefined;
    all(): Iterable<T>;
}

export interface DependencyGraphValidationOptions {
    readonly requireDependenciesExist?: boolean;
}

export interface DependencyGraphWalkContext<T> {
    readonly dependencies: readonly T[];
    readonly dependents: readonly T[];
    readonly upstreamById: ReadonlyMap<string, T>;
    readonly order: number;
}

export class DependencyGraphTools<T extends DependencyGraphNodeLike> {
    private readonly source: DependencyGraphSource<T>;

    constructor(source: DependencyGraphSource<T>) {
        this.source = source;
    }

    validate(node: T, options: DependencyGraphValidationOptions = {}): void {
        const requireDependenciesExist = options.requireDependenciesExist ?? true;
        for (const dependencyId of node.dependencies ?? []) {
            if (dependencyId === node.id) {
                throw new Error(`Dependency Graph Violation: Node "${node.id}" cannot depend on itself.`);
            }

            const dependency = this.source.get(dependencyId);
            if (!dependency) {
                if (!requireDependenciesExist) continue;
                throw new Error(`Dependency Graph Violation: Dependency "${dependencyId}" not found.`);
            }

            if (!this.isAcyclic(node.id, dependencyId, requireDependenciesExist)) {
                throw new Error(`Dependency Graph Violation: Node "${node.id}" has recursive reference.`);
            }
        }
    }

    validateAll(options: DependencyGraphValidationOptions = {}): void {
        for (const node of this.source.all()) {
            this.validate(node, options);
        }
    }

    getDependencies(id: string): T[] {
        const node = this.source.get(id);
        if (!node) return [];

        const dependencies: T[] = [];
        for (const dependencyId of node.dependencies ?? []) {
            const dependency = this.source.get(dependencyId);
            if (dependency) {
                dependencies.push(dependency);
            }
        }
        return dependencies;
    }

    getDependents(id: string): T[] {
        const dependents: T[] = [];
        for (const node of this.source.all()) {
            if ((node.dependencies ?? []).includes(id)) {
                dependents.push(node);
            }
        }
        return dependents;
    }

    getUpstream(id: string): T[] {
        const upstream: T[] = [];
        const collected = new Set<string>();
        const visiting = new Set<string>([id]);

        const visit = (currentId: string): void => {
            const node = this.source.get(currentId);
            if (!node) return;

            for (const dependencyId of node.dependencies ?? []) {
                if (visiting.has(dependencyId)) {
                    throw new Error(`Dependency Graph Violation: Node "${id}" has recursive reference.`);
                }

                if (collected.has(dependencyId)) {
                    continue;
                }

                visiting.add(dependencyId);
                visit(dependencyId);
                visiting.delete(dependencyId);

                const dependency = this.source.get(dependencyId);
                if (dependency && !collected.has(dependency.id)) {
                    collected.add(dependency.id);
                    upstream.push(dependency);
                }
            }
        };

        visit(id);
        return upstream;
    }

    topologicalSort(): T[] {
        const nodes = new Map<string, T>();
        for (const node of this.source.all()) {
            nodes.set(node.id, node);
        }

        const indegree = new Map<string, number>();
        const outgoing = new Map<string, string[]>();

        for (const node of nodes.values()) {
            indegree.set(node.id, 0);
            outgoing.set(node.id, []);
        }

        for (const node of nodes.values()) {
            for (const dependencyId of node.dependencies ?? []) {
                if (!nodes.has(dependencyId)) continue;
                indegree.set(node.id, (indegree.get(node.id) ?? 0) + 1);
                outgoing.get(dependencyId)?.push(node.id);
            }
        }

        const orderedIds: string[] = [];
        const queue = Array.from(nodes.values())
            .filter((node) => (indegree.get(node.id) ?? 0) === 0)
            .map((node) => node.id);

        while (queue.length > 0) {
            const id = queue.shift()!;
            orderedIds.push(id);

            for (const dependentId of outgoing.get(id) ?? []) {
                const nextDegree = (indegree.get(dependentId) ?? 0) - 1;
                indegree.set(dependentId, nextDegree);
                if (nextDegree === 0) {
                    queue.push(dependentId);
                }
            }
        }

        if (orderedIds.length !== nodes.size) {
            throw new Error("Dependency Graph Violation: Graph has a cycle.");
        }

        return orderedIds
            .map((id) => nodes.get(id))
            .filter((node): node is T => !!node);
    }

    walk(visit: (node: T, context: DependencyGraphWalkContext<T>) => void): void {
        const ordered = this.topologicalSort();
        const visited = new Map<string, T>();

        ordered.forEach((node, order) => {
            const dependencies = this.getDependencies(node.id);
            visit(node, {
                dependencies,
                dependents: this.getDependents(node.id),
                upstreamById: new Map(visited),
                order,
            });
            visited.set(node.id, node);
        });
    }

    private isAcyclic(id: string, dependencyId: string, requireDependenciesExist: boolean): boolean {
        const visiting = new Set<string>([id]);

        const visit = (currentId: string): boolean => {
            if (visiting.has(currentId)) {
                return false;
            }

            const next = this.source.get(currentId);
            if (!next) {
                return !requireDependenciesExist;
            }

            visiting.add(currentId);
            for (const nextDependency of next.dependencies ?? []) {
                if (!visit(nextDependency)) {
                    visiting.delete(currentId);
                    return false;
                }
            }
            visiting.delete(currentId);

            return true;
        };

        return visit(dependencyId);
    }
}
