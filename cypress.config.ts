
import registerCodeCoverageTasks from '@cypress/code-coverage/task';
import { defineConfig } from 'cypress';
import cypressMochawesomeReporterPlugin from 'cypress-mochawesome-reporter/plugin';
import cypressOnFix from 'cypress-on-fix';
import { configureVisualRegression } from 'cypress-visual-regression';
import fs from 'fs-extra';
import { globSync } from 'glob';

export default defineConfig({
    e2e: {
        defaultBrowser: 'chrome',
        viewportWidth: 1280,
        viewportHeight: 900,
        baseUrl: 'https://127.0.0.1:8080',
        scrollBehavior: false,
        screenshotOnRunFailure: false,
        expose: {
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

                if (browser.name === 'firefox' && browser.isHeadless) {
                    launchOptions.args.push(`--width=${width}`);
                    launchOptions.args.push(`--height=${height}`);
                }

                return launchOptions
            });

            // move lcov html report
            on('after:run', () => {
                const ROOT_DIR = 'cypress/reports/';
                const HTML_DIR = `${ROOT_DIR}html/`;

                // ---------
                console.log(`Rename html report to index.html`);

                const filename = globSync('*.html', { cwd: HTML_DIR })[0];
                if (filename !== 'index.html') {
                    fs.moveSync(`${HTML_DIR}${filename}`, `${HTML_DIR}index.html`);
                }

                // ---------
                console.log(`Move ${ROOT_DIR}lcov-viewer to ${ROOT_DIR}html/coverage`);

                fs.mkdirSync(`${HTML_DIR}coverage`, { recursive: true });
                fs.copyFileSync(`${ROOT_DIR}lcov-viewer/report-data.js`, `${HTML_DIR}coverage/report-data.js`);

                let content = fs.readFileSync(`${ROOT_DIR}lcov-viewer/index.html`, 'utf-8')
                    .replace('src="app.js"', 'src="https://cdn.jsdelivr.net/npm/@lcov-viewer/istanbul-report@1/lib/assets/app.js"')
                    .replace(/<title>.*<\/title>/, '<title>Photo Sphere Viewer - E2E coverage</title>');

                fs.writeFileSync(`${HTML_DIR}coverage/index.html`, content, 'utf-8');

                // ---------
                console.log(`Add link to coverage in ${HTML_DIR}index.html`);

                content = fs.readFileSync(`${HTML_DIR}index.html`, 'utf-8')
                    .replace('</body>', `<script>
const list = document.querySelector('[class^="quick-summary--list"]');
const item = list.firstChild.cloneNode(true);
item.querySelector('i').innerHTML = '&#xe6c4;';
item.querySelector('span').innerHTML = '<a href="coverage" style="color:white;text-decoration:underline;">Coverage</a>';
list.prepend(item);
</script></body>`);

                fs.writeFileSync(`${HTML_DIR}index.html`, content, 'utf-8');
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
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
        removeJsonsFolderAfterMerge: false,
        cdn: true,
        charts: true,
        reportTitle: 'Photo Sphere Viewer',
        reportPageTitle: 'Photo Sphere Viewer - E2E results',
        reportFilename: '[name]',
    },
});
