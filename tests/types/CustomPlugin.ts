import { AbstractPlugin, Viewer } from 'photo-sphere-viewer';

export class CustomPlugin extends AbstractPlugin {

  static id = 'custom';

  constructor(psv: Viewer) {
    super(psv);
  }

  doSomething() {

  }

}
