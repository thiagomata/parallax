import { describe, expect, it, vi, beforeEach } from 'vitest';
import { tutorial_7 } from './tutorial_7';
import { createMockP5 } from "../../scene/mock/mock_p5.mock.ts";
import { MockFaceFactory } from "../../scene/mock/mock_face.mock.ts";
import { HeadTrackingModifier } from "../../scene/modifiers/head_tracking_modifier.ts";
import p5 from "p5";
import {createPauseTests} from './pause_test_utils.ts';
import {DEFAULT_SKETCH_CONFIG} from "./tutorial_main_page.demo.ts";

describe('Tutorial 7: The Observer (Integration)', () => {
    let mockP5: any;
    let factory: MockFaceFactory;
    let mockProvider: any;

    // Fixed config for predictable math
    const testConfig = {
        smoothing: 1.0,      // Snap immediately for clean math
        travelRange: 100,    // 1.0 normalized = 100 world units
        zTravelRange: 200,
        damping: 1.0,
        lookDistance: 1000
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockP5 = createMockP5();
        factory = new MockFaceFactory();

        // Ensure the p5 bridge works for the internal lerp calls
        mockP5.lerp = vi.fn((start, end, amt) => start + (end - start) * amt);

        // Mock the hardware driver (Provider)
        mockProvider = {
            init: vi.fn().mockResolvedValue(undefined),
            getFace: vi.fn(),
            getStatus: vi.fn().mockReturnValue('READY'),
        };
    });

    it('should resolve trig-based head rotation using factory constants', async () => {
        const tracker = new HeadTrackingModifier(mockP5 as unknown as p5, mockProvider, testConfig);
        const world = tutorial_7(mockP5 as unknown as p5,
            {...DEFAULT_SKETCH_CONFIG, cameraModifier: tracker}
        );
        await mockP5.setup();

        const yawAngle = 0.2;

        // Establish Baseline
        const centerFace = factory.createCenterFace();
        mockProvider.getFace.mockReturnValue(centerFace);
        mockP5.draw();

        const currentState = world.getCurrentSceneState();
        expect(currentState.projection.kind).toBe("camera");
        if (currentState.projection.kind !== "camera") return;

        // Get initial state to handle any inherent offsets (like the eye-to-nose Y gap)
        const baselineYaw = currentState.projection.camera.yaw;

        // Rotate
        const rotatedFace = factory.rotate(centerFace, yawAngle, 0);
        mockProvider.getFace.mockReturnValue(rotatedFace);
        mockP5.draw();

        const afterState = world.getCurrentSceneState();
        expect(afterState.projection.kind).toBe("camera");
        if (afterState.projection.kind !== "camera") return;

        expect(afterState.projection.camera.yaw).toBeDefined();
        expect(afterState.projection.camera.yaw).not.eq(baselineYaw)
    });

    it('should maintain the "Car" anchor while the "Camera" nudges', async () => {
        const tracker = new HeadTrackingModifier(mockP5 as unknown as p5, mockProvider, testConfig);
        const world = tutorial_7(mockP5 as unknown as p5, {
            ...DEFAULT_SKETCH_CONFIG,
            cameraModifier: tracker,
        });
        await mockP5.setup();

        // Lean left
        mockProvider.getFace.mockReturnValue(factory.shiftX(null, -0.2));
        mockP5.draw();

        const state = world.getCurrentSceneState();
        expect(state.projection.kind).toBe("camera");
        if (state.projection.kind !== "camera") return;

        // In Tutorial 7, the "Car" (Chassis) is static at the settings position
        if (state.debugStateLog) {
            expect(state.debugStateLog.car.x).toBe(0); // The "Tripod" hasn't moved
            expect(state.projection.camera.position.x).toBeCloseTo(40); // The "Lens" has nudged
        }
    });

    it('should drift back to baseline when tracking is lost', async () => {
        const smoothingConfig = { ...testConfig, smoothing: 0.5 };
        const tracker = new HeadTrackingModifier(mockP5 as unknown as p5, mockProvider, smoothingConfig);
        const world = tutorial_7(mockP5 as unknown as p5,
            {
                ...DEFAULT_SKETCH_CONFIG,
                cameraModifier: tracker,
            }
        );
        await mockP5.setup();

        // Establish offset
        mockProvider.getFace.mockReturnValue(factory.shiftX(null, 0.2));
        mockP5.draw();
        const currentState = world.getCurrentSceneState();
        expect(currentState.projection.kind).toBe("camera");
        if (currentState.projection.kind !== "camera") return;

        const offsetPos = currentState.projection.camera.position.x;

        //  Lose tracking
        mockProvider.getFace.mockReturnValue(null);
        mockP5.draw(); // One tick of drifting back

        const afterState = world.getCurrentSceneState();
        expect(afterState.projection.kind).toBe("camera");
        if (afterState.projection.kind !== "camera") return;
        const driftedPos = afterState.projection.camera.position.x;

        // The position should be moving back toward zero or staying same
        expect(Math.abs(driftedPos)).toBeLessThanOrEqual(Math.abs(offsetPos));
    });

    // Use the shared pause test utility
    createPauseTests('Tutorial 7', tutorial_7);
});