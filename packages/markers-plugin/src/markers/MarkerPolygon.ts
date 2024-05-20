import { Point, Viewer, utils } from '@photo-sphere-viewer/core';
import { Vector3 } from 'three';
import { MarkerType } from '../MarkerType';
import { MarkersPlugin } from '../MarkersPlugin';
import { MARKER_DATA, SVG_NS } from '../constants';
import { MarkerConfig } from '../model';
import { getGreatCircleIntersection, getPolygonCenter, getPolylineCenter } from '../utils';
import { AbstractDomMarker } from './AbstractDomMarker';

/**
 * @internal
 */
export class MarkerPolygon extends AbstractDomMarker {

    private positions3D: Vector3[][];

    constructor(viewer: Viewer, plugin: MarkersPlugin, config: MarkerConfig) {
        super(viewer, plugin, config);
    }

    override createElement(): void {
        this.element = document.createElementNS(SVG_NS, 'path');
        this.element[MARKER_DATA] = this;
    }

    override isPoly(): boolean {
        return true;
    }

    /**
     * Checks if it is a polygon/polyline using pixel coordinates
     */
    private get isPixels(): boolean {
        return this.type === MarkerType.polygonPixels || this.type === MarkerType.polylinePixels;
    }

    /**
     * Checks if it is a polygon marker
     */
    private get isPolygon(): boolean {
        return this.type === MarkerType.polygon || this.type === MarkerType.polygonPixels;
    }

    /**
     * Checks if it is a polyline marker
     */
    private get isPolyline(): boolean {
        return this.type === MarkerType.polyline || this.type === MarkerType.polylinePixels;
    }

    private get coords(): Array<Array<[number, number]>> {
        return this.definition;
    }

    override render(): Point {
        const positions = this.__getAllPolyPositions();
        const isVisible = positions[0].length > (this.isPolygon ? 2 : 1);

        if (isVisible) {
            const position = this.viewer.dataHelper.sphericalCoordsToViewerCoords(this.state.position);

            const points = positions
                .filter((innerPos, i) => {
                    return innerPos.length > 0 && (this.isPolygon || i === 0);
                })
                .map((innerPos) => {
                    let innerPoints = 'M';
                    innerPoints += innerPos
                        .map((pos) => `${pos.x - position.x},${pos.y - position.y}`)
                        .join('L');
                    if (this.isPolygon) {
                        innerPoints += 'Z';
                    }
                    return innerPoints;
                })
                .join(' ');

            this.domElement.setAttributeNS(null, 'd', points);
            this.domElement.setAttributeNS(null, 'transform', `translate(${position.x} ${position.y})`);

            return position;
        } else {
            return null;
        }
    }

    override update(config: MarkerConfig): void {
        super.update(config);

        const element = this.domElement;

        element.classList.add('psv-marker--poly');

        this.state.dynamicSize = true;

        // set style
        if (this.config.svgStyle) {
            Object.entries(this.config.svgStyle).forEach(([prop, value]) => {
                element.setAttributeNS(null, utils.dasherize(prop), value);
            });

            if (this.isPolyline && !this.config.svgStyle.fill) {
                element.setAttributeNS(null, 'fill', 'none');
            }
        } else if (this.isPolygon) {
            element.setAttributeNS(null, 'fill', 'rgba(0,0,0,0.5)');
        } else if (this.isPolyline) {
            element.setAttributeNS(null, 'fill', 'none');
            element.setAttributeNS(null, 'stroke', 'rgb(0,0,0)');
        }

        // fold arrays: [1,2,3,4] => [[1,2],[3,4]]
        let actualPoly: any = this.config[this.type];
        if (!Array.isArray(actualPoly[0])) {
            for (let i = 0; i < actualPoly.length; i++) {
                // @ts-ignore
                actualPoly.splice(i, 2, [actualPoly[i], actualPoly[i + 1]]);
            }
        }

        if (!Array.isArray(actualPoly[0][0])) {
            actualPoly = [actualPoly];
        }

        // convert texture coordinates to spherical coordinates
        if (this.isPixels) {
            this.definition = (actualPoly as Array<Array<[number, number]>>).map((coords) => {
                return coords.map((coord) => {
                    const sphericalCoords = this.viewer.dataHelper.textureCoordsToSphericalCoords({
                        textureX: coord[0],
                        textureY: coord[1],
                    });
                    return [sphericalCoords.yaw, sphericalCoords.pitch];
                });
            });
        }
        // clean angles
        else {
            this.definition = (actualPoly as Array<Array<[number, number]>> | Array<Array<[string, string]>>).map((coords) => {
                return coords.map((coord) => {
                    return [utils.parseAngle(coord[0]), utils.parseAngle(coord[1], true)];
                });
            });
        }

        const centroid = this.isPolygon ? getPolygonCenter(this.coords[0]) : getPolylineCenter(this.coords[0]);
        this.state.position = { yaw: centroid[0], pitch: centroid[1] };

        // compute x/y/z positions
        this.positions3D = this.coords.map((coords) => {
            return coords.map((coord) => {
                return this.viewer.dataHelper.sphericalCoordsToVector3({ yaw: coord[0], pitch: coord[1] });
            });
        });

        this.state.positions3D = this.positions3D[0];
    }

    private __getAllPolyPositions(): Point[][] {
        return this.positions3D.map(positions => {
            return this.__getPolyPositions(positions);
        });
    }

    /**
     * Computes viewer coordinates of each point of a polygon/polyline<br>
     * It handles points behind the camera by creating intermediary points suitable for the projector
     */
    private __getPolyPositions(positions: Vector3[]): Point[] {
        const nbVectors = positions.length;

        // compute if each vector is visible
        const positions3D = positions.map((vector) => {
            return {
                vector: vector,
                visible: vector.dot(this.viewer.state.direction) > 0,
            };
        });

        // get pairs of visible/invisible vectors for each invisible vector connected to a visible vector
        const toBeComputed: Array<{ visible: Vector3; invisible: Vector3; index: number }> = [];
        positions3D.forEach((pos, i) => {
            if (!pos.visible) {
                const neighbours = [
                    i === 0 ? positions3D[nbVectors - 1] : positions3D[i - 1],
                    i === nbVectors - 1 ? positions3D[0] : positions3D[i + 1],
                ];

                neighbours.forEach((neighbour) => {
                    if (neighbour.visible) {
                        toBeComputed.push({
                            visible: neighbour.vector,
                            invisible: pos.vector,
                            index: i,
                        });
                    }
                });
            }
        });

        // compute intermediary vector for each pair (the loop is reversed for splice to insert at the right place)
        toBeComputed.reverse().forEach((pair) => {
            positions3D.splice(pair.index, 0, {
                vector: getGreatCircleIntersection(pair.visible, pair.invisible, this.viewer.state.direction),
                visible: true,
            });
        });

        // translate vectors to screen pos
        return positions3D
            .filter((pos) => pos.visible)
            .map((pos) => this.viewer.dataHelper.vector3ToViewerCoords(pos.vector));
    }
}
