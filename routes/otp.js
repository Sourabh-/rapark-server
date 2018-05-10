const express = require('express');
const router = express.Router();
const fs = require('fs');
const randomstring = require("randomstring");

const messages = JSON.parse(fs.readFileSync('./utility/messages.json'));
let config = JSON.parse(fs.readFileSync("./config.json"));
const utility = require('../utility/utility');
const ObjectID = require('mongodb').ObjectID;

let plivo = require('plivo');
let smsClient = new plivo.Client(config.plivo.plivoAuthId, config.plivo.plivoAuthToken);

let saveToDB = (db, objectId, hours, amount) => {
	db.collection('parking').updateOne({ _id: objectId }, { $set: { hours, paid: amount, isExited: true } }, {})
	.then((reslt) => {})
	.catch((err) => {
		console.log(err);
	})
}

let sendSMS = (srcNo, destNo, msg, cb) => {
	smsClient.messages.create(
        srcNo,
        config.phone.countryCode + destNo,
        msg
    ).then((message_created) => {
        console.log(message_created);
        if(cb) cb();
    })
    .catch((err) => {
    	console.log(err);
    });
}

let charges = {};

let getCharges = (db, type, cb) => {
    if(charges)
        cb(charges);
    else {
        db.collection('settings').findOne({ type }, {})
        .then((reslt) => {
            if(reslt) { 
                charges = reslt;
                cb(reslt); 
            } else {
                cb({});
            }
        })
        .catch((err) => {
            cb(err);
        })
    }
}

//Generate OTP, save to DB & send SMS
router.post("/v1/create", (req, res) => {
    if (!req.body.phoneNumber) {
        res.status(400).json({
            message: messages.PHONE_NUMBER_REQUIRED
        });

    } else if(!req.body.type) {
    	res.status(400).json({
    		message: messages.TYPE_REQUIRED
    	});

    } else if(['CAR', 'BIKE'].indexOf(req.body.type) == -1) {
    	res.status(400).json({
    		message: messages.INVALID_TYPE
    	});

    } else if (!Number(req.body.phoneNumber)) {
        res.status(400).json({
            message: messages.INVALID_PHONE_NUMBER
        });

    } else if ((Number(req.body.phoneNumber) + '').length != config.otp.phoneNumberLength) {
        res.status(400).json({
            message: utility.replaceStr(messages.MIN_PHONE_NUMBER_LENGTH, config.otp.phoneNumberLength)
        });

    } else {
        let vehicle = {
            _id: new ObjectID(),
            phoneNumber: Number(req.body.phoneNumber),
            regNo: req.body.regNo || "",
            createdTime: new Date().getTime(),
            type: req.body.type,
            otp: "",
            isExited: false,
            paid: "",
            hours: ""
        };

        req.app.db.collection("parking").insertOne(vehicle)
            .then((reslt) => {
                res.status(204).json();
                let otp = randomstring.generate({
                    length: config.otp.otpLength,
                    charset: 'numeric'
                }) + '';

                //SEND SMS HERE
                sendSMS('8892371403', vehicle.phoneNumber, `Your OTP for entry in ${config.place.name} is ${otp}. Please use this at the time of exit - RaPark`, () => {
                	req.app.db.collection("parking").updateOne({ _id: vehicle._id }, { $set: { otp } }, {
				      returnOriginal: false
				    }).then((reslt) => {
				      
				    }).catch(function(err) {
				      console.log(err);
				    })
                })
            })
            .catch((err) => {
                console.log(err);
                res.status(500).json({
                    message: messages.ISE
                })
            })
    }
});

//Get payment and other details based on OTP & also send SMS
router.get("/v1/payment/:otp", (req, res) => {
	let otp = Number(req.params.otp);

	if(!otp) {
		res.status(400).json({
			message: messages.INVALID_OTP
		})
	} else {
		//Find entry with this otp and isExited = false, mark isExited = true, calculate paid and hours and update record
		req.app.db.collection('parking').findOne({ otp: req.params.otp, isExited: false }, {})
		.then((reslt) => {
			if(reslt) {
                getCharges(req.app.db, reslt.type, (charges) => {
                    let hours = Math.ceil((new Date().getTime() - reslt.createdTime) / (1000 * 60 * 60));
                    if(charges.customCharges && charges.customCharges.hours && hours >= charges.customCharges.hours) {
                        res.status(200).json({
                            phoneNumber: reslt.phoneNumber,
                            amount: charges.customCharges.amount
                        });

                        sendSMS('8892371403', reslt.phoneNumber, `Thank you for parking your vehicle in ${config.place.name}. Amount payable is ${config.currency.symbol}${charges.customCharges.amount} - RaPark`);
                        saveToDB(req.app.db, reslt._id, hours, charges.customCharges.amount);
                    } else if(hours <= 2) {
                        res.status(200).json({
                            phoneNumber: reslt.phoneNumber,
                            amount: charges.first2Hours
                        });

                        sendSMS('8892371403', reslt.phoneNumber, `Thank you for parking your vehicle in ${config.place.name}. Amount payable is ${config.currency.symbol}${charges.firstHour} - RaPark`);
                        saveToDB(req.app.db, reslt._id, hours, charges.first2Hours);
                    } else {
                        let amt = charges.first2Hours;
                        for(let i=3; i <= hours; i++) amt += charges.additionalHour;

                        res.status(200).json({
                            phoneNumber: reslt.phoneNumber,
                            amount: amt
                        });

                        sendSMS('8892371403', reslt.phoneNumber, `Thank you for parking your vehicle in ${config.place.name}. Amount payable is ${config.currency.symbol}${amt} - RaPark`);
                        saveToDB(req.app.db, reslt._id, hours, amt);
                    }
                })

			} else {
				res.status(404).json({
					message: messages.OTP_NOT_FOUND
				})
			}
		})
		.catch((err) => {
			console.log(err);
            res.status(500).json({
                message: messages.ISE
            })
		})
	}
});

module.exports = router;