module.exports = function(grunt) {
  require('time-grunt')(grunt);
  require('jit-grunt')(grunt, {
    scsslint: 'grunt-scss-lint'
  });

  grunt.util.linefeed = '\n';

  // some classes have to be executed before other
  var files_in_order = grunt.file.expand([
    'src/js/PhotoSphereViewer.js',
    'src/js/PhotoSphereViewer.*.js',
    'src/js/components/PSVComponent.js',
    'src/js/components/*.js',
    'src/js/buttons/PSVNavBarButton.js',
    'src/js/buttons/*.js',
    'src/js/*.js',
    'src/js/lib/*.js'
  ]);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    banner:
      '/*!\n' +
      ' * Photo Sphere Viewer <%= pkg.version %>\n' +
      ' * Copyright (c) 2014-2015 Jérémy Heleine\n' +
      ' * Copyright (c) 2015-<%= grunt.template.today("yyyy") %> Damien "Mistic" Sorel\n' +
      ' * Licensed under MIT (http://opensource.org/licenses/MIT)\n' +
      ' */',

    concat: {
      /**
       * Concatenate src JS + SVG files to dist
       */
      js: {
        options: {
          stripBanners: false,
          separator: '\n\n',
          process: function(src, path) {
            if (path.match(/\.svg$/)) {
              var filename = path.split('/').pop();
              src = src.replace(/[\r\n]/g, '');
              return 'PhotoSphereViewer.ICONS[\'' + filename + '\'] = \'' + src + '\';';
            }
            else {
              return src;
            }
          }
        },
        src: files_in_order.concat(['src/icons/*.svg']),
        dest: 'dist/photo-sphere-viewer.js'
      },
      /**
       * Add banner to generated CSS files
       */
      css: {
        options: {
          banner: '<%= banner %>\n\n'
        },
        files: [{
          expand: true,
          src: 'dist/*.css',
          dest: ''
        }]
      }
    },

    /**
     * Add AMD wrapper and banner to dist JS file
     */
    wrap: {
      dist: {
        src: 'dist/photo-sphere-viewer.js',
        dest: '',
        options: {
          separator: '',
          wrapper: function() {
            var wrapper = grunt.file.read('src/js/.wrapper.js').replace(/\r\n/g, '\n').split(/@@js\n/);
            wrapper[0] = grunt.template.process('<%= banner %>\n\n') + wrapper[0];
            wrapper[1] = '\n' + wrapper[1];
            return wrapper;
          }
        }
      }
    },

    /**
     * Minify dist JS file
     */
    uglify: {
      options: {
        banner: '<%= banner %>\n\n'
      },
      dist: {
        src: 'dist/photo-sphere-viewer.js',
        dest: 'dist/photo-sphere-viewer.min.js'
      }
    },

    /**
     * Generate dist CSS from src SCSS
     */
    sass: {
      options: {
        sourcemap: 'none',
        style: 'expanded'
      },
      lib: {
        src: 'src/scss/photo-sphere-viewer.scss',
        dest: 'dist/photo-sphere-viewer.css'
      }
    },

    /**
     * Minify dist CSS file
     */
    cssmin: {
      dist: {
        src: 'dist/photo-sphere-viewer.css',
        dest: 'dist/photo-sphere-viewer.min.css'
      }
    },

    /**
     * JSHint tests on src files
     */
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      lib: {
        src: ['src/js/**/*.js']
      },
      grunt: {
        src: ['Gruntfile.js']
      }
    },

    /**
     * JSCS test on src files
     */
    jscs: {
      options: {
        config: '.jscsrc'
      },
      lib: {
        src: ['src/js/**/*.js', '!src/js/lib/requestAnimationFrame.js']
      },
      grunt: {
        src: ['Gruntfile.js']
      }
    },

    /**
     * SCSSLint test on src files
     */
    scsslint: {
      options: {
        colorizeOutput: true,
        config: '.scss-lint.yml'
      },
      lib: {
        src: ['src/scss/**/*.scss']
      }
    },

    /**
     * Mocha unit tests
     */
    mochaTest: {
      options: {
        log: true
      },
      lib: {
        src: ['tests/utils/*.js']
      }
    },

    /**
     * Serve des content on localhost:9000
     */
    connect: {
      dev: {
        options: {
          port: 9000
        }
      }
    },

    /**
     * Rebuild lib and refresh server on files change
     */
    watch: {
      src: {
        files: ['src/**'],
        tasks: ['default'],
        options: {
          livereload: true
        }
      },
      example: {
        files: ['example/**'],
        tasks: [],
        options: {
          livereload: true
        }
      }
    },

    /**
     * Open the example page on the server
     */
    open: {
      dev: {
        path: 'http://localhost:<%= connect.dev.options.port%>/example/index.htm'
      }
    }
  });

  /**
   * Build the lib
   */
  grunt.registerTask('default', [
    'concat:js',
    'wrap',
    'uglify',
    'sass',
    'cssmin',
    'concat:css'
  ]);

  /**
   * Run tests
   */
  grunt.registerTask('test', [
    'jshint',
    'jscs',
    'scsslint',
    'mochaTest'
  ]);

  /**
   * Development server
   */
  grunt.registerTask('server', [
    'default',
    'connect',
    'open',
    'watch'
  ]);
};
