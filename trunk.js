const fs = require('fs');
const path = require('path');

const srcRoot = __dirname;
const destRoot = 'D:/wporg/powdi-auto-hide-builder-bar-for-divi/trunk';

// Files/folders to skip when copying to the SVN trunk, matched by name at
// ANY depth (not just root).
const EXCLUDE = new Set([
    '.git',
    '.gitignore',
    'CLAUDE.md',
    'ready.js',
    'package.json',
    'node_modules',
    'package-lock.json',
    'bump.js',
    'trunk.js',
    'webpack.config.js',
    'post_content.txt',
    // raw JS sources - ship the built build/bundle.js instead
    'src',
]);

if (!fs.existsSync(destRoot)) {
    fs.mkdirSync(destRoot, { recursive: true });
} else {
    // Clean out stale files from previous runs (cpSync only adds/overwrites,
    // it never deletes). Preserve .svn if destRoot is an actual SVN working
    // copy rather than a scratch folder.
    for (const entry of fs.readdirSync(destRoot)) {
        if (entry === '.svn') continue;
        fs.rmSync(path.join(destRoot, entry), { recursive: true, force: true });
    }
}

let filesCopied = 0;

fs.cpSync(srcRoot, destRoot, {
    recursive: true,
    force: true,
    filter: (src) => {
        const rel = path.relative(srcRoot, src);
        if (rel === '') return true;
        const parts = rel.split(path.sep);
        if (parts.some((part) => EXCLUDE.has(part))) return false;
        if (path.extname(src) === '.jsx') return false;
        if (fs.statSync(src).isFile()) filesCopied++;
        return true;
    },
});

console.log(`copied to destination: ${destRoot}`);
console.log(`files copied: ${filesCopied}`);
console.log('Trunk Done!');
