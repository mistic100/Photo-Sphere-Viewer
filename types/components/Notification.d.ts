import { AbstractComponent } from './AbstractComponent';

export type NotificationOptions = {
  content: string;
  timeout?: number;
};

/**
 * @summary Notification class
 */
export class Notification extends AbstractComponent {

  show(config: string | NotificationOptions);

}
