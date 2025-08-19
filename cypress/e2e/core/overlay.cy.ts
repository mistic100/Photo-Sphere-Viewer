import { type Overlay } from '@photo-sphere-viewer/core';
import { callViewer, checkEventHandler, listenViewerEvent, triggerWindowKeydown, waitViewerReady } from '../../utils';
import { NO_LOG, VIEWPORT_MOBILE } from '../../utils/constants';

describe('core: overlay', () => {
    beforeEach(() => {
        cy.visit('e2e/core/base.html');
        waitViewerReady();
        // createBaseSnapshot();
    });

    it('should show/hide the overlay', () => {
        const showOverlayHandler = listenViewerEvent('show-overlay');
        const hideOverlayHandler = listenViewerEvent('hide-overlay');

        callOverlay('show overlay').then(overlay => overlay.show('title'));
        checkEventHandler(showOverlayHandler, { overlayId: null });
        checkOverlayVisibleApi(true);
        cy.get('.psv-overlay').should('be.visible');

        callOverlay('hide overlay').then(overlay => overlay.hide());
        checkEventHandler(hideOverlayHandler, { overlayId: null });
        checkOverlayVisibleApi(false);
        cy.get('.psv-overlay').should('not.be.visible');
    });

    it('should hide on click and esc key', () => {
        callOverlay('show overlay').then(overlay => overlay.show('title'));
        cy.get('.psv-overlay').should('be.visible');

        cy.get('.psv-overlay').click();
        cy.get('.psv-overlay').should('not.be.visible');

        callOverlay('show overlay').then(overlay => overlay.show('title'));
        cy.get('.psv-overlay').should('be.visible');

        triggerWindowKeydown('Escape');
        cy.get('.psv-overlay').should('not.be.visible');
    });

    it('should not be dismissible', () => {
        callOverlay('show overlay').then(overlay => overlay.show({
            title: 'title',
            dismissible: false,
        }));

        cy.get('.psv-overlay').click();
        cy.get('.psv-overlay').should('be.visible');

        triggerWindowKeydown('Escape');
        cy.get('.psv-overlay').should('be.visible');
    });

    it('should show the overlay with id', () => {
        const showOverlayHandler = listenViewerEvent('show-overlay');
        const hideOverlayHandler = listenViewerEvent('hide-overlay');

        callOverlay('show overlay a').then(overlay => overlay.show({
            title: 'title',
            id: 'overlay-a',
        }));
        checkEventHandler(showOverlayHandler, { overlayId: 'overlay-a' });
        checkOverlayVisibleApi(true);
        checkOverlayVisibleApi(true, 'overlay-a');
        checkOverlayVisibleApi(false, 'overlay-b');

        callOverlay('hide overlay b').then(overlay => overlay.hide('overlay-b'));
        cy.wrap(hideOverlayHandler, NO_LOG).should('not.have.been.called');
        checkOverlayVisibleApi(true, 'overlay-a');
        cy.get('.psv-overlay').should('be.visible');

        callOverlay('hide overlay a').then(overlay => overlay.hide('overlay-a'));
        checkEventHandler(hideOverlayHandler, { overlayId: 'overlay-a' });
        checkOverlayVisibleApi(false, 'overlay-a');

        callOverlay('show overlay b').then(overlay => overlay.show({
            title: 'title',
            id: 'overlay-b',
        }));
        checkEventHandler(showOverlayHandler, { overlayId: 'overlay-b' });
        checkOverlayVisibleApi(true, 'overlay-b');

        callOverlay('hide any overlay').then(panel => panel.hide());
        checkEventHandler(hideOverlayHandler, { overlayId: 'overlay-b' });
        checkOverlayVisibleApi(false);
    });

    it('should show title/text/image', () => {
        callOverlay('show overlay').then(overlay => overlay.show({
            title: 'Welcome',
            text: 'This is a demo',
            image: '<img src=https://photo-sphere-viewer.js.org/favicon.png>',
        }));

        cy.waitForResources('favicon.png');

        cy.get('.psv-overlay').compareScreenshots('desktop');

        cy.viewport(VIEWPORT_MOBILE.viewportWidth, VIEWPORT_MOBILE.viewportHeight);

        cy.get('.psv-overlay').compareScreenshots('mobile');
    });

    function callOverlay(log: string): Cypress.Chainable<Overlay> {
        return callViewer(log).then(viewer => viewer.overlay);
    }

    function checkOverlayVisibleApi(visible: boolean, id?: string) {
        callOverlay(`check ${id ? `overlay "${id}"` : 'any overlay'} ${visible ? 'visible' : 'not visible'}`)
            .then((overlay) => {
                expect(overlay.isVisible(id)).to.eq(visible);
            });
    }
});
