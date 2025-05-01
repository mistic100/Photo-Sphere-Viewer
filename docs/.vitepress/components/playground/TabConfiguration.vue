<template>
    <v-select label="Navbar buttons" :items="BUTTONS" multiple v-model="config.navbar" />

    <Container title="Position">
        <v-row class="no-v-gutters">
            <v-col cols="4">
                <v-text-field label="Default yaw" v-model="config.defaultYaw" />
            </v-col>
            <v-col cols="4">
                <v-text-field label="Default pitch" v-model="config.defaultPitch" />
            </v-col>
            <v-col cols="4"></v-col>
            <v-col cols="4">
                <SliderInput label="Default zoom level" v-model="config.defaultZoomLvl" :min="0" :max="100" :step="1"
                    :ticks="[0, 25, 50, 75, 100]" />
            </v-col>
            <v-col cols="8">
                <SliderInput label="Min FOV/Max FOV" v-model="configFov" range :min="0" :max="180" :step="1"
                    :ticks="[0, 20, 40, 60, 80, 100, 120, 140, 160, 180]" />
            </v-col>
            <v-col cols="4">
                <v-number-input label="Move speed" v-model="config.moveSpeed" :min="0" :step="0.1" :precision="1" />
            </v-col>
            <v-col cols="4">
                <v-number-input label="Zoom speed" v-model="config.zoomSpeed" :min="0" :step="0.1" :precision="1" />
            </v-col>
            <v-col cols="4">
                <v-checkbox label="Move inertia" v-model="config.moveInertia" />
            </v-col>
        </v-row>
    </Container>

    <Container title="Options">
        <v-row class="no-v-gutters">
            <v-col cols="4">
                <v-checkbox label="Mouse wheel" v-model="config.mousewheel" />
            </v-col>
            <v-col cols="4">
                <v-checkbox label="Mouse move" v-model="config.mousemove" />
            </v-col>
            <v-col cols="4">
                <v-checkbox label="Keyboard (fullscreen)" v-model="config.keyboard" />
            </v-col>
            <v-col cols="4">
                <v-checkbox label="Fisheye" v-model="config.fisheye" />
            </v-col>
            <v-col cols="4">
                <v-checkbox label="Hold Ctrl to zoom" v-model="config.mousewheelCtrlKey" />
            </v-col>
            <v-col cols="4">
                <v-checkbox label="Two fingers move" v-model="config.touchmoveTwoFingers" />
            </v-col>
            <v-col cols="4">
                <v-menu :close-on-content-click="false" @update:modelValue="persistBgColor">
                    <template v-slot:activator="{ props }">
                        <v-text-field label="Canvas background" v-bind="props" v-model="config.canvasBackground">
                            <template #append-inner>
                                <div class="colorpicker-square" :style="{ backgroundColor: config.canvasBackground }"></div>
                            </template>
                        </v-text-field>
                    </template>
                    <v-color-picker v-model="configBgColor" :hide-inputs="true" />
                </v-menu>
            </v-col>
        </v-row>
    </Container>
</template>

<script setup lang="ts">
import { watchDebounced } from '@vueuse/core';
import { cloneDeep } from 'lodash-es';
import { onMounted, reactive, ref, watch } from 'vue';
import type { ViewerConfig } from '../../../../packages/core';
import SliderInput from '../SliderInput.vue';
import Container from './Container.vue';

export type Config = Omit<ViewerConfig, 'container'>
    & {
        navbar: string[];
    };

const BUTTONS = [
    { value: 'zoom', title: 'Zoom' },
    { value: 'move', title: 'Move' },
    { value: 'download', title: 'Download' },
    { value: 'caption', title: 'Caption' },
    { value: 'fullscreen', title: 'Fullscreen' },
];

const { loading } = defineProps<{ loading: boolean }>();

const config = reactive<Config>({
    navbar: BUTTONS.map(b => b.value),
    defaultYaw: 0,
    defaultPitch: 0,
    defaultZoomLvl: 50,
    minFov: 30,
    maxFov: 90,
    mousewheel: true,
    mousemove: true,
    keyboard: true,
    fisheye: false,
    mousewheelCtrlKey: false,
    touchmoveTwoFingers: false,
    moveSpeed: 1,
    zoomSpeed: 1,
    moveInertia: true,
    canvasBackground: '#000000',
});
const configFov = ref([config.minFov, config.maxFov]);
const configBgColor = ref(config.canvasBackground);

const emit = defineEmits<{
    updateConfig: [config: Config],
}>();

watch(configFov, persisFov);

watchDebounced(
    config,
    emitConfig,
    { debounce: 300, maxWait: 9999, deep: true }
);

onMounted(() => {
    emitConfig();
});

function persisFov() {
    config.minFov = configFov.value[0];
    config.maxFov = configFov.value[1];
}

function persistBgColor(menuOpen: boolean) {
    if (!menuOpen) {
        config.canvasBackground = configBgColor.value;
    }
}

function emitConfig() {
    const c = cloneDeep(config) as Config;
    c.navbar.sort((a, b) => {
        return BUTTONS.findIndex(c => c.value === a) - BUTTONS.findIndex(c => c.value === b);
    });
    emit('updateConfig', c);
}
</script>

<style lang="scss" scoped>
.colorpicker-square {
    border-radius: 4px;
    margin: -0.25rem;
    width: 1.5rem;
    aspect-ratio: 1;
    cursor: pointer;
}
</style>
