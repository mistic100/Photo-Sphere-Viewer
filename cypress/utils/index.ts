import { Viewer } from '@photo-sphere-viewer/core';

export function waitNoLoader() {
    cy.get('.psv-loader-container').should('not.be.visible');
}

export function callViewer(cb: (viewer: Viewer) => void) {
    cy.window().its('viewer').then(cb);
}
