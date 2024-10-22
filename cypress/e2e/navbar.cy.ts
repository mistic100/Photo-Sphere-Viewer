import { callViewer, waitViewerReady } from '../utils';

describe('navbar', () => {
    beforeEach(() => {
        localStorage.photoSphereViewer_touchSupport = 'false';
        cy.visit('e2e/navbar.html');
        waitViewerReady();
    });

    it('should have a navbar', () => {
        cy.get('.psv-navbar')
            .should('be.visible')
            .compareSnapshot('base');
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

        callViewer('change caption via options', viewer => viewer.setOption('caption', '<strong>Name:</strong> Lorem Ipsum'));

        cy.get('.psv-caption-content').should('have.text', 'Name: Lorem Ipsum');

        cy.get('.psv-navbar').compareSnapshot('update-caption');

        callViewer('change caption via API', viewer => viewer.navbar.setCaption('Loading...'));

        cy.get('.psv-caption-content').should('have.text', 'Loading...');
    });

    it('should show the description in the side panel', () => {
        cy.get('.psv-panel').should('not.be.visible');

        cy.get('.psv-description-button').click();

        cy.get('.psv-panel')
            .should('be.visible')
            .should('include.text', 'Parc national du Mercantour © Damien Sorel')
            .should('include.text', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit')
            .compareSnapshot('description');
    });

    // does not work in headless mode
    it.skip('should enter and exit fullscreen', () => {
        cy.get('.psv-fullscreen-button').realClick();
        cy.wait(500);

        cy.document().its('fullscreenElement').should('not.be.null');

        cy.get('.psv-fullscreen-button').realClick();

        cy.document().its('fullscreenElement').should('be.null');
    });

    it('should hide the caption if not enough space', {
        viewportWidth: 800,
        viewportHeight: 900,
    }, () => {
        callViewer('remove description', viewer => viewer.setOption('description', null));

        cy.get('.psv-caption-content').should('not.be.visible');

        cy.get('.psv-navbar').compareSnapshot('no-caption');

        cy.get('.psv-description-button').click();

        cy.get('.psv-notification-content')
            .should('be.visible')
            .should('have.text', 'Parc national du Mercantour © Damien Sorel')
            .compareSnapshot('caption-notification');

        cy.get('.psv-description-button').click();

        cy.get('.psv-notification').should('not.be.visible');
    });

    it('should display a menu on small screens', {
        viewportWidth: 400,
        viewportHeight: 800,
    }, () => {
        [
            '.psv-caption-content',
            '.psv-zoom-range',
            '.psv-download-button',
            '.custom-button:eq(0)',
        ].forEach(invisible => {
            cy.get(invisible).should('not.be.visible');
        });

        [
            '.psv-zoom-button',
            '.psv-move-button',
            '.psv-description-button',
            '.psv-fullscreen-button',
            '.psv-menu-button',
            '.custom-button:eq(1)',
        ].forEach(visible => {
            cy.get(visible).should('be.visible');
        });

        cy.get('.psv-navbar').compareSnapshot('with-menu');

        cy.get('.psv-menu-button').click();

        cy.get('.psv-panel')
            .should('be.visible')
            .within(() => {
                cy.get('.psv-panel-menu-title').should('contain.text', 'Menu');

                cy.contains('Download').should('be.visible');
                cy.contains('Click me').should('be.visible');
            })
            .compareSnapshot('menu-content');

        cy.get('.psv-panel-close-button').click();

        cy.get('.psv-panel').should('not.be.visible');
    });

    it('should translate buttons', () => {
        function assertTitles(titles: any) {
            cy.get('.psv-zoom-button:eq(0)').invoke('attr', 'title').should('eq', titles.zoomOut);
            cy.get('.psv-zoom-button:eq(1)').invoke('attr', 'title').should('eq', titles.zoomIn);
            cy.get('.psv-move-button:eq(0)').invoke('attr', 'title').should('eq', titles.moveLeft);
            cy.get('.psv-move-button:eq(1)').invoke('attr', 'title').should('eq', titles.moveRight);
            cy.get('.psv-move-button:eq(2)').invoke('attr', 'title').should('eq', titles.moveUp);
            cy.get('.psv-move-button:eq(3)').invoke('attr', 'title').should('eq', titles.moveDown);
            cy.get('.psv-download-button').invoke('attr', 'title').should('eq', titles.download);
            cy.get('.psv-description-button').invoke('attr', 'title').should('eq', titles.description);
            cy.get('.psv-fullscreen-button').invoke('attr', 'title').should('eq', titles.fullscreen);
            cy.get('.custom-button:eq(0)').invoke('attr', 'title').should('eq', titles.myButton);
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
        callViewer('translate to french', viewer => viewer.setOption('lang', fr));

        assertTitles(fr);
    });

    it('should hide the navbar', () => {
        callViewer('hide navbar', viewer => viewer.navbar.hide());

        cy.get('.psv-navbar').should('not.be.visible');

        callViewer('show navbar', viewer => viewer.navbar.show());

        cy.get('.psv-navbar').should('be.visible');
    });

    it('should update the buttons', () => {
        function assertButtons(expected: string[]) {
            cy.get('.psv-button').then($buttons => {
                const titles = $buttons
                    .filter(':visible')
                    .map((i, btn) => btn.getAttribute('title'))
                    .get();
                expect(titles).to.have.members(expected);
            });
        }

        callViewer('change buttons via options', viewer => viewer.setOption('navbar', 'zoom move'));

        assertButtons(['Zoom out', 'Zoom in', 'Move left', 'Move right', 'Move up', 'Move down']);

        cy.get('.psv-navbar').compareSnapshot('update-buttons');

        callViewer('change buttons via API', viewer => viewer.navbar.setButtons(['download', 'fullscreen']));

        assertButtons(['Download', 'Fullscreen']);
    });

    it('should hide a button', () => {
        callViewer('hide fullscreen button', viewer => viewer.navbar.getButton('fullscreen').hide());

        cy.get('.psv-fullscreen-button').should('not.be.visible');

        cy.get('.psv-navbar').compareSnapshot('hide-button');

        callViewer('show fullscreen button', viewer => viewer.navbar.getButton('fullscreen').show());

        cy.get('.psv-fullscreen-button').should('be.visible');
    });

    it('should disable a button', () => {
        callViewer('disable download button', viewer => viewer.navbar.getButton('download').disable());

        cy.get('.psv-download-button').should('have.class', 'psv-button--disabled');

        cy.get('.psv-navbar').compareSnapshot('disable-button');

        callViewer('enable download button', viewer => viewer.navbar.getButton('download').enable());

        cy.get('.psv-download-button').should('not.have.class', 'psv-button--disabled');
    });

    it('should display a custom element', () => {
        cy.document().then(document => {
            callViewer('set custom element', viewer => viewer.navbar.setButtons([
                {
                    content: document.createElement('custom-navbar-button'),
                }
            ]));
        });

        cy.get('.psv-custom-button')
            .should('have.class', 'psv-custom-button--no-padding')
            .find('custom-navbar-button')
            .shadow()
            .within(() => {
                cy.get('#title').should('have.text', 'Custom element');
                cy.get('#value').should('have.text', '50');
            });

        cy.get('.psv-custom-button').compareSnapshot('custom-element');
    });
});
