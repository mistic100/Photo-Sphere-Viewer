import { exec } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import assert from 'assert';

const testDir = path.join(__dirname, 'fixtures/prepare-changelog');

describe('prepare-changelog', () => {
    it('should generate the changelog', (done) => {
        const gitLog = readFileSync(path.join(testDir, 'git-log.txt'), { encoding: 'utf8' });

        const proc = exec(`node ${path.join(__dirname, '../../../build/prepare-changelog.mjs')} 5.7.4 5.8.0`, { cwd: testDir }, (err) => {
            if (err) {
                assert.fail(err);
            }
        });

        proc.stdin!.write(gitLog);
        proc.stdin!.end();

        proc.on('exit', () => {
            const actual = readFileSync(path.join(testDir, 'dist/changelog_5.8.0.md'), { encoding: 'utf8' });

            const expected = `
Full changelog: [5.7.4...5.8.0](https://github.com/mistic100/Photo-Sphere-Viewer/compare/5.7.4...5.8.0)

- Fix #1329 virtual-tour: cannot click on arrows
- Fix #1326 markers: update marker failed when not in view
- Read additional XMP data
- Close #1288 dual fisheye adapter
- Fix overlays: export model
- Close #1163 virtual-tour: new arrows
- Close #1118 markers: add new "elementLayer" type
- Remove LittlePlanetAdapter`;

            assert.strictEqual(actual.trim(), expected.trim());

            done();
        });
    });
});
