import { FileLoader } from 'three';
import { PSVError } from '../PSVError';
import type { Viewer } from '../Viewer';
import { AbstractService } from './AbstractService';

/**
 * Image and texture loading system
 */
export class TextureLoader extends AbstractService {
    private readonly loader: FileLoader;

    /**
     * @internal
     */
    constructor(viewer: Viewer) {
        super(viewer);

        this.loader = new FileLoader();
        this.loader.setResponseType('blob');
        if (this.config.withCredentials) {
            this.loader.setWithCredentials(true);
            this.loader.setCrossOrigin('use-credentials');
        }
    }

    /**
     * @internal
     */
    override destroy() {
        this.abortLoading();
        super.destroy();
    }

    /**
     * Cancels current HTTP requests
     * @internal
     */
    abortLoading() {
        // noop implementation waiting for https://github.com/mrdoob/three.js/pull/23070
    }

    /**
     * Loads a Blob with FileLoader
     */
    loadFile(url: string, onProgress?: (p: number) => void): Promise<Blob> {
        if (this.config.requestHeaders) {
            this.loader.setRequestHeader(this.config.requestHeaders(url));
        }

        return new Promise((resolve, reject) => {
            let progress = 0;
            onProgress?.(progress);

            this.loader.load(
                url,
                (result) => {
                    progress = 100;
                    onProgress?.(progress);
                    resolve(result as any as Blob);
                },
                (e) => {
                    if (e.lengthComputable) {
                        const newProgress = (e.loaded / e.total) * 100;
                        if (newProgress > progress) {
                            progress = newProgress;
                            onProgress?.(progress);
                        }
                    }
                },
                (err) => {
                    reject(err);
                }
            );
        });
    }

    /**
     * Loads an Image using FileLoader to have progress events
     */
    loadImage(url: string, onProgress?: (p: number) => void): Promise<HTMLImageElement> {
        return this.loadFile(url, onProgress).then((blob) => this.blobToImage(blob));
    }

    /**
     * Converts a file loaded with {@link loadFile} into an image
     */
    blobToImage(blob: Blob): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                resolve(img);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    }

    /**
     * Preload a panorama file without displaying it
     */
    preloadPanorama(panorama: any): Promise<unknown> {
        if (this.viewer.adapter.supportsPreload(panorama)) {
            return this.viewer.adapter.loadTexture(panorama);
        } else {
            return Promise.reject(new PSVError('Current adapter does not support preload'));
        }
    }
}
