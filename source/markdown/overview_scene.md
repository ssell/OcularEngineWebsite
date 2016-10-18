# Scene System

Ocular employs a dynamic Scene system to represent virtual worlds. 

The core unit of this system is the `SceneObject`, which is managed by a global `SceneManager` implementation. Internally, dual `SceneTree`s are used to determine basic visibility and intersection checks.

These classes are discussed in more detail below.

# SceneManager

Central to the Scene system is the `SceneManager`. A single, global instance of this class is owned by the engine and may be accessed via `OcularScene`.

The manager is responsible for creating objects, updating scenes and scene trees, adjusting heritage (changing parent and/or children objects), loading and unloading scenes, and other similar actions.

The primary `update` and `render` calls are also performed by the global manager, though the end user does not typically need to call these as it is done automatically by the engine.

# Scenes

A `Scene` can be thought of as representing a single virtual world. It consists of dual scene trees which contain all of the objects that make up the world, as well as a variety of settings that globally affect them (such as ambient lighting, etc.).

As mentioned, double scene trees are employed with one containing static objects and the other dynamic objects. This allows for optimizations to be made regarding not only the content of the trees but also the type of trees in use. For example, a BSP tree may be used for all static objects while a BVH tree is employed for all dynamics.

Scenes can be loaded/saved to/from the disk in form of `.oscene` files (Ocular Scene). The scene manager is used to trigger a scene load or save:

```
// Load the specified .oscene file
OcularScene->loadScene("world.oscene");

// Save the currently loaded scene
OcularScene->saveScene("world.oscene");
```

When a scene is loaded, all objects that currently exist<pre>1</pre> are destroyed and the scene trees emptied. New objects are then created as specified by the scene file, and any setting changes are enacted.

## .oscene format

The `.oscene` format stands for 'Ocular Scene' and is written using XML. This allows for easy reading and writing of the file from both a human and code perspective.

These files are handled by the `SceneLoader` and `SceneSaver` classes (note that these are _not_ resources). The basic outline of an `.oscene` file is:

```
<OcularScene>
    <SceneHeader>
        <SceneTreeType>
            <Static>0</Static>
            <Dynamic>0</Dynamic>
        </SceneTreeType>
        <Renderer>
            <Type>ForwardRenderer</Type>
        </Renderer>
        <Lighting>
            <AmbientIntensity>0.4</AmbientIntensity>
            <AmbientColor>1.0 1.0 1.0 1.0</AmbientColor>
        </Lighting>
    </SceneTreeHeader>
    <SceneTree>
        <!-- Scene Objects -->
    </SceneTree>
</OcularScene>
``` 

As can be seen, there are two primary sections of a scene file: header and tree.

The `SceneHeader` sections contains a variety of settings that globally affect the entire scene. A list of all currently valid scene settings is below.

| Node | Value Type | Description |
|:-----|:----------:|:------------|
| `SceneTreeType::Static` | `int` | Identifier of implementation to use for static objects<sup>2</sup>. |
| `SceneTreeType::Dynamic` | `int` | Identifier of implementation to use for dynamic objects<sup>3</sup>. |
| `Renderer::Type` | `string` | String identifier of the type of renderer to use for the scene. |
| `Lighting::AmbientIntensity` | `float` | Intensity value of the ambient light source. |
| `Lighting::AmbientColor` | `Color` | Color value of the ambient light source. |

The `SceneTree` section contains all `SceneObject`s that are in the scene. For more information on the XML representation of `SceneObject`s, see the section on the `.opre` file format.

# SceneTrees

_Note: Core aspects of scene trees are slated to be renovated to allow for easier implementations in the future._



# SceneObjects

At the center of the Scene system is the `SceneObject` which represents a single object, or part of an object, in the world.

## Creating and Destroying 

All `SceneObject`s are maintained by the engine's `SceneManager` instance. Upon creation they register with it, and are added to the scene/scene trees/etc.

### Creation

To create a new object, one may either use the `SceneManager` or simply perform a `new`:

