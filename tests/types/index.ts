import { CONSTANTS, Viewer } from 'photo-sphere-viewer';
import { EquirectangularTilesAdapter, EquirectangularTilesPanorama } from 'photo-sphere-viewer/dist/adapters/equirectangular-tiles';
import { MarkersPlugin, MarkersPluginOptions } from 'photo-sphere-viewer/dist/plugins/markers';
import { CustomPlugin } from './CustomPlugin';

const viewer = new Viewer({
  container: 'container',
  adapter: EquirectangularTilesAdapter,
  plugins: [
    [MarkersPlugin, {
      clickEventOnMarker: true,
    } as MarkersPluginOptions],
    CustomPlugin,
  ],
});

viewer.setPanorama({
  baseUrl: 'small.jpg',
  width: 16000,
  cols: 8,
  rows: 4,
} as EquirectangularTilesPanorama, {
  transition: false,
})
  .then(() => {

  });

viewer.animate({
  longitude: 0,
  latitude: 0,
  speed: '2rpm',
})
  .then(() => {

  });

viewer.zoom(50);

viewer.setOption('useXmpData', true);

viewer.setOptions({
  useXmpData: false,
});

viewer.navbar.setCaption('Test');

viewer.panel.show({
  content: 'Content',
  clickHandler: (e: MouseEvent) => null,
});

viewer.once('ready', e => {

});

viewer.on('position-updated', (e, position) => {
  const longitude: number = position.longitude;
});

viewer.on(CONSTANTS.CHANGE_EVENTS.GET_ANIMATE_POSITION, (e, position) => {
  return {longitude: position.longitude + 0.1, latitude: position.latitude + 0.1};
});

const markers = viewer.getPlugin(MarkersPlugin);
markers.on('select-marker', (e, marker) => {
  const markerId: string = marker.id;
});
markers.on(MarkersPlugin.EVENTS.UNSELECT_MARKER, (e, marker) => {
  const markerId: string = marker.id;
});

const customPlugin = viewer.getPlugin(CustomPlugin);
customPlugin.doSomething();

const customPluginAgain = viewer.getPlugin<CustomPlugin>('custom');
customPluginAgain.doSomething();
