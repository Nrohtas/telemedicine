const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src', 'app', 'hospitals');
const dest = path.join(__dirname, 'src', 'app', 'hospital');

if (fs.existsSync(src)) {
    try {
        fs.renameSync(src, dest);
        console.log(`Successfully renamed ${src} to ${dest}`);
    } catch (err) {
        console.error(`Error renaming directory: ${err.message}`);
        process.exit(1);
    }
} else if (fs.existsSync(dest)) {
    console.log(`Destination already exists: ${dest}`);
} else {
    console.error(`Source directory does not exist: ${src}`);
    process.exit(1);
}
