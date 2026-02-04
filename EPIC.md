# EPIC: Head-Tracked Off-Axis Projection / Screen Modifier

## Ticket 1 — ScreenModifier Class

Description: Create a ScreenModifier class to represent the physical screen plane and compute off-axis projection matrices from an eye position.

Acceptance Criteria:

Takes width, height, z-position, near/far planes as configuration.

Returns a Float32Array projection matrix.

Unit test verifies matrix changes based on different eye positions.

## Ticket 2 — Integrate ScreenModifier into SceneManager

Description: Add ScreenModifier as a first-class modifier in SceneManager.

Acceptance Criteria:

SceneManager holds a reference to ScreenModifier.

SceneManager.calculateScene computes eye position as CarModifier + NudgeModifier.

Off-axis projection is built via ScreenModifier.buildFrustum(eyePos).

## Ticket 3 — Head Tracking Eye Offsets

Description: Ensure head-tracking (NudgeModifier) only affects the eye position, not the camera/world position.

Acceptance Criteria:

Head-tracking offsets are additive to camera position to produce eye position.

No direct movement of CarModifier or scene geometry by NudgeModifier.

Unit test confirms eye offsets move the frustum without moving the world.

## Ticket 4 — Replace p5 Perspective with Off-Axis Projection

Description: Override p5 perspective() calls with the off-axis projection matrix from ScreenModifier.

Acceptance Criteria:

p5 rendering uses off-axis projection instead of symmetric perspective.

Objects in front of the screen plane appear correctly outside the screen.

Verify that standard world movement (CarModifier) still works.

## Ticket 5 — Combine Stick Rotation

Description: Ensure StickModifier (yaw/pitch/roll) still applies to the view matrix after head-tracked eye offsets.

Acceptance Criteria:

Rotation is applied to camera view matrix, not to the projection matrix.

Moving the head does not affect rotation logic.

Unit test confirms head tracking and rotation combine additively.

## Ticket 6 — Debug & Visualization

Description: Add debugging visuals to confirm the screen plane, eye position, and frustum.

Acceptance Criteria:

Visualize screen plane as a rectangle in 3D space.

Show eye position and frustum edges.

Enable/disable via SceneManager.debug = true.

## Ticket 7 — Integration Test

Description: Full integration test with CarModifier + NudgeModifier + StickModifier + ScreenModifier.

Acceptance Criteria:

Head movement produces correct pop-out effect.

Camera movement moves the world independently.

Stick rotation rotates the camera without breaking frustum.

## Ticket 8 — Documentation

Description: Document how ScreenModifier interacts with Nudge/Car/Stick modifiers.

Acceptance Criteria:

Explain additive eye offset concept.

Include example code snippet for p5 integration.

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

## 2. How to integrate with SceneManager

Currently:

```ts
const finalCamPos = this.processNudges(basePos, debugLog, currentState);
```

To:

Here’s how it changes:

Compute eye position:

```ts
const eyePos = finalCamPos;       // camera position from CarModifiers
const headOffset = this.processNudges({x:0,y:0,z:0}, debugLog, currentState); // just the head tracking offset
const finalEyePos = {
x: eyePos.x + headOffset.x,
y: eyePos.y + headOffset.y,
z: eyePos.z + headOffset.z,
};
```


Pass finalEyePos to ScreenModifier:

```ts
const screenProj = this.screenModifier.buildFrustum(finalEyePos);
```

Send screenProj to your p5 renderer, overriding any perspective() call.