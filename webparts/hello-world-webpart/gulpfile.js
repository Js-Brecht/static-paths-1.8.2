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
