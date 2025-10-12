import { Viewer } from '@photo-sphere-viewer/core';
import { SettingsPlugin } from '@photo-sphere-viewer/settings-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,

    plugins: [SettingsPlugin],
});

const settings = viewer.getPlugin(SettingsPlugin);

let currentToggle = true;
let currentOption = 'A';

settings.addSetting({
    id: 'custom-toggle-setting',
    label: 'Toggle setting',
    type: 'toggle',
    active: () => currentToggle,
    toggle: () => (currentToggle = !currentToggle),
});

settings.addSetting({
    id: 'custom-options-setting',
    label: 'Options setting',
    type: 'options',
    current: () => currentOption,
    options: () => [
        { id: 'A', label: 'Option A' },
        { id: 'B', label: 'Option B' },
    ],
    apply: option => (currentOption = option),
    badge: () => currentOption,
});
