const express = require('express');
const router = express.Router();
const Joi = require("joi")
const { ServiceBroker } = require("moleculer");
const webhookService = require('../services/webhook.service');


// Defining Molecular Services
const broker = new ServiceBroker();

broker.createService(webhookService);

broker.start();




// Root Route
router.get('/', function (req, res, next) {
    res.send("WebHook Microservice Running .............");
});




/**
* Register TargetURL Route - POST Request that calls
the actions.register to register a new targetURL

* @param    {String} targetURL  newtargetURL to replace old one
* @return   {json}              success or error message with unique targetURL ID
*/
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



/**
* Update TargetURL Route - PUT Request that calls
the actions.update to update the targetURLs

* @param    {String} id            ID of targetURL to be updated
* @param    {String} newTargetURL  newtargetURL to replace old one
* @return   {json}                 success or error message
*/
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


/**
* List TargetURLs Route - GET Request that calls
the actions.list retrive the targetURLs

* @return   {array}   Array of webhook data 
*/
router.get('/list', async function (req, res, next) {

    const brokerResponse = await broker.call("webhooks.list");
    res.json(brokerResponse);

});



/**
* Delete TargetURL Route - DEL Request that calls
the actions.delete to delete existing targetURL

* @param    {String} id  ID of targetURL to be delted
* @return   {json}       success or error message
*/
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






/**
* IP Route - GET Request that calls the actions.trigger
* to send post requests to target URLs

* @param    {String} ipAddress  IP Address 
* @return   {Array}             Array of Target Responses
*/
router.get('/ip', async function (req, res, next) {

    const ipAddressData = req.query;

    // validating data
    const schema = Joi.object({
        ipAddress: Joi.string().max(1000).required()
    });
    const { error } = schema.validate(ipAddressData);
    if (error) {
        return res.json({ "success": false, "error": error.details[0].message });
    }

    const brokerResponse = await broker.call("webhooks.trigger", ipAddressData);
    res.send(brokerResponse);
});




module.exports = router;
