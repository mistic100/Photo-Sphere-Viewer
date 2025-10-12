import type { PluginConstructor, Viewer } from '@photo-sphere-viewer/core';
import { AbstractPlugin, CONSTANTS, events, PSVError, utils } from '@photo-sphere-viewer/core';
import { LOCAL_STORAGE_KEY } from './constants';
import { SettingChangedEvent, SettingsPluginEvents } from './events';
import { OptionsSetting, Setting, SettingsPluginConfig, ToggleSetting } from './model';
import { SettingsButton } from './SettingsButton';
import { SettingsComponent } from './SettingsComponent';

function getData() {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
}

function setData(data: any) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

const getConfig = utils.getConfigParser<SettingsPluginConfig>({
    persist: false,
    storage: {
        set(settingId: string, value: boolean | string) {
            const data = getData();
            data[settingId] = value;
            setData(data);
        },
        get(settingId: string) {
            return getData()[settingId];
        },
    },
});

/**
 * Adds a button to access various settings
 */
export class SettingsPlugin extends AbstractPlugin<SettingsPluginEvents> {
    static override readonly id = 'settings';
    static override readonly VERSION = PKG_VERSION;

    readonly config: SettingsPluginConfig;

    private readonly component: SettingsComponent;
    readonly settings: Setting[] = [];

    static withConfig(config: SettingsPluginConfig): [PluginConstructor, any] {
        return [SettingsPlugin, config];
    }

    constructor(viewer: Viewer, config: SettingsPluginConfig) {
        super(viewer);

        this.config = getConfig(config);

        this.component = new SettingsComponent(this, this.viewer);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        utils.checkStylesheet(this.viewer.container, 'settings-plugin');

        this.viewer.addEventListener(events.ClickEvent.type, this);
        this.viewer.addEventListener(events.ShowPanelEvent.type, this);
        this.viewer.addEventListener(events.KeypressEvent.type, this);

        // buttons are initialized just after plugins
        setTimeout(() => this.updateButton());
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(events.ClickEvent.type, this);
        this.viewer.removeEventListener(events.ShowPanelEvent.type, this);
        this.viewer.removeEventListener(events.KeypressEvent.type, this);

        this.component.destroy();
        this.settings.length = 0;

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e instanceof events.ClickEvent || e instanceof events.ShowPanelEvent) {
            if (this.component.isVisible()) {
                this.hideSettings();
            }
        } else if (e instanceof events.KeypressEvent) {
            if (e.matches(CONSTANTS.KEY_CODES.Escape) && this.component.isVisible()) {
                this.hideSettings();
            }
        }
    }

    /**
     * Registers a new setting
     * @throws {@link PSVError} if the configuration is invalid
     */
    addSetting(setting: Setting) {
        if (!setting.id) {
            throw new PSVError('Missing setting id');
        }
        if (!setting.type) {
            throw new PSVError('Missing setting type');
        }
        if (this.settings.some(s => s.id === setting.id)) {
            throw new PSVError(`Setting "${setting.id}" already exists`);
        }

        if (setting.badge && this.settings.some(s => s.badge)) {
            utils.logWarn('More than one setting with a badge are declared, the result is unpredictable.');
        }

        this.settings.push(setting);

        if (this.component.isVisible()) {
            this.showSettings(); // re-render
        }

        this.updateButton();

        if (this.config.persist) {
            Promise.resolve(this.config.storage.get(setting.id)).then((value) => {
                switch (setting.type) {
                    case 'toggle': {
                        const toggle = setting as ToggleSetting;
                        if (!utils.isNil(value) && value !== toggle.active()) {
                            toggle.toggle();
                            this.dispatchEvent(new SettingChangedEvent(toggle.id, toggle.active()));
                        }
                        break;
                    }

                    case 'options': {
                        const options = setting as OptionsSetting;
                        if (!utils.isNil(value) && value !== options.current()) {
                            options.apply(value as string);
                            this.dispatchEvent(new SettingChangedEvent(options.id, options.current()));
                        }
                        break;
                    }

                    default:
                    // noop
                }

                this.updateButton();
            });
        }
    }

    /**
     * Removes a setting
     */
    removeSetting(id: string) {
        const idx = this.settings.findIndex(setting => setting.id === id);
        if (idx !== -1) {
            this.settings.splice(idx, 1);

            if (this.component.isVisible()) {
                this.component.show(); // re-render
            }

            this.updateButton();
        }
    }

    /**
     * Toggles the settings menu
     */
    toggleSettings() {
        if (this.component.isVisible()) {
            this.hideSettings();
        } else {
            this.showSettings();
        }
    }

    /**
     * Hides the settings menu
     */
    hideSettings() {
        const button = this.__getButton();
        button?.toggleActive(false);
        this.component.hide();
    }

    /**
     * Shows the settings menu
     */
    showSettings() {
        const button = this.__getButton();
        this.component.show(button?.container.getBoundingClientRect());
        button?.toggleActive(true);
    }

    /**
     * Updates the badge in the button
     */
    updateButton() {
        const button = this.__getButton();
        if (this.settings.length) {
            const value = this.settings.find(s => s.badge)?.badge();
            button?.show();
            button?.setBadge(value);
        } else {
            button?.hide();
        }
    }

    /**
     * Toggles a setting
     * @internal
     */
    toggleSettingValue(setting: ToggleSetting) {
        const newValue = !setting.active(); // in case "toggle" is async

        setting.toggle();

        this.dispatchEvent(new SettingChangedEvent(setting.id, newValue));

        if (this.config.persist) {
            this.config.storage.set(setting.id, newValue);
        }

        this.updateButton();
    }

    /**
     * Changes the value of an setting
     * @internal
     */
    applySettingOption(setting: OptionsSetting, optionId: string) {
        setting.apply(optionId);

        this.dispatchEvent(new SettingChangedEvent(setting.id, optionId));

        if (this.config.persist) {
            this.config.storage.set(setting.id, optionId);
        }

        this.updateButton();
    }

    private __getButton() {
        return this.viewer.navbar.getButton(SettingsButton.id, false) as SettingsButton;
    }
}
