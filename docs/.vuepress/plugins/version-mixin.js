const pkg = require('../../../package');

export default {
  mounted () {
    setTimeout(() => {
      const titleElt = document.querySelector('.site-name');
      titleElt.innerHTML+= ` <small class="md-badge md-primary md-square md-theme-default">${pkg.version}</small>`;
    });
  }
}
