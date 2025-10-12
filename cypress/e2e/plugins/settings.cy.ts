import type { OptionsSetting, SettingsPlugin, ToggleSetting } from '@photo-sphere-viewer/settings-plugin';
import { callPlugin, callViewer, checkEventHandler, waitViewerReady } from '../../utils';
import { NO_LOG } from '../../utils/constants';

type ToggleSettingWithValue = ToggleSetting & { v: boolean };
type OptionsSettingWithValue = OptionsSetting & { v: string };

describe('plugin: settings', () => {
    let toggleSetting: ToggleSettingWithValue;
    let optionSetting: OptionsSettingWithValue;

    beforeEach(() => {
        localStorage.photoSphereViewer_touchSupport = 'false';
        cy.visit('e2e/plugins/settings.html');
        waitViewerReady();

        toggleSetting = withToggleSetting();
        optionSetting = withOptionsSetting();

        callSettings('add settings').then((settings) => {
            settings.addSetting(toggleSetting);
            settings.addSetting(optionSetting);
        });
    });

    it('should destroy', () => {
        callViewer('destroy').then(viewer => viewer.destroy());
    });

    it('should add a navbar button', () => {
        cy.get('.psv-settings-button')
            .should('be.visible')
            .click()
            .should('have.class', 'psv-button--active');

        cy.get('.psv-settings')
            .should('be.visible')
            .compareScreenshots('base');
    });

    it('should hide settings on panel open', () => {
        cy.get('.psv-settings-button').click();

        callViewer('open panel').then(viewer => viewer.panel.show('Lorem ipsum'));

        cy.get('.psv-settings').should('not.be.visible');
    });

    it('should remove settings', () => {
        callSettings('remove settings').then((settings) => {
            settings.removeSetting(toggleSetting.id);
            settings.removeSetting(optionSetting.id);
        });

        cy.get('.psv-settings-button').should('not.be.visible');
    });

    it('should place the menu close to the button', () => {
        [
            ['caption settings', 'right', '0px'],
            ['settings caption', 'left', '0px'],
            ['move move settings caption', 'left', '270px'],
            ['download settings caption', 'left', '0px'],
            ['caption settings fullscreen', 'right', '0px'],
        ].forEach(([navbar, prop, value]) => {
            callViewer(`navbar "${navbar}"`).then(viewer => viewer.setOption('navbar', navbar));

            cy.get('.psv-settings-button').click();

            cy.get('.psv-settings').should('have.css', prop, value);

            cy.get('.psv-settings-button').click();
        });
    });

    it('should toggle the toggle', () => {
        const settingChangedHandler = listenSettingsEvent('setting-changed');

        cy.get('.psv-settings-button').click();
        cy.get('[data-setting-id=toggle-setting]').click();

        checkToggleValue(toggleSetting, true);
        checkEventHandler(settingChangedHandler, { settingId: 'toggle-setting', settingValue: true });
        cy.get('.psv-settings').compareScreenshots('toggle-true');

        cy.get('[data-setting-id=toggle-setting]').click();

        checkToggleValue(toggleSetting, false);
        checkEventHandler(settingChangedHandler, { settingId: 'toggle-setting', settingValue: false });
        cy.get('.psv-settings').compareScreenshots('base');
    });

    it('should select an option', () => {
        const settingChangedHandler = listenSettingsEvent('setting-changed');

        cy.get('.psv-settings-button').click();
        cy.get('[data-setting-id=options-setting]').click();

        cy.get('.psv-settings').compareScreenshots('option-list');

        cy.get('[data-option-id=__back]').click();

        checkOptionValue(optionSetting, 'A');
        cy.wrap(settingChangedHandler, NO_LOG).should('not.have.been.called');
        cy.get('.psv-settings').compareScreenshots('base');

        cy.get('[data-setting-id=options-setting]').click();
        cy.get('[data-option-id=B]').click();

        checkOptionValue(optionSetting, 'B');
        checkEventHandler(settingChangedHandler, { settingId: 'options-setting', settingValue: 'B' });
        cy.get('.psv-settings').should('not.be.visible');

        cy.get('.psv-settings-button').click();

        cy.get('.psv-settings').compareScreenshots('option-b');
    });

    it('should navigate with keyboard', () => {
        cy.get('.psv-settings-button').trigger('keydown', { key: 'Enter' });
        cy.get('[data-setting-id=toggle-setting]').trigger('keydown', { key: 'Enter' });

        checkToggleValue(toggleSetting, true);

        cy.get('.psv-settings').trigger('keydown', { key: 'Escape' });

        cy.get('.psv-settings').should('not.be.visible');
    });

    it('should display a badge', () => {
        cy.get('.psv-settings-button')
            .should('include.text', 'A')
            .compareScreenshots('badge-a');

        cy.get('.psv-settings-button').click();
        cy.get('[data-setting-id=options-setting]').click();
        cy.get('[data-option-id=B]').click();

        cy.get('.psv-settings-button')
            .should('include.text', 'B')
            .blur()
            .compareScreenshots('badge-b');
    });

    it('should throw if missing properties', () => {
        callSettings('set settings').then((settings) => {
            expect(() => settings.addSetting({ ...withToggleSetting(), id: null })).to.throw('Missing setting id');

            expect(() => settings.addSetting({ ...withToggleSetting(), type: null })).to.throw('Missing setting type');

            expect(() => settings.addSetting(withToggleSetting())).to.throw('Setting "toggle-setting" already exists');
        });
    });

    it('should persist to localStorage', () => {
        cy.visit('e2e/plugins/settings.html?persist=true');
        waitViewerReady();

        callSettings('set settings').then((settings) => {
            settings.addSetting(toggleSetting);
            settings.addSetting(optionSetting);
        });

        cy.get('.psv-settings-button').click();
        cy.get('[data-setting-id=toggle-setting]').click();
        cy.get('[data-setting-id=options-setting]').click();
        cy.get('[data-option-id=B]').click();

        checkLocalStorage('psvSettings', 'toggle-setting', true);
        checkLocalStorage('psvSettings', 'options-setting', 'B');

        cy.reload();
        waitViewerReady();

        const settingChangedHandler = listenSettingsEvent('setting-changed');

        callSettings('set settings').then((settings) => {
            settings.addSetting(withToggleSetting());
            settings.addSetting(withOptionsSetting());
        });

        checkEventHandler(settingChangedHandler, { settingId: 'toggle-setting', settingValue: true });
        checkEventHandler(settingChangedHandler, { settingId: 'options-setting', settingValue: 'B' });

        cy.get('.psv-settings-button').click();
        cy.get('.psv-settings').compareScreenshots('option-b-toggle-true');
    });

    function callSettings(log: string) {
        return callPlugin<SettingsPlugin>('settings', log);
    }

    function listenSettingsEvent(name: Parameters<SettingsPlugin['addEventListener']>[0]): Cypress.Agent<sinon.SinonStub> {
        const handler = cy.stub();
        callSettings(`listen "${name}"`).then(settings => settings.addEventListener(name, handler));
        return handler;
    }

    function withToggleSetting() {
        return {
            id: 'toggle-setting',
            label: 'Toggle setting',
            type: 'toggle',
            v: false,
            active() { return this.v; },
            toggle() { this.v = !this.v; },
        } satisfies ToggleSettingWithValue;
    }

    function checkToggleValue(setting: ToggleSettingWithValue, expected: boolean) {
        cy.wrap(setting, NO_LOG).should(() => expect(setting.v).to.eq(expected));
    }

    function withOptionsSetting() {
        return {
            id: 'options-setting',
            label: 'Options setting',
            type: 'options',
            v: 'A',
            options: () => [
                { id: 'A', label: 'Option A' },
                { id: 'B', label: 'Option B' },
            ],
            current() { return this.v; },
            apply(option) { this.v = option; },
            badge() { return this.v; },
        } satisfies OptionsSettingWithValue;
    }

    function checkOptionValue(setting: OptionsSettingWithValue, expected: string) {
        cy.wrap(setting, NO_LOG).should(() => expect(setting.v).to.eq(expected));
    }

    function checkLocalStorage(key: string, name: string, value: any) {
        cy.window().its('localStorage').its(key).should((psvSettings) => {
            expect(JSON.parse(psvSettings)).to.have.property(name, value);
        });
    }
});
