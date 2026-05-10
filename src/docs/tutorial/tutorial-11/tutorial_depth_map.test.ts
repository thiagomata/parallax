import { describe, expect, it } from 'vitest';
import p5 from "p5";
import {ASSET_STATUS, ELEMENT_TYPES} from "../../../scene/types.ts";
import {createMockP5} from "../../../scene/mock/mock_p5.mock.ts";
import {depth_map_explanation, tutorial_depth_map} from './tutorial_depth_map.ts';
import {appAssetPath} from "../../../utils/app_paths.ts";

describe('Tutorial: Depth Map Panels', () => {
    it('should export explanation text', () => {
        expect(depth_map_explanation).toBeDefined();
        expect(typeof depth_map_explanation).toBe('string');
        expect(depth_map_explanation).toContain('depthMap');
        expect(depth_map_explanation).toContain('segments');
        expect(depth_map_explanation).toContain('strength');
    });

    it('should export tutorial function', () => {
        expect(tutorial_depth_map).toBeDefined();
        expect(typeof tutorial_depth_map).toBe('function');
    });

    it('registers a skull depth map panel', async () => {
        const mockP5 = createMockP5();
        const world = await tutorial_depth_map(mockP5 as unknown as p5, {
            width: 500,
            height: 400,
            paused: true,
        });

        const panel = world.getElement('skull-depth-panel') as any;
        expect(panel).toBeDefined();
        expect(panel.dynamic.type).toBe(ELEMENT_TYPES.PANEL);
        expect(panel.dynamic.texture.path).toBe(appAssetPath("img/depth/skull.jpg"));
        expect(panel.dynamic.depthMap.path).toBe(appAssetPath("img/depth/skull-depth.png"));
        expect(panel.dynamic.depthMap.segments).toBe(44);
        expect(panel.dynamic.depthMap.strength).toBe(150);
        expect(panel.assets.depthMap.status).toBe(ASSET_STATUS.READY);
    });

    it('loads the depth map asset during setup', async () => {
        const mockP5 = createMockP5();
        const world = await tutorial_depth_map(mockP5 as unknown as p5, {
            width: 500,
            height: 400,
            paused: true,
        });

        await mockP5.setup();

        const panel = world.getElement('skull-depth-panel') as any;
        expect(mockP5.loadImage).toHaveBeenCalledTimes(2);
        expect(mockP5.loadImage).toHaveBeenCalledWith(
            appAssetPath("img/depth/skull.jpg"),
            expect.any(Function),
            expect.any(Function)
        );
        expect(mockP5.loadImage).toHaveBeenCalledWith(
            appAssetPath("img/depth/skull-depth.png"),
            expect.any(Function),
            expect.any(Function)
        );
        expect(panel.assets.depthMap.status).toBe(ASSET_STATUS.READY);
    });
});
