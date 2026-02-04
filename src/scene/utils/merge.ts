export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[]
        ? DeepPartial<U>[]
        : T[P] extends object
            ? DeepPartial<T[P]>
            : T[P];
};

/**
 * Merges a partial updates into a tree structure immutably.
 */
export function merge<T>(base: T, updates: DeepPartial<T>): T {
    // Handle non-object or null cases (Base Case)
    if (typeof base !== 'object' || base === null || typeof updates !== 'object' || updates === null) {
        return updates as T;
    }

    // Create a shallow copy to maintain immutability
    const result = { ...base } as any;

    for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            const baseValue = result[key];
            const updateValue = (updates as any)[key];

            // If both are objects, recurse
            if (
                baseValue && typeof baseValue === 'object' &&
                updateValue && typeof updateValue === 'object' &&
                !Array.isArray(updateValue)
            ) {
                result[key] = merge(baseValue, updateValue);
            } else {
                // Otherwise, overwrite
                result[key] = updateValue;
            }
        }
    }

    return result;
}