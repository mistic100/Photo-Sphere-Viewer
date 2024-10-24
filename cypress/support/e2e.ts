import 'cypress-real-events';
import 'cypress-mochawesome-reporter/register';
import { addCompareSnapshotCommand } from 'cypress-visual-regression/dist/command';

addCompareSnapshotCommand({
    errorThreshold: 0.1,
    failSilently: !Cypress.config('isInteractive'),
});

if (!Cypress.config('isInteractive')) {
    Cypress.Commands.overwrite('compareSnapshot', (originalFn, name, options = {}) => {
        return originalFn(name, options)
            .then(result => {
                if (result.images.diff) {
                    // @ts-ignore
                    Cypress.Mochawesome.context.push({ title: 'Visual regression diff', value: 'data:image/png;base64,' + result.images.diff });
                }

                if (result.error) {
                    throw new Error(result.error);
                }

                return result;
            });
    });
}
