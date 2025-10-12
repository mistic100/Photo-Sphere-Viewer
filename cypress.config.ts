
import fs from 'fs-extra';
import registerCodeCoverageTasks from '@cypress/code-coverage/task';
import { defineConfig } from 'cypress';
// @ts-ignore
import cypressOnFix from 'cypress-on-fix';
import { configureVisualRegression } from 'cypress-visual-regression';
// @ts-ignore
import cypressMochawesomeReporterPlugin from 'cypress-mochawesome-reporter/plugin';

export default defineConfig({
    e2e: {
        viewportWidth: 1280,
        viewportHeight: 900,
        baseUrl: 'https://127.0.0.1:8080',
        scrollBehavior: false,
        screenshotOnRunFailure: false,
        env: {
            visualRegressionType: 'regression',
        },
        setupNodeEvents(on, config) {
            on = cypressOnFix(on);

            fs.removeSync('.nyc_output');

            registerCodeCoverageTasks(on, config);
            configureVisualRegression(on);
            cypressMochawesomeReporterPlugin(on);

            // define browser size for screenshots (headless mode)
            on('before:browser:launch', (browser, launchOptions) => {
                // should be bigger than the largest viewport used + browser UI elements
                const width = 1600;
                const height = 1200;

                if (browser.name.startsWith('chrom') && browser.isHeadless) {
                    launchOptions.args.push(`--window-size=${width},${height}`);
                    launchOptions.args.push('--force-device-scale-factor=1');
                }

                if (browser.name === 'electron' && browser.isHeadless) {
                    launchOptions.preferences.width = width;
                    launchOptions.preferences.height = height;
                }

                if (browser.name === 'firefox' && browser.isHeadless) {
                    launchOptions.args.push(`--width=${width}`);
                    launchOptions.args.push(`--height=${height}`);
                }

                return launchOptions
            });

            // move lcov html report
            on('after:run', () => {
                const ROOT_DIR = 'cypress/reports/';

                console.log(`Move ${ROOT_DIR}lcov-viewer to ${ROOT_DIR}html/coverage`);

                fs.mkdirSync(`${ROOT_DIR}html/coverage`, { recursive: true });
                fs.copyFileSync(`${ROOT_DIR}lcov-viewer/report-data.js`, `${ROOT_DIR}html/coverage/report-data.js`);

                const lcovIndex = fs.readFileSync(`${ROOT_DIR}lcov-viewer/index.html`, 'utf-8')
                    .replace('src="app.js"', 'src="https://cdn.jsdelivr.net/npm/@lcov-viewer/istanbul-report@1/lib/assets/app.js"')
                    .replace(/<title>.*<\/title>/, '<title>Photo Sphere Viewer - E2E coverage</title>');

                fs.writeFileSync(`${ROOT_DIR}html/coverage/index.html`, lcovIndex, 'utf-8');

                console.log(`Add link to coverage in ${ROOT_DIR}html/index.html`);

                const cypressIndex = fs.readFileSync(`${ROOT_DIR}html/index.html`, 'utf-8')
                    .replace('</body>', `<script>
const list = document.querySelector('[class^="quick-summary--list"]');
const item = list.firstChild.cloneNode(true);
item.querySelector('i').innerHTML = '&#xe6c4;';
item.querySelector('span').innerHTML = '<a href="coverage" style="color:white;text-decoration:underline;">Coverage</a>';
list.prepend(item);
</script></body>`);

                fs.writeFileSync(`${ROOT_DIR}html/index.html`, cypressIndex, 'utf-8');
            });

            return config;
        },
    },
    clientCertificates: [
        {
            url: 'https://127.0.0.1:8080',
            certs: [{
                cert: '.tmp/fake-cert.pem',
                key: '.tmp/fake-cert.key',
            }],
        },
    ],
    reporter: 'build/mocha-reporter.js',
    reporterOptions: {
        cypress: true,
        // cypress-mochawesome-reporter
        removeJsonsFolderAfterMerge: false,
        cdn: true,
        charts: true,
        reportTitle: 'Photo Sphere Viewer',
        reportPageTitle: 'Photo Sphere Viewer - E2E results',
    },
});
