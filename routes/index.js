const express = require('express');
const router = express.Router();
const Webhook = require('../models/Webhook')
const Joi = require("joi")


// Root Route
router.get('/', function (req, res, next) {
    res.send("WebHook Microservice Running .............");
});


module.exports = router;
