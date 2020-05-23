# SettingsPlugin

<ApiButton page="PSV.plugins.SettingsPlugin.html"/>

> This plugin does nothing on it's own but is required by other plugins.

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/settings.js` and `dist/plugins/settings.css`.

[[toc]]


## Usage

Once enabled the plugin will add a new "Settings" button which other plugins cas use to display various settings in the side panel.

```js
const viewer = new PhotoSphereViewer.Viewer({
  plugins: [
    PhotoSphereViewer.SettingsPlugin,
  ],
});
```


## Example

The following example manually adds two settings.

<iframe style="width: 100%; height: 500px;" src="//jsfiddle.net/mistic100/54qx9yLt/embedded/result,js/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>


## Adding a setting

Registering a new setting is done by calling the `registerSetting` on the plugin. There are currently two types of setting.

### Toggle setting

This a setting which has only two values : `true` and `false`. It is required to provide the `active(): boolean` and `toggle(): void` functions.

```js
settings.addSetting({
  id    : 'custom-toggle-setting',
  label : 'Toggle setting',
  type  : 'toggle',
  active: () => enabled,
  toggle: () => enabled = !enabled,
});
```

### Options setting

This is a setting which has multiple available values (or options). It is required to provide the `current(): string`, `options(): Options[]` and `apply(option: string): void` functions.

```js
settings.addSetting({
  id     : 'custom-options-setting',
  label  : 'Options setting',
  type   : 'options',
  current: () => currentOption, // prefer a human readable label
  options: () => ([
    { id: 'option-a', label: 'Option A', active: currentOption === 'option-a' },
    { id: 'option-b', label: 'Option B', active: currentOption === 'option-b' },
  ]),
  toggle : (option) => currentOption = option,
});
```


## Configuration

#### `lang`
- type: `object`
- default:
```js
lang: {
    settings : 'Settings',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._
