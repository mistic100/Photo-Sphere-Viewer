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
    box-shadow: none;
}

.playground-container .md-title {
    margin: 2em 0 0 0;
}
</style>

<template>
    <div class="playground-container">
        <div id="form" v-if="Viewer">
            <md-card v-show="!editMarkers">
                <md-card-area>
                    <md-tabs md-elevation="1" class="md-primary">
                        <md-tab md-label="Panorama">
                            <div class="md-layout md-gutter">
                                <md-button
                                    class="md-dense md-raised"
                                    style="margin: 20px 0 0 20px; width: 150px"
                                    v-on:click="loadDefaultFile"
                                >
                                    Use demo file
                                </md-button>
                                <div class="md-layout-item">
                                    <md-field>
                                        <label>Panorama image</label>
                                        <md-file v-model="file" accept="image/*" v-on:md-change="loadFile" />
                                    </md-field>
                                </div>
                            </div>

                            <div class="custom-block danger" v-if="error">
                                <p class="custom-block-title">This image cannot be loaded</p>
                                <p>
                                    An undefined error occurred while loading the panorama. If your image is very big
                                    and you are using Firefox please try with Chrome, as Firefox has trouble loading
                                    large base64 images.
                                </p>
                            </div>

                            <md-field md-clearable>
                                <label>Caption</label>
                                <md-input name="caption" v-model="options.caption" :disabled="!imageData" />
                            </md-field>

                            <md-field>
                                <label>Description</label>
                                <md-textarea v-model="options.description"></md-textarea>
                            </md-field>
                        </md-tab>

                        <md-tab md-label="Standard options">
                            <div class="md-layout md-gutter">
                                <div class="md-layout-item md-size-33">
                                    <md-field>
                                        <label>Default yaw</label>
                                        <md-input v-model="options.defaultYaw" :disabled="!imageData" />
                                    </md-field>
                                </div>
                                <div class="md-layout-item md-size-33">
                                    <md-field>
                                        <label>Default pitch</label>
                                        <md-input v-model="options.defaultPitch" :disabled="!imageData" />
                                    </md-field>
                                </div>
                            </div>

                            <div class="md-layout md-gutter">
                                <div class="md-layout-item md-size-33">
                                    <md-field>
                                        <label>Default zoom level</label>
                                        <md-input
                                            type="number"
                                            min="0"
                                            max="100"
                                            v-model="options.defaultZoomLvl"
                                            :disabled="!imageData"
                                        />
                                    </md-field>
                                </div>
                                <div class="md-layout-item md-size-33">
                                    <md-field>
                                        <label>Min FOV</label>
                                        <md-input
                                            type="number"
                                            min="1"
                                            max="179"
                                            v-model="options.minFov"
                                            :disabled="!imageData"
                                        />
                                    </md-field>
                                </div>
                                <div class="md-layout-item md-size-33">
                                    <md-field>
                                        <label>Max FOV</label>
                                        <md-input
                                            type="number"
                                            min="1"
                                            max="179"
                                            v-model="options.maxFov"
                                            :disabled="!imageData"
                                        />
                                    </md-field>
                                </div>
                            </div>

                            <div class="md-layout md-gutter">
                                <div class="md-layout-item md-size-33 checkbox-field">
                                    <md-checkbox class="md-primary" v-model="options.fisheye" :disabled="!imageData">
                                        Fisheye
                                    </md-checkbox>
                                </div>
                                <div class="md-layout-item md-size-33 checkbox-field">
                                    <md-checkbox class="md-primary" v-model="options.mousewheel" :disabled="!imageData">
                                        Mousewheel
                                    </md-checkbox>
                                </div>
                                <div class="md-layout-item md-size-33 checkbox-field">
                                    <md-checkbox
                                        class="md-primary"
                                        v-model="options.mousewheelCtrlKey"
                                        :disabled="!imageData"
                                    >
                                        Hold Ctrl to zoom
                                    </md-checkbox>
                                </div>
                                <div class="md-layout-item md-size-33 checkbox-field">
                                    <md-checkbox class="md-primary" v-model="options.mousemove" :disabled="!imageData">
                                        Mouse move
                                    </md-checkbox>
                                </div>
                                <div class="md-layout-item md-size-33 checkbox-field">
                                    <md-checkbox
                                        class="md-primary"
                                        v-model="options.touchmoveTwoFingers"
                                        :disabled="!imageData"
                                    >
                                        Two fingers move
                                    </md-checkbox>
                                </div>
                            </div>
                        </md-tab>

                        <md-tab md-label="Advanced options">
                            <div class="md-layout md-gutter" style="margin-bottom: 40px">
                                <div class="md-layout-item md-size-33">
                                    <label class="md-caption">Correction, pan</label>
                                    <vue-slider
                                        v-model="sphereCorrection.pan"
                                        :min="-180"
                                        :max="180"
                                        :marks="[-180, -90, 0, 90, 180]"
                                        :drag-on-click="true"
                                        :disabled="!imageData"
                                    />
                                </div>
                                <div class="md-layout-item md-size-33">
                                    <label class="md-caption">Correction, tilt</label>
                                    <vue-slider
                                        v-model="sphereCorrection.tilt"
                                        :min="-90"
                                        :max="90"
                                        :marks="[-90, 0, 90]"
                                        :drag-on-click="true"
                                        :disabled="!imageData"
                                    />
                                </div>
                                <div class="md-layout-item md-size-33">
                                    <label class="md-caption">Correction, roll</label>
                                    <vue-slider
                                        v-model="sphereCorrection.roll"
                                        :min="-180"
                                        :max="180"
                                        :marks="[-180, -90, 0, 90, 180]"
                                        :drag-on-click="true"
                                        :disabled="!imageData"
                                    />
                                </div>
                            </div>

                            <div class="md-layout md-gutter">
                                <div class="md-layout-item md-size-33">
                                    <md-field>
                                        <label>Move speed</label>
                                        <md-input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            v-model="options.moveSpeed"
                                            :disabled="!imageData"
                                        />
                                    </md-field>
                                </div>
                                <div class="md-layout-item md-size-33">
                                    <md-field>
                                        <label>Zoom speed</label>
                                        <md-input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            v-model="options.zoomSpeed"
                                            :disabled="!imageData"
                                        />
                                    </md-field>
                                </div>
                            </div>

                            <div class="md-layout md-gutter">
                                <div class="md-layout-item md-size-33 checkbox-field">
                                    <md-checkbox
                                        class="md-primary"
                                        v-model="options.moveInertia"
                                        :disabled="!imageData"
                                    >
                                        Move inertia
                                    </md-checkbox>
                                </div>
                                <md-field class="md-layout-item md-size-33">
                                    <label>Canvas background</label>
                                    <v-swatches
                                        shapes="circles"
                                        swatch-size="32"
                                        row-length="8"
                                        v-model="adapterOptions.backgroundColor"
                                        :disabled="!imageData"
                                    >
                                        <md-input
                                            slot="trigger"
                                            :value="adapterOptions.backgroundColor"
                                            :disabled="!imageData"
                                        />
                                    </v-swatches>
                                </md-field>
                                <div class="md-layout-item md-size-33">
                                    <md-checkbox
                                        class="md-primary"
                                        v-model="adapterOptions.interpolateBackground"
                                        :disabled="!imageData"
                                    >
                                        Interpolate background
                                    </md-checkbox>
                                </div>
                            </div>
                        </md-tab>

                        <md-tab md-label="Navbar config">
                            <div class="md-layout md-gutter">
                                <div class="md-layout-item md-size-33" v-for="item in navbar">
                                    <md-checkbox class="md-primary" v-model="item.enabled" :disabled="!imageData"
                                        >{{ item.label }}
                                    </md-checkbox>
                                </div>
                            </div>
                        </md-tab>
                    </md-tabs>
                </md-card-area>

                <md-card-actions md-alignment="space-between">
                    <md-button class="md-accent" v-on:click="reset">Reset</md-button>
                    <md-button class="md-primary md-raised" :disabled="!imageData" v-on:click="editMarkers = true">
                        Add markers
                    </md-button>
                </md-card-actions>
            </md-card>

            <md-card v-show="editMarkers">
                <md-card-header>
                    <div class="md-title" v-if="!markerForm.type">Markers</div>
                    <div class="md-title" v-if="markerForm.type">
                        {{ markerForm.saved ? 'Edit' : 'New' }} <code>{{ markerForm.type }}</code> marker
                    </div>
                    <div class="md-subhead">
                        <span
                            v-if="
                                markerForm.type === 'image' ||
                                markerForm.type === 'imageLayer' ||
                                markerForm.type === 'html'
                            "
                        >
                            Click on the viewer the {{ markerForm.saved ? 'move' : 'place' }} the marker.
                        </span>
                        <span v-else-if="markerForm.type === 'polygon' || markerForm.type === 'polyline'">
                            {{
                                markerForm.saved
                                    ? 'The marker position cannot be edited.'
                                    : 'Click on the viewer to add a point. Double-click to complete the marker.'
                            }}
                        </span>
                        <span v-else-if="!markerForm.type && markersList.length > 0">
                            Click on a marker to edit its properties.
                        </span>
                        <span v-else> No markers yet. </span>
                    </div>
                </md-card-header>

                <md-card-area>
                    <md-card-content v-if="markerForm.type">
                        <div class="md-layout md-gutter">
                            <div class="md-layout-item md-size-33">
                                <md-field>
                                    <label>Id</label>
                                    <md-input type="text" v-model="markerForm.id" :disabled="markerForm.saved" />
                                </md-field>
                            </div>
                            <div class="md-layout-item md-size-66">
                                <md-field>
                                    <label>Name</label>
                                    <md-input type="text" v-model="markerForm.listContent" />
                                </md-field>
                            </div>
                        </div>

                        <div class="md-layout md-gutter" v-if="markerForm.type === 'html'">
                            <div class="md-layout-item md-size-33">
                                <md-field>
                                    <label>Content</label>
                                    <md-input type="text" v-model="markerForm.html" />
                                </md-field>
                            </div>
                            <div class="md-layout-item md-size-33">
                                <label class="md-caption">Font size</label>
                                <vue-slider
                                    v-model="markerForm.style.fontSize"
                                    :data="FONT_SIZES"
                                    :drag-on-click="true"
                                    :marks="FONT_SIZES_2"
                                />
                            </div>
                            <div class="md-layout-item md-size-33">
                                <md-field>
                                    <label>Text color</label>
                                    <v-swatches shapes="circles" popover-x="left" v-model="markerForm.style.color">
                                        <md-input slot="trigger" :value="markerForm.style.color" />
                                    </v-swatches>
                                </md-field>
                            </div>
                        </div>

                        <div
                            class="md-layout md-gutter"
                            v-if="markerForm.type === 'image' || markerForm.type === 'imageLayer'"
                        >
                            <md-button
                                v-if="markerForm.type === 'image'"
                                class="md-icon-button md-raised"
                                style="margin: 15px 0 0 20px"
                                v-bind:class="{ 'md-primary': markerForm.image === PIN_RED_URL }"
                                v-on:click="markerForm.image = PIN_RED_URL"
                            >
                                <img v-bind:src="PIN_RED_URL" width="32px" />
                            </md-button>
                            <md-button
                                v-if="markerForm.type === 'image'"
                                class="md-icon-button md-raised"
                                style="margin: 15px 0 0 15px"
                                v-bind:class="{ 'md-primary': markerForm[markerForm.type] === PIN_BLUE_URL }"
                                v-on:click="markerForm[markerForm.type] = PIN_BLUE_URL"
                            >
                                <img v-bind:src="PIN_BLUE_URL" width="32px" />
                            </md-button>
                            <md-button
                                v-if="markerForm.type === 'imageLayer'"
                                class="md-icon-button md-raised"
                                style="margin: 15px 0 0 15px"
                                v-bind:class="{ 'md-primary': markerForm.imageLayer === TARGET_URL }"
                                v-on:click="markerForm.imageLayer = TARGET_URL"
                            >
                                <img v-bind:src="TARGET_URL" width="32px" />
                            </md-button>
                            <div class="md-layout-item">
                                <md-field>
                                    <label>Image URL</label>
                                    <md-input type="text" v-model="markerForm[markerForm.type]" />
                                </md-field>
                            </div>
                        </div>

                        <div
                            class="md-layout md-gutter"
                            v-if="markerForm.type === 'polygon' || markerForm.type === 'polyline'"
                        >
                            <div class="md-layout-item md-size-25" v-if="markerForm.type === 'polygon'">
                                <md-field>
                                    <label>Fill color</label>
                                    <v-swatches shapes="circles" v-model="markerForm.svgStyle.fill">
                                        <md-input slot="trigger" :value="markerForm.svgStyle.fill" />
                                    </v-swatches>
                                </md-field>
                            </div>
                            <div class="md-layout-item md-size-25" v-if="markerForm.type === 'polygon'">
                                <label class="md-caption">Fill opacity</label>
                                <vue-slider
                                    v-model="markerForm.svgStyle.fillOpacity"
                                    :min="0"
                                    :max="1"
                                    :interval="0.1"
                                    :drag-on-click="true"
                                    :marks="[0, 0.2, 0.4, 0.6, 0.8, 1]"
                                />
                            </div>
                            <div class="md-layout-item md-size-25">
                                <md-field>
                                    <label>Stroke color</label>
                                    <v-swatches shapes="circles" popover-x="left" v-model="markerForm.svgStyle.stroke">
                                        <md-input slot="trigger" :value="markerForm.svgStyle.stroke" />
                                    </v-swatches>
                                </md-field>
                            </div>
                            <div class="md-layout-item md-size-25">
                                <label class="md-caption">Stroke width</label>
                                <vue-slider
                                    v-model="markerForm.svgStyle.strokeWidth"
                                    :min="markerForm.type === 'polygon' ? 0 : 1"
                                    :max="10"
                                    :drag-on-click="true"
                                    :marks="true"
                                />
                            </div>
                        </div>

                        <div
                            class="md-layout md-gutter"
                            v-if="
                                markerForm.type === 'image' ||
                                markerForm.type === 'imageLayer' ||
                                markerForm.type === 'html'
                            "
                        >
                            <div class="md-layout-item md-size-25">
                                <md-field>
                                    <label>Width</label>
                                    <md-input
                                        type="number"
                                        min="0"
                                        step="1"
                                        v-model="markerForm.size.width"
                                        :required="markerForm.type === 'image' || markerForm.type === 'imageLayer'"
                                    />
                                </md-field>
                            </div>
                            <div class="md-layout-item md-size-25">
                                <md-field>
                                    <label>Height</label>
                                    <md-input
                                        type="number"
                                        min="0"
                                        step="1"
                                        v-model="markerForm.size.height"
                                        :required="markerForm.type === 'image' || markerForm.type === 'imageLayer'"
                                    />
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
                                    <md-input type="text" v-model="markerForm.tooltip.content" />
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
                            <md-list-item v-for="marker in markersList" v-on:click="onSelectMarker(marker)">
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
                        <md-button v-on:click="back"> Back </md-button>
                    </div>

                    <div>
                        <md-button v-if="markersList.length && !markerForm.type" v-on:click="showMarkersDialog">
                            Export
                        </md-button>

                        <md-menu md-direction="bottom-end" v-if="!markerForm.type">
                            <md-button md-menu-trigger class="md-primary md-raised">New marker</md-button>

                            <md-menu-content>
                                <md-menu-item v-on:click="newMarker('image')">Image</md-menu-item>
                                <md-menu-item v-on:click="newMarker('imageLayer')">Image layer</md-menu-item>
                                <md-menu-item v-on:click="newMarker('html')">Text</md-menu-item>
                                <md-menu-item v-on:click="newMarker('polygon')">Polygon</md-menu-item>
                                <md-menu-item v-on:click="newMarker('polyline')">Polyline</md-menu-item>
                            </md-menu-content>
                        </md-menu>

                        <md-button
                            class="md-primary"
                            v-on:click="completeMarker"
                            v-if="
                                markerForm.type &&
                                (markerForm.saved || markerForm.type === 'polygon' || markerForm.type === 'polyline')
                            "
                        >
                            Done
                        </md-button>

                        <md-button
                            class="md-accent"
                            v-if="markerForm.type && markerForm.saved"
                            v-on:click="deleteMarker"
                        >
                            Delete
                        </md-button>
                    </div>
                </md-card-actions>
            </md-card>
        </div>

        <div id="viewer"></div>

        <md-dialog :md-active.sync="markersDialog">
            <md-dialog-content>
                <pre class="language-json"><code>{{ markersDialogContent }}</code></pre>
            </md-dialog-content>

            <md-dialog-actions>
                <md-button class="md-primary" v-if="CLIPBOARD_AVAILABLE" v-on:click="copyMarkersList">Copy</md-button>
                <md-button class="md-primary" v-on:click="markersDialog = false">Close</md-button>
            </md-dialog-actions>
        </md-dialog>
    </div>
