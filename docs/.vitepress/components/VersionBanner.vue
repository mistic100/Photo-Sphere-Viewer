<template>
    <v-snackbar v-model="open" timeout="-1" max-width="none">
        <span style="padding-right: 2em">
            🎉 A new version has been released since you last visited this page: <strong>{{ latestVersion }}</strong>
        </span>

        <template v-slot:actions>
            <v-btn size="small" variant="elevated" color="primary" @click="changelog()">Changelog</v-btn>
            <v-btn size="small" variant="text" icon="mdi-close-circle" aria-label="Close" @click="close()"></v-btn>
        </template>
    </v-snackbar>
</template>

<script setup lang="ts">
import { useRouter } from 'vitepress';
import { onMounted, ref } from 'vue';

const router = useRouter();
const latestVersion = ref(null);
const open = ref(false);

onMounted(async () => {
    const response = await fetch('https://registry.npmjs.org/@photo-sphere-viewer%2Fcore');
    if (response.ok) {
        const data = await response.json();
        latestVersion.value = data['dist-tags']['latest'];
        if (!localStorage.version && localStorage.announcementsCache) {
            localStorage.version = latestVersion.value;
        } else if (latestVersion.value !== localStorage.version) {
            open.value = true;
        }
    }
});

function changelog() {
    close();
    router.go('/guide/changelog');
}

function close() {
    localStorage.version = latestVersion.value;
    open.value = false;
}
</script>
