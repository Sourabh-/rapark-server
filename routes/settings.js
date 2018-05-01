const express = require('express');
const router = express.Router();
const fs = require('fs'); 
const messages = JSON.parse(fs.readFileSync('./utility/messages.json'));
let config = JSON.parse(fs.readFileSync("./config.json"));

let bus = require('../utility/event');

//Generate OTP, save to DB & send SMS
router.post("/v1/create", (req, res) => {
	let settings = config.settings;
	for(let key in req.body) {
		settings[key] = req.body[key];
	}

	fs.writeFile('config.json', JSON.stringify(config), (err) => {
		if(err) {
			console.log(err);
			res.status(500).json({
				message: messages.ise
			})
		} else {
			res.status(204).json();

			//Publish updates
			bus.emit('configChange');
		}
	})
});

router.get("/v1/get", (req, res) => {
	res.status(200).json(config.settings);
})

module.exports = router;