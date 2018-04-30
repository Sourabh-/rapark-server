const express = require('express');
const router = express.Router();
const messages = JSON.parse(fs.readFileSync('./utility/messages.json'));
const randomstring = require("randomstring");

//Generate OTP, save to DB & send SMS
router.post("/v1/create", (req, res) => {

});

//Get payment and other details based on OTP & also send SMS
router.get("/v1/payment/:otp", (req, res) => {

});

module.exports = router;

