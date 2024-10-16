import { callViewer, waitNoLoader } from '../utils';

describe('basic', () => {
    beforeEach(() => {
        localStorage.photoSphereViewer_touchSupport = 'false';
        cy.visit('e2e/basic.html');
        waitNoLoader();
    });

    it('should add custom navbar button', () => {
        const alertStub = cy.stub();
        cy.on('window:alert', alertStub);

        cy.get('.custom-button:eq(0)').click()
            .then(() => {
                expect(alertStub.getCall(0)).to.be.calledWith('Custom button clicked');
            });
    });

    it('should update caption', () => {
        cy.get('.psv-caption-content').should('have.text', 'Parc national du Mercantour © Damien Sorel');

        callViewer(viewer => viewer.setOption('caption', '<strong>Name:</strong> Lorem Ipsum'));

        cy.get('.psv-caption-content').should('have.text', 'Name: Lorem Ipsum');
    });

    it('should translate navbar buttons', () => {
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
        callViewer(viewer => viewer.setOption('lang', fr));

        assertTitles(fr);
    });
});
