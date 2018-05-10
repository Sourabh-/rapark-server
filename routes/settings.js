const express = require('express');
const router = express.Router();
const fs = require('fs'); 
const messages = JSON.parse(fs.readFileSync('./utility/messages.json'));
let config = JSON.parse(fs.readFileSync("./config.json"));

//Generate OTP, save to DB & send SMS
router.post("/v1/create/:type", (req, res) => {
	if(['CAR', 'BIKE'].indexOf(req.params.type) == -1) {
		res.status(400).json({
			message: message.INVALID_TYPE
		})
	} else {
		let json = req.body;
		json.type = req.params.type;
		req.app.db.collection('settings').updateOne({ type: req.params.type }, { $set: json }, {
			upsert: true
		})
		.then((reslt) => {
			res.status(204).json();
		})
		.catch((err) => {
			console.log(err);
			res.status(500).json({
				message: messages.ise
			});
		})
	}
});

router.get("/v1/get/:type", (req, res) => {
	req.app.db.collection('settings').findOne({ type: req.params.type }, {
		projection: { _id: 0 }
	})
	.then((reslt) => {
		if(reslt) res.status(200).json(reslt);
		else res.status(204).json();
	})
	.catch((err) => {
		console.log(err);
		res.status(500).json({
			message: messages.ise
		})
	})

})

module.exports = router;