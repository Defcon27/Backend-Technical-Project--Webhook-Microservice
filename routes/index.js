const express = require('express');
const router = express.Router();
const Webhook = require('../models/Webhook')
const Joi = require("joi")
const axios = require("axios");
const { ServiceBroker } = require("moleculer");


// Defining Molecular Services
const broker = new ServiceBroker();

broker.createService({
    name: "webhooks",

    actions: {

        // register action
        async register(ctx) {
            try {
                const webhook = new Webhook(ctx.params);
                await webhook.save();
                return { "success": true, "targetURL_ID": webhook._id };
            } catch (error) {
                return { "success": false, "error": error.message };
            }
        },


        // update action
        async update(ctx) {
            try {
                const id = ctx.params.id;
                let urlUpdate = { "targetURL": ctx.params.newTargetURL };
                let updateResult = await Webhook.findOneAndUpdate({ "_id": id }, urlUpdate);
                if (updateResult) {
                    return { "success": true };
                }
                return { "success": false, "error": "id not found" }
            } catch (error) {
                return { "success": false, "error": error.message };
            }
        },


        // list action
        async list(ctx) {
            try {
                let webhooksData = await Webhook.find().select({ "targetURL": 1 });
                if (webhooksData.length > 0) {
                    return webhooksData;
                }
                return "No targetURLs found";
            } catch (error) {
                return { "error": error.message };
            }
        },


        // delete action
        async delete(ctx) {
            try {
                const targetURL_ID = ctx.params.targetURL_ID;
                let deleteResult = await Webhook.findOneAndDelete({ targetURL_ID });
                if (deleteResult) {
                    return { "success": true };
                }
                return { "success": false, "error": "id not found" }
            } catch (error) {

            }

        },


        // trigger action
        async trigger(ctx) {

            let ipAddress = ctx.params.ipAddress;
            let targetURLs = await Webhook.find().select({ "_id": 0, "targetURL": 1 });
            const triggerLogs = []

            for (url in targetURLs) {
                const { targetURL } = targetURLs[url];

                let httpPostResponse = await this.actions.sendHttpPost({ "ipAddress": ipAddress, "url": targetURL }, {
                    timeout: 2000,
                    retries: 3,
                    fallbackResponse(ctx, err) {
                        return 408;
                    }
                });

                triggerLogs.push({ "targetURL": targetURL, "Response": httpPostResponse })
                //console.log(targetURL + " " + httpPostResponse);
            }
            return triggerLogs;
        },



        // HTTP POST Request action
        async sendHttpPost(ctx) {

            try {
                console.log("Triggering  " + ctx.params.url)
                let HttpPostResponse = await axios({
                    method: "POST",
                    url: ctx.params.url,
                    data: {
                        "ipAddress": ctx.params.ipAddress,
                        "timestamp": Date.now()
                    }
                });
                return HttpPostResponse.status
            } catch (error) {
                return error.response.status;
            }

        }
    }
});

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

    const targetURL_ID = req.body.id;

    // validating data
    const schema = Joi.object({
        id: Joi.string().max(1000).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.json({ "success": false, "error": error.details[0].message });
    }

    const brokerResponse = await broker.call("webhooks.delete", targetURL_ID);
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
