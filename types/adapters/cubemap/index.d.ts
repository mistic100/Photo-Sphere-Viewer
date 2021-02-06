import { AbstractAdapter, TextureData } from '../..';

/**
 * @summary Object defining a cubemap
 */
export type Cubemap = string[6] | {
  top: string;
  right: string;
  bottom: string;
  left: string;
  front: string;
  back: string;
};

/**
 * @summary Adapter for cubemaps
 */
export class CubemapAdapter extends AbstractAdapter {

  loadTexture(panorama: Cubemap): Promise<TextureData>;

}
