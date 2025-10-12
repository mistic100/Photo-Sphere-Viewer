import { type Navbar } from '@photo-sphere-viewer/core';
import { callViewer, waitViewerReady } from '../../utils';
import { VIEWPORT_MOBILE } from '../../utils/constants';

describe('core: navbar', () => {
    beforeEach(() => {
        localStorage.photoSphereViewer_touchSupport = 'false';
        cy.visit('e2e/core/navbar.html');
        waitViewerReady();
    });

    it('should have a navbar', () => {
        cy.get('.psv-navbar')
            .should('be.visible')
            .compareScreenshots('base');
    });

    it('should have a custom button', () => {
        const alertStub = cy.stub();
        cy.on('window:alert', alertStub);

        cy.get('.custom-button:eq(0)')
            .click()
            .then(() => {
                expect(alertStub.getCall(0)).to.be.calledWith('Custom button clicked');
            });
    });

    it('should update the caption', () => {
        cy.get('.psv-caption-content').should('have.text', 'Parc national du Mercantour © Damien Sorel');

        callViewer('change caption via options').then(viewer => viewer.setOption('caption', '<strong>Name:</strong> Lorem Ipsum'));

        cy.get('.psv-caption-content').should('have.text', 'Name: Lorem Ipsum');

        cy.get('.psv-navbar').compareScreenshots('update-caption');

        callNavbar('change caption via API').then(navbar => navbar.setCaption('Loading...'));

        cy.get('.psv-caption-content').should('have.text', 'Loading...');
    });

    it('should show the description in the side panel', () => {
        cy.get('.psv-description-button').click();

        cy.get('.psv-panel')
            .should('be.visible')
            .should('include.text', 'Parc national du Mercantour © Damien Sorel')
            .should('include.text', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit')
            .compareScreenshots('description');

        cy.get('.psv-description-button').click();

        cy.get('.psv-panel').should('not.be.visible');

        callViewer('clear description').then(viewer => viewer.setOption('description', null));

        cy.get('.psv-description-button').should('not.be.visible');
    });

    it('should hide the caption if not enough space', {
        viewportWidth: 700,
        viewportHeight: 900,
    }, () => {
        callViewer('remove description').then(viewer => viewer.setOption('description', null));

        cy.get('.psv-caption-content').should('not.be.visible');

        cy.get('.psv-navbar').compareScreenshots('no-caption');

        cy.get('.psv-description-button').click();

        cy.get('.psv-notification-content')
            .should('be.visible')
            .should('have.text', 'Parc national du Mercantour © Damien Sorel')
            .compareScreenshots('caption-notification', { errorThreshold: 0.1 });

        cy.get('.psv-description-button').click();

        cy.get('.psv-notification').should('not.be.visible');
    });

    it('should display a menu on small screens', VIEWPORT_MOBILE, () => {
        [
            '.psv-caption-content',
            '.psv-download-button',
            '.custom-button:eq(0)',
        ].forEach((invisible) => {
            cy.get(invisible).should('not.be.visible');
        });

        [
            '.psv-zoom-button',
            '.psv-move-button',
            '.psv-description-button',
            '.psv-fullscreen-button',
            '.psv-menu-button',
            '.custom-button:eq(1)',
        ].forEach((visible) => {
            cy.get(visible).should('be.visible');
        });

        cy.get('.psv-navbar').compareScreenshots('with-menu');

        cy.get('.psv-menu-button').click();

        cy.get('.psv-panel')
            .should('be.visible')
            .within(() => {
                cy.get('.psv-panel-header').should('contain.text', 'Menu');

                cy.contains('Download').should('be.visible');
                cy.contains('Click me').should('be.visible');
            })
            .compareScreenshots('menu-content');

        cy.get('.psv-panel-close-button').click();

        cy.get('.psv-panel').should('not.be.visible');
    });

    it('should translate buttons', () => {
        function assertTitles(titles: any) {
            cy.get('.psv-zoom-button:eq(0)').invoke('attr', 'aria-label').should('eq', titles.zoomOut);
            cy.get('.psv-zoom-button:eq(1)').invoke('attr', 'aria-label').should('eq', titles.zoomIn);
            cy.get('.psv-move-button:eq(0)').invoke('attr', 'aria-label').should('eq', titles.moveLeft);
            cy.get('.psv-move-button:eq(1)').invoke('attr', 'aria-label').should('eq', titles.moveRight);
            cy.get('.psv-move-button:eq(2)').invoke('attr', 'aria-label').should('eq', titles.moveUp);
            cy.get('.psv-move-button:eq(3)').invoke('attr', 'aria-label').should('eq', titles.moveDown);
            cy.get('.psv-download-button').invoke('attr', 'aria-label').should('eq', titles.download);
            cy.get('.psv-description-button').invoke('attr', 'aria-label').should('eq', titles.description);
            cy.get('.psv-fullscreen-button').invoke('attr', 'aria-label').should('eq', titles.fullscreen);
            cy.get('.custom-button:eq(0)').invoke('attr', 'aria-label').should('eq', titles.myButton);
        }

        const en = {
            zoomOut: 'Zoom out',
            zoomIn: 'Zoom in',
            moveUp: 'Move up',
            moveDown: 'Move down',
            moveLeft: 'Move left',
            moveRight: 'Move right',
            description: 'Description',
            download: 'Download',
            fullscreen: 'Fullscreen',
            myButton: 'Click me',
        };
        assertTitles(en);

        const fr = {
            zoomOut: 'Dézoomer',
            zoomIn: 'Zoomer',
            moveUp: 'Haut',
            moveDown: 'Bas',
            moveLeft: 'Gauche',
            moveRight: 'Droite',
            description: 'Description',
            download: 'Télécharger',
            fullscreen: 'Plein écran',
            myButton: 'Cliquez ici',
        };
        callViewer('translate to french').then(viewer => viewer.setOption('lang', fr));

        assertTitles(fr);
    });

    it('should hide the navbar', () => {
        callNavbar('hide navbar').then(navbar => navbar.hide());
        checkNavbarVisibleApi(false);
        cy.get('.psv-navbar')
            .should('not.be.visible')
            .should('not.have.class', 'psv-navbar--open');
        cy.get('.psv-container').should('not.have.class', 'psv--has-navbar');

        callNavbar('show navbar').then(navbar => navbar.show());
        checkNavbarVisibleApi(true);
        cy.get('.psv-navbar')
            .should('be.visible')
            .should('have.class', 'psv-navbar--open');
        cy.get('.psv-container').should('have.class', 'psv--has-navbar');
    });

    it('should update the buttons', () => {
        function assertButtons(expected: string[]) {
            cy.get('.psv-button').then(($buttons) => {
                const titles = $buttons
                    .filter(':visible')
                    .map((i, btn) => btn.getAttribute('aria-label'))
                    .get();
                expect(titles).to.have.members(expected);
            });
        }

        callViewer('change buttons via options').then(viewer => viewer.setOption('navbar', 'zoom move'));

        assertButtons(['Zoom out', 'Zoom in', 'Move left', 'Move right', 'Move up', 'Move down']);

        cy.get('.psv-navbar').compareScreenshots('update-buttons');

        callNavbar('change buttons via API').then(navbar => navbar.setButtons([['download', 'fullscreen']]));

        assertButtons(['Download', 'Fullscreen']);
    });

    it('should hide a button', () => {
        callNavbar('hide download button').then(navbar => navbar.getButton('download').hide());

        cy.get('.psv-download-button').should('not.be.visible');

        cy.get('.psv-navbar').compareScreenshots('hide-button');

        callNavbar('show download button').then(navbar => navbar.getButton('download').show());

        cy.get('.psv-download-button').should('be.visible');
    });

    it('should disable a button', () => {
        callNavbar('disable download button').then(navbar => navbar.getButton('download').disable());

        cy.get('.psv-download-button').should('have.class', 'psv-button--disabled');

        cy.get('.psv-navbar').compareScreenshots('disable-button');

        callNavbar('enable download button').then(navbar => navbar.getButton('download').enable());

        cy.get('.psv-download-button').should('not.have.class', 'psv-button--disabled');
    });

    it('should display a custom element', () => {
        cy.document().then((document) => {
            callNavbar('set custom element').then(navbar => navbar.setButtons([[
                {
                    type: 'element',
                    content: document.createElement('custom-navbar-button'),
                },
            ]]));
        });

        cy.get('.psv-custom-element')
            .find('custom-navbar-button')
            .shadow()
            .within(() => {
                cy.get('#title').should('have.text', 'Custom element');
                cy.get('#value').should('have.text', '50');
            });

        cy.get('.psv-navbar-group').compareScreenshots('custom-element');
    });

    it('should align the caption', () => {
        callViewer('clear description').then(viewer => viewer.setOption('description', null));

        callViewer('set caption only').then(viewer => viewer.setOption('navbar', 'caption'));
        cy.get('.psv-navbar').compareScreenshots('caption-center');

        callViewer('set caption + button').then(viewer => viewer.setOption('navbar', 'caption fullscreen'));
        cy.get('.psv-navbar').compareScreenshots('caption-left');

        callViewer('set button + caption').then(viewer => viewer.setOption('navbar', 'fullscreen caption'));
        cy.get('.psv-navbar').compareScreenshots('caption-right');
    });

    function callNavbar(log: string): Cypress.Chainable<Navbar> {
        return callViewer(log).then(viewer => viewer.navbar);
    }

    function checkNavbarVisibleApi(visible: boolean) {
        callNavbar(`check navbar ${visible ? 'visible' : 'not visible'}`)
            .then((navbar) => {
                expect(navbar.isVisible()).to.eq(visible);
            });
    }
});
