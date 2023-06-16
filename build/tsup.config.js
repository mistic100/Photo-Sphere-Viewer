import { externalGlobalPlugin } from 'esbuild-plugin-external-global';
import { sassPlugin } from 'esbuild-sass-plugin';
import { defineConfig } from 'tsup';
import { assetsPlugin } from './plugins/esbuild-plugin-assets';
import { scssBundlePlugin } from './plugins/esbuild-plugin-scss-bundle';
import { umdPlugin } from './plugins/esbuild-plugin-umd';
import { cssMapPlugin } from './plugins/esbuild-plugin-css-map';
import { license } from './templates/license';
import { npmrc } from './templates/npmrc';
import { packageJson } from './templates/package';
import { readme } from './templates/readme';

const externals = {
    'three': 'THREE',
    '@photo-sphere-viewer/core': 'PhotoSphereViewer',
    '@photo-sphere-viewer/cubemap-adapter': 'PhotoSphereViewer.CubemapAdapter',
    '@photo-sphere-viewer/gyroscope-plugin': 'PhotoSphereViewer.GyroscopePlugin',
    '@photo-sphere-viewer/settings-plugin': 'PhotoSphereViewer.SettingsPlugin',
};

export default function createConfig(pkg, entry = 'src/index.ts') {
    const banner = `/*!
 * ${pkg.psv.globalName} ${pkg.version}
${
    pkg.name === '@photo-sphere-viewer/core' ? ' * @copyright 2014-2015 Jérémy Heleine\n' : ''
} * @copyright ${new Date().getFullYear()} Damien "Mistic" Sorel
 * @licence MIT (https://opensource.org/licenses/MIT)
 */`;

    return defineConfig((options) => {
        const dev = options.watch || options.define?.['config'] === 'dev';
        const dts = !dev && options.define?.['dts'] !== 'off';

        return {
            entryPoints: [entry],
            outDir: 'dist',
            format: dev ? ['esm'] : ['iife', 'esm'],
            globalName: pkg.psv.globalName,
            outExtension({ format }) {
                return {
                    js: format === 'iife' ? '.js' : '.module.js',
                };
            },
            dts: dts,
            sourcemap: true,
            external: Object.keys(externals),
            noExternal: [/three\/examples\/.*/],
            target: 'es2021',
            esbuildPlugins: [
                sassPlugin(),
                externalGlobalPlugin(externals),
                umdPlugin({ pkg, externals }),
                cssMapPlugin(),
                ...(dev
                    ? []
                    : [
                          scssBundlePlugin(),
                          assetsPlugin({
                              'LICENSE': license(),
                              '.npmrc': npmrc(),
                              'README.md': readme(pkg),
                              'package.json': packageJson(pkg),
                          }),
                      ]),
            ],
            esbuildOptions(options, context) {
                options.banner = {
                    js: banner,
                    css: banner,
                };
                options.loader = {
                    '.svg': 'text',
                };
            },
            clean: true,
        };
    });
}
