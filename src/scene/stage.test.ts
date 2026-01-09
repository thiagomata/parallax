import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Stage} from './stage';
import {ASSET_STATUS, type AssetLoader, type GraphicProcessor, type RenderableElement} from './types';
import {createMockState} from "./mock/mock_scene_state.mock.ts";

describe('Stage', () => {
    let stage: Stage;
    let mockLoader: AssetLoader;
    let mockGP: GraphicProcessor<unknown, unknown>;
    const mockState = createMockState();

    beforeEach(() => {
        stage = new Stage();

        // Mocking the AssetLoader
        mockLoader = {
            hydrateTexture: vi.fn(),
            hydrateFont: vi.fn(),
        };

        // Mocking GraphicProcessor
        mockGP = {
            push: vi.fn(),
            pop: vi.fn(),
            // ... rest of interface
        } as unknown as GraphicProcessor;
    });

    it('should add elements to the registry', () => {
        const el = {id: 'test-1', props: {}, assets: {}, render: vi.fn()} as unknown as RenderableElement;
        stage.add(el);

        // Accessing private registry for the sake of the test coverage check
        expect((stage as any).registry.get('test-1')).toBe(el);
    });

    describe('hydrateAll', () => {
        it('should hydrate texture if it exists in props and is missing in assets', async () => {
            const textureRef = {path: 'tex.png', width: 10, height: 10};
            const el = {
                id: 'el-1',
                props: {texture: textureRef},
                assets: {} // missing texture asset
            } as unknown as RenderableElement;

            const mockAsset = {status: ASSET_STATUS.READY, value: {texture: textureRef, internalRef: {}}};
            vi.mocked(mockLoader.hydrateTexture).mockResolvedValue(mockAsset as any);

            stage.add(el);
            await stage.hydrateAll(mockLoader);

            expect(mockLoader.hydrateTexture).toHaveBeenCalledWith(textureRef);
            expect(el.assets.texture).toBe(mockAsset);
        });

        it('should hydrate font if it exists in props and is missing in assets', async () => {
            // Note: I spotted a logic check in your Font hydration:
            // current: if (el.props.font && el.assets.font)
            // should likely be: if (el.props.font && !el.assets.font)
            const fontRef = {name: 'Arial', path: 'arial.ttf'};
            const el = {
                id: 'el-font',
                props: {font: fontRef},
                assets: {}
            } as unknown as RenderableElement;

            const mockFontAsset = {status: ASSET_STATUS.READY, value: {font: fontRef, internalRef: {}}};
            vi.mocked(mockLoader.hydrateFont).mockResolvedValue(mockFontAsset as any);

            stage.add(el);
            await stage.hydrateAll(mockLoader);

            // If your logic uses '&& el.assets.font', this expectation will fail (coverage gap!)
            // If you fix it to '!el.assets.font', it will pass.
            expect(mockLoader.hydrateFont).toHaveBeenCalledWith(fontRef);
        });

        it('should skip hydration if asset is already present', async () => {
            const el = {
                id: 'ready-el',
                props: {texture: {path: 'already.png'}},
                assets: {texture: {status: ASSET_STATUS.READY}}
            } as unknown as RenderableElement;

            stage.add(el);
            await stage.hydrateAll(mockLoader);

            expect(mockLoader.hydrateTexture).not.toHaveBeenCalled();
        });
    });

    it('should trigger render on all elements in storage', () => {
        const el1 = {id: '1', render: vi.fn(), props: {}, assets: {}} as unknown as RenderableElement;
        const el2 = {id: '2', render: vi.fn(), props: {}, assets: {}} as unknown as RenderableElement;

        stage.add(el1);
        stage.add(el2);

        stage.render(mockGP, mockState);

        expect(el1.render).toHaveBeenCalledWith(mockGP, mockState);
        expect(el2.render).toHaveBeenCalledWith(mockGP, mockState);
    });
});