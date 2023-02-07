import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { Bundler } from 'scss-bundle';

/**
 * Generates a bundled scss file
 */
export function scssBundlePlugin() {
    return {
        name: 'scss-bundle',
        setup(build) {
            const outdir = build.initialOptions.outdir;
            const outpath = outdir + '/index.scss';

            build.onEnd((result) => {
                const scssFile = Object.keys(result.metafile.inputs).find((file) => file.endsWith('.scss'));
                if (!scssFile) {
                    return;
                }

                console.log('SCSS', outpath);

                const banner = build.initialOptions.banner.css;

                return mkdir(path.resolve(outdir), { recursive: true })
                    .then(() => new Bundler(undefined, process.cwd()).bundle(scssFile))
                    .then(({ bundledContent }) => writeFile(path.resolve(outpath), banner + '\n\n' + bundledContent))
                    .then(() => undefined);
            });
        },
    };
}
