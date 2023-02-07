import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

/**
 *
 */
export function assetsPlugin(files) {
    return {
        name: 'assets',
        setup(build) {
            build.onEnd((result) => {
                const outdir = build.initialOptions.outdir;

                return mkdir(path.resolve(outdir), { recursive: true })
                    .then(() =>
                        Promise.all(
                            Object.entries(files).map(([filename, content]) => {
                                const outpath = outdir + '/' + filename;
                                console.log('ASSET', outpath);
                                return content.then((content) => writeFile(outpath, content));
                            })
                        )
                    )
                    .then(() => undefined);
            });
        },
    };
}
