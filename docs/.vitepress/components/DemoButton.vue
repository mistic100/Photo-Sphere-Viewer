<template>
    <v-btn :href="href">
        <v-icon icon="mdi-play" start/>
        Check the demo
    </v-btn>
</template>

<script setup lang="ts">
const { href } = defineProps<{
    href: string;
}>();
</script>

<style>
a.v-btn {
    text-decoration: none;
}
</style>
