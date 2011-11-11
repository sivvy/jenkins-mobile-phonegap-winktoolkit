WINK


Components
----------

The "map.xml" file at the root of the project lists all the components of WINK.


Build
-----

In the "utils/build folder", you will find utilities to optimize WINK.
The "build_wink_core" target of the "build.xml" file, will build
the core of the kit. It will create a "wink" folder in the "utils/build" directory
and build the "wink.min.js" file (the concatenated and optimized core) that you should
use in your project.

The core is composed of:

- _amd
- _base/_base
- _base/_dom
- _base/_feat
- _base/_kernel
- _base/error
- _base/json
- _base/topics
- _base/ua
- fx/_xy
- net/xhr
- math/_basics
- ui/xy/layer
- ux/touch
- ux/event

If you want to build your own version of wink and add some more components,
you should first modify the "profiles.json" file to fit your needs and then just
run the default target of the build ("called "build_wink")


Documentation
-------------

For each component, there is an associated documentation. Documentations are 
XML files that can be found in the "doc" folder of each component. they are
associated to an XSL sheet, so you can directly watch them through your web
browser.


Utilities
---------

In the "utils" folder, you will also find a utility to base64 encode images.


Licence
-------

The WINK project is released under the "Simplified BSD license". See the 
"licence.txt" file for more details.