</template>

<script>
const { cloneDeep, omit, debounce, isEqual, pickBy, range } = require('lodash');
import EDIT_SVG from '!raw-loader!./edit.svg';

const DEFAULT_IMAGE = 'https://photo-sphere-viewer-data.netlify.app/assets/sphere.jpg';

const TEMP_ID = 'marker-temp';

export default {
    data: () => ({
        Viewer: null,
        EquirectangularAdapter: null,
        MarkersPlugin: null,
        DEFAULT_OPTIONS: null,
        DEFAULT_ADAPTER_OPTIONS: null,
        DEFAULT_SPHERE_CORRECTION: null,
        DEFAULT_NAVBAR: null,

        viewer: null,
        markers: null,
        file: null,
        imageData: null,
        error: false,
        sphereCorrection: {},
        options: {},
        navbar: [],
        adapterOptions: {},
        panoData: {
            fullWidth: null,
            fullHeight: null,
            croppedWidth: null,
            croppedHeight: null,
            croppedX: null,
            croppedY: null,
        },
        editMarkers: false,
        markersDialog: null,
        markersDialogContent: null,
        markerForm: {
            saved: false,
            id: null,
            type: null,
            position: { yaw: null, pitch: null },
            image: null,
            imageLayer: null,
            html: null,
            polygon: null,
            polyline: null,
            size: { width: null, height: null },
            orientation: null,
            anchor: null,
            listContent: null,
            content: null,
            tooltip: {
                content: null,
                position: null,
            },
            style: {
                fontSize: null,
                color: null,
            },
            svgStyle: {
                fill: null,
                fillOpacity: null,
                stroke: null,
                strokeWidth: null,
            },
        },
        markersList: [],
    }),

    beforeDestroy() {
        this.viewer?.destroy();
    },

    created() {
        this.EDIT_SVG = EDIT_SVG;
        this.CLIPBOARD_AVAILABLE = !!window.navigator.clipboard;
        this.PIN_RED_URL = 'https://photo-sphere-viewer-data.netlify.app/assets/pictos/pin-red.png';
        this.PIN_BLUE_URL = 'https://photo-sphere-viewer-data.netlify.app/assets/pictos/pin-blue.png';
        this.TARGET_URL = 'https://photo-sphere-viewer-data.netlify.app/assets/pictos/target.png';
        this.FONT_SIZES = range(10, 31).map((i) => `${i}px`);
        this.FONT_SIZES_2 = range(10, 31, 5).map((i) => `${i}px`);
    },

    mounted() {
        // ugly hack to load PSV from jsdelivr as an ES module
        window.__viewer = this;

        window.__s = document.createElement('script');
        __s.type = 'module';
        __s.text = `
import { Viewer, DEFAULTS, EquirectangularAdapter } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
__viewer.init({ Viewer, DEFAULTS, EquirectangularAdapter, MarkersPlugin });
__s.remove();
`;
        document.body.appendChild(__s);
    },

    watch: {
        options: {
            deep: true,
            handler() {
                this._applyOptions();
            },
        },
        adapterOptions: {
            deep: true,
            handler() {
                this.applyAdapterOptions();
            },
        },
        sphereCorrection: {
            deep: true,
            handler() {
                this.applySphereCorrection();
            },
        },
        navbar: {
            deep: true,
            handler() {
                this.applyNavbar();
            },
        },
        markerForm: {
            deep: true,
            handler() {
                this.updateMarker();
            },
        },
    },

    methods: {
        init({ Viewer, DEFAULTS, EquirectangularAdapter, MarkersPlugin }) {
            this.Viewer = Viewer;
            this.EquirectangularAdapter = EquirectangularAdapter;
            this.MarkersPlugin = MarkersPlugin;

            this.DEFAULT_OPTIONS = omit(DEFAULTS, [
                'panorama',
                'panoData',
                'sphereCorrection',
                'container',
                'plugins',
                'navbar',
                'loadingImg',
            ]);
            this.DEFAULT_ADAPTER_OPTIONS = { backgroundColor: '#000', interpolateBackground: true };
            this.DEFAULT_SPHERE_CORRECTION = { pan: 0, tilt: 0, roll: 0 };
            this.DEFAULT_NAVBAR = [
                {
                    code: 'zoom',
                    label: DEFAULTS.lang.zoom,
                    enabled: true,
                },
                {
                    code: 'move',
                    label: 'Move',
                    enabled: true,
                },
                {
                    code: 'download',
                    label: DEFAULTS.lang.download,
                    enabled: true,
                },
                {
                    code: 'caption',
                    label: 'Caption',
                    enabled: true,
                },
                {
                    code: 'fullscreen',
                    label: DEFAULTS.lang.fullscreen,
                    enabled: true,
                },
            ];

            this.sphereCorrection = cloneDeep(this.DEFAULT_SPHERE_CORRECTION);
            this.options = cloneDeep(this.DEFAULT_OPTIONS);
            this.adapterOptions = cloneDeep(this.DEFAULT_ADAPTER_OPTIONS);
            this.navbar = cloneDeep(this.DEFAULT_NAVBAR);
            this.oldOptions = cloneDeep(this.options);

            this._applyOptions = debounce(() => this.applyOptions(), 200);

            this.initViewer();
        },
        initViewer() {
            this.viewer = new this.Viewer({
                container: 'viewer',
                loadingImg: 'https://photo-sphere-viewer-data.netlify.app/assets/loader.gif',
                adapter: [this.EquirectangularAdapter, this.adapterOptions],
                plugins: [this.MarkersPlugin],
            });

            this.applyNavbar();

            this.markers = this.viewer.getPlugin(this.MarkersPlugin);

            this.viewer.addEventListener('click', ({ data }) => this.onClick(data));
            this.viewer.addEventListener('dblclick', ({ data }) => this.onDblClick(data));
            this.markers.addEventListener('select-marker', ({ marker }) => this.onSelectMarker(marker));
            this.markers.addEventListener('set-markers', ({ markers }) => {
                this.markersList = cloneDeep(markers.filter((m) => m.id !== TEMP_ID));
            });

            this.setPanorama();
        },

        loadFile(files) {
            this.error = false;

            if (this.imageData === DEFAULT_IMAGE) {
                this.options.caption = null;
            } else if (this.imageData) {
                URL.revokeObjectURL(this.imageData);
                this.imageData = null;
            }

            if (files && files[0]) {
                const reader = new FileReader();

                reader.onload = (event) => {
                    this.imageData = event.target.result;

                    const image = new Image();

                    image.onload = () => {
                        this.setPanorama(image.width, image.height);
                    };

                    image.onerror = () => {
                        URL.revokeObjectURL(this.imageData);
                        this.imageData = null;
                        this.error = true;
                        this.setPanorama();
                    };

                    image.src = event.target.result;
                };

                reader.readAsDataURL(files[0]);
            }
        },

        loadDefaultFile() {
            this.error = false;

            if (this.imageData) {
                URL.revokeObjectURL(this.imageData);
            }

            this.imageData = DEFAULT_IMAGE;
            this.file = null;
            this.setPanorama(6000, 3000);
            this.options.caption = 'Parc national du Mercantour <b>&copy; Damien Sorel</b>';
        },

        setPanorama(width, height) {
            if (this.imageData) {
                const fullWidth = Math.max(width, height * 2);
                const fullHeight = Math.round(fullWidth / 2);
                const croppedX = Math.round((fullWidth - width) / 2);
                const croppedY = Math.round((fullHeight - height) / 2);

                const panoData = {
                    fullWidth: fullWidth,
                    fullHeight: fullHeight,
                    croppedWidth: width,
                    croppedHeight: height,
                    croppedX: croppedX,
                    croppedY: croppedY,
                };

                this.viewer.overlay.hide();
                this.viewer.setPanorama(this.imageData, { panoData });
            } else {
                this.viewer.loader.hide();
                this.viewer.overlay.show({
                    title: 'Please select a panorama file',
                    dissmisable: false,
                });
            }
        },

        applyOptions() {
            if (this.viewer) {
                try {
                    if (this.options.defaultZoomLvl !== this.oldOptions.defaultZoomLvl) {
                        this.viewer.zoom(this.options.defaultZoomLvl);
                    } else if (
                        this.options.defaultYaw !== this.oldOptions.defaultYaw ||
                        this.options.defaultPitch !== this.oldOptions.defaultPitch
                    ) {
                        this.viewer.rotate({
                            yaw: this.options.defaultYaw,
                            pitch: this.options.defaultPitch,
                        });
                    } else {
                        Object.keys(this.options).some((optName) => {
                            if (!isEqual(this.options[optName], this.oldOptions[optName])) {
                                this.viewer.setOption(optName, this.options[optName]);
                                return true;
                            }
                        });
                    }
                } catch (e) {
                    // ignore parsing errors
                }
            }
            this.oldOptions = cloneDeep(this.options);
        },

        applyAdapterOptions() {
            if (this.viewer && this.imageData) {
                Object.assign(this.viewer.adapter.config, this.adapterOptions);
                this.viewer.setPanorama(this.imageData, { panoData: this.viewer.state.panoData });
            }
        },

        applyNavbar() {
            this.viewer?.setOption(
                'navbar',
                this.navbar.filter((i) => i.enabled).map((i) => i.code)
            );
        },

        applySphereCorrection() {
            this.viewer?.setOption('sphereCorrection', {
                pan: (this.sphereCorrection.pan / 180) * Math.PI,
                tilt: (this.sphereCorrection.tilt / 180) * Math.PI,
                roll: (this.sphereCorrection.roll / 180) * Math.PI,
            });
        },

        reset() {
            this.viewer?.destroy();
            this.viewer = null;
            this.markers = null;

            this.file = null;
            this.imageData = null;
            this.markersList = [];
            this.options = cloneDeep(this.DEFAULT_OPTIONS);
            this.adapterOptions = cloneDeep(this.DEFAULT_ADAPTER_OPTIONS);
            this.sphereCorrection = cloneDeep(this.DEFAULT_SPHERE_CORRECTION);
            this.navbar = cloneDeep(this.DEFAULT_NAVBAR);
            this.oldOptions = cloneDeep(this.options);

            this.initViewer();
        },

        back() {
            if (this.markerForm.type) {
                this.cancelMarker();
            } else {
                this.editMarkers = false;
            }
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
                    this.markerForm.size = { width: 32, height: 32 };
                    this.markerForm.anchor = 'bottom center';
                    break;
                case 'imageLayer':
                    this.markerForm.imageLayer = this.TARGET_URL;
                    this.markerForm.size = { width: 120, height: 120 };
                    break;
                case 'html':
                    this.markerForm.html = 'Test content';
                    this.markerForm.style.fontSize = '15px';
                    this.markerForm.style.color = '#222F3D';
                    break;
                case 'polygon':
                    this.markerForm.polygon = [];
                    this.markerForm.svgStyle.fill = '#E84B3C';
                    this.markerForm.svgStyle.fillOpacity = 0.5;
                    this.markerForm.svgStyle.strokeWidth = 2;
                    this.markerForm.svgStyle.stroke = '#C0382B';
                    break;
                case 'polyline':
                    this.markerForm.polyline = [];
                    this.markerForm.svgStyle.strokeWidth = 5;
                    this.markerForm.svgStyle.stroke = '#27AF60';
                    break;
            }
        },

        cancelMarker() {
            if (
                !this.markerForm.saved &&
                (this.markerForm.type === 'polygon' || this.markerForm.type === 'polyline') &&
                this.markerForm[this.markerForm.type].length > 0
            ) {
                this.markers.removeMarker(TEMP_ID);
            }

            Object.keys(this.markerForm).forEach((key) => {
                if (
                    key === 'tooltip' ||
                    key === 'style' ||
                    key === 'svgStyle' ||
                    key === 'position' ||
                    key === 'size'
                ) {
                    Object.keys(this.markerForm[key]).forEach((key2) => (this.markerForm[key][key2] = null));
                } else {
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
            if (
                !this.markerForm.saved &&
                (this.markerForm.type === 'polygon' || this.markerForm.type === 'polyline') &&
                this.markerForm[this.markerForm.type].length >= (this.markerForm.type === 'polygon' ? 3 : 2)
            ) {
                this.markers.addMarker(this.getMarkerConfig());
            }

            this.cancelMarker();
        },

        getMarkerConfig() {
            const config = cloneDeep(this.markerForm);
            if (config.size.width === null && config.size.height === null) {
                delete config.size;
            }
            return config;
        },

        onClick(data) {
            if (!this.editMarkers || !this.markerForm.type) {
                return;
            }

            const yaw = Math.round(data.yaw * 1000) / 1000;
            const pitch = Math.round(data.pitch * 1000) / 1000;
            this.markerForm.position = { yaw, pitch };

            switch (this.markerForm.type) {
                case 'image':
                case 'imageLayer':
                case 'html':
                    if (!this.markerForm.saved) {
                        this.markers.addMarker(this.getMarkerConfig());
                        this.cancelMarker();
                    } else {
                        this.markers.updateMarker({
                            id: this.markerForm.id,
                            position: { yaw, pitch },
                        });
                    }
                    break;

                case 'polygon':
                    if (this.markerForm.saved) {
                        return;
                    }
                    this.markerForm.polygon.push([yaw, pitch]);
                    switch (this.markerForm.polygon.length) {
                        case 1:
                            this.markers.addMarker({
                                id: TEMP_ID,
                                hideList: true,
                                position: { yaw, pitch },
                                anchor: 'center center',
                                circle: Math.max(1, this.markerForm.svgStyle.strokeWidth / 2),
                                svgStyle: {
                                    fill: this.markerForm.svgStyle.strokeWidth
                                        ? this.markerForm.svgStyle.stroke
                                        : this.markerForm.svgStyle.fill,
                                },
                            });
                            break;
                        case 2:
                            this.markers.removeMarker(TEMP_ID, false);
                            this.markers.addMarker({
                                id: TEMP_ID,
                                hideList: true,
                                polyline: this.markerForm.polygon,
                                svgStyle: {
                                    strokeWidth: Math.max(1, this.markerForm.svgStyle.strokeWidth),
                                    stroke: this.markerForm.svgStyle.strokeWidth
                                        ? this.markerForm.svgStyle.stroke
                                        : this.markerForm.svgStyle.fill,
                                },
                            });
                            break;
                        default:
                            this.markers.removeMarker(TEMP_ID, false);
                            this.markers.addMarker({
                                ...this.getMarkerConfig(),
                                id: TEMP_ID,
                                hideList: true,
                            });
                            break;
                    }
                    break;

                case 'polyline':
                    if (this.markerForm.saved) {
                        return;
                    }
                    this.markerForm.polyline.push([yaw, pitch]);
                    switch (this.markerForm.polyline.length) {
                        case 1:
                            this.markers.addMarker({
                                id: TEMP_ID,
                                hideList: true,
                                position: { yaw, pitch },
                                anchor: 'center center',
                                circle: Math.max(1, this.markerForm.svgStyle.strokeWidth / 2),
                                svgStyle: {
                                    fill: this.markerForm.svgStyle.stroke,
                                },
                            });
                            break;
                        default:
                            this.markers.removeMarker(TEMP_ID, false);
                            this.markers.addMarker({
                                ...this.getMarkerConfig(),
                                id: TEMP_ID,
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
            if (!this.markerForm.size) {
                this.markerForm.size = { width: null, height: null };
            }
            this.markerForm.saved = true;
            this.markerForm.type = marker.type;
        },

        updateMarker() {
            if (this.markerForm.saved) {
                this.markers.updateMarker(this.getMarkerConfig());
            } else if (
                (this.markerForm.type === 'polygon' || this.markerForm.type === 'polyline') &&
                this.markerForm[this.markerForm.type].length >= (this.markerForm.type === 'polygon' ? 3 : 2)
            ) {
                this.markers.updateMarker({
                    ...this.getMarkerConfig(),
                    id: TEMP_ID,
                    hideList: true,
                });
            }
        },

        showMarkersDialog() {
            const content = this.markersList
                .filter((marker) => marker.id !== TEMP_ID)
                .map((marker) => {
                    const m = {};
                    m.id = marker.id;
                    m[marker.type] = marker.config[marker.type];
                    if (marker.type !== 'polygon' && marker.type !== 'polyline') {
                        m.position = marker.config.position;
                    }
                    if (marker.config.size?.width) {
                        m.size = marker.config.size;
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
                    m.style = pickBy(marker.config.style, (v) => !!v);
                    if (!Object.entries(m.style).length) {
                        delete m.style;
                    }
                    m.svgStyle = pickBy(marker.config.svgStyle, (v) => !!v);
                    if (!m.svgStyle.strokeWidth) {
                        delete m.svgStyle.stroke;
                    }
                    if (!m.svgStyle.fillOpacity) {
                        delete m.svgStyle.fill;
                    }
                    if (!Object.entries(m.svgStyle).length) {
                        delete m.svgStyle;
                    }
                    return m;
                });

            this.markersDialogContent =
                'markers: ' +
                JSON.stringify(
                    content,
                    (k, v) => {
                        if (k === 'polyline' || k === 'polygon') {
                            return JSON.stringify(v);
                        } else {
                            return v;
                        }
                    },
                    2
                )
                    .replace(/\"\[/g, '[')
                    .replace(/\]\"/g, ']');
            this.markersDialog = true;
        },

        copyMarkersList() {
            window.navigator.clipboard.writeText(this.markersDialog);
            this.markersDialog = false;
        },
    },
};
</script>
