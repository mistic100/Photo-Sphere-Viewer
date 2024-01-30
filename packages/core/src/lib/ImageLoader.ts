import { Loader } from 'three';

/**
 * Copy of ThreeJS ImageLoader with support of an abortSignal
 * Also removing all unused features for PSV
 */
export class ImageLoader extends Loader<HTMLImageElement, string> {

    // @ts-ignore
    load(
        url: string,
        onLoad: (data: HTMLImageElement) => void,
        onError: (err: unknown) => void,
        abortSignal: AbortSignal
    ) {

        const image = document.createElement('img');

        function onImageLoad(this: HTMLImageElement) {

            removeEventListeners();

            onLoad(this);

        }

        function onImageError(event: ErrorEvent) {

            removeEventListeners();

            if (abortSignal.aborted) {

                // Simulate an error similar to the DOMException thrown by the Fetch API
                // (DOMException is not instanciable)
                const e = new Error();
                e.name = 'AbortError';
                e.message = 'The operation was aborted.';
                onError(e);

            } else {

                onError(event);

            }

        }

        function onAbortSignal() {

            image.src = '';

        }

        function removeEventListeners() {

            image.removeEventListener('load', onImageLoad, false);
            image.removeEventListener('error', onImageError, false);

            abortSignal.removeEventListener('abort', onAbortSignal, false);

        }

        image.addEventListener('load', onImageLoad, false);
        image.addEventListener('error', onImageError, false);

        abortSignal.addEventListener('abort', onAbortSignal, false);

        if (!url.startsWith('data:')) {

            if (this.crossOrigin !== undefined) image.crossOrigin = this.crossOrigin;

        }

        image.src = url;

        return image;

    }

}
