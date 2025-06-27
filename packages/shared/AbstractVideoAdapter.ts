import type { TextureData, Viewer } from '@photo-sphere-viewer/core';
import { AbstractAdapter, PSVError } from '@photo-sphere-viewer/core';
import { BufferGeometry, Material, Mesh, VideoTexture } from 'three';
import { createVideo } from './video-utils';

export type AbstractVideoPanorama = {
    source: string | MediaStream | HTMLVideoElement;
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
type AbstractVideoTextureData = TextureData<VideoTexture>;

/**
 * Base video adapters class
 */
export abstract class AbstractVideoAdapter<
    TPanorama extends AbstractVideoPanorama,
    TData,
    TMesh extends AbstractVideoMesh,
> extends AbstractAdapter<TPanorama, TData, VideoTexture, TMesh> {
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

    async loadTexture(panorama: AbstractVideoPanorama): Promise<AbstractVideoTextureData> {
        if (typeof panorama !== 'object' || !panorama.source) {
            return Promise.reject(new PSVError('Invalid panorama configuration, are you using the right adapter?'));
        }

        if (!this.viewer.getPlugin('video')) {
            return Promise.reject(new PSVError('Video adapters require VideoPlugin to be loaded too.'));
        }

        const video = panorama.source instanceof HTMLVideoElement
            ? panorama.source
            : createVideo({
                    src: panorama.source,
                    withCredentials: this.viewer.config.withCredentials(panorama.source as any),
                    muted: true,
                    autoplay: false,
                });

        await this.__videoLoadPromise(video);

        const texture = new VideoTexture(video);
        return { panorama, texture };
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

    setTextureOpacity(mesh: TMesh, opacity: number) {
        mesh.material.opacity = opacity;
        mesh.material.transparent = opacity < 1;
    }

    disposeTexture({ texture }: AbstractVideoTextureData) {
        texture.dispose();
    }

    disposeMesh(mesh: AbstractVideoMesh) {
        mesh.geometry.dispose();
        mesh.material.dispose();
    }

    private __removeVideo() {
        if (this.video) {
            this.video.pause();
            this.video.remove();
            delete this.video;
        }
    }

    private __videoLoadPromise(video: HTMLVideoElement): Promise<void> {
        return new Promise((resolve, reject) => {
            const onLoaded = () => {
                if (this.video && video.duration === this.video.duration) {
                    video.currentTime = this.video.currentTime;
                }
                resolve();
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
}
