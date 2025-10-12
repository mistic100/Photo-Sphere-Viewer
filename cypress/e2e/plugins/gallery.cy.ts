import type { GalleryPlugin } from '@photo-sphere-viewer/gallery-plugin';
import { callPlugin, callViewer, checkPanorama, setPanorama, waitForResources, waitViewerReady } from '../../utils';
import { BASE_URL, NO_LOG, VIEWPORT_MOBILE } from '../../utils/constants';

describe('plugin: gallery', () => {
    beforeEach(() => {
        localStorage.photoSphereViewer_touchSupport = 'false';
        cy.visit('e2e/plugins/gallery.html');
        waitViewerReady();
        waitForResources(
            'key-biscayne-1-thumb.jpg',
            'key-biscayne-2-thumb.jpg',
            'key-biscayne-3-thumb.jpg',
            'key-biscayne-4-thumb.jpg',
        );
    });

    it('should destroy', () => {
        callViewer('destroy').then(viewer => viewer.destroy());
    });

    it('should have a gallery', () => {
        cy.get('.psv-gallery')
            .should('be.visible')
            .compareScreenshots('base');
    });

    it('should hide gallery on panel open', () => {
        callViewer('open panel').then(viewer => viewer.panel.show('Lorem ipsum'));

        cy.get('.psv-gallery').should('not.be.visible');
    });

    it('should scroll horizontally', () => {
        cy.get('.psv-gallery')
            .trigger('wheel', { deltaY: 1 })
            .trigger('wheel', { deltaY: 1 })
            .trigger('wheel', { deltaY: 1 })
            .trigger('wheel', { deltaY: 1 });

        waitForAllThumbnails();

        cy.get('.psv-gallery').compareScreenshots('scroll-pan');
    });

    it('should click and drag', () => {
        cy.get('.psv-gallery')
            .trigger('mousedown', { clientX: 1200 })
            .trigger('mousemove', { clientX: 100 })
            .trigger('mouseup');

        waitForAllThumbnails();

        cy.get('.psv-gallery').compareScreenshots('scroll-pan');
    });

    it('should display fullscreen on mobile', VIEWPORT_MOBILE, () => {
        waitForAllThumbnails();

        cy.get('.psv-gallery').should((gallery) => {
            const { x, y, width, height } = gallery[0].getBoundingClientRect();
            expect({ x, y, width, height }).to.deep.eq({ x: 0, y: 0, width: 400, height: 800 });
        });

        cy.get('.psv-gallery').compareScreenshots('mobile');

        cy.get('.psv-gallery .psv-panel-close-button').click();

        cy.get('.psv-gallery').should('not.be.visible');
    });

    it('should add a navbar button', () => {
        cy.get('.psv-gallery-button')
            .should('be.visible')
            .should('have.class', 'psv-button--active')
            .click()
            .should('not.have.class', 'psv-button--active');

        cy.get('.psv-gallery').should('not.be.visible');

        cy.get('.psv-gallery-button').click();

        cy.get('.psv-gallery').should('be.visible');
    });

    it('should highlight the current item', () => {
        cy.get('[data-psv-gallery-item=sphere]').should('have.class', 'psv-gallery-item--active');

        setPanorama('sphere-test.jpg');

        cy.get('[data-psv-gallery-item=sphere]').should('not.have.class', 'psv-gallery-item--active');
        cy.get('[data-psv-gallery-item=test-sphere]').should('have.class', 'psv-gallery-item--active');

        setPanorama('sphere-cropped.jpg');

        cy.get('.psv-gallery-item--active').should('not.exist');
    });

    it('should change the panorama when clicked', () => {
        cy.get('[data-psv-gallery-item=test-sphere]').click();
        waitViewerReady();

        checkPanorama('sphere-test.jpg');
        cy.get('.psv-caption-content').should('have.text', 'Test sphere'); // use name as caption

        cy.get('[data-psv-gallery-item=1]').click();
        waitViewerReady();

        cy.get('.psv-caption-content').should('have.text', 'Cape Florida Light, Key Biscayne © Pixexid');
    });

    it('should hide on click', () => {
        callGallery('set hideOnClick').then(gallery => gallery.setOption('hideOnClick', true));

        cy.get('[data-psv-gallery-item=test-sphere]').click();

        cy.get('.psv-gallery').should('not.be.visible');
    });

    it('should change thumbnails size', () => {
        callGallery('set thumbnailSize').then(gallery => gallery.setOption('thumbnailSize', { width: 100, height: 100 }));

        waitForAllThumbnails();

        cy.get('.psv-gallery').compareScreenshots('set-thumbnailSize');
    });

    it('should change the items', () => {
        callGallery('set items').then((gallery) => {
            gallery.setItems([
                {
                    id: 1,
                    panorama: BASE_URL + 'tour/key-biscayne-1.jpg',
                    thumbnail: BASE_URL + 'tour/key-biscayne-1-thumb.jpg',
                },
                {
                    id: 2,
                    panorama: BASE_URL + 'tour/key-biscayne-2.jpg',
                    thumbnail: BASE_URL + 'tour/key-biscayne-2-thumb.jpg',
                },
            ]);
        });

        cy.get('.psv-gallery').compareScreenshots('set-items');
    });

    it('should throw if no "id" or "panorama"', () => {
        callGallery('set items').then((gallery) => {
            expect(() => gallery.setItems([{ id: null, panorama: 'img.jpg' }])).to.throw('Item 0 has no "id".');

            expect(() => gallery.setItems([{ id: 'id', panorama: null }])).to.throw('Item "id" has no "panorama".');
        });
    });

    it('should change the items w. custom callback', () => {
        const callback = cy.stub();

        callGallery('set items').then((gallery) => {
            gallery.setItems([
                {
                    id: 1,
                    panorama: BASE_URL + 'tour/key-biscayne-1.jpg',
                    thumbnail: BASE_URL + 'tour/key-biscayne-1-thumb.jpg',
                },
            ], callback);
        });

        cy.get('[data-psv-gallery-item=1]')
            .click()
            .should('have.class', 'psv-gallery-item--active')
            .then(() => expect(callback).to.be.calledOnceWith('1'));

        // not changed
        checkPanorama('sphere-small.jpg');

        cy.wrap(callback, NO_LOG).then(() => {
            cy.log('Reset stub');
            callback.reset();
        });

        cy.get('[data-psv-gallery-item=1]')
            .click()
            .then(() => expect(callback).to.not.have.been.called);
    });

    it('should hide the button when no items', () => {
        callGallery('set items').then(gallery => gallery.setItems(null));

        cy.get('.psv-gallery-button').should('not.be.visible');

        cy.get('.psv-gallery').should('not.be.visible');
    });

    it('should not be visible on load', () => {
        cy.visit('e2e/plugins/gallery.html?visibleOnLoad=false');
        waitViewerReady();

        cy.get('.psv-gallery').should('not.be.visible');
    });

    function callGallery(log: string) {
        return callPlugin<GalleryPlugin>('gallery', log);
    }

    function waitForAllThumbnails() {
        waitForResources(
            'key-biscayne-5-thumb.jpg',
            'key-biscayne-6-thumb.jpg',
            'key-biscayne-7-thumb.jpg',
        );
    }
});
