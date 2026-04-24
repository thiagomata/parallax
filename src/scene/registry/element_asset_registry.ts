import {
    type AssetLoader,
    type GraphicsBundle,
    type BundleDynamicElement,
    type ResolvedElement,
    type MapToBlueprint, type EffectLib
} from "../types.ts";
import {ElementResolver} from "../resolver/element_resolver.ts";

interface ElementEntry<TBundle extends GraphicsBundle> {
    element: BundleDynamicElement<any, TBundle>;
    creationIndex: number;
    updateOrder: number;
}

export class ElementAssetRegistry<
    TBundle extends GraphicsBundle,
    TEffectLib extends EffectLib> {
    private readonly elements: Map<string, ElementEntry<TBundle>> = new Map();
    private readonly loader: AssetLoader<TBundle>;
    private readonly resolver: ElementResolver<TBundle, TEffectLib>;
    private _nextUpdateOrder: number = 0;
    private _creationIndex: number = 0;

    constructor(loader: AssetLoader<TBundle>, resolver?: ElementResolver<TBundle, TEffectLib>) {
        this.loader = loader;
        this.resolver = resolver ?? new ElementResolver({} as TEffectLib);
    }

    public register<T extends ResolvedElement>(
        blueprint: MapToBlueprint<T>
    ): BundleDynamicElement<T, TBundle> {
        const existing = this.elements.get(blueprint.id);

        if (existing) {
            return existing.element as BundleDynamicElement<T, TBundle>;
        }

        let updateOrder: number;
        if (blueprint.updateOrder !== undefined) {
            const isUsed = Array.from(this.elements.values()).some(e => e.updateOrder === blueprint.updateOrder);
            if (isUsed) {
                throw new Error(`updateOrder ${blueprint.updateOrder} already used by another element`);
            }
            updateOrder = blueprint.updateOrder;
            this._nextUpdateOrder = updateOrder + 1;
        } else {
            updateOrder = this._nextUpdateOrder;
            this._nextUpdateOrder++;
        }

        const creationIndex = this._creationIndex++;
        const renderable = this.resolver.prepare(blueprint, this.loader);

        this.elements.set(blueprint.id, {
            element: renderable,
            creationIndex,
            updateOrder,
        });

        return renderable;
    }

    public get(id: string): BundleDynamicElement<any, TBundle> | undefined {
        return this.elements.get(id)?.element;
    }

    public getUpdateOrder(id: string): number | undefined {
        return this.elements.get(id)?.updateOrder;
    }

    public all(): IterableIterator<BundleDynamicElement<any, TBundle>> {
        const entries = Array.from(this.elements.values());
        let index = 0;
        return {
            [Symbol.iterator]() {
                return this;
            },
            next(): IteratorResult<BundleDynamicElement<any, TBundle>> {
                if (index >= entries.length) {
                    return { done: true, value: undefined };
                }
                const value = entries[index++].element;
                return { done: false, value };
            }
        };
    }

    public getOrderedElements(): Array<{ id: string; element: BundleDynamicElement<any, TBundle>; updateOrder: number }> {
        const entries = Array.from(this.elements.values())
            .sort((a, b) => a.updateOrder - b.updateOrder);
        return entries.map(e => ({ id: e.element.id, element: e.element, updateOrder: e.updateOrder }));
    }

    public remove(id: string): void {
        this.elements.delete(id);
    }
}