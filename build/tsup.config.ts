import type { Plugin } from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import { defineConfig } from 'tsup';
import { assetsPlugin } from './plugins/esbuild-plugin-assets';
import { budgetPlugin } from './plugins/esbuild-plugin-budget';
import { mapFixPlugin } from './plugins/esbuild-plugin-map-fix';
import { scssBundlePlugin } from './plugins/esbuild-plugin-scss-bundle';
import { license } from './templates/license';
import { npmrc } from './templates/npmrc';
import { packageJson } from './templates/package';
import { readme } from './templates/readme';

export default function createConfig(pkg: any) {
    const banner = `/*!
 * ${pkg.psv.title} ${pkg.version}
${
    pkg.name === '@photo-sphere-viewer/core' ? ' * @copyright 2014-2015 Jérémy Heleine\n' : ''
} * @copyright 2015-${new Date().getFullYear()} Damien "Mistic" Sorel
 * @licence MIT (https://opensource.org/licenses/MIT)
 */`;

    return defineConfig((options) => {
        const e2e = options.env?.E2E;
        const dev = e2e || options.watch;

        const plugins: Plugin[] = [
            sassPlugin(),
        ];

        if (!e2e) {
            plugins.push(
                mapFixPlugin(),
            );
        }

        if (!dev) {
            plugins.push(
                budgetPlugin(pkg.psv.budget),
                scssBundlePlugin(),
                assetsPlugin({
                    'LICENSE': license(),
                    '.npmrc': npmrc(),
                    'README.md': readme(pkg),
                    'package.json': packageJson(pkg),
                }),
            );
        }

        return {
            entryPoints: [pkg.main],
            outDir: 'dist',
            clean: true,
            format: dev ? ['esm'] : ['esm', 'cjs'],
            outExtension: ({ format }) => ({
                js: { cjs: '.cjs', esm: '.module.js', iife: '.js' }[format],
            }),
            dts: !dev,
            sourcemap: true,
            external: ['three'],
            noExternal: [/three\/examples\/.*/],
            target: 'es2021',
            define: {
                PKG_VERSION: `'${pkg.version}'`,
            },
            loader: {
                '.svg': 'text',
                '.glsl': 'text',
            },
            banner: {
                js: banner,
                css: banner,
            },
            esbuildPlugins: plugins,
        };
    });
}
