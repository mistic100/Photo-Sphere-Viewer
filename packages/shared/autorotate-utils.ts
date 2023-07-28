import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

let debugMarkers: string[] = [];

/**
 * @internal
 */
export function debugCurve(markers: MarkersPlugin, curve: Array<[number, number]>, stepSize: number) {
    debugMarkers.forEach((marker) => {
        try {
            markers.removeMarker(marker);
        } catch (e) {
            // noop
        }
    });

    markers.addMarker({
        id: 'autorotate-path',
        polyline: curve,
        svgStyle: {
            stroke: 'white',
            strokeWidth: '2px',
        },
    });
    debugMarkers = ['autorotate-path'];

    curve.forEach((pos, i) => {
        markers.addMarker({
            id: 'autorotate-path-' + i,
            circle: 5,
            position: {
                yaw: pos[0],
                pitch: pos[1],
            },
            svgStyle: {
                fill: i % stepSize === 0 ? 'red' : 'black',
            },
        });
        debugMarkers.push('autorotate-path-' + i);
    });
}
