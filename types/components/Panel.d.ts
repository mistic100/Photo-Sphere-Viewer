import { AbstractComponent } from './AbstractComponent';

export type PanelOptions = {
  id?: string;
  content: string;
  noMargin?: boolean;
  width?: string;
  clickHandler?: (e: MouseEvent) => {};
};

/**
 * @summary Panel class
 */
export class Panel extends AbstractComponent {

  show(config: string | PanelOptions);

  hide(id?: string);

  isVisible(id?: string): boolean;

}
