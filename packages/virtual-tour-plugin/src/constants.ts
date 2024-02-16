import { ObjectLoader } from 'three';
import { VirtualTourArrowStyle, VirtualTourMarkerStyle } from './model';
import arrowIconSvg from './arrow.svg';
import arrowGeometryJson from './models/arrow.json';
import arrowOutlineGeometryJson from './models/arrow_outline.json';
import triangleGeometryJson from './models/triangle.json';
import triangleOutlineGeometryJson from './models/triangle_outline.json';

export const LINK_DATA = 'tourLink';
export const LINK_ID = '__tour-link__';

export const LOADING_TOOLTIP = {
    className: 'psv-virtual-tour-tooltip',
    content: `<div class="psv-virtual-tour-loader"><div></div><div></div><div></div></div>`,
};

/**
 * Default style of the link marker
 */
export const DEFAULT_MARKER: VirtualTourMarkerStyle = {
    element: () => {
        const button = document.createElement('button');
        button.className = 'psv-virtual-tour-link';
        button.innerHTML = arrowIconSvg;
        return button;
    },
    size: { width: 80, height: 80 },
};

/**
 * Default style of the link arrow
 */
export const DEFAULT_ARROW: VirtualTourArrowStyle = {
    color: '#aaaaaa',
    hoverColor: '#aa5500',
    outlineColor: '#000000',
    size: 1,
};

export const { ARROW_GEOM, ARROW_OUTLINE_GEOM, TRIANGLE_GEOM, TRIANGLE_OUTLINE_GEOM } = (() => {
    const loader = new ObjectLoader();
    const geometries = loader.parseGeometries([
        arrowGeometryJson, arrowOutlineGeometryJson,
        triangleGeometryJson, triangleOutlineGeometryJson
    ]);
    const arrow = geometries[arrowGeometryJson.uuid];
    const arrowOutline = geometries[arrowOutlineGeometryJson.uuid];
    const triangle = geometries[triangleGeometryJson.uuid];
    const triangleOutline = geometries[triangleOutlineGeometryJson.uuid];
    const geomExports = {
        ARROW_GEOM: arrow, ARROW_OUTLINE_GEOM: arrowOutline,
        TRIANGLE_GEOM: triangle, TRIANGLE_OUTLINE_GEOM: triangleOutline
    };
    const scale = 0.03;
    const rot = Math.PI / 2;
    Object.values(geomExports).forEach(g => {
        g.scale(scale, scale, scale);
        g.rotateX(rot);
    });
    return geomExports;
})();
