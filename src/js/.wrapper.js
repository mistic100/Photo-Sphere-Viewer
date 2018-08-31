(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['three', 'uevent', 'dot/doT'], factory);
  }
  else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('three'), require('uevent'), require('dot/doT'));
  }
  else {
    root.PhotoSphereViewer = factory(root.THREE, root.uEvent, root.doT);
  }
}(this, function(THREE, uEvent, doT) {
"use strict";

@@js

return PhotoSphereViewer;
}));
