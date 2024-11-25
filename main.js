const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const fs = require("fs");
const socketIo = require("socket.io");
const archiver = require("archiver");
const { exec } = require('child_process');

// Load environment variables from .env file
const dotenv = require('dotenv');
dotenv.config();

const GITHOOK_SECRET = process.env.GITHOOK_SECRET || 'secret'
const PORT = process.env.PORT || 8080;

// Hooks

// import GithubWebHook from 'express-github-webhook';
const GithubWebHook = require('express-github-webhook');
const bodyParser = require('body-parser');
var webhookHandler = GithubWebHook({ path: '/webhook', secret: GITHOOK_SECRET });

const initializeWatcher = require('./js/trackAndUpdateJSON'); // does not work yet

// Start the watcher
initializeWatcher();

// Configuration du serveur
const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(webhookHandler);

// HOOKS
webhookHandler.on('*', function (event, repo, data) {
  // console.log('hook', event, repo, data);
  if (event === 'push') {
    // git stash then git pull && pm2 restart contacts
    console.log('processing push event (Pull / Restart)');
    exec('git pull && npm i && pm2 restart apptest', (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(stdout);
    });
  }
});

// Activer CORS pour toutes les routes
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  next();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Adjust the path as necessary
});

// route de check for update
app.get("/update/", (req, res) => {
  const filePath = path.join(__dirname, "download", "fileStructure.json");

  // Envoyer le fichier en réponse
  res.download(filePath, (err) => {
    if (err) {
      console.error("Erreur lors du téléchargement :", err);
      res.status(404).send("Fichier non trouvé");
    }
  });
});

// Route de téléchargement de fichier
app.get("/downloadMedia/", (req, res) => {
  console.log("Request to download the folder received");
  const zipFilePath = path.join(__dirname, 'downloadMedia.zip');
  if (!fs.existsSync(zipFilePath)) {
    return res.status(404).send('ZIP file not found');
  }

  res.download(zipFilePath, 'folder.zip', (err) => {
    if (err) {
      console.error('Error sending the ZIP file:', err);
      res.status(500).send('Error sending ZIP file');
    } else {
      console.log('ZIP file sent successfully.');
    }
  });
});

app.get("/downloadApp/", (req, res) => {
  const folderPath = path.join(__dirname, "download/app"); // Path to the folder you want to zip
  const zipFileName = "downloadedApp.zip"; // Name of the zip file to be created

  // Create a zip archive
  const archive = archiver("zip", {
    zlib: { level: 9 } // Sets the compression level
  });

  res.attachment(zipFileName); // Set the file name for the download
  archive.pipe(res); // Pipe the archive to the response

  // Append files from the folder
  archive.directory(folderPath, false); // The second parameter 'false' keeps the folder structure without the base directory

  // Finalize the archive (this will end the stream)
  archive.finalize().catch((err) => {
    console.error("Erreur lors de la création du zip :", err);
    res.status(500).send("Erreur lors de la création de l'archive");
  });

  // Handle any errors that occur while zipping
  archive.on("error", (err) => {
    console.error("Erreur lors de l'archivage :", err);
    res.status(500).send("Erreur lors de l'archivage");
  });
});

// Démarrer le serveur HTTP
const server = http.createServer(app); // Use HTTPS with your certificates
// Initialiser Socket.IO sur le serveur HTTPS
const io = socketIo(server, {
  cors: {
    origin: "*",  // Allow connection only from this origin
    methods: ["GET", "POST"],    // Allow these HTTP methods
    allowedHeaders: ["Content-Type"], // Allowed headers
    credentials: true            // Allow cookies/credentials
  }
});

