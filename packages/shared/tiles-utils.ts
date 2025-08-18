import { utils } from '@photo-sphere-viewer/core';
import { BufferGeometry, LineSegments, Material, MeshBasicMaterial, Object3D, WireframeGeometry } from 'three';

/**
 * Generates an material for errored tiles
 * @internal
 */
export function buildErrorMaterial(): MeshBasicMaterial {
    const canvas = new OffscreenCanvas(512, 512);

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${canvas.width / 5}px serif`;
    ctx.fillStyle = '#a22';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠', canvas.width / 2, canvas.height / 2);

    return new MeshBasicMaterial({ map: utils.createTexture(canvas) });
}

/**
 * Creates a wireframe geometry, for debug
 * @internal
 */
export function createWireFrame(geometry: BufferGeometry): Object3D {
    const wireframe = new WireframeGeometry(geometry);
    const line = new LineSegments<WireframeGeometry, Material>(wireframe);
    line.material.depthTest = false;
    line.material.depthWrite = false;
    line.material.opacity = 0.25;
    line.material.transparent = true;
    return line;
}

const DEBUG_COLORS = ['dodgerblue', 'limegreen', 'indianred'];

/**
 * Applies a color filter to an tile image and shows the id of the tile
 * @internal
 */
export function buildDebugTexture(image: HTMLImageElement, level: number, id: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = DEBUG_COLORS[level % DEBUG_COLORS.length];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(image, 0, 0);

    const fontSize = image.width / 7;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'white';
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    id.split('\n').forEach((id2, i) => {
        ctx.fillText(id2, image.width / 2, image.height / 2 + fontSize * (0.3 + i));
    });

    return canvas;
}
