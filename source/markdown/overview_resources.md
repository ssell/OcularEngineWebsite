# Resource System

Ocular features a flexible and easy-to-use resource system which makes working with external resources as simple as possible.

To begin, a `Resource` is defined loosely as a collection of data that can, and typically is, stored on disk. All managed resources are shared, meaning there is only one instance in memory even if the same resource is used by multiple objects.

Ocular defines the following resource types:

* Texture
* Mesh
* Material
* Shader
* ShaderProgram
* Data
* Multi-Resource

While one may directly create a `Resource`, it is much more common to interact with the aptly named `ResourceManager`.

All on-disk resources are expected to reside in a `Resources` directory, which by default is expected on the same level as the executable (see `ResourceManager::setSourceDirectory` to change this at runtime).

# Resource Manager

The `ResourceManager` is responsible for loading, saving, tracking, allocating space, freeing memory, and anything else related to resource management. Perhaps the best way to cover the `ResourceManager`, and the resource system as a whole, is with a series of simple examples of common actions.

## Retrieving a Resource

The most often used `ResourceManager` method is `getResource`. This will seach for a resource with the specified mapping name and return it if it exists. If the resource is not in memory, then the manager will automatically allocate space and load it.

Before we a code example is shown, we should explain what a resource mapping name is. Simply put, this is an unique string identifier for every resource available. For ease-of-use, mapping names are the relative path from the `Resources` directory.

For example, if we have the following directory structure:

```
OcularProject/
    Resources/
        Textures/
            Buildings/
            Terrain/
                Grass.png
                Sand.bmp
```

The mapping names for the grass and sand textures would be:

```
"Textures/Terrain/Grass"
"Textures/Terrain/Sand"
```

Note that the file extension is not part of the mapping name. This behaviour has both pros and cons. 

By not including the extension in the uniquely-identifying mapping name it means the higher-level user does not need to be concerned about specific file formats, or if the artist decided to replace all `.bmp` files with `.png`, or if model meshes are now using `.obj` instead of `.ply`.

The downside is that naming conflicts may occur if one has two or more resources in the same directory with matching names, but different formats (i.e. `Grass.png` and `Grass.bmp`). In which case, the first of these resources discovered will be the one used.

Now with our mapping name in hand we can retrieve our resource:

```
auto grassTex = OcularResources->getResource("Textures/Terrain/Grass");
```

The above will return the resource as a generic `Resource*`. If we already know the type of resource, we can do the following:

```
auto grassTex = OcularResources->getResource<Texture>("Textures/Terrain/Grass");
```

Which returns a `Texture*`.

## Saving a Resource

Saving a resource to disk is as simple as retrieving one:

```
auto resource = OcularResource->getResource("Path/To/Resource");

if(resource)
{
    // ... modify resource ...

    OcularResources->saveResource(resource, resource->getSourceFile());
}
```


## Destroying a Resource

All managed resources are governed by the `ResourceManager` and shared throughout the engine. Because of this, a resource may not be destroyed as this could have negative consequences elsewhere.

While memory use is automatically managed by the `ResourceManager`, one may explicitly unload a resource from memory. While the resource object itself will still be valid, any underlying data (such as texture pixels, mesh vertices, etc.) will be cleared away.

This may be useful if one knows they are done with a particular resource (scene change, etc.).

```
auto resource = OcularResources->getResource("ExampleResource");

// ...

resource->unload();
```

It should be noted that a resource that has been unloaded will be loaded into memory again the next time it is requested via `getResource`. So calling `unload` when the resource is still active can prove to be detrimental by causing needless, and potentially very expensive, loads.

One can also check if the underlying data of a resource is in memory:

```
if(!resource->isInMemory())
{
    resource->forceLoad();
}
```

A benefit of having all resource managed by the `ResourceManager` is that there is no need for the user to worry about manual clean-up.

## Unmanaged Resources

There may be times where one wants to load a resource from outside of the `Resources` directory, or to load a copy of a managed resource (remember, all managed resources are shared).

For these situations one may create an unmanaged resource. These resources will be loaded by the `ResourceManager`, but will belong exclusively to the caller once created. Which means proper clean-up is required.

```
auto resource = OcularResources->loadUnmanagedResource("apple.png");

if(resource)
{
    // ...

    resource->unload();

    delete resource;
    resource = nullptr;
}
```

## Refreshing Resource Map

By default, the internal map of all resources is only generated once at engine initialization. If the contents of the `Resource` directory are known to, or expected to, change then this map may be refreshed to account for any newly added resources.

```
OcularResources->forceSourceRefresh();
```

# Resource Loaders and Savers

Resources are loaded and saved via a series of `ResourceLoader` and `ResourceSaver` implementations.

For a given file extension to be considered a valid resource file, there must be a loader or saver associated with it. The following file formats are currently supported by the engine:

| Extension | Type | Loader | Saver |
|:---------:|:-----|:------:|:------:|
| `.png`    | Texture | &#10003; | &#10003; | 
| `.bmp`    | Texture | &#10003; | &#10003; |
| `.tga`    | Texture | &#10003; | |
| `.ply`    | Mesh | &#10003; | &#10003; |
| `.obj`    | Multi<sup>1</sup> | &#10003; | |
| `.hlsl`   | ShaderProgram | &#10003; | |
| `.mtl`    | Material<sup>2</sup> | &#10003; | |
| `.omat`   | Material | &#10003; | &#10003; |

Additional loaders and savers can be easily added by creating a new implementation of the `ResourceLoader` and `ResourceSaver` classes. Minimal example:

**ResourceLoader_XYZ.hpp**

```
class ResourceLoader_XYZ : public ResourceLoader
{
public:

    ResourceLoader_XYZ();
    virtual ~ResourceLoader_XYZ();

    virtual std::string getSupportedFileType() const override;
    virtual bool loadResource(Resource* &resource, File const& file, std::string const& mappingName) override;

protected:

private:
};
```
**ResourceLoader_XYZ.cpp**

```
#include "ResourceLoader_XYZ.hpp"
#include "Resources/ResourceLoaderRegistrar.hpp"

OCULAR_REGISTER_RESOURCE_LOADER(ResourceLoader_XYZ);

ResourceLoader_XYZ::ResourceLoader_XYZ()
    : ResourceLoader(".xyz", ResourceType::Texture)
{

}

ResourceLoader_XYZ::~ResourceLoader_XYZ()
{

}

std::string ResourceLoader_XYZ::getSupportedFileType() const
{
    return ".xyz";
}

bool ResourceLoader_XYZ::loadResource(Resource* &resource, File const& file, std::string const& mappingName) override
{
    bool result = false;

    // ...

    return result;
}
```

In addition to the base loader/saver parent classes, there are several helper 'halfway' implementations that abstract away many of the common tasks. These include:

* `Graphics::TextureResourceLoader`
* `Graphics::TextureResourceSaver`
* `Graphics::MeshResourceLoader`
* `Graphics::MeshResourceSaver`

# Notes

<sup>1</sup> _A single OBJ file can map to multiple Mesh and Material resources_

<sup>2</sup> _Handled indirectly during OBJ loading_
