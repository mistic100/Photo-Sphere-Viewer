import { Mesh } from 'three';
import { PanoData, PanoDataProvider, TextureData } from '../models';
import { Viewer } from '../Viewer';

/**
 * @summary Base adapters class
 */
export abstract class AbstractAdapter {

  /**
   * @summary Unique identifier of the adapter
   */
  static id: string;

  /**
   * @summary Indicates if the adapter supports transitions between panoramas
   */
  static supportsTransition: boolean;

  constructor(parent: Viewer);

  /**
   * @summary Destroys the adapter
   */
  destroy();

  /**
   * @summary Loads the panorama texture(s)
   */
  loadTexture(panorama: any, newPanoData?: PanoData | PanoDataProvider): Promise<TextureData>;

  /**
   * @summary Creates the cube mesh
   * @param {number} [scale=1]
   */
  createMesh(scale?: number): Mesh;

  /**
   * @summary Applies the texture to the mesh
   */
  setTexture(mesh: Mesh, textureData: TextureData);

  /**
   * @summary Changes the opacity of the mesh
   */
  setTextureOpacity(mesh: Mesh, opacity: number);

}

export type AdapterConstructor<T extends AbstractAdapter> = new (psv: Viewer, options?: any) => T;
