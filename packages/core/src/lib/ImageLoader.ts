import { ImageLoader } from 'three';

/**
 * ThreeJS ImageLoader that can be aborted
 */
export class AbortableImageLoader extends ImageLoader {
    private _abortController = new AbortController();

    override abort() {
        this._abortController.abort();
        this._abortController = new AbortController();
        return this;
    }

    override load(
        url: string,
        onLoad: (data: HTMLImageElement) => void,
        onProgress: (event: ProgressEvent) => void,
        onError: (err: unknown) => void,
    ) {
        const abortSignal = this._abortController.signal;

        const image = super.load(
            url,
            (data) => {
                removeEventListeners();
                onLoad(data);
            },
            onProgress,
            (error) => {
                removeEventListeners();

                if (abortSignal.aborted) {
                    // Simulate an error similar to the DOMException thrown by the Fetch API
                    // (DOMException is not instanciable)
                    const e = new Error();
                    e.name = 'AbortError';
                    e.message = 'The operation was aborted.';
                    onError(e);
                } else {
                    onError(error);
                }
            },
        );

        function onAbortSignal() {
            image.src = '';
        }

        function removeEventListeners() {
            abortSignal.removeEventListener('abort', onAbortSignal, false);
        }

        abortSignal.addEventListener('abort', onAbortSignal, false);

        return image;
    }
}
