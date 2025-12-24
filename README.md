# parallax
Just me playing around with 3D and fake 3D with HTML and Javascript

![Coverage](https://img.shields.io/codecov/c/github/thiagomata/parallax)


## Scene Entities

```mermaid
classDiagram
    class World {
        -Map registry
        -Map textureCache
        +hydrate(AssetLoader) Promise
        +step(GraphicProcessor) void
    }

    class RenderableElement {
        <<interface>>
        +id: string
        +props: SceneElementProps
        +assets: ElementAssets
        +render(gp, state) void
    }

    class ElementAssets {
        <<interface>>
        +main: TextureAsset
    }

    class TextureAsset {
        <<type>>
        +status: AssetStatus
        +value: TextureInstance
        +error: string
    }

    class AssetLoader {
        <<interface>>
        +hydrate(TextureRef) Promise~TextureAsset~
    }

    class GraphicProcessor {
        <<interface>>
        +drawBox(size) void
        +drawTexture(instance, w, h, a) void
    }

    %% Relationships
    World "1" *-- "many" RenderableElement : manages
    RenderableElement o-- ElementAssets : contains
    ElementAssets o-- TextureAsset : holds
    AssetLoader ..> TextureAsset : produces
    World ..> AssetLoader : invokes
    RenderableElement ..> GraphicProcessor : consumes
```
