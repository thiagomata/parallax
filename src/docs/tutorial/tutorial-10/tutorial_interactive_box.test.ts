import { describe, expect, it } from 'vitest';
import {getDirection, getDirectionColor, tutorial_interactive_box, tutorial_interactive_box_explanation} from './tutorial_interactive_box.ts';
import {createMockP5} from "../../../scene/mock/mock_p5.mock.ts";
import p5 from "p5";
import {COLORS} from "../../../scene/colors.ts";

describe('Tutorial: Interactive Box Control', () => {
    it('should export explanation text', () => {
        expect(tutorial_interactive_box_explanation).toBeDefined();
        expect(typeof tutorial_interactive_box_explanation).toBe('string');
        expect(tutorial_interactive_box_explanation.length).toBeGreaterThan(0);
    });

    it('should mention ExternalStore in explanation', () => {
        expect(tutorial_interactive_box_explanation).toContain('ExternalStore');
    });

    it('should mention color mapping in explanation', () => {
        expect(tutorial_interactive_box_explanation).toContain('Yellow');
        expect(tutorial_interactive_box_explanation).toContain('Pink');
        expect(tutorial_interactive_box_explanation).toContain('Orange');
        expect(tutorial_interactive_box_explanation).toContain('Lime');
    });

    it('should mention key terms', () => {
        expect(tutorial_interactive_box_explanation).toContain('previousStore');
        expect(tutorial_interactive_box_explanation).toContain('nextStore');
        expect(tutorial_interactive_box_explanation).toContain('ctx.element');
    });

    it('should export tutorial function', () => {
        expect(tutorial_interactive_box).toBeDefined();
        expect(typeof tutorial_interactive_box).toBe('function');
    });

    it('should declare a texture set with preloadable variants', async () => {
        const mockP5 = createMockP5();
        const world = await tutorial_interactive_box(mockP5 as unknown as p5, { width: 500, height: 400, paused: true });

        const arrow = world.getElement('arrow') as any;
        expect(arrow).toBeDefined();
        expect(arrow.dynamic.texture.kind).toBe('texture-set');
        expect(Object.keys(arrow.dynamic.texture.variants)).toEqual(['target', 'arrow']);
        expect(arrow.dynamic.texture.default).toBe('target');
    });

    it('should tint and rotate the arrow indicator by direction', () => {
        const idleContext = {
            previousStore: { global: {} },
            nextStore: { global: {} },
            element: {},
        } as any;

        expect(getDirection(idleContext)).toBe('idle');
        expect(getDirectionColor('idle')).toStrictEqual(COLORS.white);

        const upContext = {
            previousStore: { global: { keys: { ArrowUp: true } } },
            nextStore: { global: {} },
            element: {},
        } as any;

        expect(getDirection(upContext)).toBe('up');
        expect(getDirectionColor('up')).toStrictEqual(COLORS.yellow);
    });

    it('should respond to external store changes across frames', async () => {
        const mockP5 = createMockP5();
        mockP5.millis.mockReturnValue(0);

        const world = await tutorial_interactive_box(mockP5 as unknown as p5, {
            width: 500,
            height: 400,
            paused: false,
        });

        await mockP5.setup();

        const store = world.getExternalStore() as any;
        store.global = store.global ?? {};
        store.global.keys = { ArrowRight: true };

        await mockP5.draw();
        await new Promise((resolve) => setTimeout(resolve, 10));
        await mockP5.draw();
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(
            mockP5.fill.mock.calls.some((call: any[]) => {
                const [red, green, blue] = call;
                return red === COLORS.orange.red && green === COLORS.orange.green && blue === COLORS.orange.blue;
            })
        ).toBe(true);
        expect(mockP5.texture).toHaveBeenCalled();
        expect(
            mockP5.rotateZ.mock.calls.some((call: any[]) => {
                const [angle] = call;
                return Math.abs(angle - Math.PI / 2) < 1e-6;
            })
        ).toBe(true);

        store.global.keys = {};
        mockP5.fill.mockClear();
        mockP5.texture.mockClear();
        mockP5.rotateZ.mockClear();

        await mockP5.draw();
        await new Promise((resolve) => setTimeout(resolve, 10));
        await mockP5.draw();
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(
            mockP5.fill.mock.calls.some((call: any[]) => {
                const [red, green, blue] = call;
                return red === 255 && green === 255 && blue === 255;
            })
        ).toBe(true);
        expect(mockP5.texture).toHaveBeenCalled();
        expect(
            mockP5.rotateZ.mock.calls.some((call: any[]) => {
                const [angle] = call;
                return Math.abs(angle - 0) < 1e-6;
            })
        ).toBe(true);
    });
});
