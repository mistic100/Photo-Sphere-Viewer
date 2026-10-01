<template>
    <div class="badges">
        <a class="badge github" href="https://github.com/mistic100/Photo-Sphere-Viewer"><img src="./github-star.png">&nbsp;2.4k</a>
        <a class="badge version" href="/guide/changelog.html" v-if="version">{{ version }}</a>
    </div>
</template>

<script setup lang="ts">
import { usePsvDocData } from '../theme/data';

const version = usePsvDocData().latestVersion;
</script>

<style lang="scss" scoped>
    .badges {
        position: absolute;
        top: 0;
        right: 0;
        display: flex;
        gap: 10px;
    }

    .badge {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        height: 30px;
        line-height: 30px;
        padding: 0 15px;
        border-radius: 15px;
        font-weight: 600;
        transition: all 0.3s ease-in-out;

        &:hover {
            filter: drop-shadow(0px 0px 5px rgba(255, 255, 255, 0.42));
        }
    }

    .github {
        color: var(--vp-c-text-1);
        background-color: var(--vp-c-bg);

        img {
            height: 1.3em;
        }
    }

    .version {
        color: white;
        background-image: linear-gradient(120deg, #8BC34A, #03A9F4);
        background-repeat: repeat;
        background-size: 200%;

        &:hover {
            background-position-x: 100%;
        }
    }
</style>