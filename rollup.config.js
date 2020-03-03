import fs from 'fs';
import path from 'path';
import alias from 'rollup-plugin-alias';
import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss'
import { string } from 'rollup-plugin-string';

import pkg from './package.json';

const banner = `/*!
* Photo Sphere Viewer ${pkg.version}
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-${new Date().getFullYear()} Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/`;

const cssBanner = `Photo Sphere Viewer ${pkg.version}
@copyright 2014-2015 Jérémy Heleine
@copyright 2015-${new Date().getFullYear()} Damien "Mistic" Sorel
@licence MIT (https://opensource.org/licenses/MIT)`;

function camelize(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, m => m.toUpperCase())
    .replace(/(?:\W|_)/g, '');
}

const baseConfig = {
  output  : {
    format   : 'umd',
    sourcemap: true,
    banner   : banner,
    globals  : {
      'three' : 'THREE',
      'uevent': 'uEvent',
    },
  },
  external: [
    'three',
    'uevent',
  ],
  // wrapped in a function to ensure unique plugin instances for each entry-point
  // https://github.com/egoist/rollup-plugin-postcss/issues/158
  plugins : () => [
    babel({
      exclude: 'node_modules/**',
    }),
    postcss({
      extract  : true,
      sourceMap: true,
      plugins  : [
        require('@csstools/postcss-sass')({}),
        require('autoprefixer')({}),
        require('postcss-banner')({
          banner   : cssBanner,
          important: true,
        }),
      ],
    }),
    string({
      include: [
        'src/**/*.svg',
      ],
    }),
  ],
};

const secondaryConfig = {
  ...baseConfig,
  output  : {
    ...baseConfig.output,
    globals: {
      ...baseConfig.output.global,
      'photo-sphere-viewer': 'PhotoSphereViewer'
    },
  },
  external: [
    ...baseConfig.external,
    'photo-sphere-viewer'
  ],

  plugins: () => [
    ...baseConfig.plugins(),
    alias({
      'photo-sphere-viewer': './src',
    }),
  ],
};

export default [
  {
    ...baseConfig,
    input  : 'src/index.js',
    output : {
      ...baseConfig.output,
      file: 'dist/photo-sphere-viewer.js',
      name: 'PhotoSphereViewer',
    },
    plugins: baseConfig.plugins(),
  },
  {
    ...secondaryConfig,
    input  : `src/ViewerCompat`,
    output : {
      ...secondaryConfig.output,
      file: `dist/viewer-compat.js`,
      name: `PhotoSphereViewer.ViewerCompat`,
    },
    plugins: secondaryConfig.plugins(),
  },
].concat(
  fs.readdirSync(path.join(__dirname, 'src/plugins'))
    .filter(p => p !== 'AbstractPlugin.js')
    .map(p => ({
      ...secondaryConfig,
      input  : `src/plugins/${p}/index.js`,
      output : {
        ...secondaryConfig.output,
        file: `dist/plugins/${p}-plugin.js`,
        name: `PhotoSphereViewer.${camelize(p)}Plugin`,
      },
      plugins: secondaryConfig.plugins(),
    }))
);