```
auto objectA = OcularScene->createObject("Generic Object A");
auto objectB = OcularScene->createObject<Camera>("Camera A", objectA);
auto objectC = OcularScene->createObjectOfType("Camera", "Camera B");
auto objectD = new SceneObject("Generic Object B"); 
```

An object may also be created via duplication, where it is an exact copy of another (except for unique identifier information).

```
auto sourceObject = ...;
auto duplicateObject = OcularScene->duplicateObject(sourceObject);
```

### Destruction

Objects may either be manually destroyed, or they will be destroyed when the scene is ended<sup>1</sup>.

To destroy an object manually:

```
OcularScene->destroyObject(object);
```

By default, this will destroy both the immediate object and all children.


## Components

Each `SceneObject` is composed of multiple key parts, which are detailed below.

**Transform**

Maintains the position, rotation, and scaling of the object. While the transform can be accessed directly via `SceneObject::getTransform()`, it is usually better practice to envoke the various helper methods that are part of `SceneObject` already. For example, retrieving the world position of an object:

```
// Using SceneObject helper method
auto worldPos = object->getPosition(false);

// Using Transform
auto transform   = object->getTransform();
auto localPos    = transform.getPosition();
auto modelMatrix = object->getModelMatrix(false);
auto worldPos    = modelMatrix * localPos;
```

### Identifier

Each `Object` (from which `SceneObject` inherits) has two different identifiers: a name and an UUID.

The name is a human-readable string, which is not unique. Any number of objects may share the same name, and names may be changed after creation.

```
auto oldName = object->getName();
object->setName("New Name");
```

Unique identifiers are provided in the form of an `UUID`, which can be converted to a string or 32/64-bit hash. The `UUID` can not be changed after creation and is unique across not only the local scene, but all engine runs. Internally, the `UUID` is the primary identifier of an object because of this guaranteed uniqueness.

```
UUID uuid = object->getUUID();
```

### Renderables

Responsible for rendering the object. Described in more detail below.

### Routines

Responsible for updating object logic. Described in more detail below.

### Parent and Children

A `SceneObject` may have zero or one parent objects, and an indefinite number of children.

Ancestry for objects is important as many properties, such as world position/rotation/scale, various different statuses, etc., are all influenced by the object's parent. 

Retrieving the parent object:

```
auto parent = object->getParent();

if(parent == nullptr)
{
    // top-level object with no parent
}
```

Retrieving child objects:

```
auto children = object->getAllChildren();

for(auto child : children)
{
    // ...
}
```

### Bounding Volumes

Each `SceneObject` has a variety of bounding volumes relating to it, which all can be queried in one of two ways. These include,

* Bounding Sphere
* Axis-Aligned Bounding Box (AABB)
* Orientated Bounding Box (OBB)

For each volume, one may retrieve either the local or 'world' bounds. The local bounds covers only the specific object to which it is associated, while the world bounds is fitted around both the immediate object and all children.

```
// Get local bounding sphere
auto localBounds = object->getBoundsSphere(true);

// Get world bounding sphere (covers children)
auto worldBounds = object->getBoundsSphere(false);
```

Typically, it is the responsibility of the attached renderable to update the bounding information for an object.

### Properties

Below is a table listing the various properties of a `SceneObject`. If the property is marked as cascading then it influences child object properties.

| Property Name | Cascades | Description |
|:--------------|:--------:|:------------|
| Position | &#10003; | Local position of the object, relative to parent. May also retrieve position relative to world origin. |
| Rotation | &#10003; | Local rotation of the object, relative to parent. May also retrieve rotation relative to world origin. |
| Scale | &#10003; | Local scale of the object, relative to parent. May also retrieve cumulative scaling. |
| IsStatic | &#10003; | If static is true, then it indicates that the object (typically) never moves, rotates, or adjusts it's scale. This determines which scene tree is belongs to, as well as other performance optimizations. Typically only the static/dynamic status of top-level (no parent) objects is taken into account. |
| IsActive | | If active is true, then the routines of this object will be invoked. |
| IsVisible | &#10003; | If visible is true, then the renderable of this will be invoked. Children can not be visible if the parent is not. |
| Persistent | &#10003; | If persistent is true, then the object (and all children) will persist inbetween scene changes. |
| Bounds | | Various bounding volumes surrounding the object. While bounds do not strictly cascade, parent bounds may be influenced by child bounds. |

