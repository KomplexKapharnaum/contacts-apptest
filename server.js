import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';

import cors from "cors";
import path from "path";

import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function log(msg) {
  console.log(`[\x1b[36mServer\x1b[0m]\t${msg}`);
}

// Starting
console.log("                                                                                ")
console.log("░░      ░░░░      ░░░   ░░░  ░░        ░░░      ░░░░      ░░░        ░░░      ░░")
console.log("▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒    ▒▒  ▒▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒▒▒▒")
console.log("▓  ▓▓▓▓▓▓▓▓  ▓▓▓▓  ▓▓  ▓  ▓  ▓▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓  ▓▓  ▓▓▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓▓      ▓▓")
console.log("█  ████  ██  ████  ██  ██    █████  █████        ██  ████  █████  ███████████  █")
console.log("██      ████      ███  ███   █████  █████  ████  ███      ██████  ██████      ██")
console.log("                                                                                ")
log('Starting...');

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
import {githubHook} from './modules/github-hook.js';
githubHook(app);

// Apply Notifier
import {notifier} from './modules/notifier.js';
notifier(app);

// Apply Updater
import {updater} from './modules/updater.js';
await updater(app, io);

//
// Socket.IO
//

// Écouter les connexions Socket.IO
io.on("connection", (socket) => {

  // Gérer la déconnexion
  socket.on("disconnect", () => {
  });
});

// Ping
setInterval(() => {
  io.emit('ping');
}, 2000);

//
// Routes
//

// www static files
app.use(express.static(path.join(__dirname, 'www')));

// App web launcher
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'www/weblauncher/weblauncher.html'));
})

// Notification sender
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'www/admin/index.html'));
});

// Static appdata
app.use('/appdata', express.static(path.join(__dirname, 'appdata')));

// Static media
app.use('/media', express.static(path.join(__dirname, 'media')));

// Démarrer le serveur
server.listen(PORT, () => {
  log(`started on port ${PORT}`);
});