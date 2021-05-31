const express = require("express");
const accesscontrol = require('../middleware/accesscontrol');
const userRoutes = require("../routes/users");
const error = require("../middleware/error");
const authRoutes = require("../routes/auth");
const companyRoutes = require('../routes/companies');
const groupRoutes = require('../routes/groups');

module.exports = function (app) {
  app.use(accesscontrol);
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/companies", companyRoutes);
  app.use("/api/groups", groupRoutes);
  app.use(error);
};
