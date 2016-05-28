// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
const express    = require('express');        // call express
const cfenv = require('cfenv');
const app        = express();                 // define our app using express
const bodyParser = require('body-parser');
const routes = require('./routes');
const features = require('./features');


const appEnv = cfenv.getAppEnv();
const router = routes(express.Router);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

features.init(app);

app.use('/api', router);

app.listen(appEnv.port, '0.0.0.0', () => {
  console.log("server starting on " + appEnv.url);
});
