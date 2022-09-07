<template>
  <div class="demo-gallery"><slot></slot></div>
</template>

<script>
  export default {
    name: 'Gallery',
  };
</script>

<style lang="stylus">
  .demo-gallery
    display flex
    flex-wrap wrap
    margin-top 10px
    margin-right -10px
</style>
