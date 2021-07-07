const express = require("express");
const app = express();
const winston = require("winston");

const config = require("config");
const cport = config.get("port");
const port = process.env.PORT || cport || 2087;

require("./startup/logging")();
require("./startup/routes")(app);
require("./startup/db")();

app.get("/", (req, res) => {
  res.send({ message: "Weclome to Node REST API" });
});

const server = app.listen(port, () => {
  winston.info(`Listening on port ${port}...`);
});

module.exports = server;