### Notes on Persistence

As noted in the table above, one object property is persistence. By marking an object as persistent, several unique conditions apply to it:

* Will not be destroyed when the scene is unloaded
* Must be manually destroyed or will persist until engine shutdown
* Can not be saved to disk
* Can not be created directly in editor

So, a persistent object must be created programmatically and can not be saved to a specific scene. While at first this may seem limiting, there are several legitimate uses for a persistent object:

* Object representing a main character in a game. This will obviously exist beyond the confines of a single scene, and it is desireable to not have to constantly recreate it every scene change.
* The camera used to display the editor scene is persistent as it does not belong to any scene (as are the various gizmos).

## .opre format

# Renderables

A `Renderable` represents the visual aspect of a `SceneObject`, and it implements the `render` method that draws it. Typically, the renderable is also responsible for updating the bounding information of the object as it has access to the mesh or any other physical properties that may affect it.

Each renderable is identified by a unique name, which it registers itself with to the global scene manager. While manually creating a renderable is not a common task, it can be done as follows:

```
auto factory = OcularScene->getRenderableFactory();
auto renderable = factory.createComponent("MeshRenderable");

if(renderable)
{
    // ...
}
```

Each object may only have a single `Renderable` assigned to it at a time. To assign the renderable, use the `setRenderable` method:

```
SceneObject* object = ...;

// Renderable may either be set via a pre-made pointer
object->setRenderable(renderable);

// Or by using the Renderable's name
object->setRenderable("MeshRenderable");
``` 

The following renderable implementations are currently provided by the engine.
 
## MeshRenderable

...

## Limited Use Renderables

In addition to the above, there are numerous renderable implementations that see limited, specific, use in the engine. These include:

* `CameraRenderable`
* `PointLightRenderable`
* `AxisGizmoRenderable`

# Routines

A `Routine` provides an interface to implement custom logic to a `SceneObject`. Several callback methods are provided to override and respond to certain triggers during the normal engine cycle. These include:

| Method | Call Time |
|:-------|:----------|
| `onSceneStart` | Called when the active Scene is starting. |
| `onSceneEnd` | Called when the active Scene is ending. |
| `onCreation` | Called when the Routine is created. |
| `onDestruction` | Called when the Routine is destroyed. |
| `onPause` | Called when an event has triggered a Scene pause. |
| `onUnpause` | Called when an event has triggered a Scene unpause. |
| `onUpdate` | Called once per frame during the general engine update period (prior to rendering). Routine priority level dictates the order in which update methods are called. |
| `onTimedUpdate` | Called periodically according to the return value. For example, an `onTimedUpdate` that returns `60.0` will be called once a minute. |

Each `SceneObject` may have multiple `Routine`s attached to it, which is in contrast to `Rendrable`s, of which there may only be at most one.

Example `Routine` that moves the object along the x-axis:

**SampleRoutine.hpp**

```
#include "Scene/ARoutine.hpp"

class SampleRoutine : public Ocular::Core::ARoutine
{
public:

    SampleRoutine();
    virtual ~SampleRoutine();

    virtual void onUpdate(float delta) override;

protected:

private:
};
```

**SampleRoutine.cpp**

```
#include "SampleRoutine.hpp"

#include "OcularEngine.hpp"
#include "Scene/RoutineRegistrar.hpp"

OCULAR_REGISTER_ROUTINE(SampleRoutine, "SampleRoutine");

//------------------------------------------------------------------------

SampleRoutine::SampleRoutine()
    : Ocular::Core::ARoutine("SampleRoutine", "SampleRoutine")
{
    
}

SampleRoutine::~SampleRoutine()
{

}

void SampleRoutine::onUpdate(float const delta)
{
    if(m_Parent)
    {
        m_Parent->translate(Ocular::Math::Vector3f::Right() * delta);
    }   
}
```

