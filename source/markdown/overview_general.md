# General Engine Functionality

Collection of features that are expected to be found in any engine, but are not directly related to graphics or rendering. Nearly all of these were implemented before a single line of the graphics library was written.

## Logger

An easy-to-use and versatile logging system is an essential part of any engine, large or small. 

The logger for Ocular is implemented as a central logger class to whom listeners may register. These listeners can be implemented in any form, and simply have to inherit the `onLogMessage` method. Multiple loggers already exist in the engine, including:

* ConsoleLogger: Prints log messages to the window console (if console is present).
* VSConsoleLogger: Prints log messages to the Visual Studio debugger output console.
* ConsoleText: Prints log messages to the Ocular Editor console widget.

Writing to the logger, and thus to all listeners, can be done as follows:

``` 
OcularLogger->error("An error has occurred!"); 
```

Where the method may be any of the following: fatal, error, warning, debug, info.


Multiple parameters may be passed to the logger, which will automatically concatenate the message.

``` 
OcularLogger->info("The time is ", hour, ":", minute, ":", second); 
```

Internal logging also makes use of the `OCULAR_INTERNAL_LOG` macro which helps in provided exact Class/Method/Line information which is especially useful for error logging.

## Event System

A simple event system is provided in order to allow for easy communication between disparate systems. Custom events are easy to add, and a number of events are already in use by both the engine and editor.

All events are generated by a central manager who then distributes the event to registered listeners. Listeners assign themselves a priority which determines the order in which they receive an event through their `onEvent` method.

Example of generating and then receiving an Event:

```
void EventGenerator::mouseWheelEvent(uint32_t const delta)
{
    // Generate a mouse wheel movement event
    OcularEvents->queueEvent(std::make_shared<MouseScrollInputEvent>(delta));
}

EventReceiver::EventReceiver()
{
    OcularEvents->registerListener(this, Priority::Medium);
}

bool EventReceiver::onEvent(std::shared_ptr<Core::AEvent> event)
{
    if(event->isType<MouseScrollInputEvent>())
    {
        // ...
    }

    // Return true to not consume the event
    return true;
}
```

Events may either be queued or triggered. A queued event is placed in a queue and then distributed during the next update cycle. A triggered event is distributed immediately to listeners.

## File / Directory 

`File` and `Directory` classes are available for easy, cross-platform navigation of file systems. A number of utility features are available, including: path/name/extension separation, discovering child files/subdirectories, file/directory creation, etc.

Internally, the `File` and `Directory` classes are essentially wrappers around Boost classes but proposed additions in C++17 will see a rewrite of the `File` and `Directory` classes.

Example of retrieving the first file in a directory:

```
Directory dir("test");
dir.explore();

auto files = dir.getChildFiles();

if(files.size())
{
    const auto extension = files[0].getExtension();
    OcularLogger->info("First file has extension of ", extension);
}
else
{
    OcularLogger->info("Directory contains no files.");
}
```

## Timing

Time functionality is provided via two different classes: `Clock` and `Timer`.

A clock can provide time as two different deltas: epoch or creation. Epoch delta time is the amount of time elapsed since January 1, 1970. Creation delta time is the amount of time elapsed since the `Clock` instance was created.

All time deltas can be retrieved as either milliseconds or nanoseconds, depending on the amount of precision required.

The timer is used as a stopwatch with start, stop, and reset methods. 

Example of retrieving amount of time since Ocular Engine initialization:

```
const auto lifetime = OcularClock->getElapsedMS();
OcularLogger->info("Engine has been running for ", (lifetime / 1000), " seconds.");
```

Example of hard pausing for a second:

```
Timer timer;
timer.start();

while(timer.getElapsedMS() < 1000);

timer.stop();
```

## Keyboard / Mouse Input

Keyboard and mouse input is handled via a state system defined in `OcularInput` and input-related events.

At any time the state of the keyboard and mouse can be queried, including:

* Keyboard key state (pressed, released)
* Keyboard modifiers
* Mouse button state (pressed, released)
* Mouse position

Events are also generated whenever the state of a keyboard key, mouse button, mouse position, or mouse scrollwheel is changed.

All system input events are handled (and translated for Ocular) in Window implementations. For Windows this is done by receiving the raw device input.

Keys that require modifiers (such as `1` vs `!`) are treated distinctly, and so can be directly queried. For example, 

```
auto keyOne = KeyboardKeys::Mainpad1;
auto keyExclamation = KeyboardKeys::ExclamationMark;

if(OcularInput->isKeyboardKeyDown(keyOne))
{
    OcularLogger->info("1");
}
else if(OcularInput->isKeyboardKeyDown(keyExclamation))
{
    OcularLogger->info("!");
}
``` 

Distinctions are also made between mainpad and numpad keys.

## Window Creation

Window creation is performed in a single call to the central `WindowManager` implementation which can be accessed via `OcularWindows`.

Example:

```
WindowDescriptor descr;

descr.displayName   = "Test Window";
descr.width         = 800;
descr.height        = 600;
descr.displayMode   = WindowDisplayMode::WindowedBordered;
descr.exclusiveMode = false;

if(OcularWindows->openWindow(descr))
{
    OcularWindows->getMainWindow()->showCursor(false);
}
```

Internally, system specific implementations are provided such as `WindowWin32`. A variety of miscellaneous methods and tasks are associated with these window implementations, including system-level event and input intercepting.

## Utilities

