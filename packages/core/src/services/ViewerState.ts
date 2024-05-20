import { Mesh, Vector3 } from 'three';
import { SPHERE_RADIUS } from '../data/constants';
import { Size, TextureData } from '../model';
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
     * current camera roll
     */
    roll = 0;

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
     * Current override of the global cursor
     */
    cursorOverride: string;

    /**
     * @internal
     */
    // eslint-disable-next-line  @typescript-eslint/no-empty-function
    constructor() {}
}
