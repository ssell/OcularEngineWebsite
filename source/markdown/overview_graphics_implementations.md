# Graphics Implementations

The graphics library described in the [Graphics Library Overview](/ocular-engine/docs/overview/overview_graphics_library.html) is a generic API, and does nothing without an implementation. Below, the available implementations are briefly described.

Currently, all implementations are provided as static libraries, but this functionality is slotted to be changed to a dynamic approach to allow for easier development, as well as potential runtime API swaps.

# Direct3D 11

A Direct3D 11 implementation of the graphics library is [available](https://github.com/ssell/OcularEngine/tree/master/OcularD3D11) as a static library. 

To make use of the D3D11 library, the following steps must be taken:

* Link against the `OcularD3D11_#` library (where `#` is the compiler version, such as `msvc140`).
* Initialize the engine with an instance of the `D3D11GraphicsDriver` class.<sup>1</sup>

```
    if(OcularEngine.initialize(new Ocular::Graphics::D3D11GraphicsDriver()))
    {
        // ...
    }
``` 

At this point, D3D11 versions of most graphics classes will be available. Such as: `D3D11Texture2D`, `D3D11VertexShader`, `D3D11Material`, etc.

These classes should generally never be directly created, but instead the helper methods provided by the driver implementation should be used. This helps to keep code generic and portable between API implementations.

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

# OpenGL 4

_Feature not yet implemented. Expected in a [future release](/ocular-engine/roadmap.html)._

# Other

While there are no immediate plans for graphic implementations beyond D3D11 and OpenGL 4, there is a desire to one day support the following APIs:

* Direct3D 12
* Vulkan

When support for these will be available is dependent on a variety of factors including need, time available, and architecture accessibility. 

# Notes

<sup>1</sup>: These initialization steps will change drastically once the implementation libraries are dynamic.
