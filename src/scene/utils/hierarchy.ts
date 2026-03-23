export type HierarchyNodeLike = {
    readonly id: string;
    readonly parentId?: string;
};

export interface HierarchySource<T extends HierarchyNodeLike> {
    get(id: string): T | undefined;
    all(): Iterable<T>;
}

export interface HierarchyTreeNode<T> {
    value: T;
    parent: HierarchyTreeNode<T> | null;
    children: HierarchyTreeNode<T>[];
    depth: number;
}

export interface HierarchyWalkContext<T> {
    readonly parent: T | null;
    readonly depth: number;
    readonly path: readonly T[];
    readonly ancestorsById: ReadonlyMap<string, T>;
}

export interface HierarchyValidationOptions {
    readonly requireParentExists?: boolean;
}

export class HierarchyTools<T extends HierarchyNodeLike> {
    private readonly source: HierarchySource<T>;

    constructor(source: HierarchySource<T>) {
        this.source = source;
    }

    validate(node: T, options: HierarchyValidationOptions = {}): void {
        const { parentId } = node;
        const requireParentExists = options.requireParentExists ?? true;

        if (!parentId) return;

        if (parentId === node.id) {
            throw new Error(`Self-Reference: Node "${node.id}" cannot target itself.`);
        }

        const parent = this.source.get(parentId);
        if (!parent) {
            if (!requireParentExists) return;
            throw new Error(`Hierarchy Violation: Parent "${parentId}" not found.`);
        }

        if (!this.isAcyclic(node.id, parentId, requireParentExists)) {
            throw new Error(`Hierarchy Violation: Parent "${parentId}" has recursive reference.`);
        }
    }

    validateAll(options: HierarchyValidationOptions = {}): void {
        for (const node of this.source.all()) {
            this.validate(node, options);
        }
    }

    getAncestors(id: string): T[] {
        const ancestors: T[] = [];
        const visited = new Set<string>([id]);

        let currentId = this.source.get(id)?.parentId;
        while (currentId) {
            if (visited.has(currentId)) {
                throw new Error(`Hierarchy Violation: Node "${id}" has recursive reference.`);
            }

            const parent = this.source.get(currentId);
            if (!parent) break;

            ancestors.push(parent);
            visited.add(parent.id);
            currentId = parent.parentId;
        }

        return ancestors;
    }

    buildForest(): HierarchyTreeNode<T>[] {
        const nodeMap = new Map<string, HierarchyTreeNode<T>>();

        for (const value of this.source.all()) {
            nodeMap.set(value.id, {
                value,
                parent: null,
                children: [],
                depth: 0,
            });
        }

        const roots: HierarchyTreeNode<T>[] = [];
        for (const node of nodeMap.values()) {
            const parentId = node.value.parentId;
            if (parentId) {
                const parent = nodeMap.get(parentId);
                if (parent) {
                    node.parent = parent;
                    parent.children.push(node);
                    continue;
                }
            }

            roots.push(node);
        }

        for (const root of roots) {
            this.assignDepth(root, null, 0);
        }

        return roots;
    }

    walk(
        visit: (node: T, context: HierarchyWalkContext<T>) => void
    ): void {
        const roots = this.buildForest();

        const walkNode = (node: HierarchyTreeNode<T>, path: T[], ancestorsById: ReadonlyMap<string, T>) => {
            visit(node.value, {
                parent: node.parent?.value ?? null,
                depth: node.depth,
                path,
                ancestorsById,
            });

            for (const child of node.children) {
                const nextAncestors = new Map(ancestorsById);
                nextAncestors.set(node.value.id, node.value);
                walkNode(child, [...path, child.value], nextAncestors);
            }
        };

        for (const root of roots) {
            walkNode(root, [root.value], new Map());
        }
    }

    private isAcyclic(id: string, parentId: string, requireParentExists: boolean): boolean {
        let currentId: string | undefined = parentId;
        const visited = new Set<string>([id]);

        while (currentId) {
            if (visited.has(currentId)) {
                return false;
            }

            visited.add(currentId);
            const next = this.source.get(currentId);
            if (!next) {
                return !requireParentExists;
            }
            currentId = next.parentId;
        }

        return true;
    }

    private assignDepth(
        node: HierarchyTreeNode<T>,
        parent: HierarchyTreeNode<T> | null,
        depth: number
    ): void {
        node.parent = parent;
        node.depth = depth;

        for (const child of node.children) {
            this.assignDepth(child, node, depth + 1);
        }
    }
}
