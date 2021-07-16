const Webhook = require('../models/Webhook')
const axios = require("axios");

module.exports = {
    name: "webhooks",

    actions: {

        sendHttpPost: {
            bulkhead: {
                enabled: true,
                concurrency: 10,
            }
        },

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
                    retries: 5,
                    fallbackResponse(ctx, err) { return 408 }
                });

                triggerLogs.push({ "targetURL": targetURL, "Response": httpPostResponse })
                console.log(targetURL + " " + httpPostResponse);
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
};