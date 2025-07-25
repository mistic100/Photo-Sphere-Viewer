<template>
    <v-btn :href="href" color="primary">
        <v-icon icon="mdi-play" start/>
        Check the demo
    </v-btn>
</template>

<script setup lang="ts">
const { href } = defineProps<{
    href: string;
}>();
</script>

<style scoped>
a.v-btn {
    text-decoration: none;
    margin-right: 1em;
}
</style>
