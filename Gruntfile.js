module.exports = function(grunt) {
  require('time-grunt')(grunt);
  require('jit-grunt')(grunt, {
    sasslint: 'grunt-sass-lint',
    usebanner: 'grunt-banner'
  });

  require('simple-cli')('git')(grunt);

  grunt.util.linefeed = '\n';

  // some classes have to be executed before other
  var files_in_order = grunt.file.expand([
    'src/js/PhotoSphereViewer.js',
    'src/js/PhotoSphereViewer.*.js',
    'src/js/components/PSVComponent.js',
    'src/js/components/*.js',
    'src/js/buttons/PSVNavBarButton.js',
    'src/js/buttons/*.js',
    'src/js/*.js'
  ]);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    banner: '/*!\n' +
    ' * Photo Sphere Viewer <%= grunt.option("tag") || pkg.version %>\n' +
    ' * Copyright (c) 2014-2015 Jérémy Heleine\n' +
    ' * Copyright (c) 2015-<%= grunt.template.today("yyyy") %> Damien "Mistic" Sorel\n' +
    ' * Licensed under MIT (https://opensource.org/licenses/MIT)\n' +
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
      }
    },

    /**
     * Add AMD wrapper
     */
    wrap: {
      dist: {
        src: 'dist/photo-sphere-viewer.js',
        dest: 'dist/photo-sphere-viewer.js',
        options: {
          separator: '',
          wrapper: function() {
            return grunt.file.read('src/js/.wrapper.js').replace(/\r\n/g, '\n').split(/@@js\n/);
          }
        }
      }
    },

    /**
     * Add banners
     */
    usebanner: {
      options: {
        banner: '<%= banner %>'
      },
      all: {
        src: ['dist/*.{js,css}']
      }
    },

    /**
     * Minify dist JS file
     */
    uglify: {
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
        implementation: require('node-sass'),
        sourceMap: false,
        style: 'expanded'
      },
      lib: {
        src: 'src/scss/photo-sphere-viewer.scss',
        dest: 'dist/photo-sphere-viewer.css'
      }
    },

    /**
     * Autoprefix CSS
     */
    postcss: {
      options: {
        processors: [
          require('autoprefixer')({ browsers: 'last 2 versions, ie >= 11' })
        ]
      },
      lib: {
        src: 'dist/photo-sphere-viewer.css'
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
        src: ['src/js/**/*.js']
      },
      grunt: {
        src: ['Gruntfile.js']
      }
    },

    /**
     * SCSSLint test on src files
     */
    sasslint: {
      options: {
        configFile: '.sass-lint.yml'
      },
      lib: {
        src: ['src/scss/**/*.scss']
      }
    },

    /**
     * Copy doc custom script
     */
    copy: {
      doc_script: {
        src: 'build/jsdoc.js',
        dest: 'doc/js/custom.js'
      }
    },

    /**
     * Clean doc
     */
    clean: {
      doc: ['doc']
    },

    /**
     * jsDoc generation
     */
    jsdoc: {
      lib: {
        src: ['src/js/**/*.js', '!src/js/.wrapper.js', '!src/js/lib/*.js'],
        options: {
          destination: 'doc',
          config: '.jsdoc.json'
        }
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
          host: '0.0.0.0',
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
        path: 'http://localhost:<%= connect.dev.options.port%>/example/equirectangular.html'
      }
    },

    /**
     * Release tasks
     */
    git: {
      checkout: {
        args: ['master']
      },

      merge: {
        args: ['dev'],
        options: {
          'strategy-option': 'theirs',
          'm': 'Release <%= grunt.option("tag") %>'
        }
      },

      commit: {
        options: {
          'a': true,
          'amend': true,
          'no-edit': true
        }
      },

      tag: {
        args: ['<%= grunt.option("tag") %>']
      }
    }
  });

  grunt.registerTask('updatePackage', 'Update version in package.json', function() {
    var pkg = grunt.file.readJSON('package.json');
    pkg.version = grunt.option('tag');
    grunt.file.write('package.json', JSON.stringify(pkg, null, 2) + '\n');
  });

  /**
   * Build the lib
   */
  grunt.registerTask('build', [
    'concat',
    'wrap',
    'uglify',
    'sass',
    'postcss',
    'cssmin',
    'usebanner'
  ]);

  /**
   * Run tests
   */
  grunt.registerTask('test', [
    'jshint',
    'jscs',
    'sasslint',
    'mochaTest'
  ]);

  /**
   * Development server
   */
  grunt.registerTask('serve', [
    'default',
    'connect',
    'open',
    'watch'
  ]);

  /**
   * Documentation
   */
  grunt.registerTask('doc', [
    'clean:doc',
    'jsdoc',
    'copy:doc_script'
  ]);

  /**
   * Release
   */
  grunt.registerTask('release', [
    'git:checkout',
    'git:merge',
    'updatePackage',
    'build',
    'git:commit',
    'git:tag'
  ]);

  grunt.registerTask('default', ['build']);
};