The above should all be straightforward, with possible exception to the `OCULAR_REGISTER_ROUTINE` macro.

This macro registers the routine as a public routine implementation with the engine. By registering it, we can create instances of this specific routine using just the string identifier. For example:

```
SceneObject* object = ...;
object->addRoutine("SampleRoutine");
```

Registering the routine also makes it accessible in the editor application to add to objects.

If a routine is not registered, it can still be used but must be explicitly referenced.

```
#include "SampleRoutine.hpp"

// ...

object->addRoutine(new SimpleRoutine());
```

Note that in the above, the object will take ownership of the routine and handle all necessary clean-up.

# Camera

Cameras are a special `SceneObject` implementation, and are handled separately through the global camera manager.

Each camera has the following properties:

* Transform (inherited from `SceneObject`)
* Projection (Perspective or Orthrographic)
* View Frustum (defined by the projection)
* Viewport
* Render Texture
* Depth Texture
* Clear Color
* Priority Level
* Layer (not yet implemented)

For each frame, the scene is rendered once per camera in the order specified by the priority levels.

To create a new camera,

```
auto camera = OcularScene->createObject<Ocular::Core::Camera>("Camera");

if(camera)
{
    Ocular::Core::PerspectiveProjection projection;

    projection.fieldOfView = fov;
    projection.aspectRatio = aspectRatio;
    projection.nearClip    = near;
    projection.farClip     = far;

    camera->setProjectionPerspective(projection);
    camera->addRoutine("FreeFlyController");
}
```

At any point in time there are two camera designations of interest: the main camera and the active camera.

The main camera denotes the primary camera. For example, in a shooter this would be the camera showing the player's perspective. The active camera is the camera currently being rendered. This might be a security camera whose render target is displayed on an in-game computer monitor.

Cameras may be retrieved using the global camera manager instance:

```
auto mainCamera   = OcularCameras->getMainCamera();
auto activeCamera = OcularCameras->getActiveCamera();
auto allCameras   = OcularCameras->getCameras();

for(auto camera : allCameras)
{
    // ...
}
```

By default, the first camera created is designated the main camera. After initialization, the main camera may be specified using:

```
OcularCameras->setMainCamera(camera);
```

## Screenshot

A common task for both debugging and production is to print out what a camera sees. This is often a convoluted exercise in many engines, especially with regards to how basic it is. 

This operation, however, is made simple in Ocular due to the Resource system.

```
auto camera  = OcularCameras->getMainCamera();
auto texture = camera->getRenderTexture();
auto file    = Ocular::Core::File("screenshot.png");

if(!OcularResources->saveResource(texture, file))
{
    OcularLogger->error("Failed to save camera screenshot");
}
```

# Object I/O

The Object I/O system is used to both access and load/save objects in a generic manner. All classes that inherit from `Object` is part of this system, while other may opt-in by inheriting from one or both of the `Exposable` and `Buildable` classes.

While the intricacies of this system are beyond the scope of this overview, the two classes that implement it will be covered briefly below.

## Exposable

By inheriting from `Exposable`, one is giving full-access to selected variables. 

What this means is that if a class inherits `Exposable` and it exposes a certain variable, then any other class may have full access to that variable, even if it is private.

To expose a variable, simply invoke the proper macro:

**SimpleObject.hpp**

```
class SimpleObjectClass : public Ocular::Core::SceneObject
{
public:

    SimpleObject(std::string const& name, Ocular::Core::SceneObject* parent);
    virtual ~SimpleObject();

protected:

private:

    float m_MovementSpeed;
};
```

**SimpleObject.cpp**

```
SimpleObject::SimpleObject(std::string const& name, Ocular::Core::SceneObject* parent)
    : Ocular::Core::SceneObject(name, parent, "SimpleObject")
{
    OCULAR_EXPOSE(m_MovementSpeed);
}
```

Any type or class that has a registered to/from string conversion may be exposed. This includes: all primitives, vectors, matrices, quaternions, strings, etc.

