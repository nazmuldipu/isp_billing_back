const express = require("express");
const app = express();
const winston = require("winston");

const config = require("config");
const cport = config.get("port");
const port = process.env.PORT || cport || 2087;

const fs = require('fs');
const https = require('https');
const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

require("./startup/logging")();
require("./startup/routes")(app);
require("./startup/db")();

app.get("/", (req, res) => {
    res.send({ message: "Weclome to ISP Billing REST API" });
});

var server = https.createServer(options, app);
server.listen(port, () => {
    winston.info(`Listening on port ${port}...`);
});

module.exports = server;
