# Effects

# Lighting

Light in Ocular is implemented through four different types of light sources, which are managed by the `LightManager` instance accessible via `OcularLights`.

Below each of the main components of the light system is described in more detail.

## Light Sources

### Point Light

A `PointLight` is a light source that emits in all directions around it's origin. These light sources are not affected by their orientation, but do have a range and attenuation factor. It inherits from `LightSource` which inherits from `SceneObject`.

The following properties affect point light sources:

| Property | Description |
|:---------|:------------|
| Intensity | Represents the brightness of the light. Range of `[0, FloatMax]`. |
| Color | Color of the emitted light. |
| Range | Distance at which the light stops influencing the scene. |
| Attenuation | Constant-Linear-Quadratic attenuation modifier<sup>2</sup> which affects light falloff. |
| Position | Position of the light source within the scene. |

A point light may either be created programmatically or within the editor application.

To create programmatically:

```
auto light = OcularScene->createObject<Ocular::Core::PointLight>("A Light");
```

or

```
auto light = OcularScene->createObjectOfType("PointLight", "A Light");
```

Within the editor, a point light may either be created from the main menu (`Scene → Add Light → Point Light`), or via the scene tree widget context menu.


### Directional Light

A `DirectionalLight` is a light source that emits light in a single direction across the entire scene. These light sources are not affected by their position. `DirectionalLight` inherits from `LightSource` which inherits from `SceneObject`.

The following properties affect directional light sources:

| Property | Description |
|:---------|:------------|
| Intensity | Represents the brightness of the light. Range of `[0, FloatMax]`. |
| Color | Color of the emitted light. |
| Orientation | Direction the light is facing, and thus emitting from. |

A directional light may either be created programmatically or within the editor application.

To create programmatically:

```
auto light = OcularScene->createObject<Ocular::Core::DirectionalLight>("A Light");
```

or

```
auto light = OcularScene->createObjectOfType("DirectionalLight", "A Light");
```

Within the editor, a directional light may be created from the main menu (`Scene → Add Light → Directional Light`), or via the scene tree widget context menu.

### Spot Light

_Feature not yet implemented. Expected in [current release in progress](/roadmap.html)._

### Ambient Light

Ambient lighting affects all surfaces evenly, no matter their orientation, position, or material properties. The ambient light settings represent the darkest your scene may be, and thus will differ greatly between a cave and an open field at noon.

The following properties affect ambient lighting:

| Property | Effect |
|:---------|:-------|
| Intensity | Represents the brightness of the light. Range of `[0, 1]`. |
| Color | Color of the ambient light. |

Setting the ambient light properties can be done either programmatically or via the editor application.

Example of setting ambient light programmatically:

```
    OcularLights->setAmbientLightColor(Core::Color(0.3f, 0.3f, 0.4f, 1.0f));
    OcularLights->setAmbientLightIntensity(0.1f);
```

Ambient properties can be accessed in the editor via `Scene → Scene Properties → Ambient Color/Intensity`. 

Ambient properties are also saved as part of the scene file when calling `OcularScene->saveScene` or saving in the editor.

## Light Manager

The `LightManager` class is responsible for tracking all light sources within a scene.

Whenever a new `LightSource` instance is created, it automatically registers itself with the light manager, and unregisters itself during destruction.

During pre-render operations, it is up to the active renderer implementation to call the light manager's `updateLight` method. When called, this triggers the manager to determine which lights affect the visible scene, done via simple frustum culling. All visible lights are then converted to `GPULight` instances, packed in a buffer, and uploaded to the GPU.

### GPU Light

The `GPULight` structure is a generic light description that is used by all light sources on the GPU. It is defined as follows:

| Type | Name | Description |
|:----:|:-----|:------------|
| `float4` | Position | Light source position. |
| `float4` | Direction | Normalized forwards vector. |
| `float4` | Color | Light color (RGBA). |
| `float4` | Attenuation. | `.x`: constant term; `.y`: linear term; `.z`: quadratic term; `.w`: range |
| `float4` | Parameters | `.x`: intensity; `.y`: angle; `.z`: type<sup>1</sup>; `.w`: unused |

For D3D11, all lights are passed over in a single `StructuredBuffer` which is bound to register `Ocular::Core::LightManager::LightBufferSlot`.

The order in which light sources are provided is currently not guaranteed, except for that index `0` will always represent the ambient lighting. In addition to this, the `type` parameter for ambient will instead contain the number of lights to render/in the buffer (including ambient).

HLSL example:

```
    struct GPULight
    {
        float4 position;
        float4 direction;
        float4 color;
        float4 attenuation;
        float4 parameters;
    };

    StructuredBuffer<GPULight> _LightBuffer : register(t8);

    // ...

    {
        const float4 ambient = _LightBuffer[0].color * _LightBuffer[0].parameters.x;

        [loop]
        for(uint i = 1; i < (uint)(_LightBuffer[0].parameters.z); ++i)
        {
            // ...
        }
    }
```

## BRDFs

Bidirectional Reflectance Distribution Functions (BRDFs) describe how light is reflected by a surface, and are an essential part of the lighting equation.

### Phong 

An implementation of the Phong BRDF is available in the [OcularLighting](https://github.com/ssell/OcularEngine/blob/master/Resources/OcularCore/Shaders/OcularLighting.hlsl) shader.

See: `calcRadiancePhong`.

This is currently the BRDF employed by the [Default shader](https://github.com/ssell/OcularEngine/blob/master/Resources/OcularCore/Shaders/Default.hlsl).

### Blinn-Phong

_Feature not yet implemented. Expected in [current release in progress](/roadmap.html)._

### Ashikhmin-Shirley

_Feature not yet implemented. Expected in [current release in progress](/roadmap.html)._

# Shadows

_Feature not yet implemented. Expected in [current release in progress](/roadmap.html)._

# Particle Systems

_Feature not yet implemented. Expected in a [future release](/roadmap.html)._

# Terrain

_Feature not yet implemented. Expected in a [future release](/roadmap.html)._

# Notes

<sup>1</sup>: `0`: none/unknown; `1`: point light; `2`: spot light; `3`: directional light.

<sup>2</sup>: The attenuation formula used is:

<div style="margin: 10px; margin-left: 50px;"><math><mfrac><mrow><mn>1</mn></mrow><mrow><mi>C</mi><mo>+</mo><mi>L</mi><mo>*</mo><mi>d</mi><mo>+</mo><mi>Q</mi><mo>*</mo><mi>d</mi><mo>*</mo><mi>d</mi></mrow></mfrac></math></div>

Where,

* `d`: Distance from light source.
* `C`: Constant term. Typically `1.0`
* `L`: Linear term. Typically `0.0`
* `Q`: Quadratic term. Typically `(0, 10]`

See [the function plotted](https://www.desmos.com/calculator/rrwcwrkuc7).
