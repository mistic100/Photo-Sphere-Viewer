import { Viewer } from '@photo-sphere-viewer/core';
import { CubemapTilesAdapter } from '@photo-sphere-viewer/cubemap-tiles-adapter';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    adapter: CubemapTilesAdapter,
    panorama: {
        faceSize: 1500,
        nbTiles: 4,
        baseUrl: {
            left: baseUrl + 'cubemap/px.jpg',
            front: baseUrl + 'cubemap/nz.jpg',
            right: baseUrl + 'cubemap/nx.jpg',
            back: baseUrl + 'cubemap/pz.jpg',
            top: baseUrl + 'cubemap/py.jpg',
            bottom: baseUrl + 'cubemap/ny.jpg',
        },
        tileUrl: (face, col, row) => {
            const num = row * 4 + col;
            return `${baseUrl}cubemap-tiles/${face}_${('00' + num).slice(-2)}.jpg`;
        },
    },
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
});
