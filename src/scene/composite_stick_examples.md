# CompositeStick Usage Examples

This document demonstrates how to use the new `CompositeStick` modifier for combining multiple rotation sources in the Parallax engine.

## Basic Usage

```typescript
import { CompositeStick } from './composite_stick.ts';
import { HeadTrackingModifier } from './modifiers/head_tracking_modifier.ts';
import { DEFAULT_ROTATION_LIMITS } from './types.ts';

// Gamepad + Head Tracking (80/20 split)
const hybridStick = new CompositeStick(50, [
    gamepadStickModifier,           // Primary input
    headTrackingModifier            // Enhancement
], {
    strategy: 'weighted_average',
    weights: [0.8, 0.2],
    limits: DEFAULT_ROTATION_LIMITS
});

sceneManager.addStickModifier(hybridStick);
```

## Use Case Patterns

### 1. Fallback Pattern (using existing ChainedStick)
```typescript
// Head tracking if available, fallback to gamepad
const fallbackStick = new ChainedStick(50, [
    headTrackingModifier,           // Preferred
    gamepadStickModifier           // Fallback
]);
```

### 2. Enhancement Pattern
```typescript
// Predefined animation + head tracking enrichment
const cinematicStick = new CompositeStick(50, [
    cameraAnimationStick,           // Predefined movement
    headTrackingModifier            // Adds viewer immersion
], {
    strategy: 'weighted_average',
    weights: [0.9, 0.1],         // Animation dominates
    limits: DEFAULT_ROTATION_LIMITS
});
```

### 3. Additive Pattern
```typescript
// Multiple active sources combined
const additiveStick = new CompositeStick(50, [
    mouseStickModifier,            // Primary mouse control
    headTrackingModifier,          // Head movement
    vibrationModifier              // Environmental effects
], {
    strategy: 'sum',              // Add all movements
    limits: {
        yaw: { min: -Math.PI/3, max: Math.PI/3 },     // More restrictive
        pitch: { min: -Math.PI/6, max: Math.PI/6 },
        roll: { min: -Math.PI/12, max: Math.PI/12 }     // Very restrictive roll
    }
});
```

### 4. Safety-First Pattern
```typescript
// Conservative distance handling for VR
const safeStick = new CompositeStick(50, [
    headTrackingModifier,
    backupStickModifier
], {
    strategy: 'weighted_average',
    distanceStrategy: 'min',      // Use most conservative distance
    limits: DEFAULT_ROTATION_LIMITS
});
```

## Configuration Options

### Strategy Types
- `'sum'`: Simple addition of all rotations
- `'weighted_average'`: Weighted average based on weights array

### Distance Strategies
- `'average'`: Weighted average of distances (default)
- `'min'`: Minimum distance (safest)
- `'max'`: Maximum distance (most dramatic)

### Rotation Limits
Apply per-axis limits to prevent extreme rotations:
```typescript
const customLimits = {
    yaw: { min: -Math.PI/2, max: Math.PI/2 },      // ±90°
    pitch: { min: -Math.PI/3, max: Math.PI/3 },     // ±60°
    roll: { min: -Math.PI/6, max: Math.PI/6 }       // ±30°
};
```

## Real-World Examples

### Racing Game
```typescript
// Gamepad controls dominate, head adds subtle look-around
const racingStick = new CompositeStick(50, [
    gamepadStickModifier,           // Steering and look
    headTrackingModifier            // Natural head movement
], {
    strategy: 'weighted_average',
    weights: [0.85, 0.15],
    limits: {
        yaw: { min: -Math.PI/4, max: Math.PI/4 },      // Limited yaw for racing
        pitch: { min: -Math.PI/6, max: Math.PI/6 },     // Limited pitch
        roll: { min: -Math.PI/12, max: Math.PI/12 }      // Very limited roll
    },
    distanceStrategy: 'average'
});
```

### VR Experience
```typescript
// Head tracking primary, with environmental effects
const vrStick = new CompositeStick(50, [
    headTrackingModifier,           // Primary VR input
    environmentalStickModifier     // Ship vibration, wind effects
], {
    strategy: 'weighted_average',
    weights: [0.9, 0.1],
    limits: DEFAULT_ROTATION_LIMITS,
    distanceStrategy: 'min'        // Safety first in VR
});
```

### Cinematic Scene
```typescript
// Predefined camera path + optional viewer head movement
const cinematicStick = new CompositeStick(50, [
    cameraPathModifier,            // Director-controlled movement
    headTrackingModifier            // Viewer immersion
], {
    strategy: 'weighted_average',
    weights: [0.95, 0.05],        // Subtle head enhancement
    limits: {
        yaw: { min: -Math.PI/8, max: Math.PI/8 },      // Very subtle for cinematic
        pitch: { min: -Math.PI/12, max: Math.PI/12 },
        roll: { min: -Math.PI/24, max: Math.PI/24 }
    }
});
```

## Integration with SceneManager

```typescript
// Add your composite stick to the scene manager
sceneManager.addStickModifier(hybridStick);

// The composite stick will be processed along with other modifiers
// using the existing priority system. The composite's priority
// determines when it's evaluated relative to other sticks.

// Example modifier priority hierarchy:
// 100: Emergency overrides (cutscenes)
//  50: Player control (CompositeStick)
//  10: AI assistance
//   1: Default fallback
```

## Confidence-Based Weighting (Future)

The HeadTrackingModifier now includes confidence values that can be used for future dynamic weighting:

```typescript
// Future enhancement: confidence-based weighting
const adaptiveStick = new CompositeStick(50, [
    gamepadStickModifier,
    headTrackingModifier
], {
    strategy: 'weighted_average',
    // TODO: Add dynamic weight adjustment based on confidence
    weights: [0.7, 0.3]
});
```

## Benefits

1. **Flexible Combinations**: Mix any rotation sources as needed
2. **Per-Use-Case Configuration**: Different settings for different scenarios
3. **Safety Controls**: Built-in rotation limits and distance strategies
4. **Backward Compatibility**: Works with existing StickModifier interface
5. **Graceful Degradation**: Handles source failures elegantly