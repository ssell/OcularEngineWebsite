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

Aside from textures, input to shaders can be done using either uniforms or buffers uploaded to the GPU.

## Uniforms

The [`Uniform`](/docs/api/class_ocular_1_1_graphics_1_1_uniform.html) and [`UniformBuffer`](/docs/api/class_ocular_1_1_graphics_1_1_uniform_buffer.html) classes allow for flexible data upload to the GPU and come in two varieties: fixed and dynamic.

### Fixed Buffers

Fixed uniform buffers are defined by a set structure and have pre-defined setter methods in the `UniformBuffer` class. These buffers are automatically updated by the engine and should typically never be set by the user.

There are currently three types of fixed uniform buffers used by the engine:

* [Per-Frame](/docs/api/struct_ocular_1_1_graphics_1_1_uniform_per_frame.html)
* [Per-Camera](/docs/api/struct_ocular_1_1_graphics_1_1_uniform_per_camera.html)
* [Per-Object](/docs/api/struct_ocular_1_1_graphics_1_1_uniform_per_object.html)

### Dynamic Buffers

Dynamic buffers are flexible and the structure and size of their data may be changed.

Materials, for example, make use of a dynamic uniform buffer when using their `setUniform` and `getUniform` family of methods. Additional dynamic buffers may created by hand and used, but the per-material buffer should be sufficient for most common rendering needs.

Example of manually setting uniform value in buffer:

```
    Graphics::Uniform uniform;

    uniform.setName("Roughness");
    uniform.setType(Utils::TypeName<float>::name);
    uniform.setRegister(0);
    uniform.setData(4.0f);

    auto uniformBuffer = OcularGraphics->createUniformBuffer(Graphics::UniformBufferType::PerMaterial);
    uniformBuffer->setUniform(uniform);
```

Example of using `Material` helper method:

```
    material->setUniform("Roughness", 0, 4.0f);
```

### HLSL Mapping

When using D3D11, uniform buffers map to constant buffers. The following registers are used by the engine:

| Register | Uniform Buffer |
|:--------:|:---------------|
| `0` | Per-Frame |
| `1` | Per-Camera |
| `2` | Per-Object |
| `3` | Per-Material |

