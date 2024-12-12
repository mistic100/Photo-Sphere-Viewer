// ../../build/tsup.config.ts
import { sassPlugin } from "esbuild-sass-plugin";
import { defineConfig } from "tsup";

// ../../build/plugins/esbuild-plugin-assets.ts
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import prettyBytes from "pretty-bytes";
function assetsPlugin(files) {
  return {
    name: "assets",
    setup(build) {
      if (build.initialOptions.format !== "esm") {
        return;
      }
      build.onEnd(() => {
        const outdir = build.initialOptions.outdir;
        return mkdir(path.resolve(outdir), { recursive: true }).then(
          () => Promise.all(
            Object.entries(files).map(([filename, contentOrPromise]) => {
              const outpath = outdir + "/" + filename;
              return Promise.resolve(contentOrPromise).then((content) => {
                console.log("ASSET", outpath, prettyBytes(content.length));
                return writeFile(outpath, content);
              });
            })
          )
        ).then(() => void 0);
      });
    }
  };
}

// ../../build/plugins/esbuild-plugin-budget.ts
import chalk from "chalk";
function budgetPlugin(budget) {
  if (!budget || !budget.endsWith("kb")) {
    throw new Error("Missing/invalid budget");
  }
  const maxsize = 1024 * parseInt(budget, 10);
  return {
    name: "budget",
    setup(build) {
      build.onEnd((result) => {
        ["index.cjs", "index.module.js"].forEach((filename) => {
          const file = result.outputFiles.find((f) => f.path.endsWith(filename));
          if (file) {
            if (file.contents.length > maxsize) {
              const size = Math.round(file.contents.length / 1024);
              throw chalk.red(`File ${filename} exceeds budget of ${budget}, current size: ${size}kb`);
            }
          }
        });
      });
    }
  };
}

// ../../build/plugins/esbuild-plugin-map-fix.ts
import { basename } from "path";
function mapFixPlugin() {
  return {
    name: "mapFix",
    setup(build) {
      build.onEnd((result) => {
        ["index.css.map", "index.cjs.map", "index.module.js.map"].forEach((filename) => {
          const mapFile = result.outputFiles.find((f) => f.path.endsWith(filename));
          if (!mapFile) {
            return;
          }
          console.log("MAP", `Fix ${basename(mapFile.path)}`);
          const content = JSON.parse(mapFile.text);
          content.sources = content.sources.map((src) => {
            return src.replace("../src", "src").replace("../../shared", "../shared").replace("../../../node_modules", "../node_modules");
          });
          mapFile.contents = Buffer.from(JSON.stringify(content));
        });
      });
    }
  };
}

// ../../build/templates/license.ts
import { readFile } from "fs/promises";
import path2 from "path";
var __injected_dirname__ = "/home/damiensorel@sglk.local/mistic/Photo-Sphere-Viewer/build/templates";
var license = () => readFile(path2.join(__injected_dirname__, "../../LICENSE"), { encoding: "utf8" });

// ../../build/templates/npmrc.ts
var npmrc = () => `@photo-sphere-viewer:registry=https://registry.npmjs.org
//registry.npmjs.org/:_authToken=\${NODE_AUTH_TOKEN}
`;

// ../../build/templates/package.ts
import _ from "lodash";
import sortPackageJson, { sortOrder } from "sort-package-json";
sortOrder.splice(sortOrder.indexOf("style") + 1, 0, "sass");
var packageJson = (pkg) => {
  const content = {
    ...pkg,
    main: "index.cjs",
    module: "index.module.js",
    types: "index.d.ts",
    exports: {
      ".": {
        import: "./index.module.js",
        require: "./index.cjs"
      }
    },
    license: "MIT",
    repository: {
      type: "git",
      url: "git://github.com/mistic100/Photo-Sphere-Viewer.git"
    },
    author: {
      name: `Damien 'Mistic' Sorel`,
      email: "contact@git.strangeplanet.fr",
      homepage: "https://www.strangeplanet.fr"
    },
    keywords: ["photosphere", "panorama", "threejs", ...pkg.keywords || []],
    dependencies: _.pickBy(pkg.dependencies, (val, key) => !key.startsWith("@photo-sphere-viewer")),
    peerDependencies: _.pickBy(pkg.dependencies, (val, key) => key.startsWith("@photo-sphere-viewer"))
  };
  if (pkg.psv.style) {
    content.style = "index.css";
    content.sass = "index.scss";
  }
  if (pkg.name === "@photo-sphere-viewer/core") {
    content.contributors = [
      {
        name: "J\xE9r\xE9my Heleine",
        email: "jeremy.heleine@gmail.com",
        homepage: "https://jeremyheleine.me"
      }
    ];
  }
  delete content.devDependencies;
  delete content.psv;
  delete content.scripts;
  return JSON.stringify(sortPackageJson(content), null, 2);
};

