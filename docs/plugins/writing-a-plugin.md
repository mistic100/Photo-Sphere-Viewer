# Writing a plugin

[[toc]]

## Syntax

The recommended way to create your own plugin is as an ES6 class extending `AbstractPlugin` provided by `photo-sphere-viewer` core package.

**Requirements:**
- The plugin class **must** take a `PSV.Viewer` object as first parameter and pass it to the `super` constructor. 
- It **must** have a `static id` property.
- It **must** implement the `destroy` method which is used to cleanup the plugin when the viewer is unloaded. 
- The constructor **can** take an `options` object as second parameter.

In you plugin you have access to `this.psv` which is the instance of the viewer, check the [API Documentation](https://photo-sphere-viewer.js.org/api/PSV.Viewer.html) for more information.

Your plugin is also an [`EventEmitter`](https://github.com/mistic100/uEvent) with `on`, `off` and `trigger` methods.

```js
import { AbstractPlugin } from 'photo-sphere-viewer';

export default class PhotoSphereViewerCustomPlugin extends AbstractPlugin {
  
  static id = 'custom-plugin';
  
  constructor(psv, options) {
    super(psv);
    
    // do your initialisation logic here
  }
  
  destroy() {
    // do you cleanup logic here
    
    super.destroy();
  }
  
}
```

Beside this main class, you can use any number of ES modules to split your code.


## Packaging

The simplest way to package your plugin is by using [rollup.js](https://rollupjs.org) and [Babel](https://babeljs.io) with the following configuration:

```js
// rollup.config.js

export default {
  input   : 'index.js',
  output  : {
    file     : 'browser.js',
    name     : 'PhotoSphereViewerCustomPlugin',
    format   : 'umd',
    sourcemap: true,
    globals  : {
      'three'              : 'THREE',
      'uevent'             : 'uEvent',
      'photo-sphere-viewer': 'PhotoSphereViewer',
    },
  },
  external: [
    'three',
    'uevent',
    'photo-sphere-viewer',
  ],
  plugins : [
    require('rollup-plugin-babel')({
      exclude: 'node_modules/**',
    }),
  ],
};
```

```json
// .babelrc

{
 "presets": [
   "@babel/env"
 ]
}
```

### Stylesheets

If your plugin requires custom CSS, import the stylesheet directly in your main Javascript file and add this rollup plugin to your configuration (here I use a SASS loader):

```js
require('rollup-plugin-postcss')({
  extract  : true,
  sourceMap: true,
  plugins  : [
    require('@csstools/postcss-sass')({}),
    require('autoprefixer')({}),
  ],
})
```

## Buttons

Your plugin may need to add a new button in the navbar. This section will describe how to create a button and how to register it.

### Creating a button

Photo Sphere Viewer buttons **must** extend `AbstractButton`, check the [API Documentation](https://photo-sphere-viewer.js.org/api/PSV.components.AbstractComponent.html) for more information.

**Requirements:**
- The button class **must** take a `PSV.components.Navbar` object as first parameter and pass it to the `super` constructor. 
- It **must** have a `static id` property.
- It **must** implement the `destroy` method which is used to cleanup the button when the viewer is unloaded. 
- It **must** implement the `onClick` method to perform an action.
- It **should** have a `static icon` property containing a SVG.
- It **can** implement the `isSupported` method to inform the viewer if the action is possible depending on the environement.
- It **can** provide a CSS class name as second parameter of `super`.
- It **can** provide a boolean as third parameter of `super`, this boolean indicated the button can be collapsed in the menu on small screens.

```js
import { AbstractButton } from 'photo-sphere-viewer';

export class CustomButton extends AbstractButton {
  
  static id = 'custom-button';
  static icon = customIcon;
  
  constructor(navbar) {
    super(navbar, 'custom-button-class', true);
    
    // do your initialisation logic here
    // you will probably need the instance of your plugin
    this.plugin = this.psv.getPlugin('custom-plugin');
  }
  
  destroy() {
    // do you cleanup logic here
    
    super.destroy();
  }
  
  isSupported() {
    return !!this.plugin;
  }
  
  onClick() {
    this.plugin.doSomething();
  }
  
}
```

### Registering the button

In your main plugin file call `registerButton` in your main plugin file. This will only make the button available but not display it by default, the user will have to declare it in its `navbar` configuration.

```js
import { registerButton } from 'photo-sphere-viewer';
import { CustomButton } from './CustomButton';

registerButton(CustomButton);
```

### Manage icons

If your button uses an icon, it is recommended to use an external SVG and bundle it with your code. This can be done with de following rollup plugin:

```js
require('rollup-plugin-string').string({
  include: [
    'icons/*.svg',
  ],
})
```

This allows to get SVG files as string with `import`.

```js
import customIcon from './icons/custom.svg';

static icon = customIcon;
```



## Naming and publishing

If you intend to publish your plugin on npmjs.org please respect the folowing naming:

- class name and export name (in rollup config file) : `PhotoSphereViewer[[Name]]Plugin`
- NPM package name : `photo-sphere-viewer-[[name]]-plugin`

Your `package.json` must be properly configured to allow application bundlers to get the right file, and `photo-sphere-viewer` must be declared as peer dependency.

```json
{
  "name": "photo-sphere-viewer-custom-plugin",
  "version": "1.0.0",
  "main": "browser.js",
  "module": "index.js",
  "peerDependencies": {
    "photo-sphere-viewer": "^4.0.0"
  }
}
```
