import type { AbstractPlugin, SphericalPosition, Viewer } from '@photo-sphere-viewer/core';
import { BASE_URL, NO_LOG } from './constants';

export function waitViewerReady() {
    callViewer('wait ready').then((viewer) => {
        if (!viewer.state.ready) {
            return new Promise((resolve) => {
                viewer.addEventListener('ready', () => {
                    setTimeout(resolve, 200);
                }, { once: true });
            });
        } else if (viewer.state.loadingPromise) {
            return viewer.state.loadingPromise;
        } else {
            return Promise.resolve();
        }
    });
}

export function callViewer(log: string): Cypress.Chainable<Viewer> {
    cy.log(`Viewer: ${log}`);
    return cy.window(NO_LOG)
        .its('viewer', NO_LOG);
}

export function callPlugin<T extends AbstractPlugin<any>>(id: string, log: string | false): Cypress.Chainable<T> {
    if (log !== false) {
        cy.log(`${id}: ${log}`);
    }
    return cy.window(NO_LOG)
        .its('viewer', NO_LOG)
        .then(viewer => viewer.getPlugin(id));
}

export function checkPosition(position: SphericalPosition) {
    callViewer('check position')
        .then(viewer => expect(viewer.getPosition()).to.deep.eq(position));
}

export function checkZoom(zoom: number) {
    callViewer('check zoom')
        .then(viewer => expect(viewer.getZoomLevel()).to.eq(zoom));
}

export function checkPanorama(name: string) {
    callViewer('check panorama')
        .then(viewer => expect(viewer.config.panorama as string).to.eq(BASE_URL + name));
}

export function setPanorama(name: string) {
    callViewer(`set panorama "${name}"`)
        .then(viewer => viewer.setPanorama(BASE_URL + name, { transition: false }));
    waitViewerReady();
}

export function listenViewerEvent(name: Parameters<Viewer['addEventListener']>[0]): Cypress.Agent<sinon.SinonStub> {
    const handler = cy.stub();
    callViewer(`listen "${name}"`).then(viewer => viewer.addEventListener(name, handler));
    return handler;
}

export function checkEventHandler(handler: Cypress.Agent<sinon.SinonStub>, params: any) {
    cy.wrap(handler, NO_LOG)
        .should('have.been.calledWithMatch', params);
}

export function createBaseSnapshot() {
    if (Cypress.config('isInteractive')) {
        Cypress.env('visualRegressionType', 'base');
    } else {
        throw new Error(`Unauthorized call to createBaseSnapshot`);
    }
}

export function triggerWindowKeydown(key: string) {
    cy.window().trigger('keydown', { key, altKey: false, shiftKey: false, ctrlKey: false, metaKey: false });
}
