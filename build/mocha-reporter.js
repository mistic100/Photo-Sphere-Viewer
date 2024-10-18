const BaseReporter = require('mocha/lib/reporters/base');
const SpecReporter = require('mocha/lib/reporters/spec');
const JsonReporter = require('mocha/lib/reporters/json');
const path = require('path');
const fs = require('fs');

module.exports = class MultiReporter extends BaseReporter {
    constructor(runner, options) {
        super(runner, options);

        new SpecReporter(runner, {});

        if (options.reporterOptions?.cypress) {
            new CypressJsonReporter(runner, {
                reporterOption: {
                    output: 'cypress/reports/e2e.json',
                },
            });
        } else {
            new JsonReporter(runner, {
                reporterOption: {
                    output: `reports/mocha.json`,
                },
            });
        }
    }
};

// custom json reporter for cypress (for some reason, calling JsonReporter does not work)
// - write the results to a json file
// - fill the "file" property of each test
function CypressJsonReporter(runner, options) {
    BaseReporter.call(this, runner, options);

    const tests = [];
    const pending = [];
    const failures = [];
    const passes = [];

    runner.on('test end', function (test) {
        tests.push(test);
    });

    runner.on('pass', function (test) {
        passes.push(test);
    });

    runner.on('fail', function (test) {
        failures.push(test);
    });

    runner.on('pending', function (test) {
        pending.push(test);
    });

    runner.once('end', () => {
        const obj = {
            stats: this.stats,
            tests: tests.map(clean),
            pending: pending.map(clean),
            failures: failures.map(clean),
            passes: passes.map(clean)
        };
        const json = JSON.stringify(obj, null, 2);
        const output = options.reporterOption.output;
        fs.mkdirSync(path.dirname(output), { recursive: true });
        fs.writeFileSync(output, json);
    });

    function clean(test) {
        let err = test.err || {};
        if (err instanceof Error) {
            err = errorJSON(err);
        }

        return {
            title: test.title,
            fullTitle: test.fullTitle(),
            file: test.invocationDetails.absoluteFile,
            duration: test.duration,
            currentRetry: test.currentRetry(),
            speed: test.speed,
            err: cleanCycles(err)
        };
    }

    function cleanCycles(obj) {
        let cache = [];
        return JSON.parse(
            JSON.stringify(obj, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (cache.indexOf(value) !== -1) {
                        // Instead of going in a circle, we'll print [object Object]
                        return '' + value;
                    }
                    cache.push(value);
                }

                return value;
            })
        );
    }

    function errorJSON(err) {
        let res = {};
        Object.getOwnPropertyNames(err).forEach((key) => {
            res[key] = err[key];
        }, err);
        return res;
    }
}
