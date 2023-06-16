/**
 * This wraps the IIFE output with an UMD loader
 */
export function umdPlugin({ pkg, externals }) {
    return {
        name: 'umd',
        setup(build) {
            build.onEnd((result) => {
                const iifeFile = result.outputFiles.find((f) => f.path.endsWith('index.js'));
                const mapFile = result.outputFiles.find((f) => f.path.endsWith('index.js.map'));
                if (!iifeFile) {
                    return;
                }

                console.log('UMD', `Wrap ${iifeFile.path}`);

                // shift js.map mappings
                mapFile.contents = Buffer.from(shiftMap(iifeFile.text, pkg, mapFile.text));

                // add UMD wrapper
                iifeFile.contents = Buffer.from(wrapUmd(iifeFile.text, pkg, externals));
            });
        },
    };
}

function wrapUmd(fileContent, pkg, externals) {
    const deps = Object.keys(pkg.dependencies);
    if (!deps.includes('three')) {
        deps.unshift('three');
    }

    const depsCommonJs = deps.map((dep) => `require('${dep}')`).join(', ');
    const depsAmd = deps.map((dep) => `'${dep}'`).join(', ');
    const depsGlobal = deps.map((dep) => `global.${externals[dep]}`).join(', ');
    const depsParams = deps.map((dep) => `${externals[dep].split('.').pop()}`).join(', ');

    const globalParent = 'PhotoSphereViewer';
    const globalName = pkg.psv.globalName;
    const globalExport = !globalName.includes('.')
        ? `global.${globalName} = {}`
        : `(global.${globalParent} = global.${globalParent} || {}, global.${globalName} = {})`;

    return `(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, ${depsCommonJs}) :
    typeof define === 'function' && define.amd ? define(['exports', ${depsAmd}], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(${globalExport}, ${depsGlobal}));
})(this, (function (exports, ${depsParams}) {

${fileContent
    // remove iife assignation
    .replace(`var ${globalParent};\n`, '')
    .replace(`var ${globalParent} = (() => {\n`, '')
    .replace(`(${globalParent} ||= {}).${globalName.split('.').pop()} = (() => {\n`, '')
    // hydrate exports
    .replace(/return __toCommonJS\((.*?)\);\n}\)\(\);/, '__copyProps(__defProp(exports, "__esModule", { value: true }), $1);')
    // unused function
    .replace(/  var __toCommonJS = (.*?);\n/, '')

    // simplify static fields
    .replace(/__publicField\((.*?), "(.*?)", ([\s\S]*?)\);/g, '$1.$2 = $3;')
    .replace(/__publicField\((.*?), "(.*?)"\);/g, '$1.$2 = undefined;')
    // unused functions
    .replace(/  var __publicField = ([\s\S]*?)};\n/, '')
    .replace(/  var __defNormalProp = (.*?);\n/, '')

    // simplify imports
    .replace(
        /__commonJS\({[\s]+"(.*?)"\(exports, module\) {[\s]+"use strict";[\s]+module.exports = (.*?);[\s]+}[\s]+}\);/g,
        (_, p1, p2) => `() => ${p2.split('.').pop()};`
    )
    .replace(/__toESM\((.*?)\(\)(, 1)?\)/g, '$1()')
    // unused functions
    .replace(/  var __toESM = ([\s\S]*?)\)\);\n/, '')
    .replace(/  var __commonJS = ([\s\S]*?)};\n/, '')
    .replace(/  var __create = (.*?);\n/, '')
    .replace(/  var __getProtoOf = (.*?);\n/, '')
    // remove plugin reference
    .replace(/external-global-plugin:/g, '')}
}));`;
}

function shiftMap(fileContent, pkg, mapContent) {
    // prettier-ignore
    const offset =
        6 /* header */
        - 1 - (pkg.psv.globalName.includes('.') ? 1 : 0) /* iife */
        - 10  - (fileContent.match(/__publicField\(/) ? 5 : 0) /* unused functions */ 
        - 4 * fileContent.match(/__commonJS\({/g).length; /* imports */

    const content = JSON.parse(mapContent);
    content.sources = content.sources.map((src) => {
        return src
            .replace('../src', 'src')
            .replace('../../shared', '../shared')
            .replace('external-global-plugin:', '');
    });
    content.mappings = content.mappings.slice(-offset);

    return JSON.stringify(content);
}
