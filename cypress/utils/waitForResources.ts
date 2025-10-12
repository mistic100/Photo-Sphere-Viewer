import { NO_LOG } from './constants';

export function waitForResources(...names) {
    cy.log(`Waiting for resources ${names.join(', ')}`);

    cy.window(NO_LOG).then((win) => {
        return new Cypress.Promise((resolve, reject) => {
            let foundResources = false;

            const timeout = setTimeout(() => {
                if (foundResources) {
                    return;
                }

                clearInterval(interval);
                clearTimeout(timeout);

                reject(new Error(`Timed out waiting for resources ${names.join(', ')}`));
            }, 10000);

            const interval = setInterval(() => {
                foundResources = names.every((name) => {
                    return win.performance
                        .getEntriesByType('resource')
                        .find(item => item.name.endsWith(name));
                });

                if (!foundResources) {
                    return;
                }

                clearInterval(interval);
                clearTimeout(timeout);

                cy.log('Found all resources');
                resolve();
            }, 100);
        });
    });
}
