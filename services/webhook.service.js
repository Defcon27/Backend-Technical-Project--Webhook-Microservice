const Webhook = require('../models/Webhook')
const _ = require('lodash');
const axios = require("axios");

module.exports = {
    name: "webhooks",

    actions: {

        /**
        * Register Action - Creates Webhook object and 
        * saves to the database
        * 
        * @param    {String} targetURL  newtargetURL to replace old one
        * @return   {json}                 success or error message
        */
        async register(ctx) {
            try {
                const webhook = new Webhook(ctx.params);
                await webhook.save();
                return { "success": true, "targetURL_ID": webhook._id };
            } catch (error) {
                return { "success": false, "error": error.message };
            }
        },


        /**
        * Update Action - Retrives existing targetURL with 
        * given ID and updates with newTargetURL in database
        * 
        * @param    {String} id            ID of targetURL to be updated
        * @param    {String} newTargetURL  newtargetURL to replace old one
        * @return   {json}                 success or error message
        */
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


        /**
        * List Action - Retrives all the webhook data from the database
        * 
        * @return   {Array} Array of webhook data 
        */
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



        /**
        * Delete Action - Retrives existing targetURL with 
        * given ID and deletes it from database
        * 
        * @param    {String} id            ID of targetURL to be updated
        * @return   {json}                 success or error message
        */
        async delete(ctx) {
            try {
                const targetURL_ID = ctx.params.id;
                console.log(targetURL_ID);
                let deleteResult = await Webhook.findOneAndDelete({ "_id": targetURL_ID });
                console.log(deleteResult);
                if (deleteResult) {
                    return { "success": true };
                }
                return { "success": false, "error": "id not found" }
            } catch (error) {
                return { "error": error.message };
            }

        },



        /**
        * Trigger Action - Retrives all the existing targetURLs 
        * from database and send POST request with IP address
        * and UNIX timestamp
        * 
        * Sends requests to batchwise with 10 targetURLs in parallel
        * modify parallelRequests to change default batch size
        * 
        * Incase of non 200 response , retries for 5 times
        * modify maxRetries to change default retries
        * 
        * @param    {String} ipAddess      ID of targetURL to be updated
        * @return   {Array}                 Array of Target Responses with status
        */
        async trigger(ctx) {

            let ipAddress = ctx.params.ipAddress;
            let targetURLData = await Webhook.find().select({ "_id": 0, "targetURL": 1 });
            let targetURLs = targetURLData.map(x => x.targetURL);
            const triggerLogs = []

            // Batch parallel processing with max parallel requests upto 10
            let parallelRequests = 10
            let targetURLBatches = _.chunk(targetURLs, parallelRequests);
            for (batch in targetURLBatches) {

                // Triggering targetURLs in each batch                
                currentBatch = targetURLBatches[batch];

                var promisesArray = [];
                for (url in currentBatch) {
                    const targetURL = currentBatch[url];
                    promisesArray.push(this.sendHttpPost(targetURL, ipAddress));
                }
                const httpPostResponses = await Promise.all(promisesArray)
                console.log(httpPostResponses);

                // Retrying failed requests upto maxRetries
                let maxRetries = 5;
                for (let idx = 0; idx < currentBatch.length; idx++) {
                    if (httpPostResponses[idx] != 200) {
                        let retries = maxRetries;
                        while ((retries > 0) && (httpPostResponses[idx] != 200)) {
                            httpPostResponses[idx] = await this.retryHttpPost(currentBatch[idx], ipAddress);
                            retries--;
                        }

                    }
                }

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

        /**
        * Method to send HTTP Post request 
        * 
        * @param    {String}    targetURL     targetURL to sent request
        * @param    {ipAddress} IPAddress     ipAddress to be sent in postrequest
        * @return   {promise}                 promise that is fullfilled in paraller later
        */

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
        },


        /**
       * Method to send Async HTTP Post request 
       * 
       * @param    {String}    targetURL     targetURL to sent request
       * @param    {ipAddress} IPAddress     ipAddress to be sent in postrequest
       * @return   {json}                    json data with status code
       */
        async retryHttpPost(targetURL, ipAddress) {
            try {
                console.log("Retrying .... " + targetURL);
                let HttpPostResponse = await axios({
                    method: "POST",
                    url: targetURL,
                    data: { "ipAddress": ipAddress, "timestamp": Date.now(), },
                    timeout: 2000
                });
                return HttpPostResponse.status

            } catch (error) {
                if (error.response) {
                    return error.response.status;
                }
                return 408;
            }
        }
    }
};