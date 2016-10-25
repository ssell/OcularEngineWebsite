# Core Dependencies

Archives containing header files and pre-built binaries for select architectures may be found below.

Each archive contains all dependencies to build the Core engine library. This includes:

* [Boost Filesystem v1.6.0](http://sourceforge.net/projects/boost/)
* [Boost System v1.6.0](http://sourceforge.net/projects/boost/)
* [libpng v1.6.20](http://sourceforge.net/projects/libpng/files/)
* [zlib v1.2.8](http://www.zlib.net/)
* [pugixml v1.7](http://pugixml.org/)
* [GLM v0.9.7.1](https://github.com/g-truc/glm/releases)
* [OBJParser v1.0](http://www.vertexfragment.com/objparser/index.html)

| Date | Architecture | Name |
|:----:|:------------:|:--------:|
| October 05, 2016 | MSVC 140 | [OcularExternalDependencies\_MSVC14\_10052016.zip](https://s3.amazonaws.com/ocularengine/OcularExternalDependencies_MSVC14_10052016.zip)
| October 05, 2016 | MSVC 120 | [OcularExternalDependencies\_MSVC12\_10052016.zip](https://s3.amazonaws.com/ocularengine/OcularExternalDependencies_MSVC12_10052016.zip) |

## OcularD3D11 Project

The Ocular D3D11 project naturally has an additional dependency requirement of the DirectX SDK. [Where is the DirectX SDK?](https://msdn.microsoft.com/en-us/library/windows/desktop/ee663275(v=vs.85).aspx)

## OcularEditor Project

The Ocular Editor application is built using [Qt 5.6](https://wiki.qt.io/Qt_5.6_Release). 

For ease-of-use, the [QtPackage](https://visualstudiogallery.msdn.microsoft.com/c89ff880-8509-47a4-a262-e4fa07168408) plugin is used to integrate Qt 5 with Visual Studio 2015.
