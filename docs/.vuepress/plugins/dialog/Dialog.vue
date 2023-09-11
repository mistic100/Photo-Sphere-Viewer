<template>
    <div>
        <md-dialog :md-active.sync="showDialog">
            <md-dialog-title>{{ title }}</md-dialog-title>

            <md-dialog-content class="theme-default-content">
                <slot></slot>
            </md-dialog-content>

            <md-dialog-actions>
                <md-button class="md-primary md-raised" @click="showDialog = false">Close</md-button>
            </md-dialog-actions>
        </md-dialog>

        <md-button class="md-primary md-raised" @click="showDialog = true">{{ button }}</md-button>
    </div>
</template>

<script>
export default {
    name: 'Dialog',
    data: () => ({
        showDialog: false,
    }),
    props: {
        title: { type: String, default: '' },
        button: { type: String, default: '' },
    },
};
</script>
