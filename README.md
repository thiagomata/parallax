# Parallax Engine

![Coverage](https://img.shields.io/codecov/c/github/thiagomata/parallax)
[![Live Demo](https://img.shields.io/badge/Demo-Live_Preview-brightgreen)](https://thiagomata.github.io/parallax/)
[![tutorial](https://img.shields.io/badge/Tutorial-Hands_On-brightgreen)](https://thiagomata.github.io/parallax/docs/tutorial/)


Parallax is a **Deterministic Scene Orchestrator** designed for high-fidelity 3D interactive experiences. It operates as a strict state-to-state transformation engine, decoupling spatial intent from hardware-level rendering.

By enforcing its pipeline, Parallax enables complex cinematography—such as real-time head-tracking and reactive environments—within a predictable, traceable, and testable lifecycle.

## 🏗 The Parallax Manifest

The journey of a frame is divided into two distinct life-stages: **Structural Setup** and the **Temporal Loop**.

```mermaid
sequenceDiagram
    autonumber
    participant U as User / App
    participant W as World / Registry
    participant L as AssetLoader (Hydration)
    participant SM as SceneManager (Orchestration)
    participant S as Stage (Integration)
    participant R as Resolver
    participant GP as GraphicProcessor (Execution)
    participant P5 as P5 Implementation (Rasterization)

    Note over U,L: Structural Setup Protocol
    U->>W: addElement(blueprint)
    W->>L: hydrate(element)
    L-->>W: ASSET_STATUS.READY

    loop Every Frame
        U->>W: step(processor)
        W->>SM: processModifiers(timeData, inputs)
        Note right of SM: Graceful Degradation & Priority Ranking
        SM-->>W: SceneState

        W->>S: render(registry, state, processor)

        loop For each RenderableElement
            S->>R: resolve(blueprint, state)
            R-->>S: ResolvedProps

            S->>GP: execute(resolved, assets, state)

            GP->>P5: drawCommand()
        end

        W-->>U: Updated SceneState
    end
```
### I. Registration & Hydration (Setup)

**1. Registration: The Blueprint Intent**
Elements are registered as **Blueprints**. These are reactive contracts supporting deep-tree branches. A property can be a static value, a nested object, or a function `(state) => T` at any node level.

```typescript
world.addSphere({
    id: 'hero',
    type: ELEMENT_TYPES.SPHERE,
    radius: (s: SceneState) => 50 + Math.sin(s.playback.progress), // Dynamic node
    position: { x: 0, y: (s: SceneState) => s.camera.pitch * 10 } // Nested reactivity
});

```

**Available Element Types:** `addBox`, `addSphere`, `addCone`, `addPyramid`, `addCylinder`, `addTorus`, `addElliptical`, `addText`, `addFloor`, `addPanel`

**2. Hydration: Asset Locking**
High-memory assets (Textures/Fonts) are fetched and encapsulated into a renderer-specific **Graphics Bundle**. This ensures assets are locked to the element and ready in memory prior to the first frame.

```mermaid
---
title: Asset Hydration Protocol
---
    stateDiagram-v2
    direction LR
    [*] --> PENDING : Registration
    PENDING --> LOADING : Hydration Start

    LOADING --> READY : Load Success
    LOADING --> ERROR : Load Failure

    READY --> [*]
    ERROR --> [*]
```

### II. The Frame Loop - Many times per Second

**3. Modification: Graceful Degradation**
The **Modifier Stack** (`Car` → `Nudge` → `Stick`) processes raw inputs (Time, Scroll, Mouse, FaceGeometry).
This phase manages **Graceful Degradation**:
if a tracking source disconnects, modifiers transition through states like `READY` to `DRIFTING` (returning to neutral) to maintain stability.

**4. Orchestration: The Modifier Chain**
The `SceneManager` executes the **Modifier Chain**, ranking entries by `priority`.
Multiple inputs (e.g., a path-following `Car` and a head-tracking `Nudge`) are aggregated and collapsed into a single, unified, and immutable **SceneState**.

**5. Resolution: Single Source of Truth**
The `Resolver` executes the Blueprint functions using the newly calculated **SceneState**.
This transforms dynamic intent into **ResolvedProps**—a resolved, static dataset representing the frame's final geometry.

**6. Integration: The Execution Package**
The `Stage` pairs the **ResolvedProps** with their **Hydrated Assets**.
This creates a complete execution package, ensuring the renderer receives everything required (logic + assets) in a single handshake.

**7. Execution: Deterministic Transformations**
The `Stage` drives the **GraphicProcessor** interface.
Because this phase is decoupled from the hardware API, it enables **Unit Testing of the 3D scene math** without a GPU or browser environment.

```typescript
test('coordinate resolution math', () => {
    const mock = new MockProcessor();
    stage.render(world, mockState, mock);
    // Verify math results before pixels are even touched
    expect(mock.lastTranslation.x).toBe(150); 
});

```

**8. Rasterization: Hardware Translation**
The concrete implementation (e.g., `P5Processor`) converts the requests into a final image, handling hardware-level primitives, lights, and buffers.

---

## 🗝 Key Concepts

### Projections (The Camera System)

Parallax separates the **view** from the **projection**. A projection represents a virtual camera that can target another projection:

```typescript
const screen = {
    id: 'screen',
    type: PROJECTION_TYPES.SCREEN,
    position: { x: 0, y: 0, z: 1000 },
    targetId: undefined  // Root - no parent
};

const eye = {
    id: 'eye',
    type: PROJECTION_TYPES.EYE,
    position: { x: 0, y: 0, z: 100 },
    targetId: 'screen'  // Child of screen
};
```

This hierarchy (`targetId`) creates a dependency graph where child projections inherit and transform relative to their parent.

> **Note:** Head tracking is documented in detail at [`src/scene/head_tracking.md`](src/scene/head_tracking.md).

### Projection Modifiers

Each projection has its own modifier stack that transforms its position and rotation:

| Modifier | Purpose | Example |
|----------|---------|---------|
| `CarModifier` | Base position (vehicle mount, rail) | Path following |
| `NudgeModifier` | Position offset | Head tracking, vibration |
| `StickModifier` | Rotation & distance | Camera rotation |

Multiple modifiers of the same type are resolved by priority or voting.

### Look Modes

Projections support two look modes:

- **`LOOK_AT`**: Direction computed from a target position (default)
- **`ROTATION`**: Direction computed from yaw/pitch/roll angles + distance

### Presets

Presets are pre-configured projection hierarchies that can be loaded with `world.loadPreset()`:

| Preset | Description | Use Case |
|--------|-------------|----------|
| `CenterOrbit` | Orbital camera that circles around the scene center | General 3D scenes, demos |
| `HEAD_TRACKED_PRESET` | Nested eye/screen projections for head tracking | VR, face-following |
| `VR_CABIN_PRESET` | VR-style with car/screen/head/eye hierarchy | Immersive experiences |
| `SIMPLE_PRESET` | Minimal eye/screen setup | Basic views |

**CenterOrbit Usage:**
```typescript
world.loadPreset(CenterOrbit(p, { radius: 800, verticalBaseline: -400 }));
```

**Head Tracking Usage:**
```typescript
world.loadPreset(HEAD_TRACKED_PRESET);
```

### Data Providers

Modifiers can declare **explicit dependencies** on external data sources:

```typescript
class MyModifier implements NudgeModifier<TDataProviderLib> {
    readonly requiredDataProviders: (keyof TDataProviderLib)[] = ['headTracker'];
    
    getNudge(pos, context) {
        const faceData = context.dataProviders.headTracker; // Type-safe access
        // ...
    }
}
```

This enables compile-time safety and explicit contracts.

### Effect Bundles

Both projections and elements support **effects** — reusable behaviors that transform the resolved state:

```typescript
interface EffectBundle<TID, TConfig, E, TDataProviderLib = DataProviderLib> {
    readonly type: TID;
    readonly targets: ReadonlyArray<E['type']>;
    readonly defaults: TConfig;
    apply(current: E, context: ResolutionContext<TDataProviderLib>, settings: TConfig, pool: Record<string, E>): E;
}

// Built-in effects include: LookAtEffect, TransformEffect
```

Effects run during the resolution phase, enabling:
- Procedural animation
- Constraints
- Physics-like behaviors
- Debug visualization

---

## 🛠 Implementation Guardrails

To maintain the integrity of this deterministic pipeline, all development must respect these constraints:

* **Idempotent Resolution**: The `Resolver` must be a pure function. It reads `SceneState` and returns `ResolvedProps` without side effects.
* **No Redundant Data**: If a value can be computed from the `SceneState`, it must not be stored in the element. Follow the **Single Source of Truth** principle strictly.
* **Priority-Based Chaining**: Higher priority modifiers in the **Orchestration** phase always layer over or override lower-priority results.
* **Renderer Agnosticism**: The **Execution** phase must remain pure logic. Hardware-specific calls are strictly forbidden until the **Rasterization** phase.

### Canvas Resizing & Fullscreen

When the canvas size changes (e.g., fullscreen mode), update the world perspective:

```typescript
// When canvas is resized
instance.resizeCanvas(newWidth, newHeight, true);
world.enableDefaultPerspective(newWidth, newHeight);
```
