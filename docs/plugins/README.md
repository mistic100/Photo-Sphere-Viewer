# Introduction to plugins

Plugins are used to add new functionalities to Photo Sphere Viewer. They can access all internal APIs of the viewer as well as the THREE.js renderer to make the viewer even more awesome.

## Using a plugin

All plugins consists of a JavaScript class which must be provided to the `plugins` array. Some plugins will also take configuration object provided in a nested array.

```js
const viewer = new PhotoSphereViewer.Viewer({
  plugins: [
    SimplePlugin,
    [PluginWithOptions, {
      option1: 'foo',
      option2: 'bar',
    }],
  ],
});
```

After initializayion the plugin instance can be obtained with the `getPlugin` method, allowing to call methods on the plugin and subscribe to events.

```js
const plugin = new viewer.getPlugin(PluginWithOptions);

plugin.on('something', () => {
  /* ... */
});
```
