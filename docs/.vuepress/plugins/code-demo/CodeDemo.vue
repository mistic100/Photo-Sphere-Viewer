<template>
  <md-tabs md-elevation="1" md-alignment="left" class="demo-tabs md-primary">
    <template slot="md-tab" slot-scope="{ tab }">
      <span class="md-tab-label" v-if="tab.label">{{ tab.label }}</span>
      <ServiceButton v-if="tab.data.service"
                     :service="tab.data.service"
                     :title="title"
                     :js="js"
                     :css="css"
                     :html="html"
                     :resources="resources">
      </ServiceButton>
    </template>

    <md-tab md-label="Result">
      <iframe class="demo-runner"
              v-if="srcdoc" v-bind:srcdoc="srcdoc"
              allowfullscreen="allowfullscreen"
              allow="vr; xr; accelerometer; gyroscope; webvr; webxr;"
              frameborder="0"></iframe>
    </md-tab>

    <md-tab md-label="Source">
      <div class="demo-source">
        <slot name="demo"></slot>
      </div>
    </md-tab>

    <md-tab v-for="service in SERVICES"
            :key="service"
            :md-template-data="{service:service}"
            v-on:click="$event.stopImmediatePropagation()">
    </md-tab>
  </md-tabs>
</template>

<script>
  import { SERVICES } from './constants';
  import ServiceButton from './ServiceButton';
  import { getFullCss, getFullHtml, getFullJs, getFullResources, getIframeContent } from './utils';

  export default {
    name      : 'CodeDemo',
    components: [
      ServiceButton,
    ],
    props     : {
      title  : { type: String, default: '' },
      rawHtml: { type: String, default: '' },
      rawJs  : { type: String, default: '' },
      rawCss : { type: String, default: '' },
      rawRes : { type: String, default: '' },
    },
    data() {
      return {
        SERVICES: SERVICES,
      };
    },
    computed  : {
      html() {
        return getFullHtml(decodeURIComponent(this.rawHtml));
      },
      js() {
        return getFullJs(decodeURIComponent(this.rawJs));
      },
      css() {
        return getFullCss(decodeURIComponent(this.rawCss));
      },
      resources() {
        return getFullResources(JSON.parse(decodeURIComponent(this.rawRes)));
      },
      srcdoc() {
        return getIframeContent({
          title    : this.title,
          html     : this.html,
          js       : this.js,
          css      : this.css,
          resources: this.resources,
        });
      },
    },
  };
</script>

<style lang="stylus">
  .demo-tabs
    .md-tab
      padding 0

    .md-tab-nav-button:nth-child(3)
      margin-left auto

    [class^=language-]
      margin 1rem

    .language-yaml
      display none

    pre
      margin 0 !important

  .demo-runner
    width 100%
    height 540px !important

  .demo-source
    max-height 540px
    overflow auto
</style>
