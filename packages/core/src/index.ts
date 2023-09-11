import { Cache, ColorManagement } from 'three';
import * as CONSTANTS from './data/constants';
import * as utils from './utils';
import * as events from './events';

Cache.enabled = false;
// https://discourse.threejs.org/t/updates-to-color-management-in-three-js-r152/50791
ColorManagement.enabled = false;

export type { AdapterConstructor } from './adapters/AbstractAdapter';
export type { EquirectangularAdapterConfig } from './adapters/EquirectangularAdapter';
export type { ButtonConfig, ButtonConstructor } from './buttons/AbstractButton';
export type { Tooltip, TooltipConfig, TooltipPosition } from './components/Tooltip';
export type { Loader } from './components/Loader';
export type { Navbar } from './components/Navbar';
export type { Notification, NotificationConfig } from './components/Notification';
export type { Overlay, OverlayConfig } from './components/Overlay';
export type { Panel, PanelConfig } from './components/Panel';
export type { TypedEventTarget } from './lib/TypedEventTarget';
export type { PluginConstructor } from './plugins/AbstractPlugin';
export type { DataHelper } from './services/DataHelper';
export type { Renderer, CustomRenderer } from './services/Renderer';
export type { TextureLoader } from './services/TextureLoader';
export type { ViewerState } from './services/ViewerState';

export { AbstractAdapter } from './adapters/AbstractAdapter';
export { EquirectangularAdapter } from './adapters/EquirectangularAdapter';
export { AbstractButton } from './buttons/AbstractButton';
export { AbstractComponent } from './components/AbstractComponent';
export { registerButton } from './components/Navbar';
export { DEFAULTS } from './data/config';
export { SYSTEM } from './data/system';
export { TypedEvent } from './lib/TypedEventTarget';
export { AbstractPlugin, AbstractConfigurablePlugin } from './plugins/AbstractPlugin';
export { PSVError } from './PSVError';
export { Viewer } from './Viewer';
export * from './model';
export { CONSTANTS, events, utils };

/** @internal  */
import './styles/index.scss';
