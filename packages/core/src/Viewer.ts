import type { AbstractAdapter } from './adapters/AbstractAdapter';
import type { AbstractComponent } from './components/AbstractComponent';
import { Loader } from './components/Loader';
import { Navbar } from './components/Navbar';
import { Notification } from './components/Notification';
import { Overlay } from './components/Overlay';
import { Panel } from './components/Panel';
import { Tooltip, TooltipConfig } from './components/Tooltip';
import { CONFIG_PARSERS, DEFAULTS, getViewerConfig, READONLY_OPTIONS } from './data/config';
import { ANIMATION_MIN_DURATION, DEFAULT_TRANSITION, IDS, VIEWER_DATA } from './data/constants';
import { SYSTEM } from './data/system';
import {
    BeforeAnimateEvent,
    BeforeRotateEvent,
    ConfigChangedEvent,
    PanoramaErrorEvent,
    PanoramaLoadedEvent,
    ReadyEvent,
    SizeUpdatedEvent,
    StopAllEvent,
    ViewerEvents,
    ZoomUpdatedEvent,
} from './events';
import errorIcon from './icons/error.svg';
import { TypedEventTarget } from './lib/TypedEventTarget';
import {
    AnimateOptions,
    CssSize,
    ExtendedPosition,
    PanoramaOptions,
    ParsedViewerConfig,
    Position,
    Size,
    UpdatableViewerConfig,
    ViewerConfig,
} from './model';
import type { AbstractPlugin, PluginConstructor } from './plugins/AbstractPlugin';
import { pluginInterop } from './plugins/AbstractPlugin';
import { PSVError } from './PSVError';
import { DataHelper } from './services/DataHelper';
import { EventsHandler } from './services/EventsHandler';
import { Renderer } from './services/Renderer';
import { TextureLoader } from './services/TextureLoader';
import { ViewerDynamics } from './services/ViewerDynamics';
import { ViewerState } from './services/ViewerState';
import {
    Animation,
    exitFullscreen,
    getAbortError,
    getAngle,
    getElement,
    getShortestArc,
    isAbortError,
    isExtendedPosition,
    isFullscreenEnabled,
    logWarn,
    requestFullscreen,
    resolveBoolean,
    throttle,
    toggleClass,
} from './utils';

/**
 * Photo Sphere Viewer controller
 */
export class Viewer extends TypedEventTarget<ViewerEvents> {
    readonly state: ViewerState;
    readonly config: ParsedViewerConfig;

    readonly parent: HTMLElement;
    readonly container: HTMLElement;

    /** @internal */
    readonly adapter: AbstractAdapter<any, any>;
    /** @internal */
    readonly plugins: Record<string, AbstractPlugin<any>> = {};
    /** @internal */
    readonly dynamics: ViewerDynamics;

    readonly renderer: Renderer;
    readonly textureLoader: TextureLoader;
    /** @internal */
    readonly eventsHandler: EventsHandler;
    readonly dataHelper: DataHelper;

    readonly loader: Loader;
    readonly navbar: Navbar;
    readonly notification: Notification;
    readonly overlay: Overlay;
    readonly panel: Panel;

    /** @internal */
    readonly children: AbstractComponent[] = [];

    private readonly onResize = throttle(() => this.navbar.autoSize(), 500);

    constructor(config: ViewerConfig) {
        super();

        SYSTEM.load();

        this.state = new ViewerState();
        this.config = getViewerConfig(config);

        this.parent = getElement(config.container);
        // @ts-ignore
        this.parent[VIEWER_DATA] = this;

        this.container = document.createElement('div');
        this.container.classList.add('psv-container');
        this.parent.appendChild(this.container);

        // @ts-ignore
        this.adapter = new this.config.adapter[0](this, this.config.adapter[1]);

        this.renderer = new Renderer(this);
        this.textureLoader = new TextureLoader(this);
        this.eventsHandler = new EventsHandler(this);
        this.dataHelper = new DataHelper(this);
        this.dynamics = new ViewerDynamics(this);

        this.loader = new Loader(this);
        this.navbar = new Navbar(this);
        this.panel = new Panel(this);
        this.notification = new Notification(this);
        this.overlay = new Overlay(this);

        // init
        this.resize(this.config.size);
        this.setCursor(null);

        resolveBoolean(SYSTEM.isTouchEnabled, (enabled) => {
            toggleClass(this.container, 'psv--is-touch', enabled);
        });

        // init plugins
        this.config.plugins.forEach(([plugin, opts]) => {
            // @ts-ignore
            this.plugins[plugin.id] = new plugin(this, opts);
        });
        for (const plugin of Object.values(this.plugins)) {
            plugin.init?.();
        }

        // init buttons
        if (this.config.navbar) {
            this.navbar.setButtons(this.config.navbar);
        }

        // load panorama
        if (this.config.panorama) {
            this.setPanorama(this.config.panorama);
        } else {
            this.loader.show();
        }
    }

