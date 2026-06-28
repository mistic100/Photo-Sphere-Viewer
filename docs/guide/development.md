# Development

Photo Sphere Viewer is developped in [TypeScript](https://www.typescriptlang.org/) and [SASS](https://sass-lang.com/).
The repository is a [Turborepo](https://turbo.build/repo) mono-repo containing the core package as well as official adapters and plugins.
The building process is based on [tsup](https://tsup.egoist.dev/) (toolkit based on esbuild) with a bunch of customizations.
The documentation is created with [VitePress](https://vitepress.dev/) and [TypeDoc](https://typedoc.org/).
Files are linted with [ESLint](https://eslint.org/) and [Stylelint](https://stylelint.io/).
Tests are executed with [Mocha](https://mochajs.org/) and [Cypress](https://www.cypress.io/).
You will need [Node.js 22](https://nodejs.org/).

## Commands

-   launch the dev server with `npm run serve`
    -   watch only some packages with `npm run serve-filter`
-   launch the documentation with `npm run doc:serve`
-   launch the Cypress runner with `npm run e2e:open`
-   register all package for npm link with `npm run npm-link`
-   execute the linters with `npm run lint`
-   execute the unit tests with `npm run test`
-   execute the e2e tests with `npm run e2e:run`
-   build all the packages with `npm run build`
-   build the documentation with `npm run doc:build`

## Credits

These are the various photos and videos used across the demos:

- sphere, sphere-tiles, cubemap, cubemap-tiles: [Damien Sorel (me!)](https://galerie.strangeplanet.fr/picture.php?/1802/category/81)
- sphere-tiles-24k, cubemap-tiles-24k: [Greg Zaal](https://polyhaven.com/a/cannon)
- artist-workshop: [Oliksiy Yakovlyev](https://polyhaven.com/a/artist_workshop)
- equirectangular-video: [Mettle Communications](https://www.mettle.com/360vr-master-series-free-360-downloads-page)
- cubemap-video: [The Dalí Museum](https://www.youtube.com/watch?v=zQ2-oJOkTKc)
- tour : Pixexid (dead link)
- dual-fisheye: [Jonna Luostari](https://jonnaluostari.com)
- dual-fisheye-video: [AntVil](https://antvil.github.io)
