import { Viewer } from '@photo-sphere-viewer/core';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
    navbar: 'zoom caption fullscreen',
});

let tooltip;

function onMouseMove(e) {
    if (!tooltip) {
        tooltip = viewer.createTooltip({
            content: '&copy; Damien Sorel',
            left: e.clientX,
            top: e.clientY,
            position: 'top right',
        });
    } else {
        tooltip.move({
            left: e.clientX,
            top: e.clientY,
            position: 'top right',
        });
    }
}

function onMouseLeave() {
    if (tooltip) {
        tooltip.hide();
        tooltip = null;
    }
}

viewer.addEventListener('ready', () => {
    viewer.parent.addEventListener('mousemove', onMouseMove);
    viewer.parent.addEventListener('mouseleave', onMouseLeave);
}, { once: true });
