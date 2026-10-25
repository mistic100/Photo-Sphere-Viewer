import mocha from 'mocha';

export default class MultiReporter extends mocha.reporters.Base {
    constructor(runner, options) {
        super(runner, options);

        new mocha.reporters.Spec(runner, {});

        new mocha.reporters.JSON(runner, {
            reporterOption: {
                output: 'reports/mocha.json',
            },
        });
    }

    done(failures, exit) {
        exit(failures);
    }
}
