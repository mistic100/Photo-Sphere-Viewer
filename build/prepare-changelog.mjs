#!/usr/bin/env node

/**
 * Generate the release note
 */

import fs from 'fs';
import { stdin } from 'process';

const FROM_TAG = process.argv[2];
const TO_TAG = process.argv[3];

const FILENAME = `dist/changelog_${TO_TAG}.md`;

if (!FROM_TAG || !TO_TAG || FROM_TAG === TO_TAG) {
    console.warn('No tags provided or same tags');
    writeFileAndExit('');
}

let log = '';

stdin.setEncoding('utf8');

stdin.on('data', (chunk) => {
    log += chunk;
});

stdin.on('error', (e) => {
    console.error(e);
    writeFileAndExit('');
});

stdin.on('end', () => {
    const content = `Full changelog: [${FROM_TAG}...${TO_TAG}](https://github.com/mistic100/Photo-Sphere-Viewer/compare/${FROM_TAG}...${TO_TAG})

${log
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => !line.startsWith('chore') && !line.startsWith('doc'))
    .map((line) => `- ${line}`)
    .join('\n')}`;

    console.log(content);
    writeFileAndExit(content);
});

function writeFileAndExit(content) {
    fs.writeFileSync(FILENAME, content);
    process.exit(0);
}
