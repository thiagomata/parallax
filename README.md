# parallax

Just me playing around with 3D and fake 3D with HTML and Javascript

![Coverage](https://img.shields.io/codecov/c/github/thiagomata/parallax)

## Scene Entities

```mermaid
classDiagram
    class World {
        -Registry registry
        -Instance[] instances
        +hydrate(AssetLoader) Promise
        +step(GraphicProcessor) void
    }

    class Registry {
        <<interface>>
        +define(id, props) ElementSpec
        +all() ElementSpec[]
    }

    class ElementSpec {
        +id: string
        +props: SceneElementProps
        +asset: TextureAsset
    }

    class Instance {
        +specId: string
        +position: Vector3
    }

    class TextureAsset {
        <<type>>
        +status: AssetStatus
        +value: TextureInstance
        +error: string
    }

    class TextureInstance {
        +internalRef: any
    }

    class AssetLoader {
        <<interface>>
        +hydrate(TextureRef) Promise~TextureAsset~
    }

    class GraphicProcessor {
        <<interface>>
        +drawTexture(TextureInstance) void
    }

%% Structural Links
    World *-- Registry
    World *-- Instance
    Registry *-- ElementSpec
    ElementSpec *-- TextureAsset
    TextureAsset o-- TextureInstance
    Instance ..> ElementSpec: via specId
%% Interaction Links
    World ..> AssetLoader: invokes
    World ..> GraphicProcessor: drives
    GraphicProcessor ..> TextureInstance: draws
```

```mermaid
sequenceDiagram
    actor U as User
    participant W as World
    participant L as AssetLoader
    participant S as ElementSpec
    participant G as GraphicProcessor
    Note over U, S: User defines Spec as PENDING
    U ->> S: create(props)
    Note over W, L: Hydration Phase (Async)
    W ->> L: hydrate(ref)
    L -->> W: Promise~TextureAsset~
    W ->> W: await Promise
    W ->> S: Update status to READY
    W ->> S: Set value to TextureInstance
    Note over W, G: Render Loop (Step)
    W ->> G: setCamera()
    W ->> S: Check status
    alt is READY
        W ->> G: drawTexture(TextureInstance)
    else is ERROR
        W ->> G: drawText(error_msg)
    end

    G -->> U: Display Frame
```
