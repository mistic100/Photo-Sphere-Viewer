import type { Viewer } from '@photo-sphere-viewer/core';
import { AbstractPlugin, events, PSVError, utils } from '@photo-sphere-viewer/core';
import type { OptionsSetting, SettingsPlugin } from '@photo-sphere-viewer/settings-plugin';
import { ResolutionChangedEvent, ResolutionPluginEvents } from './events';
import { Resolution, ResolutionPluginConfig } from './model';

const getConfig = utils.getConfigParser<ResolutionPluginConfig>({
    resolutions: null,
    defaultResolution: null,
    showBadge: true,
});

/**
 *  Adds a setting to choose between multiple resolutions of the panorama.
 */
export class ResolutionPlugin extends AbstractPlugin<ResolutionPluginEvents> {
    static override readonly id = 'resolution';

    readonly config: ResolutionPluginConfig;

    private resolutions: Resolution[] = [];
    private resolutionsById: Record<string, Resolution> = {};

    private readonly state = {
        resolution: null as string,
    };

    private settings: SettingsPlugin;

    constructor(viewer: Viewer, config: ResolutionPluginConfig) {
        super(viewer);

        this.config = getConfig(config);

        if (this.config.defaultResolution && this.viewer.config.panorama) {
            utils.logWarn(
                'ResolutionPlugin, a defaultResolution was provided ' +
                    'but a panorama is already configured on the viewer, ' +
                    'the defaultResolution will be ignored.'
            );
        }
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        this.settings = this.viewer.getPlugin('settings');

        if (!this.settings) {
            throw new PSVError('Resolution plugin requires the Settings plugin');
        }

        this.settings.addSetting({
            id: ResolutionPlugin.id,
            type: 'options',
            label: this.viewer.config.lang.resolution,
            current: () => this.state.resolution,
            options: () => this.resolutions,
            apply: (resolution) => this.__setResolutionIfExists(resolution),
            badge: !this.config.showBadge ? null : () => this.state.resolution,
        } as OptionsSetting);

        this.viewer.addEventListener(events.PanoramaLoadedEvent.type, this);

        if (this.config.resolutions) {
            this.setResolutions(
                this.config.resolutions,
                this.viewer.config.panorama ? null : this.config.defaultResolution
            );
            delete this.config.resolutions;
            delete this.config.defaultResolution;
        }
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(events.PanoramaLoadedEvent.type, this);

        this.settings.removeSetting(ResolutionPlugin.id);

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e instanceof events.PanoramaLoadedEvent) {
            this.__refreshResolution();
        }
    }

    /**
     * Changes the available resolutions
     * @param resolutions
     * @param defaultResolution - if not provided, the current panorama is kept
     * @throws {@link PSVError} if the configuration is invalid
     */
    setResolutions(resolutions: Resolution[], defaultResolution?: string) {
        this.resolutions = resolutions || [];
        this.resolutionsById = {};

        resolutions.forEach((resolution) => {
            if (!resolution.id) {
                throw new PSVError('Missing resolution id');
            }
            if (!resolution.panorama) {
                throw new PSVError('Missing resolution panorama');
            }
            this.resolutionsById[resolution.id] = resolution;
        });

        // pick first resolution if no default provided and no current panorama
        if (!this.viewer.config.panorama && !defaultResolution) {
            defaultResolution = resolutions[0].id;
        }

        // ensure the default resolution exists
        if (defaultResolution && !this.resolutionsById[defaultResolution]) {
            utils.logWarn(`Resolution ${defaultResolution} unknown`);
            defaultResolution = resolutions[0].id;
        }

        if (defaultResolution) {
            this.setResolution(defaultResolution);
        }

        this.__refreshResolution();
    }

    /**
     * Changes the current resolution
     * @throws {@link PSVError} if the resolution does not exist
     */
    setResolution(id: string): Promise<unknown> {
        if (!this.resolutionsById[id]) {
            throw new PSVError(`Resolution ${id} unknown`);
        }

        return this.__setResolutionIfExists(id);
    }

    private __setResolutionIfExists(id: string): Promise<unknown> {
        if (this.resolutionsById[id]) {
            return this.viewer.setPanorama(this.resolutionsById[id].panorama, { transition: false, showLoader: false });
        } else {
            return Promise.resolve();
        }
    }

    /**
     * Returns the current resolution
     */
    getResolution(): string {
        return this.state.resolution;
    }

    /**
     * Updates current resolution on panorama load
     */
    private __refreshResolution() {
        const resolution = this.resolutions.find((r) => utils.deepEqual(this.viewer.config.panorama, r.panorama));
        if (this.state.resolution !== resolution?.id) {
            this.state.resolution = resolution?.id;
            this.settings?.updateButton();
            this.dispatchEvent(new ResolutionChangedEvent(this.state.resolution));
        }
    }
}
