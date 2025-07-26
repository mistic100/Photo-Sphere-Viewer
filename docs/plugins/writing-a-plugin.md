# Writing a plugin

::: tip Full featured example
You can find a complete example of plugin implementation in the [examples](https://github.com/mistic100/Photo-Sphere-Viewer/tree/main/examples/custom-plugin) folder of the project.
:::

## Syntax

The recommended way to create your own plugin is as an ES6 class extending `AbstractPlugin` provided by `@photo-sphere-viewer/core` package.

**Requirements:**

-   The plugin class **must** take a `Viewer` object as first parameter and pass it to the `super` constructor.
-   It **must** have a `static id` property.
-   It **must** implement the `init` method to perform initialization, like subscribing to events.
-   It **must** implement the `destroy` method which is used to cleanup the plugin when the viewer is unloaded.
-   The constructor **can** take an `config` object as second parameter.

In the plugin you have access to `this.viewer` which is the instance of the viewer, check the [API Reference](/api/classes/Core.Viewer.html){target=_blank} for more information.

Your plugin is also an `EventTarget` with `addEventListener`, `removeEventListener` and `dispatchEvent` methods.

```js:line-numbers
import { AbstractPlugin } from '@photo-sphere-viewer/core';

export class CustomPlugin extends AbstractPlugin {
    static id = 'custom-plugin';

    static withConfig(config) {
        return [CustomPlugin, config];
    }

    constructor(viewer, config) {
        super(viewer);
    }

    init() {
        // do your initialisation logic here
    }

    destroy() {
        // do your cleanup logic here
        super.destroy();
    }
}
```

Beside this main class, you can use any number of ES modules to split your code.

### Typed events

When developping in TypeScript it is handy to be able to strongly type each event you emit. That's why `AbstractPlugin` takes an optional template type representing the list of dispatchable events. All events must extends `TypedEvent` which is also a templated class to be able to type the `target` property.

```ts:line-numbers
/**
 * Declare the events classes
 */
export class CustomPluginEvent extends TypedEvent<CustomPlugin> {
    static override readonly type = 'custom-event'; // recommended for constant access
    override type: 'custom-event'; // required for typings

    constructor(public readonly value: boolean) {
        super(CustomPluginEvent.type);
    }
}

/**
 * Declare the union of all events
 */
export type CustomPluginEvents = CustomPluginEvent;

/**
 * Provide the events type
 */
export class CustomPlugin extends AbstractPlugin<CustomPluginEvents> {
    /**
     * Dispatch
     */
    method() {
        this.dispatch(new CustomPluginEvent(true));
    }
}

/**
 * Listen
 */
viewer.getPlugin(CustomPlugin)
    .addEventListener(CustomPluginEvent.type, ({ value, target }) => {
        // value is typed boolean
        // target is typed CustomPlugin
    });
```

## Packaging

The simplest way to package your plugin is by using [rollup.js](https://rollupjs.org) with the following configuration:

```js:line-numbers
export default {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/index.cjs',
            format: 'cjs',
            sourcemap: true,
        },
        {
            file: 'dist/index.module.js',
            format: 'es',
            sourcemap: true,
        },
    ],
    external: [
        'three', 
        '@photo-sphere-viewer/core',
    ],
};
```

### Stylesheets

If your plugin requires custom CSS, import the stylesheet directly in your main Javascript file and add this rollup plugin to your configuration (here I use a SASS loader):

```js
require('rollup-plugin-postcss')({
    extract: true,
    sourceMap: true,
    use: ['sass'],
});
```

## Buttons

Your plugin may need to add a new button in the navbar. This section will describe how to create a button and how to register it.

### Creating a button

Photo Sphere Viewer buttons **must** extend `AbstractButton`, check the [API Reference](/api/classes/Core.AbstractButton.html){target=_blank} for more information.

**Requirements:**

-   The button class **must** take a `Navbar` object as first parameter and pass it to the `super` constructor.
-   It **must** have a `static id` property.
-   It **must** implement the `destroy` method which is used to cleanup the button when the viewer is unloaded.
-   It **must** implement the `onClick` method to perform an action.
-   It **can** implement the `isSupported` method to inform the viewer if the action is possible depending on the environment.
-   It **must** provide the button configuration to `super` :
    -   `className` : CSS class name applied to the button
    -   `icon` : SVG of the icon
    -   `iconActive` : SVG of the icon when the button is active (defaults `icon`)
    -   `collapsable` : indicates the button can be collapsed in the menu on small screens (defaults `false`)
    -   `tabbable` : indicates the button can be activated with the keyboard (defaults `true`)

```js:line-numbers
import { AbstractButton } from '@photo-sphere-viewer/core';

export class CustomButton extends AbstractButton {
    static id = 'custom-button';

    constructor(navbar) {
        super(navbar, {
            className: 'custom-button-class',
            icon: '<svg>...</svg>',
            collapsable: true,
            tabbable: true,
        });

        // do your initialisation logic here
        // you will probably need the instance of your plugin
        this.plugin = this.viewer.getPlugin('custom-plugin');
    }

    destroy() {
        // do your cleanup logic here
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

In your main plugin file call `registerButton`. This will only make the button available but not display it by default, the user will have to declare it in its `navbar` configuration.

```js
import { registerButton } from '@photo-sphere-viewer/core';
import { CustomButton } from './CustomButton';

registerButton(CustomButton);
```

### Manage icons

If your button uses an icon, it is recommended to use an external SVG and bundle it with your code. This can be done with de following rollup plugin:

```js
require('rollup-plugin-string').string({
    include: ['**/*.svg'],
});
```

This allows to get SVG files as string with `import`.

```js
import iconContent from './icon.svg';
```

::: tip Icon color
To be correctly displayed in the navbar, the icon must use `fill="currentColor"` and/or `stroke="currentColor"`.
:::

## Naming and publishing

If you intend to publish your plugin on npmjs.org please respect the following naming:

-   class name : `[[Name]]Plugin`
-   NPM package name : `photo-sphere-viewer-[[name]]-plugin`

Your `package.json` must be properly configured to allow application bundlers to get the right file, and `@photo-sphere-viewer/core` must be declared as dependency.

```json:line-numbers
{
    "name": "photo-sphere-viewer-custom-plugin",
    "version": "1.0.0",
    "main": "index.cjs",
    "module": "index.module.js",
    "style": "index.css",
    "dependencies": {
        "@photo-sphere-viewer/core": "^5.0.0"
    }
}
```

You can now make a PR to add it to the list of [3rd party plugins](./third-party.md).
