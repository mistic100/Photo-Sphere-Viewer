import { defineConfig } from 'cypress';
import { configureVisualRegression } from 'cypress-visual-regression';
// @ts-ignore
import  cypressMochawesomeReporterPlugin from 'cypress-mochawesome-reporter/plugin';

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
        setupNodeEvents(on) {
            configureVisualRegression(on);
            cypressMochawesomeReporterPlugin(on);

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
    },
});
