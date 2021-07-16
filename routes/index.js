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
                return { "success": false, "error": error };
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
router.get('/register', async function (req, res, next) {

    let targetURL = req.query.targetURL
    console.log(targetURL);

    // validating query params
    const schema = Joi.object({
        targetURL: Joi.string().max(10000).required(),
    });
    const { error } = schema.validate(req.query);
    if (error) {
        return res.json({ "success": false, "error": error.details[0].message });
    }

    const broker_res = await broker.call("webhooks.register", { "targetURL": targetURL })
    res.send(broker_res);

});




module.exports = router;
