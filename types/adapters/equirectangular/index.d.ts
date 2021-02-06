import { AbstractAdapter, PanoData, PanoDataProvider, TextureData } from '../..';

/**
 * @summary Adapter for equirectangular panoramas
 */
export class EquirectangularAdapter extends AbstractAdapter {

  loadTexture(panorama: string, newPanoData?: PanoData | PanoDataProvider): Promise<TextureData>;

}
