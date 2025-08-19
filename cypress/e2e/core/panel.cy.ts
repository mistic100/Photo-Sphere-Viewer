import { type Panel } from '@photo-sphere-viewer/core';
import { callViewer, checkEventHandler, listenViewerEvent, triggerWindowKeydown, waitViewerReady } from '../../utils';
import { NO_LOG, VIEWPORT_MOBILE } from '../../utils/constants';

describe('core: panel', () => {
    beforeEach(() => {
        cy.visit('e2e/core/base.html');
        waitViewerReady();
        // createBaseSnapshot();
    });

    it('should show/hide the panel', () => {
        const showPanelHandler = listenViewerEvent('show-panel');
        const hidePanelHandler = listenViewerEvent('hide-panel');

        callPanel('show panel').then(panel => panel.show('content'));
        checkEventHandler(showPanelHandler, { panelId: null });
        checkPanelVisibleApi(true);
        cy.get('.psv-panel')
            .should('be.visible')
            .should('have.class', 'psv-panel--open');

        callPanel('hide panel').then(panel => panel.hide());
        checkEventHandler(hidePanelHandler, { panelId: null });
        checkPanelVisibleApi(false);
        cy.get('.psv-panel')
            .should('not.be.visible')
            .should('not.have.class', 'psv-panel--open');
    });

    it('should hide on cross click and esc key', () => {
        callPanel('show panel').then(panel => panel.show('content'));
        cy.get('.psv-panel').should('be.visible');

        cy.get('.psv-panel-close-button')
            .should('have.attr', 'title', 'Close')
            .click();
        cy.get('.psv-panel').should('not.be.visible');

        callPanel('show panel').then(panel => panel.show('content'));
        cy.get('.psv-panel').should('be.visible');

        triggerWindowKeydown('Escape');
        cy.get('.psv-panel').should('not.be.visible');
    });

    it('should show the panel with id', () => {
        const showPanelHandler = listenViewerEvent('show-panel');
        const hidePanelHandler = listenViewerEvent('hide-panel');

        callPanel('show panel a').then(panel => panel.show({
            content: 'content',
            id: 'panel-a',
        }));
        checkEventHandler(showPanelHandler, { panelId: 'panel-a' });
        checkPanelVisibleApi(true);
        checkPanelVisibleApi(true, 'panel-a');
        checkPanelVisibleApi(false, 'panel-b');

        callPanel('hide panel b').then(panel => panel.hide('panel-b'));
        cy.wrap(hidePanelHandler, NO_LOG).should('not.have.been.called');
        checkPanelVisibleApi(true, 'panel-a');
        cy.get('.psv-panel').should('be.visible');

        callPanel('hide panel a').then(panel => panel.hide('panel-a'));
        checkEventHandler(hidePanelHandler, { panelId: 'panel-a' });
        checkPanelVisibleApi(false, 'panel-a');

        callPanel('show panel b').then(panel => panel.show({
            content: 'content',
            id: 'panel-b',
        }));
        checkEventHandler(showPanelHandler, { panelId: 'panel-b' });
        checkPanelVisibleApi(true, 'panel-b');

        callPanel('hide any panel').then(panel => panel.hide());
        checkEventHandler(hidePanelHandler, { panelId: 'panel-b' });
        checkPanelVisibleApi(false);
    });

    it('should show with required with', () => {
        callPanel('show panel').then(panel => panel.show({
            content: 'content',
            width: '50%',
        }));

        checkPanelWidth(640);
    });

    it('should be resizable and store width', () => {
        callPanel('show panel a').then(panel => panel.show({
            content: 'content',
            id: 'panel-a',
        }));
        checkPanelWidth(400);

        cy.get('.psv-panel-resizer')
            .trigger('mousedown', { clientX: 875, clientY: 450 });
        cy.get('.psv-container')
            .trigger('mousemove', { clientX: 825, clientY: 450 })
            .trigger('mousemove', { clientX: 775, clientY: 450 })
            .trigger('mousemove', { clientX: 725, clientY: 450 })
            .trigger('mousemove', { clientX: 675, clientY: 450 })
            .trigger('mouseup');
        checkPanelWidth(600);

        callPanel('hide panel').then(panel => panel.hide());

        callPanel('show panel a').then(panel => panel.show({
            content: 'content',
            id: 'panel-a',
        }));
        checkPanelWidth(600);

        callPanel('hide panel').then(panel => panel.hide());

        callPanel('show panel b').then(panel => panel.show({
            content: 'content',
            id: 'panel-b',
        }));
        checkPanelWidth(400);
    });

    it('should not be resizable on mobile', VIEWPORT_MOBILE, () => {
        callPanel('show panel').then(panel => panel.show('content'));

        cy.get('.psv-panel').should((panel) => {
            const { x, y, width, height } = panel[0].getBoundingClientRect();
            expect({ x, y, width, height }).to.deep.eq({ x: 0, y: 0, width: 400, height: 760 });
        });

        cy.get('.psv-panel-resizer').should('not.be.visible');
    });

    it('should use a custom click handler', () => {
        const clickHandler = cy.stub();

        callPanel('show panel').then(panel => panel.show({
            content: '<button id="my-btn">Click</button>',
            clickHandler: clickHandler,
        }));

        cy.get('#my-btn')
            .should('be.focused')
            .click();

        cy.wrap(clickHandler, NO_LOG)
            .should('have.been.called')
            .should(() => {
                const target = clickHandler.getCall(0).args[0] as HTMLElement;
                expect(target).to.have.attr('id', 'my-btn');
            });

        cy.get('#my-btn')
            .focus()
            .trigger('keydown', { key: 'Enter' });

        cy.wrap(clickHandler, NO_LOG)
            .should('have.been.calledTwice');
    });

    function callPanel(log: string): Cypress.Chainable<Panel> {
        return callViewer(log).then(viewer => viewer.panel);
    }

    function checkPanelVisibleApi(visible: boolean, id?: string) {
        callPanel(`check ${id ? `panel "${id}"` : 'any panel'} ${visible ? 'visible' : 'not visible'}`)
            .then((panel) => {
                expect(panel.isVisible(id)).to.eq(visible);
            });
    }

    function checkPanelWidth(width: number) {
        cy.log(`check panel is ${width}px`);
        cy.get('.psv-panel').should((element) => {
            expect(element[0].offsetWidth).to.be.equal(width);
        });
    }
});
