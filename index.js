const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const http = require('http');
const fs = require('fs');
const bAuth = require('node-basic-auth');
const MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = '5F7CFA71E8EF412693858818E748B16D';

const config = JSON.parse(fs.readFileSync("./config.json"));
const appMongo = require('./utility/mongo');
const decrypt = require('./utility/utility').decrypt;
const messages = JSON.parse(fs.readFileSync('./utility/messages.json'));

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

getConnection = (req, res, next) => {
	if(req.cookies.sessionId) {
		let db = appMongo.getDb(crypto, algorithm, password, req.cookies.sessionId);
		if(!db) return res.status(401).json({ message: messages.INVALID_SESSION_ID });
		else {
			req.db = db;
			next();
		}
	}

	let cred = bAuth(req);
	if(!cred.pass)
		res.status(400).json({ message: messages.NO_AUTH_TOKEN });
	else {
		let decrypted = decrypt(crypto, algorithm, password, cred.pass).split("-");
		if(decrypted.length != 2)
			return res.status(400).json({ message: messages.NO_AUTH_TOKEN });
		else {
			appMongo.connect(decrypted[0], decrypted[0], decrypted[1], (err, db) => {
				if(err) {
					res.status(500).json({
						message: messages.ise
					})
				} else {
					req.db = db;
					res.cookie('sessionId', appMongo.encrypt(crypto, algorithm, password, decrypted[0]), { httpOnly: true });
					next();
				}
			})
		}
	}
};

// Set our api routes
app.use('/rapark/otp', getConnection, otp);
app.use('/rapark/settings', getConnection, settings);

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