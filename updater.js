import archiver from "archiver";
import fs from "fs";
import crypto from "crypto";
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

function log(msg) {
    console.log(`[\x1b[32mUpdater\x1b[0m]\t${msg}`);
}

function error(msg) {
    console.error(`[Updater]\t${msg}`);
}

const APPDATA_DIR   = "appdata";
const MEDIA_DIR     = "media";
const DOWNLOAD_DIR  = "download";
const ZIP_FILENAME  = "appdata.zip";

var APPINFO = {
    'appzip_url': null,
    'appzip_hash': null,
    'media_tree': {}
};

// const GITHOOK_SECRET = process.env.GITHOOK_SECRET || 'secret'

// compress appdata/ into download/appdata.zip
// return promise
function compressFolder(dir) {
    return new Promise((resolve, reject) => {

        const APPDATA_PATH = __dirname + "/" + dir;
        const ZIP_FILE_PATH = __dirname + "/" + DOWNLOAD_DIR + "/" + ZIP_FILENAME;

        // remove existing ZIP file
        if (fs.existsSync(ZIP_FILE_PATH))
            fs.unlinkSync(ZIP_FILE_PATH);

        // create ZIP file
        const output = fs.createWriteStream(ZIP_FILE_PATH);
        const archive = archiver("zip", {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', () => {
            log(`APPDATA zip file created at ${ZIP_FILE_PATH}`);
            resolve(ZIP_FILE_PATH);
        });

        archive.on('error', (err) => {
            error("APPDATA Error creating ZIP file:", err);
            reject(err);
        });

        archive.pipe(output);
        archive.directory(APPDATA_PATH, false); // append files from a sub-directory, putting its contents at the root of archive
        archive.finalize();
    });
}

// Bundle APPDATA (Promise)
function bundleAppData() 
{
    // Prepare APPDATA zip file
    return compressFolder(APPDATA_DIR)

        // Store hash of APPDATA zip file  
        .then((zip_file) => {
            return new Promise((resolve, reject) => {
                const hash = crypto.createHash('sha256');
                const input = fs.createReadStream(zip_file);

                input.on('data', (chunk) => {
                    hash.update(chunk);
                });

                input.on('end', () => {
                    APPINFO.appzip_hash = hash.digest('hex');
                    resolve();
                });

                input.on('error', (err) => {
                    console.error("Error reading APPDATA zip file:", err);
                    reject(err);
                });
            });
        })
}


// Recursively read files and directories
function fileCrowler(path) {
    const files = fs.readdirSync(path);
    const result = {};
    files.forEach((file) => {
        const subpath = path + "/" + file;
        const stats = fs.statSync(subpath);
        if (stats.isDirectory()) {
            result[file] = fileCrowler(subpath);
        } else {
            const data = fs.readFileSync(subpath);
            const hash = crypto.createHash("sha256");
            hash.update(data);
            result[file] = hash.digest("hex");
        }
    });
    return result;
}


// build Media tree
function buildMediaTree() 
{
    const MEDIA_PATH = __dirname + "/" + MEDIA_DIR;
    APPINFO.media_tree = fileCrowler(MEDIA_PATH);
}


async function updater(app, io) {


    // Bundle APPDATA
    await bundleAppData();

    // Build Media tree
    await buildMediaTree();

    // Watch for changes in APPDATA
    fs.watch(APPDATA_DIR, { recursive: true }, (eventType, filename) => {
        console.log(`\nAPPDATA changed: ${eventType} ${filename}`);
        bundleAppData()
            .then(() => {
                console.log("APPDATA updated");
                io.emit('update', APPINFO);
            });
    });

    // Watch for changes in MEDIA
    fs.watch(MEDIA_DIR, { recursive: true }, (eventType, filename) => {
        console.log(`\nMEDIA changed: ${eventType} ${filename}`);
        buildMediaTree()
            .then(() => {
                console.log("MEDIA updated");
                io.emit('update', APPINFO);
            });
    });

    io.on("connection", (socket) => {
        socket.emit('update', APPINFO);
    })

    // Routes
    
    // Get APPINFO
    app.get('/update/info', (req, res) => {
        res.json(APPINFO);
    });

    // Download appdata.zip
    APPINFO.appzip_url = "/update/app";
    app.get(APPINFO.appzip_url, (req, res) => {
        res.download(__dirname + "/" + DOWNLOAD_DIR + "/" + ZIP_FILENAME);
    });

    // Display APPINFO (beautify media_tree)
    log("APPINFO:\n"+JSON.stringify(APPINFO, null, 4));

    log('ready.\n----------------------');
}

export { updater };