// Écouter les connexions Socket.IO
io.on("connection", (socket) => {
  console.log("Un utilisateur est connecté");

  // Écouter un événement spécifique
  socket.on("message", (msg) => {
    console.log("Message reçu : " + msg);

    // Émettre un message au client
    socket.emit("message", "ceci viens du serveur");
  });

  // Gérer la déconnexion
  socket.on("disconnect", () => {
    console.log("Un utilisateur s'est déconnecté");
  });

  // Server-side socket event handler
  socket.on('mediaRequest', (mediaNamesArray) => {
    console.log("Media request received for:", mediaNamesArray);

    const dir = "./downloadMedia";
    if (!fs.existsSync(dir)) {
      console.log("Creating destination folder");
      fs.mkdirSync(dir);
    }

    // Copy the requested media files to the destination folder
    copyFiles(mediaNamesArray, dir, () => {
      console.log(`Files have been copied to: ${dir}`);

      // Define the ZIP file path
      const zipFilePath = path.join(__dirname, 'downloadMedia.zip');

      // Create the ZIP file
      createZip(dir, zipFilePath, (zipPath) => {
        console.log("Emitting mediaRequest with ZIP path:", zipPath);

        // Emit the ZIP file path to the client
        socket.emit("mediaRequest", zipPath);
        console.log("Emit passed");

        // Delete the destination folder
        fs.access(dir, (error) => {
          if (!error) {
            // Delete the folder and its contents recursively
            fs.rm(dir, { recursive: true, force: true }, (err) => {
              if (err) {
                console.error(`Error deleting folder '${dir}':`, err);
              } else {
                console.log(`Folder '${dir}' has been deleted.`);
              }
            });
          } else {
            console.log(`Folder '${dir}' does not exist.`);
          }
        });
      });
    });
  });

  // Helper function to copy files
  function copyFiles(mediaNamesArray, destinationFolderPath, callback) {
    mediaNamesArray.forEach(mediaName => {
      const srcPath = path.join(__dirname, 'mediaSourceFolder', mediaName); // Change 'mediaSourceFolder' to actual folder path
      const destPath = path.join(destinationFolderPath, mediaName);
      fs.copyFileSync(srcPath, destPath);
    });
    callback();
  }

  // Helper function to create a ZIP archive
  function createZip(folderPath, zipFilePath, callback) {
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`ZIP file created at ${zipFilePath}`);
      callback(zipFilePath);
    });

    archive.on('error', (err) => {
      console.error("Error creating ZIP file:", err);
    });

    archive.pipe(output);
    archive.directory(folderPath, false);
    archive.finalize();
  }


  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  function copyFiles(mediaNamesArray, destinationFolderPath, callback) {
    // Create the destination folder if it doesn't exist
    if (!fs.existsSync(destinationFolderPath)) {
      console.log("Creating destination folder");
      fs.mkdirSync(destinationFolderPath, { recursive: true });
    }

    // Copy each requested file into the destination folder
    mediaNamesArray.forEach(mediaName => {
      const mediaFilePath = path.join(__dirname, 'download/media', mediaName); // Original media path
      const destinationPath = path.join(destinationFolderPath, mediaName); // Destination path

      console.log("Checking media file:", mediaFilePath);

      if (fs.existsSync(mediaFilePath)) {
        console.log(`Copying file to destination folder: ${mediaName}`);
        fs.copyFileSync(mediaFilePath, destinationPath);
      } else {
        console.error(`Media file not found: ${mediaName}`);
      }
    });

    callback(); // Call the callback function after copying files
  }
});

function findAllFile(directoryPath) {
  const items = fs.readdirSync(directoryPath, { withFileTypes: true });

  // Parcours chaque élément du répertoire
  for (let item of items) {
    const fullPath = directoryPath;

    // Si l'élément est un dossier , on le retourne
    if (item.isDirectory()) {
      console.log(`Dossier trouvé à: ${fullPath}`);
      return fullPath;
    }

    // Si l'élément est un dossier, appel récursif pour rechercher dans les sous-dossiers
    if (item.isDirectory()) {
      const found = findAllFile(fullPath);
      if (found) {
        return found;
      }
    }
  }

  // Retourne null si "app" n'est pas trouvé
  return null;
}

function scanDirectory(directoryPath, basePath) {
  const structure = {};
  const items = fs.readdirSync(directoryPath, { withFileTypes: true });

  items.forEach((item) => {
    const fullPath = path.join(directoryPath, item.name);

    if (item.isDirectory()) {
      structure[item.name] = scanDirectory(fullPath, basePath); // Appel récursif pour les dossiers
    } else if (item.name != "fileStructure.json") {
      structure[item.name] = item.name + "@" + Date.now(); // Utiliser uniquement le nom du fichier
    }
  });

  return structure;
}

// Fonction pour mettre à jour le fichier JSON avec la structure des fichiers
function updateJSONWithFileStructure(outputPath, directoryPath) {
  const fileStructure = scanDirectory(directoryPath, directoryPath);

  // Convertir l'objet en JSON
  const jsonString = JSON.stringify(fileStructure, null, 2);

  // Écrire dans le fichier JSON
  fs.writeFileSync(outputPath, jsonString, 'utf8');
  console.log(`Arborescence des fichiers mise à jour dans ${outputPath}`);
}

// Fonction pour trouver le dossier "app" et mettre à jour le JSON
function findAllFileAndUpdateJson(outputPath, baseDirectory) {
  // Recherche du dossier "app" dans le répertoire de base
  const allFilePath = findAllFile(baseDirectory);

  if (allFilePath) {
    console.log(`Dossier trouvé à: ${allFilePath}`);
    updateJSONWithFileStructure(outputPath, allFilePath); // Si trouvé, mettre à jour le JSON
  } else {
    console.log('Le dossier "app" n\'a pas été trouvé.');
  }
}

// Exemple d'utilisation
const outputPath = './download/fileStructure.json'; // Chemin du fichier JSON de sortie
const directoryPath = './download'; // Répertoire de base où chercher "app"
findAllFileAndUpdateJson(outputPath, directoryPath);

// Démarrer le serveur Socket.IO sur le même port
server.listen(PORT, () => {
  console.log(`Serveur démarré`);
});
