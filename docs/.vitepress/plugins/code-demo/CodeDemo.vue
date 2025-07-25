<template>
    <v-card>
        <v-tabs v-if="!hideHeader" v-model="currentTab" bg-color="primary">
            <v-tab value="result">Result</v-tab>
            <v-tab value="source">Source</v-tab>

            <span style="flex: 1"></span>

            <v-tab v-for="(service, key) in SERVICES" :value="currentTab" v-tooltip="service.name" @click="open(key)">
                <v-icon size="large" v-html="service.icon"></v-icon>
            </v-tab>
        </v-tabs>

        <v-card-text>
            <v-tabs-window v-model="currentTab">
                <v-tabs-window-item value="result">
                    <div v-if="!show" class="demo-loader">
                        <v-btn @click="show = true" theme="light" color="primary" size="large">Load demo</v-btn>
                    </div>

                    <iframe class="demo-runner"
                            v-if="show && srcdoc"
                            :srcdoc="srcdoc"
                            allowfullscreen="allowfullscreen"
                            frameborder="0">
                    </iframe>
                </v-tabs-window-item>

                <v-tabs-window-item value="source">
                    <div class="demo-source" ref="sourceContainer">
                        <slot name="demo"></slot>
                    </div>
                </v-tabs-window-item>
            </v-tabs-window>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Service, SERVICES } from './constants';
import { getFullPackages, getIframeContent, openService } from './utils';

const props = defineProps<{
    autoload: string;
    hideHeader: string;
    title: string;
    version: string;
    rawHtml: string;
    rawJs: string;
    rawCss: string;
    rawPackages: string;
}>();

const hideHeader = props.hideHeader === 'true';
const show = ref(props.autoload === 'true');
const currentTab = ref('result');

const html = computed(() => decodeURIComponent(props.rawHtml));
const js = computed(() => decodeURIComponent(props.rawJs));
const css = computed(() => decodeURIComponent(props.rawCss));
const packages = computed(() => getFullPackages(props.version, JSON.parse(decodeURIComponent(props.rawPackages))));
const srcdoc = computed(() => getIframeContent({
    title: props.title,
    html: html.value,
    js: js.value,
    css: css.value,
    packages: packages.value,
}));

function open(service: Service) {
    openService(service, {
        title: props.title,
        html: html.value,
        js: js.value,
        css: css.value,
        packages: packages.value,
    });
}

const sourceContainer = ref<HTMLElement | null>(null);
watch(sourceContainer, () => {
    sourceContainer.value?.querySelector('.language-yaml')?.remove();
});
</script>

<style lang="scss" scoped>
$height: 540px;

.demo-runner {
    width: 100%;
    height: $height !important;
    border-radius: 4px;
}

.demo-source {
    height: $height;
    overflow: auto;
}

.demo-loader {
    width: 100%;
    height: $height;
    display: flex;
    justify-content: center;
    align-items: center;
    background: radial-gradient(#fff 0%, #fdfdfd 16%, #fbfbfb 33%, #f8f8f8 49%, #efefef 66%, #dfdfdf 82%, #bfbfbf 100%);
    border-radius: 4px;
}
</style>
