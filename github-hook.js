// Load environment variables from .env file
// const dotenv = require('dotenv');
import dotenv from 'dotenv';
dotenv.config();

const GITHOOK_SECRET = process.env.GITHOOK_SECRET || 'secret'

function log(msg) {
  console.log(`[\x1b[32mWebhook\x1b[0m]\t${msg}`);
}


// import GithubWebHook from 'express-github-webhook';
// const GithubWebHook = require('express-github-webhook');
// const bodyParser = require('body-parser');
import GithubWebHook from 'express-github-webhook';
import bodyParser from 'body-parser';
var webhookHandler = GithubWebHook({ path: '/webhook', secret: GITHOOK_SECRET });

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

function githubHook(app) {

    // Middlewares
    app.use(bodyParser.json());
    app.use(webhookHandler);

    log('ready.\n----------------------');
}

export {githubHook};