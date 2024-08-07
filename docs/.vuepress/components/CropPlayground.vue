<template>
    <div>
        <md-field>
            <label>Panorama image</label>
            <md-file v-model="file" accept="image/*" v-on:md-change="loadFile" />
        </md-field>

        <div class="md-layout md-gutter">
            <div class="md-layout-item">
                <md-field>
                    <label>Full width</label>
                    <md-input
                        name="fullWidth"
                        v-model="panoData.fullWidth"
                        type="number"
                        min="0"
                        :disabled="loading"
                        v-on:change="setValue"
                    />
                </md-field>
            </div>
            <div class="md-layout-item">
                <md-field>
                    <label>Cropped width</label>
                    <md-input name="croppedWidth" v-model="panoData.croppedWidth" :disabled="true" />
                </md-field>
            </div>
            <div class="md-layout-item">
                <md-field>
                    <label>Cropped Y</label>
                    <md-input name="croppedY" v-model="panoData.croppedY" type="number" min="0" :disabled="loading" />
                </md-field>
            </div>
        </div>

        <div class="md-layout md-gutter">
            <div class="md-layout-item">
                <md-field>
                    <label>Full height</label>
                    <md-input
                        name="fullHeight"
                        v-model="panoData.fullHeight"
                        type="number"
                        min="0"
                        :disabled="loading"
                        v-on:change="setValue"
                    />
                </md-field>
            </div>
            <div class="md-layout-item">
                <md-field>
                    <label>Cropped height</label>
                    <md-input name="croppedHeight" v-model="panoData.croppedHeight" :disabled="true" />
                </md-field>
            </div>
            <div class="md-layout-item">
                <md-field>
                    <label>Cropped X</label>
                    <md-input name="croppedX" v-model="panoData.croppedX" type="number" min="0" :disabled="loading" />
                </md-field>
            </div>
        </div>

        <div class="md-layout md-gutter" style="margin-bottom: 30px">
            <div class="md-layout-item">
                <label class="md-caption">Pose Heading</label>
                <vue-slider
                    v-model="sphereCorrection.pan"
                    :min="0"
                    :max="360"
                    :marks="[0, 90, 180, 270, 360]"
                    :drag-on-click="true"
                    :disabled="loading"
                />
            </div>
            <div class="md-layout-item">
                <label class="md-caption">Pose Pitch</label>
                <vue-slider
                    v-model="sphereCorrection.pitch"
                    :min="-90"
                    :max="90"
                    :marks="[-90, 0, 90]"
                    :drag-on-click="true"
                    :disabled="loading"
                />
            </div>
            <div class="md-layout-item">
                <label class="md-caption">Pose Roll</label>
                <vue-slider
                    v-model="sphereCorrection.roll"
                    :min="-180"
                    :max="180"
                    :marks="[-180, -90, 0, 90, 180]"
                    :drag-on-click="true"
                    :disabled="loading"
                />
            </div>
        </div>

        <md-button class="md-raised md-dense md-primary" :disabled="loading" v-on:click="apply">Apply</md-button>

        <div class="custom-block danger" v-if="error">
            <p class="custom-block-title">This image cannot be loaded</p>
            <p>
                An undefined error occurred while loading the panorama. If your image is very big and you are using
                Firefox please try with Chrome, as Firefox has trouble loading large base64 images.
            </p>
        </div>

        <md-tabs md-elevation="1" md-alignment="left" v-show="!loading">
            <md-tab md-label="Preview">
                <div id="viewer"></div>
            </md-tab>
            <md-tab md-label="XMP Data">
                <div class="language-xml" v-if="xmpData">
                    <pre class="language-xml"><code>{{xmpData}}</code></pre>
                </div>
            </md-tab>
        </md-tabs>
    </div>
</template>

