const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const config = JSON.parse(fs.readFileSync("./config.json"));
let dbConnections = {};

module.exports = {
	connect : (dbName, user, pass, cb) => {
		//If previously connected, return db object
		if(dbConnections[dbName]) cb(null, dbConnections[dbName]);
		else {
			//Connect with given user & pass(if any)
			MongoClient.connect(`mongodb://${user && pass ? (user + ':' + pass + '@') : ''}${config.mongo.url}`, function(err, client) {
			  if(err) {
			  	console.log("Error connecting to database: " + dbName);
			  	console.log(err);
			  	cb(err);
			  }

			  cb(null, client.db(dbName));
			  dbConnections[dbName] = client.db(dbName);
			})
		}
	},

	getDb : (crypto, algorithm, password, sessionId) => {
		var decipher = crypto.createDecipher(algorithm, password)
		var dec = decipher.update(sessionId,'hex','utf8')
		dec += decipher.final('utf8');
		if(dbConnections[dec])
			return dbConnections[dec];
		else return '';
	}
}