// ../../build/templates/readme.ts
var readme = (pkg) => `# ${pkg.psv.title}

[![NPM version](https://img.shields.io/npm/v/${pkg.name}?logo=npm)](https://www.npmjs.com/package/${pkg.name})
[![NPM Downloads](https://img.shields.io/npm/dm/${pkg.name}?color=f86036&label=npm&logo=npm)](https://www.npmjs.com/package/${pkg.name})
[![jsDelivr Hits](https://img.shields.io/jsdelivr/npm/hm/${pkg.name}?color=%23f86036&logo=jsdelivr)](https://www.jsdelivr.com/package/npm/${pkg.name})

${pkg.description}

## Documentation

${pkg.homepage}

## License

This library is available under the MIT license.
`;

// ../../build/tsup.config.ts
function createConfig(pkg) {
  const banner = `/*!
 * ${pkg.psv.title} ${pkg.version}
${pkg.name === "@photo-sphere-viewer/core" ? " * @copyright 2014-2015 J\xE9r\xE9my Heleine\n" : ""} * @copyright 2015-${(/* @__PURE__ */ new Date()).getFullYear()} Damien "Mistic" Sorel
 * @licence MIT (https://opensource.org/licenses/MIT)
 */`;
  return defineConfig((options) => {
    const e2e = options.env?.E2E;
    const dev = e2e || options.watch;
    const plugins = [
      sassPlugin()
    ];
    if (!e2e) {
      plugins.push(
        mapFixPlugin()
      );
    }
    if (!dev) {
      plugins.push(
        budgetPlugin(pkg.psv.budget),
        // scssBundlePlugin(),
        assetsPlugin({
          "LICENSE": license(),
          ".npmrc": npmrc(),
          "README.md": readme(pkg),
          "package.json": packageJson(pkg)
        })
      );
    }
    return {
      entryPoints: [pkg.main],
      outDir: "dist",
      clean: true,
      format: dev ? ["esm"] : ["esm", "cjs"],
      outExtension: ({ format }) => ({
        js: { cjs: ".cjs", esm: ".module.js", iife: ".js" }[format]
      }),
      dts: !dev,
      sourcemap: true,
      external: ["three"],
      noExternal: [/three\/examples\/.*/],
      target: "es2021",
      define: {
        PKG_VERSION: `'${pkg.version}'`
      },
      loader: {
        ".svg": "text",
        ".glsl": "text"
      },
      banner: {
        js: banner,
        css: banner
      },
      esbuildPlugins: plugins
    };
  });
}

// package.json
var package_default = {
  name: "@photo-sphere-viewer/visible-range-plugin",
  version: "0.0.0",
  description: "Photo Sphere Viewer plugin to lock the visible angles.",
  homepage: "https://photo-sphere-viewer.js.org/plugins/visible-range.html",
  license: "MIT",
  main: "./src/index.ts",
  types: "./src/index.ts",
  dependencies: {
    "@photo-sphere-viewer/core": "0.0.0"
  },
  scripts: {
    build: "tsup",
    watch: "tsup --watch",
    instrument: "nyc instrument dist/index.module.js .",
    lint: "tsc --noEmit && eslint . --fix",
    "publish-dist": "cd dist && npm publish --tag=$NPM_TAG --access=public",
    "npm-link": "cd dist && npm link"
  },
  psv: {
    title: "Photo Sphere Viewer / Visible Range Plugin",
    budget: "20kb"
  }
};

