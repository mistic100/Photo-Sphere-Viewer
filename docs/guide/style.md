# Style

Photo Sphere Viewer comes with a default darkish theme. You can customize it by building yourself the stylesheet from the SCSS source and some variables overrides.

The source files use SASS modules and must be imported with `@use` in order to override variables.

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

The following sections list all available variables for the core. Plugins variables are listed on each corresponding plugin page.

## Global

| variable               | default              | description                                                 |
| ---------------------- | -------------------- | ----------------------------------------------------------- |
| $main-background       | radial-gradient(...) | Background of the viewer, visible when no panorama is set   |
| $element-focus-outline | 2px solid #007cff    | Outline applied to focusable elements (navbar, panel, etc.) |

## Loader

| variable         | default                 | description                      |
| ---------------- | ----------------------- | -------------------------------- |
| $loader-color    | rgba(255, 255, 255, .7) | Color of the loader bar and text |
| $loader-bg-color | rgba(61, 61, 61, .5)    | Color of the loader background   |
| $loader-width    | 150px                   | Size of the loader               |
| $loader-tickness | 10px                    | Thickness of the loader bar      |
| $loader-border   | 3px                     | Inner border of the loader       |
| $loader-font     | 600 16px sans-serif     | Font of the loading text         |

## Navbar

| variable            | default                 | description                    |
| ------------------- | ----------------------- | ------------------------------ |
| $navbar-height      | 40px                    | Height of the navbar           |
| $navbar-background  | rgba(61, 61, 61, .5)    | Background color of the navbar |
| $caption-font       | 16px sans-serif         | Font of the caption            |
| $caption-text-color | rgba(255, 255, 255, .7) | Text color of the caption      |

#### Buttons

| variable                   | default                 | description                                 |
| -------------------------- | ----------------------- | ------------------------------------------- |
| $buttons-height            | 20px                    | Inner height of the buttons                 |
| $buttons-color             | rgba(255, 255, 255, .7) | Icon color of the buttons                   |
| $buttons-background        | transparent             | Background color of the buttons             |
| $buttons-active-background | rgba(255, 255, 255, .2) | Background color of the buttons when active |
| $buttons-disabled-opacity  | .5                      | Opacity of disabled buttons                 |
| $buttons-hover-scale       | 1.2                     | Scale applied to buttons on mouse hover     |
| $buttons-hover-scale-delay | 200ms                   | Duration of the scale animation             |

#### Zoom range

| variable                    | default | description                           |
| --------------------------- | ------- | ------------------------------------- |
| $zoom-range-width           | 80px    | Size of the zoom range                |
| $zoom-range-tickness        | 1px     | Tickness of the zoom range            |
| $zoom-range-diameter        | 7px     | Size of the zoom handle               |
| $zoom-range-media-min-width | 600px   | Hides the zoom range on small screens |

## Tooltip

| variable                | default              | description                            |
| ----------------------- | -------------------- | -------------------------------------- |
| $tooltip-background     | rgba(61, 61, 61, .8) | Background of tooltips                 |
| $tooltip-radius         | 4px                  | Border radius of the tooltips          |
| $tooltip-padding        | .5em 1em             | Content padding of the tooltips        |
| $tooltip-arrow-size     | 7px                  | Tooltips' arrow size                   |
| $tooltip-max-width      | 200px                | Maximum width of the tooltips' content |
| $tooltip-text-color     | rgb(255, 255, 255)   | Text color of the tooltips             |
| $tooltip-font           | 14px sans-serif      | Font of the tooltips                   |
| $tooltip-text-shadow    | 0 1px #000           | Shadow applied to the tooltips' text   |
| $tooltip-shadow-color   | rgba(90, 90, 90, .7) | Color of the tooltips' shadow          |
| $tooltip-shadow-offset  | 3px                  | Size of the tooltips' shadow           |
| $tooltip-animate-offset | 5px                  | Distance travelled on show animation   |
| $tooltip-animate-delay  | 100ms                | Duration of the show animation         |

## Panel

| variable             | default              | description                     |
| -------------------- | -------------------- | ------------------------------- |
| $panel-background    | rgba(10, 10, 10, .7) | Background of the panel         |
| $panel-width         | 400px                | Default width of the panel      |
| $panel-padding       | 1em                  | Content padding of the panel    |
| $panel-text-color    | rgb(220, 220, 220)   | Default text color of the panel |
| $panel-font          | 16px sans-serif      | Default font of the panel       |
| $panel-animate-delay | 100ms                | Duration of the show animation  |

#### Menu

| variable                     | default                 | description                                |
| ---------------------------- | ----------------------- | ------------------------------------------ |
| $panel-title-font            | 24px sans-serif         | Font of the menu title                     |
| $panel-title-icon-size       | 24px                    | Size of the menu title icon                |
| $panel-title-margin          | 24px                    | Margin of the menu title                   |
| $panel-menu-item-height      | 1.5em                   | Minimum eight of an item in the menu       |
| $panel-menu-item-padding     | .5em 1em                | Padding of an item in the menu             |
| $panel-menu-odd-background   | rgba(255, 255, 255, .1) | Background color of odd items in the menu  |
| $panel-menu-even-background  | transparent             | Background color of even items in the menu |
| $panel-menu-hover-background | rgba(255, 255, 255, .2) | Background color of items on mouse hover   |

## Notification

| variable                    | default             | description                               |
| --------------------------- | ------------------- | ----------------------------------------- |
| $notification-position-from | -$navbar-height     | Position of the notification when hidden  |
| $notification-position-to   | $navbar-height \* 2 | Position of the notification when visible |
| $notification-animate-delay | 200ms               | Duration of the show animation            |
| $notification-background    | $tooltip-background | Background color of the notification      |
| $notification-radius        | $tooltip-radius     | Border radius of the notification         |
| $notification-padding       | $tooltip-padding    | Content padding of the notification       |
| $notification-font          | $tooltip-font       | Font of the notification                  |
| $notification-text-color    | $tooltip-text-color | Text color of the notification            |

## Overlay

| variable             | default                            | description                                      |
| -------------------- | ---------------------------------- | ------------------------------------------------ |
| $overlay-opacity     | .8                                 | Opacity of the overlay                           |
| $overlay-icon-color  | rgb(48, 48, 48)                    | Color of the overlay icon (if SVG)               |
| $overlay-title-font  | 30px sans-serif                    | Font of the overlay title                        |
| $overlay-title-color | black                              | Color of the overlay title                       |
| $overlay-text-font   | 20px sans-serif                    | Font of the overlay text                         |
| $overlay-text-color  | rgba(0, 0, 0, .8)                  | Color of the overlay text                        |
| $overlay-image-size  | (portrait: 50%,<br>landscape: 33%) | Image/Icon size, depending on screen orientation |
