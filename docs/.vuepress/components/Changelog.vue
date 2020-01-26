<template>
  <div>
    <div v-if="showLoader" class="loader">
      <span class="spinner"></span>
    </div>

    <template v-for="entry in changelog">
      <h2 v-bind:id="entry.id">
        <a v-bind:href="'#' + entry.id" class="header-anchor">#</a>
        {{entry.title}}
        <small class="release-date">{{entry.date}}</small>

        <a v-bind:href="entry.url" class="release-link">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path fill="currentColor" d="M50 19.2V4.8C50 2.1 47.9 0 45.2 0H30.8c-1.3 0-2.5.5-3.4 1.4l-26 26a4.6 4.6 0 0 0 0 6.6L16 48.7a4.6 4.6 0 0 0 6.5 0l26-26.1c1-.9 1.5-2 1.5-3.4zm-11.2-8a3.5 3.5 0 1 1 4.9-4.9 3.5 3.5 0 0 1-4.9 4.9z"/></svg>
        </a>
      </h2>
      <div v-html="entry.desc"></div>
    </template>
  </div>
</template>

<script>
  const axios = require('axios');
  const marked = require('marked');
  const { format, parseISO } = require('date-fns');

  export default {
    data() {
      return {
        showLoader: true,
        changelog : [],
      };
    },
    mounted() {
      this.fetchReleases()
        .then(releases => {
          this.changelog = releases.data.map(this.formatRelease);
          this.showLoader = false;
        });
    },
    methods: {
      fetchReleases() {
        const cacheDate = localStorage.releasesCacheDate;

        if (cacheDate && (new Date() - new Date(cacheDate)) < 1000 * 3600) {
          return Promise.resolve(JSON.parse(localStorage.releasesCache));
        } else {
          return axios('https://api.github.com/repos/mistic100/Photo-Sphere-Viewer/releases')
            .then(function (data) {
              localStorage.releasesCacheDate = new Date().toString();
              localStorage.releasesCache = JSON.stringify(data);
              return data;
            });
        }
      },
      formatRelease(release) {
        // Convert markdown to html
        let desc = marked(release.body, { breaks: true });

        // Remove some escaping done by marked.js
        desc = desc.replace(/&quot;/g, '"').replace(/&#39;/g, "'");

        // Change titles
        desc = desc.replace(/<(\/?)h[0-9]+/g, '<$1h4').replace(/<h4 id=".*?">/g, '<h4>');

        // Add links to issues
        desc = desc.replace(/(#([0-9]+))/g, '<a href="https://github.com/mistic100/Photo-Sphere-Viewer/issues/$2">$1</a>');

        return {
          id   : release.id,
          url  : release.html_url,
          title: release.name,
          date : format(parseISO(release.published_at), 'PPP'),
          desc : desc,
        };
      }
    }
  }
</script>

<style>
  .release-date {
    color: #999;
    font-size: 1rem;
  }

  .loader {
    text-align: center;
    color: #888;
    font-size: 100px;
  }

  .release-link {
    float: right;
  }
  .release-link svg {
    width: 1rem;
    height: 1rem;
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

  .spinner::before, .spinner::after {
    content: "";
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
    -webkit-animation: rotate-animation 1s linear 0s infinite;
    animation: rotate-animation 1s linear 0s infinite;
  }

  .spinner::after {
    width: 0.6552em;
    height: 0.6552em;
    border-top-color: rgba(33, 33, 33, 0);
    border-left-color: rgba(33, 33, 33, 0);
    top: 0.1404em;
    left: 0.1404em;
    -webkit-animation: anti-rotate-animation 0.85s linear 0s infinite;
    animation: anti-rotate-animation 0.85s linear 0s infinite;
  }

  @-webkit-keyframes rotate-animation {
    0% {
      -webkit-transform: rotateZ(0deg);
      transform: rotateZ(0deg);
    }
    100% {
      -webkit-transform: rotateZ(360deg);
      transform: rotateZ(360deg);
    }
  }

  @keyframes rotate-animation {
    0% {
      -webkit-transform: rotateZ(0deg);
      transform: rotateZ(0deg);
    }
    100% {
      -webkit-transform: rotateZ(360deg);
      transform: rotateZ(360deg);
    }
  }

  @-webkit-keyframes anti-rotate-animation {
    0% {
      -webkit-transform: rotateZ(0deg);
      transform: rotateZ(0deg);
    }
    100% {
      -webkit-transform: rotateZ(-360deg);
      transform: rotateZ(-360deg);
    }
  }

  @keyframes anti-rotate-animation {
    0% {
      -webkit-transform: rotateZ(0deg);
      transform: rotateZ(0deg);
    }
    100% {
      -webkit-transform: rotateZ(-360deg);
      transform: rotateZ(-360deg);
    }
  }
</style>
