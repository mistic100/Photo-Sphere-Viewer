# Style

Photo Sphere Viewer comes with a default dark glass theme. 

## Compile SASS source

You can customize it by building yourself the stylesheet from the SCSS source and some variables overrides.

The source files use SASS modules and must be imported with `@use` in order to override variables.

**Example:**
```scss:line-numbers
// main stylesheet
@use '@photo-sphere-viewer/core/index.scss' as psv with (
    $loader-color: rgba(0, 0, 0, .5),
    $loader-width: 100px,
);

// plugins stylesheets
@use '@photo-sphere-viewer/markers-plugin/index.scss' as psvMarkers;
@use '@photo-sphere-viewer/virtual-tour-plugin/index.scss' as psvVirtualTour;
....
```

The full list of SCSS variables can be found [in the source code](https://github.com/mistic100/Photo-Sphere-Viewer/blob/main/packages/core/src/styles/_vars.scss).

## CSS variables

Additionally the following CSS variables are declared in the page and can be changed without compiling the stylesheet.

 - `--psv-font-family`
 - `--psv-bg-color`
 - `--psv-bg-hover-color`
 - `--psv-text-color`
 - `--psv-text-hover-color`
 - `--psv-border-color`
 - `--psv-shadow-color`
 - `--psv-focus-color`

**Example:**
```css:line-numbers
:root {
    --psv-bg-color: 200, 200, 200;
    --psv-text-color: 0, 0, 0;
}
```

::: info Note
All colors must be declared as three RGB components, hexadecimal and other formats are not supported.
:::
