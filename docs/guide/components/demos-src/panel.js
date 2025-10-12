import { Viewer } from '@photo-sphere-viewer/core';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';
const BUTTON_ID = 'panel-button';
const PANEL_ID = 'custom-panel';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
    navbar: [
        'zoom',
        {
            id: BUTTON_ID,
            title: 'Toggle panel',
            content: '🆘',
            onClick: togglePanel,
        },
        'caption',
        'fullscreen',
    ],
});

viewer.addEventListener('show-panel', ({ panelId }) => {
    if (panelId === PANEL_ID) {
        viewer.navbar.getButton(BUTTON_ID).toggleActive(true);
    }
});

viewer.addEventListener('hide-panel', ({ panelId }) => {
    if (panelId === PANEL_ID) {
        viewer.navbar.getButton(BUTTON_ID).toggleActive(false);
    }
});

viewer.addEventListener('ready', togglePanel, { once: true });

function togglePanel() {
    if (viewer.panel.isVisible(PANEL_ID)) {
        viewer.panel.hide();
    } else {
        viewer.panel.show({
            id: PANEL_ID,
            width: '60%',
            title: 'HTML Ipsum Presents',
            content: document.querySelector('#panel-content').innerHTML,
        });
    }
}
