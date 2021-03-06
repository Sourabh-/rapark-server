const MongoClient = require('mongodb').MongoClient;
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let carSettings = {
    first2Hours: 30,
    additionalHour: 15,
    customCharges: {
        hours: 12,
        amount: 150
    },
    type: 'CAR'
};

let bikeSettings = {
    first2Hours: 20,
    additionalHour: 10,
    customCharges: {
        hours: 12,
        amount: 100
    },
    type: 'BIKE'
};

let mongoHost = '127.0.0.1';
let mongoPort = '27017';

rl.question('Enter Mongo Host: ', (host) => {
    mongoHost = host || mongoHost;
    rl.question('Enter Mongo Port: ', (port) => {
        mongoPort = port || mongoPort;
        rl.question('Enter Mongo user, if any (Press enter if not needed): ', (muser) => {
        	muser = muser || '';
            rl.question('Enter Mongo password, if any (Press enter if not needed): ', (mpwd) => {
            	mpwd = mpwd || '';
                rl.question('Enter Mongo database name (Default to `database`): ', (mdb) => {
                    let mUrl = 'mongodb://' + (muser && mpwd ? (muser + ':' + mpwd + '@') : '') + mongoHost + ':' + mongoPort;

                    console.log("Connecting to database...");
                    MongoClient.connect(mUrl, function(err, client) {
                        if (!err) {
                            let db = client.db(mdb || 'database');
                            db.collection('settings').find({}, {}).toArray()
                                .then((reslt) => {
                                    if (!reslt.length) {
                                        console.log("Adding settings");
                                        db.collection('settings').insert([carSettings, bikeSettings], {})
                                            .then((reslt) => {
                                                console.log("Settings inserted.");
                                                console.log("Exiting...");
                                                process.exit();
                                            })
                                            .catch((err) => {
                                                console.log(err);
                                                console.log("ERROR OCCURRED! ABORTING!!!!!");
                                                rl.close();
                                                process.exit();
                                            })
                                    } else {
                                        console.log("Settings already exists.");
                                        process.exit();
                                    }
                                })
                                .catch((err) => {

                                })
                        } else {
                            console.log(err);
                            console.log("ERROR OCCURRED! ABORTING!!!!!");
                            rl.close();
                            process.exit();
                        }
                    })
                })
            })
        })
    })
})