# Style

Photo Sphere Viewer comes with a default darkish theme. You can customize it by building yourself the stylesheet from the SCSS source and some variables overrides.

```scss
// overrides
$psv-loader-color: rgba(0, 0, 0, .5);
$psv-loader-width: 100px;
....

// main stylesheet
@import '~@photo-sphere-viewer/core/index.scss';

// plugins stylesheets
@import '~@photo-sphere-viewer/markers-plugin/index.scss';
@import '~@photo-sphere-viewer/virtual-tour-plugin/index.scss';
....
```

## Global

| variable                   | default              | description                                                 |
| -------------------------- | -------------------- | ----------------------------------------------------------- |
| $psv-main-background       | radial-gradient(...) | Background of the viewer, visible when no panorama is set   |
| $psv-element-focus-outline | 2px solid #007cff    | Outline applied to focusable elements (navbar, panel, etc.) |

## Loader

| variable             | default                 | description                      |
| -------------------- | ----------------------- | -------------------------------- |
| $psv-loader-color    | rgba(255, 255, 255, .7) | Color of the loader bar and text |
| $psv-loader-bg-color | rgba(61, 61, 61, .5)    | Color of the loader background   |
| $psv-loader-width    | 150px                   | Size of the loader               |
| $psv-loader-tickness | 10px                    | Thickness of the loader bar      |
| $psv-loader-border   | 3px                     | Inner border of the loader       |
| $psv-loader-font     | 600 16px sans-serif     | Font of the loading text         |

## Navbar

| variable                | default                 | description                    |
| ----------------------- | ----------------------- | ------------------------------ |
| $psv-navbar-height      | 40px                    | Height of the navbar           |
| $psv-navbar-background  | rgba(61, 61, 61, .5)    | Background color of the navbar |
| $psv-caption-font       | 16px sans-serif         | Font of the caption            |
| $psv-caption-text-color | rgba(255, 255, 255, .7) | Text color of the caption      |

#### Buttons

| variable                       | default                 | description                                 |
| ------------------------------ | ----------------------- | ------------------------------------------- |
| $psv-buttons-height            | 20px                    | Inner height of the buttons                 |
| $psv-buttons-color             | rgba(255, 255, 255, .7) | Icon color of the buttons                   |
| $psv-buttons-background        | transparent             | Background color of the buttons             |
| $psv-buttons-active-background | rgba(255, 255, 255, .2) | Background color of the buttons when active |
| $psv-buttons-disabled-opacity  | .5                      | Opacity of disabled buttons                 |
| $psv-buttons-hover-scale       | 1.2                     | Scale applied to buttons on mouse hover     |
| $psv-buttons-hover-scale-delay | 200ms                   | Duration of the scale animation             |

#### Zoom range

| variable                        | default | description                           |
| ------------------------------- | ------- | ------------------------------------- |
| $psv-zoom-range-width           | 80px    | Size of the zoom range                |
| $psv-zoom-range-tickness        | 1px     | Tickness of the zoom range            |
| $psv-zoom-range-diameter        | 7px     | Size of the zoom handle               |
| $psv-zoom-range-media-min-width | 600px   | Hides the zoom range on small screens |

## Tooltip

| variable                    | default              | description                            |
| --------------------------- | -------------------- | -------------------------------------- |
| $psv-tooltip-background     | rgba(61, 61, 61, .8) | Background of tooltips                 |
| $psv-tooltip-radius         | 4px                  | Border radius of the tooltips          |
| $psv-tooltip-padding        | .5em 1em             | Content padding of the tooltips        |
| $psv-tooltip-arrow-size     | 7px                  | Tooltips' arrow size                   |
| $psv-tooltip-max-width      | 200px                | Maximum width of the tooltips' content |
| $psv-tooltip-text-color     | rgb(255, 255, 255)   | Text color of the tooltips             |
| $psv-tooltip-font           | 14px sans-serif      | Font of the tooltips                   |
| $psv-tooltip-text-shadow    | 0 1px #000           | Shadow applied to the tooltips' text   |
| $psv-tooltip-shadow-color   | rgba(90, 90, 90, .7) | Color of the tooltips' shadow          |
| $psv-tooltip-shadow-offset  | 3px                  | Size of the tooltips' shadow           |
| $psv-tooltip-animate-offset | 5px                  | Distance travelled on show animation   |
| $psv-tooltip-animate-delay  | 100ms                | Duration of the show animation         |

## Panel

| variable                 | default              | description                     |
| ------------------------ | -------------------- | ------------------------------- |
| $psv-panel-background    | rgba(10, 10, 10, .7) | Background of the panel         |
| $psv-panel-width         | 400px                | Default width of the panel      |
| $psv-panel-padding       | 1em                  | Content padding of the panel    |
| $psv-panel-text-color    | rgb(220, 220, 220)   | Default text color of the panel |
| $psv-panel-font          | 16px sans-serif      | Default font of the panel       |
| $psv-panel-animate-delay | 100ms                | Duration of the show animation  |

#### Menu

| variable                         | default                 | description                                |
| -------------------------------- | ----------------------- | ------------------------------------------ |
| $psv-panel-title-font            | 24px sans-serif         | Font of the menu title                     |
| $psv-panel-title-icon-size       | 24px                    | Size of the menu title icon                |
| $psv-panel-title-margin          | 24px                    | Margin of the menu title                   |
| $psv-panel-menu-item-height      | 1.5em                   | Minimum eight of an item in the menu       |
| $psv-panel-menu-item-padding     | .5em 1em                | Padding of an item in the menu             |
| $psv-panel-menu-odd-background   | rgba(255, 255, 255, .1) | Background color of odd items in the menu  |
| $psv-panel-menu-even-background  | transparent             | Background color of even items in the menu |
| $psv-panel-menu-hover-background | rgba(255, 255, 255, .2) | Background color of items on mouse hover   |

## Notification

| variable                        | default                 | description                               |
| ------------------------------- | ----------------------- | ----------------------------------------- |
| $psv-notification-position-from | -$psv-navbar-height     | Position of the notification when hidden  |
| $psv-notification-position-to   | $psv-navbar-height \* 2 | Position of the notification when visible |
| $psv-notification-animate-delay | 200ms                   | Duration of the show animation            |
| $psv-notification-background    | $psv-tooltip-background | Background color of the notification      |
| $psv-notification-radius        | $psv-tooltip-radius     | Border radius of the notification         |
| $psv-notification-padding       | $psv-tooltip-padding    | Content padding of the notification       |
| $psv-notification-font          | $psv-tooltip-font       | Font of the notification                  |
| $psv-notification-text-color    | $psv-tooltip-text-color | Text color of the notification            |

## Overlay

| variable                 | default                            | description                                      |
| ------------------------ | ---------------------------------- | ------------------------------------------------ |
| $psv-overlay-opacity     | .8                                 | Opacity of the overlay                           |
| $psv-overlay-title-font  | 30px sans-serif                    | Font of the overlay title                        |
| $psv-overlay-title-color | black                              | Color of the overlay title                       |
| $psv-overlay-text-font   | 20px sans-serif                    | Font of the overlay text                         |
| $psv-overlay-text-color  | rgba(0, 0, 0, .8)                  | Color of the overlay text                        |
| $psv-overlay-image-size  | (portrait: 50%,<br>landscape: 33%) | Image/Icon size, depending on screen orientation |
