# Configuration

[[toc]]

::: tip Angles definitions
Photo Sphere Viewer uses a lot of angles for its configuration, most of them can be defined in radians by using a simple number (`3.5`) or in degrees using the "deg" suffix (`'55deg'`).
:::

::: tip Positions defintions
Some methods take a `position` parameter. It is an object with either `longitude` and `latitude` properties (radians or degrees) or `x` and `y` properies (corresponding to the pixel position on the source panorama file).
:::

## Standard options

#### `container` (required)
- type: `HTMLElement | string`

HTML element which will contain the panorama, or identifier of the element.

```js
container: document.querySelector('.viewer')

container: 'viewer' // will target [id="viewer"]
```

#### `adapter`
- default: `equirectangular`

Which [adapter](./adapters) used to load the panorama.

#### `panorama` (required)
- type: `*`

Path to the panorama. Must be a single URL for the default equirectangular adapter. Other adapters support other values.

#### `plugins`
- type: `array`

List of enabled [plugins](../plugins/README.md).

#### `caption`
- type: `string`

A text displayed in the navbar. If the navbar is disabled it will be shown anyway but with no button. HTML is allowed.

#### `size`
- type: `{ width: integer, height: integer }`

The final size if the panorama container. By default the size of `container` is used and is followed during window resizes.

#### `markers`

Now part of a [plugin](../plugins/plugin-markers.md).

#### `navbar`

Configuration of the [navbar](./navbar.md).

#### `minFov`
- type: `integer`
- default: `30`

Minimal field of view (corresponds to max zoom), between 1 and 179.

#### `maxFov`
- type: `integer`
- default: `90`

Maximal field of view (corresponds to min zoom), between 1 and 179.

#### `defaultZoomLvl`
- type: `integer`
- default: `50`

Initial zoom level, between 0 (for `maxFov`) and 100 (for `minfov`).

#### `fisheye`
- type: `boolean | double`
- default: `false`

Enable fisheye effect with true or specify effect strength (`true` = `1.0`).

::: warning
This mode can have side-effects on markers rendering.
:::

#### `defaultLong`
- type: `double | string`
- default: `0`

Initial longitude, between 0 and 2π.

#### `defaultLat`
- type: `double | string`
- default: `0`

Initial latitude, between -π/2 and π/2.

#### `longitudeRange`

Now part of a [plugin](../plugins/plugin-visible-range.md).

#### `latitudeRange`

Now part of a [plugin](../plugins/plugin-visible-range.md).

#### `autorotateDelay`
- type: `integer`
- default: `null`

Delay after which the automatic rotation will begin, in milliseconds.

#### `autorotateSpeed`
- type: `string`
- default: `2rpm`

Speed of the automatic rotation.

#### `autorotateLat`
- type: `double | string`
- default: `defaultLat`

Latitude at which the automatic rotation is performed.

#### `lang`
- type: `object`
- default:
```js
lang: {
    autorotate: 'Automatic rotation',
    zoom      : 'Zoom',
    zoomOut   : 'Zoom out',
    zoomIn    : 'Zoom in',
    move      : 'Move',
    download  : 'Download',
    fullscreen: 'Fullscreen',
    menu      : 'Menu',
    twoFingers: 'Use two fingers to navigate',
    ctrlZoom  : 'Use ctrl + scroll to zoom the image',
    loadError : 'The panorama can\'t be loaded',
}
```

Various texts used in the viewer.

#### `loadingImg`
- type: `string`

Path to an image displayed in the center of the loading circle.

#### `loadingTxt`
- type: `string`
- default: `'Loading...'`

Text displayed in the center of the loading circle, only used if `loadingImg` is not provided.

#### `mousewheel`
- type: `boolean`
- default: `true`

Enables zoom with the mouse wheel.

#### `mousemove`
- type: `boolean`
- default: `true`

Enables panorama rotation with the mouse cursor or with a finger swipe on touch screens.