    /**
     * Destroys the viewer
     */
    destroy() {
        this.stopAll();
        this.stopKeyboardControl();
        this.exitFullscreen();

        for (const [id, plugin] of Object.entries(this.plugins)) {
            plugin.destroy();
            delete this.plugins[id];
        }

        this.children.slice().forEach((child) => child.destroy());
        this.children.length = 0;

        this.eventsHandler.destroy();
        this.renderer.destroy();
        this.textureLoader.destroy();
        this.dataHelper.destroy();
        this.adapter.destroy();
        this.dynamics.destroy();

        this.parent.removeChild(this.container);
        // @ts-ignore
        delete this.parent[VIEWER_DATA];
    }

    private init() {
        this.eventsHandler.init();
        this.renderer.init();

        if (this.config.navbar) {
            this.container.classList.add('psv--has-navbar');
            this.navbar.show();
        }

        if (this.config.keyboard === 'always') {
            this.startKeyboardControl();
        }

        this.resetIdleTimer();

        this.state.ready = true;

        this.dispatchEvent(new ReadyEvent());
    }

    /**
     * Restarts the idle timer
     * @internal
     */
    resetIdleTimer() {
        this.state.idleTime = performance.now();
    }

    /**
     * Stops the idle timer
     * @internal
     */
    disableIdleTimer() {
        this.state.idleTime = -1;
    }

    /**
     * Returns the instance of a plugin if it exists
     * @example By plugin identifier
     * ```js
     * viewer.getPlugin('markers')
     * ```
     * @example By plugin class with TypeScript support
     * ```ts
     * viewer.getPlugin<MarkersPlugin>(MarkersPlugin)
     * ```
     */
    getPlugin<T extends AbstractPlugin<any>>(pluginId: string | PluginConstructor): T {
        if (typeof pluginId === 'string') {
            return this.plugins[pluginId] as T;
        } else {
            const pluginCtor = pluginInterop(pluginId);
            return pluginCtor ? (this.plugins[pluginCtor.id] as T) : null;
        }
    }

    /**
     * Returns the current position of the camera
     */
    getPosition(): Position {
        return this.dataHelper.cleanPosition(this.dynamics.position.current);
    }

    /**
     * Returns the current zoom level
     */
    getZoomLevel(): number {
        return this.dynamics.zoom.current;
    }

    /**
     * Returns the current viewer size
     */
    getSize(): Size {
        return { ...this.state.size };
    }

    /**
     * Checks if the viewer is in fullscreen
     */
    isFullscreenEnabled(): boolean {
        return isFullscreenEnabled(this.container);
    }

    /**
     * Request a new render of the scene
     */
    needsUpdate() {
        this.state.needsUpdate = true;
    }

    /**
     * Resizes the scene if the viewer is resized
     */
    autoSize() {
        if (
            this.container.clientWidth !== this.state.size.width
            || this.container.clientHeight !== this.state.size.height
        ) {
            this.state.size.width = Math.round(this.container.clientWidth);
            this.state.size.height = Math.round(this.container.clientHeight);
            this.state.aspect = this.state.size.width / this.state.size.height;
            this.state.hFov = this.dataHelper.vFovToHFov(this.state.vFov);

            this.dispatchEvent(new SizeUpdatedEvent(this.getSize()));
            this.onResize();
        }
    }

