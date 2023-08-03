import { TypedEvent } from '@photo-sphere-viewer/core';
import type { VideoPlugin } from './VideoPlugin';

/**
 * @event Triggered when the video starts playing or is paused
 */
export class PlayPauseEvent extends TypedEvent<VideoPlugin> {
    static override readonly type = 'play-pause';
    override type: 'play-pause';

    constructor(public readonly playing: boolean) {
        super(PlayPauseEvent.type);
    }
}

/**
 * @event Triggered when the video volume changes
 */
export class VolumeChangeEvent extends TypedEvent<VideoPlugin> {
    static override readonly type = 'volume-change';
    override type: 'volume-change';

    constructor(public readonly volume: number) {
        super(VolumeChangeEvent.type);
    }
}

/**
 * @event Triggered when the video play progression changes
 */
export class ProgressEvent extends TypedEvent<VideoPlugin> {
    static override readonly type = 'progress';
    override type: 'progress';

    constructor(
        public readonly time: number,
        public readonly duration: number,
        public readonly progress: number
    ) {
        super(ProgressEvent.type);
    }
}

/**
 * @event Triggered when the video buffer changes
 * @internal
 */
export class BufferEvent extends TypedEvent<VideoPlugin> {
    static override readonly type = 'buffer';
    override type: 'buffer';

    constructor(public readonly maxBuffer: number) {
        super(BufferEvent.type);
    }
}

export type VideoPluginEvents = PlayPauseEvent | VolumeChangeEvent | ProgressEvent | BufferEvent;
