const Webhook = require('../models/Webhook')
const _ = require('lodash');
const axios = require("axios");

module.exports = {
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
            let targetURLData = await Webhook.find().select({ "_id": 0, "targetURL": 1 });
            let targetURLs = targetURLData.map(x => x.targetURL);
            const triggerLogs = []

            let parallelRequests = 10
            let targetURLBatches = _.chunk(targetURLs, parallelRequests);

            for (batch in targetURLBatches) {
                currentBatch = targetURLBatches[batch];

                var promisesArray = [];
                for (url in currentBatch) {
                    const targetURL = currentBatch[url];
                    promisesArray.push(this.sendHttpPost(targetURL, ipAddress));
                }
                const httpPostResponses = await Promise.all(promisesArray)
                console.log(httpPostResponses);

                // Logging response data
                for (let idx = 0; idx < currentBatch.length; idx++) {
                    triggerLogs.push({ "targetURL": currentBatch[idx], "Response": httpPostResponses[idx] })
                }
            }
            console.log(triggerLogs);
            return triggerLogs;
        }
    },


    // 
    methods: {

        // Method to send HTTP POST Request
        // Params : String ipAddress

        sendHttpPost(targetURL, ipAddress) {
            return new Promise((resolve, reject) => {
                axios({
                    method: 'post',
                    url: targetURL,
                    data: { "ipAddress": ipAddress, "timestamp": Date.now() },
                    timeout: 2000
                }).then(response => {
                    resolve(response.status)
                }).catch(function (error) {
                    if (error.response) {
                        resolve(error.response.status);
                    }
                    resolve(408);
                })
            });
        }

    }
};