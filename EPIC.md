# EPIC: Head-Tracked Off-Axis Projection / Hybrid Nudge System

This EPIC implements a hybrid nudge system that supports both world effects (camera shake, engine vibration) and head tracking (VR/AR pop-out) simultaneously.

## Ticket 1 — ScreenModifier Class

Description: Create a ScreenModifier class to represent the physical screen plane and compute off-axis projection matrices from an eye position.

Acceptance Criteria:

Takes width, height, z-position, near/far planes as configuration.

Returns a ProjectionMatrix with named components (xscale, yscale, depth, wComponent).

Unit test verifies matrix changes based on different eye positions.

## Ticket 2 — Integrate ScreenModifier into SceneManager

Description: Add ScreenModifier as a first-class modifier in SceneManager.

Acceptance Criteria:

SceneManager holds a reference to ScreenModifier.

SceneManager.calculateScene computes eye position as CarModifier + NudgeModifier.

Off-axis projection is built via ScreenModifier.buildFrustum(eyePos).

## Ticket 3 — Hybrid Nudge System (World + Head Tracking)

Description: Implement dual-category nudge system where world nudges affect camera position and head nudges affect eye position.

Acceptance Criteria:

World nudges ('world' category) affect camera position for effects like car shake, engine vibration, ground bumps.

Head nudges ('head' category or undefined) affect eye position for VR/AR head tracking.

Camera position = CarModifier + world nudges.

Eye position = camera position + head nudges.

Unit tests confirm world nudges move camera while head nudges move frustum independently.

## Ticket 4 — Replace p5 Perspective with Off-Axis Projection ✅

Description: Override p5 perspective() calls with the off-axis projection matrix from ScreenModifier.

Acceptance Criteria:

✅ p5 rendering uses off-axis projection instead of symmetric perspective.

✅ Objects in front of screen plane appear correctly outside the screen.

✅ Verify that standard world movement (CarModifier) still works.

**Implementation Details:**
- Added `setProjectionMatrix` method to P5GraphicProcessor that extracts frustum parameters from projection matrix
- Updated GraphicProcessor interface with optional `setProjectionMatrix` method
- Modified World.step() to apply projection matrix when available
- Uses p5's built-in `frustum()` method for custom projection
- All existing tests pass, confirming system integrity

## Ticket 5 — Combine Stick Rotation ✅

Description: Ensure StickModifier (yaw/pitch/roll) still applies to the view matrix after head-tracked eye offsets.

Acceptance Criteria:

✅ Rotation is applied to camera view matrix, not to the projection matrix.

✅ Moving the head does not affect rotation logic.

✅ Unit test confirms head tracking and rotation combine additively.

**Implementation Details:**
- Created `CompositeStick` class for additive combination of multiple StickModifier sources
- Added rotation limits to scene settings with conservative defaults (±90° yaw, ±60° pitch, ±30° roll)
- Enhanced StickResult interface to include optional confidence for future weighting support
- Updated HeadTrackingModifier to provide confidence metrics based on tracking status
- Supports multiple combination strategies: 'sum' and 'weighted_average'
- Configurable distance strategies: 'average', 'min', 'max'
- Comprehensive test suite with real-world examples (gamepad + head tracking, animation + enrichment)
- Backward compatible with existing StickModifier interface and ChainedStick fallback patterns
- Documentation and usage examples provided for different use case scenarios

**Use Cases Supported:**
- Fallback: Head tracking if available, fallback to traditional input (existing ChainedStick)
- Enhancement: Traditional input + head tracking enrichment (new CompositeStick)
- Additive: Multiple rotation sources combined simultaneously
- Safety-first: Conservative distance and rotation limits for VR applications

## Ticket 6 — Debug & Visualization

Description: Add debugging visuals to confirm the screen plane, eye position, and frustum.

Acceptance Criteria:

Visualize screen plane as a rectangle in 3D space.

Show eye position and frustum edges.

Enable/disable via SceneManager.debug = true.

## Ticket 7 — Integration Test

