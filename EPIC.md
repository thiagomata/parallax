Below is a **rewritten, consolidated epic document** that reframes everything you built and struggled through into a **coherent engineering narrative**.
This is not a ticket list rewrite — it is a **design + systems epic** that captures *intent, evolution, decisions, failures, fixes, and lessons learned*.

---

# EPIC: Head-Tracked Off-Axis Projection & Hybrid Nudge Architecture

## 1. Epic Intent (Why this exists)

The goal of this epic is to enable **true head-tracked off-axis projection** while **preserving traditional world-space camera effects**, without collapsing the two into a single, fragile camera transform.

In other words:

> The system must allow **world motion** (car shake, vibration, terrain response)
> **and** **viewer motion** (head tracking, VR/AR pop-out)
> to coexist **without corrupting each other**.

This is not a visual gimmick. It is a **coordinate-system separation problem**.

---

## 2. Core Problem Statement

Traditional 3D engines assume:

* One camera
* One perspective
* One view transform

This assumption breaks when:

* The *viewer* moves independently of the *world*
* The *screen* becomes a physical object (not an abstract viewport)
* Projection must respond to eye position, not camera orientation

### Key Failure of the Old Model

* Camera position was overloaded:

    * Used for **world motion**
    * Used for **viewer motion**
    * Used for **projection math**
* Result: coupling, jitter, broken depth cues, and impossible composition rules

---

## 3. Architectural Reframing (The Big Shift)

### 🔑 Foundational Insight

> **Camera ≠ Eye ≠ Projection**

They must be separated.

| Concept    | Responsibility                                |
| ---------- | --------------------------------------------- |
| Camera     | World-space anchor (what moves the scene)     |
| Eye        | Viewer-space offset (head tracking, parallax) |
| Screen     | Physical projection surface                   |
| Projection | Mathematical mapping from eye → screen        |

This epic formalizes that separation.

---

## 4. High-Level Design

### 4.1 Projection Becomes First-Class

Projection is no longer implicit (`perspective()`), but **explicit state**:

```ts
export type ProjectionSource =
  | { kind: "camera"; camera: SceneCameraSettings }
  | { kind: "screen"; screen: ScreenConfig; eye: Vector3 };
```

This makes projection:

* Inspectable
* Testable
* Swappable
* Deterministic

---

## 5. ScreenModifier (Physical Screen Model)

### Purpose

Represent a **real screen plane in world space** and compute an **off-axis frustum** from an arbitrary eye position.

### Responsibilities

* Own **physical dimensions** of the screen
* Remain **fixed in world space**
* Convert eye position → projection matrix
* Never move the camera or world

### Non-Responsibilities

* No rotation
* No nudging
* No world logic
* No renderer assumptions

### Key Design Choice

ScreenConfig separates:

* **Input** (authoritative configuration)
* **Derived values** (computed once)

```ts
export class ScreenConfig {
    public readonly input: ScreenConfigInput;
    public readonly halfWidth: number;
    public readonly halfHeight: number;
}
```

This avoids:

* Partial drift
* Hidden defaults
* Desynchronization bugs

---

## 6. Hybrid Nudge System (The Core Innovation)

### Problem

Both world effects and head tracking were previously implemented as “nudges” — but they do **not belong to the same space**.

### Solution

Introduce **dual nudge categories**:

```ts
category?: 'world' | 'head';
```

### Semantics

| Category | Affects         | Examples                             |
| -------- | --------------- | ------------------------------------ |
| world    | Camera position | Car shake, vibration, bumps          |
| head     | Eye position    | Head tracking, breathing, VR pop-out |

### Composition Rule (Critical)

```ts
Camera position = Car + World Nudges
Eye position    = Camera + Head Nudges
```

This preserves:

* Physical plausibility
* Stable projection math
* Independent tuning of effects

---

## 7. Scene Integration (Where things almost broke)

### Key Refactor

Camera is **removed** from `SceneSettings`.

```ts
export interface SceneSettings {
    window: SceneWindow;
    projection: ProjectionSource;
    playback: PlaybackSettings;
    debug: boolean;
    alpha: number;
    startPaused: boolean;
}
```

### Why This Matters

* Prevents “ghost cameras”
* Forces projection to be explicit
* Eliminates accidental fallback paths

### Failure Encountered

