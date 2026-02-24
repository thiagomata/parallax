import {describe, expect, it, vi} from "vitest";
import {ChainedStick} from "./chained_stick";
import {createResolution, type StickModifier} from "./types";
import {createMockState} from "./mock/mock_scene_state.mock.ts";

describe("ChainedStick Decorator", () => {
    const mockStick = (id: string, val: number, priority: number = 10): StickModifier => ({
        name: `${id}`,
        active: true,
        priority: priority,
        tick: () => {},
        getStick: () => ({
            value: {
                yaw: val,
                pitch: val,
                roll: val,
                distance: 100,
                priority: priority
            },
            success: true,
        }),
    });

    const mockState = createMockState(
        {x: 0, y: 0, z: 0},
        {x: 0, y: 0, z: 100},
    );

    it("should return the first successful result and ignore the rest", () => {
        const primary = mockStick("primary", 1);
        const secondary = mockStick("secondary", 2);
        const chain = new ChainedStick(50, [primary, secondary]);

        const res = chain.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

        // Should be 1, because primary succeeded
        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.value?.yaw).toBe(1);
        }
    });

    it("should skip a failing primary and return the secondary", () => {
        const primary: StickModifier = {
            name: "primary",
            active: true,
            priority: 10,
            tick: () => {},
            getStick: () => ({success: false, error: "Hardware Disconnected"}),
        };
        const secondary = mockStick("secondary", 2);
        const chain = new ChainedStick(50, [primary, secondary]);

        const res = chain.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

        // Should be 2, because primary had an error
        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.value?.yaw).toBe(2);
        }
    });

    it("should skip an inactive modifier even if it would have succeeded", () => {
        const primary = mockStick("primary", 1);
        primary.active = false; // Turned off

        const secondary = mockStick("secondary", 2);
        const chain = new ChainedStick(50, [primary, secondary]);

        const res = chain.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.value?.yaw).toBe(2);
        }
    });

    it("should return an error if the entire chain fails", () => {
        const primary: StickModifier = {
            name: "primary",
            active: true,
            priority: 1,
            tick: () => {},
            getStick: () => ({success: false, error: "Fail 1"}),
        };
        const secondary: StickModifier = {
            name: "secondary",
            active: true,
            priority: 1,
            tick: () => {},
            getStick: () => ({success: false, error: "Fail 2"}),
        };

        const chain = new ChainedStick(50, [primary, secondary]);
        const res = chain.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

        expect(res.success).toBe(false);
        if (!res.success) {
            expect(res.error).toBe("Entire stick chain failed on ChainedStick of (primary,secondary)");
        }
    });

    it("should overwrite internal priorities with the wrapper priority", () => {
        const internalPriority = 5;
        const wrapperPriority = 99;

        const internal = mockStick("internal", 1, internalPriority);

        const chain = new ChainedStick(wrapperPriority, [internal]);
        const res = chain.getStick({x: 0, y: 0, z: 0}, createResolution(mockState));

        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.value?.priority).toBe(99);
        }
    });

    describe("tick", () => {
        it("should call tick on all modifiers in the chain", () => {
            const tickMock1 = vi.fn();
            const tickMock2 = vi.fn();
            const tickMock3 = vi.fn();

            const modifier1: StickModifier = {
                name: "modifier1",
                active: true,
                priority: 10,
                tick: tickMock1,
                getStick: () => ({success: false, error: "Fail 1"}),
            };

            const modifier2: StickModifier = {
                name: "modifier2", 
                active: true,
                priority: 10,
                tick: tickMock2,
                getStick: () => ({success: false, error: "Fail 2"}),
            };

            const modifier3: StickModifier = {
                name: "modifier3",
                active: true,
                priority: 10,
                tick: tickMock3,
                getStick: () => ({success: false, error: "Fail 3"}),
            };

            const chain = new ChainedStick(50, [modifier1, modifier2, modifier3]);

            // Call tick with a sceneId
            chain.tick(123);

            // Verify all tick methods were called with the correct sceneId
            expect(tickMock1).toHaveBeenCalledWith(123);
            expect(tickMock2).toHaveBeenCalledWith(123);
            expect(tickMock3).toHaveBeenCalledWith(123);
        });

        it("should call tick even on inactive modifiers", () => {
            const tickMock1 = vi.fn();
            const tickMock2 = vi.fn();

            const modifier1: StickModifier = {
                name: "modifier1",
                active: false, // Inactive
                priority: 10,
                tick: tickMock1,
                getStick: () => ({success: false, error: "Fail 1"}),
            };

            const modifier2: StickModifier = {
                name: "modifier2",
                active: true, // Active
                priority: 10,
                tick: tickMock2,
                getStick: () => ({success: false, error: "Fail 2"}),
            };

            const chain = new ChainedStick(50, [modifier1, modifier2]);

            chain.tick(456);

            // Both should still be ticked even though modifier1 is inactive
            expect(tickMock1).toHaveBeenCalledWith(456);
            expect(tickMock2).toHaveBeenCalledWith(456);
        });
    });
});
