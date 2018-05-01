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

let bus = require('../utility/event');

bus.on("configChange", function () {
    config = JSON.parse(fs.readFileSync("./config.json"));
});

let saveToDB = (db, objectId, hours, amount) => {
	db.collection('parking').updateOne({ _id: objectId }, { $set: { hours, paid: amount, isExited: true } }, {})
	.then((reslt) => {})
	.catch((err) => {
		console.log(err);
	})
}

//Generate OTP, save to DB & send SMS
router.post("/v1/create", (req, res) => {
    if (!req.body.phoneNumber) {
        res.status(400).json({
            message: messages.PHONE_NUMBER_REQUIRED
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
                smsClient.messages.create(
                    '8892371403',
                    '+91' + vehicle.phoneNumber,
                    `Your OTP for entry in Phoenix Mall is ${otp}`
                ).then((message_created) => {
                    console.log(message_created);
                    req.app.db.collection("parking").updateOne({ _id: vehicle._id }, { $set: { otp } }, {
				      returnOriginal: false
				    }).then((reslt) => {
				      
				    }).catch(function(err) {
				      console.log(err);
				    })
                })
                .catch((err) => {
                	console.log(err);
                });
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
				let charges = config.settings;
				let hours = Math.ceil((new Date().getTime() - reslt.createdTime) / (1000 * 60 * 60));
				if(charges.customCharges && charges.customCharges.hours && hours >= charges.customCharges.hours) {
					res.status(200).json({
						phoneNumber: reslt.phoneNumber,
						amount: charges.customCharges.amount
					});

					saveToDB(req.app.db, reslt._id, hours, charges.customCharges.amount);
				} else if(hours <= 1) {
					res.status(200).json({
						phoneNumber: reslt.phoneNumber,
						amount: charges.firstHour
					});

					saveToDB(req.app.db, reslt._id, hours, charges.firstHour);
				} else {
					let amt = charges.firstHour;
					for(let i=2; i <= hours; i++) amt += charges.additionalHour;

					res.status(200).json({
						phoneNumber: reslt.phoneNumber,
						amount: amt
					});

					saveToDB(req.app.db, reslt._id, hours, amt);
				}
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