# CompassPlugin <Badge text="Styles"/>

<Badges module="compass-plugin"/>

::: module
<ApiButton page="modules/CompassPlugin.html"/>
Adds a compass on the viewer to represent which portion of the sphere is currently visible.

This plugin is available in the [@photo-sphere-viewer/compass-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/compass-plugin) package.
:::

## Usage

The plugin can be configured with a list of `hotspots` which are small dots on the compass. It can also display markers positions.

```js:line-numbers
import { CompassPlugin } from '@photo-sphere-viewer/compass-plugin';

const viewer = new Viewer({
    plugins: [
        CompassPlugin.withConfig({
            hotspots: [
                { yaw: '45deg' }, 
                { yaw: '60deg', color: 'red' },
            ],
        }),
    ],
});
```

## Example

::: code-demo

```yaml
title: PSV Compass Demo
packages:
    - name: compass-plugin
      style: true
```

<<< ./demos-src/compass.js{js:line-numbers}

:::

::: tip
The north is always at yaw=0, if you need to change where is the north you can use `panoData.poseHeading` or `sphereCorrection.pan` option.
:::

## Configuration

#### `size`

-   type: `string`
-   default: `'120px'`
-   updatable: yes

The size of the widget, can be declared in `px`, `rem`, `vh`, etc.

#### `position`

-   type: `string`
-   default: `'top left'`
-   updatable: yes

Position of the widget, accepted positions are combinations of `top`, `center`, `bottom` and `left`, `center`, `right`.

#### `navigation`

-   type: `boolean`
-   default: `true`
-   updatable: yes

Allows to click on the compass to rotate the viewer.

#### `resetPitch`

-   type: `boolean`
-   default: `true`
-   updatable: yes

Reset viewer pitch to `defaultPitch` when using the compass navigation.

#### `hotspots`

-   type: `CompassHotspot[]`
-   default: `null`
-   updatable: yes

Small dots visible on the compass. Each spot consists of a position (either `yaw`/`pitch` or `textureX`/`textureY`) and an optional `color` which overrides the global `hotspotColor`.

::: tip
[Markers](./markers.md) can be displayed on the compass by defining their `compass` data, which can be `true` or a specific color.

<DemoButton href="/demos/compass/markers.html"/>
:::

#### `backgroundSvg`

-   type: `string`
-   default: SVG provided by the plugin
-   updatable: yes

SVG used as background of the compass (must be square).

#### `coneColor`

-   type: `string`
-   default: `'rgba(255, 255, 255, 0.2)'`
-   updatable: yes

Color of the cone of the compass.

#### `navigationColor`

-   type: `string`
-   default: `'rgba(255, 0, 0, 0.2)'`
-   updatable: yes

Color of the navigation cone.

#### `hotspotColor`

-   type: `string`
-   default: `'rgba(0, 0, 0, 0.5)'`
-   updatable: yes

Default color of hotspots.

#### `className`

-   type: `string`
-   updatable: yes

CSS class(es) added to the compass element.

## Methods

#### `setHotspots(hotspots)`

Changes the hotspots.

```js
compassPlugin.setHotspots([
    { yaw: '0deg' }, 
    { yaw: '10deg', color: 'red' },
]);
```

#### `clearHotspots()`

Removes all hotspots.
