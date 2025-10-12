import 'cypress-mochawesome-reporter/register';
import '@cypress/code-coverage/support';
import { addCompareSnapshotCommand } from 'cypress-visual-regression/dist/command';
import { NO_LOG } from '../utils/constants';

addCompareSnapshotCommand({
    errorThreshold: 0.05,
    failSilently: !Cypress.config('isInteractive'),
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
        interface Chainable {
            compareScreenshots(name: string, options?: { errorThreshold?: number; hideViewer?: boolean }): Chainable<JQuery<HTMLElement>>;
        }
    }
}

Cypress.Commands.add('compareScreenshots', { prevSubject: ['element'] }, (subject, name, options = {}) => {
    if (options.hideViewer !== false) {
        cy.get('.psv-canvas-container', NO_LOG).then(container => container.hide());
    }

    cy.wrap(subject, NO_LOG).compareSnapshot(name, options)
        .then((result) => {
            if (result.images.diff) {
                // @ts-ignore
                Cypress.Mochawesome.context.push({ title: `Visual regression diff (${name})`, value: 'data:image/png;base64,' + result.images.diff });
            }

            if (result.error) {
                throw new Error(result.error);
            }

            if (options.hideViewer !== false) {
                return cy.get('.psv-canvas-container', NO_LOG).then(container => container.show());
            }
        });

    return cy.wrap(subject, NO_LOG);
});
