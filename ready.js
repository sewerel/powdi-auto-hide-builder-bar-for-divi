const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const dirName = path.basename(__dirname);
let version = '1.0.0';
(function () {
    const data = fs.readFileSync(dirName + '.php', 'utf8');
    const pattern = /Version:\s*(?<version>[\d\.]+)/;
    const result = pattern.exec(data);
    version = result.groups?.version;
    console.log('Version: ', version);

}());

fs.copyFile('changelog.txt', `D:/plugins/changelog-${dirName}-v${version}.txt`, (err) => {
    if (err) {
        console.error('Changelog error occurred:', err);
        return;
    }
    console.log(`changelog-${dirName}-v${version}.txt was copied successfully.`);
});

// Destination root
const destRoot = 'D:/plugins';

// Ensure the folder exists
if (!fs.existsSync(destRoot)) {
    fs.mkdirSync(destRoot, { recursive: true });
}

const zipPath = path.join(destRoot, `${dirName}.zip`);
console.log('Creating zip at: ', zipPath);

// create a file to stream archive data to.
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip');



// listen for all archive data to be written
//'close' event is fired only when a file descriptor is involved
output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
});


// good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
        // log warning
    } else {
        // throw error
        throw err;
    }
});
archive.glob(
    //pattern match everything
    '**',
    {
        //where to look for
        cwd: __dirname,
        ignore: [
            //ignore node_modules dir, anywhere in the tree
            '**/node_modules/**',
            //ignore filename
            'ready.js',
            'trunk.js',
            'bump.js',
            'post_content.txt',
            //ignore .git
            '*.git/**',
            //ignore CLAUDE.md, anywhere in the tree
            '**/CLAUDE.md',
            //ignore .gitignore
            '.gitignore',
            //ignore root-level json (npm manifests)
            '*.json',
            //ignore webpack dev tooling
            'webpack.config.js',
            //raw JS sources - ship the built build/bundle.js instead
            'src/**']
    },
    {
        //add parent directory name
        prefix: dirName
    });

// good practice to catch this error explicitly
archive.on('error', function (err) {
    throw err;
});

// pipe archive data to the file
archive.pipe(output);


// finalize the archive (ie we are done appending files but streams have to finish yet)
// 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
archive.finalize();
