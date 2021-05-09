const Joi = require("joi");
const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const express = require("express");
const router = express.Router();

//------------------Login-----------------
router.post("/", async (req, res) => {
  const { error } = validate(req.body); //result.error
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  let user = await User.findOne({ phone: req.body.phone });
  if (!user) return res.status(400).send("Invalid phone. or password");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(400).send("Invalid emali or password .");

  const token = user.generateAuthToken();
  res.send({ token });
});

function validate(req) {
  const schema = Joi.object({
    phone: Joi.string()
      .length(11)
      .regex(/^01[3-9][ ]?[0-9]{2}[ ]?[0-9]{3}[ ]?[0-9]{3}$/)
      .required(),
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(req);
}

module.exports = router;