<script>
export default {
    data: () => ({
        Viewer: null,

        viewer: null,
        loading: true,
        error: false,
        file: null,
        imageData: null,
        xmpData: '',
        panoData: {
            fullWidth: null,
            fullHeight: null,
            croppedWidth: null,
            croppedHeight: null,
            croppedX: null,
            croppedY: null,
        },
        sphereCorrection: {
            pan: null,
            pitch: null,
            roll: null,
        }
    }),
    mounted() {
        // ugly hack to load PSV from jsdelivr as an ES module
        window.__viewer = this;

        window.__s = document.createElement('script');
        __s.type = 'module';
        __s.text = `
import { Viewer } from '@photo-sphere-viewer/core';
__viewer.init(Viewer);
__s.remove();
`;
        document.body.appendChild(__s);
    },
    beforeDestroy() {
        this.viewer?.destroy();
    },
    methods: {
        init(Viewer) {
            this.Viewer = Viewer;
        },
        loadFile(files) {
            this.error = false;

            if (this.imageData) {
                URL.revokeObjectURL(this.imageData);
                this.imageData = null;
            }

            if (files && files[0]) {
                this.loading = true;

                const reader = new FileReader();

                reader.onload = (event) => {
                    this.imageData = event.target.result;

                    const image = new Image();

                    image.onload = () => {
                        this.computePanoData(image.width, image.height);
                        this.apply();

                        this.loading = false;
                    };

                    image.onerror = () => {
                        URL.revokeObjectURL(this.imageData);
                        this.imageData = null;
                        this.error = true;
                    };

                    image.src = this.imageData;
                };

                reader.readAsDataURL(files[0]);
            }
        },

        setValue(e) {
            if (e.target.name === 'fullWidth') {
                this.panoData.fullHeight = Math.round(this.panoData.fullWidth / 2);
            } else if (e.target.name === 'fullHeight') {
                this.panoData.fullWidth = this.panoData.fullHeight * 2;
            }
        },

        apply() {
            this.updateOutput();

            setTimeout(() => this.loadViewer());
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
            this.sphereCorrection.pan = 0;
            this.sphereCorrection.pitch = 0;
            this.sphereCorrection.roll = 0;
        },

        updateOutput() {
            this.xmpData = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/">
      <GPano:ProjectionType>equirectangular</GPano:ProjectionType>
      <GPano:FullPanoWidthPixels>${this.panoData.fullWidth}</GPano:FullPanoWidthPixels>
      <GPano:FullPanoHeightPixels>${this.panoData.fullHeight}</GPano:FullPanoHeightPixels>
      <GPano:CroppedAreaImageWidthPixels>${this.panoData.croppedWidth}</GPano:CroppedAreaImageWidthPixels>
      <GPano:CroppedAreaImageHeightPixels>${this.panoData.croppedHeight}</GPano:CroppedAreaImageHeightPixels>
      <GPano:CroppedAreaLeftPixels>${this.panoData.croppedX}</GPano:CroppedAreaLeftPixels>
      <GPano:CroppedAreaTopPixels>${this.panoData.croppedY}</GPano:CroppedAreaTopPixels>
      <GPano:PoseHeadingDegrees>${this.sphereCorrection.pan}</GPano:PoseHeadingDegrees>
      <GPano:PosePitchDegrees>${this.sphereCorrection.pitch}</GPano:PosePitchDegrees>
      <GPano:PoseRollDegrees>${this.sphereCorrection.roll}</GPano:PoseRollDegrees>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="r"?>`;
        },

        loadViewer() {
            const sphereCorrection = {
                pan: -this.sphereCorrection.pan,
                pitch: -this.sphereCorrection.pitch,
                roll: -this.sphereCorrection.roll,
            };

            if (this.viewer) {
                this.viewer.setPanorama(this.imageData, {
                    panoData: this.panoData,
                    sphereCorrection: sphereCorrection,
                });
            } else {
                this.viewer = new this.Viewer({
                    panorama: this.imageData,
                    container: 'viewer',
                    loadingImg: 'https://photo-sphere-viewer-data.netlify.app/assets/loader.gif',
                    panoData: this.panoData,
                    sphereCorrection: sphereCorrection,
                    navbar: ['zoom', 'move', 'fullscreen'],
                    size: {
                        height: 500,
                    },
                });
            }
        },
    },
};
</script>
