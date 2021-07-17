const express = require('express');
const router = express.Router();
const Joi = require("joi")
const { ServiceBroker } = require("moleculer");
const webhookService = require('../services/webhook.service');


// Defining Molecular Services
const broker = new ServiceBroker({
    retryPolicy: {
        enabled: true
    }
});

broker.createService(webhookService);

broker.start();




// Root Route
router.get('/', function (req, res, next) {
    res.send("WebHook Microservice Running .............");
});




// Register TargetURL Route
router.post('/register', async function (req, res, next) {

    const targetURL = req.body.targetURL

    // validating data
    const schema = Joi.object({
        targetURL: Joi.string().max(10000).required()
    });
    let { error } = schema.validate(req.body);
    if (error) {
        return res.json({ "success": false, "error": error.details[0].message });
    }

    let brokerResponse = await broker.call("webhooks.register", { "targetURL": targetURL });
    res.json(brokerResponse);

});



// Update TargetURL Route
router.put('/update', async function (req, res, next) {

    const updateURLData = req.body

    // validating update data
    const schema = Joi.object({
        id: Joi.string().max(1000).required(),
        newTargetURL: Joi.string().max(10000).required()
    });
    const { error } = schema.validate(updateURLData);
    if (error) {
        return res.json({ "success": false, "error": error.details[0].message });
    }

    const brokerResponse = await broker.call("webhooks.update", updateURLData);
    res.json(brokerResponse);

});




// List TargetURLs Route
router.get('/list', async function (req, res, next) {

    const brokerResponse = await broker.call("webhooks.list");
    res.json(brokerResponse);

});



// Delete TargetURL Route
router.delete('/delete', async function (req, res, next) {

    const targetURLData = req.body;

    // validating data
    const schema = Joi.object({
        id: Joi.string().max(1000).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.json({ "success": false, "error": error.details[0].message });
    }

    const brokerResponse = await broker.call("webhooks.delete", targetURLData);
    res.json(brokerResponse);

});





//------------------------Webhooks 
// IP route
router.get('/ip', async function (req, res, next) {

    const ipAddressData = req.query;
    const brokerResponse = await broker.call("webhooks.trigger", ipAddressData);
    res.send(brokerResponse);
});




module.exports = router;
