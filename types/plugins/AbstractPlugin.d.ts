import { EventEmitter } from 'uevent';
import { Viewer } from '../Viewer';

/**
 * @summary Base plugins class
 */
export abstract class AbstractPlugin extends EventEmitter {

  /**
   * @summary Unique identifier of the plugin
   */
  static id: string;

  constructor(psv: Viewer);

  /**
   * @summary Destroys the plugin
   */
  destroy();

}

export type PluginConstructor<T extends AbstractPlugin> = new (psv: Viewer, options?: any) => T;
