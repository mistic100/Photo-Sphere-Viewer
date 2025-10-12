import type { CompassPlugin } from '@photo-sphere-viewer/compass-plugin';
import type { Point } from '@photo-sphere-viewer/core';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { callPlugin, callViewer, checkPosition, waitViewerReady } from '../../utils';
import { BASE_URL, NO_LOG } from '../../utils/constants';

describe('plugin: compass', () => {
    beforeEach(() => {
        localStorage.photoSphereViewer_touchSupport = 'false';
        cy.visit('e2e/plugins/compass.html');
        waitViewerReady();
    });

    it('should destroy', () => {
        callViewer('destroy').then(viewer => viewer.destroy());
    });

    it('should have a compass', () => {
        cy.get('.psv-compass')
            .should('be.visible')
            .compareScreenshots('base');
    });

    it('should hide the compass', () => {
        callCompass('hide compass').then(compass => compass.hide());

        cy.get('.psv-compass').should('not.be.visible');

        callCompass('show compass').then(compass => compass.show());

        cy.get('.psv-compass').should('be.visible');
    });

    it('should pan & zoom', () => {
        callViewer('rotate 90deg')
            .then(viewer => viewer.rotate({ pitch: 0, yaw: '90deg' }))
            .wait(500);

        cy.get('.psv-compass').compareScreenshots('rotate');

        callViewer('zoom 100%')
            .then(viewer => viewer.zoom(100))
            .wait(500);

        cy.get('.psv-compass').compareScreenshots('zoom');
    });

    it('should show navigation cone', () => {
        withCompassPosition(({ element, x, y, width, height }) => {
            // center-right
            const enterPoint = { clientX: x + width, clientY: y + height * 0.5 };
            // above bottom-center
            const clickPoint = { clientX: x + width * 0.5, clientY: y + height * 0.75 };
            // bottom-center
            const leavePoint = { clientX: x + width * 0.5, clientY: y + height };

            element
                .trigger('mouseenter', enterPoint)
                .compareScreenshots('navigation-1')
                .trigger('mousemove', clickPoint)
                .compareScreenshots('navigation-2')
                .trigger('mousedown', clickPoint)
                .trigger('mouseup', clickPoint)
                .trigger('mouseleave', leavePoint)
                .compareScreenshots('navigation-3');
        });

        checkPosition({ yaw: Math.PI, pitch: 0 });
    });

    it('should disable navigation', () => {
        callCompass('disable navigation').then(compass => compass.setOption('navigation', false));

        withCompassPosition(({ element, x, y, width, height }) => {
            const point = { clientX: x + width * 0.5, clientY: y + height * 0.75 };

            element
                .trigger('mouseenter', point)
                .compareScreenshots('base')
                .trigger('mousedown', point)
                .trigger('mouseup', point)
                .trigger('mouseleave', point);
        });

        checkPosition({ yaw: 0, pitch: 0 });
    });

    it('should reset pitch on click', () => {
        callViewer('move down')
            .then(viewer => viewer.rotate({ yaw: 0, pitch: -1 }))
            .wait(200);

        withCompassPosition(({ element, x, y, width, height }) => {
            const point = { clientX: x + width * 0.75, clientY: y + height * 0.5 };

            element
                .trigger('mousedown', point)
                .trigger('mouseup', point);
        });

        checkPosition({ yaw: Math.PI / 2, pitch: -1 });

        callCompass('set resetPitch').then(compass => compass.setOption('resetPitch', true));

        withCompassPosition(({ element, x, y, width, height }) => {
            const point = { clientX: x + width * 0.5, clientY: y + height * 0.75 };

            element
                .trigger('mousedown', point)
                .trigger('mouseup', point);
        });

        checkPosition({ yaw: Math.PI, pitch: 0 });
    });

    it('should change the navigationColor', () => {
        callCompass('set navigationColor').then(compass => compass.setOption('navigationColor', 'rgba(0, 255, 0, 0.5)'));

        withCompassPosition(({ element, x, y, width, height }) => {
            const point = { clientX: x + width * 0.5, clientY: y + height * 0.75 };

            element
                .trigger('mousemove', point)
                .compareScreenshots('set-navigationColor')
                .trigger('mouseleave');
        });
    });

    it('should change the coneColor', () => {
        callCompass('set coneColor').then(compass => compass.setOption('coneColor', '#00000055'));

        cy.get('.psv-compass').compareScreenshots('set-coneColor');
    });

    it('should change the size', () => {
        callCompass('set size').then(compass => compass.setOption('size', '300px'));

        cy.get('.psv-compass').compareScreenshots('set-size');
    });

    it('should change the backgroundSvg', () => {
        callCompass('set backgroundSvg').then(compass => compass.setOption('backgroundSvg', '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="rgba(0, 0, 0, .5)"/></svg>'));

        cy.get('.psv-compass').compareScreenshots('set-backgroundSvg');
    });

    it('should change the position', () => {
        const size = 120;
        const margin = 10;
        const nav = 40;
        const vw = Cypress.config('viewportWidth');
        const vh = Cypress.config('viewportHeight');

        [
            ['top left', { x: margin, y: margin }],
            ['top center', { x: vw / 2 - size / 2, y: margin }],
            ['top right', { x: vw - size - margin, y: margin }],
            ['left center', { x: margin, y: vh / 2 - size / 2 }],
            ['center center', { x: vw / 2 - size / 2, y: vh / 2 - size / 2 }],
            ['right center', { x: vw - size - margin, y: vh / 2 - size / 2 }],
            ['bottom left', { x: margin, y: vh - nav - margin - size - 5 }],
            ['bottom center', { x: vw / 2 - size / 2, y: vh - nav - margin - size - 5 }],
            ['bottom right', { x: vw - size - margin, y: vh - nav - margin - size - 5 }],
        ].forEach(([position, coords]: [string, Point]) => {
            callCompass(`set position ${position}`).then(compass => compass.setOption('position', position));

            cy.get('.psv-compass')
                .should((compass) => {
                    const { x, y } = compass[0].getBoundingClientRect();
                    expect({ x, y }).to.deep.eq(coords);
                });
        });

        callViewer('hide navbar')
            .then(viewer => viewer.navbar.hide())
            .wait(200);

        [
            ['bottom left', { x: margin, y: vh - margin - size }],
            ['bottom center', { x: vw / 2 - size / 2, y: vh - margin - size }],
            ['bottom right', { x: vw - size - margin, y: vh - margin - size }],
        ].forEach(([position, coords]: [string, Point]) => {
            callCompass(`set position ${position}`).then(compass => compass.setOption('position', position));

            cy.get('.psv-compass')
                .then((element) => {
                    const { x, y } = element[0].getBoundingClientRect();
                    return { x, y } satisfies Point;
                })
                .should('deep.equal', coords);
        });
    });

    it('should show hotspots', () => {
        callCompass('set hotspots').then((compass) => {
            compass.setHotspots([
                // @ts-ignore missing pitch
                { yaw: 0 },
                { yaw: Math.PI / 2, pitch: 0 },
                { yaw: Math.PI, pitch: -1 },
                { yaw: Math.PI * 3 / 2, pitch: 1 },
            ]);
        });

        cy.get('.psv-compass').compareScreenshots('hotspots');
    });

    it('should set hotspots color', () => {
        callCompass('set hotspots').then((compass) => {
            compass.setOption('hotspotColor', 'green');

            compass.setHotspots([
                { yaw: 0, pitch: 0 },
                { yaw: Math.PI / 2, pitch: 0, color: 'red' },
                { yaw: Math.PI, pitch: 0, color: 'rgba(255, 0, 0, 0.5)' },
                { yaw: Math.PI * 3 / 2, pitch: 0, color: '#ff000050' },
            ]);
        });

        cy.get('.psv-compass').compareScreenshots('hotspots-color');
    });

    it('should display markers', () => {
        callMarkers('set markers').then((markers) => {
            markers.setMarkers([
                {
                    id: 'image',
                    position: { yaw: Math.PI / 2, pitch: 0 },
                    image: BASE_URL + 'pictos/pin-red.png',
                    size: { width: 32, height: 32 },
                    data: { compass: '#cc3333' },
                },
                {
                    id: 'image-hidden',
                    position: { yaw: Math.PI / 2, pitch: 1 },
                    image: BASE_URL + 'pictos/pin-red.png',
                    size: { width: 32, height: 32 },
                },
                {
                    id: 'polygon',
                    polygonPixels: [
                        [2941 / 3, 1413 / 3], [3042 / 3, 1402 / 3], [3222 / 3, 1419 / 3], [3433 / 3, 1463 / 3],
                        [3480 / 3, 1505 / 3], [3438 / 3, 1538 / 3], [3241 / 3, 1543 / 3], [3041 / 3, 1555 / 3],
                        [2854 / 3, 1559 / 3], [2739 / 3, 1516 / 3], [2775 / 3, 1469 / 3], [2941 / 3, 1413 / 3],
                    ],
                    data: { compass: 'rgba(255, 0, 50, 0.8)' },
                },
                {
                    id: 'polyline',
                    polylinePixels: [
                        [2478 / 3, 1635 / 3], [2184 / 3, 1747 / 3], [1674 / 3, 1953 / 3], [1166 / 3, 1852 / 3],
                        [709 / 3, 1669 / 3], [301 / 3, 1519 / 3], [94 / 3, 1399 / 3], [34 / 3, 1356 / 3],
                    ],
                    data: { compass: 'rgba(80, 150, 50, 0.8)' },
                },
            ]);
        });

        cy.get('.psv-compass').compareScreenshots('markers');
    });

    function withCompassPosition(cb: (res: {
        element: Cypress.Chainable<JQuery<HTMLElement>>;
        x: number;
        y: number;
        width: number;
        height: number;
    }) => void) {
        cy.get('.psv-compass').then((element) => {
            const { x, y, width, height } = element[0].getBoundingClientRect();

            cb({
                element: cy.wrap(element, NO_LOG),
                x, y, width, height,
            });
        });
    }

    function callCompass(log: string) {
        return callPlugin<CompassPlugin>('compass', log);
    }

    function callMarkers(log: string) {
        return callPlugin<MarkersPlugin>('markers', log);
    }
});
