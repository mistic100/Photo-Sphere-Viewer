# SettingsPlugin <Badge text="Styles"/>

<Badges module="settings-plugin"/>

::: module
<ApiButton page="modules/SettingsPlugin.html"/>
This plugin does nothing on it's own but is required by other plugins.

This plugin is available in the [@photo-sphere-viewer/settings-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/settings-plugin) package.
:::

## Usage

Once enabled the plugin will add a new "Settings" button which can be populated by other plugins.

```js
import { SettingsPlugin } from '@photo-sphere-viewer/settings-plugin';

const viewer = new Viewer({
    plugins: [
        SettingsPlugin,
    ],
});
```

## Example

The following example manually adds two settings.

::: code-demo

```yaml
title: PSV Settings Demo
packages:
    - name: settings-plugin
      style: true
```

<<< ./demos-src/settings.js

:::

## Adding a setting

Registering a new setting is done by calling the `addSetting` on the plugin. There are currently two types of setting.

### Toggle setting

This a setting which has only two values : `true` and `false`. It is required to provide the `active(): boolean` and `toggle(): void` functions.

```js
let enabled = false;

settings.addSetting({
    id: 'custom-toggle-setting',
    label: 'Toggle setting',
    type: 'toggle',
    active: () => enabled,
    toggle: () => (enabled = !enabled),
});
```

### Options setting

This is a setting which has multiple available values (or options). It is required to provide the `current(): string`, `options(): Options[]` and `apply(option: string): void` functions.

```js
let currentOption = 'A';

settings.addSetting({
    id: 'custom-options-setting',
    label: 'Options setting',
    type: 'options',
    options: () => [
        { id: 'A', label: 'Option A' },
        { id: 'B', label: 'Option B' },
    ],
    current: () => currentOption,
    apply: (option) => (currentOption = option),
});
```

For translation purposes, both `label` can be a key in the main [`lang`](../guide/config.md#lang) object.

## Button badge

A setting can also have a `badge` function, which return value will be used as a badge on the settings button itself. **Only one setting can declare a badge.**

```js
settings.addSetting({
  ...,
  badge: () => currentOption,
});
```

## Configuration

#### `persist`

-   type: `boolean`
-   default: `false`
-   updatable: no

Should the settings be persisted. The persistence storage can be configured.

#### `storage`

-   type:

```ts
{
  get(settingId: string): boolean | string | Promise<boolean | string>;
  set(settingId: string, value: boolean | string);
}
```

-   default: LocalStorage with key `psvSettings`
-   updatable: no

Custom storage solution, for example LocalForage, NgRx, HTTP service, etc.

#### `lang`

-   type: `object`
-   default:

```js
lang: {
    settings: 'Settings',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

## Events

#### `setting-changed(settingId, settingValue)`

Triggered when the resolution is changed.

```js
settingsPlugin.addEventListener('setting-changed', ({ settingId, settingValue }) => {
    console.log(`${settingId}: ${settingValue}`);
});
```

## Buttons

This plugin adds buttons to the default navbar:

-   `settings` allows to open the settings panel

If you use a [custom navbar](../guide/navbar.md) you will need to manually add the buttons to the list.

## SCSS variables

| variable          | default                           | description                               |
| ----------------- | --------------------------------- | ----------------------------------------- |
| $font             | core.$caption-font                | Font of settings                          |
| $text-color       | core.$panel-text-color            | Text color of settings                    |
| $background       | core.$panel-background            | Background color of settings              |
| $item-height      | core.$panel-menu-item-height      | Height of each settings item              |
| $item-padding     | core.$panel-menu-item-padding     | Padding of each settings item             |
| $hover-background | core.$panel-menu-hover-background | Background color of items on mouse hover  |
| $badge-font       | 10px / .9 monospace               | Font of the badge displayed on the button |
| $badge-text-color | white                             | Text color if the badge                   |
| $badge-background | #111                              | Background color of the badge             |