So why would one want to expose their variables? Well, there are two main reasons:

* Automatic saving/loading of the variable if part of an `Object` implementation (`SceneObject`, `Camera`, etc.)
* Variable is visible (and modifiable) in the editor application

The engine itself will only ever access exposed variables during load/saving and editor inspection, though this guarantee does not extend to external code.

## Buildable

The `Buildable` class provides a manual alternative to the automatic `Exposable` (though it is often used in conjunction). By inheriting from `Buildable`, a class gets the following virtual methods:

* `onLoad(BulderNode const* node)`
* `onSave(BuildNoder* node)`

This allows for manual loading/saving capabilities for complex classes that can not be exposed, or for simpler types that one may simply not want to make public. 

How one interprets a `BuilderNode` is up to their implementation, but each node contains the following information:

* Name
* Value
* Type
* Parent Node
* Child Nodes

The name/value/type properties are all represented as strings. The value may be converted to a specific type using the string utils:

```
auto value = node->getValue();
float fvalue = OcularString->fromString<float>(value);
```

For loading/saving purposes, the builder node chain is typically converted to/from XML. A typical XML represenation:

```
<var name="m_MovementSpeed" type="float" value="2.5" />
```

A simple example of implementing the `onLoad`/`onSave` methods:

**SimpleObject.hpp**

```
class SimpleObject : public Ocular::Core::SceneObject
{
public:

    SimpleObject(std::string const& name, Ocular::Core::SceneObject* parent);
    virtual ~SimpleObject();

    virtual void onLoad(BuilderNode const* node) override;
    virtual void onSave(BuilderNode* node) override;

protected:

private:

    float m_MovementSpeed;
    ComplexClass* m_ComplexClass;    // Complex class that also inherits Buildable
};
```

**SimpleObject.cpp**

    SimpleObject::SimpleObject(std::string const& name, Ocular::Core::SceneObject* parent)
        : SceneObject(name, parent, "SimpleObject"),
          m_ComplexClass(nullptr)
    {
    
    }

    SimpleObject::~SimpleObject()
    {
        delete m_ComplexClass;
        m_ComplexClass = nullptr;
    }

    void SimpleObject::onLoad(BuilderNode const* node)
    {
        SceneObject::onLoad(node);

        if(node)
        {
            auto movementNode = node->getChild("m_MovementSpeed");

            if(movementNode)
            {
                m_MovementSpeed = OcularString->fromString<float>(movementNode->getValue());
            }

            auto complexNode = node->getChild("m_ComplexClass");

            if(complexNode)
            {
                if(!m_ComplexClass)
                {
                    m_ComplexClass = new ComplexClass();
                }

                m_ComplexClass->onLoad(complexNode);
            }
        }
    }

    void SimpleObject::onSave(BuilderNode* node)
    {
        SceneObject::onSave(node);

        if(node)
        {
            auto movementNode = node->addChild("m_MovementSpeed", Ocular::Utils::TypeName<float>::name, OcularString->fromString<float>(m_MovementSpeed);
    
            if(m_ComplexClass)
            {
                auto complexNode = node->addChild("m_ComplexClass", m_ComplexClass->getClass(), "");
                m_ComplexClass->onSave(complexNode);
            } 
        }
    }

### Special Uses

The `Buildable` interface can sometimes be used to create copies of a complex class. For example, this is done when duplicating objects in the editor application and is often done when making one-off copies of a resource (such as a `Material`).

    // Make a copy of a Material that we can modify locally

    auto sourceMaterial = OcularResources->getResource<Ocular::Graphics::Material>("path/to/material");
    auto copyMaterial = OcularGraphics->createMaterial();

    if(sourceMaterial && copyMaterial)
    {
        Ocular::Core::BuilderNode node;

        sourceMaterial->onSave(node);
        copyMaterial->onLoad(node);
    }
# Notes

<sup>1</sup> Unless the object is marked as persistent

<sup>2,3</sup> Slated to be changed to string identifiers in the near future
