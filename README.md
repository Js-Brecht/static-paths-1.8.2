# Serving additional static paths from SPFx local workbench

This walks you through how to implement a patch in order to get the local workbench to work using SPFx version 1.8.2

**NOTE:**  SPFx EULA prohibits any modifications, workarounds, or redistribution of the software.  Because of this, I cannot publish how I was able to get this to work with the SPFx packages themselves.  I can, however, say that it doesn't involve any changes to the source code.  You just have to get them to use the patched versions of the **_open source_** packages I will talk about below.

## Process

This repository is currently set up to allow the local workbench to run.  If you are curious about how I accomplished it, you can browse around the repository, or read the steps I followed below.

* First thing is to download the patched packages

  1: `@microsoft/gulp-core-build`: <https://github.com/Js-Brecht/static-paths-1.8.2/raw/master/common/packs/microsoft-gulp-core-build-3.9.26.tgz>
  
  2: `@microsoft/gulp-core-build-serve`: <https://github.com/Js-Brecht/static-paths-1.8.2/raw/master/common/packs/microsoft-gulp-core-build-serve-3.3.29.tgz>

  > These tarballs are already setup to work correctly in a Rush repository, as is.  To do that, I had to make a couple of changes to the `package.json`:
    > * Make sure the build script was an empty string,
    > * Remove devDependencies, since they are production packages, not the dev source, and you don't need those devDependencies downloading/linking.

* Unpack patched packages into your repository

* Add these packages to your `rush.json` packages inventory ([examine the changes here](https://github.com/Js-Brecht/static-paths-1.8.2/blob/master/rush.json)).

  > I find it easiest to leave `ensureConsistentVersions` turned off.  If you don't then you will have to add a bunch of `allowedAlternativeVersions` to allow various package discrepancies between the production packages.

* Add an SPFx webpart/extension

* Run `rush update` to install dependencies, and link local packages

* Run `rush build` to build your packages

* Update your `gulpfile.js` to use the new feature

---

## **Caveat**

As noted above, the EULA for the SPFX framework prohibits me from publishing what I needed to do to make this work.  You do have to take steps to make sure that those various npm packages use the patched packages you added to your repository above.  I must leave it up to you to figure out how to do that.  If you do not, then this patch **_will not work_**, because they will be using the unpatched versions.

---

## `gulpfile.js`

This patch incorporates a new property on the SPFx `buildConfig` exposed by `@microsoft/gulp-core-build` package.

The property is named `staticPaths`, and the structure is an array of objects containing both `path` and `url` properties.

* `path` is the path to the location on your disk that you want to serve
* `url` is the url path that access that location.

This `gulpfile.js` works great for me, when using a stock `HelloWorld` webpart.

```js
'use strict';

const path = require('path');
const gulp = require('gulp');
const build = require('@microsoft/sp-build-web');
build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

const config = build.getConfig();
config.staticPaths = [
  {
    path: path.resolve("../../common/temp/node_modules"),
    url: "/common/temp/node_modules"
  },
  // {
  //   path: path.resolve("../../common/temp/node_modules"),
  //   url: "/../../common/temp/node_modules"
  // },
  {
    path: path.resolve("../../custom"),
    url: "/custom"
  }
]

build.initialize(gulp);
```
