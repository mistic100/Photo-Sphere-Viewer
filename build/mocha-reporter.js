const BaseReporter = require('mocha/lib/reporters/base');
const SpecReporter = require('mocha/lib/reporters/spec');
// Cypress breaks the reporter ?
// https://github.com/cypress-io/cypress/issues/27636
const JsonReporter = require('../node_modules/mocha/lib/reporters/json.js');
const path = require('path');

module.exports = class MultiReporter extends BaseReporter {
    constructor(runner, options) {
        super(runner, options);
        
        // mocha uses "reporterOption", cypress uses "reporterOptions"
        const title = options.reporterOption?.title ?? options.reporterOptions?.title ?? 'report';

        new SpecReporter(runner, {});

        new JsonReporter(runner, {
            reporterOption: {
                output: path.join(__dirname, '../reports', `${title}.json`),
            },
        });
    }
};
