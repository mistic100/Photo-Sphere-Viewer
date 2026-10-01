<template>
    <VPTeamMembers size="small" :members="sponsors" />
</template>

<script setup lang="ts">
import { VPTeamMembers } from 'vitepress/theme';
import { onMounted, ref } from 'vue';
import { LocalCache } from '../theme/LocalCache';

const sponsors = ref<any[]>([]);

const props = defineProps<{
    data?: any[],
}>();

onMounted(async () => {
    const newSponsor = {
        name: 'Add your logo and link',
        org: 'become a sponsor',
        orgLink: 'https://github.com/sponsors/mistic100',
        avatar: 'images/plus-circle.svg',
    };

    if (props.data) {
        sponsors.value = [...props.data, newSponsor];
    }

    const result = await LocalCache.getOrFetch<any[]>(
        'sponsors',
        1000 * 3600,
        async () => {
            const response = await fetch('/.netlify/functions/sponsors');
            if (response.ok) {
                return await response.json();
            } else {
                return null;
            }
        }
    );

    if (result) {
        sponsors.value = [...result, newSponsor];
    }
});
</script>
