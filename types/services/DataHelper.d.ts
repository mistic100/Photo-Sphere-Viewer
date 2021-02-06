import { Vector3 } from 'three';
import { ExtendedPosition, Point, Position, SphereCorrection } from '../models';

/**
 * @summary Collections of data converters for the current viewer
 */
export class DataHelper {

  /**
   * @summary Converts vertical FOV to zoom level
   */
  fovToZoomLevel(fov: number): number;

  /**
   * @summary Converts zoom level to vertical FOV
   */
  zoomLevelToFov(level: number): number;

  /**
   * @summary Convert vertical FOV to horizontal FOV
   */
  vFovToHFov(vFov: number): number;

  /**
   * @summary Converts a speed into a duration from current position to a new position
   */
  speedToDuration(value: string | number, angle: number): number;

  /**
   * @summary Converts pixel texture coordinates to spherical radians coordinates
   */
  textureCoordsToSphericalCoords(point: Point): Position;

  /**
   * @summary Converts spherical radians coordinates to pixel texture coordinates
   */
  sphericalCoordsToTextureCoords(position: Position): Point;

  /**
   * @summary Converts spherical radians coordinates to a THREE.Vector3
   */
  sphericalCoordsToVector3(position: Position): Vector3;

  /**
   * @summary Converts a THREE.Vector3 to spherical radians coordinates
   */
  vector3ToSphericalCoords(vector: Vector3): Position;

  /**
   * @summary Converts position on the viewer to a THREE.Vector3
   */
  viewerCoordsToVector3(point: Point): Vector3;

  /**
   * @summary Converts a THREE.Vector3 to position on the viewer
   */
  vector3ToViewerCoords(vector: Vector3): Point;

  /**
   * @summary Converts spherical radians coordinates to position on the viewer
   */
  sphericalCoordsToViewerCoords(position: Position): Point;

  /**
   * @summary Converts x/y to latitude/longitude if present and ensure boundaries
   */
  cleanPosition(position: ExtendedPosition): Position;

  /**
   * @summary Ensure a SphereCorrection object is valid
   */
  cleanSphereCorrection(sphere: SphereCorrection): SphereCorrection;

}