There are numerous miscellaneous utilities in use throughout the engine. The following are some of the most commonly employed.

### String Utilities

A collection of string-based utilities can be found by envoking `OcularString` (or some may be statically accessed via Utils::String). These cover the following common string operations:

* Convert to lower/upper case
* Equality check, including case sensitivity
* Substring containment
* Split/tokenizing
* String conversions

The most widely used of these is string conversion methods that allow one two convert a string to/from nearly any type or commonly used class.

For example, converting to and from a Vector4f is as simple as:

```
Vector4f vec(1.0f, 1.0f, 1.0f, 1.0f);
OcularLogger->info(OcularString->toString(vec));

std::string str = "1.0 2.0 3.0 4.0";
vec = OcularString->fromString<Vector4f>(str);
```

### Hash Generator

The `HashGenerator` utility provides a simple and efficient means to generate integer hashes from any string. Internally it implements the [FNV-1A](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function#FNV-1a_hash) algorithm.

It can generate both 32 and 64-bit hashes.

Example:

```
const std::string str = "Hello World";
const auto hash = OcularEngine.HashGenerator()->getHash32(str);
```

### Endian Operators

A series of functions are provided under the `Ocular::Utils::EndianOps` namespace to help in converting between big and little endian values. 

These functions come in two different flavors: converting to a known endian type, or converting to the reverse endianness.

For example, if we know we have a big endian value that we wish to convert to little endian (a common scenario when working with files), then we can do the following:

```
uint32_t bigInt = ...;
uint32_t littleInt = EndianOps::convert(Endianness::Big, Endianness::Little, bigInt);
```

We can also convert to whatever the native endianness may be (in which case no action may be taken):

```
uint32_t native = EndianOps::convert(Endianness::Big, Endianness::Native, bigInt);
```

### TypeName

The `TypeName` utility is relatively simple, but is crucial for many key systems. All it does is provide a string representation of any primitive type and most commonly used Ocular classes. 

Example:

```
OcularLogger->info(TypeName<float>::name);
// "float"

OcularLogger->info(TypeName<Matrix4x4>::name);
// "Matrix4x4"
```

Associating a string name with a type/class is as simple as invoking one of two different macros. One will automatically assign a name, while the other lets you specify a custom name string.

```
OCULAR_REGISTER_TYPE(CustomClass);
OCULAR_REGISTER_TYPE_CUSTOM(CustomClass, "Custom Class");
```

### Void Cast

Another commonly used helper utility is `void_cast` which, well, casts to/and from `void*`.

Example:

```
float valueA = 55.0f;

void* voidp  = void_cast<float>(valueA);
float valueB = void_cast<float>(voidp);

// valueB == 55.0f
```

## General Math Library

A general purpose math library is provided with support for:

* Vector2
* Vector3
* Vector4
* Matrix3x3
* Matrix4x4
* Euler
* Quaternion

All common functionality is available (such as length, dot/dross product, inverse, matrix projection, etc.), and full conversions between like-types (Rotation Matrix <-> Quaternion <-> Euler Angle).

Internally, the general math classes employ the [GLM](http://glm.g-truc.net/) library. Initially Ocular had a custom library created from scratch, but it was later deemed that it would be easier and safer to make use of an established mathematics library.

As with all other dependencies, GLM is kept completely hidden from outside sources so that it is only a dependency for the core library.

## Psuedo-Random Number Generators

Access to a proper PRNG is important for both general-purpose and graphics related programming. Since not all PRNGs are created equal, and some better suit certain tasks than others, a number of implementations are available.

These include:

* Mersenne Twister (MT19937)
* Tiny Mersenne Twister (MT127)
* Well Equidistributed Long-Period Linear (WELL512)
* Complementary-Multiply-With-Carry (CMWC131104)
* XorSHift (XOR96)

All PRNGs implement the same interface, and thus can be swapped out for one another easily.

Example:

```
auto prng = Random::CreatePRNG(PRNG::XorShift);
auto rand = prng.next(0, 100);

OcularLogger->info("Random value between 0 and 100: ", rand);
```

## Noise Generators

Coherent noise is another important tool used by graphics programmers, and so naturally Ocular provides multiple noise implementations. Like the PRNGs, these all inherit from the same base class and can be easily swapped out.

* Perlin Noise
* Simplex Noise
* Wavelet Noise

Additional noise algorithms are ready, but have not yet been fully integrated (Worley, Diamond-Square, etc.).

Example:

```
PerlinNoise noise;
auto value = noise.getValue(x, y);
```

As noise generators are most commonly used in conjuction with 2D textures, there is a special texture class called `NoiseTexture2D` that automatically generates textures using a provided noise instance.

## Bounds and Intersections

While Ocular makes no attempts (yet) to implement a physics engine, basic intersection testing remains a cruical tool for many rendering and effect algorithms. The following intersection geometries are available:

* Bounding Sphere
* Axis-Aligned Bounding Box (AABB)
* Orientated Bounding Box (OBB) (partial)
* Plane
* Ray
* Frustum

Example of performing a simple ray/sphere intersection test:

```
BoundsSphere sphere(Vector3f(0.0f, 0.0f, 0.0f), 10.0f);
Ray ray(Vector3f(0.0f, 0.0f, -5.0f), Vector3f(0.0f, 0.0f, 1.0f));

Vector3f point;
float dist = 0.0f;

if(ray.intersects(sphere, point, dist))
{
    OcularLogger->info("Ray intersects sphere at ", OcularString->toString(point));
}
```