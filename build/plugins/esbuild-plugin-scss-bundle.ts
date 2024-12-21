import type { Plugin } from 'esbuild';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

/**
 * Copy SCSS files and generates main index.scss
 */
export function scssBundlePlugin(): Plugin {
    return {
        name: 'scss-bundle',
        setup(build) {
            if (build.initialOptions.format !== 'esm') {
                return;
            }

            build.onEnd((result) => {
                const scssFile = Object.keys(result.metafile.inputs).find(file => file.endsWith('index.scss'));
                if (!scssFile) {
                    return;
                }

                const outdir = build.initialOptions.outdir;
                const banner = build.initialOptions.banner.css;

                console.log('SCSS', 'Copy files');

                return mkdir(outdir + '/styles', { recursive: true })
                    .then(() => glob(`${path.dirname(scssFile)}/*.scss`))
                    .then(files => Promise.all([
                        // copy each file fixing paths to core
                        ...files.map(file => readFile(file, 'utf-8')
                            .then((content) => {
                                content = content.replace(
                                    new RegExp(`../../../core/src/styles`, 'g'),
                                    `../../core/styles`,
                                );
                                if (file.endsWith('index.scss')) {
                                    content = banner + '\n' + content;
                                }
                                return writeFile(outdir + '/styles/' + path.basename(file), content);
                            })),
                    ]))
                    .then(() => void 0);
            });
        },
    };
}
