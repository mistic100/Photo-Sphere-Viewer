import { join } from 'node:path';

export default {
    reporter: join(import.meta.dirname, 'build/mocha-reporter.js'),
};
