import type { RGB } from 'three';
import type { PanoData } from '../model';

/**
 * Web Worker function to interpolate missing parts of cropped panoramas
 * WARNING : this function must be autonomous
 */
function interpolationWorker() {
    self.onmessage = (e: MessageEvent) => {
        const panoData: PanoData = e.data.panoData;

        const buffer = new OffscreenCanvas(panoData.fullWidth, panoData.fullHeight);
        const ctx = buffer.getContext('2d', {
            willReadFrequently: true,
        });

        const img = new OffscreenCanvas(panoData.croppedWidth, panoData.croppedHeight);
        const ctxImg = img.getContext('2d');
        ctxImg.putImageData(e.data.image, 0, 0);

        autoBackground(buffer, img, panoData);

        postMessage(ctx.getImageData(0, 0, buffer.width, buffer.height));
    };

    function autoBackground(buffer: OffscreenCanvas, img: OffscreenCanvas, panoData: PanoData) {
        const croppedY2 = panoData.fullHeight - panoData.croppedHeight - panoData.croppedY;
        const croppedX2 = panoData.fullWidth - panoData.croppedWidth - panoData.croppedX;
        const middleY = panoData.croppedY + panoData.croppedHeight / 2;

        const blurSize = buffer.width / 32;
        const padding = blurSize;
        const edge = 10;
        const filter = `blur(${blurSize}px)`;

        const ctx = buffer.getContext('2d');

        // first draw to get the colors
        ctx.drawImage(
            img,
            panoData.croppedX,
            panoData.croppedY,
            panoData.croppedWidth,
            panoData.croppedHeight
        );

        // top section
        if (panoData.croppedY > 0) {
            if (panoData.croppedX > 0 || croppedX2 > 0) {
                ctx.filter = 'none';

                const colorLeft = getAverageColor(ctx, panoData.croppedX, panoData.croppedY, edge, edge, 2);
                const colorRight = getAverageColor(ctx, buffer.width - croppedX2 - 11, panoData.croppedY, edge, edge, 2);
                const colorCenter = averageRgb(colorLeft, colorRight);

                // top-left corner
                if (panoData.croppedX > 0) {
                    ctx.fillStyle = createHorizontalGradient(ctx, 0, panoData.croppedX, colorCenter, colorLeft);
                    ctx.fillRect(-padding, -padding, panoData.croppedX + padding * 2, middleY + padding);
                }

                // top right corner
                if (croppedX2 > 0) {
                    ctx.fillStyle = createHorizontalGradient(ctx, buffer.width - croppedX2, buffer.width, colorRight, colorCenter);
                    ctx.fillRect(buffer.width - croppedX2 - padding, -padding, croppedX2 + padding * 2, middleY + padding);
                }
            }

            ctx.filter = filter;

            // top
            ctx.drawImage(
                img,
                0, 0,
                img.width, edge,
                panoData.croppedX, -padding,
                panoData.croppedWidth, panoData.croppedY + padding * 2
            );

            // hide to top seam
            ctx.fillStyle = rgbCss(getAverageColor(ctx, 0, 0, buffer.width, edge, edge));
            ctx.fillRect(-padding, -padding, buffer.width + padding * 2, padding * 2);
        }

        // bottom section
        if (croppedY2 > 0) {
            if (panoData.croppedX > 0 || croppedX2 > 0) {
                ctx.filter = 'none';

                const colorLeft = getAverageColor(ctx, panoData.croppedX, buffer.height - croppedY2 - 1 - edge, edge, edge, 2);
                const colorRight = getAverageColor(ctx, buffer.width - croppedX2 - 1 - edge, buffer.height - croppedY2 - 1 - edge, edge, edge, 2);
                const colorCenter = averageRgb(colorLeft, colorRight);

                // bottom-left corner
                if (panoData.croppedX > 0) {
                    ctx.fillStyle = createHorizontalGradient(ctx, 0, panoData.croppedX, colorCenter, colorLeft);
                    ctx.fillRect(-padding, middleY, panoData.croppedX + padding * 2, buffer.height - middleY + padding);
                }

                // bottom-right corner
                if (croppedX2 > 0) {
                    ctx.fillStyle = createHorizontalGradient(ctx, buffer.width - croppedX2, buffer.width, colorRight, colorCenter);
                    ctx.fillRect(buffer.width - croppedX2 - padding, middleY, croppedX2 + padding * 2, buffer.height - middleY + padding);
                }
            }

            ctx.filter = filter;

            // bottom
            ctx.drawImage(
                img,
                0, img.height - edge,
                img.width, edge,
                panoData.croppedX, buffer.height - croppedY2 - padding,
                panoData.croppedWidth, croppedY2 + padding * 2
            );

            // hide the bottom seam
            ctx.fillStyle = rgbCss(getAverageColor(ctx, 0, buffer.height - 1 - edge, buffer.width, edge, edge));
            ctx.fillRect(-padding, buffer.height - padding, buffer.width + padding * 2, padding * 2);
        }

        // left section
        if (panoData.croppedX > 0) {
            ctx.filter = filter;

            ctx.drawImage(
                img,
                img.width - edge, 0,
                edge, img.height,
                -padding, panoData.croppedY,
                padding * 2, panoData.croppedHeight
            );

            ctx.drawImage(
                img,
                0, 0,
                edge, img.height,
                0, panoData.croppedY,
                panoData.croppedX + padding, panoData.croppedHeight
            );
        }

        // right section
        if (croppedX2 > 0) {
            ctx.filter = filter;

            ctx.drawImage(
                img,
                0, 0,
                edge, img.height,
                buffer.width - padding, panoData.croppedY,
                padding * 2, panoData.croppedHeight
            );

            ctx.drawImage(
                img,
                img.width - edge, 0,
                edge, img.height,
                buffer.width - croppedX2 - padding, panoData.croppedY,
                croppedX2 + padding, panoData.croppedHeight
            );
        }

        ctx.filter = 'none';

        // final draw
        ctx.drawImage(
            img,
            panoData.croppedX,
            panoData.croppedY,
            panoData.croppedWidth,
            panoData.croppedHeight
        );
    }

    /**
     * Returns the CSS string for RGB color
     */
    function rgbCss(color: RGB): string {
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }

    /**
     * Returns the average of two RGB colors
     */
    function averageRgb(c1: RGB, c2: RGB): RGB {
        return {
            r: Math.round(c1.r / 2 + c2.r / 2),
            g: Math.round(c1.g / 2 + c2.g / 2),
            b: Math.round(c1.b / 2 + c2.b / 2),
        };
    }

    /**
     * Creates a simple horizontal gradient
     */
    function createHorizontalGradient(
        ctx: OffscreenCanvasRenderingContext2D,
        x1: number,
        x2: number,
        c1: RGB,
        c2: RGB
    ) {
        const grad = ctx.createLinearGradient(x1, 0, x2, 0);
        grad.addColorStop(0, rgbCss(c1));
        grad.addColorStop(1, rgbCss(c2));
        return grad;
    }

    /**
     * Gets the average RGB color of a portion from a canvas element
     */
    function getAverageColor(
        ctx: OffscreenCanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        every: number
    ): RGB {
        every = Math.round(every);

        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        const data = ctx.getImageData(x, y, w, h);

        for (let row = 0; row < h; row += every) {
            for (let col = 0; col < w; col += every) {
                const i = 4 * (row * w + col);
                r += data.data[i];
                g += data.data[i + 1];
                b += data.data[i + 2];
                count++;
            }
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        return { r, g, b };
    }
}

export const interpolationWorkerSrc = URL.createObjectURL(
    new Blob(['(', interpolationWorker.toString(), ')()'], 
    { type: 'application/javascript' })
);
