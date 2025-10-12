import { callViewer } from '../../utils';

describe('core: loader', () => {
    beforeEach(() => {
        localStorage.photoSphereViewer_touchSupport = 'false';
        cy.visit('e2e/core/loader.html');
    });

    it('should have a loader', () => {
        cy.get('.psv-loader')
            .should('be.visible')
            .should((loader) => {
                const { x, y, width, height } = loader[0].getBoundingClientRect();
                expect({ x, y, width, height }).to.deep.eq({ x: 565, y: 375, width: 150, height: 150 });
            })
            .compareScreenshots('base');
    });

    it('should hide/show the loader', () => {
        callViewer('hide loader').then(viewer => viewer.loader.hide());

        cy.get('.psv-loader').should('not.be.visible');

        cy.wait(100);

        callViewer('show loader').then(viewer => viewer.loader.show());

        cy.get('.psv-loader').should('be.visible');
    });

    it('should change the progression', () => {
        cy.wait(100);

        [[0, 0], [45, 45], [75, 75], [100, 100], [-20, 0], [150, 100]]
            .forEach(([progress, expected]) => {
                callViewer(`set progress ${progress}`).then(viewer => viewer.loader.setProgress(progress));

                cy.get('.psv-loader').compareScreenshots(`progress_${expected}`);
            });
    });
});