Description: Full integration test with CarModifier + World NudgeModifiers + Head NudgeModifiers + StickModifier + ScreenModifier.

Acceptance Criteria:

Head movement produces correct pop-out effect.

World nudges (car shake, vibration) move camera and world independently.

Combined system allows both effects to work simultaneously.

Stick rotation rotates camera without breaking frustum.

## Ticket 8 — Documentation

Description: Document how ScreenModifier interacts with World/Head Nudge/Car/Stick modifiers.

Acceptance Criteria:

Explain hybrid nudge system (world vs head categories).

Explain additive eye offset concept.

Include example code snippet for p5 integration with both world and head nudges.

Note limitations (UI overlays, p5 quirks).

# Plan Draft

## 1. Introduce a ScreenModifier

Its job is simple:

Keep the screen plane fixed in world space

Take an eye position (from the camera + head tracking)

Compute an off-axis projection matrix for rendering

Expose the projection matrix to your renderer

It does not move the camera or the world, just changes how the scene is projected.

```ts
export interface ScreenConfig {
    width: number;    // physical width of screen
    height: number;   // physical height of screen
    z: number;        // z position of screen in world units
    near: number;     
    far: number;
}

export class ScreenModifier {
    config: ScreenConfig;

    constructor(config: ScreenConfig) {
        this.config = config;
    }

    /**
     * Compute off-axis frustum based on eye position (camera + head tracking)
     */
    buildFrustum(eyePos: Vector3): Float32Array {
        const { width, height, z, near, far } = this.config;
        const ex = eyePos.x;
        const ey = eyePos.y;
        const ez = eyePos.z;

        // Frustum edges at near plane
        const left   = (-width/2 - ex) * near / (z - ez);
        const right  = ( width/2 - ex) * near / (z - ez);
        const bottom = (-height/2 - ey) * near / (z - ez);
        const top    = ( height/2 - ey) * near / (z - ez);

        // Off-axis projection matrix
        const proj = new Float32Array([
            2*near/(right-left), 0, (right+left)/(right-left), 0,
            0, 2*near/(top-bottom), (top+bottom)/(top-bottom), 0,
            0, 0, -(far+near)/(far-near), -2*far*near/(far-near),
            0, 0, -1, 0
        ]);

        return proj;
    }
}
```
}

## 1.5. Hybrid Nudge System Interface

Support dual-category nudge modifiers:

```ts
export interface NudgeModifier extends Modifier {
    readonly category?: 'world' | 'head'; // undefined defaults to 'head' for backward compatibility
    getNudge(currentCarPos: Vector3, currentState: SceneState): FailableResult<Partial<Vector3>>;
}
```

Use cases:
- `category: 'world'` - Camera shake, engine vibration, ground bumps, suspension
- `category: 'head'` - User head tracking, breathing, VR/AR pop-out effects

## 2. How to integrate with SceneManager

Currently:

```ts
const finalCamPos = this.processNudges(basePos, debugLog, currentState);
```

To:

Here's how it changes with the hybrid system:

Separate world and head nudges:

```ts
const worldOffset = this.processNudgesByCategory('world', {x:0,y:0,z:0}, null, currentState);
const headOffset = this.processNudgesByCategory('head', {x:0,y:0,z:0}, debugLog, currentState);

// Camera position = CarModifier + world nudges (car shake, engine vibration, etc.)
const finalCamPos = {
x: basePos.x + worldOffset.x,
y: basePos.y + worldOffset.y,
z: basePos.z + worldOffset.z,
};

// Eye position = camera position + head nudges (user head tracking)
const finalEyePos = {
x: finalCamPos.x + headOffset.x,
y: finalCamPos.y + headOffset.y,
z: finalCamPos.z + headOffset.z,
};
```


Pass finalEyePos to ScreenModifier:

```ts
const screenProj = this.screenModifier.buildFrustum(finalEyePos);
```

Send screenProj to your p5 renderer, overriding any perspective() call.

This enables simultaneous world effects (camera shake) and head tracking (VR pop-out).