import {expect, it} from 'vitest';
import {FallbackNudge} from './fallback_nudge';
import {createResolution, type NudgeModifier, type Vector3} from './types';
import {createMockState} from "./mock/mock_scene_state.mock.ts";

const mockNudge = (val: Partial<Vector3>, shouldError = false): NudgeModifier => ({
    name: `MockNudge_${JSON.stringify(val)}`,
    active: true,
    tick: () => {},
    getNudge: () => shouldError ?
        {success: false, error: 'Error'} :
        {success: true, value: val},
});

it('should fallback to secondary nudge only when primary fails', () => {
    const primary = mockNudge({x: 100});
    const secondary = mockNudge({x: 20});
    const chain = new FallbackNudge(primary, secondary);
    const mockState = createMockState();

    expect(chain.name).toBe("try_MockNudge_{\"x\":100}_else_MockNudge_{\"x\":20}");

    // Test 1: Primary active
    const actual = chain.getNudge({x: 0, y: 0, z: 0}, createResolution(mockState));
    expect(actual.success).toBe(true);
    if (actual.success) {
        expect(actual.value?.x).toBe(100);
    }

    // Test 2: Primary error
    primary.getNudge = () => ({success: false, error: 'Fail'});
    const primaryErrorResponse = chain.getNudge({x: 0, y: 0, z: 0}, createResolution(mockState));
    expect(primaryErrorResponse.success).toBe(true);
    if (primaryErrorResponse.success) {
        expect(primaryErrorResponse.value?.x).toBe(20);
    }
});

it('should consider active state correctly', () => {
    const primary = mockNudge({x: 100});
    const secondary = mockNudge({x: 20});
    const chain = new FallbackNudge(primary, secondary);
    expect(chain.active).toBe(true);

    primary.active = false;
    expect(chain.active).toBe(true);

    secondary.active = false;
    expect(chain.active).toBe(false);
});

it('should return error if both modifiers fail or inactive', () => {
    const primary = mockNudge({x: 100}, true); // Will error
    const secondary = mockNudge({x: 20}, true); // Will error
    const chain = new FallbackNudge(primary, secondary);
    const mockState = createMockState();

    const res = chain.getNudge({x: 0, y: 0, z: 0}, createResolution(mockState));
    expect(res.success).toBe(false);
    if (!res.success) {
        expect(res.error).toBe("Both modifiers in chain failed or inactive");
    }
});