* State updated camera
* Projection logic read projection
* They diverged silently

**Lesson:**
If projection is state, **camera must not be hidden state**.

---

## 8. Renderer Integration (p5.js)

### Constraint

p5 assumes symmetric perspective.

### Strategy

* Replace `perspective()` with `frustum()`
* Feed parameters derived from off-axis projection
* Preserve renderer abstraction

### Result

* Off-screen pop-out works
* World movement remains intact
* No renderer fork required

---

## 9. Rotation & Stick Composition

### Problem

Head movement must not rotate the world.

### Rule Locked In

* Rotation applies to **view matrix**
* Eye offsets apply to **projection only**

### Solution

* Introduced `CompositeStick`
* Supports:

    * Additive
    * Weighted
    * Fallback strategies
* Backward compatible

This preserves:

* Input devices
* Existing gameplay logic
* Safety constraints for VR

---

## 10. Debug & Visualization

Debugging 4 coordinate systems without visuals is impossible.

Added:

* Screen plane visualization
* Eye position marker
* Frustum edges
* Toggle via `SceneManager.debug`

This turned projection math from “black box” into “inspectable geometry”.

---

## 11. Key Challenges & Resolutions

### Challenge: Partial types hid bugs

**Resolution:**
Single input object + validated merge + immutable config

---

### Challenge: Camera updates not reflected in projection

**Resolution:**
Camera removed from scene settings; projection owns truth

---

### Challenge: Tests passed while behavior was wrong

**Resolution:**
Tests rewritten to assert *spatial effects*, not just matrices

---

### Challenge: Conceptual overload

**Resolution:**
Clear separation of:

* World space
* View space
* Projection space

---

## 12. Design Decisions (Locked)

1. Projection is explicit state
2. Camera is not mandatory
3. Screen is a physical object
4. Eye ≠ Camera
5. World and head nudges never mix
6. Rotation never affects projection
7. Defaults live at scene level
8. Validation happens once

---

## 13. Lessons Learned

* **If projection is implicit, bugs are invisible**
* **If camera does everything, nothing is correct**
* **Defaults hide intent**
* **Partial types hide architectural mistakes**
* **Head tracking is projection math, not camera motion**
* **Debug geometry is not optional**

---

## 14. Final Outcome

This epic produced:

* A reusable off-axis projection system
* A hybrid motion architecture
* Renderer-agnostic projection control
* A clean mental model for VR/AR + traditional rendering

Most importantly:

> You now have an engine that understands **where the world is**,
> **where the viewer is**,
> and **where the screen physically exists** —
> and never confuses them again.

Below is a **rewritten, consolidated epic document** that reframes everything you built and struggled through into a **coherent engineering narrative**.
This is not a ticket list rewrite — it is a **design + systems epic** that captures *intent, evolution, decisions, failures, fixes, and lessons learned*.

---

# EPIC: Head-Tracked Off-Axis Projection & Hybrid Nudge Architecture

## 1. Epic Intent (Why this exists)

The goal of this epic is to enable **true head-tracked off-axis projection** while **preserving traditional world-space camera effects**, without collapsing the two into a single, fragile camera transform.

In other words:

> The system must allow **world motion** (car shake, vibration, terrain response)
> **and** **viewer motion** (head tracking, VR/AR pop-out)
> to coexist **without corrupting each other**.

This is not a visual gimmick. It is a **coordinate-system separation problem**.

---

## 2. Core Problem Statement

Traditional 3D engines assume:

* One camera
* One perspective
* One view transform

This assumption breaks when:

* The *viewer* moves independently of the *world*
* The *screen* becomes a physical object (not an abstract viewport)
* Projection must respond to eye position, not camera orientation

### Key Failure of the Old Model

* Camera position was overloaded:

    * Used for **world motion**
    * Used for **viewer motion**
    * Used for **projection math**
* Result: coupling, jitter, broken depth cues, and impossible composition rules

---

## 3. Architectural Reframing (The Big Shift)

### 🔑 Foundational Insight

> **Camera ≠ Eye ≠ Projection**

They must be separated.

| Concept    | Responsibility                                |
| ---------- | --------------------------------------------- |
| Camera     | World-space anchor (what moves the scene)     |
| Eye        | Viewer-space offset (head tracking, parallax) |
| Screen     | Physical projection surface                   |
| Projection | Mathematical mapping from eye → screen        |

