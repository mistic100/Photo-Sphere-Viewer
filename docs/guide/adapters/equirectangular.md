# Equirectangular

::: module
[Equirectangular projection](https://en.wikipedia.org/wiki/Equirectangular_projection) is one of the simplest way to create the texture of a sphere. It is the default projection used by most 360° cameras.
:::

::: tip
There is no need to declare the equirectangular adapter as it is the default one, unless you want to change its configuration.
:::

```js:line-numbers
import { EquirectangularAdapter } from '@photo-sphere-viewer/core';

const viewer = new Viewer({
    adapter: EquirectangularAdapter,
    panorama: 'path/panorama.jpg',
});
```

## Configuration

#### `useXmpData`

-   type: `boolean`
-   default `true`

Read real image size from XMP data, must be kept `true` if the panorama has been cropped after shot. This is used for [cropped panorama](#cropped-panorama).

#### `resolution`

-   type: `number`
-   default: `64`

The number of faces of the sphere geometry used to display the panorama, higher values can reduce deformations on straight lines at the cost of performances.

_Note: the actual number of faces is `resolution² / 2`._

## Cropped panorama

**Photo Sphere Viewer** supports cropped panorama given the appropriate configuration is provided. Cropped panoramas are not covering the whole 360°×180° sphere area but only a smaller portion. For example you might have a image covering 360° horizontally but only 90° vertically, or a semi sphere (180°×180°)

These incomplete panoramas are handled in two ways by Photo Sphere viewer:

-   Read XMP metadata directly from the file with `useXmpData` option (this is the default)
-   Provide the `panoData` configuration object/function

Use the [Playground](#playground) at the bottom of this page to find the best values for your panorama.

### Theory

In both case the data contains six important values:

-   Full panorama width
-   Full panorama height
-   Cropped area width
-   Cropped area height
-   Cropped area left
-   Cropped area right

The `Full panorama width` / `Full panorama height` ratio must always be 2:1. `Cropped area width` and `Cropped area height` are the actual size of your image. `Cropped area left` and `Cropped area right` are used to define the cropped area position.

The data can also contains angular values:

-   Pose Heading
-   Pose Pitch
-   Pose Roll
-   Initial View Heading
-   Initial View Pitch
-   Initial Horizontal FOV

![XMP_pano_pixels](/images/XMP_pano_pixels.png)

More information on [Google documentation](https://developers.google.com/streetview/spherical-metadata).

### Provide cropping data

#### With XMP

If you created your panorama with a mobile phone or dedicated 360° camera, it should already contain the correct XMP data. Otherwise you can inject it yourself with tools like [exiftool](https://sno.phy.queensu.ca/~phil/exiftool/).

The XMP payload is as follow:

```xml:line-numbers
<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/">
      <GPano:ProjectionType>equirectangular</GPano:ProjectionType>
      <!-- cropping information -->
      <GPano:FullPanoWidthPixels>6000</GPano:FullPanoWidthPixels>
      <GPano:FullPanoHeightPixels>3000</GPano:FullPanoHeightPixels>
      <GPano:CroppedAreaImageWidthPixels>4000</GPano:CroppedAreaImageWidthPixels>
      <GPano:CroppedAreaImageHeightPixels>2000</GPano:CroppedAreaImageHeightPixels>
      <GPano:CroppedAreaLeftPixels>1000</GPano:CroppedAreaLeftPixels>
      <GPano:CroppedAreaTopPixels>500</GPano:CroppedAreaTopPixels>
      <!-- pose information -->
      <GPano:PoseHeadingDegrees>0</GPano:PoseHeadingDegrees>
      <GPano:PosePitchDegrees>0</GPano:PosePitchDegrees>
      <GPano:PoseRollDegrees>0</GPano:PoseRollDegrees>
      <!-- initial view information -->
      <GPano:InitialViewHeadingDegrees>0</GPano:InitialViewHeadingDegrees>
      <GPano:InitialViewPitchDegrees>0</GPano:InitialViewPitchDegrees>
      <GPano:InitialHorizontalFOVDegrees>60</GPano:InitialHorizontalFOVDegrees>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="r"?>
```

To write the XMP data to an image file, paste it in a text file and use this command:

```bash
exiftool -tagsfromfile data.xmp -all:all panorama.jpg
```

#### Manually

You can also directly pass the values to Photo Sphere Viewer with the `panoData` parameter.

```js:line-numbers
const viewer = new Viewer({
    container: 'viewer',
    panorama: 'path/to/panorama.jpg',

    // cropping information
    panoData: {
        fullWidth: 6000,
        fullHeight: 3000, // optional
        croppedWidth: 4000, // optional
        croppedHeight: 2000, // optional
        croppedX: 1000,
        croppedY: 500,
    },

    // pose information
    // sphereCorrection: {
    //   pan: '0deg',
    //   tilt: '0deg',
    //   roll: '0deg',
    // },

    // initial view information
    // defaultYaw: '0deg',
    // defaultPitch: '0deg',
    // defaultZoomLvl: 50,
});
```

#### Default parameters

If the image does not have a 2:1 ratio and no XMP data are found and no `panoData` is provided, a best effort is done to display the image without distortion. The exact algorithm is as follow:

```js:line-numbers
const fullWidth = Math.max(img.width, img.height * 2);
const fullHeight = Math.round(fullWidth / 2);
const croppedX = Math.round((fullWidth - img.width) / 2);
const croppedY = Math.round((fullHeight - img.height) / 2);

panoData = {
    fullWidth: fullWidth,
    fullHeight: fullHeight,
    croppedWidth: img.width,
    croppedHeight: img.height,
    croppedX: croppedX,
    croppedY: croppedY,
};
```

### Playground

Use this demo to find the best values for your image.

<script setup>
import CropPlayground from '@components/CropPlayground.vue';
</script>

<ClientOnly>
  <CropPlayground/>
</ClientOnly>
