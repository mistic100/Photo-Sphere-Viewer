<template>
    <div class="badges">
        <a v-if="stargazersCount"
           class="badge github"
           href="https://github.com/mistic100/Photo-Sphere-Viewer"
           title="GitHub stargazers">
            <img src="./github-star.png">&nbsp;{{ stargazersCount }}
        </a>
        <a v-if="latestVersion"
           class="badge version"
           href="/guide/changelog.html"
           title="Latest version">
            {{ latestVersion }}
        </a>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePsvDocData } from '../theme/data';

const data = usePsvDocData();
const latestVersion = data.latestVersion;
const stargazersCount = computed(() => data.stargazersCount.value ? (data.stargazersCount.value / 1000).toFixed(1) + 'k' : null);
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
        padding: 0 10px;
        border-radius: 15px;
        font-weight: 600;
        transition: all 0.3s ease-in-out;

        &:hover {
            filter: drop-shadow(0px 0px 5px rgba(255, 255, 255, 0.42));
        }
    }

    .github {
        color: #dfdfd6;
        background-color: #1b1b1f;

        img {
            height: 1.3em;
            margin-left: -5px;
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