This epic formalizes that separation.

---

## 4. High-Level Design

### 4.1 Projection Becomes First-Class

Projection is no longer implicit (`perspective()`), but **explicit state**:

```ts
export type ProjectionSource =
  | { kind: "camera"; camera: SceneCameraSettings }
  | { kind: "screen"; screen: ScreenConfig; eye: Vector3 };
```

This makes projection:

* Inspectable
* Testable
* Swappable
* Deterministic

---

## 5. ScreenModifier (Physical Screen Model)

### Purpose

Represent a **real screen plane in world space** and compute an **off-axis frustum** from an arbitrary eye position.

### Responsibilities

* Own **physical dimensions** of the screen
* Remain **fixed in world space**
* Convert eye position → projection matrix
* Never move the camera or world

### Non-Responsibilities

* No rotation
* No nudging
* No world logic
* No renderer assumptions

### Key Design Choice

ScreenConfig separates:

* **Input** (authoritative configuration)
* **Derived values** (computed once)

```ts
export class ScreenConfig {
    public readonly input: ScreenConfigInput;
    public readonly halfWidth: number;
    public readonly halfHeight: number;
}
```

This avoids:

* Partial drift
* Hidden defaults
* Desynchronization bugs

---

## 6. Hybrid Nudge System (The Core Innovation)

### Problem

Both world effects and head tracking were previously implemented as “nudges” — but they do **not belong to the same space**.

### Solution

Introduce **dual nudge categories**:

```ts
category?: 'world' | 'head';
```

### Semantics

| Category | Affects         | Examples                             |
| -------- | --------------- | ------------------------------------ |
| world    | Camera position | Car shake, vibration, bumps          |
| head     | Eye position    | Head tracking, breathing, VR pop-out |

### Composition Rule (Critical)

```ts
Camera position = Car + World Nudges
Eye position    = Camera + Head Nudges
```

This preserves:

* Physical plausibility
* Stable projection math
* Independent tuning of effects

---

## 7. Scene Integration (Where things almost broke)

### Key Refactor

Camera is **removed** from `SceneSettings`.

```ts
export interface SceneSettings {
    window: SceneWindow;
    projection: ProjectionSource;
    playback: PlaybackSettings;
    debug: boolean;
    alpha: number;
    startPaused: boolean;
}
```

### Why This Matters

* Prevents “ghost cameras”
* Forces projection to be explicit
* Eliminates accidental fallback paths

### Failure Encountered

* State updated camera
* Projection logic read projection
* They diverged silently

**Lesson:**
If projection is state, **camera must not be hidden state**.

---

## 8. Renderer Integration (p5.js)

### Constraint

p5 assumes symmetric perspective.

### Strategy

* Replace `perspective()` with `frustum()`
* Feed parameters derived from off-axis projection
* Preserve renderer abstraction

### Result

* Off-screen pop-out works
* World movement remains intact
* No renderer fork required

---

## 9. Rotation & Stick Composition

### Problem

Head movement must not rotate the world.

### Rule Locked In

* Rotation applies to **view matrix**
* Eye offsets apply to **projection only**

### Solution

* Introduced `CompositeStick`
* Supports:

    * Additive
    * Weighted
    * Fallback strategies
* Backward compatible

This preserves:

* Input devices
* Existing gameplay logic
* Safety constraints for VR

---

## 10. Debug & Visualization

Debugging 4 coordinate systems without visuals is impossible.

Added:

* Screen plane visualization
* Eye position marker
* Frustum edges
* Toggle via `SceneManager.debug`

This turned projection math from “black box” into “inspectable geometry”.

---

## 11. Key Challenges & Resolutions

### Challenge: Partial types hid bugs

**Resolution:**
Single input object + validated merge + immutable config

---

### Challenge: Camera updates not reflected in projection

**Resolution:**
Camera removed from scene settings; projection owns truth

---

### Challenge: Tests passed while behavior was wrong

**Resolution:**
Tests rewritten to assert *spatial effects*, not just matrices

---

### Challenge: Conceptual overload

**Resolution:**
Clear separation of:

* World space
* View space
* Projection space

---

## 12. Design Decisions (Locked)

