import { AbstractComponent } from './AbstractComponent';

export type OverlayOptions = {
  id?: string;
  image: string;
  text: string;
  subtext?: string;
  dissmisable?: boolean;
};

/**
 * @summary Overlay class
 */
export class Overlay extends AbstractComponent {

  show(config: string | OverlayOptions);

  hide(id?: string);

  isVisible(id?: string): boolean;

}
