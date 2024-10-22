import { Viewer } from '@photo-sphere-viewer/core';

export function waitViewerReady() {
    callViewer('wait ready', viewer => {
        return new Promise(resolve => {
            viewer.addEventListener('ready', () => {
                setTimeout(resolve, 200);
            }, { once: true });
        });
    });
}

export function callViewer(log: string, cb: (viewer: Viewer) => void) {
    cy.log(`Viewer: ${log}`);
    cy.window({ log: false }).its('viewer', { log: false }).then(cb);
}

export function createBaseSnapshot() {
    Cypress.env('visualRegressionType', 'base');
}
