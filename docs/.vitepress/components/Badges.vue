<template>
    <div class="badges">
        <a :href="'https://www.npmjs.com/package/@photo-sphere-viewer/' + module" target="_blank" rel="noopener noreferrer">
            <img :src="'https://img.shields.io/npm/v/@photo-sphere-viewer/' + module + '?logo=npm'" alt="NPM version">
        </a>
        <a :href="'https://npmtrends.com/@photo-sphere-viewer/' + module" target="_blank" rel="noopener noreferrer">
            <img :src="'https://img.shields.io/npm/dm/@photo-sphere-viewer/' + module + '?color=f86036&amp;label=npm&amp;logo=npm'" alt="NPM Downloads">
        </a>
        <a :href="'https://www.jsdelivr.com/package/npm/@photo-sphere-viewer/' + module" target="_blank" rel="noopener noreferrer">
            <img :src="'https://img.shields.io/jsdelivr/npm/hm/@photo-sphere-viewer/' + module + '?color=%23f86036&amp;logo=jsdelivr'" alt="jsDelivr Hits">
        </a>
        <!-- <a :href="'https://bundlephobia.com/package/@photo-sphere-viewer/' + module" target="_blank" rel="noopener noreferrer">
            <img :src="'https://img.shields.io/bundlephobia/minzip/@photo-sphere-viewer/' + module + '?logo=webpack&label=gzip'" alt="Bundle size">
        </a> -->
    </div>
</template>

<script setup lang="ts">
defineProps<{
    module: string;
}>();
</script>

<style lang="scss" scoped>
    .badges {
        margin-top: 1em;
    }
    a {
        margin-right: 0.5em;
    }
    a::after {
        display: none !important;
    }
    img {
        display: inline;
    }
</style>
