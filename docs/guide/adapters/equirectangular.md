# Equirectangular

> [Equirectangular projection](https://en.wikipedia.org/wiki/Equirectangular_projection) is one of the simplest way to create the texture of a sphere. It is the default projection used by most 360° cameras.

::: tip
There is no need to declare the equirectangular adapter as it is the default one, unless you want to change its configuration.
:::

```js
const viewer = new PhotoSphereViewer.Viewer({
  adapter: [PhotoSphereViewer.EquirectangularAdapter, {
    resolution: 64, // default
  }],
  panorama: 'path/panorama.jpg',
});
```


## Configuration

#### `resolution`
- type: `number`
- default: `64`

The number of faces of the sphere geometry used to display the panorama, higher values can reduce deformations on straight lines at the cost of performances. 

_Note: the actual number of faces is `resolution² / 2`._


## Cropped panorama

**Photo Sphere Viewer** supports cropped panorama given the appropriate configuration is provided. Cropped panoramas are not covering the whole 360°×180° sphere area but only a smaller portion. For example you might have a image covering 360° horizontally but only 90° vertically, or a semi sphere (180°×180°)

These incomplete panoramas are handled in two ways by Photo Sphere viewer:
  - Read XMP metadata directly from the file with `useXmpData` option (this is the default)
  - Provide the `panoData` configuration object/function

Use the [Playground](#playground) at the bottom of this page to find the best values for your panorama.

### Theory

In both case the data contains six important values:
  - Full panorama width
  - Full panorama height
  - Cropped area width
  - Cropped area height
  - Cropped area left
  - Cropped area right

The `Full panorama width` / `Full panorama height` ratio must always be 2:1. `Cropped area width` and `Cropped area height` are the actual size of your image. `Cropped area left` and `Cropped area right` are used to define the cropped area position.

The data can also contains angular values:
  - Pose Heading
  - Pose Pitch
  - Pose Roll

![XMP_pano_pixels](../../images/XMP_pano_pixels.png)

More information on [Google documentation](https://developers.google.com/streetview/spherical-metadata).


### Provide cropping data

#### With XMP

If you created your panorama with a mobile phone or dedicated 360° camera, it should already contain the correct XMP data. Otherwise you can inject it yourself with tools like [exiftool](https://sno.phy.queensu.ca/~phil/exiftool/).

The XMP payload is as follow:

```xml
<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/">
      <GPano:ProjectionType>equirectangular</GPano:ProjectionType>
      <GPano:FullPanoWidthPixels>6000</GPano:FullPanoWidthPixels>
      <GPano:FullPanoHeightPixels>3000</GPano:FullPanoHeightPixels>
      <GPano:CroppedAreaImageWidthPixels>4000</GPano:CroppedAreaImageWidthPixels>
      <GPano:CroppedAreaImageHeightPixels>2000</GPano:CroppedAreaImageHeightPixels>
      <GPano:CroppedAreaLeftPixels>1000</GPano:CroppedAreaLeftPixels>
      <GPano:CroppedAreaTopPixels>500</GPano:CroppedAreaTopPixels>
      <GPano:PoseHeadingDegrees>0</GPano:PoseHeadingDegrees>
      <GPano:PosePitchDegrees>0</GPano:PosePitchDegrees>
      <GPano:PoseRollDegrees>0</GPano:PoseRollDegrees>
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

```js
const viewer = new PhotoSphereViewer.Viewer({
  container: 'viewer',
  panorama: 'path/to/panorama.jpg',
  panoData: {
    fullWidth: 6000,
    fullHeight: 3000,
    croppedWidth: 4000,
    croppedHeight: 2000,
    croppedX: 1000,
    croppedY: 500,
    poseHeading: 0, // 0 to 360
    posePitch: 0, // -90 to 90
    poseRoll: 0, // -180 to 180
  }
});
```


### Playground

Use this demo to find the best values for your image.

<no-ssr>
  <CropPlayground/>
</no-ssr>
