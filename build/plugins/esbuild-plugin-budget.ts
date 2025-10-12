import type { Plugin } from 'esbuild';
import chalk from 'chalk';

/**
 * Checks the final bundle size
 */
export function budgetPlugin(budget: string): Plugin {
    if (!budget || !budget.endsWith('kb')) {
        throw new Error('Missing/invalid budget');
    }

    const maxsize = 1024 * parseInt(budget, 10) + 1023;

    return {
        name: 'budget',
        setup(build) {
            build.onEnd((result) => {
                ['index.cjs', 'index.module.js'].forEach((filename) => {
                    const file = result.outputFiles.find(f => f.path.endsWith(filename));
                    if (file) {
                        if (file.contents.length > maxsize) {
                            const size = Math.round(file.contents.length / 1024);
                            throw chalk.red(`File ${filename} exceeds budget of ${budget}, current size: ${size}kb`);
                        }
                    }
                });
            });
        },
    };
}
