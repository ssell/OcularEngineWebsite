# Graphics Library

A generic graphics API is described as part of the Core engine library. Various [implementations](/docs/overview/overview_graphics_implementations.html) are then provided for use.

Genenrally, all interactions with the various graphics classes should be done through the generic versions exposed in the Core library, though the API-dependent versions may offer more depth and control if needed.

# GraphicsDriver

The `GraphicsDriver` is the heart of the graphics library. In general it handles initialization, state changes, and object creation.

## Initialization

Driver initialization should be done following main engine initialization. It is done via the `initialize` method, which simply returns a boolean indicating success or failure.

```
    if(OcularGraphics->initialize())
    {
        // ...
    }
```

See the [minimal example](/docs/minimal_example.html) for the complete start-up procedure.

## State Changes

While the various render states are described in more detail below, it is noted here that they may be retrieved from the driver via:

```
    auto renderState = OcularGraphics->getRenderState();

    if(renderState)
    {
        // Modify render state ...
    }

    renderState->bind();
```

## Object Creation 

Various helper methods are provided by the graphics driver to create instances of the graphics classes. Typically, these helpers should be used instead of directly creating them so as to keep code API indepenent.

Example:

```
    // Bad
    auto context = OcularGraphics->getD3DDeviceContext();
    auto materialA = new Ocular::Graphics::D3D11Material(context);

    // Good
    auto materialB = new OcularGraphics->createMaterial();

    // ...

    delete materialA;
    delete materialB;
```

Ownership of these driver-created classes is given to the caller, and thus must be manually cleaned up.

## Rendering

All rendering should generally be left up to active `Renderer` implementation. Though typically, all rendering follows the pattern below:

```
    auto material = ...;
    auto mesh = ...;

    material->bind();

    OcularGraphics->renderMesh(mesh, 0);
```

## Buffer Swapping

Like with rendering, buffer swaps should generally be left to the active `Renderer`. In case manual swapping is required though, it can be done through the driver as follows:

```
    OcularGraphics->clearBuffers(Ocular::Core::Color::Black());

    // ...

    OcularGraphics->swapBuffers();
```

# Textures

A number of texture classes are provided in the graphics library, including:

* `Texture2D`
* `DepthTexture`
* `RenderTexture`

Textures may be created manually or loaded from the disk using the [resource system](/docs/overview/overview_resources.html). If loaded from disk, they may only exist as instances of `Texture2D` and used as shader input. If created manually, they can be made as render or depth textures and receive output from shaders as well.

Example of loading from disk:

```
    auto texture = OcularResources->getResource<Ocular::Graphics::Texture2D>("Textures/Grass");
```

Example of manual creation:

```
    TextureDescriptor descr;

    descr.width     = width;
    descr.height    = height; 
    descr.mipmaps   = 1;
    descr.type      = TextureType::RenderTexture2D;
    descr.format    = TextureFormat:R32G32B32A32Float;
    descr.cpuAccess = TextureAccess::ReadWrite;
    descr.gpuAccess = TextureAccess::ReadWrite;
    descr.filter    = TextureFilterMode::Point;

    auto renderTexture = OcularGraphics->createRenderTexture(descr);

    if(!renderTexture)
    {
        OcularLogger->error("Failed to create Render Texture");
    }
```

Textures are typically used in conjunction with cameras (for rendering onto), or with materials (as shader input).

# Shaders

Different shader classes are provided for each stage of graphics pipeline, including:

* `VertexShader`
* `GeometryShader`
* `FragmentShader` (aka `PixelShader`)
* `PreTessellationShader` (aka `HullShader`)
* `PostTessellationShader` (aka `DomainShader`)
* `ComputeShader`

Shaders are typically used as part of a material which makes use of the [`ShaderProgram`](/docs/api/class_ocular_1_1_graphics_1_1_shader_program.html) class, instead of individual shaders.

Loading a shader from file (such as `.hlsl`) is done via the resource system and returns a `ShaderProgram` as multiple shaders may exist in a single file.

For more information, see the API-dependent shader resource loaders:

* [`D3D11UncompiledShaderResourceLoader`](/docs/api/class_ocular_1_1_graphics_1_1_d3_d11_uncompiled_shader_resource_loader.html)

# Shader Input

In addition to textures, shader input can be in the form of uniforms and buffers.

## Uniforms

## GPU Buffers

# Materials

# Meshes

# Render State

# Debug Tools

## Debug Drawing

## Frame Stats