1. Projection is explicit state
2. Camera is not mandatory
3. Screen is a physical object
4. Eye ≠ Camera
5. World and head nudges never mix
6. Rotation never affects projection
7. Defaults live at scene level
8. Validation happens once

---

## 13. Lessons Learned

* **If projection is implicit, bugs are invisible**
* **If camera does everything, nothing is correct**
* **Defaults hide intent**
* **Partial types hide architectural mistakes**
* **Head tracking is projection math, not camera motion**
* **Debug geometry is not optional**

---

## 14. Final Outcome

This epic produced:

* A reusable off-axis projection system
* A hybrid motion architecture
* Renderer-agnostic projection control
* A clean mental model for VR/AR + traditional rendering

Most importantly:

> You now have an engine that understands **where the world is**,
> **where the viewer is**,
> and **where the screen physically exists** —
> and never confuses them again.

Good catch — that **is** a missing pillar.
Below is a **clean, reinforced design section** you can drop straight into the epic, explicitly capturing that separation and *why it exists*. This also retroactively explains many of the failures you hit earlier.

---

## Core Design Principle — Independent Spaces, Independent Modifiers

### **Eyes, Screen, and Player Are Separate Spaces**

**Key Design Decision (Foundational):**
The system explicitly models **three independent spatial domains**, each with its own modifier pipeline:

| Space                     | Represents                    | Moves What                    |
| ------------------------- | ----------------------------- | ----------------------------- |
| **Player / Camera Space** | The in-world observer         | Camera position & view origin |
| **Eye Space**             | Physical viewer head position | Frustum / projection only     |
| **Screen Space**          | Physical display surface      | Projection geometry           |

These spaces **must never collapse into one another**.

---

## Modifier Ownership by Space

Each space has its **own allowed modifier types** and **own aggregation rules**.

### 1. Player / Camera Space (World Space)

**Purpose:**
Represents the camera as a physical object in the world.

**Affected By:**

* `CarModifier` – base camera position (vehicle mount, rail, dolly)
* **World Nudges** – vibration, shake, recoil, terrain response
* **Stick Rotation** – yaw / pitch / roll (view orientation)

**Never Affected By:**

* Head tracking
* Eye offsets
* Screen geometry

**Pipeline:**

```ts
cameraBasePos
  → CarModifiers
  → WorldNudges
  → CameraPosition
```

---

### 2. Eye Space (Head / Viewer Space)

**Purpose:**
Represents the **physical viewer’s head** relative to the camera.

**Affected By:**

* **Head Nudges** (default nudge category)

    * Head tracking
    * Breathing
    * Micro sway
    * AR / VR enrichment

**Never Affected By:**

* Car movement
* World shake
* Stick rotation
* Screen configuration

**Pipeline:**

```ts
eyePos = cameraPosition + HeadNudges
```

**Critical Property:**

> Eye movement must change **projection**, not **world position**.

---

### 3. Screen Space (Display Space)

**Purpose:**
Represents the **physical display surface in the world**.

**Affected By:**

* Screen configuration only

    * width
    * height
    * z-plane
    * near / far

**Never Affected By:**

* Camera motion
* Head motion
* Stick rotation
* Nudges of any kind

**Pipeline:**

```ts
screen + eyePos → off-axis frustum
```

---

## Why This Separation Is Non-Negotiable

### What Went Wrong Before

Failures in earlier iterations came from:

* Eye nudges leaking into camera space
* World shake affecting frustum math
* Stick rotation contaminating projection
* Renderer trying to “help” by recomputing meaning

All of these came from **collapsing spaces**.

---

## Unified Flow (Final, Correct)

```ts
// 1. Camera (Player space)
cameraPos =
  CarModifiers
+ WorldNudges

// 2. Eye (Eye space)
eyePos =
  cameraPos
+ HeadNudges

// 3. Projection (Screen space)
projection =
  Screen.buildFrustum(eyePos)

// 4. View
view =
  lookAt(cameraPos, stickRotation)

// 5. Render
renderer.setProjection(projection)
renderer.setView(view)
```

Each step:

* Runs once
* Has a single owner
* Has no hidden coupling

---

## Modifier Categories by Space (Explicit)