    /**
     * Loads a new panorama file
     * @description Loads a new panorama file, optionally changing the camera position/zoom and activating the transition animation.<br>
     * If the "options" parameter is not defined, the camera will not move and the ongoing animation will continue.<br>
     * If another loading is already in progress it will be aborted.
     * @returns promise resolved with false if the loading was aborted by another call
     */
    setPanorama(path: any, options: PanoramaOptions = {}): Promise<boolean> {
        this.textureLoader.abortLoading();
        this.state.transitionAnimation?.cancel();

        // apply default parameters on first load
        if (!this.state.ready) {
            ['sphereCorrection', 'panoData', 'overlay', 'overlayOpacity'].forEach((opt) => {
                if (!(opt in options)) {
                    // @ts-ignore
                    options[opt] = this.config[opt];
                }
            });
        }

        if (options.transition === undefined || options.transition === true) {
            options.transition = DEFAULT_TRANSITION;
        }
        if (options.showLoader === undefined) {
            options.showLoader = true;
        }
        if (options.caption === undefined) {
            options.caption = this.config.caption;
        }
        if (options.description === undefined) {
            options.description = this.config.description;
        }
        if (!options.panoData && typeof this.config.panoData === 'function') {
            options.panoData = this.config.panoData;
        }

        const positionProvided = isExtendedPosition(options);
        const zoomProvided = 'zoom' in options;

        if (positionProvided || zoomProvided) {
            this.stopAll();
        }

        this.hideError();
        this.resetIdleTimer();

        this.config.panorama = path;
        this.config.caption = options.caption;
        this.config.description = options.description;

        const done = (err?: Error) => {
            this.loader.hide();

            this.state.loadingPromise = null;

            if (isAbortError(err)) {
                return false;
            } else if (err) {
                this.navbar.setCaption('');
                this.showError(this.config.lang.loadError);
                console.error(err);
                this.dispatchEvent(new PanoramaErrorEvent(path, err));
                throw err;
            } else {
                this.setOverlay(options.overlay, options.overlayOpacity);
                this.navbar.setCaption(this.config.caption);
                return true;
            }
        };

        this.navbar.setCaption(`<em>${this.config.loadingTxt || ''}</em>`);
        if (options.showLoader || !this.state.ready) {
            this.loader.show();
        }

        const loadingPromise = this.adapter.loadTexture(this.config.panorama, options.panoData).then((textureData) => {
            // check if another panorama was requested
            if (textureData.panorama !== this.config.panorama) {
                this.adapter.disposeTexture(textureData);
                throw getAbortError();
            }
            return textureData;
        });

        if (!options.transition || !this.state.ready || !this.adapter.supportsTransition(this.config.panorama)) {
            this.state.loadingPromise = loadingPromise
                .then((textureData) => {
                    this.renderer.show();
                    this.renderer.setTexture(textureData);
                    this.renderer.setPanoramaPose(textureData.panoData);
                    this.renderer.setSphereCorrection(options.sphereCorrection);

                    if (!this.state.ready) {
                        this.init();
                    }

                    this.dispatchEvent(new PanoramaLoadedEvent(textureData));

                    if (zoomProvided) {
                        this.zoom(options.zoom);
                    }
                    if (positionProvided) {
                        this.rotate(options);
                    }
                })
                .then(
                    () => done(),
                    (err) => done(err)
                );
        } else {
            this.state.loadingPromise = loadingPromise
                .then((textureData) => {
                    this.loader.hide();

                    this.dispatchEvent(new PanoramaLoadedEvent(textureData));

                    this.state.transitionAnimation = this.renderer.transition(textureData, options);
                    return this.state.transitionAnimation;
                })
                .then((completed) => {
                    this.state.transitionAnimation = null;
                    if (!completed) {
                        throw getAbortError();
                    }
                })
                .then(
                    () => done(),
                    (err) => done(err)
                );
        }

        return this.state.loadingPromise;
    }

    /**
     * Loads a new overlay
     */
    setOverlay(path: any, opacity = this.config.overlayOpacity): Promise<void> {
        const supportsOverlay = (this.adapter.constructor as typeof AbstractAdapter).supportsOverlay;

        if (!path) {
            if (supportsOverlay) {
                this.renderer.setOverlay(null, 0);
            }

            return Promise.resolve();
        } else {
            if (!supportsOverlay) {
                return Promise.reject(new PSVError(`Current adapter does not supports overlay`));
            }

            return this.adapter
                .loadTexture(
                    path,
                    (image) => {
                        const p = this.state.panoData;
                        const r = image.width / p.croppedWidth;
                        return {
                            fullWidth: r * p.fullWidth,
                            fullHeight: r * p.fullHeight,
                            croppedWidth: r * p.croppedWidth,
                            croppedHeight: r * p.croppedHeight,
                            croppedX: r * p.croppedX,
                            croppedY: r * p.croppedY,
                        };
                    },
                    false
                )
                .then((textureData) => {
                    this.renderer.setOverlay(textureData, opacity);
                });
        }
    }

