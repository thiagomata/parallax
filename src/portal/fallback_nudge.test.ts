import { it, expect } from 'vitest';
import { FallbackNudge } from './fallback_nudge';
import type { Vector3, NudgeModifier } from './types';

const mockNudge = (val: Partial<Vector3>, shouldError = false): NudgeModifier => ({
    active: true,
    getNudge: () => shouldError ? { value: null, error: 'Error' } : { value: val, error: null },
});

it('should fallback to secondary nudge only when primary fails', () => {
  const primary = mockNudge({ x: 100 });
  const secondary = mockNudge({ x: 20 });
  const chain = new FallbackNudge(primary, secondary);

  // Test 1: Primary active
  expect(chain.getNudge({x:0,y:0,z:0}).value?.x).toBe(100);

  // Test 2: Primary error
  primary.getNudge = () => ({ value: null, error: 'Fail' });
  expect(chain.getNudge({x:0,y:0,z:0}).value?.x).toBe(20);
});

it('should consider active state correctly', () => {
    const primary = mockNudge({ x: 100 });
    const secondary = mockNudge({ x: 20 });
    const chain = new FallbackNudge(primary, secondary);
    expect(chain.active).toBe(true);

    primary.active = false;
    expect(chain.active).toBe(true);

    secondary.active = false;
    expect(chain.active).toBe(false);
});

it('should return error if both modifiers fail or inactive', () => {
    const primary = mockNudge({ x: 100 }, true); // Will error
    const secondary = mockNudge({ x: 20 }, true); // Will error
    const chain = new FallbackNudge(primary, secondary);

    const res = chain.getNudge({x:0,y:0,z:0});
    expect(res.value).toBeNull();
    expect(res.error).toBe("Both modifiers in chain failed or inactive");
});