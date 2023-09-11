import { Mesh, Vector3 } from 'three';
import { SPHERE_RADIUS } from '../data/constants';
import { PanoData, Size, TextureData } from '../model';
import type { Animation } from '../utils';

/**
 * Internal properties of the viewer
 */
export class ViewerState {
    /**
     * when all components are loaded
     */
    ready = false;

    /**
     * if the view needs to be renderer
     */
    needsUpdate = false;

    /**
     * number of plugins requesting to continuously render the scene
     */
    continuousUpdateCount = 0;

    /**
     * if the keyboard events are currently listened to
     */
    keyboardEnabled = false;

    /**
     * direction of the camera
     */
    direction = new Vector3(0, 0, SPHERE_RADIUS);

    /**
     * vertical FOV
     */
    vFov = 60;

    /**
     * horizontal FOV
     */
    hFov = 60;

    /**
     * renderer aspect ratio
     */
    aspect = 1;

    /**
     * currently running animation
     */
    animation: Animation = null;

    /**
     * currently running transition
     */
    transitionAnimation: Animation = null;

    /**
     * promise of the last "setPanorama()" call
     */
    loadingPromise: Promise<any> = null;

    /**
     * special tweaks for LittlePlanetAdapter
     */
    littlePlanet = false;

    /**
     * time of the last user action
     */
    idleTime = -1;

    /**
     * registered THREE objects observer
     */
    objectsObservers: Record<string, Mesh | null> = {};

    /**
     * size of the container
     */
    size: Size = {
        width: 0,
        height: 0,
    };

    /**
     * Current panorama texture displayed
     */
    textureData: TextureData;

    /**
     * Current overlay texture displayed
     */
    overlayData: TextureData;

    /**
     * panorama metadata, if supported
     */
    panoData: PanoData = {
        fullWidth: 0,
        fullHeight: 0,
        croppedWidth: 0,
        croppedHeight: 0,
        croppedX: 0,
        croppedY: 0,
        poseHeading: 0,
        posePitch: 0,
        poseRoll: 0,
    };

    /**
     * Current override of the global cursor
     */
    cursorOverride: string;

    /**
     * @internal
     */
    // eslint-disable-next-line  @typescript-eslint/no-empty-function
    constructor() {}
}
