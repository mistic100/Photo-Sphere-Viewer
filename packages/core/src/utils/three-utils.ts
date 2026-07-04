import { Euler, LinearFilter, LinearMipmapLinearFilter, Quaternion, Texture, Vector3 } from 'three';
import { SYSTEM } from '../data/system';

/**
 * Creates a THREE texture from an image
 */
export function createTexture(img: TexImageSource, mimaps = false): Texture {
    const texture = new Texture(img);
    texture.needsUpdate = true;
    texture.minFilter = mimaps ? LinearMipmapLinearFilter : LinearFilter;
    texture.generateMipmaps = mimaps;
    texture.anisotropy = mimaps ? 2 : 1;
    return texture;
}

/**
 * Creates a texture from an image element respectiing system "maxTextureWidth"
 * Also used to add a blur effect
 */
export function createSizedTexture(img: HTMLImageElement, blur?: { factor: number }): Texture {
    if (blur || img.width > SYSTEM.maxTextureWidth) {
        const ratio = Math.min(1, SYSTEM.maxCanvasWidth / img.width);

        const buffer = new OffscreenCanvas(Math.floor(img.width * ratio), Math.floor(img.height * ratio));

        const ctx = buffer.getContext('2d');

        if (blur) {
            ctx.filter = `blur(${buffer.width / blur.factor}px)`;
        }

        ctx.drawImage(img, 0, 0, buffer.width, buffer.height);

        return createTexture(buffer);
    }

    return createTexture(img);
}

const quaternion = new Quaternion();

/**
 * Applies the inverse of Euler angles to a vector
 */
export function applyEulerInverse(vector: Vector3, euler: Euler) {
    quaternion.setFromEuler(euler).invert();
    vector.applyQuaternion(quaternion);
}
