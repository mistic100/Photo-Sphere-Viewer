<template>
    <div class="photosphere" ref="container" :class="{ loaded: loaded }"></div>
</template>

<script setup lang="ts">
import { useData } from 'vitepress';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Viewer } from '../../../packages/core';
import { BASE_URL } from './constants';

let viewer: Viewer;

const PANO_LIGHT = {
    width: 6656,
    cols: 16,
    rows: 8,
    baseUrl: `${BASE_URL}sphere-small.jpg`,
    tileUrl: (col, row) => {
        const num = row * 16 + col + 1;
        return `${BASE_URL}sphere-tiles/image_part_${('000' + num).slice(-3)}.jpg`;
    },
};

const PANO_DARK = {
    width: 6656,
    cols: 16,
    rows: 8,
    baseUrl: `${BASE_URL}sphere-night-small.jpg`,
    tileUrl: (col, row) => {
        const num = row * 16 + col;
        return `${BASE_URL}sphere-night-tiles/image_part_${('000' + num).slice(-3)}.jpg`;
    },
};

const { isDark } = useData();
const loaded = ref(false);
const container = ref<HTMLElement | null>(null);

watch(isDark, () => {
    viewer?.setPanorama(isDark.value ? PANO_DARK : PANO_LIGHT);
});

onMounted(async () => {
    const [{ Viewer }, { EquirectangularTilesAdapter }] = await Promise.all([
        import('@photo-sphere-viewer/core'),
        import('@photo-sphere-viewer/equirectangular-tiles-adapter'),
    ]);

    viewer = new Viewer({
        container: container.value!,
        adapter: EquirectangularTilesAdapter.withConfig({ baseBlur: false }),
        loadingTxt: '',
        defaultPitch: 0.2,
        mousewheel: false,
        navbar: false,
        panorama: isDark.value ? PANO_DARK : PANO_LIGHT,
    });
    viewer.addEventListener('ready', () => {
        loaded.value = true;
        setTimeout(() => {
            viewer.dynamics.position.roll({ yaw: false }, 0.2);
        }, 500);
    }, { once: true });
});

onBeforeUnmount(() => {
    viewer?.destroy();
});
</script>

<style lang="scss" scoped>
.photosphere {
    position: absolute;
    width: 100%;
    height: calc(100vh - var(--vp-nav-height));
    margin-top: var(--vp-nav-height);
    z-index: 0 !important;
    opacity: 0;
    transition: opacity linear 500ms !important;

    &.loaded {
        opacity: 1;
    }

    &:deep(.psv-loader) {
        display: none !important;
    }
}

.psv-container {
    background: var(--vp-c-bg) !important;
}
</style>
