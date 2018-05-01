const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const http = require('http');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

const config = JSON.parse(fs.readFileSync("./config.json"));

const otp = require('./routes/otp');
const settings = require('./routes/settings');

// Parsers for POST data
app.use(bodyParser.json());
//Parse cookie
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }));

//ONLY IF CROSS ORIGIN REQUEST IS ALLOWED
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Set our api routes
app.use('/rapark/otp', otp);
app.use('/rapark/settings', settings);

//Connect to mongoDB
MongoClient.connect(config.mongo.url, function(err, client) {
  if(err) {
  	console.log(err);
  	return process.exit(1);
  }

  app.db = client.db(config.mongo.dbName);
})

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || config.server.port || '4000';
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`App running on 127.0.0.1:${port}`));