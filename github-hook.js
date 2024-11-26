// Load environment variables from .env file
const dotenv = require('dotenv');
dotenv.config();

const GITHOOK_SECRET = process.env.GITHOOK_SECRET || 'secret'


// import GithubWebHook from 'express-github-webhook';
const GithubWebHook = require('express-github-webhook');
const bodyParser = require('body-parser');
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

function prepareApp(app) {
    // Middlewares
    app.use(bodyParser.json());
    app.use(webhookHandler);

    console.log('Github Webhook is ready');
}

module.exports = prepareApp;
