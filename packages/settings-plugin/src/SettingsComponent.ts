import type { Viewer } from '@photo-sphere-viewer/core';
import { AbstractComponent, CONSTANTS, utils } from '@photo-sphere-viewer/core';
import { ID_BACK, ID_ENTER, OPTION_DATA, SETTINGS_TEMPLATE, SETTING_DATA, SETTING_OPTIONS_TEMPLATE } from './constants';
import { OptionsSetting, ToggleSetting } from './model';
import type { SettingsPlugin } from './SettingsPlugin';

export class SettingsComponent extends AbstractComponent {
    constructor(
        private readonly plugin: SettingsPlugin,
        viewer: Viewer
    ) {
        super(viewer, {
            className: `psv-settings ${CONSTANTS.CAPTURE_EVENTS_CLASS}`,
        });

        this.container.addEventListener('click', this);
        this.container.addEventListener('transitionend', this);
        this.container.addEventListener('keydown', this);

        this.hide();
    }

    handleEvent(e: Event) {
        switch (e.type) {
            case 'click':
                this.__click(e.target as HTMLElement);
                break;

            case 'transitionend':
                if (!this.isVisible()) {
                    this.container.innerHTML = ''; // empty content after fade out
                } else {
                    this.__focusFirstOption();
                }
                break;

            case 'keydown':
                if (this.isVisible()) {
                    switch ((e as KeyboardEvent).key) {
                        case CONSTANTS.KEY_CODES.Escape:
                            this.plugin.hideSettings();
                            break;
                        case CONSTANTS.KEY_CODES.Enter:
                            this.__click(e.target as HTMLElement);
                            break;
                    }
                }
                break;
        }
    }

    override show(buttonPosition?: DOMRect) {
        this.__showSettings(false);

        this.container.classList.add('psv-settings--open');
        this.container.style.right = '';
        this.container.style.left = '';

        if (buttonPosition) {
            const viewerRect = this.viewer.container.getBoundingClientRect();
            const buttonLeft = buttonPosition.left - viewerRect.left;
            const buttonRight = viewerRect.right - buttonPosition.right;
            const buttonWidth = buttonPosition.width;
            const menuWidth = this.container.offsetWidth;

            if (menuWidth >= buttonLeft + buttonWidth) {
                this.container.style.left = '0px';
            } else if (buttonLeft + menuWidth < viewerRect.width) {
                this.container.style.left = `${buttonLeft}px`;
            } else if (menuWidth >= buttonRight + buttonWidth) {
                this.container.style.right = '0px';
            } else {
                this.container.style.right = `${buttonRight}px`;
            }
        } else {
            this.container.style.right = '0px';
        }

        this.state.visible = true;
    }

    override hide() {
        this.container.classList.remove('psv-settings--open');
        this.state.visible = false;
    }

    /**
     * Handle clicks on items
     */
    private __click(element: HTMLElement) {
        const li = utils.getClosest(element, 'li');
        if (!li) {
            return;
        }

        const settingId = li.dataset[SETTING_DATA];
        const optionId = li.dataset[OPTION_DATA];

        const setting = this.plugin.settings.find((s) => s.id === settingId);

        switch (optionId) {
            case ID_BACK:
                this.__showSettings(true);
                break;

            case ID_ENTER:
                switch (setting.type) {
                    case 'toggle':
                        this.plugin.toggleSettingValue(setting as ToggleSetting);
                        this.__showSettings(true); // re-render
                        break;

                    case 'options':
                        this.__showOptions(setting as OptionsSetting);
                        break;

                    default:
                    // noop
                }
                break;

            default:
                switch (setting.type) {
                    case 'options':
                        this.hide();
                        this.plugin.applySettingOption(setting as OptionsSetting, optionId);
                        break;

                    default:
                    // noop
                }
                break;
        }
    }

    /**
     * Shows the list of options
     */
    private __showSettings(focus: boolean) {
        this.container.innerHTML = SETTINGS_TEMPLATE(this.plugin.settings, (setting) => {
            const current = setting.current();
            const option = setting.options().find((opt) => opt.id === current);
            return option?.label;
        });

        // must not focus during the initial transition
        if (focus) {
            this.__focusFirstOption();
        }
    }

    /**
     * Shows setting options panel
     */
    private __showOptions(setting: OptionsSetting) {
        const current = setting.current();

        this.container.innerHTML = SETTING_OPTIONS_TEMPLATE(setting, (option) => {
            return option.id === current;
        });

        this.__focusFirstOption();
    }

    private __focusFirstOption() {
        this.container.querySelector<HTMLElement>('[tabindex]')?.focus();
    }
}
