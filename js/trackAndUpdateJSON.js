//
//
//
// DOES NOT WORK YET
//
//
//

const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

// Chemin vers le dossier que tu veux surveiller
const directoryToWatch = path.join(__dirname, 'download/app');
// Chemin vers le fichier JSON à mettre à jour
const jsonFilePath = path.join(__dirname, 'download/fileStructure.json');

// Fonction pour mettre à jour le JSON
function updateJsonFile(changedFilePath) {
    const fileName = path.basename(changedFilePath);
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err && err.code === 'ENOENT') {
            data = '{}'; // If file does not exist, create an empty JSON
        } else if (err) {
            return console.error('Erreur de lecture du JSON :', err);
        }

        let json;
        try {
            json = JSON.parse(data);
        } catch (parseErr) {
            return console.error('Erreur de parsing JSON :', parseErr);
        }

        json[fileName] = `Dernière modification détectée pour ${fileName}`;

        fs.writeFile(jsonFilePath, JSON.stringify(json, null, 2), (writeErr) => {
            if (writeErr) return console.error('Erreur d\'écriture dans le JSON :', writeErr);
            console.log('JSON mis à jour avec succès.');
        });
    });
}

// Initialiser le watcher sur le dossier entier
function initializeWatcher() {
    console.log("Initialisation du watcher sur :", directoryToWatch);
    const watcher = chokidar.watch(directoryToWatch, {
        persistent: true,
        ignoreInitial: true,
        depth: Infinity,
        ignorePermissionErrors: true,
        usePolling: true,  // Enable polling
        interval: 100,
        followSymlinks: false,
    });

    watcher.on('all', (event, path) => {
        console.log(`Event: ${event} on ${path}`);
    });

    try {
        watcher
            .on('add', (filePath) => {
                console.log(`Nouveau fichier ajouté : ${filePath}. Mise à jour du JSON...`);
                updateJsonFile(filePath); // Correct usage: pass the file path
            })
            .on('change', (filePath) => {
                console.log(`Changement détecté dans : ${filePath}`);
                updateJsonFile(filePath); // Correct usage: pass the file path
            })
            .on('unlink', (filePath) => {
                console.log(`Fichier supprimé : ${filePath}. Mise à jour du JSON...`);
                updateJsonFile(filePath); // Correct usage: pass the file path
            })
            .on('error', (error) => {
                console.error(`Erreur du watcher : ${error}`);
            });
    } catch (error) {
        console.log(error)
    }
}

module.exports = initializeWatcher;
