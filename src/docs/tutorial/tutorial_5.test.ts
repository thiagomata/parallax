import {describe, expect, it} from 'vitest';
import {tutorial_5} from './tutorial_5';
import {createMockP5} from "../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {ASSET_STATUS, type ResolvedBox, type ResolvedText} from "../../scene/types.ts";
import {SceneResolver} from "../../scene/resolver.ts";

describe('Tutorial 5 Execution Test: Assets & Hydration', () => {

    it('should correctly initialize the world and hydrate assets when executed', async () => {
        // 1. Setup Mock p5 with immediate callback triggers
        const mockP5 = createMockP5();
        // 2. Execute the tutorial
        const world = tutorial_5(mockP5 as unknown as p5);

        // 3. TRIGGER setup (Awaiting the loader.waitForAllAssets() inside)
        await mockP5.setup();

        // 4. Verify Registration & Hydration
        const boxElement = world.getElement('textured-box');
        const textElement = world.getElement('title');

        expect(boxElement?.assets.texture?.status).toBe(ASSET_STATUS.READY);
        expect(textElement?.assets.font?.status).toBe(ASSET_STATUS.READY);

        // --- TEST POINT: Progress 0.25 (1250ms / 5000ms) ---
        mockP5.millis.mockReturnValue(1250);
        mockP5.draw(); // Frame Loop

        const state = world.getCurrentSceneState();
        const resolver = new SceneResolver({});
        const resolvedBox = resolver.resolve(boxElement!, state) as { resolved: ResolvedBox };

        // Math: progress(0.25) * PI * 2 = PI / 2
        expect(resolvedBox.resolved.rotate?.y).toBeCloseTo(Math.PI * 0.5, 5);

        // 5. Verify Execution - (P5 Side Effects)
        // Texture should be applied before the box is drawn
        expect(mockP5.texture).toHaveBeenCalled();
        expect(mockP5.box).toHaveBeenCalledWith(150, 150, 150);

        // Font should be set before text is drawn
        const resolvedText = resolver.resolve(textElement!, state) as { resolved: ResolvedText };
        expect(resolvedText.resolved.text).toBe("TEXTURES");
        expect(mockP5.textFont).toHaveBeenCalled();
        expect(mockP5.text).toHaveBeenCalledWith("TEXTURES", 0, 0);
    });

    it('should verify the full bridge pipeline (Assets -> Processor -> P5)', async () => {
        const mockP5 = createMockP5();

        // 2. Initialize Tutorial
        tutorial_5(mockP5 as unknown as p5);

        // 3. Complete Registration & Hydration
        await mockP5.setup();

        // 4. Trigger The Frame Loop
        mockP5.draw();

        // --- ASSERTIONS ---

        // Check Box Rendering
        expect(mockP5.box).toHaveBeenCalledWith(150, 150, 150);
        expect(mockP5.texture).toHaveBeenCalled(); // Proves the image made it to the box

        // Check Text Rendering
        expect(mockP5.text).toHaveBeenCalledWith("TEXTURES", 0, 0);
        expect(mockP5.textFont).toHaveBeenCalled(); // Proves the font made it to the text

        // Check State Cleanup (Bridge Guardrails)
        // We expect at least 2 pushes/pops (one for the box, one for the text)
        expect(mockP5.push).toHaveBeenCalled();
        expect(mockP5.pop).toHaveBeenCalled();
    });
});