// tsup.config.ts
var tsup_config_default = createConfig(package_default);
export {
  tsup_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vYnVpbGQvdHN1cC5jb25maWcudHMiLCAiLi4vLi4vYnVpbGQvcGx1Z2lucy9lc2J1aWxkLXBsdWdpbi1hc3NldHMudHMiLCAiLi4vLi4vYnVpbGQvcGx1Z2lucy9lc2J1aWxkLXBsdWdpbi1idWRnZXQudHMiLCAiLi4vLi4vYnVpbGQvcGx1Z2lucy9lc2J1aWxkLXBsdWdpbi1tYXAtZml4LnRzIiwgIi4uLy4uL2J1aWxkL3RlbXBsYXRlcy9saWNlbnNlLnRzIiwgIi4uLy4uL2J1aWxkL3RlbXBsYXRlcy9ucG1yYy50cyIsICIuLi8uLi9idWlsZC90ZW1wbGF0ZXMvcGFja2FnZS50cyIsICIuLi8uLi9idWlsZC90ZW1wbGF0ZXMvcmVhZG1lLnRzIiwgInBhY2thZ2UuanNvbiIsICJ0c3VwLmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX19pbmplY3RlZF9maWxlbmFtZV9fID0gXCIvaG9tZS9kYW1pZW5zb3JlbEBzZ2xrLmxvY2FsL21pc3RpYy9QaG90by1TcGhlcmUtVmlld2VyL2J1aWxkL3RzdXAuY29uZmlnLnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9ob21lL2RhbWllbnNvcmVsQHNnbGsubG9jYWwvbWlzdGljL1Bob3RvLVNwaGVyZS1WaWV3ZXIvYnVpbGRcIjtjb25zdCBfX2luamVjdGVkX2ltcG9ydF9tZXRhX3VybF9fID0gXCJmaWxlOi8vL2hvbWUvZGFtaWVuc29yZWxAc2dsay5sb2NhbC9taXN0aWMvUGhvdG8tU3BoZXJlLVZpZXdlci9idWlsZC90c3VwLmNvbmZpZy50c1wiO2ltcG9ydCB0eXBlIHsgUGx1Z2luIH0gZnJvbSAnZXNidWlsZCc7XG5pbXBvcnQgeyBzYXNzUGx1Z2luIH0gZnJvbSAnZXNidWlsZC1zYXNzLXBsdWdpbic7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd0c3VwJztcbmltcG9ydCB7IGFzc2V0c1BsdWdpbiB9IGZyb20gJy4vcGx1Z2lucy9lc2J1aWxkLXBsdWdpbi1hc3NldHMnO1xuaW1wb3J0IHsgYnVkZ2V0UGx1Z2luIH0gZnJvbSAnLi9wbHVnaW5zL2VzYnVpbGQtcGx1Z2luLWJ1ZGdldCc7XG4vLyBpbXBvcnQgeyBpc3RhbmJ1bFBsdWdpbiB9IGZyb20gJy4vcGx1Z2lucy9lc2J1aWxkLXBsdWdpbi1pc3RhbmJ1bCc7XG5pbXBvcnQgeyBtYXBGaXhQbHVnaW4gfSBmcm9tICcuL3BsdWdpbnMvZXNidWlsZC1wbHVnaW4tbWFwLWZpeCc7XG5pbXBvcnQgeyBzY3NzQnVuZGxlUGx1Z2luIH0gZnJvbSAnLi9wbHVnaW5zL2VzYnVpbGQtcGx1Z2luLXNjc3MtYnVuZGxlJztcbmltcG9ydCB7IGxpY2Vuc2UgfSBmcm9tICcuL3RlbXBsYXRlcy9saWNlbnNlJztcbmltcG9ydCB7IG5wbXJjIH0gZnJvbSAnLi90ZW1wbGF0ZXMvbnBtcmMnO1xuaW1wb3J0IHsgcGFja2FnZUpzb24gfSBmcm9tICcuL3RlbXBsYXRlcy9wYWNrYWdlJztcbmltcG9ydCB7IHJlYWRtZSB9IGZyb20gJy4vdGVtcGxhdGVzL3JlYWRtZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZUNvbmZpZyhwa2c6IGFueSkge1xuICAgIGNvbnN0IGJhbm5lciA9IGAvKiFcbiAqICR7cGtnLnBzdi50aXRsZX0gJHtwa2cudmVyc2lvbn1cbiR7XG4gICAgcGtnLm5hbWUgPT09ICdAcGhvdG8tc3BoZXJlLXZpZXdlci9jb3JlJyA/ICcgKiBAY29weXJpZ2h0IDIwMTQtMjAxNSBKXHUwMEU5clx1MDBFOW15IEhlbGVpbmVcXG4nIDogJydcbn0gKiBAY29weXJpZ2h0IDIwMTUtJHtuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCl9IERhbWllbiBcIk1pc3RpY1wiIFNvcmVsXG4gKiBAbGljZW5jZSBNSVQgKGh0dHBzOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUKVxuICovYDtcblxuICAgIHJldHVybiBkZWZpbmVDb25maWcoKG9wdGlvbnMpID0+IHtcbiAgICAgICAgY29uc3QgZTJlID0gb3B0aW9ucy5lbnY/LkUyRTtcbiAgICAgICAgY29uc3QgZGV2ID0gZTJlIHx8IG9wdGlvbnMud2F0Y2g7XG5cbiAgICAgICAgY29uc3QgcGx1Z2luczogUGx1Z2luW10gPSBbXG4gICAgICAgICAgICBzYXNzUGx1Z2luKCksXG4gICAgICAgIF07XG5cbiAgICAgICAgaWYgKCFlMmUpIHtcbiAgICAgICAgICAgIHBsdWdpbnMucHVzaChcbiAgICAgICAgICAgICAgICBtYXBGaXhQbHVnaW4oKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWRldikge1xuICAgICAgICAgICAgcGx1Z2lucy5wdXNoKFxuICAgICAgICAgICAgICAgIGJ1ZGdldFBsdWdpbihwa2cucHN2LmJ1ZGdldCksXG4gICAgICAgICAgICAgICAgLy8gc2Nzc0J1bmRsZVBsdWdpbigpLFxuICAgICAgICAgICAgICAgIGFzc2V0c1BsdWdpbih7XG4gICAgICAgICAgICAgICAgICAgICdMSUNFTlNFJzogbGljZW5zZSgpLFxuICAgICAgICAgICAgICAgICAgICAnLm5wbXJjJzogbnBtcmMoKSxcbiAgICAgICAgICAgICAgICAgICAgJ1JFQURNRS5tZCc6IHJlYWRtZShwa2cpLFxuICAgICAgICAgICAgICAgICAgICAncGFja2FnZS5qc29uJzogcGFja2FnZUpzb24ocGtnKSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZW50cnlQb2ludHM6IFtwa2cubWFpbl0sXG4gICAgICAgICAgICBvdXREaXI6ICdkaXN0JyxcbiAgICAgICAgICAgIGNsZWFuOiB0cnVlLFxuICAgICAgICAgICAgZm9ybWF0OiBkZXYgPyBbJ2VzbSddIDogWydlc20nLCAnY2pzJ10sXG4gICAgICAgICAgICBvdXRFeHRlbnNpb246ICh7IGZvcm1hdCB9KSA9PiAoe1xuICAgICAgICAgICAgICAgIGpzOiB7IGNqczogJy5janMnLCBlc206ICcubW9kdWxlLmpzJywgaWlmZTogJy5qcycgfVtmb3JtYXRdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBkdHM6ICFkZXYsXG4gICAgICAgICAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgICAgICAgICBleHRlcm5hbDogWyd0aHJlZSddLFxuICAgICAgICAgICAgbm9FeHRlcm5hbDogWy90aHJlZVxcL2V4YW1wbGVzXFwvLiovXSxcbiAgICAgICAgICAgIHRhcmdldDogJ2VzMjAyMScsXG4gICAgICAgICAgICBkZWZpbmU6IHtcbiAgICAgICAgICAgICAgICBQS0dfVkVSU0lPTjogYCcke3BrZy52ZXJzaW9ufSdgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvYWRlcjoge1xuICAgICAgICAgICAgICAgICcuc3ZnJzogJ3RleHQnLFxuICAgICAgICAgICAgICAgICcuZ2xzbCc6ICd0ZXh0JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYW5uZXI6IHtcbiAgICAgICAgICAgICAgICBqczogYmFubmVyLFxuICAgICAgICAgICAgICAgIGNzczogYmFubmVyLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVzYnVpbGRQbHVnaW5zOiBwbHVnaW5zLFxuICAgICAgICB9O1xuICAgIH0pO1xufVxuIiwgImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL2hvbWUvZGFtaWVuc29yZWxAc2dsay5sb2NhbC9taXN0aWMvUGhvdG8tU3BoZXJlLVZpZXdlci9idWlsZC9wbHVnaW5zL2VzYnVpbGQtcGx1Z2luLWFzc2V0cy50c1wiO2NvbnN0IF9faW5qZWN0ZWRfZGlybmFtZV9fID0gXCIvaG9tZS9kYW1pZW5zb3JlbEBzZ2xrLmxvY2FsL21pc3RpYy9QaG90by1TcGhlcmUtVmlld2VyL2J1aWxkL3BsdWdpbnNcIjtjb25zdCBfX2luamVjdGVkX2ltcG9ydF9tZXRhX3VybF9fID0gXCJmaWxlOi8vL2hvbWUvZGFtaWVuc29yZWxAc2dsay5sb2NhbC9taXN0aWMvUGhvdG8tU3BoZXJlLVZpZXdlci9idWlsZC9wbHVnaW5zL2VzYnVpbGQtcGx1Z2luLWFzc2V0cy50c1wiO2ltcG9ydCB0eXBlIHsgUGx1Z2luIH0gZnJvbSAnZXNidWlsZCc7XG5pbXBvcnQgeyBta2Rpciwgd3JpdGVGaWxlIH0gZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgcHJldHR5Qnl0ZXMgZnJvbSAncHJldHR5LWJ5dGVzJztcblxuLyoqXG4gKiBHZW5lcmF0ZXMgc3RhdGljIGZpbGVzIGluIG91dHB1dCBkaXJlY3RvcnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2V0c1BsdWdpbihmaWxlczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgUHJvbWlzZTxzdHJpbmc+Pik6IFBsdWdpbiB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogJ2Fzc2V0cycsXG4gICAgICAgIHNldHVwKGJ1aWxkKSB7XG4gICAgICAgICAgICBpZiAoYnVpbGQuaW5pdGlhbE9wdGlvbnMuZm9ybWF0ICE9PSAnZXNtJykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYnVpbGQub25FbmQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG91dGRpciA9IGJ1aWxkLmluaXRpYWxPcHRpb25zLm91dGRpcjtcblxuICAgICAgICAgICAgICAgIHJldHVybiBta2RpcihwYXRoLnJlc29sdmUob3V0ZGlyKSwgeyByZWN1cnNpdmU6IHRydWUgfSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UuYWxsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5lbnRyaWVzKGZpbGVzKS5tYXAoKFtmaWxlbmFtZSwgY29udGVudE9yUHJvbWlzZV0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3V0cGF0aCA9IG91dGRpciArICcvJyArIGZpbGVuYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbnRlbnRPclByb21pc2UpLnRoZW4oKGNvbnRlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBU1NFVCcsIG91dHBhdGgsIHByZXR0eUJ5dGVzKGNvbnRlbnQubGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gd3JpdGVGaWxlKG91dHBhdGgsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG4iLCAiY29uc3QgX19pbmplY3RlZF9maWxlbmFtZV9fID0gXCIvaG9tZS9kYW1pZW5zb3JlbEBzZ2xrLmxvY2FsL21pc3RpYy9QaG90by1TcGhlcmUtVmlld2VyL2J1aWxkL3BsdWdpbnMvZXNidWlsZC1wbHVnaW4tYnVkZ2V0LnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9ob21lL2RhbWllbnNvcmVsQHNnbGsubG9jYWwvbWlzdGljL1Bob3RvLVNwaGVyZS1WaWV3ZXIvYnVpbGQvcGx1Z2luc1wiO2NvbnN0IF9faW5qZWN0ZWRfaW1wb3J0X21ldGFfdXJsX18gPSBcImZpbGU6Ly8vaG9tZS9kYW1pZW5zb3JlbEBzZ2xrLmxvY2FsL21pc3RpYy9QaG90by1TcGhlcmUtVmlld2VyL2J1aWxkL3BsdWdpbnMvZXNidWlsZC1wbHVnaW4tYnVkZ2V0LnRzXCI7aW1wb3J0IHR5cGUgeyBQbHVnaW4gfSBmcm9tICdlc2J1aWxkJztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5cbi8qKlxuICogQ2hlY2tzIHRoZSBmaW5hbCBidW5kbGUgc2l6ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVkZ2V0UGx1Z2luKGJ1ZGdldDogc3RyaW5nKTogUGx1Z2luIHtcbiAgICBpZiAoIWJ1ZGdldCB8fCAhYnVkZ2V0LmVuZHNXaXRoKCdrYicpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZy9pbnZhbGlkIGJ1ZGdldCcpO1xuICAgIH1cblxuICAgIGNvbnN0IG1heHNpemUgPSAxMDI0ICogcGFyc2VJbnQoYnVkZ2V0LCAxMCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiAnYnVkZ2V0JyxcbiAgICAgICAgc2V0dXAoYnVpbGQpIHtcbiAgICAgICAgICAgIGJ1aWxkLm9uRW5kKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICBbJ2luZGV4LmNqcycsICdpbmRleC5tb2R1bGUuanMnXS5mb3JFYWNoKChmaWxlbmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gcmVzdWx0Lm91dHB1dEZpbGVzLmZpbmQoZiA9PiBmLnBhdGguZW5kc1dpdGgoZmlsZW5hbWUpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWxlLmNvbnRlbnRzLmxlbmd0aCA+IG1heHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzaXplID0gTWF0aC5yb3VuZChmaWxlLmNvbnRlbnRzLmxlbmd0aCAvIDEwMjQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGNoYWxrLnJlZChgRmlsZSAke2ZpbGVuYW1lfSBleGNlZWRzIGJ1ZGdldCBvZiAke2J1ZGdldH0sIGN1cnJlbnQgc2l6ZTogJHtzaXplfWtiYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG4iLCAiY29uc3QgX19pbmplY3RlZF9maWxlbmFtZV9fID0gXCIvaG9tZS9kYW1pZW5zb3JlbEBzZ2xrLmxvY2FsL21pc3RpYy9QaG90by1TcGhlcmUtVmlld2VyL2J1aWxkL3BsdWdpbnMvZXNidWlsZC1wbHVnaW4tbWFwLWZpeC50c1wiO2NvbnN0IF9faW5qZWN0ZWRfZGlybmFtZV9fID0gXCIvaG9tZS9kYW1pZW5zb3JlbEBzZ2xrLmxvY2FsL21pc3RpYy9QaG90by1TcGhlcmUtVmlld2VyL2J1aWxkL3BsdWdpbnNcIjtjb25zdCBfX2luamVjdGVkX2ltcG9ydF9tZXRhX3VybF9fID0gXCJmaWxlOi8vL2hvbWUvZGFtaWVuc29yZWxAc2dsay5sb2NhbC9taXN0aWMvUGhvdG8tU3BoZXJlLVZpZXdlci9idWlsZC9wbHVnaW5zL2VzYnVpbGQtcGx1Z2luLW1hcC1maXgudHNcIjtpbXBvcnQgdHlwZSB7IFBsdWdpbiB9IGZyb20gJ2VzYnVpbGQnO1xuaW1wb3J0IHsgYmFzZW5hbWUgfSBmcm9tICdwYXRoJztcblxuLyoqXG4gKiBBbHRlcnMgdGhlIHBhdGhzIGluIG1hcHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcEZpeFBsdWdpbigpOiBQbHVnaW4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6ICdtYXBGaXgnLFxuICAgICAgICBzZXR1cChidWlsZCkge1xuICAgICAgICAgICAgYnVpbGQub25FbmQoKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIFsnaW5kZXguY3NzLm1hcCcsICdpbmRleC5janMubWFwJywgJ2luZGV4Lm1vZHVsZS5qcy5tYXAnXS5mb3JFYWNoKChmaWxlbmFtZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXBGaWxlID0gcmVzdWx0Lm91dHB1dEZpbGVzLmZpbmQoZiA9PiBmLnBhdGguZW5kc1dpdGgoZmlsZW5hbWUpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXBGaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTUFQJywgYEZpeCAke2Jhc2VuYW1lKG1hcEZpbGUucGF0aCl9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IEpTT04ucGFyc2UobWFwRmlsZS50ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5zb3VyY2VzID0gY29udGVudC5zb3VyY2VzLm1hcCgoc3JjOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzcmNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgnLi4vc3JjJywgJ3NyYycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoJy4uLy4uL3NoYXJlZCcsICcuLi9zaGFyZWQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKCcuLi8uLi8uLi9ub2RlX21vZHVsZXMnLCAnLi4vbm9kZV9tb2R1bGVzJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBtYXBGaWxlLmNvbnRlbnRzID0gQnVmZmVyLmZyb20oSlNPTi5zdHJpbmdpZnkoY29udGVudCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbiIsICJjb25zdCBfX2luamVjdGVkX2ZpbGVuYW1lX18gPSBcIi9ob21lL2RhbWllbnNvcmVsQHNnbGsubG9jYWwvbWlzdGljL1Bob3RvLVNwaGVyZS1WaWV3ZXIvYnVpbGQvdGVtcGxhdGVzL2xpY2Vuc2UudHNcIjtjb25zdCBfX2luamVjdGVkX2Rpcm5hbWVfXyA9IFwiL2hvbWUvZGFtaWVuc29yZWxAc2dsay5sb2NhbC9taXN0aWMvUGhvdG8tU3BoZXJlLVZpZXdlci9idWlsZC90ZW1wbGF0ZXNcIjtjb25zdCBfX2luamVjdGVkX2ltcG9ydF9tZXRhX3VybF9fID0gXCJmaWxlOi8vL2hvbWUvZGFtaWVuc29yZWxAc2dsay5sb2NhbC9taXN0aWMvUGhvdG8tU3BoZXJlLVZpZXdlci9idWlsZC90ZW1wbGF0ZXMvbGljZW5zZS50c1wiO2ltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBjb25zdCBsaWNlbnNlID0gKCkgPT4gcmVhZEZpbGUocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL0xJQ0VOU0UnKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuIiwgImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL2hvbWUvZGFtaWVuc29yZWxAc2dsay5sb2NhbC9taXN0aWMvUGhvdG8tU3BoZXJlLVZpZXdlci9idWlsZC90ZW1wbGF0ZXMvbnBtcmMudHNcIjtjb25zdCBfX2luamVjdGVkX2Rpcm5hbWVfXyA9IFwiL2hvbWUvZGFtaWVuc29yZWxAc2dsay5sb2NhbC9taXN0aWMvUGhvdG8tU3BoZXJlLVZpZXdlci9idWlsZC90ZW1wbGF0ZXNcIjtjb25zdCBfX2luamVjdGVkX2ltcG9ydF9tZXRhX3VybF9fID0gXCJmaWxlOi8vL2hvbWUvZGFtaWVuc29yZWxAc2dsay5sb2NhbC9taXN0aWMvUGhvdG8tU3BoZXJlLVZpZXdlci9idWlsZC90ZW1wbGF0ZXMvbnBtcmMudHNcIjtleHBvcnQgY29uc3QgbnBtcmMgPSAoKSA9PlxuICAgIGBAcGhvdG8tc3BoZXJlLXZpZXdlcjpyZWdpc3RyeT1odHRwczovL3JlZ2lzdHJ5Lm5wbWpzLm9yZ1xuLy9yZWdpc3RyeS5ucG1qcy5vcmcvOl9hdXRoVG9rZW49XFwke05PREVfQVVUSF9UT0tFTn1cbmA7XG4iLCAiY29uc3QgX19pbmplY3RlZF9maWxlbmFtZV9fID0gXCIvaG9tZS9kYW1pZW5zb3JlbEBzZ2xrLmxvY2FsL21pc3RpYy9QaG90by1TcGhlcmUtVmlld2VyL2J1aWxkL3RlbXBsYXRlcy9wYWNrYWdlLnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9ob21lL2RhbWllbnNvcmVsQHNnbGsubG9jYWwvbWlzdGljL1Bob3RvLVNwaGVyZS1WaWV3ZXIvYnVpbGQvdGVtcGxhdGVzXCI7Y29uc3QgX19pbmplY3RlZF9pbXBvcnRfbWV0YV91cmxfXyA9IFwiZmlsZTovLy9ob21lL2RhbWllbnNvcmVsQHNnbGsubG9jYWwvbWlzdGljL1Bob3RvLVNwaGVyZS1WaWV3ZXIvYnVpbGQvdGVtcGxhdGVzL3BhY2thZ2UudHNcIjtpbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHNvcnRQYWNrYWdlSnNvbiwgeyBzb3J0T3JkZXIgfSBmcm9tICdzb3J0LXBhY2thZ2UtanNvbic7XG5cbnNvcnRPcmRlci5zcGxpY2Uoc29ydE9yZGVyLmluZGV4T2YoJ3N0eWxlJykgKyAxLCAwLCAnc2FzcycpO1xuXG5leHBvcnQgY29uc3QgcGFja2FnZUpzb24gPSAocGtnOiBhbnkpID0+IHtcbiAgICBjb25zdCBjb250ZW50ID0ge1xuICAgICAgICAuLi5wa2csXG4gICAgICAgIG1haW46ICdpbmRleC5janMnLFxuICAgICAgICBtb2R1bGU6ICdpbmRleC5tb2R1bGUuanMnLFxuICAgICAgICB0eXBlczogJ2luZGV4LmQudHMnLFxuICAgICAgICBleHBvcnRzOiB7XG4gICAgICAgICAgICAnLic6IHtcbiAgICAgICAgICAgICAgICBpbXBvcnQ6ICcuL2luZGV4Lm1vZHVsZS5qcycsXG4gICAgICAgICAgICAgICAgcmVxdWlyZTogJy4vaW5kZXguY2pzJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGxpY2Vuc2U6ICdNSVQnLFxuICAgICAgICByZXBvc2l0b3J5OiB7XG4gICAgICAgICAgICB0eXBlOiAnZ2l0JyxcbiAgICAgICAgICAgIHVybDogJ2dpdDovL2dpdGh1Yi5jb20vbWlzdGljMTAwL1Bob3RvLVNwaGVyZS1WaWV3ZXIuZ2l0JyxcbiAgICAgICAgfSxcbiAgICAgICAgYXV0aG9yOiB7XG4gICAgICAgICAgICBuYW1lOiBgRGFtaWVuICdNaXN0aWMnIFNvcmVsYCxcbiAgICAgICAgICAgIGVtYWlsOiAnY29udGFjdEBnaXQuc3RyYW5nZXBsYW5ldC5mcicsXG4gICAgICAgICAgICBob21lcGFnZTogJ2h0dHBzOi8vd3d3LnN0cmFuZ2VwbGFuZXQuZnInLFxuICAgICAgICB9LFxuICAgICAgICBrZXl3b3JkczogWydwaG90b3NwaGVyZScsICdwYW5vcmFtYScsICd0aHJlZWpzJywgLi4uKHBrZy5rZXl3b3JkcyB8fCBbXSldLFxuICAgICAgICBkZXBlbmRlbmNpZXM6IF8ucGlja0J5KHBrZy5kZXBlbmRlbmNpZXMsICh2YWwsIGtleSkgPT4gIWtleS5zdGFydHNXaXRoKCdAcGhvdG8tc3BoZXJlLXZpZXdlcicpKSxcbiAgICAgICAgcGVlckRlcGVuZGVuY2llczogXy5waWNrQnkocGtnLmRlcGVuZGVuY2llcywgKHZhbCwga2V5KSA9PiBrZXkuc3RhcnRzV2l0aCgnQHBob3RvLXNwaGVyZS12aWV3ZXInKSksXG4gICAgfTtcblxuICAgIGlmIChwa2cucHN2LnN0eWxlKSB7XG4gICAgICAgIGNvbnRlbnQuc3R5bGUgPSAnaW5kZXguY3NzJztcbiAgICAgICAgY29udGVudC5zYXNzID0gJ2luZGV4LnNjc3MnO1xuICAgIH1cblxuICAgIGlmIChwa2cubmFtZSA9PT0gJ0BwaG90by1zcGhlcmUtdmlld2VyL2NvcmUnKSB7XG4gICAgICAgIGNvbnRlbnQuY29udHJpYnV0b3JzID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdKXHUwMEU5clx1MDBFOW15IEhlbGVpbmUnLFxuICAgICAgICAgICAgICAgIGVtYWlsOiAnamVyZW15LmhlbGVpbmVAZ21haWwuY29tJyxcbiAgICAgICAgICAgICAgICBob21lcGFnZTogJ2h0dHBzOi8vamVyZW15aGVsZWluZS5tZScsXG4gICAgICAgICAgICB9LFxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGRlbGV0ZSBjb250ZW50LmRldkRlcGVuZGVuY2llcztcbiAgICBkZWxldGUgY29udGVudC5wc3Y7XG4gICAgZGVsZXRlIGNvbnRlbnQuc2NyaXB0cztcblxuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShzb3J0UGFja2FnZUpzb24oY29udGVudCksIG51bGwsIDIpO1xufTtcbiIsICJjb25zdCBfX2luamVjdGVkX2ZpbGVuYW1lX18gPSBcIi9ob21lL2RhbWllbnNvcmVsQHNnbGsubG9jYWwvbWlzdGljL1Bob3RvLVNwaGVyZS1WaWV3ZXIvYnVpbGQvdGVtcGxhdGVzL3JlYWRtZS50c1wiO2NvbnN0IF9faW5qZWN0ZWRfZGlybmFtZV9fID0gXCIvaG9tZS9kYW1pZW5zb3JlbEBzZ2xrLmxvY2FsL21pc3RpYy9QaG90by1TcGhlcmUtVmlld2VyL2J1aWxkL3RlbXBsYXRlc1wiO2NvbnN0IF9faW5qZWN0ZWRfaW1wb3J0X21ldGFfdXJsX18gPSBcImZpbGU6Ly8vaG9tZS9kYW1pZW5zb3JlbEBzZ2xrLmxvY2FsL21pc3RpYy9QaG90by1TcGhlcmUtVmlld2VyL2J1aWxkL3RlbXBsYXRlcy9yZWFkbWUudHNcIjtleHBvcnQgY29uc3QgcmVhZG1lID0gKHBrZzogYW55KSA9PlxuICAgIGAjICR7cGtnLnBzdi50aXRsZX1cblxuWyFbTlBNIHZlcnNpb25dKGh0dHBzOi8vaW1nLnNoaWVsZHMuaW8vbnBtL3YvJHtwa2cubmFtZX0/bG9nbz1ucG0pXShodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS8ke3BrZy5uYW1lfSlcblshW05QTSBEb3dubG9hZHNdKGh0dHBzOi8vaW1nLnNoaWVsZHMuaW8vbnBtL2RtLyR7cGtnLm5hbWV9P2NvbG9yPWY4NjAzNiZsYWJlbD1ucG0mbG9nbz1ucG0pXShodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS8ke3BrZy5uYW1lfSlcblshW2pzRGVsaXZyIEhpdHNdKGh0dHBzOi8vaW1nLnNoaWVsZHMuaW8vanNkZWxpdnIvbnBtL2htLyR7cGtnLm5hbWV9P2NvbG9yPSUyM2Y4NjAzNiZsb2dvPWpzZGVsaXZyKV0oaHR0cHM6Ly93d3cuanNkZWxpdnIuY29tL3BhY2thZ2UvbnBtLyR7cGtnLm5hbWV9KVxuXG4ke3BrZy5kZXNjcmlwdGlvbn1cblxuIyMgRG9jdW1lbnRhdGlvblxuXG4ke3BrZy5ob21lcGFnZX1cblxuIyMgTGljZW5zZVxuXG5UaGlzIGxpYnJhcnkgaXMgYXZhaWxhYmxlIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbmA7XG4iLCAie1xuICBcIm5hbWVcIjogXCJAcGhvdG8tc3BoZXJlLXZpZXdlci92aXNpYmxlLXJhbmdlLXBsdWdpblwiLFxuICBcInZlcnNpb25cIjogXCIwLjAuMFwiLFxuICBcImRlc2NyaXB0aW9uXCI6IFwiUGhvdG8gU3BoZXJlIFZpZXdlciBwbHVnaW4gdG8gbG9jayB0aGUgdmlzaWJsZSBhbmdsZXMuXCIsXG4gIFwiaG9tZXBhZ2VcIjogXCJodHRwczovL3Bob3RvLXNwaGVyZS12aWV3ZXIuanMub3JnL3BsdWdpbnMvdmlzaWJsZS1yYW5nZS5odG1sXCIsXG4gIFwibGljZW5zZVwiOiBcIk1JVFwiLFxuICBcIm1haW5cIjogXCIuL3NyYy9pbmRleC50c1wiLFxuICBcInR5cGVzXCI6IFwiLi9zcmMvaW5kZXgudHNcIixcbiAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQHBob3RvLXNwaGVyZS12aWV3ZXIvY29yZVwiOiBcIjAuMC4wXCJcbiAgfSxcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcImJ1aWxkXCI6IFwidHN1cFwiLFxuICAgIFwid2F0Y2hcIjogXCJ0c3VwIC0td2F0Y2hcIixcbiAgICBcImluc3RydW1lbnRcIjogXCJueWMgaW5zdHJ1bWVudCBkaXN0L2luZGV4Lm1vZHVsZS5qcyAuXCIsXG4gICAgXCJsaW50XCI6IFwidHNjIC0tbm9FbWl0ICYmIGVzbGludCAuIC0tZml4XCIsXG4gICAgXCJwdWJsaXNoLWRpc3RcIjogXCJjZCBkaXN0ICYmIG5wbSBwdWJsaXNoIC0tdGFnPSROUE1fVEFHIC0tYWNjZXNzPXB1YmxpY1wiLFxuICAgIFwibnBtLWxpbmtcIjogXCJjZCBkaXN0ICYmIG5wbSBsaW5rXCJcbiAgfSxcbiAgXCJwc3ZcIjoge1xuICAgIFwidGl0bGVcIjogXCJQaG90byBTcGhlcmUgVmlld2VyIC8gVmlzaWJsZSBSYW5nZSBQbHVnaW5cIixcbiAgICBcImJ1ZGdldFwiOiBcIjIwa2JcIlxuICB9XG59XG4iLCAiY29uc3QgX19pbmplY3RlZF9maWxlbmFtZV9fID0gXCIvaG9tZS9kYW1pZW5zb3JlbEBzZ2xrLmxvY2FsL21pc3RpYy9QaG90by1TcGhlcmUtVmlld2VyL3BhY2thZ2VzL3Zpc2libGUtcmFuZ2UtcGx1Z2luL3RzdXAuY29uZmlnLnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9ob21lL2RhbWllbnNvcmVsQHNnbGsubG9jYWwvbWlzdGljL1Bob3RvLVNwaGVyZS1WaWV3ZXIvcGFja2FnZXMvdmlzaWJsZS1yYW5nZS1wbHVnaW5cIjtjb25zdCBfX2luamVjdGVkX2ltcG9ydF9tZXRhX3VybF9fID0gXCJmaWxlOi8vL2hvbWUvZGFtaWVuc29yZWxAc2dsay5sb2NhbC9taXN0aWMvUGhvdG8tU3BoZXJlLVZpZXdlci9wYWNrYWdlcy92aXNpYmxlLXJhbmdlLXBsdWdpbi90c3VwLmNvbmZpZy50c1wiO2ltcG9ydCBjcmVhdGVDb25maWcgZnJvbSAnLi4vLi4vYnVpbGQvdHN1cC5jb25maWcnO1xuaW1wb3J0IHBrZyBmcm9tICcuL3BhY2thZ2UuanNvbic7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZUNvbmZpZyhwa2cpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsb0JBQW9COzs7QUNEN0IsU0FBUyxPQUFPLGlCQUFpQjtBQUNqQyxPQUFPLFVBQVU7QUFDakIsT0FB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
