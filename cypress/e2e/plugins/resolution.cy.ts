import type { ResolutionPlugin } from '@photo-sphere-viewer/resolution-plugin';
import { callPlugin, callViewer, checkEventHandler, checkPanorama, setPanorama, waitViewerReady } from '../../utils';
import { BASE_URL } from '../../utils/constants';

describe('plugin: resolution', () => {
    beforeEach(() => {
        localStorage.photoSphereViewer_touchSupport = 'false';
        cy.visit('e2e/plugins/resolution.html');
        waitViewerReady();
    });

    it('should destroy', () => {
        callViewer('destroy').then(viewer => viewer.destroy());
    });

    it('should display the settings', () => {
        cy.get('.psv-settings-button')
            .compareScreenshots('button-sd')
            .click();

        cy.get('.psv-settings').compareScreenshots('settings');

        cy.get('[data-setting-id="resolution"]').click();

        cy.get('.psv-settings').compareScreenshots('settings-options');
    });

    it('should not show the settings badge', () => {
        cy.visit('e2e/plugins/resolution.html?showBadge=false');

        cy.get('.psv-settings-button').should('not.include.text', 'SD');
    });

    it('should translate the setting', () => {
        callViewer('set lang').then(viewer => viewer.setOption('lang', { resolution: 'Qualité' }));

        cy.get('.psv-settings-button').click();

        cy.get('.psv-settings').should('include.text', 'Qualité');
    });

    it('should use the first resolution', () => {
        checkPanorama('sphere-small.jpg');
    });

    it('should use the default resolution', () => {
        cy.visit('e2e/plugins/resolution.html?resolution=HD');

        checkPanorama('sphere-small.jpg?hd');
    });

    it('should ignore default resolution with initial panorama', () => {
        cy.visit('e2e/plugins/resolution.html?resolution=HD&withPanorama=true');

        checkPanorama('sphere-small.jpg');
    });

    it('should change the resolution', () => {
        const resolutionChangeHandler = listenResolutionEvent('resolution-changed');

        cy.get('.psv-settings-button').click();
        cy.get('[data-setting-id="resolution"]').click();
        cy.get('[data-option-id="HD"]').click();

        checkPanorama('sphere-small.jpg?hd');
        checkEventHandler(resolutionChangeHandler, { resolutionId: 'HD' });
        cy.get('.psv-settings-button')
            .blur()
            .compareScreenshots('button-hd');
    });

    it('should change the resolution by API', () => {
        const resolutionChangeHandler = listenResolutionEvent('resolution-changed');

        callResolution('set resolution').then(resolution => resolution.setResolution('HD'));

        checkPanorama('sphere-small.jpg?hd');
        checkEventHandler(resolutionChangeHandler, { resolutionId: 'HD' });

        callResolution('set bad resolution').then((resolution) => {
            expect(() => resolution.setResolution('MD')).to.throw('Resolution "MD" unknown');
        });
    });

    it('should update resolution on panorama change', () => {
        const resolutionChangeHandler = listenResolutionEvent('resolution-changed');

        setPanorama('sphere-small.jpg?hd');

        checkEventHandler(resolutionChangeHandler, { resolutionId: 'HD' });
    });

    it('should change resolutions', () => {
        const resolutionChangeHandler = listenResolutionEvent('resolution-changed');

        // the current panorama is found in the new list
        callResolution('set resolutions w.o. default').then(resolution => resolution.setResolutions([
            { id: 'large', label: 'large', panorama: BASE_URL + 'sphere-small.jpg?hd' },
            { id: 'small', label: 'small', panorama: BASE_URL + 'sphere-small.jpg' },
        ]));

        checkEventHandler(resolutionChangeHandler, { resolutionId: 'small' });

        resolutionChangeHandler.reset();

        // a default value is provided
        callResolution('set resolutions w. default').then(resolution => resolution.setResolutions([
            { id: 'large', label: 'large', panorama: BASE_URL + 'sphere-small.jpg?hd' },
            { id: 'small', label: 'small', panorama: BASE_URL + 'sphere-small.jpg' },
        ], 'large'));
        cy.wait(200);

        checkPanorama('sphere-small.jpg?hd');
        checkEventHandler(resolutionChangeHandler, { resolutionId: 'large' });

        resolutionChangeHandler.reset();

        // the current panorama is NOT found in the new list
        setPanorama('sphere-test.jpg');
        callResolution('set resolutions w.o. default no match').then(resolution => resolution.setResolutions([
            { id: 'small', label: 'small', panorama: BASE_URL + 'sphere-small.jpg' },
            { id: 'large', label: 'large', panorama: BASE_URL + 'sphere-small.jpg?hd' },
        ]));
        cy.wait(200);

        checkPanorama('sphere-small.jpg');
        checkEventHandler(resolutionChangeHandler, { resolutionId: 'small' });
    });

    it('should throw if missing properties', () => {
        callResolution('set resolutions').then((resolution) => {
            expect(() => resolution.setResolutions([{ id: null, label: 'label', panorama: 'sphere.jpg' }])).to.throw('Missing resolution id');

            expect(() => resolution.setResolutions([{ id: 'sd', label: null, panorama: 'sphere.jpg' }])).to.throw('Missing resolution label');

            expect(() => resolution.setResolutions([{ id: 'sd', label: 'label', panorama: null }])).to.throw('Missing resolution panorama');
        });
    });

    function callResolution(log: string) {
        return callPlugin<ResolutionPlugin>('resolution', log);
    }

    function listenResolutionEvent(name: Parameters<ResolutionPlugin['addEventListener']>[0]): Cypress.Agent<sinon.SinonStub> {
        const handler = cy.stub();
        callResolution(`listen "${name}"`).then(resolution => resolution.addEventListener(name, handler));
        return handler;
    }
});
