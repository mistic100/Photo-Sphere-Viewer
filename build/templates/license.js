import { readFile } from 'fs/promises';
import path from 'path';

export const license = (pkg) =>
    readFile(path.join(__dirname, '../../LICENSE'), { encoding: 'utf8' }).then((content) => {
        content = content.split('\n');
        if (pkg.name !== '@photo-sphere-viewer/core') {
            content.splice(2, 1);
        }
        if (pkg.psv.i18n) {
            content[2] += ' and contributors';
        }
        return content.join('\n');
    });