| Modifier Type  | Space  | Allowed Effect       |
| -------------- | ------ | -------------------- |
| CarModifier    | Player | Base camera position |
| World Nudge    | Player | Camera displacement  |
| Head Nudge     | Eye    | Frustum shift only   |
| StickModifier  | Player | View rotation        |
| ScreenModifier | Screen | Projection geometry  |

---

## Design Rule (Hard Constraint)

> **A modifier may only influence the space it belongs to.**

If a modifier:

* Needs to move the world → Player space
* Needs to create parallax without world motion → Eye space
* Needs to change what is visible → Screen space

If it violates this:

* It is miscategorized
* Or the architecture is wrong

---

## Key Insight (Lesson Learned)

The system is **not camera-centric**.

It is:

* **Viewer-centric**
* **Display-aware**
* **Space-partitioned**

That distinction is what enables:

* True off-axis projection
* Head-tracked pop-out
* World shake + head stability
* VR/AR-style depth without VR hardware

---

## One-Line Mental Model

> **The player moves the camera.
> The head moves the eye.
> The screen bends reality.**

----------------

## Core Design Principle — Independent Spaces, Independent Modifiers

### **Eyes, Screen, and Player Are Separate Spaces**

**Key Design Decision (Foundational):**
The system explicitly models **three independent spatial domains**, each with its own modifier pipeline:

| Space                     | Represents                    | Moves What                    |
| ------------------------- | ----------------------------- | ----------------------------- |
| **Player / Camera Space** | The in-world observer         | Camera position & view origin |
| **Eye Space**             | Physical viewer head position | Frustum / projection only     |
| **Screen Space**          | Physical display surface      | Projection geometry           |

These spaces **must never collapse into one another**.

---

## Modifier Ownership by Space

Each space has its **own allowed modifier types** and **own aggregation rules**.

### 1. Player / Camera Space (World Space)

**Purpose:**
Represents the camera as a physical object in the world.

**Affected By:**

* `CarModifier` – base camera position (vehicle mount, rail, dolly)
* **World Nudges** – vibration, shake, recoil, terrain response
* **Stick Rotation** – yaw / pitch / roll (view orientation)

**Never Affected By:**

* Head tracking
* Eye offsets
* Screen geometry

**Pipeline:**

```ts
cameraBasePos
  → CarModifiers
  → WorldNudges
  → CameraPosition
```

---

### 2. Eye Space (Head / Viewer Space)

**Purpose:**
Represents the **physical viewer’s head** relative to the camera.

**Affected By:**

* **Head Nudges** (default nudge category)

    * Head tracking
    * Breathing
    * Micro sway
    * AR / VR enrichment

**Never Affected By:**

* Car movement
* World shake
* Stick rotation
* Screen configuration

**Pipeline:**

```ts
eyePos = cameraPosition + HeadNudges
```

**Critical Property:**

> Eye movement must change **projection**, not **world position**.

---

### 3. Screen Space (Display Space)

**Purpose:**
Represents the **physical display surface in the world**.

**Affected By:**

* Screen configuration only

    * width
    * height
    * z-plane
    * near / far

**Never Affected By:**

* Camera motion
* Head motion
* Stick rotation
* Nudges of any kind

**Pipeline:**

```ts
screen + eyePos → off-axis frustum
```

---

## Why This Separation Is Non-Negotiable

### What Went Wrong Before

Failures in earlier iterations came from:

* Eye nudges leaking into camera space
* World shake affecting frustum math
* Stick rotation contaminating projection
* Renderer trying to “help” by recomputing meaning

All of these came from **collapsing spaces**.

---

## Unified Flow (Final, Correct)

```ts
// 1. Camera (Player space)
cameraPos =
  CarModifiers
+ WorldNudges

// 2. Eye (Eye space)
eyePos =
  cameraPos
+ HeadNudges

// 3. Projection (Screen space)
projection =
  Screen.buildFrustum(eyePos)

// 4. View
view =
  lookAt(cameraPos, stickRotation)

// 5. Render
renderer.setProjection(projection)
renderer.setView(view)
```

Each step:

* Runs once
* Has a single owner
* Has no hidden coupling

---

## Modifier Categories by Space (Explicit)

| Modifier Type  | Space  | Allowed Effect       |
| -------------- | ------ | -------------------- |
| CarModifier    | Player | Base camera position |
| World Nudge    | Player | Camera displacement  |
| Head Nudge     | Eye    | Frustum shift only   |
| StickModifier  | Player | View rotation        |
| ScreenModifier | Screen | Projection geometry  |

