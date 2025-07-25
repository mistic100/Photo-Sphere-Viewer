<template>
    <v-dialog v-model="showDialog" width="auto" scrollable class="vp-doc">
        <v-card>
            <v-card-title style="display: flex; justify-content: space-between; align-items: center;">
                {{ title }}
                <v-btn icon="mdi-close" variant="tonal" @click="showDialog = false" ></v-btn>
            </v-card-title>

            <v-card-text>
                <slot></slot>
            </v-card-text>
        </v-card>
    </v-dialog>

    <v-btn @click="showDialog = true" variant="outlined" color="primary">{{ button }}</v-btn>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
    title: string;
    button: string;
}>();

const showDialog = ref(false);
</script>
