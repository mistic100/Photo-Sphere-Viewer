import { Viewer } from '@photo-sphere-viewer/core';
import { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    adapter: EquirectangularTilesAdapter,
    panorama: {
        width: 6656,
        cols: 16,
        rows: 8,
        baseUrl: `${baseUrl}sphere-small.jpg`,
        tileUrl: (col, row) => {
            const num = row * 16 + col + 1;
            return `${baseUrl}sphere-tiles/image_part_${('000' + num).slice(-3)}.jpg`;
        },
    },
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
});
