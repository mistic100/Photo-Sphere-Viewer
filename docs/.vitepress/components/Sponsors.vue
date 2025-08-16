<template>
    <VPTeamMembers size="small" :members="sponsors" />
</template>

<script setup lang="ts">
import { VPTeamMembers } from 'vitepress/theme';
import { onMounted, ref } from 'vue';

const sponsors = ref<any[]>([]);

onMounted(async () => {
    const result = await fetchSponsors();
    sponsors.value = result;
});

async function fetchSponsors(): Promise<any[]> {
    const cache = localStorage.sponsorsCache;
    const cacheDate = localStorage.sponsorsCacheDate;

    if (cache && cacheDate && (Date.now() - new Date(cacheDate).getTime() < 1000 * 3600)) {
        return JSON.parse(cache);
    } else {
        const response = await fetch('/.netlify/functions/sponsors');
        if (response.ok) {
            const data = await response.json();
            localStorage.sponsorsCacheDate = new Date().toISOString();
            localStorage.sponsorsCache = JSON.stringify(data);
            return data;
        } else {
            throw new Error(response.statusText);
        }
    }
}
</script>
