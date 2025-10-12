import { type Notification } from '@photo-sphere-viewer/core';
import { callViewer, checkEventHandler, listenViewerEvent, waitViewerReady } from '../../utils';
import { NO_LOG } from '../../utils/constants';

describe('core: notification', () => {
    beforeEach(() => {
        localStorage.photoSphereViewer_touchSupport = 'false';
        cy.visit('e2e/core/base.html');
        waitViewerReady();
    });

    it('should show/hide the notification', () => {
        const showNotificationHandler = listenViewerEvent('show-notification');
        const hideNotificationHandler = listenViewerEvent('hide-notification');

        callNotification('show notification').then(notification => notification.show('content'));
        checkEventHandler(showNotificationHandler, { notificationId: null });
        checkNotificationVisibleApi(true);
        cy.get('.psv-notification')
            .should('be.visible')
            .should('have.class', 'psv-notification--visible');

        callNotification('hide notification').then(notification => notification.hide());
        checkEventHandler(hideNotificationHandler, { notificationId: null });
        checkNotificationVisibleApi(false);
        cy.get('.psv-notification')
            .should('not.be.visible')
            .should('not.have.class', 'psv-notification--visible');
    });

    it('should hide on click', () => {
        callNotification('show notification').then(notification => notification.show('content'));
        cy.get('.psv-notification').should('be.visible');

        cy.get('.psv-notification').click();
        cy.get('.psv-notification').should('not.be.visible');
    });

    it('should show the notification with id', () => {
        const showNotificationHandler = listenViewerEvent('show-notification');
        const hideNotificationHandler = listenViewerEvent('hide-notification');

        callNotification('show notification a').then(notification => notification.show({
            content: 'content',
            id: 'notification-a',
        }));
        checkEventHandler(showNotificationHandler, { notificationId: 'notification-a' });
        checkNotificationVisibleApi(true);
        checkNotificationVisibleApi(true, 'notification-a');
        checkNotificationVisibleApi(false, 'notification-b');

        callNotification('hide notification b').then(notification => notification.hide('notification-b'));
        cy.wrap(hideNotificationHandler, NO_LOG).should('not.have.been.called');
        checkNotificationVisibleApi(true, 'notification-a');
        cy.get('.psv-notification').should('be.visible');

        callNotification('hide notification a').then(notification => notification.hide('notification-a'));
        checkEventHandler(hideNotificationHandler, { notificationId: 'notification-a' });
        checkNotificationVisibleApi(false, 'notification-a');

        callNotification('show notification b').then(notification => notification.show({
            content: 'title',
            id: 'notification-b',
        }));
        checkEventHandler(showNotificationHandler, { notificationId: 'notification-b' });
        checkNotificationVisibleApi(true, 'notification-b');

        callNotification('hide any notification').then(panel => panel.hide());
        checkEventHandler(hideNotificationHandler, { notificationId: 'notification-b' });
        checkNotificationVisibleApi(false);
    });

    it('should hide on timeout', () => {
        cy.clock();

        callNotification('show notification').then(notification => notification.show({
            content: 'content',
            timeout: 2000,
        }));
        cy.get('.psv-notification').should('be.visible');

        cy.tick(1000);
        cy.get('.psv-notification').should('be.visible');

        cy.tick(1000);
        cy.get('.psv-notification').should('not.be.visible');
    });

    function callNotification(log: string): Cypress.Chainable<Notification> {
        return callViewer(log).then(viewer => viewer.notification);
    }

    function checkNotificationVisibleApi(visible: boolean, id?: string) {
        callNotification(`check ${id ? `notification "${id}"` : 'any notification'} ${visible ? 'visible' : 'not visible'}`)
            .then((notification) => {
                expect(notification.isVisible(id)).to.eq(visible);
            });
    }
});
