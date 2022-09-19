<style>
  .playground-container {
    margin: 0 calc(-50vw + 940px / 2);
    display: flex;
    align-items: stretch;
  }

  #form {
    flex: none;
    width: 700px;
    margin-top: 0;
    margin-right: 10px;
  }

  #viewer {
    width: 100%;
    height: calc(100vh - 350px);
    z-index: 1;
  }

  @media (max-width: 940px) {
    .playground-container {
      margin: 0;
    }
  }

  @media (max-width: 1600px) {
    .playground-container {
      display: block;
    }

    #form {
      width: 100%;
      margin-right: 0;
    }

    #viewer {
      margin-top: 10px;
      height: 600px;
    }
  }

  .playground-container .md-tabs {
    align-items: stretch;
  }

  .playground-container .md-tabs-content {
    overflow-y: visible;
    height: 100% !important;
  }

  .playground-container .md-title {
    margin: 2em 0 0 0;
  }
</style>

<template>
  <div class="playground-container">
    <div id="form">
      <md-tabs md-elevation="1" md-alignment="fixed" v-show="!editMarkers">
        <md-tab md-label="Panorama">
          <div class="md-layout md-gutter">
            <md-button class="md-primary md-dense md-raised" style="margin: 15px 0 0 20px; width: 150px"
                       v-on:click="loadDefaultFile">
              Use demo file
            </md-button>
            <div class="md-layout-item">
              <md-field>
                <label>Panorama image</label>
                <md-file v-model="file" accept="image/*" v-on:md-change="loadFile"/>
              </md-field>
            </div>
          </div>

          <md-field md-clearable>
            <label>Caption</label>
            <md-input name="caption" v-model="options.caption" :disabled="!imageData"/>
          </md-field>
        </md-tab>

        <md-tab md-label="Standard options">
          <div class="md-layout md-gutter">
            <div class="md-layout-item md-size-33">
              <md-field>
                <label>Default longitude</label>
                <md-input v-model="options.defaultLong" :disabled="!imageData"/>
              </md-field>
            </div>
            <div class="md-layout-item md-size-33">
              <md-field>
                <label>Default latitude</label>
                <md-input v-model="options.defaultLat" :disabled="!imageData"/>
              </md-field>
            </div>
          </div>

          <div class="md-layout md-gutter">
            <div class="md-layout-item md-size-33">
              <md-field>
                <label>Default zoom level</label>
                <md-input type="number" min="0" max="100" v-model="options.defaultZoomLvl" :disabled="!imageData"/>
              </md-field>
            </div>
            <div class="md-layout-item md-size-33">
              <md-field>
                <label>Min FOV</label>
                <md-input type="number" min="1" max="179" v-model="options.minFov" :disabled="!imageData"/>
              </md-field>
            </div>
            <div class="md-layout-item md-size-33">
              <md-field>
                <label>Max FOV</label>
                <md-input type="number" min="1" max="179" v-model="options.maxFov" :disabled="!imageData"/>
              </md-field>
            </div>
          </div>

          <div class="md-layout md-gutter">
            <div class="md-layout-item md-size-33">
              <md-field>
                <label>Autorotate speed</label>
                <md-input v-model="options.autorotateSpeed" :disabled="!imageData"/>
              </md-field>
            </div>
            <div class="md-layout-item md-size-33">
              <md-field>
                <label>Autorotate latitude</label>
                <md-input v-model="options.autorotateLat" :disabled="!imageData"/>
              </md-field>
            </div>
            <div class="md-layout-item md-size-33 checkbox-field">
              <md-checkbox class="md-primary" v-model="options.autorotateIdle" :disabled="!imageData">Autorotate on idle</md-checkbox>
            </div>
          </div>

          <div class="md-layout md-gutter">
            <div class="md-layout-item md-size-33 checkbox-field">
              <md-checkbox class="md-primary" v-model="options.fisheye" :disabled="!imageData">Fisheye</md-checkbox>
            </div>
            <div class="md-layout-item md-size-33 checkbox-field">
              <md-checkbox class="md-primary" v-model="options.mousewheel" :disabled="!imageData">Mousewheel
              </md-checkbox>
            </div>
            <div class="md-layout-item md-size-33 checkbox-field">
              <md-checkbox class="md-primary" v-model="options.mousewheelCtrlKey" :disabled="!imageData">
                Hold Ctrl to zoom
              </md-checkbox>
            </div>
            <div class="md-layout-item md-size-33 checkbox-field">
              <md-checkbox class="md-primary" v-model="options.mousemove" :disabled="!imageData">Mouse move
              </md-checkbox>
            </div>
            <div class="md-layout-item md-size-33 checkbox-field">
              <md-checkbox class="md-primary" v-model="options.touchmoveTwoFingers" :disabled="!imageData">
                Two fingers move
              </md-checkbox>
            </div>
          </div>
        </md-tab>

        <md-tab md-label="Advanced options">
          <div class="md-layout md-gutter" style="margin-bottom: 40px">
            <div class="md-layout-item md-size-33">
              <label class="md-caption">Correction, pan</label>
              <vue-slider v-model="sphereCorrection.pan" :min="-180" :max="180" :marks="[-180,-90,0,90,180]"
                          :drag-on-click="true" :disabled="!imageData"/>
            </div>
            <div class="md-layout-item md-size-33">
              <label class="md-caption">Correction, tilt</label>
              <vue-slider v-model="sphereCorrection.tilt" :min="-90" :max="90" :marks="[-90,0,90]"
                          :drag-on-click="true" :disabled="!imageData"/>
            </div>
            <div class="md-layout-item md-size-33">
              <label class="md-caption">Correction, roll</label>
              <vue-slider v-model="sphereCorrection.roll" :min="-180" :max="180" :marks="[-180,-90,0,90,180]"
                          :drag-on-click="true" :disabled="!imageData"/>
            </div>
          </div>

          <div class="md-layout md-gutter">
            <div class="md-layout-item md-size-33">
              <md-field>
                <label>Move speed</label>
                <md-input type="number" min="0" step="0.1" v-model="options.moveSpeed" :disabled="!imageData"/>
              </md-field>
            </div>
            <div class="md-layout-item md-size-33">
              <md-field>
                <label>Zoom speed</label>
                <md-input type="number" min="0" step="0.1" v-model="options.zoomSpeed" :disabled="!imageData"/>
              </md-field>
            </div>
          </div>

          <div class="md-layout md-gutter">
            <div class="md-layout-item md-size-33 checkbox-field">
              <md-checkbox class="md-primary" v-model="options.moveInertia" :disabled="!imageData">
                Move inertia
              </md-checkbox>
            </div>
            <div class="md-layout-item md-size-33">
              <md-field>
                <label>Canvas background</label>
                <v-swatches shapes="circles" v-model="options.canvasBackground" :disabled="!imageData">
                  <md-input slot="trigger" :value="options.canvasBackground" :disabled="!imageData"/>
                </v-swatches>
              </md-field>
            </div>
          </div>
        </md-tab>

        <md-tab md-label="Navbar config">
          <div class="md-layout md-gutter">
            <div class="md-layout-item md-size-33" v-for="item in navbar">
              <md-checkbox class="md-primary" v-model="item.enabled" :disabled="!imageData">{{ item.label }}
              </md-checkbox>
            </div>
          </div>
        </md-tab>
      </md-tabs>

      <md-button v-if="!editMarkers"
                 class="md-primary md-raised" style="width: calc(100% - 16px)"
                 :disabled="!imageData" v-on:click="editMarkers = true">
        Add markers
      </md-button>

      <md-button v-if="editMarkers"
                 class="md-raised" style="width: calc(100% - 16px)"
                 v-on:click="editMarkers = false; cancelMarker();">
        Back
      </md-button>

      <md-card v-show="editMarkers">
        <md-card-header>
          <div class="md-title" v-if="!markerForm.type">
            Markers
          </div>
          <div class="md-title" v-if="markerForm.type">
            {{ markerForm.saved ? 'Edit' : 'New' }} <code>{{ markerForm.type }}</code> marker
          </div>
          <div class="md-subhead">
            <span v-if="markerForm.type === 'image' || markerForm.type === 'imageLayer' || markerForm.type === 'html'">
              Click on the viewer the {{ markerForm.saved ? 'move' : 'place' }} the marker.
            </span>
            <span v-else-if="markerForm.type === 'polygonRad' || markerForm.type === 'polylineRad'">
              {{ markerForm.saved ? 'The marker position cannot be edited.' : 'Click on the viewer to add a point. Double-click to complete the marker.' }}
            </span>
            <span v-else-if="!markerForm.type && markersList.length > 0">
              Click on a marker to edit its properties.
            </span>
            <span v-else>
              No markers yet.
            </span>
          </div>
        </md-card-header>

        <md-card-area>
          <md-card-content v-if="markerForm.type">
            <div class="md-layout md-gutter">
              <div class="md-layout-item md-size-33">
                <md-field>
                  <label>Id</label>
                  <md-input type="text" v-model="markerForm.id" :disabled="markerForm.saved"/>
                </md-field>
              </div>
              <div class="md-layout-item md-size-66">
                <md-field>
                  <label>Name</label>
                  <md-input type="text" v-model="markerForm.listContent"/>
                </md-field>
              </div>
            </div>

            <div class="md-layout md-gutter" v-if="markerForm.type === 'html'">
              <div class="md-layout-item md-size-33">
                <md-field>
                  <label>Content</label>
                  <md-input type="text" v-model="markerForm.html"/>
                </md-field>
              </div>
              <div class="md-layout-item md-size-33">
                <label class="md-caption">Font size</label>
                <vue-slider v-model="markerForm.style.fontSize" :data="FONT_SIZES"
                            :drag-on-click="true" :marks="FONT_SIZES_2"/>
              </div>
              <div class="md-layout-item md-size-33">
                <md-field>
                  <label>Text color</label>
                  <v-swatches shapes="circles" popover-x="left" v-model="markerForm.style.color">
                    <md-input slot="trigger" :value="markerForm.style.color"/>
                  </v-swatches>
                </md-field>
              </div>
            </div>

            <div class="md-layout md-gutter" v-if="markerForm.type === 'image' || markerForm.type === 'imageLayer'">
              <md-button v-if="markerForm.type === 'image'"
                         class="md-icon-button md-raised" style="margin: 15px 0 0 20px;"
                         v-bind:class="{'md-primary': markerForm.image === PIN_RED_URL }"
                         v-on:click="markerForm.image = PIN_RED_URL">
                <img v-bind:src="PIN_RED_URL" width="32px">
              </md-button>
              <md-button v-if="markerForm.type === 'image'"
                         class="md-icon-button md-raised" style="margin: 15px 0 0 15px;"
                         v-bind:class="{'md-primary': markerForm[markerForm.type] === PIN_BLUE_URL }"
                         v-on:click="markerForm[markerForm.type] = PIN_BLUE_URL">
                <img v-bind:src="PIN_BLUE_URL" width="32px">
              </md-button>
              <md-button v-if="markerForm.type === 'imageLayer'"
                         class="md-icon-button md-raised" style="margin: 15px 0 0 15px;"
                         v-bind:class="{'md-primary': markerForm.imageLayer === TARGET_URL }"
                         v-on:click="markerForm.imageLayer = TARGET_URL">
                <img v-bind:src="TARGET_URL" width="32px">
              </md-button>
              <div class="md-layout-item">
                <md-field>
                  <label>Image URL</label>
                  <md-input type="text" v-model="markerForm[markerForm.type]"/>
                </md-field>
              </div>
            </div>

            <div class="md-layout md-gutter"
                 v-if="markerForm.type === 'polygonRad' || markerForm.type === 'polylineRad'">
              <div class="md-layout-item md-size-33" v-if="markerForm.type === 'polygonRad'">
                <md-field>
                  <label>Fill color</label>
                  <v-swatches shapes="circles" v-model="markerForm.svgStyle.fill">
                    <md-input slot="trigger" :value="markerForm.svgStyle.fill"/>
                  </v-swatches>
                </md-field>
              </div>
              <div class="md-layout-item md-size-33">
                <label class="md-caption">Stroke width</label>
                <vue-slider v-model="markerForm.svgStyle.strokeWidth"
                            :min="markerForm.type === 'polygonRad' ? 0 : 1" :max="10"
                            :drag-on-click="true" :marks="true"/>
              </div>
              <div class="md-layout-item md-size-33">
                <md-field>
                  <label>Stroke color</label>
                  <v-swatches shapes="circles" popover-x="left" v-model="markerForm.svgStyle.stroke">
                    <md-input slot="trigger" :value="markerForm.svgStyle.stroke"/>
                  </v-swatches>
                </md-field>
              </div>
            </div>

            <div class="md-layout md-gutter" v-if="markerForm.type === 'image' || markerForm.type === 'imageLayer' || markerForm.type === 'html'">
              <div class="md-layout-item md-size-25">
                <md-field>
                  <label>Width</label>
                  <md-input type="number" min="0" step="1" v-model="markerForm.width"
                            :required="markerForm.type === 'image' || markerForm.type === 'imageLayer'"/>
                </md-field>
              </div>
              <div class="md-layout-item md-size-25">
                <md-field>
                  <label>Height</label>
                  <md-input type="number" min="0" step="1" v-model="markerForm.height"
                            :required="markerForm.type === 'image' || markerForm.type === 'imageLayer'"/>
                </md-field>
              </div>

              <div class="md-layout-item md-size-25" v-if="markerForm.type === 'imageLayer'">
                <md-field>
                  <label>Orientation</label>
                  <md-select v-model="markerForm.orientation">
                    <md-option value="front">front</md-option>
                    <md-option value="horizontal">horizontal</md-option>
                    <md-option value="vertical-left">vertical-left</md-option>
                    <md-option value="vertical-right">vertical-tight</md-option>
                  </md-select>
                </md-field>
              </div>

              <div class="md-layout-item md-size-25">
                <md-field>
                  <label>Anchor</label>
                  <md-select v-model="markerForm.anchor">
                    <md-option value="top left">top left</md-option>
                    <md-option value="top center">top center</md-option>
                    <md-option value="top right">top right</md-option>
                    <md-option value="center left">center left</md-option>
                    <md-option value="center center">center center</md-option>
                    <md-option value="center right">center right</md-option>
                    <md-option value="bottom left">bottom left</md-option>
                    <md-option value="bottom center">bottom center</md-option>
                    <md-option value="bottom right">bottom right</md-option>
                  </md-select>
                </md-field>
              </div>
            </div>

            <div class="md-layout md-gutter">
              <div class="md-layout-item md-size-75">
                <md-field>
                  <label>Tooltip content</label>
                  <md-input type="text" v-model="markerForm.tooltip.content"/>
                </md-field>
              </div>

              <div class="md-layout-item md-size-25">
                <md-field>
                  <label>Tooltip position</label>
                  <md-select v-model="markerForm.tooltip.position">
                    <md-option value="top left">top left</md-option>
                    <md-option value="top center">top center</md-option>
                    <md-option value="top right">top right</md-option>
                    <md-option value="center left">center left</md-option>
                    <md-option value="center right">center right</md-option>
                    <md-option value="bottom left">bottom left</md-option>
                    <md-option value="bottom center">bottom center</md-option>
                    <md-option value="bottom right">bottom right</md-option>
                  </md-select>
                </md-field>
              </div>
            </div>

            <md-field>
              <label>Panel content</label>
              <md-textarea v-model="markerForm.content"></md-textarea>
            </md-field>
          </md-card-content>

          <md-card-content v-if="!markerForm.type">
            <md-list class="md-dense">
              <md-list-item v-for="marker in markersList"
                            v-on:click="onSelectMarker(marker)">
                <div class="md-list-item-text">
                  {{ marker.id }} <span class="md-caption">{{ marker.type }}</span>
                </div>

                <md-button class="md-icon-button md-list-action">
                  <i class="md-icon md-icon-image" v-html="EDIT_SVG"></i>
                </md-button>
              </md-list-item>
            </md-list>
          </md-card-content>
        </md-card-area>

        <md-card-actions md-alignment="space-between">
          <div>
            <md-button class="" v-if="markersList.length" v-on:click="showMarkersDialog">
              Export
            </md-button>
          </div>

          <div>
            <md-menu md-direction="bottom-end" v-if="!markerForm.type">
              <md-button md-menu-trigger class="md-primary md-raised">New marker</md-button>

              <md-menu-content>
                <md-menu-item v-on:click="newMarker('image')">Image</md-menu-item>
                <md-menu-item v-on:click="newMarker('imageLayer')">Image layer</md-menu-item>
                <md-menu-item v-on:click="newMarker('html')">Text</md-menu-item>
                <md-menu-item v-on:click="newMarker('polygonRad')">Polygon</md-menu-item>
                <md-menu-item v-on:click="newMarker('polylineRad')">Polyline</md-menu-item>
              </md-menu-content>
            </md-menu>

            <md-button class="md-accent" v-if="markerForm.type && !markerForm.saved" v-on:click="cancelMarker">
              Cancel
            </md-button>

            <md-button class="md-primary" v-on:click="completeMarker"
                       v-if="markerForm.type && (markerForm.saved || markerForm.type === 'polygonRad' || markerForm.type === 'polylineRad')">
              Done
            </md-button>

            <md-button class="md-accent" v-if="markerForm.type && markerForm.saved" v-on:click="deleteMarker">
              Delete
            </md-button>
          </div>
        </md-card-actions>
      </md-card>
    </div>

    <div id="viewer"></div>

    <md-dialog :md-active.sync="markersDialog">
      <md-dialog-content>
        <pre class="language-json"><code>{{ markersDialog }}</code></pre>
      </md-dialog-content>

      <md-dialog-actions>
        <md-button class="md-primary" v-if="CLIPBOARD_AVAILABLE" v-on:click="copyMarkersList">Copy</md-button>
        <md-button class="md-primary" v-on:click="markersDialog = null">Close</md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script>
  const { cloneDeep, omit, debounce, isEqual, pickBy, range } = require('lodash');
  import EDIT_SVG from '!raw-loader!./edit.svg';

  const TEMP_ID = 'marker-temp';

  export default {
    data: () => ({
      markers         : null,
      file            : null,
      imageData       : null,
      sphereCorrection: {
        pan : 0,
        tilt: 0,
        roll: 0
      },
      options         : {
        ...omit(cloneDeep(PhotoSphereViewer.DEFAULTS), ['panorama', 'panoData', 'sphereCorrection', 'container', 'plugins', 'navbar', 'loadingImg']),
      },
      panoData        : {
        fullWidth    : null,
        fullHeight   : null,
        croppedWidth : null,
        croppedHeight: null,
        croppedX     : null,
        croppedY     : null,
      },
      navbar          : [
        {
          code   : 'autorotate',
          label  : PhotoSphereViewer.DEFAULTS.lang.autorotate,
          enabled: true
        },
        {
          code   : 'zoom',
          label  : PhotoSphereViewer.DEFAULTS.lang.zoom,
          enabled: true
        },
        {
          code   : 'move',
          label  : PhotoSphereViewer.DEFAULTS.lang.move,
          enabled: true
        },
        {
          code   : 'download',
          label  : PhotoSphereViewer.DEFAULTS.lang.download,
          enabled: true
        },
        {
          code   : 'caption',
          label  : 'Caption',
          enabled: true
        },
        {
          code   : 'fullscreen',
          label  : PhotoSphereViewer.DEFAULTS.lang.fullscreen,
          enabled: true
        },
      ],
      editMarkers     : false,
      markersDialog   : null,
      markerForm      : {
        saved      : false,
        id         : null,
        type       : null,
        longitude  : null,
        latitude   : null,
        image      : null,
        imageLayer : null,
        html       : null,
        polygonRad : null,
        polylineRad: null,
        width      : null,
        height     : null,
        orientation: null,
        anchor     : null,
        listContent: null,
        content    : null,
        tooltip    : {
          content : null,
          position: null,
        },
        style      : {
          fontSize: null,
          color   : null,
        },
        svgStyle   : {
          fill       : null,
          stroke     : null,
          strokeWidth: null,
        },
      },
      markersList     : [],
    }),

    beforeDestroy() {
      this.psv.destroy();
    },

    created() {
      this.EDIT_SVG = EDIT_SVG;
      this.CLIPBOARD_AVAILABLE = !!window.navigator.clipboard;
      this.PIN_RED_URL = 'https://photo-sphere-viewer-data.netlify.app/assets/pictos/pin-red.png';
      this.PIN_BLUE_URL = 'https://photo-sphere-viewer-data.netlify.app/assets/pictos/pin-blue.png';
      this.TARGET_URL = 'https://photo-sphere-viewer-data.netlify.app/assets/pictos/target.png';
      this.FONT_SIZES = range(10, 31).map(i => `${i}px`);
      this.FONT_SIZES_2 = range(10, 31, 5).map(i => `${i}px`);
    },

    mounted() {
      const markersJs = document.createElement('script');
      markersJs.setAttribute('src', 'https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4/dist/plugins/markers.js');
      document.head.appendChild(markersJs);

      const markersCss = document.createElement('link');
      markersCss.setAttribute('rel', 'stylesheet');
      markersCss.setAttribute('href', 'https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4/dist/plugins/markers.css');
      document.head.appendChild(markersCss);

      this.oldOptions = cloneDeep(this.options);

      this._applyOptions = debounce(() => this.applyOptions(), 200);

      markersJs.onload = () => {
        this.psv = new PhotoSphereViewer.Viewer({
          container : 'viewer',
          loadingImg: 'https://photo-sphere-viewer-data.netlify.app/assets/loader.gif',
          plugins   : [
            [PhotoSphereViewer.MarkersPlugin, {}],
          ],
        });

        this.applyNavbar();

        this.markers = this.psv.getPlugin(PhotoSphereViewer.MarkersPlugin);

        this.psv.on('click', (e, data) => this.onClick(data));
        this.psv.on('dblclick', (e, data) => this.onDblClick(data));
        this.markers.on('select-marker', (e, marker) => this.onSelectMarker(marker));
        this.markers.on('set-markers', (e, markers) => {
          this.markersList = cloneDeep(markers.filter(m => m.id !== TEMP_ID));
        });

        this.loadPsv();
      };
    },

    watch: {
      options         : {
        deep: true,
        handler() {
          this._applyOptions();
        },
      },
      sphereCorrection: {
        deep: true,
        handler() {
          this.psv.setOption('sphereCorrection', {
            pan : this.sphereCorrection.pan / 180 * Math.PI,
            tilt: this.sphereCorrection.tilt / 180 * Math.PI,
            roll: this.sphereCorrection.roll / 180 * Math.PI,
          });
        },
      },
      navbar          : {
        deep: true,
        handler() {
          this.applyNavbar();
        },
      },
      markerForm      : {
        deep: true,
        handler() {
          this.updateMarker();
        },
      },
    },

    methods: {
      loadFile(files) {
        if (files && files[0]) {
          const reader = new FileReader();

          reader.onload = (event) => {
            const image = new Image();

            image.onload = () => {
              this.imageData = image.src;
              this.computePanoData(image.width, image.height);
              this.loadPsv();
              this.options.caption = null;
            };

            image.src = event.target.result;
          };

          reader.readAsDataURL(files[0]);
        }
        else {
          this.imageData = null;
          this.loadPsv();
        }
      },

      computePanoData(width, height) {
        const fullWidth = Math.max(width, height * 2);
        const fullHeight = Math.round(fullWidth / 2);
        const croppedX = Math.round((fullWidth - width) / 2);
        const croppedY = Math.round((fullHeight - height) / 2);

        this.panoData.fullWidth = fullWidth;
        this.panoData.fullHeight = fullHeight;
        this.panoData.croppedWidth = width;
        this.panoData.croppedHeight = height;
        this.panoData.croppedX = croppedX;
        this.panoData.croppedY = croppedY;
      },

      loadDefaultFile() {
        this.imageData = 'https://photo-sphere-viewer-data.netlify.app/assets/sphere.jpg';
        this.computePanoData(6000, 3000);
        this.file = null;
        this.loadPsv();
        this.options.caption = 'Parc national du Mercantour <b>&copy; Damien Sorel</b>';
      },

      loadPsv() {
        if (this.imageData) {
          this.psv.overlay.hide();
          this.psv.setPanorama(this.imageData, { panoData: this.panoData });
        }
        else {
          this.psv.overlay.show({
            text       : 'Please select a panorama file',
            dissmisable: false,
          });
        }
      },

      applyOptions() {
        try {
          if (this.options.defaultZoomLvl !== this.oldOptions.defaultZoomLvl) {
            this.psv.zoom(this.options.defaultZoomLvl);
          }
          else if (this.options.defaultLong !== this.oldOptions.defaultLong || this.options.defaultLat !== this.oldOptions.defaultLat) {
            this.psv.rotate({
              longitude: this.options.defaultLong,
              latitude : this.options.defaultLat,
            });
          }
          else {
            Object.keys(this.options)
              .some(optName => {
                if (!isEqual(this.options[optName], this.oldOptions[optName])) {
                  if (optName === 'autorotateIdle') {
                    this.psv.setOption('autorotateDelay',  this.options.autorotateIdle ? 2000 : null);
                  }
                  this.psv.setOption(optName, this.options[optName]);
                  return true;
                }
              });
          }
        } catch (e) {
          // ignore parsing errors
        }
        this.oldOptions = cloneDeep(this.options);
      },

      applyNavbar() {
        this.psv.setOption('navbar', this.navbar.filter(i => i.enabled).map(i => i.code));
      },

      newMarker(type) {
        this.cancelMarker();
        this.markerForm.id = 'marker-' + Math.random().toString(36).slice(2);
        this.markerForm.type = type;
        this.markerForm.orientation = 'front';
        this.markerForm.anchor = 'center center';
        this.markerForm.tooltip.position = 'top center';

        switch (type) {
          case 'image':
            this.markerForm.image = this.PIN_RED_URL;
            this.markerForm.width = 32;
            this.markerForm.height = 32;
            this.markerForm.anchor = 'bottom center';
            break;
          case 'imageLayer':
            this.markerForm.imageLayer = this.TARGET_URL;
            this.markerForm.width = 120;
            this.markerForm.height = 120;
            break;
          case 'html':
            this.markerForm.html = 'Test content';
            this.markerForm.style.fontSize = '15px';
            this.markerForm.style.color = '#222F3D';
            break;
          case 'polygonRad':
            this.markerForm.polygonRad = [];
            this.markerForm.svgStyle.fill = '#E84B3C';
            this.markerForm.svgStyle.strokeWidth = 2;
            this.markerForm.svgStyle.stroke = '#C0382B';
            break;
          case 'polylineRad':
            this.markerForm.polylineRad = [];
            this.markerForm.svgStyle.strokeWidth = 5;
            this.markerForm.svgStyle.stroke = '#27AF60';
            break;
        }
      },

      cancelMarker() {
        if (!this.markerForm.saved &&
          (this.markerForm.type === 'polygonRad' || this.markerForm.type === 'polylineRad') &&
          this.markerForm[this.markerForm.type].length > 0) {
          this.markers.removeMarker(TEMP_ID);
        }

        Object.keys(this.markerForm)
          .forEach(key => {
            if (key === 'tooltip' || key === 'style' || key === 'svgStyle') {
              Object.keys(this.markerForm[key])
                .forEach(key2 => this.markerForm[key][key2] = null);
            }
            else {
              this.markerForm[key] = null;
            }
          });
        this.markerForm.saved = false;
      },

      deleteMarker() {
        if (this.markerForm.saved) {
          this.markers.removeMarker(this.markerForm.id);
        }
        this.cancelMarker();
      },

      completeMarker() {
        if (!this.markerForm.saved &&
          (this.markerForm.type === 'polygonRad' || this.markerForm.type === 'polylineRad') &&
          this.markerForm[this.markerForm.type].length >= (this.markerForm.type === 'polygonRad' ? 3 : 2)) {
          this.markers.addMarker(cloneDeep(this.markerForm));
        }

        this.cancelMarker();
      },

      onClick(data) {
        if (!this.editMarkers || !this.markerForm.type) {
          return;
        }

        const longitude = Math.round(data.longitude * 1000) / 1000;
        const latitude = Math.round(data.latitude * 1000) / 1000;
        Object.assign(this.markerForm, { longitude, latitude });

        switch (this.markerForm.type) {
          case 'image':
          case 'imageLayer':
          case 'html':
            if (!this.markerForm.saved) {
              this.markers.addMarker({
                ...cloneDeep(this.markerForm),
                longitude,
                latitude,
              });
              this.cancelMarker();
            }
            else {
              this.markers.updateMarker({
                id: this.markerForm.id,
                longitude,
                latitude,
              });
            }
            break;

          case 'polygonRad':
            if (this.markerForm.saved) {
              return;
            }
            this.markerForm.polygonRad.push([longitude, latitude]);
            switch (this.markerForm.polygonRad.length) {
              case 1:
                this.markers.addMarker({
                  id      : TEMP_ID,
                  hideList: true,
                  longitude,
                  latitude,
                  anchor  : 'center center',
                  circle  : Math.max(1, this.markerForm.svgStyle.strokeWidth / 2),
                  svgStyle: {
                    fill: this.markerForm.svgStyle.strokeWidth ? this.markerForm.svgStyle.stroke : this.markerForm.svgStyle.fill,
                  },
                });
                break;
              case 2:
                this.markers.removeMarker(TEMP_ID, false);
                this.markers.addMarker({
                  id         : TEMP_ID,
                  hideList   : true,
                  polylineRad: this.markerForm.polygonRad,
                  svgStyle   : {
                    strokeWidth: Math.max(1, this.markerForm.svgStyle.strokeWidth),
                    stroke     : this.markerForm.svgStyle.strokeWidth ? this.markerForm.svgStyle.stroke : this.markerForm.svgStyle.fill,
                  },
                });
                break;
              default:
                this.markers.removeMarker(TEMP_ID, false);
                this.markers.addMarker({
                  ...cloneDeep(this.markerForm),
                  id      : TEMP_ID,
                  hideList: true,
                });
                break;
            }
            break;

          case 'polylineRad':
            if (this.markerForm.saved) {
              return;
            }
            this.markerForm.polylineRad.push([longitude, latitude]);
            switch (this.markerForm.polylineRad.length) {
              case 1:
                this.markers.addMarker({
                  id      : TEMP_ID,
                  hideList: true,
                  longitude,
                  latitude,
                  anchor  : 'center center',
                  circle  : Math.max(1, this.markerForm.svgStyle.strokeWidth / 2),
                  svgStyle: {
                    fill: this.markerForm.svgStyle.stroke,
                  },
                });
                break;
              default:
                this.markers.removeMarker(TEMP_ID, false);
                this.markers.addMarker({
                  ...cloneDeep(this.markerForm),
                  id      : TEMP_ID,
                  hideList: true,
                });
                break;
            }
            break;
        }
      },

      onDblClick() {
        if (!this.editMarkers || !this.markerForm.type) {
          return;
        }

        this.markerForm[this.markerForm.type].pop();
        this.completeMarker();
      },

      onSelectMarker(marker) {
        if (marker.id === this.markerForm.id) {
          return;
        }

        this.cancelMarker();
        Object.assign(this.markerForm, cloneDeep(marker.config));
        this.markerForm.saved = true;
        this.markerForm.type = marker.type;
      },

      updateMarker() {
        if (this.markerForm.saved) {
          this.markers.updateMarker(cloneDeep(this.markerForm));
        }
        else if ((this.markerForm.type === 'polygonRad' || this.markerForm.type === 'polylineRad') &&
          this.markerForm[this.markerForm.type].length >= (this.markerForm.type === 'polygonRad' ? 3 : 2)) {
          this.markers.updateMarker({
            ...cloneDeep(this.markerForm),
            id      : TEMP_ID,
            hideList: true,
          });
        }
      },

      showMarkersDialog() {
        const content = this.markersList
          .filter(marker => marker.id !== TEMP_ID)
          .map(marker => {
            const m = {};
            m.id = marker.id;
            m[marker.type] = marker.config[marker.type];
            m.longitude = marker.config.longitude;
            m.latitude = marker.config.latitude;
            if (marker.config.width) {
              m.width = marker.config.width;
            }
            if (marker.config.height) {
              m.height = marker.config.height;
            }
            if (marker.config.anchor !== 'center center') {
              m.anchor = marker.config.anchor;
            }
            if (marker.config.orientation !== 'front') {
              m.orientation = marker.config.orientation;
            }
            if (marker.config.tooltip.content) {
              m.tooltip = marker.config.tooltip;
            }
            m.style = pickBy(marker.config.style, v => !!v);
            if (!Object.entries(m.style).length) {
              delete m.style;
            }
            m.svgStyle = pickBy(marker.config.svgStyle, v => !!v);
            if (!m.svgStyle.strokeWidth) {
              delete m.svgStyle.stroke;
            }
            if (!Object.entries(m.svgStyle).length) {
              delete m.svgStyle;
            }
            return m;
          });

        this.markersDialog = 'markers: ' + JSON.stringify(content, (k, v) => {
          if (k === 'polylineRad' || k === 'polygonRad') {
            return JSON.stringify(v);
          }
          else {
            return v;
          }
        }, 2)
          .replace(/\"\[/g, '[')
          .replace(/\]\"/g, ']');
      },

      copyMarkersList() {
        window.navigator.clipboard.writeText(this.markersDialog);
        this.markersDialog = null;
      }
    },
  };
</script>
