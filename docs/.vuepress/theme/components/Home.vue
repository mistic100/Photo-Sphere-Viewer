<template>
  <main
    :aria-labelledby="data.heroText !== null ? 'main-title' : null"
  >
    <div id="photosphere"></div>

    <div class="hero-container">
      <div class="hero-background"
           :class="{loaded: loaded}"
      ></div>

      <header class="hero">
        <img
          v-if="data.heroImage"
          :src="$withBase(data.heroImage)"
          :alt="data.heroAlt || 'hero'"
        >

        <div class="hero-content">
          <h1
            v-if="data.heroText !== null"
            id="main-title"
          >
            {{ data.heroText || $title || 'Hello' }}
          </h1>

          <p
            v-if="data.tagline !== null"
            class="description"
          >
            {{ data.tagline || $description || 'Welcome to your VuePress site' }}
          </p>
        </div>

        <p
          v-if="data.actionText && data.actionLink"
          class="action"
        >
          <NavLink
            class="action-button"
            :item="actionLink"
          />
        </p>
      </header>

      <div class="hero-down" v-on:click="scrollDown">
        <img src="./down.svg">
      </div>
    </div>

    <div class="home">

      <div
        v-if="data.features && data.features.length"
        class="features"
      >
        <div
          v-for="(feature, index) in data.features"
          :key="index"
          class="feature"
        >
          <h2>{{ feature.title }}</h2>
          <p>{{ feature.details }}</p>
        </div>
      </div>

      <Content class="theme-default-content custom"/>

      <div
        v-if="data.footer"
        class="footer"
      >
        {{ data.footer }}
      </div>

      <Content
        v-else
        slot-key="footer"
        class="footer"
      />
    </div>
  </main>
</template>

<script>
  import NavLink from '@theme/components/NavLink.vue'

  export default {
    name: 'Home',

    components: { NavLink },

    computed: {
      data() {
        return this.$page.frontmatter
      },

      actionLink() {
        return {
          link: this.data.actionLink,
          text: this.data.actionText
        }
      }
    },

    data: () => ({
      loaded: false,
    }),

    mounted() {
      const viewer = new PhotoSphereViewer.Viewer({
        container      : 'photosphere',
        loadingTxt     : '',
        defaultLat     : 0.1,
        autorotateDelay: 500,
        mousewheel     : false,
        navbar         : false,
      });
      viewer.setPanorama('https://photo-sphere-viewer-data.netlify.app/assets/sphere.jpg', { showLoader: false });
      viewer.once('ready', () => this.loaded = true);
    },
    methods: {
      scrollDown() {
        window.scroll({ top: window.innerHeight, left: 0, behavior: 'smooth' });
      }
    },
  }
</script>

<style lang="stylus">
  @keyframes float
    0%, 100%
      transform translateY(-3px)
    50%
      transform translateY(3px)

  #photosphere
    width 100%
    height 100vh
    position relative
    z-index 1

  .hero-container
    position absolute
    top 0
    left 0
    width 100%
    height 100vh
    z-index 2
    display flex
    justify-content center
    align-items center
    pointer-events none

    .hero-background
      position absolute
      top 0
      left 0
      width 100%
      height 100%
      background-image url(./background.jpg)
      background-position top center
      background-size cover
      opacity 1
      transition opacity .5s linear

      &.loaded
        opacity 0

    .hero-down
      position absolute
      bottom 0
      left 50%
      width 5rem
      margin-left -2.5rem
      animation float 2s linear infinite
      pointer-events auto
      cursor pointer
      opacity 1
      transition opacity .2s linear
      filter: drop-shadow(0 0 2px #000);

      &:hover
        opacity 0.6

    .hero
      text-align center
      z-index 1

      img
        max-width: 100%
        max-height 200px
        display block
        margin 1.5rem auto
        filter: drop-shadow(0 0 10px #222);

      .hero-content
        background rgba(0, 0, 0, 0.5)
        padding 1px
        border-radius 20px
        margin 1rem

      h1
        font-size 2.5rem
        color white

      h1, .description, .action
        margin 1.2rem 2rem

      .description
        font-size 1.4rem
        color #ddd

      .action-button
        display inline-block
        font-size 1.2rem
        color #fff
        background-color $accentColor
        padding 0.8rem 1.6rem
        border-radius 3rem
        transition background-color .1s ease
        box-sizing border-box
        border-bottom 1px solid darken($accentColor, 10%)
        pointer-events auto

        &:hover
          color #fff
          background-color lighten($accentColor, 10%)

  .home
    padding $navbarHeight 2rem 0
    max-width $homePageWidth
    margin 0px auto
    display block

    .features
      padding 1.2rem 0
      display flex
      flex-wrap wrap
      align-items flex-start
      align-content stretch
      justify-content space-between

    .feature
      flex-grow 1
      flex-basis 30%
      max-width 30%

      h2
        font-size 1.4rem
        font-weight 500
        border-bottom none
        padding-bottom 0
        color lighten($textColor, 10%)

      p
        color lighten($textColor, 25%)

    .theme-default-content
      margin-bottom 4rem

    .footer
      padding 2.5rem
      border-top 1px solid $borderColor
      text-align center
      color lighten($textColor, 25%)

  @media (max-width: $MQMobile)
    .home
      .features
        flex-direction column

      .feature
        max-width 100%
        padding 0 2.5rem

  @media (max-width: $MQMobileNarrow)
    .home
      padding-left 1.5rem
      padding-right 1.5rem

      .hero
        img
          max-height 210px
          margin 2rem auto 1.2rem

        h1
          font-size 2rem

        h1, .description, .action
          margin 1.2rem auto

        .description
          font-size 1.2rem

        .action-button
          font-size 1rem
          padding 0.6rem 1.2rem

      .feature
        h2
          font-size 1.25rem
</style>