    /**
     * Update options
     * @throws {@link PSVError} if the configuration is invalid
     */
    setOptions(options: Partial<UpdatableViewerConfig>) {
        const rawConfig: ViewerConfig = {
            ...this.config,
            ...options,
        };

        for (let [key, value] of Object.entries(options) as Array<[keyof typeof rawConfig, any]>) {
            if (!(key in DEFAULTS)) {
                logWarn(`Unknown option ${key}`);
                continue;
            }

            if (key in READONLY_OPTIONS) {
                logWarn((READONLY_OPTIONS as any)[key]);
                continue;
            }

            if (key in CONFIG_PARSERS) {
                // @ts-ignore
                value = CONFIG_PARSERS[key](value, {
                    rawConfig: rawConfig,
                    defValue: DEFAULTS[key],
                } as any);
            }

            // @ts-ignore
            this.config[key] = value;

            switch (key) {
                case 'mousemove':
                    if (!this.state.cursorOverride) {
                        this.setCursor(null);
                    }
                    break;

                case 'caption':
                    this.navbar.setCaption(this.config.caption);
                    break;

                case 'size':
                    this.resize(this.config.size);
                    break;

                case 'sphereCorrection':
                    this.renderer.setSphereCorrection(this.config.sphereCorrection);
                    break;

                case 'navbar':
                case 'lang':
                    this.navbar.setButtons(this.config.navbar);
                    break;

                case 'moveSpeed':
                case 'zoomSpeed':
                    this.dynamics.updateSpeeds();
                    break;

                case 'minFov':
                case 'maxFov':
                    this.dynamics.zoom.setValue(this.dataHelper.fovToZoomLevel(this.state.vFov));
                    this.dispatchEvent(new ZoomUpdatedEvent(this.getZoomLevel()));
                    break;

                case 'keyboard':
                    if (this.config.keyboard === 'always') {
                        this.startKeyboardControl();
                    } else {
                        this.stopKeyboardControl();
                    }
                    break;

                default:
                    break;
            }
        }

        this.needsUpdate();

        this.dispatchEvent(new ConfigChangedEvent(Object.keys(options) as any));
    }

    /**
     * Update options
     * @throws {@link PSVError} if the configuration is invalid
     */
    setOption<T extends keyof UpdatableViewerConfig>(option: T, value: UpdatableViewerConfig[T]) {
        this.setOptions({ [option]: value });
    }

    /**
     * Displays an error message over the viewer
     */
    showError(message: string) {
        this.overlay.show({
            id: IDS.ERROR,
            image: errorIcon,
            title: message,
            dissmisable: false,
        });
    }

    /**
     *  Hides the error message
     */
    hideError() {
        this.overlay.hide(IDS.ERROR);
    }

    /**
     * Rotates the view to specific position
     */
    rotate(position: ExtendedPosition) {
        const e = new BeforeRotateEvent(this.dataHelper.cleanPosition(position));
        this.dispatchEvent(e);

        if (e.defaultPrevented) {
            return;
        }

        this.dynamics.position.setValue(e.position);
    }

    /**
     * Zooms to a specific level between `maxFov` and `minFov`
     */
    zoom(level: number) {
        this.dynamics.zoom.setValue(level);
    }

    /**
     * Increases the zoom level
     */
    zoomIn(step = 1) {
        this.dynamics.zoom.step(step);
    }

    /**
     * Decreases the zoom level
     */
    zoomOut(step = 1) {
        this.dynamics.zoom.step(-step);
    }

