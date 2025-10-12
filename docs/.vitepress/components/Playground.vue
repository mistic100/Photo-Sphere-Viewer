<template>
    <div class="playground-container">
        <v-card class="form">
            <v-tabs v-model="currentTab" bg-color="primary">
                <v-tab value="panorama">Panorama</v-tab>
                <v-tab value="config" :disabled="loading">Configuration</v-tab>
            </v-tabs>

            <v-card-text>
                <v-tabs-window v-model="currentTab">
                    <v-tabs-window-item value="panorama" eager>
                        <TabPanorama @updateFile="setPanorama" @updateConfig="applyConfig" :loading="loading" />
                    </v-tabs-window-item>
                    <v-tabs-window-item value="config" eager>
                        <TabConfiguration @updateConfig="applyConfig" :loading="loading" />
                    </v-tabs-window-item>
                </v-tabs-window>
            </v-card-text>

            <v-card-actions>
                <v-btn variant="outlined" :disabled="loading" @click="codeModal!.open(config)">See code</v-btn>
                <CodeModal ref="codeModal"/>
            </v-card-actions>
        </v-card>

        <div id="viewer"></div>
    </div>
</template>

<script setup lang="ts">
import { cloneDeep, isEqual } from 'lodash-es';
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import type { Viewer } from '../../../packages/core';
import TabConfiguration, { Config } from './playground/TabConfiguration.vue';
import TabPanorama, { PanoConfig } from './playground/TabPanorama.vue';
import CodeModal from './playground/CodeModal.vue';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const currentTab = ref('panorama');
const loading = ref(true);
const codeModal = ref<typeof CodeModal | null>(null);

let viewer: Viewer;
let config: PanoConfig & Config = reactive({} as any);

onMounted(async () => {
    const { Viewer } = await import('@photo-sphere-viewer/core');

    viewer = new Viewer({
        container: 'viewer',
    });

    setPanorama(null);
});

onBeforeUnmount(() => {
    viewer?.destroy();
});

function setPanorama(imageData: string | null) {
    if (imageData) {
        loading.value = false;
        viewer.overlay.hide();
        viewer.setPanorama(imageData);
    } else {
        loading.value = true;
        viewer.loader.hide();
        viewer.overlay.show({
            title: 'Please select a panorama image',
            dissmisable: false,
        });
    }
}

function applyConfig(input: Config | PanoConfig) {
    const previous = cloneDeep(config);
    Object.assign(config, input);

    if (viewer?.state.ready) {
        const changes: Partial<Config & PanoConfig> = {};
        Object.entries(config).forEach(([key, value]) => {
            if (!isEqual(value, previous[key])) {
                changes[key] = value;
                console.log(key, value);
            }
        });

        if (changes.panoData) {
            viewer.setPanorama(viewer.config.panorama, {
                panoData: changes.panoData,
            });
            delete changes.panoData;
        }

        if (changes.defaultZoomLvl !== undefined) {
            viewer.animate({ speed: 500, zoom: changes.defaultZoomLvl });
            delete changes.defaultZoomLvl;
        }

        if (changes.defaultYaw !== undefined || changes.defaultPitch !== undefined) {
            viewer.animate({ speed: '10rpm', yaw: config.defaultYaw!, pitch: config.defaultPitch! });
            delete changes.defaultYaw;
            delete changes.defaultPitch;
        }

        if (Object.keys(changes).length) {
            viewer.setOptions(cloneDeep(changes));
        }
    }
}
</script>

<style lang="scss" scoped>
.playground-container {
    --playground-width: 700px;
    --playground-padding: 30px;

    position: fixed;
    top: var(--vp-nav-height);
    left: 0;
    right: 0;
    bottom: 0;
    padding: var(--playground-padding);
    display: flex;
    background: var(--vp-c-bg);
    z-index: 1;

    @media (max-width: 1440px) {
        --playground-width: 600px;
        --playground-padding: 20px;
    }
}

.form {
    flex: none;
    width: var(--playground-width);
    margin-right: calc(var(--playground-padding) / 2);

    &>.v-card-text {
        overflow-y: auto;
    }
}

#viewer {
    flex: 1;
    border-radius: 5px;
    overflow: hidden;
}
</style>
