# VisibleRangePlugin

<Badges module="visible-range-plugin"/>

::: module
<ApiButton page="modules/VisibleRangePlugin.html"/>
Locks the visible area of the panorama.

This plugin is available in the [@photo-sphere-viewer/visible-range-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/visible-range-plugin) package.
:::

## Usage

The plugin allows to define `horizontalRange` and `verticalRange` to lock to viewable zone. It affects manual moves and automatic rotation.

```js:line-numbers
import { VisibleRangePlugin } from '@photo-sphere-viewer/visible-range-plugin';

const viewer = new Viewer({
    plugins: [
        VisibleRangePlugin.withConfig({
            horizontalRange: [-Math.PI / 2, Math.PI / 2],
            verticalRange: [-Math.PI / 3, Math.PI / 3],
        }),
    ],
});

const visibleRangePlugin = viewer.getPlugin(VisibleRangePlugin);

visibleRangePlugin.setHorizontalRange(['0deg', '180deg']);
visibleRangePlugin.setVerticalRange(null);
```

Alternatively, if `usePanoData` is set to `true`, the visible range is limited to the [cropped panorama data](../guide/adapters/equirectangular.md#cropped-panorama) provided to the viewer.

## Example

### Custom range

This example is locked between -90° and 90° on the horizontal axis and between -60° and 60° on the vertical axis.

::: code-demo

```yaml
title: PSV Visible Range Demo
packages:
    - name: visible-range-plugin
```

<<< ./demos-src/visible-range.js{js:line-numbers}

:::

### From `panoData`

This example uses the actual size of a cropped panorama to define the visible ranges.

::: code-demo

```yaml
title: PSV Visible Range Demo
packages:
    - name: visible-range-plugin
```

<<< ./demos-src/visible-range-panodata.js{js:line-numbers}

:::

## Configuration

#### `horizontalRange`

-   type: `double[]|string[]`
-   default: `null`
-   updatable: no, use `setHorizontalRange()` plugin

Visible horizontal range as two angles.

#### `verticalRange`

-   type: `double[]|string[]`
-   default: `null`
-   updatable: no, use `setVerticalRange()` plugin

Visible vertical range as two angles.

#### `usePanoData`

-   type: `boolean`
-   default: `false`
-   updatable: yes

Use cropped panorama data as visible range immediately after load.

## Methods

#### `setHorizontalRange(range)` | `setVerticalRange(range)`

Change or remove the ranges.

#### `setRangesFromPanoData()`

Use cropped panorama data as visible range.
