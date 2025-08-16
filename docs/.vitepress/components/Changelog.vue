<template>
    <div v-if="showLoader" class="loader">
        <span class="spinner"></span>
    </div>

    <template v-for="entry in changelog">
        <h2 v-bind:id="entry.id">
            <a v-bind:href="'#' + entry.id" class="header-anchor"></a>
            {{ entry.title }}
            <small class="release-date">{{ entry.date }}</small>

            <a v-bind:href="entry.url" class="release-link">
                <v-icon icon="mdi-tag" size="small"></v-icon>
            </a>
        </h2>
        <div v-html="entry.desc" class="release-content"></div>
    </template>
</template>

<script setup lang="ts">
import { kebabCase } from 'lodash-es';
import { onMounted, ref } from 'vue';

type Changelog = {
    id: string;
    url: string;
    title: string;
    date: string;
    desc: string;
};

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });

const showLoader = ref(true);
const changelog = ref<Changelog[]>([]);

onMounted(async () => {
    const result = await fetchReleases();
    const { marked } = await import('marked');
    changelog.value = result.map(r => formatRelease(r, marked));
    showLoader.value = false;
});

async function fetchReleases(): Promise<any[]> {
    const cache = localStorage.releasesCache;
    const cacheDate = localStorage.releasesCacheDate;

    if (cache && cacheDate && (Date.now() - new Date(cacheDate).getTime() < 1000 * 3600)) {
        return JSON.parse(cache);
    } else {
        const response = await fetch('/.netlify/functions/releases');
        if (response.ok) {
            const data = await response.json();
            localStorage.releasesCacheDate = new Date().toISOString();
            localStorage.releasesCache = JSON.stringify(data);
            return data;
        } else {
            throw new Error(response.statusText);
        }
    }
}

function formatRelease(release: any, marked: any): Changelog {
    // Convert markdown to html
    let desc = marked.parse(release.description, { breaks: true });

    // Remove some escaping done by marked.js
    desc = desc.replace(/&quot;/g, '"').replace(/&#39;/g, "'");

    // Change titles
    desc = desc.replace(/<(\/?)h[0-9]+/g, '<$1h4').replace(/<h4>/g, '<h4 class="release-subtitle">');

    // Add links to issues
    desc = desc.replace(
        /(#([0-9]+))/g,
        '<a href="https://github.com/mistic100/Photo-Sphere-Viewer/issues/$2">$1</a>'
    );

    return {
        id: kebabCase(release.name),
        url: release.url,
        title: release.name,
        date: dateFormat.format(new Date(release.publishedAt)),
        desc: desc,
    };
}
</script>

<style lang="scss" scoped>
.release-date {
    opacity: 0.7;
    font-size: 1rem;
}

.loader {
    text-align: center;
    color: #888;
    font-size: 100px;
}

.release-link {
    float: right;

    svg {
        width: 1rem;
        height: 1rem;
    }

    &::after {
        display: none !important;
    }
}

.release-content {
    padding-left: 2rem;
}

/**
 * Loader
 * http://codepen.io/fox_hover/pen/YZxGed
 */
.spinner {
    position: relative;
    display: inline-block;
    width: 1em;
    height: 1em;
}

.spinner::before,
.spinner::after {
    content: '';
    display: block;
    position: absolute;
    border: 0.05em solid currentcolor;
    border-radius: 50%;
}

.spinner::before {
    width: 0.936em;
    height: 0.936em;
    border-top-color: rgba(33, 33, 33, 0);
    border-left-color: rgba(33, 33, 33, 0);
    top: 0;
    left: 0;
    animation: rotate-animation 1s linear 0s infinite !important;
}

.spinner::after {
    width: 0.6552em;
    height: 0.6552em;
    border-top-color: rgba(33, 33, 33, 0);
    border-left-color: rgba(33, 33, 33, 0);
    top: 0.1404em;
    left: 0.1404em;
    animation: anti-rotate-animation 0.85s linear 0s infinite !important;
}

@keyframes rotate-animation {
    0% {
        transform: rotateZ(0deg);
    }

    100% {
        transform: rotateZ(360deg);
    }
}

@keyframes anti-rotate-animation {
    0% {
        transform: rotateZ(0deg);
    }

    100% {
        transform: rotateZ(-360deg);
    }
}
</style>
