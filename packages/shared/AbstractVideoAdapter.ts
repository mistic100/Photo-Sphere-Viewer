import type { TextureData, Viewer } from '@photo-sphere-viewer/core';
import { AbstractAdapter, PSVError } from '@photo-sphere-viewer/core';
import { BufferGeometry, Material, Mesh, VideoTexture } from 'three';

export type AbstractVideoPanorama = {
    source: string;
};

export type AbstractVideoAdapterConfig = {
    /**
     * automatically start the video
     * @default false
     */
    autoplay?: boolean;
    /**
     * initially mute the video
     * @default false
     */
    muted?: boolean;
};

type AbstractVideoMesh = Mesh<BufferGeometry, Material>;
type AbstractVideoTexture = TextureData<VideoTexture>;

/**
 * Base video adapters class
 */
export abstract class AbstractVideoAdapter<TPanorama extends AbstractVideoPanorama> extends AbstractAdapter<
    TPanorama,
    VideoTexture
> {
    static override readonly supportsDownload = false;
    static override readonly supportsOverlay = false;

    protected abstract readonly config: AbstractVideoAdapterConfig;

    private video: HTMLVideoElement;

    constructor(viewer: Viewer) {
        super(viewer);
    }

    override init() {
        super.init();

        this.viewer.needsContinuousUpdate(true);
    }

    override destroy() {
        this.__removeVideo();

        super.destroy();
    }

    override supportsPreload(): boolean {
        return false;
    }

    override supportsTransition(): boolean {
        return false;
    }

    loadTexture(panorama: AbstractVideoPanorama): Promise<AbstractVideoTexture> {
        if (typeof panorama !== 'object' || !panorama.source) {
            return Promise.reject(new PSVError('Invalid panorama configuration, are you using the right adapter?'));
        }

        if (!this.viewer.getPlugin('video')) {
            return Promise.reject(new PSVError('Video adapters require VideoPlugin to be loaded too.'));
        }

        const video = this.__createVideo(panorama.source);

        return this.__videoLoadPromise(video).then(() => {
            const texture = new VideoTexture(video);
            return { panorama, texture, cacheKey: null };
        });
    }

    protected switchVideo(texture: VideoTexture) {
        let currentTime;
        let duration;
        let paused = !this.config.autoplay;
        let muted = this.config.muted;
        let volume = 1;
        if (this.video) {
            ({ currentTime, duration, paused, muted, volume } = this.video);
        }

        this.__removeVideo();
        this.video = texture.image;

        // keep current time when switching resolution
        if (this.video.duration === duration) {
            this.video.currentTime = currentTime;
        }

        // keep volume
        this.video.muted = muted;
        this.video.volume = volume;

        // play
        if (!paused) {
            this.video.play();
        }
    }

    setTextureOpacity(mesh: AbstractVideoMesh, opacity: number) {
        mesh.material.opacity = opacity;
        mesh.material.transparent = opacity < 1;
    }

    setOverlay() {
        throw new PSVError('VideoAdapter does not support overlay');
    }

    disposeTexture(textureData: AbstractVideoTexture): void {
        textureData.texture.dispose();
    }

    private __removeVideo() {
        if (this.video) {
            this.video.pause();
            this.video.remove();
            delete this.video;
        }
    }

    private __createVideo(src: string): HTMLVideoElement {
        const video = document.createElement('video');
        video.crossOrigin = this.viewer.config.withCredentials ? 'use-credentials' : 'anonymous';
        video.loop = true;
        video.playsInline = true;
        video.muted = this.config.muted;
        video.preload = 'metadata';
        video.src = src;

        video.style.display = 'none';
        this.viewer.container.appendChild(video);

        return video;
    }

    private __videoLoadPromise(video: HTMLVideoElement): Promise<void> {
        return new Promise((resolve, reject) => {
            const onLoaded = () => {
                if (this.video && video.duration === this.video.duration) {
                    resolve(this.__videoBufferPromise(video, this.video.currentTime));
                } else {
                    resolve();
                }
                video.removeEventListener('loadedmetadata', onLoaded);
            };

            const onError = (err: ErrorEvent) => {
                reject(err);
                video.removeEventListener('error', onError);
            };

            video.addEventListener('loadedmetadata', onLoaded);
            video.addEventListener('error', onError);
        });
    }

    private __videoBufferPromise(video: HTMLVideoElement, currentTime: number): Promise<void> {
        return new Promise((resolve) => {
            function onBuffer() {
                const buffer = video.buffered;
                for (let i = 0, l = buffer.length; i < l; i++) {
                    if (buffer.start(i) <= video.currentTime && buffer.end(i) >= video.currentTime) {
                        video.pause();
                        video.removeEventListener('buffer', onBuffer);
                        video.removeEventListener('progress', onBuffer);
                        resolve();
                        break;
                    }
                }
            }

            // try to reduce the switching time by preloading in advance
            // FIXME find a better way ?
            video.currentTime = Math.min(currentTime + 2000, video.duration);
            video.muted = true;

            video.addEventListener('buffer', onBuffer);
            video.addEventListener('progress', onBuffer);

            video.play();
        });
    }
}
