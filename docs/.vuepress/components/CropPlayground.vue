<template>
  <div>
    <md-field>
      <label>Panorama image</label>
      <md-file v-model="file" accept="image/*" v-on:md-change="loadFile"/>
    </md-field>

    <div class="md-layout md-gutter">
      <div class="md-layout-item">
        <md-field>
          <label>Full width</label>
          <md-input name="fullWidth" v-model="panoData.fullWidth" type="number" min="0" :disabled="loading"
                    v-on:change="setValue"/>
        </md-field>
      </div>
      <div class="md-layout-item">
        <md-field>
          <label>Cropped width</label>
          <md-input name="croppedWidth" v-model="panoData.croppedWidth" :disabled="true"/>
        </md-field>
      </div>
      <div class="md-layout-item">
        <md-field>
          <label>Cropped Y</label>
          <md-input name="croppedY" v-model="panoData.croppedY" type="number" min="0" :disabled="loading"
                    v-on:change="setValue"/>
        </md-field>
      </div>
    </div>

    <div class="md-layout md-gutter">
      <div class="md-layout-item">
        <md-field>
          <label>Full height</label>
          <md-input name="fullHeight" v-model="panoData.fullHeight" type="number" min="0" :disabled="loading"
                    v-on:change="setValue"/>
        </md-field>
      </div>
      <div class="md-layout-item">
        <md-field>
          <label>Cropped height</label>
          <md-input name="croppedHeight" v-model="panoData.croppedHeight" :disabled="true"/>
        </md-field>
      </div>
      <div class="md-layout-item">
        <md-field>
          <label>Cropped X</label>
          <md-input name="croppedX" v-model="panoData.croppedX" type="number" min="0" :disabled="loading"
                    v-on:change="setValue"/>
        </md-field>
      </div>
    </div>

    <md-button class="md-raised md-primary" :disabled="loading" v-on:click="apply">Apply</md-button>

    <md-tabs v-show="!loading">
      <md-tab id="preview" md-label="Preview">
        <div id="viewer"></div>
      </md-tab>
      <md-tab id="xmp" md-label="XMP Data">
        <div class="language-xml" v-if="xmpData">
          <pre class="language-xml"><code>{{xmpData}}</code></pre>
        </div>
      </md-tab>
    </md-tabs>

  </div>
</template>

<script>
  const { Viewer } = require('photo-sphere-viewer');

  export default {
    data   : () => ({
      psv      : null,
      loading  : true,
      file     : null,
      imageData: null,
      xmpData  : '',
      panoData : {
        fullWidth    : null,
        fullHeight   : null,
        croppedWidth : null,
        croppedHeight: null,
        croppedX     : null,
        croppedY     : null,
      }
    }),
    beforeDestroy() {
      if (this.psv) {
        this.psv.destroy();
      }
    },
    methods: {
      loadFile(files) {
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

            image.src = this.imageData;
          };

          reader.readAsDataURL(files[0]);
        } else {
          this.imageData = null;
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

        setTimeout(() => this.loadPsv());
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
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="r"?>`;
      },

      loadPsv() {
        if (this.psv) {
          this.psv.destroy();
        }

        this.psv = new Viewer({
          panorama  : this.imageData,
          container : 'viewer',
          loadingImg: '/assets/photosphere-logo.gif',
          panoData  : this.panoData,
          navbar    : ['zoom', 'fullscreen'],
          size      : {
            height: 500
          }
        });
      }
    }
  }
</script>

<style>
  .md-tab {
    padding: 0;
    overflow: auto;
  }
</style>
