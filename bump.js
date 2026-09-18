#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// -------------------------------------------------
// Config
// -------------------------------------------------
const dirName = path.basename(__dirname);
const pluginFile = `${dirName}.php`;
const changelogFile = path.join(__dirname, 'changelog.txt');

const sectionMap = {
    '-n': '### 🚀 New Features',
    '-i': '### 🛠 Improvements',
    '-b': '### 🐛 Bug Fixes',
    '-s': '### 🔒 Security Fixes'
};

// -------------------------------------------------
// Parse CLI args
// -------------------------------------------------
const rawArgs = process.argv.slice(2);
const appendOnly = rawArgs.includes('--append');

// -------------------------------------------------
// Help (-h / --help)
// -------------------------------------------------
if (rawArgs.includes('-h') || rawArgs.includes('--help')) {
    console.log(`
Usage:
  node bump.js -n "New feature"
  node bump.js -i "Improvement"
  node bump.js -b "Bug fix"
  node bump.js -s "Security fixes"

Combine multiple:
  node bump.js -n "Feature A" -b "Fixed bug"

Append to latest version (no version bump):
  node bump.js --append -i "Improvement text"

Multiple lines (use | as separator):
  node bump.js -n "Thing 1|Thing 2"

Flags:
  -n   Add under "New Features"
  -i   Add under "Improvements"
  -b   Add under "Bug Fixes"
  -s   Add under "Security Fixes"
  -h   Show this help message
  --help Same as -h
  --append Append to latest changelog entry instead of bumping version

Notes:
  • Quotes are optional unless your message has spaces
  • Use | to split multiple bullet lines
  • The script auto-bumps the patch version unless --append is used
`);
    process.exit(0);
}

const args = rawArgs.filter(arg => arg !== '--append');

const updates = { '-n': [], '-i': [], '-b': [], '-s': [] };

for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const msg = args[i + 1]?.replace(/^["']|["']$/g, '');

    if (!sectionMap[flag] || !msg) {
        console.log(`Usage:
  node bump.js -n "New feature"
  node bump.js -b "Bug fix"
  node bump.js -s "Security fixes"
  node bump.js --append -i "Improvement"
`);
        process.exit(1);
    }

    msg.split('|').forEach(line => {
        if (line.trim()) updates[flag].push(`- ${line.trim()}`);
    });
}

// -------------------------------------------------
// Version handling
// -------------------------------------------------
let oldVersion = null;
let newVersion = null;

// Bump version unless --append
if (!appendOnly) {
    let fileContent = fs.readFileSync(pluginFile, 'utf8');
    const versionRegex = /Version:\s*(\d+)\.(\d+)\.(\d+)/;
    const match = versionRegex.exec(fileContent);

    if (!match) {
        console.error('❌ Version not found in plugin header.');
        process.exit(1);
    }

    const [_, major, minor, patch] = match;
    oldVersion = `${major}.${minor}.${patch}`;
    newVersion = `${major}.${minor}.${parseInt(patch, 10) + 1}`;

    fileContent = fileContent.replace(
        versionRegex,
        `Version: ${newVersion}`
    );

    fileContent = fileContent.replace(
        new RegExp(`(?<!Version:\\s*)\\b${oldVersion}\\b`, 'g'),
        newVersion
    );

    fs.writeFileSync(pluginFile, fileContent, 'utf8');
    console.log(`🔼 Version bumped: ${oldVersion} → ${newVersion}`);
}

// -------------------------------------------------
// Changelog handling
// -------------------------------------------------
let changelog = fs.existsSync(changelogFile)
    ? fs.readFileSync(changelogFile, 'utf8')
    : '';

// Append mode: use latest version
if (appendOnly) {
    const match = changelog.match(/^## \[(.+?)\]/m);
    if (!match) {
        console.error('❌ No version found in changelog to append to.');
        process.exit(1);
    }
    newVersion = match[1];
}

// -------------------------------------------------
// Normal release: prepend new version block
// -------------------------------------------------
if (!appendOnly) {
    const today = new Date().toISOString().split('T')[0];
    const versionHeader = `## [${newVersion}] – ${today}`;

    const sectionBlocks = Object.entries(updates)
        .filter(([_, lines]) => lines.length > 0)
        .map(([flag, lines]) => {
            return `${sectionMap[flag]}\n${lines.join('\n')}\n`;
        });

    if (sectionBlocks.length === 0) {
        console.log('ℹ️ No changelog entries provided.');
    } else {
        changelog = `${versionHeader}\n\n${sectionBlocks.join('\n')}\n${changelog}`;
    }
}

// -------------------------------------------------
// Append-only mode: insert into existing sections
// -------------------------------------------------
if (appendOnly) {
    const lines = changelog.split('\n');

    for (const flag of Object.keys(updates)) {
        if (updates[flag].length === 0) continue;

        const sectionTitle = sectionMap[flag];
        const index = lines.findIndex(line => line.trim() === sectionTitle);

        if (index === -1) {
            console.warn(`⚠️ Section "${sectionTitle}" not found.`);
            continue;
        }

        lines.splice(index + 1, 0, ...updates[flag]);
        console.log(`➕ Added to ${sectionTitle}`);
    }

    changelog = lines.join('\n');
}

// -------------------------------------------------
// Write changelog
// -------------------------------------------------
fs.writeFileSync(changelogFile, changelog, 'utf8');
console.log(`📝 Changelog updated for version ${newVersion}`);
