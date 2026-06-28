export type CubemapFaces = 'left' | 'front' | 'right' | 'back' | 'top' | 'bottom';

/**
 * Object defining a cubemap as separated files
 */
export type Cubemap = Record<CubemapFaces, string>;

/**
 * Object defining a cubemap as separated files
 * images order is : left, front, right, back, top, bottom
 */
export type CubemapArray = string[];

/**
 * Object defining a cubemap as separated files
 */
export type CubemapSeparate = {
    type: 'separate';
    paths: Cubemap | CubemapArray;
    /**
     * Set to true if the top and bottom faces are not correctly oriented
     * @default false
     */
    flipTopBottom?: boolean;
    /**
     * used for cubemap tiles adapter
     * @internal
     */
    blur?: boolean;
};

/**
 * Object defining a cubemap as a single stripe file
 */
export type CubemapStripe = {
    type: 'stripe';
    path: string;
    /**
     * Set to true if the top and bottom faces are not correctly oriented
     * @default false
     */
    flipTopBottom?: boolean;
    /**
     * Order of the faces in the file
     * @default 'left, front, right, back, top, bottom'
     */
    order?: CubemapFaces[];
    /**
     * used for cubemap tiles adapter
     * @internal
     */
    blur?: boolean;
};

/**
 * Object defining a cubemap as a single net file (cross arrangement)
 */
export type CubemapNet = {
    type: 'net';
    path: string;
    /**
     * used for cubemap tiles adapter
     * @internal
     */
    blur?: boolean;
};

/**
 * Configuration of a cubemap
 */
export type CubemapPanorama = Cubemap | CubemapArray | CubemapSeparate | CubemapStripe | CubemapNet;

/**
 * Size information of a cubemap panorama
 */
export type CubemapData = {
    isCubemap: true;
    flipTopBottom: boolean;
    faceSize: number;
};

export type CubemapAdapterConfig = unknown;
