export interface VideoSource<T = unknown> {
    readonly kind: string;
    readonly data: T;
}