See [`OcularCommon.hlsl`](https://github.com/ssell/OcularEngine/blob/master/Resources/OcularCore/Shaders/OcularCommon.hlsl) for full constant buffer descriptions.

The register used in D3D11 for the entire constant buffer is determined by the `UniformBufferType` parameter provided in the constructor.

```
    // Constant buffer bound to register b3
    auto bufferA = OcularGraphics->createUniformBuffer(Graphics::UniformBufferType::PerMaterial);

    // Constant buffer bound to register b4
    auto bufferB = OcularGraphics->createUniformBuffer(static_cast<Graphics::UniformBufferType>(4));
```

## GPU Buffers

Various GPU buffers are available to pass large amounts of generic data to shaders. The exact buffers available is determined by the underlying API implementation, but all inherit from the [`GPUBuffer`](/docs/api/class_ocular_1_1_graphics_1_1_g_p_u_buffer.html) class.

Example of creating a new GPU buffer:

```
    Graphics::GPUBufferDescriptor descr;

    descr.cpuAccess   = Graphics::GPUBufferAccess::Write;
    descr.gpuAccess   = Graphics::GPUBufferAccess::Read;
    descr.elementSize = sizeof(DataStruct);
    descr.bufferSize  = numStructs * descr.elementSize;
    descr.stage       = Graphics::GPUBufferStage::Fragment;
    descr.slot        = bufferRegister;

    auto gpuBuffer = OcularGraphics->createGPUBuffer(descr);

    if(gpuBuffer)
    {
        gpuBuffer->build(nullptr);
    }
```

### HLSL Mapping

The descriptor values determine what the underlying D3D11 buffer implementation is provided by the graphics driver. See the individual buffer documentation for more information.

| Buffer Name | HLSL Type | Description |
|:------------|:----------|:------------|
| [`D3D11StructuredBuffer`](/docs/api/class_ocular_1_1_graphics_1_1_d3_d11_structured_buffer.html) | [`StructuredBuffer`](https://msdn.microsoft.com/en-us/library/windows/desktop/ff471514(v=vs.85).aspx) | The elements of a structured buffer are defined by a set structure. | 

# Materials

A [`Material`](/docs/api/class_ocular_1_1_graphics_1_1_material.html) represents the combination of the following components:

* Shaders
* Shader Input (Textures and Uniforms)
* Render State

## Creation

Materials are resources, and as such may be loaded from disk using the resource system. When saved to disk, they use the Ocular Material format (`.omat`) which are handled by the `MaterialResourceLoader` and `MaterialResourceSaver` classes.

See [`MaterialResourceLoader`](/docs/api/class_ocular_1_1_graphics_1_1_material_resource_loader.html) for more information on the `.omat` format.

They may also be created programmatically or via the Material Editor tool.

```
auto material = OcularGraphics->createMaterial();
```

See the [Editor Overview](/docs/overview/overview_editor.html) for information of the Material Editor tool.

## Modification

Brief example showing the main methods for material modification:

```
auto material = ...;

// Set material shaders

material->setVertexShader("OcularCore/Default");
material->setFragmentShader("OcularCore/Default");

// Set material texture

auto texture = OcularResources->getResource<Graphics::Texture>("OcularCore/Textures/Default");

material->setTexture(0, "Diffuse", texture);

// Set material uniform

material->setUniform("Albedo", 0, Core::Color::Green());
material->setUniform("Rougness", 1, 0.5f);

// Set material state

material->setPrimitiveStyle(Graphics::PrimitiveStyle::TriangleList);
```

Again, the Material Editor tool may be used to modify a material from within the editor application.

## Destruction

If a material was retrieved from the resource system, then it should not be manually destroyed as the resource manager has ownership.

If the material was created by the graphics driver, then the caller has ownership and must handle deletion and proper clean up.

## Shared Materials

It should be noted that any material created via the resource system (loaded from `.omat`) is shared, so care should be taken when making modifications.

In practice, it is better to create a copy of a specific material, and then use/modify the local copy if needed. To duplicate a material:

```
auto sharedMat = OcularResources->getResource<Graphics::Material>("Materials/Flat");
auto localMat = OcularGraphics->createMaterial();

Core::BuilderNode builder;

sharedMat->onSave(&builder);
localMat->onLoad(&builder);
``` 

## Usage

To apply a material, simply call the `bind` method.

```
    auto material = ...;

    if(material)
    {
        material->bind();
    }
```

## Multi-Pass Materials

_Feature not yet implemented. Expected in a [future release](/roadmap.html)._

# Meshes

A [`Mesh`](/docs/api/class_ocular_1_1_graphics_1_1_mesh.html) represents the marriage of an [`IndexBuffer`](/docs/api/class_ocular_1_1_graphics_1_1_index_buffer.html) and a [`VertexBuffer`](/docs/api/class_ocular_1_1_graphics_1_1_vertex_buffer.html).

Meshes, like materials, are resources and may be loaded from disk. The currently supported mesh formats include:

| Extension | Name | Loader |
|:---------:|:----:|:------:|
| `.ply` | Polygon File Format | [`MeshResourceLoader_PLY`](/docs/api/class_ocular_1_1_graphics_1_1_mesh_resource_loader___p_l_y.html) |
| `.obj` | Wavefront Object File | [`MeshResourceLoader_OBJ`](/docs/api/class_ocular_1_1_graphics_1_1_resource_loader___o_b_j.html)<sup>1</sup> |

## Submeshes

Each mesh is composed of one or more submesh. A submesh is used when different materials are applied to different parts of the same mesh. Note that this is not the same as multi-pass materials.

In practice, each submesh will correspond to a specific material. For example, this is what the `MeshRenderable` does when rendering. 

# Render State

The [`RenderState`](/docs/api/class_ocular_1_1_graphics_1_1_render_state.html) class describes various different state settings related to the rendering/graphics pipeline. 

Example of modifying the render state:

```
    // Retrieve the active render state

    auto renderState = OcularGraphics->getRenderState();

    // Modify the raster state

    auto rasterState = renderState->getRasterState();

    rasterState.fillMode = Graphics::FillMode::Solid;

    renderState->setRasterState(rasterState);

    // Update the render state by calling bind

    renderState->bind();
```

Note that in the example above, the render state is not fully updated until `bind` is called. This allows for any number of local state changes to occur before making the API-dependent calls.

The render state is split into three different state classes which are described in the sections below.

## Raster State

The [`RasterState`](/docs/api/struct_ocular_1_1_graphics_1_1_raster_state.html) is comprised of the following state properties:

| Property | Default Value | Description |
|:---------|:-------------|:------------|
| Fill Mode | `FillMode::Solid` | Determines if triangles are filled during rasterization. |
| Cull Mode | `CullMode::Back` | Determines what type of triangles to cull.  |
| Cull Direction | `CullDirection::CounterClockwise` | Determines what is considered front/back-facing triangles. | 
| Primitive Style | `PrimitiveStyle::TriangleList` | Determines how vertex data is interpreted. |
| Enable Multisampling | `true` | Enables/disable `RenderTexture` antialiasing. |
| Enable Line Antialiasing | `false` | Enables line primitive antialiasing. |

## Blend State

The [`BlendState`](/docs/api/struct_ocular_1_1_graphics_1_1_blend_state.html) is comprised of the following state properties:

| Property | Default Value | Description |
|:---------|:-------------|:------------|
| Enable Blending | `true` | If true, blending operations will be performed. |
| Src Blend | `BlendType::One` | The operation to perform on pixel RGB values output from the Fragment shader. | 
| Dest Blend | `BlendType::Zero` | The operation to perform on the current pixel RGB value in the target buffer. |
| Alpha Src Blend | `BlendType::One` | The operation to perform on pixel alpha values output from the Fragment shader. | 
| Alpha Dest Blend | `BlendType::Zero` | The operation to perform on the current pixel alpha value in the target buffer. |
| Blend Equation | `BlendEquation::Add` | Equation used when combining the source and destination RGB values. |
| Alpha Blend Equation | `BlendEquation::Add` | Equation used when combing the source and destination alpha values. |
| Blend Factor | `(1, 1, 1, 1)` | Custom blend factor used when specified by blend type. |

## Depth-Stencil State

The [`DepthStencilState`](/docs/api/struct_ocular_1_1_graphics_1_1_depth_stencil_state.html) is comprised of the following state properties:

| Property | Default Value | Description |
|:---------|:-------------|:------------|
| Enable Depth Testing | `true` | If true, the depth test will occur. |
| Enable Stencil Testing | `true` | If true, the stencil test will occur. |
| Stencil Reference Value | `0x00` | |
| Stencil Read Mask | `` | |
| Stencil Write Mask | `` | |

In addition to the above, the Depth-Stencil State also has a `DepthBiasState` for describing depth bias:

| Property | Default Value | Description |
|:---------|:-------------|:------------|
| Depth Bias | `0.0` | Depth value added to a given pixel. |
| Depth Bias Clamp | `0.0` | Maximum depth bias of a pixel. |
| Slope-Scaled Depth Bias | `0.0` | Scalar on a given pixel's slope. |

And two instances of `StencilFaceDescr` for front/back stencil operations:

| Property | Default Value | Description |
|:---------|:-------------|:------------|
| Stencil Pass Op | `StencilOperation::Keep` | Operation to occur if a value passes the stencil test. |
| Stencil Fail Op | `StencilOperation::Keep` | Operation to occur if a value fails the stencil test. | 
| Stencil-Pass Depth-Fail Op | `StencilOperation::Keep` | Operation to occur if a value passes the stencil test, but fails the depth test. |
| Comparison Function | `DepthStencilComparison::AlwaysPass` | Function that compares source and destination stencil data. |

# Debug Tools

## Debug Drawing

Debug drawing of shapes is provided by the graphics driver. Shapes currently available are: line and circle.

Example of drawing a line:

```
    Math::Vector3f start = Math::Vector3f(0.0f, 0.0f, 0.0f);
    Math::Vector3f stop  = Math::Vector3f(5.0f, 5.0f, 5.0f);

    OcularGraphics->drawDebugLine(start, stop, Core::Color::Red(), 15000);
```

The above draws a red line from `(0, 0, 0)` to `(5, 5, 5)` which persists for 15 seconds.

## Frame Stats

The [`FrameStats`](/docs/api/struct_ocular_1_1_graphics_1_1_frame_stats.html) structure provides information about the a frame and may be retrieved from the graphics driver.

```
auto stats = OcularGraphics->getLastFrameStats();
```

The following information is provided with the frame stats:

| Name | Description |
|:-----|:------------|
| Frame Number | The frame's sequential numbering. |
| Triangle Count | Number of triangle primitives rendered in the frame<sup>2</sup>. |
| Line Count | Number of line primitives rendered in the frame. |
| Point Count | Number of point primitives rendered in the frame. |
| Draw Calls | Number of individual draw calls made during the frame. |

# Notes

<sup>1</sup>: The OBJ loader creates a `MultiResource` instance, as a single OBJ file may contain multiple vertex/index buffer definitions. It also operates as a loader for `.mtl` files which is a material file format used in conjunction with `.obj` files.

Individual components of an OBJ file may be retrieved using the resource system by treating the source file as a directory level.

For example, if we have a file `Resources/Models/Tree.obj` that defines the following: trunk mesh, top mesh, wood material, leaf material.

```
    auto trunkMesh = OcularResources->getResource<Graphics::Mesh>("Models/Tree/Trunk");
    auto trunkMat = OcularResources->getResource<Graphics::Material>("Models/Tree/Leaf");
```

As an alternative to manually retrieving each component of an OBJ, one may use the [`OBJImporter`](/docs/api/class_ocular_1_1_graphics_1_1_o_b_j_importer.html) class.

The importer loads a single OBJ file as a collection of `SceneObject`s. So the above example would be loaded as the following hierarchy:

```
    - SceneObject: Tree
    ----- SceneObject: Trunk
    --------- MeshRenderable: Trunk Mesh, Wood Material
    ----- SceneObject: Top
    --------- MeshRenderable: Top Mesh, Leaf Material
```

The editor application makes use of the `OBJImporter` when importing `SceneObject`s from OBJ files.

See the [OBJParser](http://www.vertexfragment.com/objparser/index.html) project page for more information on OBJ/MTL support.

<sup>2</sup>: Does not account for any primitives created or destroyed by geometry shaders.

