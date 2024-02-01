import { Loader } from 'three';

class HttpError extends Error {

    constructor(message: string, public response: Response) {

        super(message);

    }

}

/**
 * Copy of ThreeJS FileLoader with support of an abortSignal and only supporting Blob response
 * Also removing all unused features for PSV
 */
export class BlobLoader extends Loader<Blob, string> {

    // @ts-ignore
    load(
        url: string,
        onLoad: (data: Blob) => void,
        onProgress: (event: ProgressEvent) => void,
        onError: (err: unknown) => void,
        abortSignal: AbortSignal
    ) {

        // create request
        const req = new Request(url, {
            headers: new Headers(this.requestHeader),
            credentials: this.withCredentials ? 'include' : 'same-origin',
        });

        // start the fetch
        fetch(req, {
            signal: abortSignal,
        })
            .then(response => {

                if (response.status === 200 || response.status === 0) {

                    const reader = response.body.getReader();

                    // Nginx needs X-File-Size check
                    // https://serverfault.com/questions/482875/why-does-nginx-remove-content-length-header-for-chunked-content
                    const contentLength = response.headers.get('Content-Length') || response.headers.get('X-File-Size');
                    const total = contentLength ? parseInt(contentLength) : 0;
                    const lengthComputable = total !== 0;
                    let loaded = 0;

                    // periodically read data into the new stream tracking while download progress
                    const stream = new ReadableStream({
                        start(controller) {

                            readData();

                            function readData() {

                                reader.read().then(({ done, value }) => {

                                    if (done) {

                                        controller.close();

                                    } else {

                                        loaded += value.byteLength;

                                        const event = new ProgressEvent('progress', { lengthComputable, loaded, total });
                                        onProgress(event);

                                        controller.enqueue(value);
                                        readData();

                                    }

                                }).catch((err) => {
                                    onError(err)
                                  });

                            }

                        }

                    });

                    return new Response(stream);

                } else {

                    throw new HttpError(`fetch for "${response.url}" responded with ${response.status}: ${response.statusText}`, response);

                }

            })
            .then(response => {

                return response.blob();

            })
            .then(data => {

                onLoad(data);

            })
            .catch(err => {

                onError(err);

            });

    }

}
