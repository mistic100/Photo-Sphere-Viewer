const pkg = require('./package');

module.exports = {
  map    : false,
  plugins: [
    require('@csstools/postcss-sass')({}),
    require('autoprefixer')({}),
    require('postcss-banner')({
      important: true,
      banner   : `Photo Sphere Viewer ${pkg.version}
@copyright 2014-2015 Jérémy Heleine
@copyright 2015-${new Date().getFullYear()} Damien "Mistic" Sorel
@licence MIT (https://opensource.org/licenses/MIT)`
    })
  ]
};