#### `mousewheelCtrlKey`
- type: `boolean`
- default: `false`

Requires to use the ctrl key to zoom the panorama. The allows to scroll the page without interfering with the viewer. If enabled, an overlay asking the user to use ctrl + scroll is displayed when ctrl key is not pressed.

#### `captureCursor`
- type: `boolean`
- default: `false`

Rotate the panorama just by moving the cursor above the view instead of click+move.

#### `touchmoveTwoFingers`
- type: `boolean`
- default: `false`

Requires two fingers to rotate the panorama. This allows standard touch-scroll navigation in the page containing the viewer. If enabled, an overlay asking the user to use two fingers is displayed when only one touch is detected.


## Advanced options

#### `sphereCorrection`
- type: `{ pan: double, tilt: double, roll: double }`
- default: `{ pan:0, tilt:0, roll: 0 }`

Sphere rotation angles, in radians.

**Note** : if the XMP data and/or `panoData` contains heading/pitch/roll data, they will be applied before `sphereCorrection`.

![pan-tilt-toll](/assets//pan-tilt-roll.png)

#### `moveSpeed`
- type: `double`
- default `1`

Speed multiplicator for panorama moves. Used for click move, touch move and navbar buttons.

#### `zoomSpeed`
- type: `double`
- default `1`

Speed multiplicator for panorama zooms. Used for mouse wheel, touch pinch and navbar buttons.

#### `useXmpData`
- type: `boolean`
- default `true`

Read real image size from XMP data, must be kept `true` if the panorama has been cropped after shot.

#### `panoData`
- type: `object | function<Image, object>`

Overrides XMP data found in the panorama file (or simply defines it if `useXmpData=false`).
All parameters are optional.

```js
panoData: {
  fullWidth: 6000,
  fullHeight: 3000,
  croppedWidth: 4000,
  croppedHeight: 2000,
  croppedX: 1000,
  croppedY: 500,
  poseHeading: 270, // 0 to 360
  posePitch: 0, // -90 to 90
  poseRoll: 0, // -180 to 180
}
```

It can also be a function to dynamically compute the cropping config depending on the loaded image.

```js
panoData: (image) => ({
  fullWidth    : image.width,
  fullHeight   : image.width / 2,
  croppedWidth : image.width,
  croppedHeight: image.height,
  croppedX     : 0,
  croppedY     : image.width / 2 - image.height,
})
```

**Note** : if the XMP data and/or `panoData` contains heading/pitch/roll data, they will be applied before `sphereCorrection`.

#### `requestHeaders`
- type: `object | function<string, object>`

Sets the HTTP headers when loading the images files.

```js
requestHeaders: {
  header: value,
}
```

It can also be a function to dynamically set the request headers before every call. This can be useful when adding a Bearer, which is temporarily valid, to the Authorization header.

```js
requestHeaders: (url) => ({
   header: value,
})
```

#### `canvasBackground`
- type: `string`
- default: `#000`

Background of the canvas, which will be visible when using cropped panoramas.

#### `moveInertia`
- type: `boolean`
- default: `true`

Enabled smooth animation after a manual move.

#### `clickEventOnMarker`

Now part of a [plugin](../plugins/plugin-markers.md).

#### `withCredentials`
- type: `boolean`
- default: `false`

Use credentials for HTTP requests.

#### `keyboard`
- type: `boolean | object`
- default:
```js
keyboard: {
    'ArrowUp': 'rotateLatitudeUp',
    'ArrowDown': 'rotateLatitudeDown',
    'ArrowRight': 'rotateLongitudeRight',
    'ArrowLeft': 'rotateLongitudeLeft',
    'PageUp': 'zoomIn',
    'PageDown': 'zoomOut',
    '+': 'zoomIn',
    '-': 'zoomOut',
    ' ': 'toggleAutorotate'
}
```

Enable and configure keyboard navigation in fullscreen. It is a map defining key code->action. Set to `false` to disable.

(all the available actions are listed above)
