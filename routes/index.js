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
                return { "success": true, "ID": webhook._id };
            }
            catch (error) {
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
            }
            catch (error) {
                return { "success": false, "error": error.message };
            }
        }
    }
});

broker.start();




// Root Route
router.get('/', function (req, res, next) {
    res.send("WebHook Microservice Running .............");
});




// Resgister Route
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

    let broker_res = await broker.call("webhooks.register", { "targetURL": targetURL })
    res.send(broker_res);

});



// Update Route
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

    const broker_res = await broker.call("webhooks.update", updateURLData)
    res.send(broker_res);

});




module.exports = router;
