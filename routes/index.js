const express = require('express');
const router = express.Router();
const Webhook = require('../models/Webhook')
const Joi = require("joi")
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

    let broker_res = await broker.call("webhooks.register", { "targetURL": targetURL });
    res.json(broker_res);

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

    const broker_res = await broker.call("webhooks.update", updateURLData);
    res.json(broker_res);

});




// List TargetURLs Route
router.get('/list', async function (req, res, next) {

    const broker_res = await broker.call("webhooks.list");
    res.json(broker_res);

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

    const broker_res = await broker.call("webhooks.delete", targetURL_ID);
    res.json(broker_res);

});




module.exports = router;
