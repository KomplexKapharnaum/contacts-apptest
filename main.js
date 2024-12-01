import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';

import cors from "cors";
import path from "path";

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Starting
console.log("                                                                                ")
console.log("░░      ░░░░      ░░░   ░░░  ░░        ░░░      ░░░░      ░░░        ░░░      ░░")
console.log("▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒    ▒▒  ▒▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒▒▒▒")
console.log("▓  ▓▓▓▓▓▓▓▓  ▓▓▓▓  ▓▓  ▓  ▓  ▓▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓  ▓▓  ▓▓▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓▓      ▓▓")
console.log("█  ████  ██  ████  ██  ██    █████  █████        ██  ████  █████  ███████████  █")
console.log("██      ████      ███  ███   █████  █████  ████  ███      ██████  ██████      ██")
console.log("                                                                                ")


// Load environment variables from .env file
// const dotenv = require('dotenv');
import dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT || 8080;

// Configuration du serveur
const app = express();
const server = createServer(app); 

// Initialiser Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",  // Allow connection only from this origin
    methods: ["GET", "POST"],    // Allow these HTTP methods
    allowedHeaders: ["Content-Type"], // Allowed headers
    credentials: true            // Allow cookies/credentials
  }
});

// Activer CORS pour toutes les routes
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  next();
});

//
// Load Modules
//

// Apply Github Hooks
import {githubHook} from './github-hook.js';
githubHook(app);

// Apply Notifier
import {notifier} from './notifier.js';
notifier(app);

// Apply Updater
import {updater} from './updater.js';
await updater(app, io);

//
// Socket.IO
//

// Écouter les connexions Socket.IO
io.on("connection", (socket) => {
  console.log("\tS.IO: Un utilisateur s'est connecté");

  // Gérer la déconnexion
  socket.on("disconnect", () => {
    console.log("\tS.IO: Un utilisateur s'est déconnecté");
  });
});


//
// Routes
//

// www static files
app.use(express.static(path.join(__dirname, 'www')));

// App web launcher
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'www/launcher/launcher.html'));
})

// Notification sender
app.get('/notif', (req, res) => {
  res.sendFile(path.join(__dirname, 'www/notif/index.html'));
});

// Static appdata
app.use('/appdata', express.static(path.join(__dirname, 'appdata')));

// Static media
app.use('/media', express.static(path.join(__dirname, 'media')));

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`Serveur started on port ${PORT}`);
});