const fs = require("fs");
const path = require("path");
const configPath = __dirname + "/bot-config.json";

let DefaultAuthConfig = {
    Token: "",
    Owner: "",
    CommandFolder: path.resolve(__dirname + "/../../commands"),
    TrackerChannelID: ""
}

if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(DefaultAuthConfig, null, 4));
} else {
    let existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    DefaultAuthConfig = Object.assign(DefaultAuthConfig, existingConfig);
}

module.exports = DefaultAuthConfig;
