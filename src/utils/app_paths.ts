export const APP_BASE_URL = import.meta.env.BASE_URL;

export function appAssetPath(path: string): string {
    const normalizedBase = APP_BASE_URL.endsWith("/") ? APP_BASE_URL : `${APP_BASE_URL}/`;
    const normalizedPath = path.replace(/^\/+/, "");
    return `${normalizedBase}${normalizedPath}`;
}
