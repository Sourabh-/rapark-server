const express = require('express');
const router = express.Router();
const messages = JSON.parse(fs.readFileSync('./utility/messages.json'));

//Generate OTP, save to DB & send SMS
router.post("/v1/create", (req, res) => {

});

router.post("v1/get", (req, res) => {
	
})

module.exports = router;