---

## Design Rule (Hard Constraint)

> **A modifier may only influence the space it belongs to.**

If a modifier:

* Needs to move the world → Player space
* Needs to create parallax without world motion → Eye space
* Needs to change what is visible → Screen space

If it violates this:

* It is miscategorized
* Or the architecture is wrong

---

## Key Insight (Lesson Learned)

The system is **not camera-centric**.

It is:

* **Viewer-centric**
* **Display-aware**
* **Space-partitioned**

That distinction is what enables:

* True off-axis projection
* Head-tracked pop-out
* World shake + head stability
* VR/AR-style depth without VR hardware

---

## One-Line Mental Model

> **The player moves the camera.
> The head moves the eye.
> The screen bends reality.**

---

## Additional Core Design Principle — Element-Relative Spaces & Dependency Resolution

### **Elements Exist in a Directed Dependency Graph**

**Key Design Decision:**
Scene elements are **not independent**.
An element may reference another element as an **anchor**, **parent**, or **spatial frame of reference**.

Therefore:

> **Element transforms must be resolved in dependency order, not in isolation.**

---

## Element Spaces (Fourth Spatial Layer)

In addition to **Player / Eye / Screen**, there is a fourth conceptual layer:

### **Element Space**

**Purpose:**
Represents objects whose transform may depend on:

* Other elements
* Camera
* World
* Screen-relative effects

**Examples:**

* UI labels anchored to world objects
* Reticles anchored to the camera
* Effects anchored to other moving entities
* HUD elements projected into world space

---

## Why This Must Be Handled During Calculation (Not Rendering)

### What Must *Not* Happen

❌ Resolve anchors in p5
❌ Query other elements during draw()
❌ Re-run transforms per frame in renderer
❌ Apply “fixups” after projection

These lead to:

* Double transforms
* Frame-order bugs
* Non-deterministic layouts
* Impossible-to-test behavior

---

## Correct Responsibility Split

### SceneManager (Calculation Phase)

**Owns:**

* Element dependency resolution
* Anchor-relative transforms
* World-space final positions
* Stable, deterministic state output

**Guarantee:**

> When rendering starts, **every element already has a resolved transform**.

---

### Renderer (p5)

**Owns only:**

* Applying matrices
* Drawing primitives
* No spatial reasoning
* No dependency awareness

---

## Element Dependency Model

### Element Definition (Conceptual)

```ts
export interface SceneElement {
    id: string;
    anchor?: {
        elementId: string;
        space: 'world' | 'camera' | 'eye' | 'screen';
    };
    localTransform: Transform;
}
```

### Resolution Rules

1. **Topologically sort elements by anchor dependency**
2. Resolve anchor’s **final world transform**
3. Apply local transform relative to anchor space
4. Produce a **ResolvedElement**

---

## Resolution Order (High-Level)

```text
Car / Camera
   ↓
World Nudges
   ↓
Camera Position
   ↓
Eye Position
   ↓
Screen Projection
   ↓
Element Graph Resolution
   ↓
Final Render State
```

Elements may anchor to:

* Another element
* Camera space
* Eye space
* Screen plane

But **never resolve themselves**.

---

## Why This Is a First-Class Design Decision

Because:

* Anchoring introduces **implicit transforms**
* Implicit transforms require **explicit ordering**
* Ordering must be **deterministic**
* Determinism requires **centralized calculation**

Rendering engines cannot safely do this.

---

## Key Lesson Learned

> **Any system that allows “element A follows element B” must become graph-based.**

Trying to resolve this:

* In the renderer
* Lazily
* Or per element

Will eventually fail.

---

## Final Design Constraint (Hard Rule)

> **All element anchoring and relative positioning is resolved in SceneManager before rendering.**

If an element:

* Needs another element → resolve during calc
* Needs camera reference → resolved after camera final
* Needs eye reference → resolved after eye final
* Needs screen reference → resolved after projection

---

## Architectural Payoff

This enables:

* Stable UI anchors
* Deterministic replay
* Time scrubbing
* Head-tracked UI
* World-relative HUDs
* Clean testing of layout logic
* Renderer-agnostic backends