    /**
     * Rotates and zooms the view with a smooth animation
     */
    animate(options: AnimateOptions): Animation {
        const positionProvided = isExtendedPosition(options);
        const zoomProvided = options.zoom !== undefined;

        const e = new BeforeAnimateEvent(
            positionProvided ? this.dataHelper.cleanPosition(options) : undefined,
            options.zoom
        );
        this.dispatchEvent(e);

        if (e.defaultPrevented) {
            return;
        }

        const cleanPosition = e.position as Position;
        const cleanZoom = e.zoomLevel;

        this.stopAll();

        const animProperties: {
            yaw?: { start: number; end: number };
            pitch?: { start: number; end: number };
            zoom?: { start: number; end: number };
        } = {};
        let duration;

        // clean/filter position and compute duration
        if (positionProvided) {
            const currentPosition = this.getPosition();

            // horizontal offset for shortest arc
            const tOffset = getShortestArc(currentPosition.yaw, cleanPosition.yaw);

            animProperties.yaw = { start: currentPosition.yaw, end: currentPosition.yaw + tOffset };
            animProperties.pitch = { start: currentPosition.pitch, end: cleanPosition.pitch };

            duration = this.dataHelper.speedToDuration(options.speed, getAngle(currentPosition, cleanPosition));
        }

        // clean/filter zoom and compute duration
        if (zoomProvided) {
            const dZoom = Math.abs(cleanZoom - this.getZoomLevel());

            animProperties.zoom = { start: this.getZoomLevel(), end: cleanZoom };

            if (!duration) {
                // if animating zoom only and a speed is given, use an arbitrary PI/4 to compute the duration
                duration = this.dataHelper.speedToDuration(options.speed, ((Math.PI / 4) * dZoom) / 100);
            }
        }

        // if no animation needed
        if (!duration) {
            if (positionProvided) {
                this.rotate(cleanPosition);
            }
            if (zoomProvided) {
                this.zoom(cleanZoom);
            }

            return new Animation(null);
        }

        this.state.animation = new Animation({
            properties: animProperties,
            duration: Math.max(ANIMATION_MIN_DURATION, duration),
            easing: 'inOutSine',
            onTick: (properties) => {
                if (positionProvided) {
                    this.dynamics.position.setValue({
                        yaw: properties.yaw,
                        pitch: properties.pitch,
                    });
                }
                if (zoomProvided) {
                    this.dynamics.zoom.setValue(properties.zoom);
                }
            },
        });

        this.state.animation.then(() => {
            this.state.animation = null;
            this.resetIdleTimer();
        });

        return this.state.animation;
    }

    /**
     * Stops the ongoing animation
     * @description The return value is a Promise because the is no guaranty the animation can be stopped synchronously.
     */
    stopAnimation(): PromiseLike<any> {
        if (this.state.animation) {
            this.state.animation.cancel();
            return this.state.animation;
        } else {
            return Promise.resolve();
        }
    }

    /**
     * Resizes the viewer
     */
    resize(size: CssSize) {
        const s = size as any;
        (['width', 'height'] as Array<'width' | 'height'>).forEach((dim) => {
            if (size && s[dim]) {
                if (/^[0-9.]+$/.test(s[dim])) {
                    s[dim] += 'px';
                }
                this.parent.style[dim] = s[dim];
            }
        });

        this.autoSize();
    }

    /**
     * Enters the fullscreen mode
     */
    enterFullscreen() {
        if (!this.isFullscreenEnabled()) {
            requestFullscreen(this.container);
        }
    }

    /**
     * Exits the fullscreen mode
     */
    exitFullscreen() {
        if (this.isFullscreenEnabled()) {
            exitFullscreen();
        }
    }

    /**
     * Enters or exits the fullscreen mode
     */
    toggleFullscreen() {
        if (!this.isFullscreenEnabled()) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }

    /**
     * Enables the keyboard controls
     */
    startKeyboardControl() {
        this.state.keyboardEnabled = true;
    }

    /**
     * Disables the keyboard controls
     */
    stopKeyboardControl() {
        this.state.keyboardEnabled = false;
    }

    /**
     * Creates a new tooltip
     * @description Use {@link Tooltip.move} to update the tooltip without re-create
     * @throws {@link PSVError} if the configuration is invalid
     */
    createTooltip(config: TooltipConfig): Tooltip {
        return new Tooltip(this, config);
    }

    /**
     * Changes global the mouse cursor
     */
    setCursor(cursor: string) {
        this.state.cursorOverride = cursor;
        if (!cursor) {
            this.container.style.cursor = this.config.mousemove ? 'move' : 'default';
        } else {
            this.container.style.cursor = cursor;
        }
    }

    /**
     * Subscribes to events on objects in the three.js scene
     * @param userDataKey - only objects with the following `userData` will be observed
     */
    observeObjects(userDataKey: string): void {
        if (!this.state.objectsObservers[userDataKey]) {
            this.state.objectsObservers[userDataKey] = null;
        }
    }

    /**
     * Unsubscribes to events on objects
     */
    unobserveObjects(userDataKey: string): void {
        delete this.state.objectsObservers[userDataKey];
    }

    /**
     * Stops all current animations
     * @internal
     */
    stopAll(): PromiseLike<void> {
        this.dispatchEvent(new StopAllEvent());

        this.disableIdleTimer();

        return this.stopAnimation();
    }
}
