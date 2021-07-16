const mongoose = require("mongoose");

var webhookSchema = new mongoose.Schema({

    targetURL: {
        type: String,
        required: true
    }

});

const Webhook = mongoose.model(webhookSchema);
module.exports = WebHook;